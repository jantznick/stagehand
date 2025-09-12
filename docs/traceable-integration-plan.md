# Traceable Security Integration Implementation Plan

## 1. Overview

The goal of this initiative is to integrate Traceable's API Security platform as a source for security findings within Stagehand. This will allow users to connect their Traceable account, link their API services to projects in Stagehand, and automatically ingest API security vulnerabilities.

This plan builds upon our existing infrastructure for security tool integrations, particularly modeling patterns from the Snyk integration and leveraging the vulnerability enrichment capabilities developed for manual finding creation.

**Reference Documents:**
*   [Snyk Integration Plan](./snyk-integration-plan.md)
*   [Manual Finding Creation Feature](./manual-finding-creation-feature.md)
*   [Traceable API Documentation](https://docs.traceable.ai/docs/public-apis)

## 2. Core Decisions & Rationale

Several key decisions have been made to ensure the integration is consistent, secure, and robust.

*   **Authentication Method**: The integration will use an **API Token** provided by the user. Unlike the GitHub integration which uses OAuth2, a static token is more suitable for the server-to-server, background data synchronization required for fetching findings. The token will be encrypted and stored securely in our database.

*   **Data Linking**: **Traceable Services** will be mapped to **Stagehand Projects**. This is the most logical link, as Traceable organizes its findings by service/API endpoint, which corresponds directly to the applications and services cataloged in Stagehand. The link will be stored in the `toolSpecificIds` JSON field on the `Project` model.

*   **Data Synchronization**: The process of pulling data from Traceable will be an **asynchronous background job**. This is initiated via an API call, but the server responds immediately with a `202 Accepted` status, preventing client-side timeouts and improving user experience. This follows the same pattern as our Snyk sync process.

*   **Vulnerability Enrichment**: This is a critical component of the integration. To ensure data quality and consistency, we will leverage our existing vulnerability enrichment service (`packages/api/src/utils/vulnerabilityLookup.js`).
    *   If a finding from Traceable includes a **CVE identifier**, we will use that ID to fetch detailed, standardized information from public databases (like NVD).
    *   If no CVE is present, we will fall back to using the metadata provided directly by the Traceable API.
    This ensures our `Vulnerability` table contains the richest possible data, regardless of the source.

## 3. Implementation Plan

### Phase 1: Backend - Setup & Linking

#### Task 1.1: Create Traceable API Service
A dedicated service will be created to encapsulate all communication with the Traceable GraphQL API.

**New File**: `packages/api/src/utils/traceable.js`

This service will contain helper functions to send queries to the Traceable GraphQL endpoint (e.g., `https://api.traceable.ai/graphql`). All requests will be `POST` requests containing a GraphQL query and variables. A generic helper function should be created to handle the API calls.

**Example GraphQL Helper**:
```javascript
async function executeTraceableQuery(credentials, query, variables) {
    const { apiToken } = credentials;
    // Note: The exact endpoint URL should be confirmed from Traceable's documentation.
    const response = await fetch('https://api.traceable.ai/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Traceable API request failed with status ${response.status}: ${errorBody}`);
    }
    
    const result = await response.json();
    if (result.errors) {
        throw new Error(`Traceable GraphQL query failed: ${JSON.stringify(result.errors)}`);
    }
    return result.data;
}
```

**Key Functions & GraphQL Queries**:

*   **`getTraceableServices(credentials)`**: Fetches a list of services.
    *   **GraphQL Query**:
        ```graphql
        query GetServices {
          services {
            items {
              id
              name
            }
          }
        }
        ```

*   **`getTraceableVulnerabilities(credentials, serviceId)`**: Fetches vulnerabilities for a specific service ID.
    *   **GraphQL Query** (Note: Field names like `cve`, `threat_category`, etc. are illustrative and must be confirmed from the actual Traceable schema):
        ```graphql
        query GetVulnerabilities($serviceId: ID!) {
          vulnerabilities(serviceId: $serviceId) {
            items {
              id
              cve
              title
              description
              severity
              remediation
              threat_category
              api_endpoint_path
              http_method
            }
          }
        }
        ```

#### Task 1.2: Expose Traceable Services via API
Create a new API endpoint for the frontend to fetch the list of available Traceable services for a given integration.

**File to Edit**: `packages/api/src/routes/securityTools.js`

**New Endpoint**: `GET /api/v1/security-tools/:integrationId/traceable/services`

This route will use the `getTraceableServices` utility, decrypt the credentials stored for the `integrationId`, and return a simplified list of services (e.g., `[{ id, name }]`) to the client.

#### Task 1.3: Link Traceable Service to Project
The "Update Project" endpoint (`PUT /api/v1/projects/:id`) will be used to store the ID of the Traceable service. The frontend will send the ID within the `toolSpecificIds` field.

**Example Request Body**:
```json
{
  "toolSpecificIds": {
    "snykProjectIds": ["..."],
    "traceableServiceId": "abc-123-service-id-from-traceable"
  }
}
```

### Phase 2: Backend - Data Synchronization

#### Task 2.1: Create the Sync Utility
This is the core logic for the integration. A new `syncTraceableFindings` function will be created, which orchestrates the entire data pull and storage process.

**File to Edit**: `packages/api/src/utils/findings.js`

**Function**: `syncTraceableFindings(integrationId, projectIds)`

**Logic Flow**:
1.  Fetch the `SecurityToolIntegration` and decrypt its credentials.
2.  For each `projectId` passed in:
    a. Retrieve the `Project` and its linked `traceableServiceId` from `toolSpecificIds`.
    b. If no link exists, log a warning and skip.
    c. Call `getTraceableVulnerabilities` to fetch findings from Traceable.
    d. For each finding from Traceable:
        i. **Check for a CVE ID**.
        ii. **If CVE ID exists**: Call `lookupExternalVulnerability(cveId)` to get enriched data. Use this data to `upsert` into the `Vulnerability` table with `source: 'TRACEABLE'`.
        iii. **If no CVE ID exists**: Use the raw data from the Traceable payload to `upsert` the `Vulnerability` record. Use a unique identifier from Traceable (e.g., `rule_name`) as the `vulnerabilityId`.
        iv. `Upsert` a `Finding` record that links the `Project` to the canonical `Vulnerability`.

#### Task 2.2: Update the Sync API Endpoint
The main sync route needs to be updated to recognize and trigger the Traceable sync process.

**File to Edit**: `packages/api/src/routes/securityTools.js`

**Endpoint to Modify**: `POST /api/v1/security-tools/:integrationId/sync`

Add a new `else if` block to handle the "Traceable" provider:
```javascript
// ... inside the sync route
if (integration.provider === 'Snyk') {
    syncSnykFindings(integrationId, projectIds).catch(/* ... */);
} else if (integration.provider === 'Traceable') {
    syncTraceableFindings(integrationId, projectIds).catch(error => {
        console.error(`[Background Sync Error] Failed to sync Traceable integration ${integrationId}:`, error);
    });
} else {
    return res.status(400).json({ error: `Sync not supported for provider: ${integration.provider}` });
}
// ...
```

### Phase 3: Frontend Implementation

The frontend implementation will closely follow the existing patterns established by the Snyk integration.

1.  **Add Provider Option**: In the "Add Security Tool" modal, add "Traceable" to the list of providers. The form should collect a `displayName` and the `apiToken`.
2.  **Create Linking UI**: On the project settings page, add a "Traceable Integration" section. This section will contain a dropdown menu populated by a call to the new `/traceable/services` endpoint. Saving will update the project with the selected `traceableServiceId`.
3.  **Trigger Sync**: The "Sync" button on the project's security tool integration list should be enabled for Traceable integrations, calling the generic `sync` endpoint.
4.  **Display Findings**: The existing "Security Findings" tab on the project details page should display the new findings from Traceable without modification. A small UI enhancement could be to add a source icon next to each finding to visually distinguish it.

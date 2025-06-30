# Snyk Integration Feature Plan (Version 2)

## 1. Overview & Goals

This document outlines a revised, architecturally distinct plan for integrating security tools, starting with Snyk. This approach is based on critical feedback that security tools are not SCMs and require their own dedicated, flexible integration model.

**Revised Goals:**
-   Create a new, generic **Security Tool Integration** model capable of supporting various tools (SAST, DAST, SCA, etc.) with different authentication methods.
-   Implement a **manual project linking** flow, mirroring the proven pattern from the SCM integration.
-   Introduce a robust **`IntegrationSyncLog`** to track the history, status, and results of every data pull for all integration types.
-   Add a **findings severity chart** to the application details page, contextualized with data from the latest completed sync.

## 2. Backend Implementation Plan

### Step 2.1: Database Schema Overhaul (`schema.prisma`)

We will introduce new models and enums and update existing ones to create a flexible foundation.

1.  **Enums for Categorization:** Create a `SecurityToolType` enum.
2.  **Generic `SecurityToolIntegration` Model:**
    -   It will have a `type` field (`SecurityToolType`).
    -   Critically, it will use a single `encryptedCredentials` string field to store a JSON object of credentials. This provides the flexibility to support any tool's specific needs (e.g., `{ "apiToken": "...", "orgId": "..." }` for Snyk).
    -   It will be linkable to the hierarchy (Organization, Company, Team) for management, just like SCM integrations.
3.  **`IntegrationSyncLog` Model:** A new table to log every sync event.
4.  **Flexible Project Linking:** Update the `Project` model to use a `toolSpecificIds` JSON field. This allows a single project to be linked to multiple tools (e.g., `{ "snyk": "snyk-proj-id", "qualys": "qualys-asset-id" }`).
5.  **Update `SCMIntegration`:** Add the relation to `IntegrationSyncLog`.

```prisma
// In schema.prisma

enum SecurityToolType {
  SAST
  DAST
  SCA
  APISEC
}

model SecurityToolIntegration {
  id                      String  @id @default(cuid())
  provider                String  // e.g., "Snyk", "Qualys"
  type                    SecurityToolType
  displayName             String?

  // Flexible, encrypted JSON blob for credentials
  encryptedCredentials    String

  createdById             String
  createdBy               User   @relation(fields: [createdById], references: [id], onDelete: Cascade)

  organizationId          String?
  organization            Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  companyId               String?
  company                 Company?      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  teamId                  String?
  team                    Team?         @relation(fields: [teamId], references: [id], onDelete: Cascade)

  projectLinks            Project[]     @relation("ProjectSecurityToolLink")
  syncLogs                IntegrationSyncLog[]

  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt
}

model IntegrationSyncLog {
  id                      String    @id @default(cuid())
  status                  String    // 'SUCCESS', 'FAILURE', 'IN_PROGRESS'
  startTime               DateTime
  endTime                 DateTime?
  findingsAdded           Int       @default(0)
  findingsUpdated         Int       @default(0)
  errorMessage            String?

  // Polymorphic relation to an integration
  scmIntegrationId        String?
  scmIntegration          SCMIntegration?          @relation(fields: [scmIntegrationId], references: [id], onDelete: Cascade)
  securityToolIntegrationId String?
  securityToolIntegration   SecurityToolIntegration? @relation(fields: [securityToolIntegrationId], references: [id], onDelete: Cascade)

  @@index([scmIntegrationId])
  @@index([securityToolIntegrationId])
}

model SCMIntegration {
  // ... existing fields
  syncLogs     IntegrationSyncLog[] // Add this relation
}

model Project {
  // ... existing fields
  scmIntegrationId          String?
  scmIntegration            SCMIntegration? @relation("ProjectRepositoryLink", fields: [scmIntegrationId], references: [id], onDelete: SetNull)

  securityToolIntegrationId String?
  securityToolIntegration   SecurityToolIntegration? @relation("ProjectSecurityToolLink", fields: [securityToolIntegrationId], references: [id], onDelete: SetNull)
  
  // Flexible JSON object for tool-specific IDs
  toolSpecificIds           Json? @default("{}")

  findings                  Finding[]
}
```

We will then run `npx prisma migrate dev --name create-generic-security-integrations` to apply the changes.

### Step 2.2: New API Route for Security Tools

A new route file `packages/api/src/routes/securityTools.js` will be created.

1.  **Add Integration:** `POST /api/v1/security-tools`
    -   Accepts `{ provider, type, displayName, credentials: { ... }, resourceType, resourceId }`.
2.  **List Integrations:** `GET /api/v1/security-tools`
3.  **Get Snyk Projects for Linking:** `GET /api/v1/security-tools/:integrationId/snyk/projects`
4.  **Link Project:** `POST /api/v1/projects/:projectId/link-security-tool`
    -   Accepts `{ securityToolIntegrationId, provider: "snyk", toolSpecificId: "snyk_project_id" }`.
    -   Updates the `toolSpecificIds` JSON field on the `Project`.
5.  **Trigger Sync:** `POST /api/v1/security-tools/:integrationId/sync`
    -   Creates and updates a record in `IntegrationSyncLog`.

### Step 2.3: Update Sync Logic

The `syncSnykFindings` utility will be updated to use the generic credential and linking model. It will only sync projects explicitly passed in the `projectIds` array.

## 3. Frontend Implementation Plan

### Step 3.1: Refactor and Repurpose Existing UI

As suggested, we will reuse existing SCM integration components to build the new UI for Security Tools, ensuring a consistent user experience.

1.  **`IntegrationManager.jsx`:** Will be updated to have two distinct sections for "SCM Integrations" and "Security Tool Integrations", fetching data from their respective endpoints.
2.  We will create copies of SCM-related components and adapt them:
    -   `AddScmIntegrationModal.jsx` -> `AddSecurityToolModal.jsx`
    -   `LinkRepositoryControl.jsx` -> `LinkSecurityToolControl.jsx`
    -   `SelectRepositoryModal.jsx` -> `SelectToolProjectModal.jsx`

### Step 3.2: Implement Findings Visualization

1.  **Add Charting Library:** Add `recharts` to `packages/web/package.json`.
2.  **`FindingsSeverityChart.jsx`:** Create a new component to render a bar chart of findings by severity.
3.  **`useFindingStore.js`:** Add a function to fetch the latest successful sync log for a given integration.
4.  **`ApplicationDetails.jsx`:**
    -   In the "Security" tab, display the `FindingsSeverityChart`.
    -   Below the chart, display the "Last synced on: {date}" from the sync log. This provides the necessary context for the chart data, fulfilling the "latest sync pull" requirement. The chart itself will display the current state of open findings.

This revised plan provides a far more robust and scalable architecture. Please review it, and if it meets your approval, we can begin with Step 2.1. 
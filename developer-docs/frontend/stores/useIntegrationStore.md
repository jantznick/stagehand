# Store: `useIntegrationStore`

*   **File:** `packages/web/src/stores/useIntegrationStore.js`
*   **Purpose:** Manages integrations with both Source Code Management (SCM) tools like GitHub and third-party Security Tools like Snyk.

---

## State

*   `integrations`: An object containing two arrays: `scmIntegrations` and `securityToolIntegrations`.
*   `snykProjects`: An array of Snyk project objects, fetched from the Snyk API, used to populate selection modals.
*   `syncLogs`: An array of log entries for integration sync jobs.
*   `isLoading`: A boolean flag for various integration-related async operations.

---

## Actions

### `fetchIntegrations(resourceType, resourceId)`
*   **Description:** Fetches all integrations for a given resource.
*   **API Calls:**
    *   `GET /api/v1/integrations?<resourceType>=<resourceId>`
    *   `GET /api/v1/security-tools?<resourceType>=<resourceId>`
*   **Behavior:** Populates the `integrations` state object.

### `createScmIntegration(resourceType, resourceId)`
*   **Description:** Starts the GitHub App installation OAuth flow.
*   **API Call:** `POST /api/v1/integrations/github/auth-start`
*   **Behavior:** It gets an installation URL from the API and redirects the browser to GitHub to continue the flow.

### `addSecurityTool(data)`
*   **Description:** Creates a new security tool integration (e.g., Snyk) by sending its credentials to the backend.
*   **API Call:** `POST /api/v1/security-tools`
*   **Behavior:** Refreshes the integration list on success.

### `fetchSnykProjects(integrationId)`
*   **Description:** Fetches the list of projects from a user's Snyk account for a given integration.
*   **API Call:** `GET /api/v1/security-tools/:integrationId/snyk/projects`
*   **Behavior:** Populates the `snykProjects` state array.

### `linkSnykProject(projectId, snykProjectId, toolType, integrationId)`
*   **Description:** Creates a link between a Stagehand project and a Snyk project.
*   **API Call:** `POST /api/v1/projects/:projectId/link-tool`

### `triggerSnykSync(integrationId, stagehandProjectIds)`
*   **Description:** Initiates a background job on the server to sync security findings from Snyk for one or more Stagehand projects.
*   **API Call:** `POST /api/v1/security-tools/:integrationId/sync`

### `fetchSyncLogs(integrationId)`
*   **Description:** Fetches the most recent sync logs for a specific integration.
*   **API Call:** `GET /api/v1/security-tools/:integrationId/sync-logs`
*   **Behavior:** Populates the `syncLogs` state array. 
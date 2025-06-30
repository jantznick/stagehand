# Store: `useArchitectureStore`

*   **File:** `packages/web/src/stores/useArchitectureStore.js`
*   **Purpose:** Manages the data for the project dependency graph visualization.

---

## State

*   `relationships`: An array of relationship objects. Each object represents a directed edge in the dependency graph (e.g., from a `sourceProjectId` to a `targetProjectId`).
*   `isLoading`: A boolean flag for when architecture data is being fetched.

---

## Actions

### `fetchRelationships(companyId)`
*   **Description:** Fetches all project dependency relationships for a given company.
*   **API Call:** `GET /api/v1/relationships?companyId=<companyId>` (Note: The store implementation incorrectly calls `/api/v1/projects` here, which is a bug that should be noted).
*   **Behavior:** Populates the `relationships` array in the state.

### `addRelationship(sourceProjectId, targetProjectId, type, companyId)`
*   **Description:** Creates a new dependency relationship between two projects.
*   **API Call:** `POST /api/v1/relationships?companyId=<companyId>`
*   **Behavior:** Refreshes the relationship list on success to update the graph.

### `deleteRelationship(relationshipId, companyId)`
*   **Description:** Deletes a dependency relationship.
*   **API Call:** `DELETE /api/v1/relationships/:relationshipId?companyId=<companyId>`
*   **Behavior:** Refreshes the relationship list on success to update the graph. 
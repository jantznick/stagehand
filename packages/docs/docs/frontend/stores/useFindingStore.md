# Store: `useFindingStore`

*   **File:** `packages/web/src/stores/useFindingStore.js`
*   **Purpose:** Manages security findings for projects.

---

## State

*   `findings`: An array of finding objects for the currently selected project.
*   `isLoading`: A boolean flag for when findings are being fetched.

---

## Actions

### `fetchFindings(projectId)`
*   **Description:** Fetches all security findings for a specific project.
*   **API Call:** `GET /api/v1/projects/:projectId/findings`
*   **Behavior:** Populates the `findings` array in the state with the results. 
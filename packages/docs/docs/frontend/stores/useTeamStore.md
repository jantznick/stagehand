# Store: `useTeamStore`

*   **File:** `packages/web/src/stores/useTeamStore.js`
*   **Purpose:** Manages data and actions for Team-level resources.

---

## State

*   This store is action-focused and does not hold its own state. It triggers updates in `useHierarchyStore` upon success.

---

## Actions

### `createTeam(name, companyId)`
*   **Description:** Creates a new team within a given company.
*   **API Call:** `POST /api/v1/teams`
*   **Behavior:** On success, it calls `useHierarchyStore.getState().addItem()` to add the new team to the navigation tree.

### `updateTeam(teamId, data)`
*   **Description:** Updates a team's details, such as its name.
*   **API Call:** `PUT /api/v1/teams/:teamId`
*   **Behavior:** On success, it calls `useHierarchyStore.getState().updateItem()` to update the team in the navigation tree.

### `deleteTeam(teamId)`
*   **Description:** Deletes a team.
*   **API Call:** `DELETE /api/v1/teams/:teamId`
*   **Behavior:** On success, it calls `useHierarchyStore.getState().deleteItem()` to remove the team from the navigation tree. 
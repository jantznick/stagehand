# Store: `useProjectStore`

*   **File:** `packages/web/src/stores/useProjectStore.js`
*   **Purpose:** Manages data and actions for Project-level resources (also referred to as Applications).

---

## State

*   This store is action-focused and does not hold its own state. It triggers updates in `useHierarchyStore` upon success.

---

## Actions

### `createProject(name, teamId)`
*   **Description:** Creates a new project within a given team.
*   **API Call:** `POST /api/v1/projects`
*   **Behavior:** On success, it calls `useHierarchyStore.getState().addItem()` to add the new project to the navigation tree.

### `updateProject(projectId, data)`
*   **Description:** Updates a project's details, such as its name or associated technologies.
*   **API Call:** `PUT /api/v1/projects/:projectId`
*   **Behavior:** On success, it calls `useHierarchyStore.getState().updateItem()` to update the project in the navigation tree.

### `deleteProject(projectId)`
*   **Description:** Deletes a project.
*   **API Call:** `DELETE /api/v1/projects/:projectId`
*   **Behavior:** On success, it calls `useHierarchyStore.getState().deleteItem()` to remove the project from the navigation tree.

### `linkRepository(projectId, repositoryUrl, integrationId)`
*   **Description:** Links a project to a specific Git repository from an SCM integration.
*   **API Call:** `POST /api/v1/projects/:projectId/link-repo`

### `unlinkRepository(projectId)`
*   **Description:** Unlinks a project from its Git repository.
*   **API Call:** `POST /api/v1/projects/:projectId/unlink-repo` 
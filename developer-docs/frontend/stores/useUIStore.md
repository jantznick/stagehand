# Store: `useUIStore`

*   **File:** `packages/web/src/stores/useUIStore.js`
*   **Purpose:** Manages global UI state that is not tied to a specific data domain.

---

## State

*   `isSidebarOpen`: Boolean that controls the visibility of the main navigation sidebar.
*   `activeModal`: A string identifying which modal is currently open (e.g., `'createTeam'`).
*   `modalData`: An object used to pass props/data to the active modal.

---

## Actions

### `toggleSidebar()`
*   **Description:** Toggles the `isSidebarOpen` boolean state.
*   **API Call:** None.

### `openModal(modalName, data)`
*   **Description:** Sets the `activeModal` to the provided `modalName` and stores any associated `data`. This is the primary mechanism for opening modals throughout the application.
*   **API Call:** None.

### `closeModal()`
*   **Description:** Resets the `activeModal` and `modalData` to their initial `null` state, effectively closing any active modal.
*   **API Call:** None. 
# Store: `useCompanyStore`

*   **File:** `packages/web/src/stores/useCompanyStore.js`
*   **Purpose:** Manages data and actions for Company-level resources.

---

## State

*   This store is action-focused and does not hold its own state. It triggers updates in `useHierarchyStore` upon success.

---

## Actions

### `createCompany(name, organizationId)`
*   **Description:** Creates a new company within a given organization.
*   **API Call:** `POST /api/v1/companies`
*   **Behavior:** On success, it calls `useHierarchyStore.getState().addItem()` to add the new company to the navigation tree.

### `updateCompany(companyId, data)`
*   **Description:** Updates a company's details, such as its name.
*   **API Call:** `PUT /api/v1/companies/:companyId`
*   **Behavior:** On success, it calls `useHierarchyStore.getState().updateItem()` to update the company in the navigation tree.

### `deleteCompany(companyId)`
*   **Description:** Deletes a company.
*   **API Call:** `DELETE /api/v1/companies/:companyId`
*   **Behavior:** On success, it calls `useHierarchyStore.getState().fetchHierarchy()` to refresh the entire navigation tree, as deleting a company can have wide-ranging effects. 
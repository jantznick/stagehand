# Store: `useOrganizationStore`

*   **File:** `packages/web/src/stores/useOrganizationStore.js`
*   **Purpose:** Manages data and actions for Organization-level resources.

---

## State

*   This store is action-focused and does not hold its own state. It typically updates the central `useHierarchyStore` after its actions complete.

---

## Actions

### `fetchOrganization(orgId)`
*   **Description:** Fetches the details for a single organization.
*   **API Call:** `GET /api/v1/organizations/:orgId`

### `updateOrganization(orgId, data)`
*   **Description:** Updates an organization's details, such as its name.
*   **API Call:** `PUT /api/v1/organizations/:orgId`

### `upgradeOrganization(orgId)`
*   **Description:** Upgrades an organization to the Enterprise plan.
*   **API Call:** `POST /api/v1/organizations/:orgId/upgrade`

### `downgradeOrganization(orgId, defaultCompanyId)`
*   **Description:** Downgrades an organization to the Standard plan. A `defaultCompanyId` must be specified to be kept as the primary company.
*   **API Call:** `POST /api/v1/organizations/:orgId/downgrade` 
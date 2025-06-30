# Store: `useOIDCStore`

*   **File:** `packages/web/src/stores/useOIDCStore.js`
*   **Purpose:** Manages the OIDC SSO configuration for an organization.

---

## State

*   `oidcConfiguration`: The OIDC configuration object for the current organization. Contains details like issuer URL, client ID, etc.
*   `isLoading`: A boolean flag for when OIDC configuration is being fetched or updated.

---

## Actions

### `fetchOIDCConfiguration(orgId)`
*   **Description:** Fetches the OIDC configuration for a given organization.
*   **API Call:** `GET /api/v1/organizations/:orgId/oidc`
*   **Behavior:** Populates the `oidcConfiguration` object in the state.

### `createOIDCConfiguration(orgId, data)`
*   **Description:** Creates a new OIDC configuration for an organization.
*   **API Call:** `POST /api/v1/organizations/:orgId/oidc`
*   **Behavior:** Refreshes the configuration on success.

### `updateOIDCConfiguration(orgId, data)`
*   **Description:** Updates an existing OIDC configuration.
*   **API Call:** `PUT /api/v1/organizations/:orgId/oidc`
*   **Behavior:** Refreshes the configuration on success.

### `deleteOIDCConfiguration(orgId)`
*   **Description:** Deletes the OIDC configuration for an organization.
*   **API Call:** `DELETE /api/v1/organizations/:orgId/oidc`
*   **Behavior:** Clears the `oidcConfiguration` state object on success. 
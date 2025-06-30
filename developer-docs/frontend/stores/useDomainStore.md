# Store: `useDomainStore`

*   **File:** `packages/web/src/stores/useDomainStore.js`
*   **Purpose:** Manages verified domains for an organization, which enables new users to automatically join that organization if they sign up with a matching email address.

---

## State

*   `domains`: An array of domain objects for the current organization. Each object includes the domain name and its verification status.
*   `isLoading`: A boolean flag for when domain data is being fetched or updated.

---

## Actions

### `fetchDomains(orgId)`
*   **Description:** Fetches all domains configured for an organization.
*   **API Call:** `GET /api/v1/organizations/:orgId/domains`
*   **Behavior:** Populates the `domains` array in the state.

### `addDomain(orgId, domain)`
*   **Description:** Adds a new, unverified domain to an organization.
*   **API Call:** `POST /api/v1/organizations/:orgId/domains`
*   **Behavior:** Refreshes the domain list on success.

### `verifyDomain(orgId, domainId)`
*   **Description:** Asks the backend to check the domain's DNS records for the verification `TXT` record.
*   **API Call:** `POST /api/v1/organizations/:orgId/domains/:domainId/verify`
*   **Behavior:** Refreshes the domain list on success to show the updated verification status.

### `deleteDomain(orgId, domainId)`
*   **Description:** Deletes a domain from an organization.
*   **API Call:** `DELETE /api/v1/organizations/:orgId/domains/:domainId`
*   **Behavior:** Refreshes the domain list on success. 
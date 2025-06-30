# Store: `useMembershipStore`

*   **File:** `packages/web/src/stores/useMembershipStore.js`
*   **Purpose:** Manages user memberships and their roles on all resources.

---

## State

*   `members`: An array of member objects for the currently selected resource. This state is populated by the `fetchMembers` action.
*   `isLoading`: A boolean flag for when membership data is being fetched or updated.

---

## Actions

### `fetchMembers(resourceType, resourceId)`
*   **Description:** Fetches all members (and their effective roles) for a specific resource.
*   **API Call:** `GET /api/v1/memberships?<resourceType>=<resourceId>`
*   **Behavior:** Populates the `members` array in the state.

### `addMember(email, role, resourceType, resourceId)`
*   **Description:** Adds a new user to a resource with a specified role. If the user does not exist, an invitation is sent.
*   **API Call:** `POST /api/v1/memberships`
*   **Behavior:** After a successful API call, it calls `fetchMembers` again to refresh the state with the new member.

### `updateMember(membershipId, role)`
*   **Description:** Updates an existing member's direct role on a resource.
*   **API Call:** `PUT /api/v1/memberships/:membershipId`
*   **Behavior:** Refreshes the member list on success.

### `removeMember(membershipId)`
*   **Description:** Removes a member's direct membership from a resource.
*   **API Call:** `DELETE /api/v1/memberships/:membershipId`
*   **Behavior:** Refreshes the member list on success.

### `resendInvitation(userId)`
*   **Description:** Triggers a new invitation email to be sent to a user who is still in a "pending" state.
*   **API Call:** `POST /api/v1/invitations/resend` 
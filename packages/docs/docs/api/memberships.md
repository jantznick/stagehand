# API Reference: Memberships

This document provides a detailed breakdown of the membership-related API endpoints.

**File:** `packages/api/src/routes/memberships.js`
**Base Path:** `/api/v1/memberships`

---

## Overview

Manages the assignment of roles to users and teams on different resources (Organizations, Companies, Teams, and Projects). This is a cornerstone of the permission system.

**Middleware:** All routes in this file are protected by the `protect` middleware.

## Key Concepts

*   **Permission-Based Access Control (PBAC):** This API is the primary interface for the PBAC system. It works by creating `Membership` records that link a user or a team to a specific `Role` on a specific resource.
*   **Inheritance:** The `checkPermission` utility handles all permission inheritance logic dynamically. There is no need for "effective role" calculations or creating "implicit" parent memberships. If a user has a role on a resource, they can see its parents. If a role grants permissions, those permissions apply to all child resources.

---

## Endpoints

### `GET /`

Retrieves a list of all direct members for a specific resource.

*   **Query Params:** One of the following is required to specify the target resource.
    *   `organizationId` (string)
    *   `companyId` (string)
    *   `teamId` (string)
    *   `projectId` (string)
*   **Permissions:** Requires `'*:members:read'` permission on the target resource (e.g., `'project:members:read'`).
*   **Success Response (`200`):** An array of `Membership` objects, with the `user`, `team`, and `role` objects included.

---

### `POST /`

Adds a user or team as a member to a specific resource with a given role.

*   **Permissions:** Requires `'*:members:manage'` permission on the target resource.
*   **Body (`application/json`):**
    *   `email` (string, optional): The email of the user to add. Provide either `email` or `teamId`.
    *   `teamId` (string, optional): The ID of the team to add. Provide either `email` or `teamId`.
    *   `roleId` (string, required): The ID of the `Role` to assign.
    *   `resourceId` (string, required): The ID of the resource to add the member to.
    *   `resourceType` (string, required): The type of the resource (`'organization'`, `'company'`, `'team'`, `'project'`).
*   **Success Response (`201`):** The newly created `Membership` object.

*   **Behavior:**
    1.  **User Invitation:** If an `email` is provided and the user does not exist, a new `User` is created in a pending state, and an email invitation is sent.
    2.  **Membership Creation:** A `Membership` record is created linking the user or team to the resource with the specified `roleId`.

---

### `PUT /:membershipId`

Updates the role of a membership.

*   **Permissions:** Requires `'*:members:manage'` permission on the resource associated with the membership.
*   **URL Params:**
    *   `:membershipId`: The ID of the membership record to update.
*   **Body (`application/json`):**
    *   `roleId` (string, required): The new `Role` ID for the member.
*   **Success Response (`200`):** The updated membership object.

---

### `DELETE /:membershipId`

Removes a membership from a resource.

*   **Permissions:** Requires `'*:members:manage'` permission on the resource associated with the membership.
*   **URL Params:**
    *   `:membershipId`: The ID of the membership record to delete.
*   **Success Response (`204`):** No content.
*   **Behavior:** Deletes the specified `Membership` record. 
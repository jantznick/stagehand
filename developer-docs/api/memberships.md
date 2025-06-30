# API Reference: Memberships

This document provides a detailed breakdown of the membership-related API endpoints.

**File:** `packages/api/src/routes/memberships.js`
**Base Path:** `/api/v1/memberships`

---

## Overview

Manages user memberships and their roles on different resources (Organizations, Companies, Teams, and Projects). This is a cornerstone of the permission system. The logic in this file is complex because it calculates a user's "effective role" based on the resource hierarchy.

**Middleware:** All routes in this file are protected by the `protect` middleware.

## Key Concepts

*   **Effective Role:** A user's access to a resource is not just determined by their direct membership. If a user has a role on a parent resource (e.g., they are an `ADMIN` of a Company), they implicitly gain that role on all child resources (e.g., all Teams within that Company). The `GET /` endpoint calculates this "effective role" to provide a complete picture of permissions.
*   **Implicit Parent Access:** When a user is added to a child resource (e.g., a Project), the system automatically grants them `READER` access to all parent resources (the Team, Company, and Organization) if they don't already have it. This ensures the user can navigate the hierarchy in the UI to see the context of their resources.

---

## Endpoints

### `GET /`

Retrieves a list of all members for a specific resource, including their effective roles.

*   **Query Params:** One of the following is required to specify the target resource.
    *   `organizationId` (string)
    *   `companyId` (string)
    *   `teamId` (string)
    *   `projectId` (string)
*   **Permissions:** Requires the requesting user to be a member of the specified resource's hierarchy.
*   **Success Response (`200`):** An array of member objects. Each object contains:
    *   `user`: The user's details (`id`, `email`).
    *   `effectiveRole`: The calculated highest-permission role the user has on the resource (`'ADMIN'`, `'EDITOR'`, `'READER'`).
    *   `roleSource`: A string explaining where the effective role comes from (e.g., `'Direct member'`, `'Admin of parent company "Example Corp"'`).
    *   `id`: The actual membership ID, if the user is a direct member.

---

### `POST /`

Adds a user as a member to a specific resource with a given role.

*   **Permissions:** Requires `ADMIN` role on the target resource.
*   **Body (`application/json`):**
    *   `email` (string, required): The email of the user to add.
    *   `role` (string, required): The role to assign (`'ADMIN'`, `'EDITOR'`, `'READER'`).
    *   `resourceId` (string, required): The ID of the resource to add the member to.
    *   `resourceType` (string, required): The type of the resource (`'organization'`, `'company'`, `'team'`, `'project'`).
*   **Success Response (`201`):** The newly created direct membership object.

*   **Behavior:**
    1.  **User Invitation:** If a user with the specified `email` does not exist, a new `User` is created in a pending state, and an email invitation is sent to them to join Stagehand.
    2.  **Membership Creation:** A direct `Membership` record is created linking the user to the resource with the specified role.
    3.  **Implicit Parent Access:** The system traverses up the hierarchy from the target resource and creates implicit `READER` memberships on all parent resources to ensure the user can see the resource's context.

---

### `PUT /:membershipId`

Updates the role of a user on a specific resource.

*   **Permissions:** Requires `ADMIN` role on the resource associated with the membership.
*   **URL Params:**
    *   `:membershipId`: The ID of the direct membership record to update.
*   **Body (`application/json`):**
    *   `role` (string, required): The new role for the member.
*   **Success Response (`200`):** The updated membership object.

---

### `DELETE /:membershipId`

Removes a user's direct membership from a resource.

*   **Permissions:** Requires `ADMIN` role on the resource associated with the membership.
*   **URL Params:**
    *   `:membershipId`: The ID of the direct membership record to delete.
*   **Success Response (`204`):** No content.
*   **Behavior:** Deletes the specified `Membership` record. Note: This only removes direct membership. The user may still have "effective" access through a parent resource. 
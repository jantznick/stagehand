# API Reference: Invitations

This document provides a detailed breakdown of the invitation-related API endpoints.

**File:** `packages/api/src/routes/invitations.js`
**Base Path:** `/api/v1/invitations`

---

## Overview

Manages the process of re-inviting users who have been added to a resource but have not yet registered and activated their account. The initial creation of an invitation is handled by the `POST /api/v1/memberships` endpoint.

**Middleware:** All routes in this file are protected by the `protect` middleware.

---

## Endpoints

### `POST /resend`

Resends an invitation email to a pending user.

A "pending" user is one who has been created in the system (e.g., by being added as a member to a project) but has not yet clicked the invitation link to set their password and activate their account.

*   **Permissions:** Requires the requesting user to have the `'*:members:manage'` permission on the resource to which the pending user was originally invited (e.g., `'project:members:manage'`).
*   **Body (`application/json`):**
    *   `userId` (string, required): The ID of the pending user to whom the invitation should be resent.
*   **Success Response (`200`):** `{ "message": "Invitation sent successfully" }`
*   **Error Response (`400`):** If the target user has already registered and verified their account.
*   **Error Response (`404`):** If a pending user or their associated invitation is not found.

*   **Behavior:**
    1.  Finds the user by the provided `userId`.
    2.  Verifies the user is in a pending state (i.e., they have not yet set a password).
    3.  Finds the original membership record to determine which resource they were invited to.
    4.  Checks if the *requesting user* has permission to manage members for that resource.
    5.  Deletes the old invitation record.
    6.  Generates a new, secure invitation token with a 24-hour expiry.
    7.  Creates a new `Invitation` record in the database.
    8.  Emails a new invitation link to the pending user. 
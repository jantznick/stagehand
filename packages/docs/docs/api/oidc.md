# API Reference: OIDC Configuration

This document provides a detailed breakdown of the OIDC configuration-related API endpoints.

**File:** `packages/api/src/routes/oidc.js`
**Base Path:** `/api/v1/organizations/:orgId/oidc`

---

## Overview

Provides full CRUD (Create, Read, Update, Delete) functionality for managing an organization's OIDC single sign-on (SSO) configuration. This allows an organization to delegate its user authentication to an external Identity Provider (e.g., Okta, Auth0).

**Note on Routing:** The routes in this file are registered at the root level but are defined relative to an organization. The full path is, for example, `/api/v1/organizations/:orgId/oidc`.

**Middleware:** All routes in this file are protected by the `protect` middleware.

## Security

*   **Permissions:** All endpoints require the authenticated user to have the `'organization:update'` permission on the target organization.
*   **Client Secret:** The `clientSecret` is a sensitive credential. It is encrypted before being stored in the database and is **never** sent back to the client in API responses.

---

## Endpoints

### `GET /`

Retrieves the current OIDC configuration for an organization.

*   **URL:** `/api/v1/organizations/:orgId/oidc`
*   **Success Response (`200`):** The `OIDCConfiguration` object, with the `clientSecret` field removed.
*   **Error Response (`404`):** If no OIDC configuration exists for the organization.

---

### `POST /`

Creates a new OIDC configuration for an organization.

*   **URL:** `/api/v1/organizations/:orgId/oidc`
*   **Body (`application/json`):** Requires all the necessary OIDC provider details.
    *   `isEnabled` (boolean, optional)
    *   `issuer` (string, required)
    *   `clientId` (string, required)
    *   `clientSecret` (string, required): This value is immediately encrypted.
    *   `authorizationUrl` (string, required)
    *   `tokenUrl` (string, required)
    *   `userInfoUrl` (string, required)
    *   `defaultRoleId` (string, optional): The ID of the role assigned to new users signing up via OIDC.
    *   `buttonText` (string, optional): Custom text for the SSO login button.
*   **Success Response (`201`):** The newly created `OIDCConfiguration` object, with the `clientSecret` field removed.
*   **Error Response (`409`):** If a configuration already exists for this organization.

---

### `PUT /`

Updates an existing OIDC configuration for an organization.

*   **URL:** `/api/v1/organizations/:orgId/oidc`
*   **Body (`application/json`):** Include any of the fields from the `POST` request that you wish to update. Only the provided fields will be modified.
*   **Success Response (`200`):** The updated `OIDCConfiguration` object, with the `clientSecret` field removed.

---

### `DELETE /`

Deletes the OIDC configuration for an organization.

*   **URL:** `/api/v1/organizations/:orgId/oidc`
*   **Success Response (`204`):** No content. 
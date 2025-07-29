# API Reference: SCM Integrations

This document provides a detailed breakdown of the Source Code Management (SCM) integration API endpoints.

**File:** `packages/api/src/routes/integrations.js`
**Base Path:** `/api/v1/integrations`

---

## Overview

Manages the integration with Source Code Management (SCM) platforms, specifically the installation and configuration of the Stagehand GitHub App. This is distinct from the `security-tools` routes, which handle integrations with third-party security scanners. These endpoints facilitate the OAuth2-like flow for authorizing the GitHub App and using its access token to interact with the GitHub API.

**Middleware:** All routes in this file are protected by the `protect` middleware.

## GitHub App Auth Flow

The core of this file is the secure flow for installing the GitHub App:

1.  **Initiation (`/github/auth-start`)**: The frontend requests an installation URL. The backend creates a short-lived JSON Web Token (JWT) containing the current user and resource context (e.g., the company they are in). This JWT is used as the `state` parameter in the GitHub App installation URL.
2.  **User Installation on GitHub**: The user is redirected to GitHub, where they authorize the Stagehand App for their GitHub organization and select which repositories to grant access to.
3.  **Callback (`/github/callback`)**: GitHub redirects the user back to the Stagehand API. The callback includes an `installation_id` and the original `state` JWT.
4.  **Token Exchange & Storage**: The backend verifies the `state` JWT. It then uses the `installation_id` and a securely stored **GitHub App Private Key** to generate a temporary, renewable **Installation Access Token**. This token is what allows Stagehand to act on behalf of the user's installation. The access token is encrypted and stored in the `SCMIntegration` table in the database.
5.  **Redirect to UI**: The user is redirected back to the Stagehand settings page.

---

## Endpoints

### `POST /github/auth-start`

Initiates the GitHub App installation flow by generating a unique installation URL.

*   **Permissions:** Requires `'integration:create'` permission on the target resource.
*   **Body (`application/json`):**
    *   `resourceType` (string, required): The type of resource to associate the integration with (`'organization'`, `'company'`).
    *   `resourceId` (string, required): The ID of the resource.
*   **Success Response (`200`):** `{ "installUrl": "https://github.com/apps/..." }`

---

### `GET /github/callback`

The callback endpoint that GitHub redirects to after a user installs the app. This endpoint is not intended to be called directly by the frontend.

*   **Query Params (from GitHub):**
    *   `state`: The original JWT containing user and resource context.
    *   `installation_id`: The unique ID for the new app installation.
*   **Behavior:** Performs the token exchange, creates the `SCMIntegration` record with the encrypted access token, and redirects the user's browser back to the Stagehand UI.

---

### `GET /`

Retrieves all SCM integrations configured for a specific resource.

*   **Permissions:** Requires `'integration:read'` permission on the target resource.
*   **Query Params:**
    *   `resourceType` (string, required): The type of resource.
    *   `resourceId` (string, required): The ID of the resource.
*   **Success Response (`200`):** An array of `SCMIntegration` objects.

---

### `GET /:id/repositories`

Fetches a list of repositories that a specific SCM integration has access to.

*   **Permissions:** Requires `'integration:read'` permission on the resource the integration is attached to.
*   **Success Response (`200`):** An array of repository objects from the GitHub API.
*   **Behavior:** Decrypts the integration's access token and uses it to call the GitHub API (`/installation/repositories`) to get the list of repositories the app has been granted access to.

---

### `DELETE /:integrationId`

Deletes an SCM integration.

*   **Permissions:** Requires `'integration:delete'` permission on the resource the integration is attached to.
*   **Success Response (`204`):** No content.
*   **Behavior:** This endpoint uses a database transaction to safely perform two actions:
    1.  It finds all projects currently linked to this integration and unlinks them (sets their `scmIntegrationId` to `null`).
    2.  It deletes the `SCMIntegration` record itself. 
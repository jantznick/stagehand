# API Reference: Security Tools

This document provides a detailed breakdown of the security tool integration-related API endpoints.

**File:** `packages/api/src/routes/securityTools.js`
**Base Path:** `/api/v1/security-tools`

---

## Overview

Manages the lifecycle of security tool integrations (e.g., Snyk, GitHub). This includes creating new integration instances, storing their encrypted credentials, and providing endpoints to interact with the external tool's API (e.g., fetching a list of projects from Snyk) and trigger finding synchronizations.

**Middleware:** All routes in this file are protected by the `protect` middleware.

## Key Concepts

*   **Credential Encryption:** When a new integration is created, its credentials (e.g., an API token) are immediately encrypted using the `encrypt` utility and stored in the `encryptedCredentials` field. They are decrypted on-the-fly when needed to communicate with the external API.
*   **Asynchronous Syncing:** The process of syncing findings from an external tool can be time-consuming. The `POST /:integrationId/sync` endpoint is designed to be asynchronous. It initiates the sync process in the background and immediately returns a `202 Accepted` response to the client, preventing UI timeouts.

---

## Endpoints

### `POST /`

Adds and configures a new security tool integration for a specific resource.

*   **Permissions:** Requires `ADMIN` role on the target resource (`resourceId`).
*   **Body (`application/json`):**
    *   `provider` (string, required): The name of the provider (e.g., `'Snyk'`, `'GitHub'`).
    *   `type` (string, required): The type of tool (e.g., `'SAST'`, `'SCA'`).
    *   `displayName` (string, optional): A user-friendly name for this integration instance.
    *   `credentials` (object, required): The credentials needed for the integration (e.g., `{ "apiToken": "...", "orgId": "..." }`). This object is immediately encrypted.
    *   `resourceType` (string, required): The type of resource this integration belongs to (`'organization'`, `'company'`, etc.).
    *   `resourceId` (string, required): The ID of the resource.
*   **Success Response (`201`):** The newly created `SecurityToolIntegration` object.

---

### `GET /`

Gets all security tool integrations visible from a specific resource's perspective.

*   **Permissions:** Requires `READER`, `EDITOR`, or `ADMIN` role on the target resource.
*   **Query Params:**
    *   `resourceType` (string, required): The type of resource.
    *   `resourceId` (string, required): The ID of the resource.
*   **Success Response (`200`):** An array of `SecurityToolIntegration` objects.
*   **Behavior:** Fetches all integrations that are configured on the specified resource or any of its parent resources in the hierarchy.

---

### `GET /:integrationId/snyk/projects`

Fetches a list of scannable projects directly from the Snyk API for a given Snyk integration.

*   **Permissions:** Requires the user to be the creator of the integration.
*   **URL Params:**
    *   `:integrationId`: The ID of the Snyk `SecurityToolIntegration`.
*   **Success Response (`200`):** An array of project objects from the Snyk API, transformed into a simpler format.
*   **Behavior:** Decrypts the integration's credentials, calls the Snyk API (`/org/{orgId}/projects`), and returns the list of projects found in the user's Snyk account.

---

### `POST /:integrationId/sync`

Triggers an asynchronous background job to sync findings for a set of projects from the integrated tool.

*   **Permissions:** Open to authenticated users, but a more robust check could be added.
*   **Body (`application/json`):**
    *   `projectIds` (array of strings, required): An array of Stagehand Project IDs for which to sync findings.
*   **Success Response (`202`):** `{ "message": "Sync process initiated successfully." }`
*   **Behavior:** This endpoint calls a provider-specific utility function (e.g., `syncSnykFindings`) but does **not** `await` the result. The sync runs in the background, and errors are logged to the console.

---

### `GET /:integrationId/sync-logs`

Retrieves the most recent sync logs for a specific integration.

*   **Permissions:** Open to authenticated users.
*   **Success Response (`200`):** An array of `IntegrationSyncLog` objects, limited to the last 20 syncs. 
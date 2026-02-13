# API Reference: Organizations

This document provides a detailed breakdown of the organization-related API endpoints.

**File:** `packages/api/src/routes/organizations.js`
**Base Path:** `/api/v1/organizations`

---

## Overview

Manages top-level organizations, which represent the highest level of tenancy in the system. These routes handle an organization's settings and the configuration for the auto-join feature, which allows users from a specific email domain to be added to the organization automatically upon registration.

**Middleware:** All routes in this file are protected by the `protect` middleware, ensuring a user must be authenticated to access them.

## Permissions Helper

*   `checkPermission(user, permissionString, resourceType, resourceId)`: A utility from `src/utils/permissions.js` that dynamically checks if a user has the required permission on a specific resource. It handles permissions inherited from parent resources, as well as those granted to the user's teams.

---

## Endpoints

### `GET /:id`

Retrieves a single organization by its ID.

*   **Permissions:** Requires `'organization:read'` permission on the organization.
*   **Success Response (`200`):** The full organization object.
*   **Error Response (`403`):** If the user is not authorized.
*   **Error Response (`404`):** If the organization is not found.

---

### `PUT /:id`

Updates an organization's details.

*   **Permissions:** Requires `'organization:update'` permission on the organization.
*   **Body (`application/json`):**
    *   `name` (string, optional): The new name for the organization.
    *   `description` (string, optional): The new description.
    *   `accountType` (string, optional): The account type (e.g., `'STANDARD'`, `'ENTERPRISE'`).
    *   `defaultCompanyId` (string, optional): The ID of the company to be the default when downgrading to a `'STANDARD'` account. This is required if the `accountType` is being changed from `'ENTERPRISE'` to `'STANDARD'`.
    *   `hierarchyDisplayNames` (object, optional): An object to customize the display names for the hierarchy levels (e.g., `{ "company": "Business Unit", "team": "Squad" }`).
*   **Success Response (`200`):** The updated organization object.

*   **Behavior:**
    *   Updates the specified fields for the organization.
    *   Includes special logic for handling a downgrade from `'ENTERPRISE'` to `'STANDARD'`, which requires a `defaultCompanyId` to be provided.

---

## Endpoints (Auto-Join Domains)

These endpoints manage the email domains that are allowed to automatically join an organization upon user registration.

### `GET /:id/domains`

Retrieves all auto-join domains configured for a specific organization.

*   **Permissions:** Requires `'organization:update'` permission.
*   **Success Response (`200`):** An array of auto-join domain objects.

---

### `POST /:id/domains`

Adds a new domain for auto-join.

*   **Permissions:** Requires `'organization:update'` permission.
*   **Body (`application/json`):**
    *   `domain` (string, required): The domain to add (e.g., `mycompany.com`).
    *   `roleId` (string, required): The ID of the default `Role` to assign to new users from this domain.
*   **Success Response (`201`):** The newly created auto-join domain object, which includes a unique `verificationCode`.
*   **Error Response (`400`):** If a public email domain (e.g., `gmail.com`) is provided.

*   **Behavior:**
    *   Creates a new `AutoJoinDomain` record with a `PENDING` status and a unique `verificationCode` that must be used to verify domain ownership.

---

### `POST /:id/domains/:domainMappingId/verify`

Verifies ownership of a domain by checking for a specific DNS TXT record.

*   **Permissions:** Requires `'organization:update'` permission.
*   **URL Params:**
    *   `:id`: The organization ID.
    *   `:domainMappingId`: The ID of the `AutoJoinDomain` record.
*   **Success Response (`200`):** The updated domain object with `status: 'VERIFIED'`.
*   **Error Response (`400`):** If the DNS TXT record is not found or does not match.

*   **Behavior:**
    1.  Looks up the `AutoJoinDomain` record by its `domainMappingId`.
    2.  Performs a DNS TXT record lookup for the domain.
    3.  Checks if any TXT record matches the format `stagehand-verification=<verificationCode>`.
    4.  If a match is found, the domain's status is updated to `VERIFIED`.

---

### `DELETE /:id/domains/:domainMappingId`

Deletes an auto-join domain configuration.

*   **Permissions:** Requires `'organization:update'` permission.
*   **URL Params:**
    *   `:id`: The organization ID.
    *   `:domainMappingId`: The ID of the `AutoJoinDomain` record to delete.
*   **Success Response (`204`):** No content.
*   **Behavior:** Removes the `AutoJoinDomain` record from the database. 
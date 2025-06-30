# API Reference: Companies

This document provides a detailed breakdown of the company-related API endpoints.

**File:** `packages/api/src/routes/company.js`
**Base Path:** `/api/v1/companies`

---

## Overview

Manages companies, which are the primary tenants within an organization. In an enterprise account, an organization can have multiple companies. For standard accounts, a single company typically exists by default. These routes handle the full CRUD lifecycle for companies and company-specific auto-join domain rules.

**Middleware:** All routes in this file are protected by the `protect` middleware.

## Permissions Helpers

*   `hasPermission(user, requiredRoles, entityType, entityId)`: Checks if the user has the required role on a specific entity.
*   `getVisibleResourceIds(user, entityType)`: A utility from `src/utils/permissions.js` that traverses the user's memberships to return an array of all IDs for a given `entityType` (e.g., 'company') that the user has at least `READER` access to. This is essential for building list views that respect user permissions.

---

## Endpoints

### `GET /`

Retrieves a list of all companies the current user has access to.

*   **Permissions:** Implicitly handled by the helper function.
*   **Success Response (`200`):** An array of company objects.
*   **Behavior:** Uses the `getVisibleResourceIds` helper to find all companies the user is a member of (either directly or by being a member of the parent organization) and returns them.

---

### `GET /:id`

Retrieves a single company by its ID.

*   **Permissions:** Requires `READER`, `EDITOR`, or `ADMIN` role on the company.
*   **Success Response (`200`):** The full company object.

---

### `POST /`

Creates a new company within an organization.

*   **Permissions:** Requires `ADMIN` role on the parent `organizationId`.
*   **Body (`application/json`):**
    *   `name` (string, required): The name of the new company.
    *   `description` (string, optional): A description for the company.
    *   `organizationId` (string, required): The ID of the organization this company will belong to.
*   **Success Response (`201`):** The newly created company object.
*   **Behavior:** Creates the new company record linked to the specified organization.

---

### `PUT /:id`

Updates a company's details.

*   **Permissions:** Requires `ADMIN` role on the company.
*   **Body (`application/json`):**
    *   `name` (string, optional): The new name.
    *   `description` (string, optional): The new description.
*   **Success Response (`200`):** The updated company object.
*   **Behavior:** Updates the `name` and/or `description` for the specified company.

---

### `DELETE /:id`

Deletes a company.

*   **Permissions:** Requires `ADMIN` role on the company.
*   **Success Response (`204`):** No content.
*   **Behavior:** Deletes the company record. Note: This may fail if there are database constraints (e.g., existing teams or projects that belong to the company) that prevent deletion.

---

## Endpoints (Auto-Join Domains)

These endpoints function identically to the organization-level auto-join routes but are scoped to a specific company, allowing for more granular control in multi-company setups.

*   `GET /:id/domains`: Gets all auto-join domains for the company. (Requires membership in the hierarchy).
*   `POST /:id/domains`: Adds a new auto-join domain for the company. (Requires Company `ADMIN` role).
*   `POST /:id/domains/:domainMappingId/verify`: Verifies a domain for the company via DNS. (Requires Company `ADMIN` role).
*   `DELETE /:id/domains/:domainMappingId`: Deletes a domain configuration for the company. (Requires Company `ADMIN` role). 
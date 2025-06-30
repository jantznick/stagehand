# API Reference: Relationships

This document provides a detailed breakdown of the project relationship-related API endpoints.

**File:** `packages/api/src/routes/relationships.js`
**Base Path:** `/api/v1/relationships`

---

## Overview

Manages the relationships (dependencies) between different projects. These relationships are the "edges" in the architecture dependency graph visualization. All operations are scoped to a specific company, ensuring that dependency graphs do not cross company boundaries.

**Middleware:** All routes in this file are protected by a custom middleware `canEditCompanyResources`. This middleware ensures that:
1.  A `companyId` is provided as a query parameter for all requests.
2.  The authenticated user has `ADMIN` or `EDITOR` permissions on that company.

---

## Endpoints

### `POST /`

Creates a new relationship (dependency) between two projects.

*   **Permissions:** Handled by the `canEditCompanyResources` middleware.
*   **Query Params:**
    *   `companyId` (string, required): The ID of the company to which both projects belong.
*   **Body (`application/json`):**
    *   `sourceProjectId` (string, required): The ID of the project that has the dependency.
    *   `targetProjectId` (string, required): The ID of the project that is being depended on.
    *   `type` (string, required): The type of relationship (e.g., `'API_CALL'`, `'SHARED_LIBRARY'`).
    *   `description` (string, optional): A description of the dependency.
*   **Success Response (`201`):** The new `ProjectRelationship` object.
*   **Error Response (`409`):** If the relationship already exists.

*   **Behavior:**
    1.  Verifies that both the source and target projects exist.
    2.  Verifies that both projects belong to the `companyId` specified in the query parameter.
    3.  Creates the `ProjectRelationship` record.

---

### `DELETE /:id`

Deletes a project relationship.

*   **Permissions:** Handled by the `canEditCompanyResources` middleware.
*   **URL Params:**
    *   `:id`: The ID of the `ProjectRelationship` to delete.
*   **Query Params:**
    *   `companyId` (string, required): The ID of the company to which the projects belong.
*   **Success Response (`204`):** No content.
*   **Behavior:**
    1.  Finds the relationship by its ID.
    2.  Verifies that the relationship belongs to a project within the specified `companyId`.
    3.  Deletes the `ProjectRelationship` record. 
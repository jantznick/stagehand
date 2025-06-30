# API Reference: Teams

This document provides a detailed breakdown of the team-related API endpoints.

**File:** `packages/api/src/routes/teams.js`
**Base Path:** `/api/v1/teams`

---

## Overview

Manages teams, which are groups of users within a company that typically own projects. This is the final layer of the core hierarchy before the `Project` level.

**Middleware:** All routes in this file are protected by the `protect` middleware.

---

## Endpoints

### `GET /`

Retrieves a list of all teams the current user has access to.

*   **Permissions:** Implicitly handled by the `getVisibleResourceIds` helper function.
*   **Success Response (`200`):** An array of team objects.
*   **Behavior:** Uses the `getVisibleResourceIds` helper to find all teams the user is a member of (either directly or through parent company/organization membership) and returns them.

---

### `GET /:id`

Retrieves a single team by its ID, including a list of its associated projects.

*   **Permissions:** Requires `READER`, `EDITOR`, or `ADMIN` role on the team.
*   **Success Response (`200`):** The team object, with a `projects` array included.
*   **Behavior:** Fetches the team's details and populates the `projects` field with all projects that belong to this team.

---

### `POST /`

Creates a new team within a company.

*   **Permissions:** Requires `ADMIN` or `EDITOR` role on the parent `companyId`, **or** `ADMIN` role on the company's parent organization. This allows org-level admins to manage teams throughout their organization.
*   **Body (`application/json`):**
    *   `name` (string, required): The name of the new team.
    *   `description` (string, optional): A description for the team.
    *   `companyId` (string, required): The ID of the company this team will belong to.
*   **Success Response (`201`):** The newly created team object.
*   **Behavior:**
    1.  Creates the new team record.
    2.  **Automatic Membership:** Automatically creates a `Membership` record that makes the user who created the team an `ADMIN` of that team. This ensures the team is immediately manageable by its creator.

---

### `PUT /:id`

Updates a team's details.

*   **Permissions:** Requires `ADMIN` role on the team.
*   **Body (`application/json`):**
    *   `name` (string, optional): The new name for the team.
    *   `description` (string, optional): The new description for the team.
*   **Success Response (`200`):** The updated team object.

---

### `DELETE /:id`

Deletes a team.

*   **Permissions:** Requires `ADMIN` role on the team.
*   **Success Response (`204`):** No content.
*   **Behavior:** Deletes the team record. This can fail if child resources (like projects) exist. 
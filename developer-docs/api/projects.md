# API Reference: Projects (Applications)

This document provides a detailed breakdown of the project-related API endpoints. "Projects" are the core entities in the Stagehand developer catalog and are often referred to as "Applications" in the UI and business logic.

**File:** `packages/api/src/routes/projects.js`
**Base Path:** `/api/v1/projects`

---

## Overview

Manages projects, which represent the actual software applications, services, or libraries that are being tracked. This is the most detailed and feature-rich part of the API, containing numerous endpoints for managing a project's rich metadata.

**Middleware:** All routes in this file are protected by the `protect` middleware.

---

## Endpoints (Core)

### `GET /`

Retrieves a list of all projects the current user has access to.

*   **Permissions:** Implicitly handled by `getVisibleResourceIds`.
*   **Success Response (`200`):** An array of project objects.
*   **Behavior:** Uses the `getVisibleResourceIds` helper to find and return all projects the user has visibility on.

---

### `GET /:id`

Retrieves a single project by its ID with extensive, enriched details.

*   **Permissions:** Requires `READER`, `EDITOR`, or `ADMIN` role on the project.
*   **Success Response (`200`):** A single, detailed project object.

*   **Behavior:**
    *   Fetches the project and includes its full hierarchy (`team`, `company`, `organization`), `technologies`, and `dependencies`.
    *   **Contact Enrichment:** It also fetches the project's `contacts` and then cross-references them with the `User` and `Membership` tables. This allows the response to include details on whether a contact is also a registered Stagehand user and what their specific role is on this project, providing a complete picture of project ownership.

---

### `POST /`

Creates a new project within a team.

*   **Permissions:** Requires `ADMIN` or `EDITOR` role on the parent `teamId`.
*   **Body (`application/json`):**
    *   `name` (string, required): The name of the new project.
    *   `description` (string, optional): A description for the project.
    *   `teamId` (string, required): The ID of the team this project will belong to.
*   **Success Response (`201`):** The newly created project object.
*   **Behavior:** Creates the project and makes the creator an `ADMIN` of the new project via an automatic `Membership` record.

---

### `PUT /:id`

Updates the core metadata for a project.

*   **Permissions:** Requires `ADMIN` or `EDITOR` role on the project.
*   **Body (`application/json`):** Contains numerous optional fields for project metadata, including:
    *   `name`, `description`, `applicationUrl`, `repositoryUrl`, `ciCdPipelineUrl`, `deploymentStatus`, `version`, and more.
*   **Success Response (`200`):** The updated project object.

---

### `DELETE /:id`

Deletes a project.

*   **Permissions:** Requires `ADMIN` role on the project.
*   **Success Response (`204`):** No content.
*   **Behavior:** Deletes the project record and its associated relations.

---

## Endpoints (Contact Management)

### `GET /:id/members`

Retrieves a list of all users in the parent organization who could potentially be added as contacts to the project. This is used to populate dropdowns in the UI.

*   **Permissions:** Requires `READER`, `EDITOR`, or `ADMIN` role on the project.
*   **Success Response (`200`):** An array of user objects.
*   **Behavior:** Fetches all users in the project's parent organization and filters out any who are already contacts on the project to prevent duplicates.

---

### `POST /:id/contacts`

Adds a contact to a project.

*   **Permissions:** Requires `ADMIN` or `EDITOR` role on the project.
*   **Body (`application/json`):**
    *   `contactId` (string, required): The ID of the generic `Contact` record to add.
    *   `contactType` (string, required): The role of this contact on the project (e.g., 'Technical Lead', 'Product Manager').
*   **Success Response (`201`):** The new `ProjectContact` link object.
*   **Behavior:** Creates a `ProjectContact` record to link the generic `Contact` to the `Project`.

---

### `PUT /:id/contacts/:contactId`

Updates a contact's role on a project.

*   **Permissions:** Requires `ADMIN` or `EDITOR` role on the project.
*   **Body (`application/json`):**
    *   `contactType` (string, required): The new role for the contact.
*   **Success Response (`200`):** The updated `ProjectContact` object.
*   **Behavior:** Updates the `contactType` field on the `ProjectContact` junction record.

---

### `DELETE /:id/contacts/:contactId`

Removes a contact from a project.

*   **Permissions:** Requires `ADMIN` or `EDITOR` role on the project.
*   **Success Response (`204`):** No content.
*   **Behavior:** Deletes the `ProjectContact` link record.

---

## Endpoints (Technology Management)

### `POST /:id/technologies`

Links a technology (e.g., 'React', 'Node.js') to a project.

*   **Permissions:** Requires `ADMIN` or `EDITOR` role on the project.
*   **Body (`application/json`):**
    *   `technologyId` (string, required): The ID of the technology to add.
    *   `version` (string, optional): The version of the technology being used.
*   **Success Response (`201`):** The new `ProjectTechnology` object.
*   **Behavior:** Creates a `ProjectTechnology` record to link the `Technology` to the `Project`.

---

### `DELETE /:id/technologies/:technologyId`

Removes a technology from a project.

*   **Permissions:** Requires `ADMIN` or `EDITOR` role on the project.
*   **Success Response (`204`):** No content.
*   **Behavior:** Deletes the `ProjectTechnology` link record.

---

## Endpoints (Security Tool Integration)

### `POST /:id/link-security-tool`

Links a project to a specific security tool configuration that has been set up at the company level.

*   **Permissions:** Requires `ADMIN` or `EDITOR` role on the project.
*   **Body (`application/json`):**
    *   `toolConfigurationId` (string, required): The ID of the `ToolConfiguration` to link.
    *   `projectMappings` (object, required): A JSON object that maps project identifiers needed by the external tool (e.g., `{ "repository": "owner/repo" }` for GitHub).
*   **Success Response (`200`):** The created or updated `SecurityToolProjectLink` object.
*   **Behavior:** Creates or updates the `SecurityToolProjectLink` record. This connection is essential for the system to know where to pull security findings from for this project.

---

### `POST /:id/sync-findings`

Triggers a manual synchronization of security findings from a linked external tool.

*   **Permissions:** Requires `ADMIN` or `EDITOR` role on the project.
*   **Body (`application/json`):**
    *   `toolType` (string, required): The type of tool to sync from (e.g., `'GITHUB'`).
*   **Success Response (`200`):** A summary object, e.g., `{ "message": "Sync completed", "newFindings": 5, "updatedFindings": 2 }`.

*   **Behavior:**
    1.  Identifies the appropriate `SecurityToolProjectLink` for the given `toolType`.
    2.  Calls a specific utility function (e.g., `syncGitHubFindings` from `src/utils/findings.js`) which contains the business logic to:
        a. Connect to the external tool's API.
        b. Fetch the security findings.
        c. Normalize the data into the Stagehand `Finding` format.
        d. Save the findings to the database, linking them to this project.
    3.  This is a critical ASPM function. 
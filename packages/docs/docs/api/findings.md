# API Reference: Findings

This document provides a detailed breakdown of the security finding-related API endpoints.

**File:** `packages/api/src/routes/findings.js`
**Base Path:** `/api/v1/projects/:projectId/findings`

---

## Overview

Manages security findings that have been imported from integrated tools like Snyk or GitHub Code Scanning. Findings represent specific vulnerabilities or weaknesses discovered in a project.

The creation of findings is handled by the background synchronization jobs initiated from the [Security Tools](./security-tools.md) or [Projects](./projects.md) endpoints. These routes are for reading and managing the findings after they have been imported.

**Note on Routing:** Uniquely, the routes in this file are registered under the `/api/v1/projects` path in the main `index.js`. Therefore, all routes here are relative to a specific project.

**Middleware:** All routes in this file are protected by the `protect` middleware.

---

## Endpoints

### `GET /`

Retrieves all findings for a specific project.

*   **URL:** `/api/v1/projects/:projectId/findings`
*   **Permissions:** Requires `READER`, `EDITOR`, or `ADMIN` role on the parent project.
*   **Success Response (`200`):** An array of `Finding` objects.
*   **Behavior:**
    1.  Checks if the user has permission to view the specified `projectId`.
    2.  Fetches all findings linked to that project from the database.
    3.  Includes the details of the associated `Vulnerability` for each finding, providing more context about the weakness (e.g., CVE ID, description).
    4.  Returns the findings, ordered by the most recently seen. 
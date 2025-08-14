# API Reference: Findings

This document provides a detailed breakdown of the security finding-related API endpoints.

**File:** `packages/api/src/routes/findings.js`
**Base Path:** `/api/v1/projects/:projectId/findings`

---

## Overview

Manages security findings that have been imported from integrated tools like Snyk or GitHub Code Scanning, or uploaded in bulk. Findings represent specific vulnerabilities or weaknesses discovered in a project.

The creation of findings is handled by background synchronization jobs or the bulk upload worker. These routes are for reading and managing the findings after they have been imported.

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

### `POST /bulk-upload`

Initiates a bulk upload job for security findings from a CSV file.

*   **URL:** `/api/v1/projects/:projectId/findings/bulk-upload`
*   **Permissions:** Requires `EDITOR` or `ADMIN` role on the parent project.
*   **Request Body:** `multipart/form-data` with a single field `file` containing the CSV.
*   **Success Response (`202`):** A `BulkUploadJob` object.
*   **Behavior:**
    1.  Checks if the user has permission to edit the specified `projectId`.
    2.  Uses `multer` to handle the file upload, saving the file to a persistent volume.
    3.  Creates a `BulkUploadJob` record in the database with a `PENDING` status.
    4.  Returns the newly created job object to the client.
    5.  The separate `worker` process will pick up this job for asynchronous processing.

### `GET /bulk-upload/:jobId`

Retrieves the status of a specific bulk upload job.

*   **URL:** `/api/v1/projects/findings/bulk-upload/:jobId` (Note: `projectId` is not in the path but is used for permission checks).
*   **Permissions:** Requires `READER`, `EDITOR`, or `ADMIN` role on the project associated with the job.
*   **Success Response (`200`):** A `BulkUploadJob` object.
*   **Behavior:**
    1.  Fetches the `BulkUploadJob` by its `jobId`.
    2.  Checks if the user has permission to view the `projectId` associated with the job.
    3.  Returns the full job object, which includes the current `status` and `errorReport` if applicable.
# API Reference: Hierarchy

This document provides a detailed breakdown of the hierarchy-related API endpoints.

**File:** `packages/api/src/routes/hierarchy.js`
**Base Path:** `/api/v1/hierarchy`

---

## Overview

Provides the data necessary to construct the main navigational tree (the sidebar) for the authenticated user. The logic in this file is complex, as it's responsible for calculating the exact set of resources a user is allowed to see and then assembling them into a nested structure.

**Middleware:** All routes in this file are protected by the `protect` middleware.

## Key Concepts

The `GET /` endpoint uses a sophisticated, multi-step process to build a "pruned" hierarchy tree that only contains items a user is allowed to see.

1.  **Direct Memberships**: It begins by fetching the user's direct memberships.
2.  **Find Descendants**: It then finds all children/grandchildren of those memberships. This determines the full set of resources the user has permission to access.
3.  **Find Ancestors**: It then works upwards from all accessible resources to find their parents. This is done purely to provide UI context for the navigation tree.
4.  **Batch Fetch**: It fetches all the required Organization, Company, Team, and Project records in a single, efficient batch.
5.  **Reconstruct Tree**: Finally, it rebuilds the nested tree structure in memory from the fetched records.

---

## Endpoints

### `GET /`

Retrieves the complete, nested hierarchy of all resources visible to the current user.

*   **Permissions:** Implicitly handled by the user's session.
*   **Success Response (`200`):** An array of top-level `Organization` objects. Each object is richly nested with its visible `companies`, which contain visible `teams`, which in turn contain visible `projects`.
    *   Example snippet:
        ```json
        [
          {
            "id": "org_1",
            "name": "My Organization",
            "type": "organization",
            "companies": [
              {
                "id": "comp_a",
                "name": "Default Company",
                "type": "company",
                "teams": [
                  {
                    "id": "team_x",
                    "name": "Frontend Team",
                    "type": "team",
                    "isMember": true,
                    "projects": [
                      {
                        "id": "proj_abc",
                        "name": "WebApp",
                        "type": "project",
                        "isMember": false
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
        ```
*   **Behavior:** Executes the complex process described in the "Key Concepts" section to build and return the user's unique navigation tree.

---

### `GET /:resourceType/:resourceId/projects`

Retrieves a flat list of all projects that exist under a given resource in the hierarchy.

*   **URL Params:**
    *   `:resourceType`: The type of the parent resource (`'organization'`, `'company'`, `'team'`).
    *   `:resourceId`: The ID of the parent resource.
*   **Permissions:** Requires `READER`, `EDITOR`, or `ADMIN` role on the parent resource.
*   **Success Response (`200`):** A flat array of `Project` objects, each containing `id`, `name`, and `repositoryUrl`.
*   **Behavior:** Uses the `getDescendants` utility to efficiently find all project IDs under the given resource and then fetches their details. 
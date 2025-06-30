# API Reference: Technologies

This document provides a detailed breakdown of the technology-related API endpoints.

**File:** `packages/api/src/routes/technologies.js`
**Base Path:** `/api/v1/technologies`

---

## Overview

Manages the `Technology` entities, which are used as a lookup table for tagging projects with the languages, frameworks, or tools they use. The primary purpose of these endpoints is to provide a search/autocomplete feature for the frontend.

**Middleware:** All routes in this file are protected by the `protect` middleware.

---

## Endpoints

### `GET /`

Searches for technologies by name.

*   **Permissions:** Accessible to any authenticated user.
*   **Query Params:**
    *   `search` (string, optional): A search term to filter technologies by name. If omitted, it returns the first 10 technologies.
*   **Success Response (`200`):** An array of `Technology` objects, limited to a maximum of 10 results.

*   **Behavior:**
    *   Performs a case-insensitive "contains" search on the `name` field of the `Technology` table.
    *   Limits the results to 10 to ensure good performance for UI autocomplete components. 
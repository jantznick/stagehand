# API Reference: Findings

This document provides a detailed breakdown of the security finding-related API endpoints.

**File:** `packages/api/src/routes/findings.js`
**Base Path:** `/api/v1/projects/:projectId/findings`

---

## Overview

Manages security findings from multiple sources including:
- **DAST Scanning**: Vulnerabilities discovered by automated web application testing (OWASP ZAP)
- **SAST/SCA Tools**: Code vulnerabilities from Snyk, GitHub Dependabot, etc.
- **Manual Imports**: Manually imported vulnerability data

Findings represent specific vulnerabilities or weaknesses discovered in a project. Each finding is linked to a `Vulnerability` record that contains the canonical vulnerability information.

### Finding Sources

| Source | Description | URL Association |
|--------|-------------|-----------------|
| `Stagehand DAST (OWASP ZAP)` | DAST scan results | ✅ Specific URL where vulnerability was found |
| `GitHub Dependabot` | Dependency vulnerabilities | ❌ No URL (code-based) |
| `Snyk` | Code and dependency vulnerabilities | ❌ No URL (code-based) |

The creation of findings is handled by:
- **DAST Scans**: Automatic processing when scans complete via [DAST Scanning API](./dast-scans.md)
- **Integration Syncs**: Background synchronization jobs from [Security Tools](./security-tools.md) or [Projects](./projects.md) endpoints

**Note on Routing:** Uniquely, the routes in this file are registered under the `/api/v1/projects` path in the main `index.js`. Therefore, all routes here are relative to a specific project.

**Middleware:** All routes in this file are protected by the `protect` middleware.

---

## Data Model

### Finding Object

```json
{
  "id": "finding_12345",
  "status": "NEW",
  "projectId": "proj_789",
  "vulnerabilityId": "CVE-2023-1234",
  "source": "Stagehand DAST (OWASP ZAP)",
  "url": "https://example.com/login?param=vulnerable",
  "metadata": {
    "scanExecutionId": "scan_456",
    "provider": "OWASP_ZAP",
    "confidence": "Medium",
    "zapAlertId": "1",
    "pluginId": "10021",
    "param": "username",
    "attack": "<script>alert(1)</script>",
    "evidence": "The page contains the following script content..."
  },
  "firstSeenAt": "2024-07-02T20:45:00Z",
  "lastSeenAt": "2024-07-02T20:45:00Z",
  "resolvedAt": null,
  "vulnerability": {
    "id": "vuln_12345",
    "vulnerabilityId": "XSS-LOGIN-001",
    "source": "Stagehand DAST (OWASP ZAP)",
    "type": "DAST",
    "title": "Cross Site Scripting (Reflected)",
    "description": "Reflected Cross Site Scripting occurs when...",
    "severity": "HIGH",
    "cvssScore": null,
    "remediation": "Ensure that all user input is properly encoded...",
    "references": {
      "urls": ["https://owasp.org/www-project-top-ten/2017/A7_2017-Cross-Site_Scripting_(XSS)"]
    }
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique finding identifier |
| `status` | enum | Finding status: `NEW`, `TRIAGED`, `IN_PROGRESS`, `RESOLVED`, `IGNORED` |
| `projectId` | string | Associated project ID |
| `vulnerabilityId` | string | Canonical vulnerability identifier |
| `source` | string | Descriptive source of the finding |
| `url` | string? | **URL where vulnerability was found (DAST only)** |
| `metadata` | object | Source-specific metadata and context |
| `firstSeenAt` | datetime | When finding was first discovered |
| `lastSeenAt` | datetime | When finding was last seen/updated |
| `resolvedAt` | datetime? | When finding was marked as resolved |
| `vulnerability` | object | Associated vulnerability details |

### URL Field Usage

The `url` field behavior varies by finding source:

- **DAST Findings**: Contains the specific URL where the vulnerability was discovered
  - Example: `https://example.com/login?param=vulnerable`
  - Falls back to scan target URL if specific URL unavailable
- **Code-based Findings**: `null` (GitHub Dependabot, Snyk)
  - These represent code vulnerabilities, not web endpoint issues

---

## Endpoints

### `GET /`

Retrieves all findings for a specific project.

*   **URL:** `/api/v1/projects/:projectId/findings`
*   **Permissions:** Requires `'project:read'` permission on the parent project.
*   **Success Response (`200`):** An array of `Finding` objects.
*   **Behavior:**
    1.  Checks if the user has permission to view the specified `projectId`.
    2.  Fetches all findings linked to that project from the database.
    3.  Includes the details of the associated `Vulnerability` for each finding, providing more context about the weakness (e.g., CVE ID, description).
    4.  Returns the findings, ordered by the most recently seen. 
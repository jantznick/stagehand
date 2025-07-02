# Frontend Documentation: Findings Components

This document provides a breakdown of the components used for displaying security findings.

## Overview

The findings components are responsible for rendering security findings from multiple sources:
- **DAST Scanning**: Web application vulnerabilities discovered by OWASP ZAP
- **SAST/SCA Tools**: Code vulnerabilities from Snyk, GitHub Dependabot, etc.
- **Manual Imports**: Manually imported vulnerability data

They provide both a high-level visual summary and a detailed, filterable list of all vulnerabilities for a given application, with special handling for URL-based findings from DAST scans.

---

## Component Breakdown

### `FindingList.jsx`

*   **Rendered in:** `ApplicationDetails.jsx`.
*   **Purpose:** The primary component for displaying a comprehensive, filterable list of all security findings for the current project.
*   **Behavior:**
    *   It uses the `useFindingStore` to fetch all findings for the project (`fetchFindings`).
    *   It renders the findings in a table with columns for:
        *   **Severity**: Color-coded badges (Critical, High, Medium, Low, Info)
        *   **Vulnerability Name**: Finding title/name
        *   **Source**: Finding source (e.g., "Stagehand DAST (OWASP ZAP)", "GitHub Dependabot")
        *   **URL**: For DAST findings, shows the specific URL where vulnerability was found
        *   **File Path**: For code-based findings (SAST/SCA), shows affected file path
        *   **Status**: Finding triage status (NEW, TRIAGED, etc.)
        *   **Last Seen**: When finding was last detected
    *   It includes controls for filtering the list by severity (`Critical`, `High`, etc.) and for searching by name.
    *   It automatically refreshes when new DAST scans complete.
    *   When a user clicks on a finding in the table, it opens the `<FindingDetailsModal />` to show more information. This is managed by the `useUIStore`.

#### URL Display Logic

The FindingList component intelligently displays location information based on finding source:

*   **DAST Findings**: Shows the specific URL where the vulnerability was discovered
    *   Example: `https://example.com/login?param=vulnerable`
    *   Links are clickable to open the vulnerable page in a new tab
*   **Code-based Findings**: Shows file path information from metadata
    *   Example: `package.json` or `src/components/Login.jsx`
    *   No URL column displayed for these findings

### `FindingsSeverityChart.jsx`

*   **Rendered in:** `ApplicationDetails.jsx`.
*   **Purpose:** To provide a quick, at-a-glance visual summary of the security posture of an application.
*   **Behavior:**
    *   It receives the list of findings as a prop (from the `useFindingStore`, fetched by the parent component).
    *   It processes the findings to count the number of vulnerabilities for each severity level (Critical, High, Medium, Low).
    *   It uses the [Recharts](https://recharts.org/) library to render a bar chart visualizing these counts.

### `FindingDetailsModal.jsx`

*   **Purpose:** A modal window that displays the full, detailed information for a single security finding.
*   **Behavior:**
    *   It is opened by the `useUIStore` when a user clicks on a finding in the `FindingList`.
    *   It receives the data for the selected finding via the `modalData` property of the `useUIStore`.
    *   It displays all available details about the vulnerability, such as its description, CWEs, CVEs, remediation advice, and a link to the original finding in the source tool. 
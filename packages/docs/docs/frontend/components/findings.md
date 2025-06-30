# Frontend Documentation: Findings Components

This document provides a breakdown of the components used for displaying security findings.

## Overview

The findings components are responsible for rendering the security findings that have been imported from integrated tools like Snyk. They provide both a high-level visual summary and a detailed, filterable list of all vulnerabilities for a given application.

---

## Component Breakdown

### `FindingList.jsx`

*   **Rendered in:** `ApplicationDetails.jsx`.
*   **Purpose:** The primary component for displaying a comprehensive, filterable list of all security findings for the current project.
*   **Behavior:**
    *   It uses the `useFindingStore` to fetch all findings for the project (`fetchFindings`).
    *   It renders the findings in a table, with columns for severity, vulnerability name, file path, etc.
    *   It includes controls for filtering the list by severity (`Critical`, `High`, etc.) and for searching by name.
    *   When a user clicks on a finding in the table, it opens the `<FindingDetailsModal />` to show more information. This is managed by the `useUIStore`.

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
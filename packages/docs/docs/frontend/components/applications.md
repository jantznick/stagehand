# Frontend Documentation: Application Components

This document provides a breakdown of the components used for displaying the details of a single application (referred to as a "Project" in the backend and hierarchy).

## Overview

Application components are used to render a detailed view of a single software project. They are primarily displayed within the `DashboardPage` when a user selects a project from the sidebar. These components allow users to view and manage application metadata, link source code repositories, connect security tools, and view security findings.

---

## Component Breakdown

### `ApplicationDetails.jsx`

*   **Rendered in:** `DashboardPage` (when a project is the `selectedItem`).
*   **Purpose:** The main container component for viewing all information about a single application.
*   **Behavior:**
    *   It receives the `project` object as a prop.
    *   It renders the project's name, description, and other metadata.
    *   It composes several other sub-components to handle specific pieces of functionality:
        *   It renders the `<LinkRepositoryControl />` to manage the SCM repository link.
        *   It renders a `<LinkSecurityToolControl />` for each type of security tool (e.g., SAST, SCA) to manage security tool connections.
        *   It renders the `<FindingList />` component to display the security findings associated with the project.

### `LinkRepositoryControl.jsx`

*   **Rendered in:** `ApplicationDetails.jsx`.
*   **Purpose:** A control for managing the link to a source code repository.
*   **Behavior:**
    *   If the project is already linked to a repository, it displays the repository URL and an "Unlink" button.
    *   If the project is not linked, it displays a "Link Repository" button.
    *   Clicking the "Link Repository" button opens the `<SelectRepositoryModal />`.
    *   Clicking "Unlink" calls the `unlinkRepository` action on the `useProjectStore`.

### `SelectRepositoryModal.jsx`

*   **Purpose:** A modal window for selecting a repository from an available SCM integration (e.g., GitHub).
*   **Behavior:**
    *   It fetches the available SCM integrations from `useIntegrationStore`.
    *   For the selected integration, it fetches the list of repositories the user has granted access to.
    *   It displays a searchable list of repositories.
    *   When a user selects a repository, it calls the `linkRepository` action on the `useProjectStore` to create the association.

### `LinkSecurityToolControl.jsx`

*   **Rendered in:** `ApplicationDetails.jsx`.
*   **Purpose:** A control for managing the link to a specific security tool project (e.g., a Snyk project). It is rendered for each supported tool type (`SCA`, `SAST`, etc.).
*   **Behavior:**
    *   It checks if the application is already linked to a tool of its specific type.
    *   If linked, it displays the name of the external project and provides options to "Sync" or "Unlink".
    *   If not linked, it displays a "Link Tool" button, which opens the `<SelectSecurityToolProjectModal />`.
    *   "Sync" calls the `triggerSnykSync` action on `useIntegrationStore`.

### `SelectSecurityToolProjectModal.jsx`

*   **Purpose:** A modal window for selecting a project from an available security tool integration (e.g., Snyk).
*   **Behavior:**
    *   It fetches the available security tool integrations from `useIntegrationStore`.
    *   For the selected integration, it fetches the list of available projects from the external tool's API (e.g., Snyk projects).
    *   It displays a searchable list of these external projects.
    *   When a user selects a project, it calls the appropriate linking action on the `useIntegrationStore` (e.g., `linkSnykProject`).

### `RepoStats.jsx`

*   **Rendered in:** `ApplicationDetails.jsx`.
*   **Purpose:** A small component intended to display statistics about the linked repository.
*   **Behavior:** In its current form, it's mostly a placeholder for future functionality like displaying lines of code, primary language, etc.

### `DastScanManager.jsx`

*   **Rendered in:** `ApplicationDetails.jsx` (Security tab).
*   **Purpose:** Manages DAST (Dynamic Application Security Testing) scanning functionality for web applications.
*   **Key Features:**
    *   **Scan Launching**: "Launch DAST Scan" button opens customization modal
    *   **Real-time Monitoring**: Live progress updates with polling every 5 seconds
    *   **Scan History**: Displays 5 most recent scans with "View All" modal
    *   **Cancellation**: Cancel running scans with confirmation
*   **Behavior:**
    *   Integrates with project security findings workflow
    *   Automatically refreshes findings when scans complete
    *   Shows real-time progress bars and status indicators
    *   Handles scan lifecycle from launch to completion
*   **State Management:** Uses local state for UI and integrates with project/finding stores

#### DAST Scan Customization

The scan launch modal provides several customization options:

*   **Scan Intensity:**
    *   `QUICK` (~5-10 minutes): Basic passive scan
    *   `STANDARD` (~15-30 minutes): Active scan with moderate depth  
    *   `THOROUGH` (~30+ minutes): Comprehensive scan with deep crawling

*   **Crawl Depth:**
    *   `SHALLOW` (1-2 levels): Limited site exploration
    *   `MEDIUM` (3-5 levels): Moderate site coverage
    *   `DEEP` (unlimited): Complete site discovery

*   **Additional Options:**
    *   Maximum duration (15 minutes to 2 hours)
    *   Include subdomains checkbox
    *   URL confirmation and validation

### `ScanDetailsModal.jsx`

*   **Rendered by:** `DastScanManager.jsx` (when scan row is clicked).
*   **Purpose:** Displays comprehensive details about a completed or running DAST scan.
*   **Key Features:**
    *   **Tabbed Interface**: Overview, Crawled Pages, Findings tabs
    *   **Scan Overview**: Basic scan information, configuration, and summary
    *   **Crawled Pages**: All discovered URLs with CSV export functionality
    *   **Detailed Findings**: Vulnerability information with severity colors, solutions, and references
*   **Behavior:**
    *   Fetches detailed scan information via API
    *   Provides CSV export of crawled pages
    *   Shows ZAP statistics and scan configuration
    *   Displays rich vulnerability details with external references

#### Tabs Overview

**Overview Tab:**
- Scan basic information (status, duration, target URL)
- Findings summary with severity breakdown
- Scan configuration details (intensity, depth, duration)
- Discovery summary (pages crawled, domains found)

**Crawled Pages Tab:**
- Tabular display of all discovered URLs
- Columns: URL, Site, Discovery Time, Method, Status Code
- CSV export functionality with filename: `scan-crawled-pages-{scanId}.csv`
- Pagination for large result sets

**Findings Tab:**
- Detailed vulnerability information
- Severity-based color coding (Critical: red, High: orange, etc.)
- Solution and remediation guidance
- External references and OWASP links
- Technical details (CWE ID, WASC ID, confidence level) 
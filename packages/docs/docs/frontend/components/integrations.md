# Frontend Documentation: Integration Components

This document provides a breakdown of the components used for managing integrations with external tools like GitHub (SCM) and Snyk (Security Tools).

## Overview

The integration components provide the user interface for adding, viewing, and managing connections to third-party services. They are primarily rendered within the "Integrations" tab of the `SettingsPage`. They make heavy use of the `useIntegrationStore` to manage state and interact with the backend API.

---

## Component Breakdown

### `IntegrationManager.jsx`

*   **Rendered on:** The "Integrations" tab of the `SettingsPage`.
*   **Purpose:** The main dashboard for viewing and managing all SCM and Security Tool integrations for the current resource.
*   **Behavior:**
    *   Uses `useIntegrationStore` to fetch and display two lists: SCM integrations (GitHub) and Security Tool integrations (Snyk).
    *   Provides an "Add Integration" button which opens the `<AddIntegrationModal />`.
    *   For each existing integration, it provides management options, such as deleting the integration or opening other modals (e.g., `<SyncHistoryModal />`).

### `AddIntegrationModal.jsx`

*   **Purpose:** The first step in adding a new integration.
*   **Behavior:**
    *   Presents the user with a choice: "Source Code Manager (GitHub)" or "Security Tool (Snyk)".
    *   If the user chooses GitHub, it calls the `createScmIntegration` action on the `useIntegrationStore`, which starts the GitHub App installation OAuth flow.
    *   If the user chooses Snyk, it opens the `<AddSecurityToolModal />`.

### `AddSecurityToolModal.jsx`

*   **Purpose:** A form for adding a new security tool integration (e.g., Snyk).
*   **Behavior:**
    *   Provides fields for the user to enter their credentials (e.g., Snyk Organization ID and API Token).
    *   On submit, it calls the `addSecurityTool` action on the `useIntegrationStore`, which securely sends the credentials to the backend to be encrypted and stored.

### `LinkRepositoriesModal.jsx`

*   **Purpose:** Allows a user to link a Stagehand project to a specific repository from an SCM integration. This is typically accessed from the `ApplicationDetails` view.
*   **Behavior:**
    *   It uses the `useIntegrationStore` to fetch the list of available repositories from the SCM integration (e.g., GitHub).
    *   It presents a searchable dropdown of repositories.
    *   When a repository is selected, it calls the `linkRepository` action on the `useProjectStore` to associate the Stagehand project with the repository URL.

### `LinkSecurityToolProjectsModal.jsx`

*   **Purpose:** Allows a user to link a Stagehand project to a specific "project" from a security tool integration (e.g., a Snyk project).
*   **Behavior:**
    *   It uses the `useIntegrationStore` to fetch the list of available projects from the security tool (e.g., Snyk).
    *   It presents a searchable list of the external projects.
    *   When a project is selected for linking, it calls the `linkSnykProject` action on the `useIntegrationStore`.

### `SyncHistoryModal.jsx`

*   **Purpose:** Displays the recent synchronization history for a security tool integration.
*   **Behavior:**
    *   It uses the `useIntegrationStore` to fetch the sync logs for the specific integration.
    *   It renders a table showing the status (e.g., `SUCCESS`, `FAILURE`), start and end times, and number of findings imported for each sync run. 
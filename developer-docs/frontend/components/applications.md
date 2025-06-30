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
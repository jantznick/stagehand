# Frontend Documentation: Sidebar Components

This document provides a breakdown of the components that make up the main navigation sidebar.

## Overview

The sidebar is the primary navigation tool for the application. It allows users to switch between different organizational contexts (Organizations and Companies) and browse the hierarchy of teams and projects within them. The components work together, primarily using state from the `useHierarchyStore`, to render a dynamic and interactive navigation tree.

---

## Component Breakdown

### `Sidebar.jsx`

*   **Purpose:** The main container component for the entire sidebar.
*   **Behavior:**
    *   It wraps all other sidebar components.
    *   It uses the `isSidebarOpen` state from `useUIStore` to control its visibility.
    *   It includes the `<ResizeHandle />` component to allow its width to be adjusted by the user.

### `SidebarHeader.jsx`

*   **Purpose:** The top section of the sidebar containing the context switchers.
*   **Behavior:** Renders the `<OrganizationSwitcher />` and, if applicable, the `<CompanySwitcher />`.

### `OrganizationSwitcher.jsx`

*   **Purpose:** A dropdown menu that lists all organizations the user is a member of.
*   **Behavior:**
    *   It gets the list of `hierarchy` (organizations) from `useHierarchyStore`.
    *   When a new organization is selected, it calls the `setActiveOrganization` action on the `useHierarchyStore`, which triggers a re-render of the entire sidebar context.

### `CompanySwitcher.jsx`

*   **Purpose:** A dropdown menu that lists all companies within the currently active organization. This only renders for "Enterprise" account types where there can be multiple companies.
*   **Behavior:**
    *   It gets the list of companies from the `activeOrganization` object in `useHierarchyStore`.
    *   When a new company is selected, it calls the `setActiveCompany` action, which updates the `HierarchySection`.

### `HierarchySection.jsx`

*   **Purpose:** The core of the navigation tree. It displays the teams and projects for the currently active company.
*   **Behavior:**
    *   It gets the `activeCompany` from `useHierarchyStore`.
    *   It maps over the `teams` within the active company and renders a `<TeamItem>` for each one.
    *   It includes a search bar to filter the visible teams and projects.
    *   It has a "Create Team" button that opens a modal by calling an action on `useUIStore`.

### `TeamItem.jsx`

*   **Purpose:** Renders a single team in the hierarchy list. It is a collapsible "accordion" item.
*   **Behavior:**
    *   Displays the team's name.
    *   When clicked, it expands to show the list of projects within that team.
    *   It maps over the team's `projects` and renders a `<ProjectItem>` for each one.
    *   Includes a "Create Project" button that opens a modal.

### `ProjectItem.jsx`

*   **Purpose:** Renders a single project (application) in the hierarchy list, nested under a `<TeamItem>`.
*   **Behavior:**
    *   Displays the project's name.
    *   When clicked, it calls `setSelectedItem` on `useHierarchyStore` to set itself as the active item, which causes the `DashboardPage` to render its details.
    *   It uses the `useNavigate` hook from React Router to change the URL to `/dashboard/projects/:id`.

### `UserProfile.jsx`

*   **Purpose:** The component at the bottom of the sidebar that shows the current user's email and provides a menu with options for "Settings" and "Logout".
*   **Behavior:**
    *   The "Logout" option calls the `logout` action on `useAuthStore`.
    *   The "Settings" option navigates the user to the `SettingsPage` for their user profile.

### `ResizeHandle.jsx`

*   **Purpose:** A draggable vertical handle that allows the user to resize the width of the sidebar.
*   **Behavior:** It listens for mouse drag events to dynamically update the sidebar's width and saves the user's preferred width to `localStorage` so it persists between sessions. 
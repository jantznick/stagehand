# Frontend Documentation: Pages

This document provides an in-depth breakdown of the main "page" components, detailing their display function and the specific state they consume.

## Overview

Pages are the top-level components rendered by React Router. They compose layouts and are the primary consumers of state from the Zustand stores, which they use to fetch initial data and to pass down as props to their child components.

There are two main categories of pages: Authentication pages and the core application pages.

---

## Core Application Pages

These are the main pages a user interacts with after logging in.

### `DashboardPage.jsx`

*   **Route:** `/dashboard/*`
*   **Main Display Function:** To act as the primary content viewer for the application. Its content is entirely dynamic, based on the item currently selected in the navigation sidebar. It serves as a container for displaying the detailed view of the selected resource.
*   **Data Consumption:**
    *   **`useHierarchyStore`**:
        *   `selectedItem`: This is the most critical piece of state. The page uses this object to determine what to render.
        *   `isLoading`, `error`: Used to display loading spinners or error messages for the whole page.
        *   `fetchAndSetSelectedItem(type, id)`: This action is called `useEffect` to fetch the details of the selected item if it's not already fully loaded, using the ID from the URL params.
*   **Conditional Rendering:**
    *   If `isLoading` is true, it displays a simple "Loading..." message.
    *   If `error` is present, it displays a prominent error panel.
    *   If `selectedItem` is null, it displays a "Welcome to Stagehand" splash screen.
    *   If `selectedItem` is populated, it inspects `selectedItem.type` to render the appropriate detail component:
        *   `'project'`: Renders `<ApplicationDetails />` passing the `selectedItem` as a prop.
        *   `'team'`: Renders `<TeamDetails />` passing the `selectedItem` as a prop.
        *   `'company'`: Renders `<CompanyDetails />` passing the `selectedItem` as a prop.

### `SettingsPage.jsx`

*   **Route:** `/settings/:itemType/:id`
*   **Main Display Function:** To provide a comprehensive, tab-based interface for managing all configurable aspects of a specific resource (Organization, Company, Team, or Project).
*   **Data Consumption:**
    *   **`useParams`**: Reads `:itemType` and `:id` from the URL to identify the target resource.
    *   **`useHierarchyStore`**:
        *   `hierarchy`: Used to find the full object for the item being edited.
        *   `getDisplayName(type)`: Used to display the customized name for the resource type (e.g., "Company" vs. "Business Unit").
        *   `updateItem`, `removeItem`: Actions called to update the navigation tree after a successful save or delete, preventing a full page reload.
    *   **`useMembershipStore`**:
        *   `members`: Fetches the member list to determine if the current user is an `ADMIN` of the resource, which is used to conditionally render controls.
        *   `fetchMembers(type, id)`: Called `useEffect` to get the member list.
    *   **Various other stores for actions**: It calls update and delete actions from `useOrganizationStore`, `useCompanyStore`, `useTeamStore`, and `useProjectStore` based on the `itemType` from the URL.

---

## Authentication Pages

These pages handle the user login, registration, and recovery flows. They are typically simple forms that interact exclusively with the `useAuthStore`.

### `LoginPage.jsx`

*   **Route:** `/login`
*   **Main Display Function:** Renders the login form.
*   **Data Consumption:**
    *   **`useAuthStore`**: `login`, `requestMagicLink`, `isLoading`, `error`.
    *   **`useOIDCStore`**: `oidcConfiguration` (fetched via a separate `useEffect` based on URL params, if present) to dynamically display SSO login buttons.

### `RegisterPage.jsx`

*   **Route:** `/register`
*   **Main Display Function:** Renders the new user registration form.
*   **Data Consumption:**
    *   **`useAuthStore`**: `register`, `acceptInvitation`, `isLoading`, `error`.
    *   **URL Search Params**: Checks for an `invite_token` to adapt the form for the invitation acceptance flow.

### `MagicLinkVerifyPage.jsx`

*   **Route:** `/auth/magic-link/verify`
*   **Main Display Function:** A transient page that verifies a magic link token.
*   **Data Consumption:**
    *   **`useAuthStore`**: `verifyMagicLink`.
    *   **URL Search Params**: Extracts the `token` to pass to the verification action.

### `ResetPasswordPage.jsx`

*   **Route:** `/reset-password`
*   **Main Display Function:** Renders the form to set a new password.
*   **Data Consumption:**
    *   **`useAuthStore`**: `resetPassword`.
    *   **URL Search Params**: Extracts the `token`.

### `VerifyEmailPage.jsx`

*   **Route:** `/verify-email`
*   **Main Display Function:** A transient page that verifies a new user's email address.
*   **Data Consumption:**
    *   **`useAuthStore`**: `verifyEmail`.
    *   **URL Search Params**: Extracts the `token`. 
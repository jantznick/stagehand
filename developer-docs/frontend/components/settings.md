# Frontend Documentation: Settings Components

This document provides a breakdown of the components used within the `SettingsPage`.

## Overview

The settings components provide the user interface for managing the various properties of Organizations, Companies, Teams, and Projects. Each component is typically rendered within a tab on the `SettingsPage` and is responsible for a specific area of configuration, such as access control or integration management.

---

## Component Breakdown

### `AccessManagement.jsx`

*   **Rendered on:** The "Access Management" tab of the `SettingsPage`.
*   **Purpose:** Provides the primary interface for managing user memberships and roles for the currently selected resource.
*   **Behavior:**
    *   Uses `useMembershipStore` to fetch and display a list of all users with access to the resource.
    *   Shows each user's "effective role" (e.g., a user might be a `VIEWER` on a project directly, but an `ADMIN` because they are an admin of the parent company).
    *   Allows admins to:
        *   Invite new users to the resource by email.
        *   Change the role of existing members.
        *   Remove members from the resource.
        *   Resend invitations to pending users.
    *   All user-facing actions call the corresponding methods on the `useMembershipStore` (e.g., `addMember`, `updateMember`).

### `DomainManagement.jsx`

*   **Rendered on:** The "Authentication" tab of the `SettingsPage`, but only for **Organizations**.
*   **Purpose:** Allows Organization Admins to manage domains that can be used for automatic user provisioning.
*   **Behavior:**
    *   Uses `useDomainStore` to fetch and display a list of domains for the organization.
    *   Provides a form to add a new domain.
    *   Displays the verification status for each domain. If a domain is not yet verified, it shows the DNS `TXT` record that must be created.
    *   Provides a "Verify" button that calls the `verifyDomain` action on the `useDomainStore`.
    *   Allows admins to delete domains.

### `OIDCSettings.jsx`

*   **Rendered on:** The "Authentication" tab of the `SettingsPage`, but only for **Organizations**.
*   **Purpose:** Allows Organization Admins to configure OIDC settings for single sign-on (SSO).
*   **Behavior:**
    *   Uses `useOIDCStore` to fetch and display the current OIDC configuration, if it exists.
    *   Provides a comprehensive form for creating or updating the OIDC configuration, including fields for Issuer URL, Client ID, Client Secret, etc.
    *   Calls the `createOIDCConfiguration` or `updateOIDCConfiguration` actions on the `useOIDCStore` to save changes.

### `HierarchySettings.jsx`

*   **Rendered on:** The "General" tab of the `SettingsPage`, but only for **Organizations**.
*   **Purpose:** Allows Organization Admins to customize the display names for the hierarchy levels.
*   **Behavior:**
    *   Provides a form where an admin can change the singular and plural names for "Company", "Team", and "Project" (e.g., changing "Company" to "Business Unit").
    *   On submit, it calls the `updateHierarchyDisplayNames` action on the `useHierarchyStore`.
    *   The customized names are then used throughout the UI (e.g., in the sidebar and on page titles) by calling the `getDisplayName` helper function from the `useHierarchyStore`. 
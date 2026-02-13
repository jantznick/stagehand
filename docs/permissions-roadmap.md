# Permissions System: Architecture & Roadmap

This document outlines the architectural changes made to the Stagehand permissions system, its current state, and a strategic roadmap for future enhancements.

## 1. Overview of Architectural Changes (Version 2.0)

The primary goal of this initiative was to evolve the permissions system from a rigid, hardcoded Role-Based Access Control (RBAC) model to a flexible, scalable, and explicit Permission-Based Access Control (PBAC) model.

### Key Problems Addressed:

*   **Inflexibility:** The previous system used hardcoded `ADMIN`, `EDITOR`, and `READER` roles, making it impossible to define custom roles with granular permissions.
*   **Incorrectness & Performance:** The old permission-checking logic (`hasPermission`, `getVisibleResourceIds`) was inefficient, prone to N+1 query problems, and incorrectly handled permission inheritance across the resource hierarchy.
*   **Lack of Team Permissions:** There was no mechanism to assign roles or permissions to teams; permissions could only be granted to individual users.
*   **High Maintenance:** Roles were tightly coupled to the application logic, requiring code changes to modify permission rules.

### Core Architectural Changes:

1.  **Database Schema (in `packages/api/prisma/schema.prisma`):**
    *   **`Permission` Model:** A new model that defines a specific action and resource type (e.g., `action: 'project:update'`, `resourceType: 'Project'`). This is the foundation of the granular system.
    *   **`Role` Model:** A new model that represents a collection of `Permission` records. Roles are now defined in the database and are specific to an `Organization`.
    *   **Polymorphic `Membership` Model:** The `Membership` model was redesigned to be polymorphic. It can now grant a `Role` to either a `User` or a `Team` on any resource in the hierarchy (`Organization`, `Company`, `Team`, `Project`).
    *   **`TeamMember` Model:** A new simple join table to manage the relationship between `User`s and `Team`s.

2.  **Backend Logic (in `packages/api/src/utils/permissions.js`):**
    *   **`checkPermission` Utility:** A new, powerful utility that correctly and efficiently checks if a user has a required permission. It seamlessly handles:
        *   Direct user permissions.
        *   Permissions inherited from teams.
        *   Permissions inherited from parent resources in the hierarchy (e.g., an Organization role applying to a child Project).
    *   **Refactored API Routes:** All API endpoints across the application have been refactored to use the new `checkPermission` utility with explicit permission strings (e.g., `checkPermission(req.user, 'project:read', 'project', projectId)`).
    *   **Deprecated Functions:** The old, flawed utilities (`hasPermission`, `getVisibleResourceIds`, `isMemberOfCompany`) have been removed.

3.  **User Session Management (in `packages/api/src/utils/passport.js`):**
    *   The `deserializeUser` function, which hydrates the `req.user` object on every authenticated request, has been updated to include `teamMemberships`. This ensures the `checkPermission` function has all the data it needs to perform its checks without extra database lookups.

## 2. Current State & Immediate Benefits

*   **Robust Backend Foundation:** The backend is fully migrated to the PBAC model. The foundation is secure, performant, and ready for future expansion.
*   **UI Abstraction:** The UI still presents the classic "Admin", "Editor", and "Reader" roles to the end-user. However, these are now backed by the flexible `Role` and `Permission` models that are created in the database seed script, completely decoupling them from the application logic.
*   **Immediate Wins:**
    *   **Correctness:** Permissions are now checked correctly and consistently across the entire resource hierarchy.
    *   **Performance:** Inefficient N+1 query problems in authorization logic have been eliminated.
    *   **Security:** Authorization logic is centralized, explicit, and easier to audit.
    *   **Maintainability:** Adding new permissions or changing which roles have which permissions can now be done with simple database changes in the seed script, without requiring code modifications.

## 3. Future Roadmap & Expansion Plan

This new architecture unlocks a number of powerful, high-value features. The following is a proposed roadmap for building on this foundation.

### Phase 1: UI for Custom Role Management (High Impact)

*   **Goal:** Allow Organization Admins to create, edit, and delete custom roles through the application's UI.
*   **Steps:**
    1.  **API Endpoints:** Create secure CRUD endpoints for managing `Role`s and their associated `Permission`s (e.g., `POST /api/v1/organizations/:orgId/roles`).
    2.  **UI Development:** Build a new section in the "Access Management" settings page.
        *   A table to list all available roles (both default and custom-created).
        *   A form to create or edit a role, presenting a checklist of all available permissions grouped by resource (e.g., "Project Permissions", "Team Permissions").
    3.  **Update Membership UI:** Modify the "Add Member" modal to populate its role dropdown from the new Roles API endpoint, allowing users to assign their newly created custom roles.

### Phase 2: Full Team Permissions Management (High Impact)

*   **Goal:** Enable full management of team members and the assignment of roles to teams, allowing permissions to be managed at scale.
*   **Steps:**
    1.  **API Endpoints:** Create endpoints for adding/removing users from teams (`POST /api/v1/teams/:teamId/members`) and assigning roles to teams (`POST /api/v1/memberships` with a `teamId`).
    2.  **UI Development:**
        *   On the "Team Details" page, add a "Members" tab for managing which users are on a team.
        *   On the "Access Management" page for a given resource (e.g., a Project), add a new "Team Access" tab. This tab would allow a user to grant a role to an entire team (e.g., "Grant the 'Frontend Devs' team the 'Editor' role on this project").

### Phase 3: Expanding Granular Permissions (Ongoing)

*   **Goal:** Introduce more specific permissions as new application features are developed.
*   **Process:**
    1.  **Define:** When a new feature is added (e.g., managing project-specific settings), define new, granular permissions (e.g., `project:settings:update`).
    2.  **Seed:** Add these new `Permission` records to the `prisma/seed.js` script so they are available in the database.
    3.  **Expose:** Update the "Custom Role Management" UI to include these new permissions as selectable options.
    4.  **Enforce:** Protect the new API endpoints using `checkPermission` with the newly created permission strings.

### Phase 4: Audit Logging (Long-term)

*   **Goal:** Create a comprehensive audit trail for all permission-related changes to enhance security and compliance.
*   **Steps:**
    1.  **Schema:** Add an `AuditLog` model to the Prisma schema.
    2.  **Service Logic:** Implement logic (e.g., via middleware or in service layers) to record events whenever a role is created/updated, a user's role is changed, a user is added/removed from a team, or a role is granted to a team.
    3.  **UI:** Create a new "Audit Log" page in the UI for administrators to review these events. 
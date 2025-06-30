# API Reference

This document serves as a high-level table of contents for the Stagehand backend API. The API is organized by resource, with each major resource having its own detailed documentation file.

All endpoints are prefixed with `/api/v1`. All routes are protected by default and require an active session, unless otherwise specified in the detailed documentation.

## Core Hierarchy & Authentication

These documents cover the fundamental resources for tenancy, hierarchy, and user authentication.

*   **[Authentication](./api/auth.md):** User registration, login (password & magic link), logout, sessions, and OIDC.
*   **[OIDC Configuration](./api/oidc.md):** Managing OIDC SSO settings for an organization.
*   **[Organizations](./api/organizations.md):** Top-level tenant management and organization-wide settings.
*   **[Companies](./api/company.md):** Company-level management within an organization.
*   **[Teams](./api/teams.md):** Team management within a company.
*   **[Projects (Applications)](./api/projects.md):** The core application/service entity, including its rich metadata.
*   **[Memberships](./api/memberships.md):** User role management on resources.

## Supporting Resources

These documents cover other key resources that support the core hierarchy.

*   **[Invitations](./api/invitations.md):** Managing invitations for pending users.
*   **[SCM Integrations](./api/integrations.md):** Managing GitHub App installations.
*   **[Security Tool Integrations](./api/security-tools.md):** Managing connections to tools like Snyk.
*   **[Findings](./api/findings.md):** Viewing security findings for a project.
*   **[Hierarchy](./api/hierarchy.md):** Building the navigation and resource trees.
*   **[Relationships](./api/relationships.md):** Managing project dependencies for the architecture graph.
*   **[Technologies](./api/technologies.md):** Searching for technologies to tag projects with.

# Stagehand

### The Developer-First Application Security Platform

Stagehand is an Application Security Posture Management (ASPM) tool built with the developer experience at its core. It bridges the gap between development and security by acting as both a comprehensive **Developer Catalog** and a centralized **Security Findings Hub**.

Built on a flexible multi-tenant boilerplate, Stagehand is designed to give engineering and security teams a unified view of their software assets and the security posture associated with them.

---

## Core Goals

The primary objective of Stagehand is to provide a single pane of glass for application security, driven by two main functions:

1.  **A Rich Developer Catalog:**
    *   Stagehand maintains a detailed inventory of all your applications, services, and projects.
    *   It captures not just the name and description, but also critical metadata like repository URLs, deployment status, versioning, ownership, and the technologies used.
    *   This provides a single source of truth for understanding your engineering landscape.

2.  **Centralized Security Findings:**
    *   The platform is designed to integrate with a wide array of security tools (SAST, DAST, SCA, etc.).
    *   It will pull, normalize, and deduplicate findings from these tools, linking each vulnerability to the specific application in the catalog.
    *   This allows teams to see all security issues related to an application in one place, prioritized and ready for action.

---

## The Vision: Future State

Stagehand aims to become a comprehensive and indispensable tool for development and security teams. Our roadmap includes:

*   **Broad Tool Integration:** Building a library of connectors for popular security tools like Snyk, SonarQube, Dependabot, and more.
*   **Infrastructure & Host Tracking:** Expanding the catalog beyond just application code to include the hosts and infrastructure where applications run, allowing for the tracking of server-level vulnerabilities.
*   **Flexible Metadata:** Implementing a custom fields feature so that organizations can track the specific metadata that matters most to their workflow.
*   **Advanced Reporting:** Providing dashboards and reports to track security posture over time, identify trends, and measure remediation efforts.
*   **Automated Workflows & Notifications:** Creating rules and notifications to alert teams about new, critical vulnerabilities as soon as they are discovered.

By combining a detailed developer catalog with powerful security data aggregation, Stagehand empowers teams to build more secure software, faster.

# Stagehand - Manual Testing Guide

This document outlines the test users created by the seed script and the expected permissions for each. This allows for manual verification of the application's hierarchical role-based access control (RBAC).

**Universal Password:** `password123`

---

## Organization 1: Aperture Labs (ENTERPRISE)

Structure:
- **Aperture Labs** (Org)
  - **Nexus Cloud Services** (Company)
    - Compute Team (2 projects)
    - Storage Team (2 projects)
    - Networking Team (2 projects)
  - **Quantum Innovations** (Company)
    - AI Research Team (3 projects)
    - Simulations Team (3 projects)
    - Data Analytics Team (3 projects)
  - **Helios Robotics** (Company)
    - Control Systems Team (2 projects)
    - Hardware Team (2 projects)
    - Logistics Team (2 projects)

### Test Users for Aperture Labs

#### 1. Organization Administrator
- **Email:** `admin@aperture.dev`
- **Role:** `ADMIN` of **Aperture Labs**.
- **Expected Permissions:** Full CRUD access to everything within the Aperture Labs organization. Can create, edit, and delete companies, teams, projects, and manage all memberships.

#### 2. Company Editor
- **Email:** `editor@nexus-cloud.com`
- **Role:** `EDITOR` of **Nexus Cloud Services**.
- **Expected Permissions:** Can see and edit everything within the "Nexus Cloud Services" company only. Can manage teams and projects within Nexus, but cannot see or interact with Quantum Innovations or Helios Robotics.

#### 3. Team Administrator
- **Email:** `lead.quantum@aperture.dev`
- **Role:** `ADMIN` of the **AI Research** team.
- **Expected Permissions:** Can fully manage the "AI Research" team and its 3 projects. Should not be able to see or edit any other team, even within the same company ("Quantum Innovations").

#### 4. Multi-Role Developer
- **Email:** `dev@aperture.dev`
- **Roles:** 
  - `EDITOR` of the **Control Systems** team (in Helios Robotics).
  - `READER` of the **Simulations** team (in Quantum Innovations).
- **Expected Permissions:** This user is a great test case for multi-faceted roles.
  - They should see two companies: "Quantum Innovations" and "Helios Robotics".
  - Within "Helios Robotics", they should see only the "Control Systems" team and have full edit/delete rights on its projects.
  - Within "Quantum Innovations", they should see only the "Simulations" team and have read-only access to its projects.

---

## Organization 2: Momentum Inc. (STANDARD)

Structure:
- **Momentum Inc.** (Org)
  - **Velocity Web Solutions** (Company)
    - E-Commerce Team (2 projects)
    - Marketing Sites Team (2 projects)
    - Client Portals Team (2 projects)

### Test Users for Momentum Inc.

#### 1. Organization Administrator
- **Email:** `admin@momentum.co`
- **Role:** `ADMIN` of **Momentum Inc.**
- **Expected Permissions:** Full CRUD access to everything within the Momentum Inc. organization.

#### 2. Company Reader
- **Email:** `reader@velocity.io`
- **Role:** `READER` of the **Velocity Web Solutions** company.
- **Expected Permissions:** Can see all teams and projects within "Velocity Web Solutions" but has no write permissions. All "Edit", "Add", and "Delete" buttons should be disabled or hidden.

---
## Notes on Enriched Projects

- **`Simulations Project 1`** (Aperture Labs) has 3 technologies and 3 contacts.
- **`E-Commerce Project 1`** (Momentum Inc.) has 3 technologies and 3 contacts.

This structure allows for testing visibility and permissions at every level of the hierarchy, across different organization types. 
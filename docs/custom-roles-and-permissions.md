# Architecture: Custom Roles & Team Permissions

This document outlines the architecture for a scalable, Permission-Based Access Control (PBAC) system. This design will allow for the future creation of custom roles by administrators and the assignment of permissions to both individual users and teams.

## 1. Core Concepts

The new system is based on decoupling **Roles** from **Permissions**.

*   **Permission:** A granular action that can be performed on a specific type of resource. Permissions are defined by the application and are not editable by users. Examples: `project:read`, `project:update`, `company:settings:update`.
*   **Role:** A named collection of permissions. Roles are created by organization administrators. Examples: "Security Auditor," "Developer," "Contractor."
*   **Membership:** The link that grants a `Role` to either a `User` or a `Team` on a specific resource in the hierarchy (e.g., granting the "Developer" role to the "Backend Team" on the "ACME Company").
*   **Inheritance:** Permissions cascade down the resource hierarchy. If a role is granted at the `Company` level, its permissions apply to all child `Teams` and `Projects` within that company. This logic is handled dynamically by the API, not stored in the database.

## 2. Database Schema Changes (`schema.prisma`)

To support this model, the following changes will be made to the database schema.

### New `Permission` Model

A table to store all possible granular permissions in the system.

```prisma
model Permission {
  id           String @id @default(cuid())
  action       String // e.g., "project:read", "project:update"
  resourceType String // e.g., "Project", "Company"
  description  String?
  roles        Role[] @relation(references: [id])
  
  @@unique([action, resourceType])
}
```

### New `Role` Model

This will replace the hardcoded `Role` enum. It stores custom roles created by organization admins.

```prisma
model Role {
  id             String       @id @default(cuid())
  name           String
  description    String?
  isEditable     Boolean      @default(true) // To protect default roles
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  permissions    Permission[] @relation(references: [id])
  memberships    Membership[]
}
```

### New `TeamMember` Model

A join table to manage which users belong to which teams.

```prisma
model TeamMember {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])
  teamId String
  team   Team   @relation(fields: [teamId], references: [id])
  
  @@unique([userId, teamId])
}
```

### Updated `Membership` Model

The `Membership` table will be updated to be polymorphic, allowing it to grant a role to either a `User` or a `Team`.

```prisma
model Membership {
  id     String @id @default(cuid())
  
  // Link to the Role
  roleId String
  role   Role   @relation(fields: [roleId], references: [id])

  // WHO gets the permission? (One of these will be set)
  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: Cascade)

  teamId String?
  team   Team?   @relation(fields: [teamId], references: [id], onDelete: Cascade)

  // WHAT resource is the permission for?
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  companyId      String?
  company        Company?      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  teamResourceId String? // This is for when a Team IS the resource
  teamResource   Team?         @relation("TeamResourcePermissions", fields: [teamResourceId], references: [id], onDelete: Cascade)

  projectId      String?
  project        Project?      @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Ensure a user/team can only have one role per resource
  @@unique([userId, organizationId])
  @@unique([userId, companyId])
  @@unique([userId, teamResourceId])
  @@unique([userId, projectId])
  @@unique([teamId, organizationId])
  @@unique([teamId, companyId])
  @@unique([teamId, teamResourceId])
  @@unique([teamId, projectId])
}
```

### Corresponding Updates to `User` and `Team` Models

```prisma
model User {
  // ... existing fields
  teamMemberships TeamMember[]
}

model Team {
  // ... existing fields
  members TeamMember[]
  permissionsOnTeam Membership[] @relation("TeamResourcePermissions") // Relation for when a team is the resource
}
```

## 3. Implementation Strategy (Hybrid Approach)

To provide a robust foundation without needing to build the entire UI for custom roles immediately, we will follow a hybrid strategy.

1.  **Implement the Backend:** The database schema changes will be implemented first.
2.  **Seed Default Roles:** For existing and new organizations, we will programmatically seed three default, non-editable roles: "Admin," "Editor," and "Reader."
3.  **Define Default Permission Sets:** We will define the granular permissions associated with each default role in a seed script.
    *   **Admin:** All permissions.
    *   **Editor:** All `read` and `update` permissions.
    *   **Reader:** All `read` permissions.
4.  **Update `checkPermission` Logic:** The `checkPermission` utility will be rewritten to find a user's direct and team-based roles, gather all associated permissions, and check for the required granular permission (e.g., `project:update`).
5.  **Maintain Simple UI:** The user interface for assigning roles will continue to show only "Admin," "Editor," and "Reader" for now. The underlying `roleId` will be used in the API calls.

This approach ensures the backend is scalable and future-proof, while the user-facing functionality remains unchanged until the new features are ready to be exposed. 
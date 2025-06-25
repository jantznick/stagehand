# Stagehand - Architecture & Data Model

This document outlines the proposed architecture and data models for the Stagehand application, building upon the Stagehand boilerplate.

## Guiding Principles

1.  **Extensible Core:** The `Application` model is the central entity. Its core data should be simple, while complex, multi-valued data is split into related models for clarity and performance.
2.  **User-Entered vs. System-Discovered Data:** The system must clearly distinguish between data entered manually by users and data pulled automatically from integrated tools. This builds trust and provides a clear audit trail.
3.  **Flexible Relationships:** The model must accommodate real-world scenarios, such as tracking contacts who are not registered users of the system.

---

## Core Data Models

The following Prisma schema represents the proposed database structure.

### 1. The `Project` Model (as "Application")

This is the central model representing a single software application or service in the developer catalog. We will **not** rename the `Project` model in the database. Instead, we will extend the existing `Project` model and refer to it as an "Application" conceptually and within the UI. This maintains consistency with the underlying Stagehand boilerplate.

```prisma
// The existing Project model, extended for Stagehand's needs.
model Project {
  id          String @id @default(cuid())
  name        String
  description String?

  // --- Core Catalog Details (User Editable) ---
  applicationUrl      String?          @doc("Primary URL for the deployed application")
  version             String?          @doc("Current public version, e.g., 2.1.4")
  deploymentStatus    DeploymentStatus @default(IN_DEVELOPMENT)
  
  // --- DevOps & Repository (User Editable) ---
  repositoryUrl       String? @doc("Link to the source code repository (e.g., GitHub)")
  ciCdPipelineUrl     String? @doc("Link to the CI/CD pipeline (e.g., Jenkins, GitHub Actions)")

  // --- Ownership & Team (Links to other models) ---
  teamId      String @doc("The Stagehand Team that owns this application")
  team        Team   @relation(fields: [teamId], references: [id])
  contacts    ProjectContact[] @doc("Points of contact for this application")

  // --- System-Managed Fields (Populated by integrations) ---
  lastScanDate        DateTime? @doc("Timestamp of the last successful scan by any integrated tool")

  // --- Relations to other models ---
  technologies        ProjectTechnology[]
  dependencies        ProjectDependency[]
  toolConfigurations  ToolConfiguration[]
  externalIntegrations ExternalIntegration[]
  findings            Finding[]
}

enum DeploymentStatus {
  PLANNING
  IN_DEVELOPMENT
  TESTING
  RELEASED
  MAINTENANCE
  DISCONTINUED
}
```

### 2. `Contact` & `ProjectContact` (Solves the Internal vs. External User problem)

This is the solution for tracking points of contact. We create a generic `Contact` entity that is user-editable. This `Contact` can then be *optionally* linked to an internal Stagehand `User`.

```prisma
// A generic, user-editable contact entity
model Contact {
  id    String  @id @default(cuid())
  name  String
  email String  @unique
  role  String? @doc("e.g., Engineering Manager, External Consultant")
  
  // This field links to a registered user in our system, but it's optional.
  userId String? @unique
  user   User?   @relation(fields: [userId], references: [id])

  // A contact can be associated with multiple applications
  applications ProjectContact[]
}

// Junction table to link a Contact to a Project with a specific role
model ProjectContact {
  projectId String
  project   Project @relation(fields: [projectId], references: [id])
  
  contactId     String
  contact       Contact @relation(fields: [contactId], references: [id])

  contactType   String @doc("e.g., 'Primary Owner', 'Technical Lead', 'Product Manager'")

  @@id([projectId, contactId, contactType])
}
```

### 3. `Technology` & `ProjectTechnology` (Solves the Dynamic vs. Manual problem)

This model allows users to manually define the technologies, languages, frameworks, and *un-integrated tools* used by an application. Crucially, the `source` field tracks whether it was user-entered or discovered automatically.

```prisma
// A generic entity for a technology, framework, or tool
model Technology {
  id   String @id @default(cuid())
  name String @unique // e.g., "React", "Snyk", "Jira", "Python"
  type TechnologyType // To categorize the technology
  
  applications ProjectTechnology[]
}

enum TechnologyType {
  LANGUAGE
  FRAMEWORK
  LIBRARY
  TOOL
  PLATFORM
  SERVICE
}

// Junction table to link a Technology to a Project
model ProjectTechnology {
  projectId String
  project   Project @relation(fields: [projectId], references: [id])

  technologyId  String
  technology    Technology @relation(fields: [technologyId], references: [id])

  version       String? @doc("e.g., 18.2.0 for React")
  source        String  @doc("How was this discovered? e.g., 'USER_ENTERED' or 'Discovered by Snyk'")

  @@id([projectId, technologyId])
}
```

### 4. `ProjectDependency` (SBOM)

This remains as previously discussed, for tracking specific software package dependencies (the SBOM). It is designed to be populated automatically by an integrated tool like Snyk or Dependabot.

```prisma
model ProjectDependency {
  id        String  @id @default(cuid())
  name      String  // e.g., "express"
  version   String  // e.g., "4.17.1"
  type      String  // e.g., "npm", "maven"
  
  projectId String
  project   Project @relation(fields: [projectId], references: [id])

  @@unique([projectId, name, version])
  @@index([name]) // Index for fast lookups by dependency name
  @@index([name, version]) // Index for fast lookups by name and version
}
```

### 5. `Host` (Tracking Infrastructure)

To allow Stagehand to track not just application code but also the infrastructure it runs on, we introduce a `Host` model. This enables tracking server-level vulnerabilities from CSPM or infrastructure scanning tools.

```prisma
model Host {
  id          String   @id @default(cuid())
  hostname    String
  ipAddress   String?
  os          String?  @doc("e.g., 'Ubuntu 22.04 LTS'")
  description String?
  
  companyId   String // Hosts belong to a company
  company     Company @relation(fields: [companyId], references: [id])
  
  // A host can be associated with multiple projects
  projects    Project[]

  // A host can have many findings (e.g., unpatched OS)
  findings    Finding[]
}
```

### 6. Custom Fields (User-Defined Metadata)

To provide flexibility for tenants to store their own specific data, we will implement a custom fields feature.

```prisma
// Managed by tenant admins to define custom fields for their Projects
model CustomFieldDefinition {
  id            String  @id @default(cuid())
  name          String  @doc("The internal key for the field, e.g., 'cost_center'")
  displayName   String  @doc("The human-friendly label, e.g., 'Cost Center'")
  tooltip       String? @doc("Help text displayed to the user in the UI")
  fieldType     FieldType
  
  companyId     String
  company       Company @relation(fields: [companyId], references: [id])

  // A definition can have many values across different projects
  values        CustomFieldValue[]

  @@unique([companyId, name])
}

enum FieldType {
  TEXT
  NUMBER
  DATE
  BOOLEAN
  URL
}

// Stores the actual value for a custom field on a specific Project
model CustomFieldValue {
  id          String @id @default(cuid())
  value       String // The value is always stored as a string and cast in the application
  
  projectId   String
  project     Project @relation(fields: [projectId], references: [id])
  
  definitionId String
  definition   CustomFieldDefinition @relation(fields: [definitionId], references: [id])

  @@unique([projectId, definitionId])
}
```

---

## Next Steps

1.  **Finalize Model:** Review and finalize this proposed schema.
2.  **Implement Schema:** Apply these changes to the `packages/api/prisma/schema.prisma` file. This includes extending the `Project` model and adding the new models.
3.  **Build UI:** Create the necessary UI components in `packages/web` for users to view and edit the Application (Project) details and its related `Contacts` and `Technologies`.
4.  **Build Admin UI:** Create a settings area for tenant Admins to manage `CustomFieldDefinition`s. 
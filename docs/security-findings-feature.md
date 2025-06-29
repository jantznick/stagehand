# Security Findings Feature Implementation Plan

## 1. Overview

The goal of the Security Findings feature is to ingest, normalize, and display security vulnerabilities associated with the projects in the Stagehand catalog. This will transform Stagehand from a simple inventory to an active Application Security Posture Management (ASPM) tool.

The core data model is based on two primary entities:

-   **Vulnerability:** A canonical record of a unique security issue (e.g., CVE-2023-1234, GHSA-abcd-1234-wxyz). This table stores general information about the vulnerability itself, such as its title, description, severity, and remediation advice.
-   **Finding:** A specific instance of a `Vulnerability` detected within a `Project`. This record links a `Vulnerability` to a `Project` and includes contextual details like the affected component (e.g., which dependency, which file), its status (e.g., New, Resolved), and metadata from the source security tool.

This normalized structure is efficient and scalable, preventing data duplication and enabling powerful aggregations.

## 2. Data Model (`schema.prisma`)

To support this feature, we will add the following models and enums to the `prisma/schema.prisma` file.

```prisma
// In schema.prisma

enum VulnerabilitySource {
  GITHUB
  SNYK
  QUALYS
  INTERNAL
  MANUAL
}

enum FindingStatus {
  NEW
  TRIAGED
  IN_PROGRESS
  RESOLVED
  IGNORED
}

model Vulnerability {
  id              String    @id @default(cuid())
  // Canonical ID from the source, e.g., 'CVE-2023-1234' or 'GHSA-...'
  vulnerabilityId String
  source          VulnerabilitySource

  title           String
  description     String    @db.Text
  severity        String    // e.g., 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  cvssScore       Float?
  remediation     String?   @db.Text
  references      Json?     // List of URLs to advisories

  findings Finding[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([vulnerabilityId, source])
}

model Finding {
  id              String        @id @default(cuid())
  status          FindingStatus @default(NEW)
  
  projectId       String
  project         Project       @relation(fields: [projectId], references: [id], onDelete:Cascade)

  vulnerabilityId String
  vulnerability   Vulnerability @relation(fields: [vulnerabilityId, source], references: [vulnerabilityId, source])
  source          VulnerabilitySource // To satisfy the compound key of Vulnerability

  // Source-specific details, e.g., { "dependencyName": "lodash", "filePath": "package-lock.json" }
  metadata        Json?

  firstSeenAt DateTime  @default(now())
  lastSeenAt  DateTime  @updatedAt
  resolvedAt  DateTime?

  @@index([projectId])
}

// We also need to add a relation to Project
model Project {
  // ... existing fields
  findings Finding[]
}
```

*Note: The relationship from `Finding` to `Vulnerability` uses a compound unique key (`vulnerabilityId`, `source`) to ensure we can store vulnerabilities from different sources (e.g., GitHub and Snyk might both have an entry for the same CVE) as distinct canonical records.*

## 3. MVP Implementation Plan: GitHub Dependabot Integration

The first milestone is to display GitHub Dependabot alerts for a project that has been linked via an SCM Integration.

### Step 1: Backend Implementation

1.  **Update Database Schema:** Apply the schema changes outlined above by running `prisma migrate dev`.
2.  **Create Findings API Route:**
    *   Create a new file: `packages/api/src/routes/findings.js`.
    *   Define an endpoint: `GET /api/projects/:projectId/findings` to fetch all findings for a given project. This will be protected by the existing authentication and authorization middleware.
3.  **Create Sync Service:**
    *   Create a new API endpoint, `POST /api/scm-integrations/:integrationId/sync`, that will trigger the synchronization process.
    *   This service will:
        *   Use the `scmIntegrationId` on the `Project` model to find the relevant repository.
        *   Use the stored GitHub token from the `SCMIntegration` to authenticate with the GitHub API (using Octokit).
        *   Fetch Dependabot alerts for the linked repository.
        *   For each alert, perform an "upsert" operation:
            *   Create a `Vulnerability` record if one with the same `vulnerabilityId` and `source` doesn't already exist.
            *   Create a `Finding` record linking the `Vulnerability` and the `Project`. If a finding for that vulnerability on that project already exists, update the `lastSeenAt` timestamp.

### Step 2: Frontend Implementation

1.  **Create Zustand Store:**
    *   Create a new file `packages/web/src/stores/useFindingStore.js`.
    *   This store will manage the state for findings, including a `fetchFindings(projectId)` function that calls our new API endpoint.
2.  **Create UI Components:**
    *   Create a new directory `packages/web/src/components/findings/`.
    *   Inside, create `FindingList.jsx`. This component will accept a `projectId`, use the `useFindingStore` to fetch data, and display the findings in a simple table.
    *   The table should show key information like Severity, Title, Status, and the affected dependency (from the `metadata`).
3.  **Integrate into Application UI:**
    *   Modify the `ApplicationDetails.jsx` component to include a new "Security Findings" tab.
    *   This tab will render the `FindingList` component, passing it the current project's ID.

This MVP will provide a complete end-to-end flow, from connecting a GitHub repository to viewing its security alerts within the Stagehand UI. It lays a solid foundation for adding more complex features and other security tool integrations in the future. 
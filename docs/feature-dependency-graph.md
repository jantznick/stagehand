# Feature Implementation: Application Dependency Graph

This document outlines the technical plan for implementing the Application Dependency Graph feature in Stagehand.

## 1. Overview & Goal

The primary goal is to provide users with a visual representation of the relationships and data flow between their applications (Projects). This will enhance the "Developer Catalog" by making architectural connections explicit and explorable.

The implementation will be phased:
1.  **Core Functionality:** Build the backend data model, API endpoints, and a frontend page that renders a graph and provides a separate form for managing relationships.
2.  **Future Enhancements:** Integrate relationship management directly into the graph for a more interactive experience.

## 2. Phase 1: Core Functionality

### 2.1. Backend Implementation (API)

#### 2.1.1. Database Schema (`packages/api/prisma/schema.prisma`)

A new table, `ProjectRelationship`, will be created to store the directed dependencies between projects.

```prisma
// In packages/api/prisma/schema.prisma

// ... existing models

model ProjectRelationship {
  id          String @id @default(cuid())
  description String?
  // Type of relationship, e.g., 'API', 'DATABASE', 'MESSAGE_QUEUE', 'DIRECT_DEPENDENCY'
  type        String 

  // The project that has the dependency (the source of the connection)
  sourceProjectId String
  sourceProject   Project @relation("outboundDependencies", fields: [sourceProjectId], references: [id], onDelete: Cascade)
  
  // The project that is the dependency (the target of the connection)
  targetProjectId String
  targetProject   Project @relation("inboundDependencies", fields: [targetProjectId], references: [id], onDelete: Cascade)

  // A relationship of a certain type between two projects must be unique
  @@unique([sourceProjectId, targetProjectId, type])
}

model Project {
  // ... existing fields
  
  // Add these two lines to the Project model
  outboundDependencies ProjectRelationship[] @relation("outboundDependencies")
  inboundDependencies  ProjectRelationship[] @relation("inboundDependencies")
}
```

After updating the schema, a new Prisma migration will be generated and applied.

#### 2.1.2. API Endpoints (`packages/api/src/routes/`)

A new router file, `relationships.js`, will be created to handle CRUD operations for the relationships. An existing router will be modified to provide the graph data.

**New File: `packages/api/src/routes/relationships.js`**

-   `POST /api/relationships`: Create a new project relationship.
    -   **Body:** `{ sourceProjectId: string, targetProjectId: string, type: string, description?: string }`
    -   **Permissions:** User must have at least EDITOR role on the Company level.
    -   **Returns:** The newly created relationship object.

-   `DELETE /api/relationships/:id`: Delete a project relationship.
    -   **Permissions:** User must have at least EDITOR role on the Company level.
    -   **Returns:** Success message.

**Modified File: `packages/api/src/routes/projects.js`**

-   `GET /api/projects/graph`: Fetch all data required to render the dependency graph for a given scope.
    -   **Query Parameters:** `?companyId=<company_id>`
    -   **Permissions:** User must be a member of the Company.
    -   **Returns:** A JSON object structured for a graphing library.
        ```json
        {
          "nodes": [
            { "id": "proj_1", "type": "projectNode", "data": { "label": "WebApp" }, "position": { "x": 0, "y": 0 } },
            { "id": "proj_2", "type": "projectNode", "data": { "label": "API Gateway" }, "position": { "x": 0, "y": 0 } }
          ],
          "edges": [
            { "id": "rel_1", "source": "proj_1", "target": "proj_2", "label": "API" }
          ]
        }
        ```

All new endpoints will be protected by the existing authentication and authorization middleware.

### 2.2. Frontend Implementation (Web)

#### 2.2.1. New Dependency

We will add the `react-flow` library to the `web` package for rendering the graph.

```bash
npm install reactflow -w packages/web
```
*Note: The package is `reactflow`, not `react-flow`.*

#### 2.2.2. New Page and Components

-   **Page:** `packages/web/src/pages/ArchitecturePage.jsx`
    -   This will be a new top-level page accessible from the sidebar.
    -   It will contain the graph display and the form for adding new relationships.

-   **Graph Component:** `packages/web/src/components/architecture/DependencyGraph.jsx`
    -   Fetches data from the `GET /api/projects/graph` endpoint.
    -   Uses `reactflow` to render the projects as nodes and relationships as edges.
    -   The initial version will support panning, zooming, and dragging nodes. Node positions should be calculated on the frontend for an automatic layout.

-   **Form Component:** `packages/web/src/components/architecture/AddRelationshipForm.jsx`
    -   A simple form to create new relationships.
    -   **Fields:**
        -   **Depends On (Source):** A searchable dropdown to select a project.
        -   **Dependency (Target):** A searchable dropdown to select a project.
        -   **Type:** A dropdown with predefined connection types (e.g., 'API', 'DATABASE').
        -   **Description:** An optional text area.
    -   On submit, it will call the `POST /api/relationships` endpoint and refresh the graph data.

#### 2.2.3. UI/UX Flow

1.  A new "Architecture" link will be added to the main sidebar.
2.  Clicking this link navigates the user to the `ArchitecturePage`.
3.  The page displays the `DependencyGraph` component, which fetches and renders the visual map of applications.
4.  On the same page, the `AddRelationshipForm` is displayed, allowing users to define new connections.
5.  Users can delete a relationship via an action on the graph (e.g., clicking an edge and hitting a delete button). This will call the `DELETE /api/relationships/:id` endpoint.

## 3. Phase 2: Future Enhancements

-   **In-Graph Editing:** Allow users to create relationships by dragging a connection from one node to another.
-   **Detailed Side Panel:** Clicking a node or edge will open a side panel displaying its full metadata and properties.
-   **Path Highlighting:** Add functionality to highlight all upstream or downstream dependencies of a selected node. 
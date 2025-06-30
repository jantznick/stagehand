# Frontend Documentation: Architecture Components

This document provides a breakdown of the components used for rendering the project dependency graph.

## Overview

The architecture components are responsible for visualizing the relationships between different applications (projects) within a company. They use the [React Flow](https://reactflow.dev/) library to render an interactive, node-based graph where each node is a project and each edge is a defined dependency.

---

## Component Breakdown

### `ProjectGraphContainer.jsx`

*   **Rendered in:** `CompanyDetails.jsx` (which is in turn rendered on the `DashboardPage`).
*   **Purpose:** The main container and stateful component for the architecture visualization.
*   **Behavior:**
    *   It uses the `useArchitectureStore` to fetch the list of `relationships` for the current company.
    *   It also fetches the list of all `projects` for the company from the `useHierarchyStore`.
    *   It processes this data, transforming the projects into "nodes" and the relationships into "edges" in a format that the React Flow library can understand.
    *   It manages the layout of the graph, using the `dagre` library for automatic hierarchical layout.
    *   It renders the `<DependencyGraph />` component, passing the processed nodes and edges to it.
    *   It also renders the `<AddRelationshipForm />` alongside the graph.

### `DependencyGraph.jsx`

*   **Rendered in:** `ProjectGraphContainer.jsx`.
*   **Purpose:** A presentational component that is a direct wrapper around the `ReactFlow` library.
*   **Behavior:**
    *   It receives the `nodes` and `edges` as props from the container.
    *   It configures the `ReactFlow` instance, providing it with the data, custom edge components (`<CustomEdge />`), and settings for panning, zooming, etc.
    *   It is responsible for rendering the graph canvas itself, but not for fetching or processing the data.

### `AddRelationshipForm.jsx`

*   **Rendered in:** `ProjectGraphContainer.jsx`.
*   **Purpose:** A form that allows users to create a new dependency (an edge) between two projects.
*   **Behavior:**
    *   It provides two dropdowns, "Source Project" and "Target Project," which are populated with the list of projects in the company.
    *   It includes a field for the `type` of dependency (e.g., `API_CALL`) and an optional `description`.
    *   On submit, it calls the `addRelationship` action on the `useArchitectureStore` to save the new dependency to the database. Upon success, the graph is typically refreshed to show the new edge.

### `CustomEdge.jsx`

*   **Purpose:** A custom component passed to `ReactFlow` to define how the edges (the lines connecting the nodes) are rendered.
*   **Behavior:**
    *   It receives edge data (source position, target position, etc.) as props from React Flow.
    *   It renders an SVG path for the line and includes a label (the dependency `type`) along the center of the path.
    *   This allows for a consistent and customized look and feel for the dependencies in the graph. 
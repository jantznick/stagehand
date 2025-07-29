# GraphQL Implementation Roadmap

This document outlines the recommended next steps for improving and scaling the GraphQL implementation in the Stagehand API. The current setup is a functional proof of concept; these steps will move it towards a production-ready and maintainable service.

## Phase 1: Production Readiness

These items should be addressed before building significant new features on the GraphQL API.

### 1. Upgrade to `@apollo/server`

*   **Problem:** The current implementation uses `apollo-server-express`, which is part of Apollo Server v3 and is now deprecated.
*   **Solution:** Migrate to the latest version of Apollo Server by replacing `apollo-server-express` with `@apollo/server`. This is the currently supported library and offers better performance, improved plugin architecture, and a more robust feature set. This will require a slight change in the `graphql/index.js` setup file.

### 2. Optimize Permission Resolvers

*   **Problem:** The `userPermission` resolver in `graphql/resolvers.js` currently makes multiple, sequential calls to the `checkPermission` utility for the same resource (once for `ADMIN`, once for `EDITOR`, etc.). This is inefficient.
*   **Solution:** Refactor the resolver to perform only **one** database query to determine the user's highest effective role for the resource. The boolean flags (`hasAdminAccess`, `hasEditorAccess`) can then be derived from this single result in memory, reducing database load and improving query speed.

### 3. Implement Structured Error Handling

*   **Problem:** The current resolvers `throw new Error(...)`, which returns a generic error to the client.
*   **Solution:** Utilize the specific error classes from the Apollo Server library, such as `AuthenticationError` (for when `req.user` is not present) and `ForbiddenError` (for failed permission checks). This provides structured, machine-readable error codes to the frontend, making it easier to handle different failure states gracefully (e.g., prompting a login versus showing an "access denied" message).

## Phase 2: Scalability and Future Growth

These items can be implemented as the GraphQL API grows in complexity.

### 1. Modularize Schema and Resolvers

*   **Problem:** All types and resolvers are currently in single `schema.js` and `resolvers.js` files. This will become unmanageable as more features are added.
*   **Solution:** Adopt a feature-based or domain-based structure. Create separate directories for each major entity (e.g., `project`, `team`, `user`) and place their corresponding schema and resolver files within them. A central `index.js` file in the `graphql` directory can then be responsible for merging these modules into a single, executable schema.

    ```
    graphql/
    ├── project/
    │   ├── project.resolvers.js
    │   └── project.schema.js
    ├── team/
    │   ├── team.resolvers.js
    │   └── team.schema.js
    └── index.js // Merges schemas and resolvers from subdirectories
    ```

### 2. Investigate DataLoaders

*   **Problem:** As GraphQL queries become more complex, we may encounter the "N+1 problem" within our resolvers, where fetching a list of items leads to a separate database query for each item's children.
*   **Solution:** Proactively introduce the `DataLoader` pattern. DataLoader is a utility that batches and caches database requests within a single GraphQL operation. For example, if you request 10 projects and their parent teams, DataLoader can batch the team lookups into a single `SELECT ... WHERE id IN (...)` query instead of 10 separate queries. This is a crucial optimization for a high-performance GraphQL API. 
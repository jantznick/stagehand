# Frontend Architecture & Conventions

This document provides a detailed guide to the structure, conventions, and patterns used in the `packages/web` service. It is intended for developers working on the frontend to ensure consistency and maintainability.

## Technology Stack

The frontend is a modern Single-Page Application (SPA) built with the following core technologies:

*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Framework:** [React](https://react.dev/)
*   **Routing:** [React Router](https://reactrouter.com/)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand) for global state.
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **UI Components:** [Headless UI](https://headlessui.com/) for accessible, unstyled components.
*   **Icons:** [Lucide React](https://lucide.dev/guide/packages/lucide-react) and [Heroicons](https://heroicons.com/).

## Directory Structure

The `packages/web/src/` directory is organized as follows:

```
packages/web/src/
├── main.jsx          # Application entry point, renders App.
├── App.jsx           # Root component, sets up routing.
├── index.css         # Global styles and Tailwind CSS imports.
├── components/       # Reusable UI components, organized by feature.
├── pages/            # Top-level components corresponding to specific routes.
├── stores/           # Zustand store definitions for global state.
├── hooks/            # Custom React hooks (e.g., useDebounce).
└── lib/              # Utility functions, constants, and external library configs.
```

---

## Key Concepts & Conventions

### 1. Component Strategy

*   **Pages:** Components in `src/pages/` are top-level views that are directly mapped to a route in `App.jsx`. They are responsible for fetching page-specific data and composing the layout using smaller components.
*   **Shared Components:** Components in `src/components/` are designed to be reusable across different pages. They should be "dumb" whenever possible, meaning they receive data and callbacks via props and do not have their own complex state.
*   **Feature-Based Organization:** Inside `src/components/`, create subdirectories for specific features (e.g., `components/findings`, `components/settings`) to keep related components grouped together.

### 2. State Management

*   **Local State:** For state that is only used within a single component or a small, co-located group of components, use React's built-in `useState` and `useReducer` hooks.
*   **Global State (Zustand):** For state that needs to be shared across the entire application (e.g., user authentication status, company/organization data), use Zustand.
    *   **Stores:** All Zustand stores are defined in `src/stores/`. Create a new file for each logical slice of state (e.g., `useAuthStore.js`, `useProjectStore.js`).
    *   **Immutability:** Zustand stores use Immer internally, so you can write "mutating" logic inside your actions, and Immer will handle the immutable updates safely.
    *   **Selectors:** To prevent unnecessary re-renders, always use selectors when accessing a store, especially for objects.
        *   **Good:** `const user = useAuthStore(state => state.user);`
        *   **Bad:** `const { user } = useAuthStore();` (This will cause re-renders when any part of the auth store changes).

### 3. Data Fetching & API Communication

*   Data fetching should be performed within Zustand store actions or in page components for one-off requests.
*   The API client (e.g., using `fetch`) should be centralized, ideally in a utility file within `src/lib/`, to handle common logic like setting headers, error handling, and base URL configuration.
*   Use Zustand actions to manage the lifecycle of data: fetching, success, and error states. This keeps the data-fetching logic separate from the UI and makes it easy to share and cache data across components.

### 4. Routing

*   Routing is managed by `react-router-dom`.
*   All application routes are defined in `src/App.jsx` using the `<Routes>` and `<Route>` components.
*   Protected routes that require authentication should be wrapped in a layout or component that checks the user's auth status from the `useAuthStore`.

### 5. Styling

*   **Tailwind CSS First:** All styling should be done using Tailwind CSS utility classes directly in the JSX. Avoid writing custom CSS files whenever possible.
*   **Component Logic:** Use conditional classes in React for dynamic styling based on component state or props.
*   **Headless UI:** Leverage Headless UI components for complex, accessible UI elements like Modals, Menus, and Listboxes. These components integrate seamlessly with Tailwind CSS for styling. 
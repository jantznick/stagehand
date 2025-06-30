# Store: `useAuthStore`

*   **File:** `packages/web/src/stores/useAuthStore.js`
*   **Purpose:** Manages all aspects of user authentication, session state, and credentials. It is the interface for all `auth` related API endpoints.

---

## State

*   `user`: The currently authenticated user object, containing details like `id`, `email`, and `emailVerified`. Set to `null` on logout.
*   `isLoading`: A boolean flag that is `true` during any asynchronous authentication operations (login, register, etc.).
*   `error`: A string that holds the error message from the last failed authentication attempt.

---

## Actions

### `login(email, password)`
*   **Description:** Authenticates a user with their email and password.
*   **API Call:** `POST /api/v1/auth/login`
*   **Behavior:** On success, it sets the `user` object in the state and calls `useHierarchyStore.getState().fetchHierarchy()` to load navigation data. On failure, it populates the `error` state.

### `register(email, password, { useMagicLink })`
*   **Description:** Registers a new user. Can be initiated in password mode or magic link mode.
*   **API Call:** `POST /api/v1/auth/register`
*   **Behavior:** In password mode, it sets the new `user` object on success. In magic link mode, it does not set the user, as a verification step is required first.

### `logout()`
*   **Description:** Logs out the current user.
*   **API Call:** `POST /api/v1/auth/logout`
*   **Behavior:** Calls the logout endpoint, then calls `resetAllStores()` to clear all data from every Zustand store and finally sets its own state back to the initial values (`user: null`).

### `acceptInvitation(token, password, { useMagicLink })`
*   **Description:** Completes the user registration process for a user who was invited via email.
*   **API Call:** `POST /api/v1/auth/accept-invitation`

### `checkAuth()`
*   **Description:** Checks with the server to see if the user has an active session (e.g., on page load).
*   **API Call:** `GET /api/v1/auth/me`
*   **Behavior:** If a session is active, it sets the `user` object in the state.

### `verifyEmail(token)`
*   **Description:** Verifies a user's email address using a token sent to them.
*   **API Call:** `POST /api/v1/auth/verify-email`
*   **Behavior:** On success, it sets the `user` object (which will now have `emailVerified: true`) and fetches the hierarchy data.

### `requestMagicLink(email)`
*   **Description:** Initiates a passwordless login by sending a magic link to the user's email.
*   **API Call:** `POST /api/v1/auth/magic-link`

### `verifyMagicLink(token)`
*   **Description:** Verifies a magic link token from an email to log a user in.
*   **API Call:** `POST /api/v1/auth/magic-link/verify`
*   **Behavior:** On success, sets the `user` object and fetches the hierarchy.

### `forgotPassword(email)`
*   **Description:** Sends a password reset link to a user's email.
*   **API Call:** `POST /api/v1/auth/forgot-password`

### `resetPassword({ token, password })`
*   **Description:** Sets a new password for a user using a token from a password reset email.
*   **API Call:** `POST /api/v1/auth/reset-password` 
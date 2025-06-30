# API Reference: Authentication

This document provides a detailed breakdown of the authentication-related API endpoints.

**File:** `packages/api/src/routes/auth.js`
**Base Path:** `/api/v1/auth`

---

## Overview

Handles all user authentication, registration, session management, and password recovery. It supports both traditional password-based login and passwordless "magic link" authentication. It also contains the handlers for OIDC-based single sign-on.

## Helper Functions

Internal functions used by the routes in this file.

*   `generateVerificationToken()`: Creates a 6-digit numeric token that is valid for 15 minutes. This is used for verifying a user's email address upon registration.
*   `sanitizeUser(user)`: Removes sensitive fields (`password`, `verificationToken`, etc.) from the user object before sending it back in a response. This ensures no secret data is accidentally exposed to the client.
*   `sendMagicLink(user)`: Generates a secure, single-use login token, saves its SHA256 hash to the `LoginToken` table in the database, and emails a magic login link to the user.

---

## Endpoints

### `POST /register`

Registers a new user. This endpoint supports two primary modes: standard registration with a password, and passwordless registration using a magic link.

*   **Body (`application/json`):**
    *   `email` (string, required): The user's email address.
    *   `password` (string): The user's password (min. 8 characters). Required if `useMagicLink` is `false` or omitted.
    *   `useMagicLink` (boolean): If `true`, the user is created without a password, and a magic login link is emailed to them instead of a verification code.

*   **Success Response (`201`):**
    *   If `useMagicLink` is true: `{ "message": "A magic link has been sent to your email." }`
    *   Otherwise: The sanitized user object.

*   **Behavior:**
    1.  Checks if a user with the given email already exists (returns `409 Conflict` if so).
    2.  **Auto-Join Logic:** It inspects the email's domain (`@example.com`) and checks it against the `AutoJoinDomain` table. If a matching, verified domain is found, the new user is automatically added to the corresponding Organization or Company with a pre-configured role. Admins of that entity are notified via email.
    3.  **Standard Logic:** If no auto-join rule exists, it creates a new `Organization` and a default `Company` for the user, making them the `ADMIN` of that new organization.
    4.  If `useMagicLink` is true, it calls `sendMagicLink()` and returns.
    5.  If using a password, it hashes the password, creates a verification code, and emails a welcome message. It then logs the user in immediately via Passport.js.

---

### `POST /login`

Authenticates a user with their email and password.

*   **Body (`application/json`):**
    *   `email` (string, required): The user's email.
    *   `password` (string, required): The user's password.
*   **Success Response (`200`):** The sanitized user object.
*   **Error Response (`401`):** `{ "error": "Invalid credentials." }`

*   **Behavior:**
    1.  Finds the user by email.
    2.  Verifies the password using `bcrypt.compare()`.
    3.  **Email Verification Check:** If the user's email has not been verified (`emailVerified` is false), it generates and sends a *new* verification code. It still logs them in, but the frontend should interpret the `emailVerified: false` flag in the response to prompt the user for the code.
    4.  On successful login, it creates a session for the user via `req.login()` (handled by Passport.js).

---

### `POST /login/magic`

Initiates a passwordless login by sending a magic link to a user's email. This is the first step of the magic link flow.

*   **Body (`application/json`):**
    *   `email` (string, required): The email of the user to log in.
*   **Success Response (`200`):** `{ "message": "If a user with that email exists, a magic link has been sent." }`

*   **Behavior:**
    1.  Finds the user by email.
    2.  If the user exists, it calls `sendMagicLink()` to email them a login link.
    3.  It always returns a generic success message to prevent user enumeration (i.e., maliciously checking if an email is registered with the service).

---

### `POST /login/verify`

Verifies a magic link token to log a user in. This is the second step of the magic link flow.

*   **Body (`application/json`):**
    *   `token` (string, required): The single-use token from the magic link URL.
*   **Success Response (`200`):** The sanitized user object.
*   **Error Response (`400`):** `{ "error": "Invalid or expired token." }`

*   **Behavior:**
    1.  Hashes the provided token and looks for the hash in the `LoginToken` table.
    2.  Ensures the token exists and has not expired.
    3.  If valid, it logs the user in, deletes the used token, and returns the user object.

---

### `POST /verify-email`

Verifies a user's email address using the 6-digit code sent upon registration.

*   **Body (`application/json`):**
    *   `userId` (string, required): The ID of the user to verify.
    *   `token` (string, required): The 6-digit verification token.
*   **Success Response (`200`):** The sanitized user object.
*   **Error Response (`400`):** `{ "error": "Invalid or expired verification code." }`

*   **Behavior:**
    1.  Finds the user by `userId`.
    2.  Checks that the provided token matches the `verificationToken` on the user record and has not expired.
    3.  If valid, it sets `emailVerified` to `true`, clears the token fields from the user record, and returns the updated user object.

---

### `POST /forgot-password`

Initiates the password reset process.

*   **Body (`application/json`):**
    *   `email` (string, required): The user's email address.
*   **Success Response (`200`):** `{ "message": "If a user with that email exists, a password reset link has been sent." }`

*   **Behavior:**
    1.  Finds the user by email.
    2.  If the user exists, it generates a unique password reset token (a UUID), saves it and an expiry date to the user record, and emails a reset link.
    3.  Always returns a generic success message to prevent user enumeration.

---

### `POST /reset-password`

Sets a new password for a user using a reset token.

*   **Body (`application/json`):**
    *   `token` (string, required): The password reset token from the email link.
    *   `password` (string, required): The new password (min. 8 characters).
*   **Success Response (`200`):** `{ "message": "Password has been reset successfully." }`

*   **Behavior:**
    1.  Finds the user by the `passwordResetToken`.
    2.  Ensures the token has not expired.
    3.  If valid, it hashes the new password, updates the user record, clears the reset token fields, and returns a success message.

---

### `POST /logout`

Logs the user out by destroying their session.

*   **Success Response (`200`):** `{ "message": "Logged out successfully." }`
*   **Behavior:**
    1.  Calls `req.logout()` to clear the login session from Passport.js.
    2.  Calls `req.session.destroy()` to remove the session record from the database.

---

### `GET /session`

Retrieves the current user's session information. This is a protected route used by the frontend to check if a user is currently logged in.

*   **Middleware:** `protect` (ensures user is authenticated).
*   **Success Response (`200`):** The sanitized `req.user` object, or `null` if no user is logged in.

---

### OIDC Routes

These routes are used for Single Sign-On (SSO) integrations with external identity providers (IdPs) like Okta or Auth0.

*   `GET /oidc/login`: The entry point to initiate an OIDC login flow (SP-initiated).
*   `POST /oidc/login`: The entry point for an IdP-initiated flow where the IdP posts an assertion to Stagehand.
*   `GET /oidc/callback`: The callback (or redirect) URL that the OIDC provider sends the user to after they authenticate.
*   `POST /oidc/callback`: A callback URL for some OIDC providers that use a POST request instead of a GET.

These routes all use the `dynamicOidcStrategy` middleware from `src/utils/passport.js` to dynamically configure the OIDC provider based on the user's organization. After successful authentication with the external provider, it logs the user into a Stagehand session. 
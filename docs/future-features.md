# Future Feature Implementation Plans

This document outlines the implementation plans for several proposed features that build upon the core application architecture.

## 1. The "Freelancer" Solution: An Account Switcher

This feature addresses the problem of a single user (like a freelancer or consultant) who belongs to multiple organizations but can only see one at a time with our new instance-first architecture.

**The Problem:** A user, `freelancer@example.com`, is a member of "Acme Inc." and "Momentum". When they log in at `acme.dev.stagehanddev.com`, they are correctly placed in the Acme context. However, they have no way to get to the Momentum organization without manually typing the URL, and no way to even see which organizations they have access to.

**The Solution: An Account Switcher UI**

This is the standard, user-friendly solution used by products like Google, Slack, and Figma.

*   **How it Works:** A user is always operating within the context of a single tenant. However, the UI provides an easy way to "hop" between the tenants they have access to.
*   **UI Implementation:**
    *   A "Switch Organization" or "Your Accounts" option would be added to the user's profile dropdown in the application's main sidebar.
    *   Clicking this would open a menu listing all organizations the user is a member of.
    *   Selecting a different organization from the list would simply redirect the user's browser to that organization's unique subdomain (e.g., `momentum.dev.stagehanddev.com`).
*   **Backend Implementation:**
    *   A new API endpoint is required: `GET /api/v1/users/me/memberships`.
    *   This endpoint would be protected and, for the currently logged-in user (`req.user.id`), it would query the `Membership` table to find all organizations they belong to.
    *   It would return a simple list of organization objects, each including the `id`, `name`, and `hostname`.
    *   The frontend uses this data to populate the switcher menu.

---

## 2. The "Read-Only Admin" Solution: An Auditor Role

This addresses the idea of having an internal employee who can view all tenant data for support or auditing purposes, but who should not be able to make any changes. This is different from a Super Admin (who can change anything) and is much safer for granting to a wider group of employees.

**The Problem:** You need to give your support team visibility into customer accounts to help them troubleshoot, but you don't want to give them full Super Admin rights, which would allow them to change feature flags, plans, or other sensitive data.

**The Solution: A New `AUDITOR` Role**

*   **Role Definition:** We would introduce a new top-level role, distinct from `isSuperAdmin`. This could be a new boolean flag on the `User` model, like `isAuditor`, or a more flexible role-based system.
*   **Permissions:** An `AUDITOR` can:
    *   Log in to a dedicated internal portal (this could be the *same* Super Admin app, but with a different UI).
    *   View a list of all organizations and all users.
    *   **Crucially, they would have read-only access.** All API endpoints that modify data (e.g., `PUT`, `POST`, `DELETE` requests on the admin routes) would reject requests from an Auditor.
*   **Implementation:**
    *   Add `isAuditor: Boolean @default(false)` to the `User` model in `schema.prisma`.
    *   Create a new middleware, `isAuditorOrSuperAdmin`, to protect read-only admin routes (`GET /api/v1/admin/organizations`).
    *   The existing `isSuperAdmin` middleware would remain on all write-access admin routes (`PUT`, `POST`, `DELETE`).
    *   The frontend Admin App would be modified to check for this new role. If a user is an `AUDITOR` but not a `SUPER_ADMIN`, the "Manage" buttons and other editing controls would be hidden or disabled.

---

## 3. The "Login As" Solution: Impersonation

This is the most powerful tool for hands-on customer support and is a common feature in enterprise SaaS. It allows a privileged user to temporarily take over a customer's account without needing their password.

**The Problem:** A customer is reporting a bug or has a complex support issue. Your support team cannot see what the user sees, making it impossible to diagnose the problem. Asking for the user's password is a major security risk and bad practice.

**The Solution: A Secure Impersonation Flow**

*   **The Trigger:** A privileged user (either a `SUPER_ADMIN` or a new `SUPPORT_ADMIN` role) is in the Admin App. They see a list of users and click an "Impersonate" or "Login As" button next to a user's name.
*   **The API (`POST /api/v1/admin/impersonate`):**
    *   This new, highly protected endpoint accepts a `userId` to impersonate.
    *   The backend verifies the *current* user has impersonation rights.
    *   It then generates a **new session**, but with a twist. It stores the *target user's* ID in the session's user field, but also adds a special flag: `impersonator: { id: 'current_admin_id', email: 'admin@example.com' }`. This flag is critical for auditing and for being able to stop the impersonation.
*   **The Experience:**
    *   The API returns a success message, and the frontend redirects the admin to the target user's tenant URL (e.g., `acme.dev.stagehanddev.com`).
    *   The application sees the new session and logs the admin in as the target user, with all of that user's permissions and data.
    *   **Crucially, a persistent, highly visible banner is displayed across the top of the entire application**, saying something like "You are currently impersonating Jane Doe. [Return to Admin]".
*   **Stopping Impersonation:**
    *   The "Return to Admin" button calls another new endpoint (`POST /api/v1/auth/stop-impersonation`).
    *   This endpoint destroys the temporary impersonation session and restores the admin's original session.
    *   The admin is then redirected back to the Super Admin dashboard.

---

## 4. User-Friendly Feature Names

This is a small but important enhancement to our feature flagging system that directly improves the user experience for Super Admins.

**The Problem:**

*   In the database, our `Feature` model has a `key` (e.g., `"sast-scanning"`) and a `description`.
*   The `key` is great for developers and for use in code, but it's not very polished or professional to display in a UI.
*   The Super Admin dashboard currently shows these raw keys, which is functional but not ideal.

**The Solution: Add a `name` Field**

*   **Database Schema Change:**
    *   We would add a new, non-unique `name` field to the `Feature` model in `packages/api/prisma/schema.prisma`.
        ```prisma
        model Feature {
          // ... existing fields
          key         String  @unique
          name        String  // The new field, e.g., "SAST Scanning"
          description String?
          // ...
        }
        ```

*   **Data Seeding:**
    *   We would update our database seeding script (`packages/api/prisma/seed.js`) to populate this new `name` for all our default features.
        ```javascript
        // Example change
        {
          key: 'sast-scanning',
          name: 'SAST Scanning', // The new human-readable name
          description: 'Enable Static Application Security Testing for connected repositories.'
        }
        ```

*   **Backend and Frontend Implementation:**
    *   **API:** We would update the admin API endpoints (`/api/v1/admin/features` and `/api/v1/admin/organizations`) to include this new `name` field in their responses.
    *   **UI:** The `SuperAdminPage` would then be modified to display this user-friendly `name` in the feature management accordion instead of the raw `key`. The `key` could still be shown in a smaller font for developer reference if desired.

**Impact:**

This is a quality-of-life improvement. It makes the Super Admin dashboard more intuitive and professional, reducing ambiguity and making it easier for non-technical or less-technical admins to manage tenant features. It separates the "code" representation of a feature from its "display" representation.

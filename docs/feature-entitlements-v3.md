
# Definitive Plan: Instance-First, Tier-Based Feature Entitlements

## 1. Core Concepts

1.  **Instance-First Architecture:** The application will identify which `Organization` is being accessed based on the **hostname** of the request (e.g., `acme.stagehand.app`). This happens *before* any user authentication, making the organization the primary context for the request.

2.  **Hybrid Entitlement Model:** We will combine the best of both ideas.
    *   **Tiers (`Plan`):** Organizations will be assigned a `Plan` (e.g., "Basic," "Premium," "Enterprise"). This provides a baseline set of features.
    *   **Feature Overrides:** A Super Admin can then customize the plan for any organization by enabling, disabling, or setting specific features to a "promo" state, overriding the tier's defaults. This gives you both easy management via tiers and the flexibility for custom deals.

3.  **Super Admin Segregation:** Super Admins are special users who are not tied to any single organization. They will have a separate administrative interface to manage all organizations and their feature entitlements.

---

## 2. Phase 1: Backend Implementation

### Task 2.1: Evolve the Database Schema

-   **File:** `packages/api/prisma/schema.prisma`
-   **Actions:**
    1.  **Create `Plan` Model:** Defines subscription tiers.
    2.  **Create `Feature` Model:** Defines a master list of all possible features.
    3.  **Create `OrganizationFeature` Model:** The join table that acts as the "override" layer, connecting an `Organization` to a `Feature` with a specific `FeatureStatus` (`ACTIVE`, `DISABLED`, `PROMO`).
    4.  **Update `Organization` Model:**
        -   Add a unique `hostname` field.
        -   Add a relationship to the `Plan` model (`planId`).
    5.  **Update `User` Model:** Add an `isSuperAdmin` flag.

### Task 2.2: Implement Instance-Resolution Middleware

-   **New File:** `packages/api/src/middleware/instanceResolver.js`
-   **Action:** This middleware will run on most API requests, *before* authentication.
    1.  It will extract the subdomain from the request's hostname.
    2.  It will query the database for an `Organization` with a matching `hostname`.
    3.  If found, it attaches the `Organization` object to `req.organization`.
    4.  If not found, it rejects the request.
    5.  It will calculate the final feature set (tier defaults + overrides) and attach it to `req.organization.features`.

### Task 2.3: Refactor Authentication and Business Logic

-   **Files:** `packages/api/src/utils/passport.js`, all route files in `src/routes/`.
-   **Action:** All business logic will be updated to assume `req.organization` is present.
    -   **Login:** The system will now verify that a user is a member of `req.organization` before attempting to authenticate them.
    -   **Feature Guards:** The `featureGuard` middleware will now read from `req.organization.features`.

---

## 3. Phase 2: Frontend Implementation

### Task 3.1: Create a New `useInstanceStore`

-   **New File:** `packages/web/src/stores/useInstanceStore.js`
-   **Action:** A dedicated Zustand store to hold all data related to the currently viewed instance (organization id, name, and the final `features` map).
-   **Action:** This store will be populated on initial app load by a new API endpoint (`GET /api/v1/instance/details`) which will return the `organization` object identified by the `instanceResolver` middleware.

### Task 3.2: Implement the `<Feature>` Guard Component

-   **New File:** `packages/web/src/components/auth/Feature.jsx`
-   **Action:** Create a declarative component to handle UI logic based on feature status.
    ```jsx
    <Feature feature="sast-scanning" active={<SastButton />} promo={<PromoButton />} />
    ```
-   **Justification:** This encapsulates complex business logic (tiers + overrides), promotes code reuse, and makes the UI code cleaner and more maintainable.

### Task 3.3: Super Admin Interface

-   **New Page:** `packages/web/src/pages/SuperAdmin.jsx`
-   **Action:** This UI will be hosted on a separate path or subdomain that is excluded from the `instanceResolver` middleware, allowing a Super Admin to manage all organizations and their feature entitlements.

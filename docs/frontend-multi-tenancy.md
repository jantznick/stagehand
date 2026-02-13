# Frontend Architecture: Multi-Tenancy and Admin Separation

This document outlines the architectural approach for serving our multi-tenant frontend application and the separate Super Admin interface.

## 1. Core Concept: The "Two-App" Frontend

To ensure a clean and secure separation between the customer-facing application and our internal administrative tools, the frontend is architecturally treated as two distinct applications, despite living in the same `packages/web` codebase.

1.  **The Tenant App (Main Application):**
    *   **Purpose:** This is the primary application used by customers (organizations).
    *   **Access:** Served on any custom subdomain (e.g., `acme.stagehand.app`, `momentum.stagehand.app`).
    *   **Backend Interaction:** The backend's `instanceResolver` middleware identifies the organization based on the subdomain, and all API calls operate within that organization's context.
    *   **Entry Point:** `index.html`

2.  **The Admin App (Super Admin Dashboard):**
    *   **Purpose:** A separate, restricted interface for Super Admins to manage all organizations and platform settings.
    *   **Access:** Served *only* from a dedicated, non-tenant hostname (e.g., `admin.stagehand.app`).
    *   **Backend Interaction:** The backend's `instanceResolver` ignores the `admin` subdomain. API calls made from this app (e.g., to `/api/v1/admin/*`) are not scoped to a single organization.
    *   **Entry Point:** `admin.html`

This separation is achieved through a combination of a multi-entry-point Vite configuration and routing rules at the webserver level.

---

## 2. Local Development Setup

To replicate the subdomain routing on a local development machine, you must edit your computer's `hosts` file.

*   **File Location:**
    *   **macOS/Linux:** `/etc/hosts`
    *   **Windows:** `C:\Windows\System32\drivers\etc\hosts`
*   **Action:** Add the following lines to the file. This maps custom hostnames to your local machine.

```text
127.0.0.1   acme.dev.stagehanddev.com
127.0.0.1   momentum.dev.stagehanddev.com
127.0.0.1   admin.dev.stagehanddev.com
```

*   **Usage:**
    *   To access the **Tenant App** for a specific organization (e.g., "Acme"), navigate to `http://acme.dev.stagehanddev.com:3000`.
    *   To access the **Admin App**, navigate to `http://admin.dev.stagehanddev.com:3000`.

The Vite development server is configured to handle this routing automatically.

---

## 3. Production Deployment (Nginx Example)

In a production environment, a reverse proxy like Nginx is responsible for serving the correct application based on the requested hostname.

Below is a sample Nginx server block configuration that demonstrates how to achieve this.

```nginx
server {
    listen 80;
    server_name ~^(?<subdomain>.+)\.stagehand\.app$;

    # Default root points to the Tenant App build output
    root /var/www/stagehand/packages/web/dist;
    index index.html;

    # If the subdomain is 'admin', serve the Admin App's entry point.
    if ($subdomain = 'admin') {
        # Note: In a real setup, you might point to a different root 
        # directory for the admin app build, but for Vite's multi-entry
        # build, rewriting to the correct HTML file works.
        rewrite ^ /admin.html last;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/v1 {
        # Proxy API requests to the backend service
        proxy_pass http://api:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Additional configuration for SSL, etc.
    # ...
}
```

This configuration ensures that requests to `admin.stagehand.app` serve the `admin.html` file, while requests to any other subdomain serve the main `index.html` file, achieving the desired architectural separation.

# SAST Scanning Feature Implementation Plan

## 1. Overview & Goals

This document outlines the implementation plan for a local, container-based SAST (Static Application Security Testing) scanning feature, with Semgrep as the first implementation.

The primary goal is to create a secure, resilient, and self-contained scanning architecture that does not rely on external cloud platforms. The architecture will use an asynchronous callback pattern to ensure resiliency against service restarts.

**Core Requirements:**
- **Local Scanning:** Scans must be performed locally within the Docker environment.
- **Tool-Agnostic:** The framework should be designed to accommodate other SAST tools in the future.
- **Resilient:** The system must gracefully handle service restarts without losing track of running scans.
- **Secure:** Communication between internal services must be secured.

## 2. Architecture: Asynchronous Callback Pattern

The architecture consists of two main components: the **Main API** and a dedicated **`semgrep-scanner` microservice**.

The workflow is as follows:

1.  **Initiation:** A user triggers a scan from the Stagehand UI. The main API receives the request, creates a `ScanExecution` record in the database with a `QUEUED` status, and makes an asynchronous call to the `semgrep-scanner` service.
2.  **Execution:** The `semgrep-scanner` receives the request. It clones the target repository into a temporary directory, executes the `semgrep` CLI, and generates a JSON report.
3.  **Callback:** Upon completion, the `semgrep-scanner` sends the results back to a special, secure internal endpoint on the main API.
4.  **Processing:** The main API's internal endpoint receives the callback, validates the request, transforms the raw Semgrep findings into the standard `Vulnerability` and `Finding` models, and updates the database. The `ScanExecution` status is updated to `COMPLETED` or `FAILED`.

This decoupled, callback-based approach ensures that if the main API restarts while a scan is in progress, the results can still be received and processed once the API is back online.

## 3. Infrastructure (`docker-compose.yml`)

A new service will be added to the `docker-compose.yml` file.

```yaml
# In docker-compose.yml
services:
  # ... existing services (api, web, db)
  semgrep-scanner:
    build:
      context: ./packages/semgrep-scanner
      dockerfile: Dockerfile.dev
    environment:
      - STAGEHAND_API_URL=http://api:8000 # Address for the callback
      - INTERNAL_API_SECRET=${INTERNAL_API_SECRET} # Shared secret for secure callbacks
    volumes:
      - ./packages/semgrep-scanner:/usr/src/app
      - /usr/src/app/node_modules
    networks:
      - stagehand-net
```

## 4. New `semgrep-scanner` Microservice

- **Location:** `packages/semgrep-scanner`
- **Technology:** A lightweight Node.js/Express server.
- **Dockerfile:** Installs Node.js, `git`, and `semgrep`.

### Internal API (`semgrep-scanner`)

The scanner will expose a single, internal-only endpoint:

-   `POST /scan`:
    -   Accepts: `{ "repositoryUrl": "...", "scanId": "...", "credentials": { ... } }`
    -   Immediately returns `202 Accepted`.
    -   Kicks off the clone, scan, and callback process in the background.

## 5. Main API (`packages/api`) Backend Changes

### New SAST API Routes (`packages/api/src/routes/sastScans.js`)

-   `POST /api/v1/projects/:projectId/sast/scan`: Launches a new scan. Creates the `ScanExecution` record and triggers the `semgrep-scanner`.
-   `GET /api/v1/projects/:projectId/sast/scans`: Lists scan history for a project.

### New Secure Internal Route (`packages/api/src/routes/internal.js`)

-   `POST /api/v1/internal/scans/:scanId/report`:
    -   This is the secure callback endpoint for the `semgrep-scanner`.
    -   **Security:** It will be protected by a middleware that verifies a shared secret (`INTERNAL_API_SECRET`) sent in an `X-Internal-Secret` header.
    -   **Function:** It receives the raw JSON output from Semgrep, processes the results, and updates the database.

## 6. Frontend Implementation

-   A "SAST Scans" section will be added to the Application Details "Security" tab.
-   It will reuse existing components from the DAST feature (`DastScanControl`, `ScanHistoryTable`) to provide a consistent UI for launching scans and viewing history.
-   Findings from Semgrep will automatically appear in the main `FindingList` component.

## 7. Security

The `INTERNAL_API_SECRET` environment variable must be a long, randomly generated string and shared between the `api` and `semgrep-scanner` services. This ensures that only trusted internal services can submit scan results.

- [x] Refactor ZAP integration to use the resilient callback pattern.

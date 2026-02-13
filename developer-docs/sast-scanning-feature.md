# SAST Scanning - Implementation Guide & Architecture

## 1. Developer Overview

This document provides a technical deep-dive into the local SAST (Static Application Security Testing) scanning feature. It is intended for developers working on the Stagehand backend, particularly the `api` and `semgrep-scanner` services.

The architecture is designed to be resilient and secure, using a decoupled microservice with an asynchronous callback pattern. This avoids placing long-running jobs on the main API event loop and ensures scan results are not lost if the API restarts.

## 2. Architecture & Data Flow

The system comprises two services: the **`api`** service and the **`semgrep-scanner`** service.

1.  **Request (`POST /api/v1/projects/:projectId/sast/scans`)**
    *   The `sastScans.js` route receives a request to scan a project.
    *   It checks that the user has `ADMIN` or `EDITOR` permissions.
    *   It retrieves the `repositoryUrl` from the `Project` model.
    *   It creates a `ScanExecution` record in the database with `status: 'QUEUED'`.
    *   It calls the `triggerSastScan` utility function in `utils/sastService.js`.

2.  **Dispatch (`triggerSastScan`)**
    *   The `sastService` utility makes an asynchronous `fetch` call (`POST`) to the `semgrep-scanner` service at `http://semgrep-scanner:8080/scan`.
    *   The request body includes the `scanId` and `repositoryUrl`.
    *   This is a "fire-and-forget" call; the main API does not wait for a response.

3.  **Execution (`semgrep-scanner` service)**
    *   The scanner's `POST /scan` endpoint receives the job.
    *   It immediately returns a `202 Accepted` response.
    *   In the background (via an un-awaited `async` function `runScan`), it performs the following:
        1.  Updates its in-memory job status to `RUNNING`.
        2.  Creates a temporary directory: `/usr/src/app/scans/:scanId`.
        3.  Clones the git repository into the temporary directory.
        4.  Executes the Semgrep CLI: `semgrep --config "p/default" --json -o results.json`.
        5.  Reads the `results.json` file.
        6.  Initiates the callback to the main API.
        7.  Cleans up the temporary directory.

4.  **Callback (`POST /api/v1/internal/scans/:scanId/report`)**
    *   The `semgrep-scanner` sends the parsed JSON results to the main API's secure internal endpoint.
    *   The request includes an `X-Internal-Secret` header to authenticate the request.
    *   The `internal.js` route handler receives the report.
        1.  It verifies the `X-Internal-Secret`.
        2.  If an error was reported, it updates the `ScanExecution` status to `FAILED`.
        3.  If results are present, it iterates through them, performing an `upsert` for each `Vulnerability` and creating a new `Finding` record.
        4.  It updates the `ScanExecution` status to `COMPLETED` and populates the `findingsCount`.

## 3. Code Implementation Details

### `semgrep-scanner` Service
-   **Location:** `packages/semgrep-scanner`
-   **Main File:** `src/index.js`
-   **Key Logic:** The `runScan` function contains the core workflow. It uses Node.js's `child_process.exec` to run `git` and `semgrep` commands and `fs/promises` for file system operations.
-   **Error Handling:** If any step in `runScan` fails, it catches the error and reports it back to the main API via the callback endpoint so the scan status can be marked as `FAILED`.

### Main API (`packages/api`)
-   **SAST Routes:** `src/routes/sastScans.js` - Handles public-facing requests for launching and viewing scans.
-   **Internal Routes:** `src/routes/internal.js` - Handles the callback from the scanner. **Crucially, this route is protected by the `verifyInternalSecret` middleware.**
-   **Service Utility:** `src/utils/sastService.js` - Contains the `triggerSastScan` function that uses `fetch` to communicate with the scanner.
-   **Result Processing:** The `POST /scans/:scanId/report` handler in `internal.js` contains the logic for transforming Semgrep's JSON output into the Prisma models (`Vulnerability`, `Finding`).

## 4. Environment Configuration

To function, the following environment variables must be set in the `.env` file:

```dotenv
# Main API -> Semgrep Scanner
SEMGREP_SCANNER_URL=http://semgrep-scanner:8080

# Semgrep Scanner -> Main API (Callback)
STAGEHAND_API_URL=http://api:3001

# Shared secret for securing the internal callback endpoint
INTERNAL_API_SECRET=a_very_long_and_random_secret_string
```

## 5. Architectural Recommendation

This resilient callback pattern is superior to the polling mechanism used by the DAST/ZAP integration. A future task should be created to refactor the DAST implementation to follow this new architecture, which will improve its robustness against service restarts.

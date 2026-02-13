# SAST Scanning Feature

## 1. Overview

The SAST (Static Application Security Testing) scanning feature enables automated security analysis of your application's source code directly from the Stagehand platform. It uses Semgrep, a powerful open-source static analysis engine, to find security vulnerabilities, bugs, and performance issues before they reach production.

This feature is designed to be fully self-contained within your Stagehand environment, ensuring that your source code is never sent to an external third-party service.

**Key Benefits:**
- **Secure:** Code is scanned in an ephemeral, isolated container within your own infrastructure.
- **Integrated:** Launch scans and view findings directly from the application's "Security" tab.
- **Consistent:** Results are normalized into the standard `Finding` format, appearing alongside vulnerabilities from other tools like DAST scanners.

## 2. How It Works: High-Level Architecture

The SAST feature uses a microservice architecture to ensure scans are performed efficiently without blocking the main application.

1.  **User Action:** A user initiates a "Launch Scan" from the application's Security tab in the UI.
2.  **Main API:** The main Stagehand API records the scan request and dispatches a job to the `semgrep-scanner` service.
3.  **Semgrep Scanner Service:** This is a dedicated background worker service.
    *   It securely clones the application's linked Git repository.
    *   It runs the Semgrep command-line tool against the source code.
    *   Upon completion, it sends the results back to the main API.
4.  **Results Processing:** The main API receives the results, transforms them into standardized `Finding` and `Vulnerability` records, and saves them to the database. The findings then appear in the UI.

This asynchronous, callback-based design is resilient, meaning that even if the main API restarts during a scan, the results will still be processed once the scan is complete.

## 3. Using the Feature

### Prerequisites

To use the SAST scanning feature, an application within Stagehand **must have a Git Repository URL linked** to it. This can be configured in the "Details" tab of the application.

### Launching a Scan

1.  Navigate to the desired **Application** in Stagehand.
2.  Go to the **Security** tab.
3.  In the "SAST Scanning" section, click the **"Launch Scan"** button.
4.  A confirmation modal will appear, showing the repository that will be scanned. Confirm to start the scan.

The scan will begin in the background. Its status will appear in the "Recent Scans" list.

### Viewing Results

-   **Scan History:** The status of ongoing and completed scans is visible in the "Recent Scans" list within the SAST Scanning section.
-   **Security Findings:** Once a scan is complete, any vulnerabilities discovered by Semgrep will appear in the main "Security Findings" list on the same page, alongside findings from any other integrated tools.

## 4. Configuration (for Administrators)

The SAST scanning service is configured as part of the standard `docker-compose.yml` file.

```yaml
# In docker-compose.yml
services:
  # ... other services
  semgrep-scanner:
    build:
      context: ./packages/semgrep-scanner
      dockerfile: Dockerfile
    # ...
    environment:
      - STAGEHAND_API_URL=http://api:8000
      - INTERNAL_API_SECRET=${INTERNAL_API_SECRET}
```

The communication between the main API and the scanner is secured by a shared secret (`INTERNAL_API_SECRET`), which must be defined in your `.env` file. This ensures that only the main API can receive scan results.

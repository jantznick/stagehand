# DAST Scanning Feature

## Overview

The Dynamic Application Security Testing (DAST) scanning feature allows users to perform automated security scans on web applications directly from the Stagehand platform. This feature integrates with OWASP ZAP (Zed Attack Proxy) to discover vulnerabilities in running web applications by testing them from the outside, simulating real-world attacks.

## Architecture

### Components

1. **Backend Infrastructure**
   - ZAP Docker container for scan execution
   - Scanner abstraction layer with pluggable providers
   - Background scan processing with real-time status updates
   - Database models for scan execution tracking
   - RESTful API endpoints for scan management

2. **Frontend Interface**
   - DAST Scan Manager component integrated into Application Security tab
   - Real-time progress monitoring with polling
   - Scan history management with pagination
   - Detailed scan results modal with downloadable reports
   - Customizable scan configuration options

3. **Database Schema**
   - `ScanExecution` model for tracking scan lifecycle
   - `Finding` model with URL associations for DAST findings
   - Enum types for scan types and statuses

## Features

### Scan Configuration
- **Scan Intensity Levels**:
  - Quick (~5-10 minutes): Basic passive scan
  - Standard (~15-30 minutes): Active scan with moderate depth
  - Thorough (~30+ minutes): Comprehensive scan with deep crawling

- **Crawl Depth Options**:
  - Shallow (1-2 levels): Limited site exploration
  - Medium (3-5 levels): Moderate site coverage
  - Deep (unlimited): Complete site discovery

- **Scope Options**:
  - Include subdomains checkbox
  - Maximum duration limits (15 minutes to 2 hours)

### Real-time Monitoring
- Live progress updates every 5 seconds during active scans
- Automatic status polling with intelligent fallback
- Real-time findings count updates
- Scan cancellation capabilities

### Results Management
- Comprehensive scan history with pagination
- Severity-based finding categorization (Critical, High, Medium, Low, Info)
- Detailed vulnerability information with solutions and references
- Crawled pages discovery with CSV export functionality
- Integration with existing findings management system

## Implementation Details

### Database Schema

#### ScanExecution Model
```prisma
model ScanExecution {
  id        String      @id @default(cuid())
  projectId String
  project   Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Tool identification
  provider    String      // "OWASP_ZAP", "BURP_SUITE", etc.
  toolVersion String?     // Version of the scanning tool used

  // Scan configuration
  targetUrl String       // The URL that was scanned
  scanType  DastScanType @default(ACTIVE)
  status    ScanStatus

  // Timing
  queuedAt    DateTime? // When scan was queued
  startedAt   DateTime? // When scan actually started
  completedAt DateTime? // When scan finished
  duration    Int?      // Scan duration in seconds

  // Error handling
  errorMessage String? @db.Text
  errorCode    String? // Tool-specific error codes

  // Results summary
  findingsCount Int @default(0)
  criticalCount Int @default(0)
  highCount     Int @default(0)
  mediumCount   Int @default(0)
  lowCount      Int @default(0)
  infoCount     Int @default(0)

  // Tool-specific configuration and metadata
  toolConfig   Json? // Scan parameters (policies, depth, etc.)
  toolMetadata Json? // Tool-specific data (scan ID, report URLs, etc.)

  // Integration tracking
  securityToolIntegrationId String?
  securityToolIntegration   SecurityToolIntegration? @relation(fields: [securityToolIntegrationId], references: [id])

  // User who initiated
  initiatedById String?
  initiatedBy   User?   @relation(fields: [initiatedById], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([projectId])
  @@index([status])
  @@index([provider])
  @@index([targetUrl])
}
```

#### Enhanced Finding Model
```prisma
model Finding {
  id     String        @id @default(cuid())
  status FindingStatus @default(NEW)

  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  vulnerabilityId String
  source          String
  vulnerability   Vulnerability @relation(fields: [vulnerabilityId, source], references: [vulnerabilityId, source])

  // URL where the vulnerability was found (for DAST findings)
  url String?

  // Source-specific details
  metadata Json?

  firstSeenAt DateTime  @default(now())
  lastSeenAt  DateTime  @updatedAt
  resolvedAt  DateTime?

  @@unique([projectId, vulnerabilityId, source])
  @@index([projectId])
  @@index([url])
}
```

#### Enums
```prisma
enum DastScanType {
  ACTIVE
  PASSIVE
  BASELINE
  FULL
  CUSTOM
}

enum ScanStatus {
  PENDING
  QUEUED
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
  IMPORTED
}
```

### Backend Architecture

#### Scanner Abstraction Layer

**DastScannerBase** - Abstract base class providing common interface:
```javascript
export class DastScannerBase {
  constructor(config = {}) {
    this.config = config;
    this.scanTimeout = config.timeout || 3600; // 1 hour default
  }

  // Abstract methods that must be implemented by specific scanners
  async isAvailable() { throw new Error('Not implemented'); }
  async startScan(targetUrl, scanConfig = {}) { throw new Error('Not implemented'); }
  async getScanStatus(scanId) { throw new Error('Not implemented'); }
  async getScanResults(scanId, targetUrl = '') { throw new Error('Not implemented'); }
  async cancelScan(scanId) { throw new Error('Not implemented'); }
  async getDetailedScanInfo(scanId, targetUrl) { throw new Error('Not implemented'); }
}
```

**ZapScanner** - OWASP ZAP implementation:
- ZAP API integration with retry logic
- Comprehensive error handling for connection issues
- Alert transformation to standardized finding format
- Scan lifecycle management (start, monitor, results, cancel)
- URL-specific finding association

#### API Endpoints

**POST /api/projects/:id/dast/scan**
- Launch new DAST scan
- Requires ADMIN or EDITOR permissions
- Validates target URL and scan configuration
- Returns scan execution ID and initial status

**GET /api/projects/:id/dast/scans**
- List project's DAST scans with pagination
- Supports limit/offset parameters
- Returns scan history with summary information

**GET /api/projects/:id/dast/scans/:scanId**
- Get specific scan details
- Returns live status for running scans
- Includes progress information and findings count

**GET /api/projects/:id/dast/scans/:scanId/details**
- Get comprehensive scan information
- Includes crawled pages, detailed alerts, and ZAP statistics
- Returns downloadable scan data

**DELETE /api/projects/:id/dast/scans/:scanId**
- Cancel running scan
- Updates scan status to CANCELLED
- Attempts to stop scan in ZAP

### Frontend Implementation

#### DastScanManager Component
Located: `packages/web/src/components/applications/DastScanManager.jsx`

**Features:**
- Integrated into ApplicationDetails Security tab
- URL confirmation modal with scan customization
- Recent scans display (5 most recent)
- "View All" modal with full pagination (10 per page)
- Real-time progress monitoring
- Scan cancellation functionality

**Key Functions:**
- `handleLaunchScan()` - Initiates new scan with configuration
- `handleCancelScan()` - Cancels running scan
- `pollForRunningScans()` - Real-time status updates
- `refreshData()` - Updates scan list and findings

#### ScanDetailsModal Component
Located: `packages/web/src/components/applications/ScanDetailsModal.jsx`

**Features:**
- Tabbed interface (Overview, Crawled Pages, Findings)
- Detailed vulnerability information with severity colors
- CSV export of crawled pages
- ZAP statistics and configuration display
- Rich finding details with solutions and references

### Docker Infrastructure

#### ZAP Container Configuration
```yaml
zap:
  image: zaproxy/zap-stable:latest
  container_name: stagehand-zap
  ports:
    - "8080:8080"
  command: 
    - /bin/bash
    - -c
    - |
      zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true &&
      sleep 5 &&
      curl -s "http://localhost:8080/JSON/core/action/newSession/?name=default" || true &&
      tail -f /dev/null
  restart: unless-stopped
  volumes:
    - zap-data:/zap/wrk
    - zap-sessions:/root/.ZAP/session
  environment:
    - ZAP_API_URL=http://zap:8080
    - ZAP_SCAN_TIMEOUT=3600
```

## Security Considerations

### Access Control
- DAST scan launching requires ADMIN or EDITOR role
- All users with project access can view scan results
- Scan history is project-scoped and permission-controlled

### Data Handling
- Scan results are automatically processed and stored
- URLs are validated before scanning
- Error messages are sanitized before storage
- Tool metadata is stored as JSON for flexibility

### Network Security
- ZAP container runs in isolated Docker network
- API communications use internal container networking
- No external ZAP API access exposed

## Usage Guide

### Launching a Scan

1. Navigate to Project → Applications → Security tab
2. Click "Launch DAST Scan" button
3. Confirm target URL and customize scan settings:
   - Select scan intensity (Quick/Standard/Thorough)
   - Choose crawl depth (Shallow/Medium/Deep)
   - Set maximum duration
   - Optionally include subdomains
4. Click "Launch Scan" to start

### Monitoring Progress

1. Active scans display real-time progress bars
2. "Live Scan Running" badge indicates active monitoring
3. Progress updates every 5 seconds automatically
4. Cancel button available for running scans

### Viewing Results

1. Recent scans appear in scan history section
2. Click any scan row to open detailed modal
3. Use "View All Scans" for complete paginated history
4. Export crawled pages as CSV from details modal

### Managing Findings

1. Completed scans automatically create Finding records
2. Findings appear in project's security findings list
3. Each finding includes specific URL where vulnerability was found
4. Severity-based categorization with color coding
5. Findings integrate with existing triage workflow

## Troubleshooting

### Common Issues

**ZAP Container Not Starting**
- Check Docker container status: `docker ps`
- Verify port 8080 is available
- Review container logs: `docker logs stagehand-zap`

**Scan Stuck in Running State**
- Check ZAP container connectivity
- Verify target URL is accessible from container
- Review scan logs in backend console

**No Findings Returned**
- Verify target URL responds correctly
- Check if application has security vulnerabilities
- Review ZAP scan logs for errors

**Progress Not Updating**
- Check network connectivity to ZAP API
- Verify frontend polling is working (check browser network tab)
- Ensure scan hasn't completed or failed

### Debugging

**Backend Logs:**
```bash
# View API logs
docker logs stagehand-api

# View ZAP logs  
docker logs stagehand-zap
```

**Frontend Debugging:**
- Open browser developer tools
- Check Network tab for API call failures
- Review Console for JavaScript errors
- Monitor polling requests to scan status endpoints

## Future Enhancements

### Planned Features
- Additional scanner providers (Burp Suite, Acunetix)
- Scheduled recurring scans
- Custom scan policies and configurations
- Integration with CI/CD pipelines
- Advanced reporting and analytics
- Scan result comparison and trending

### Configuration Extensions
- Custom ZAP scripts and plugins
- Advanced authentication handling
- API security testing capabilities
- Performance testing integration
- Custom vulnerability rule sets

## API Reference

For detailed API documentation, see [API Documentation - DAST Scans](api/dast-scans.md).

For frontend component details, see [Frontend Components - Applications](frontend/components/applications.md). 
# DAST Scanning MVP Implementation Plan

## Overview

This document outlines the implementation of a tool-agnostic DAST (Dynamic Application Security Testing) scanning framework with OWASP ZAP as the first implementation. The MVP focuses on launching scans with manual URL input and importing results into the existing security findings system.

## Requirements Summary

- **Scope**: Tool-agnostic framework with ZAP as first implementation
- **Functionality**: Launch new scans only (no external import in MVP)
- **UI**: Simple "Launch Scan" button with URL confirmation modal
- **Target**: Manual URL input during scan launch
- **Infrastructure**: ZAP container added to main docker-compose.yml
- **Permissions**: Admin/Editor can launch scans, all roles can view/cancel
- **Limitations**: Use ZAP defaults, no custom restrictions

## Database Schema Changes

### New Models

```prisma
// Generic DAST scan types
enum DastScanType {
  ACTIVE
  PASSIVE
  BASELINE
  FULL
  CUSTOM
}

// Generic scan status
enum ScanStatus {
  PENDING
  QUEUED
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
  IMPORTED  // For future external scan support
}

// Add generic scan fields to Project model
model Project {
  // ... existing fields
  
  // Generic DAST fields
  dastScanEnabled     Boolean? @default(false)
  lastDastScanDate    DateTime?
  dastScanSettings    Json? // Store tool-agnostic scan configuration
  
  // Relations
  scanExecutions      ScanExecution[]
}

// Generic scan execution model (not tool-specific)
model ScanExecution {
  id                String      @id @default(cuid())
  projectId         String
  project           Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // Tool identification
  provider          String      // "OWASP_ZAP", "BURP_SUITE", etc.
  toolVersion       String?     // Version of the scanning tool used
  
  // Scan configuration
  targetUrl         String      // The URL that was scanned
  scanType          DastScanType @default(ACTIVE)
  status            ScanStatus
  
  // Timing (optional for imported scans)
  queuedAt          DateTime?   // When scan was queued
  startedAt         DateTime?   // When scan actually started
  completedAt       DateTime?   // When scan finished
  duration          Int?        // Scan duration in seconds
  
  // Error handling
  errorMessage      String?     @db.Text
  errorCode         String?     // Tool-specific error codes
  
  // Results summary
  findingsCount     Int         @default(0)
  criticalCount     Int         @default(0)
  highCount         Int         @default(0)
  mediumCount       Int         @default(0)
  lowCount          Int         @default(0)
  infoCount         Int         @default(0)
  
  // Tool-specific configuration and metadata
  toolConfig        Json?       // Scan parameters (policies, depth, etc.)
  toolMetadata      Json?       // Tool-specific data (scan ID, report URLs, etc.)
  
  // External scan tracking (for future use)
  externalScanId    String?     // ID from external tool
  externalReportUrl String?     // Link to external report
  isExternalScan    Boolean     @default(false) // Whether this was run externally
  
  // Integration tracking
  securityToolIntegrationId String?
  securityToolIntegration   SecurityToolIntegration? @relation(fields: [securityToolIntegrationId], references: [id])
  syncLogId                 String?
  syncLog                   IntegrationSyncLog? @relation(fields: [syncLogId], references: [id])
  
  // User who initiated (optional for imported scans)
  initiatedById     String?
  initiatedBy       User?       @relation(fields: [initiatedById], references: [id])
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([projectId])
  @@index([status])
  @@index([provider])
  @@index([targetUrl])
}
```

## Backend Implementation

### 1. Database Migration
- Create Prisma migration for new models
- Add relationships to existing models (User, SecurityToolIntegration, IntegrationSyncLog)

### 2. DAST Service Framework (`packages/api/src/utils/dastService.js`)
- Abstract base class for DAST scanners
- ZAP scanner implementation
- Scanner factory function

### 3. ZAP Integration (`packages/api/src/utils/zapScanner.js`)
- ZAP API client
- Scan lifecycle management
- Results processing

### 4. Scan Processing (`packages/api/src/utils/scanProcessor.js`)
- Background scan job processing
- Results transformation to Vulnerability/Finding records
- Status tracking and error handling

### 5. API Routes (`packages/api/src/routes/dastScans.js`)
- `POST /api/v1/projects/:projectId/dast/scan` - Launch scan
- `GET /api/v1/projects/:projectId/dast/scans` - List scans
- `GET /api/v1/projects/:projectId/dast/scans/:scanId` - Get scan details
- `DELETE /api/v1/projects/:projectId/dast/scans/:scanId` - Cancel scan

## Frontend Implementation

### 1. Components
- `DastScanControl.jsx` - Main scan control in ApplicationDetails
- `DastScanModal.jsx` - URL confirmation and scan launch modal
- `ScanHistoryTable.jsx` - Table of past scan executions
- `ScanStatusIndicator.jsx` - Real-time scan status display

### 2. State Management (`packages/web/src/stores/useDastScanStore.js`)
- Scan execution management
- Status polling
- Scan history fetching

### 3. Integration Points
- Add scan control to ApplicationDetails Security tab
- Integrate with existing findings display
- Permission-based UI rendering

## Infrastructure

### Docker Configuration
- Add ZAP container to main docker-compose.yml
- Configure ZAP in headless mode with API access
- Network connectivity between API and ZAP containers

### Environment Variables
```bash
ZAP_API_URL=http://zap:8080
ZAP_API_KEY=auto-generated
ZAP_SCAN_TIMEOUT=3600
```

## Implementation Steps

1. **Database Schema** - Create migration and update models
2. **ZAP Infrastructure** - Add container and service configuration
3. **Backend Core** - DAST service framework and ZAP integration
4. **API Routes** - DAST scan management endpoints
5. **Frontend Components** - Scan control UI and modals
6. **Integration** - Connect to ApplicationDetails and findings system
7. **Testing** - Verify end-to-end scan workflow

## Success Criteria

- Users can launch ZAP scans from project pages with manual URL input
- Scan results appear in the unified findings view
- Scan history and status tracking works reliably
- System handles scan failures gracefully
- UI respects permission levels (Admin/Editor launch, all can view/cancel)

## Future Expansion Points

- Import external scan results
- Additional DAST tool integrations
- Advanced scan configuration options
- Scheduled scans
- Custom scan policies 
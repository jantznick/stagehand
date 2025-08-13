# Manual Finding Creation Feature Implementation Plan

## Overview

This feature allows users to manually add security findings to projects, serving as the foundation for future bulk import capabilities from external security tools and pen testers. The implementation builds upon the existing Finding/Vulnerability data models and UI components.

## User Flow

1. User navigates to a project's findings page
2. User clicks "Add Finding" button (requires ADMIN/EDITOR permissions)
3. Modal opens with a vulnerability search form
4. User types in search input (debounced at 300ms) to search existing vulnerabilities
5. If vulnerability exists in database, user selects it from dropdown
6. If vulnerability not found, user can enter CVE/GHSA ID for external lookup
7. System fetches vulnerability data from NVD or MITRE databases
8. User reviews vulnerability details and adds finding-specific metadata
9. System creates/upserts vulnerability record and creates finding record
10. Finding appears in the project's findings list

## Current State Analysis

### Existing Infrastructure ✅
- **Data Models**: `Vulnerability` and `Finding` models are implemented in Prisma schema
- **API Layer**: Basic findings API exists at `/api/v1/projects/:projectId/findings` (GET only)
- **Frontend Components**: `FindingList.jsx` and `FindingDetailsModal.jsx` are implemented
- **State Management**: `useFindingStore.js` handles findings state with `fetchFindings` functionality
- **Permissions**: Role-based access control is in place

### Missing Components ❌
- Manual finding creation API endpoint
- Vulnerability search/lookup functionality  
- External CVE/vulnerability database integration
- Add Finding UI modal and form
- Frontend state management for finding creation

## Implementation Plan

### Phase 1: Backend API Development

#### 1.1 Vulnerability Search API
**File**: `packages/api/src/routes/vulnerabilities.js` (new)

Create a new vulnerability search endpoint that:
- Searches existing vulnerabilities in the database by title/ID
- Integrates with external vulnerability databases (NVD, MITRE)
- Returns standardized vulnerability data format
- Handles CVE, GHSA, and custom vulnerability IDs

**Endpoints**:
```
GET /api/v1/vulnerabilities/search?q={query}     - Search existing vulnerabilities
GET /api/v1/vulnerabilities/external/{cveId}     - Fetch from external sources
```

**Response Format**:
```json
{
  "vulnerabilities": [
    {
      "id": "vuln_123",
      "vulnerabilityId": "CVE-2023-1234", 
      "title": "SQL Injection in User Authentication",
      "severity": "HIGH",
      "description": "Detailed vulnerability description...",
      "source": "Manual Entry",
      "references": {
        "urls": ["https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-1234"]
      }
    }
  ]
}
```

#### 1.2 Manual Finding Creation API
**File**: `packages/api/src/routes/findings.js` (extend existing)

Add new endpoint to existing findings router:
```
POST /api/v1/projects/:projectId/findings         - Create manual finding
```

**Request Format**:
```json
{
  "vulnerabilityId": "CVE-2023-1234",
  "source": "Manual Entry",
  "status": "NEW",
  "metadata": {
    "component": "User login form",
    "notes": "Discovered during manual testing",
    "enteredBy": "user_id"
  }
}
```

**Functionality**:
- Accept vulnerability ID (existing) or CVE/external ID (fetch from external source)
- Create/upsert vulnerability record if needed
- Create finding record linked to project and vulnerability
- Set source as "Manual Entry" 
- Validate user permissions (ADMIN/EDITOR required)
- Return created finding with vulnerability details

#### 1.3 External Vulnerability Integration Service
**File**: `packages/api/src/utils/vulnerabilityLookup.js` (new)

Create service for external vulnerability database integration:

**Features**:
- NVD (National Vulnerability Database) integration
- MITRE CVE database integration  
- Standardized response format across sources
- Rate limiting and caching
- Fallback mechanisms for API unavailability

**External API Specifications**:

**National Vulnerability Database (NVD)**:
- Endpoint: `https://services.nvd.nist.gov/rest/json/cves/2.0`
- Rate limit: 50 requests per 30 seconds (no API key)
- Response format: JSON with CVE details
- Primary source for CVE lookups

**MITRE CVE Database**:
- Endpoint: `https://cve.mitre.org/cgi-bin/cvename.cgi`
- Fallback for NVD failures
- Web scraping or alternative API approach

### Phase 2: Frontend Development

#### 2.1 Add Finding Modal Component
**File**: `packages/web/src/components/findings/AddFindingModal.jsx` (new)

Create modal component with:
- **Vulnerability Search Section**:
  - Debounced search input (300ms delay)
  - Dropdown showing existing vulnerabilities from internal database
  - Search results with vulnerability preview (title, severity, description excerpt)
  
- **External Lookup Section**:
  - CVE/GHSA ID input field with validation
  - "Lookup External" button
  - Loading state during external API calls
  - Preview of fetched vulnerability data
  
- **Finding Details Section**:
  - Status dropdown (NEW, TRIAGED, IN_PROGRESS, RESOLVED, IGNORED)
  - Component/Location text input
  - Notes textarea for additional context
  - Metadata fields as needed

- **Actions**:
  - Cancel button
  - Save button (disabled until vulnerability selected)
  - Loading states and error handling

#### 2.2 Vulnerability Search Component
**File**: `packages/web/src/components/findings/VulnerabilitySearch.jsx` (new)

Specialized search component featuring:
- Real-time search with debouncing
- Search results display with vulnerability details
- "Not found? Try external lookup" option
- CVE/GHSA ID validation (format checking)
- Integration with external vulnerability APIs
- Loading spinners and error states

**CVE ID Validation Patterns**:
- CVE format: `CVE-YYYY-NNNN` (e.g., CVE-2023-1234)
- GHSA format: `GHSA-xxxx-xxxx-xxxx` (e.g., GHSA-abcd-1234-wxyz)

#### 2.3 Update Finding List Component
**File**: `packages/web/src/components/findings/FindingList.jsx` (modify existing)

Add "Add Finding" button to existing component:
- **Button Placement**: Top-right of findings list, next to filter controls
- **Permissions Check**: Only show to users with ADMIN/EDITOR roles
- **Click Handler**: Opens AddFindingModal
- **Post-Creation**: Refreshes findings list after successful creation
- **Styling**: Consistent with existing UI patterns

**Button Implementation**:
```jsx
{canEdit && (
  <button
    onClick={() => setShowAddModal(true)}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
  >
    Add Finding
  </button>
)}
```

#### 2.4 State Management Updates
**File**: `packages/web/src/stores/useFindingStore.js` (extend existing)

Add new functions to existing store:

```javascript
// New state properties
vulnerabilitySearchResults: [],
isSearching: false,
searchError: null,
isCreating: false,
createError: null,

// New methods
searchVulnerabilities: async (query) => {
  // Search internal database with debouncing
},

lookupExternalVulnerability: async (cveId) => {
  // Fetch from external sources (NVD, MITRE)
},

createManualFinding: async (projectId, findingData) => {
  // Create new finding and refresh findings list
},

clearSearch: () => {
  // Reset search state
}
```

### Phase 3: Integration & User Experience

#### 3.1 Permission Integration
Ensure manual finding creation respects existing permission system:
- Only ADMIN and EDITOR roles can create findings
- All project members can view findings
- Integrate with existing `hasPermission` utility
- UI elements conditionally rendered based on permissions

#### 3.2 External API Configuration
**File**: `packages/api/src/config/vulnerability-apis.js` (new)

Configuration for external vulnerability databases:
```javascript
export const VULNERABILITY_APIS = {
  NVD: {
    baseUrl: 'https://services.nvd.nist.gov/rest/json/cves/2.0',
    rateLimit: {
      requests: 50,
      window: 30000 // 30 seconds
    },
    timeout: 5000
  },
  MITRE: {
    baseUrl: 'https://cve.mitre.org/cgi-bin/cvename.cgi',
    timeout: 5000
  }
};
```

#### 3.3 Data Model Considerations
Update existing models to support manual entry:

**Vulnerability Model Updates** (no schema changes needed):
- Source field supports "Manual Entry" value
- Custom vulnerability IDs for internal findings
- Maintain audit trail through existing timestamps

**Finding Model Updates** (no schema changes needed):
- Source field set to "Manual Entry" for manual findings
- Metadata field stores manual entry details:
  ```json
  {
    "component": "User login form",
    "notes": "Discovered during manual testing",
    "enteredBy": "user_id",
    "entryDate": "2025-08-13T10:30:00Z"
  }
  ```

### Phase 4: Future-Proofing & Extensibility

#### 4.1 Bulk Import Foundation
Design the manual entry system to support future bulk import:
- **Standardized Input Validation**: Reusable validation functions
- **Batch Processing Capabilities**: API design supports multiple findings
- **Import Preview Functionality**: Review before committing
- **Rollback Mechanisms**: Ability to undo import operations

#### 4.2 Deduplication Framework
Prepare for future deduplication features:
- **Standardized Vulnerability Matching**: CVE ID, title, description comparison
- **Metadata Comparison Utilities**: Helper functions for finding similarity
- **Conflict Resolution Workflows**: UI for handling duplicates
- **Historical Tracking**: Audit trail of finding changes and merges

## Technical Specifications

### Database Schema

No schema changes required - existing models support manual entries:

**Existing Vulnerability Model**:
```prisma
model Vulnerability {
  id              String @id @default(cuid())
  vulnerabilityId String
  source          String // Can be "Manual Entry"
  title           String
  description     String @db.Text
  severity        String
  cvssScore       Float?
  remediation     String? @db.Text
  references      Json?
  findings        Finding[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([vulnerabilityId, source])
}
```

**Existing Finding Model**:
```prisma
model Finding {
  id              String @id @default(cuid())
  status          FindingStatus @default(NEW)
  projectId       String
  project         Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  source          String // Will be "Manual Entry"
  type            SecurityToolType?
  vulnerabilityId String
  vulnerability   Vulnerability @relation(fields: [vulnerabilityId, source], references: [vulnerabilityId, source])
  url             String?
  metadata        Json? // Stores manual entry details
  firstSeenAt     DateTime @default(now())
  lastSeenAt      DateTime @updatedAt
  resolvedAt      DateTime?
  
  @@unique([projectId, vulnerabilityId, source])
  @@index([projectId])
}
```

### API Error Handling

**Standard Error Responses**:
```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific field that caused error"
  }
}
```

**Common Error Scenarios**:
- 400: Invalid CVE ID format
- 403: Insufficient permissions to create findings
- 404: Project not found or external CVE not found
- 429: Rate limit exceeded for external APIs
- 500: External API unavailable

### Security Considerations

#### Input Validation
- **Sanitize User Inputs**: Prevent XSS in vulnerability descriptions and notes
- **Validate CVE ID Formats**: Regex validation for CVE and GHSA patterns
- **Limit Field Lengths**: Prevent excessive data storage

#### API Security
- **Rate Limiting**: Implement rate limiting for external API calls
- **Secure API Key Storage**: Environment variables for external service authentication
- **Request Validation**: Validate all incoming data against schemas

#### Data Integrity
- **Prevent Duplicate Vulnerabilities**: Use compound unique constraints
- **Audit Trail**: Track who created manual entries and when
- **Rollback Capabilities**: Soft delete approach for error correction

## Success Criteria

### Functional Requirements
- ✅ Users can search for existing vulnerabilities in the database
- ✅ Users can create findings from external CVE lookups
- ✅ All manually created findings appear in the findings list
- ✅ Proper permission enforcement (ADMIN/EDITOR only)
- ✅ Integration with existing UI and state management

### Performance Requirements
- ✅ Vulnerability search responds within 500ms
- ✅ External API lookups complete within 5 seconds
- ✅ UI remains responsive during API calls
- ✅ Debounced search prevents excessive API calls

### User Experience Requirements
- ✅ Intuitive search and selection process
- ✅ Clear error messages for failed lookups
- ✅ Seamless integration with existing findings UI
- ✅ Loading states provide clear feedback
- ✅ Form validation guides user input

## Implementation Sequence

### Week 1: Backend Foundation
1. Create vulnerability search API endpoint
2. Implement external vulnerability lookup service
3. Add manual finding creation endpoint
4. Set up external API configuration

### Week 2: Frontend Development
1. Build AddFindingModal component
2. Create VulnerabilitySearch component
3. Update FindingList with Add button
4. Extend useFindingStore with new methods

### Week 3: Integration & Polish
1. Integrate permission checks throughout
2. Add comprehensive error handling
3. Implement loading states and user feedback
4. Performance optimization and caching

### Week 4: Documentation & Deployment
1. Update API documentation
2. Create user guides
3. Deploy to staging environment
4. Conduct user acceptance testing

This implementation plan provides a solid foundation for manual finding creation while setting up the architecture needed for future bulk import and deduplication features. The phased approach allows for iterative development and validation at each step.

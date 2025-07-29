# DAST Scans API

Dynamic Application Security Testing (DAST) scanning endpoints for managing automated security scans on web applications.

## Overview

The DAST Scans API provides endpoints to:
- Launch new security scans on web applications
- Monitor scan progress and status
- Retrieve scan results and findings
- Manage scan history and cancellation
- Export detailed scan reports

All DAST scan endpoints require project-level permissions and are scoped to specific projects.

## Endpoints

### Launch DAST Scan

Launch a new DAST scan for a project's web application.

```http
POST /api/projects/{projectId}/dast/scan
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectId` | string | Yes | Project ID to scan |

#### Request Body

```json
{
  "targetUrl": "https://example.com",
  "scanConfig": {
    "intensity": "STANDARD",
    "crawlDepth": "MEDIUM", 
    "maxDuration": 1800,
    "includeSubdomains": false,
    "customPolicies": []
  }
}
```

##### Scan Configuration Options

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `intensity` | string | `QUICK`, `STANDARD`, `THOROUGH` | Scan intensity level |
| `crawlDepth` | string | `SHALLOW`, `MEDIUM`, `DEEP` | Site crawling depth |
| `maxDuration` | number | 900-7200 | Maximum scan duration in seconds |
| `includeSubdomains` | boolean | - | Include subdomains in scan scope |
| `customPolicies` | array | - | Custom ZAP policies (future use) |

#### Response

```json
{
  "success": true,
  "data": {
    "scanExecutionId": "scan_12345",
    "status": "PENDING",
    "targetUrl": "https://example.com",
    "estimatedDuration": 1800,
    "queuedAt": "2024-07-02T20:30:00Z"
  }
}
```

#### Permissions Required
- Requires `'project:update'` permission.

#### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_URL` | Target URL is invalid or unreachable |
| 403 | `INSUFFICIENT_PERMISSIONS` | User lacks scan permissions |
| 409 | `SCAN_IN_PROGRESS` | Project already has running scan |
| 503 | `SCANNER_UNAVAILABLE` | ZAP scanner is not available |

---

### List Project Scans

Retrieve paginated list of DAST scans for a project.

```http
GET /api/projects/{projectId}/dast/scans
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of scans to return (1-50) |
| `offset` | number | 0 | Number of scans to skip |
| `status` | string | - | Filter by scan status |
| `provider` | string | - | Filter by scanner provider |

#### Response

```json
{
  "success": true,
  "data": {
    "scans": [
      {
        "id": "scan_12345",
        "status": "COMPLETED",
        "targetUrl": "https://example.com",
        "provider": "OWASP_ZAP",
        "progress": 100,
        "findingsCount": 15,
        "criticalCount": 2,
        "highCount": 5,
        "mediumCount": 6,
        "lowCount": 2,
        "infoCount": 0,
        "queuedAt": "2024-07-02T20:30:00Z",
        "startedAt": "2024-07-02T20:31:00Z",
        "completedAt": "2024-07-02T20:45:00Z",
        "duration": 840,
        "initiatedBy": "user@example.com"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### Permissions Required
- Requires `'project:read'` permission.

---

### Get Scan Status

Get current status and progress of a specific scan.

```http
GET /api/projects/{projectId}/dast/scans/{scanId}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "scan_12345",
    "status": "RUNNING",
    "progress": 65,
    "targetUrl": "https://example.com",
    "provider": "OWASP_ZAP",
    "projectName": "My Web App",
    "initiatedBy": "user@example.com",
    "queuedAt": "2024-07-02T20:30:00Z",
    "startedAt": "2024-07-02T20:31:00Z",
    "estimatedCompletion": "2024-07-02T20:45:00Z",
    "currentPhase": "Active Scanning",
    "pagesDiscovered": 45,
    "findingsCount": 8,
    "criticalCount": 1,
    "highCount": 2,
    "mediumCount": 3,
    "lowCount": 2,
    "infoCount": 0
  }
}
```

#### Permissions Required
- Requires `'project:read'` permission.

---

### Get Detailed Scan Information

Get comprehensive scan details including crawled pages and detailed findings.

```http
GET /api/projects/{projectId}/dast/scans/{scanId}/details
```

#### Response

```json
{
  "success": true,
  "data": {
    "scanInfo": {
      "id": "scan_12345",
      "status": "COMPLETED",
      "targetUrl": "https://example.com",
      "provider": "OWASP_ZAP",
      "duration": 840,
      "findingsCount": 15
    },
    "scanDetails": {
      "crawledPages": [
        {
          "url": "https://example.com/",
          "site": "https://example.com",
          "discoveredAt": "2024-07-02T20:32:00Z",
          "method": "GET",
          "statusCode": 200,
          "responseSize": 2048,
          "responseTime": 150
        }
      ],
      "totalPagesCrawled": 45,
      "uniqueDomains": ["example.com"],
      "zapStatistics": {
        "requestsSent": 150,
        "responsesReceived": 150,
        "averageResponseTime": 125
      },
      "detailedAlerts": [
        {
          "id": "alert_001",
          "pluginId": "10021",
          "name": "X-Content-Type-Options Header Missing",
          "description": "The Anti-MIME-Sniffing header...",
          "risk": "Low",
          "confidence": "Medium",
          "url": "https://example.com/login",
          "solution": "Ensure that the application/web server...",
          "reference": "https://owasp.org/www-project-secure-headers/",
          "cweid": "16",
          "wascid": "15",
          "instances": [
            {
              "uri": "https://example.com/login",
              "method": "GET",
              "param": "",
              "attack": "",
              "evidence": ""
            }
          ]
        }
      ],
      "scanConfiguration": {
        "intensity": "STANDARD",
        "crawlDepth": "MEDIUM",
        "maxDuration": 1800,
        "includeSubdomains": false
      }
    }
  }
}
```

#### Permissions Required
- Requires `'project:read'` permission.

---

### Cancel Running Scan

Cancel a currently running scan.

```http
DELETE /api/projects/{projectId}/dast/scans/{scanId}
```

#### Response

```json
{
  "success": true,
  "message": "Scan cancelled successfully",
  "data": {
    "id": "scan_12345",
    "status": "CANCELLED",
    "cancelledAt": "2024-07-02T20:35:00Z"
  }
}
```

#### Permissions Required
- Requires `'project:update'` permission.

---

## Webhooks (Future)

### Scan Completion Webhook

When a scan completes, a webhook can be sent to configured endpoints:

```json
{
  "event": "scan.completed",
  "timestamp": "2024-07-02T20:45:00Z",
  "data": {
    "scanId": "scan_12345",
    "projectId": "proj_789",
    "status": "COMPLETED",
    "findingsCount": 15,
    "criticalCount": 2,
    "targetUrl": "https://example.com"
  }
}
```

## Rate Limits

- **Scan Creation**: Maximum 5 scans per project per hour
- **Status Polling**: Maximum 60 requests per minute per scan
- **List Operations**: Maximum 100 requests per minute

## Examples

### Launch a Quick Scan

```bash
curl -X POST /api/projects/proj_123/dast/scan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "https://example.com",
    "scanConfig": {
      "intensity": "QUICK",
      "crawlDepth": "SHALLOW",
      "maxDuration": 900
    }
  }'
```

### Monitor Scan Progress

```bash
# Poll scan status
curl -X GET /api/projects/proj_123/dast/scans/scan_456 \
  -H "Authorization: Bearer $TOKEN"

# Get detailed information
curl -X GET /api/projects/proj_123/dast/scans/scan_456/details \
  -H "Authorization: Bearer $TOKEN"
```

### Export Crawled Pages

The crawled pages can be exported as CSV by processing the `crawledPages` array from the detailed scan response:

```javascript
// Frontend example for CSV export
const exportCrawledPages = (crawledPages) => {
  const csvContent = [
    ['URL', 'Site', 'Discovered At', 'Method', 'Status Code'],
    ...crawledPages.map(page => [
      page.url,
      page.site,
      page.discoveredAt,
      page.method,
      page.statusCode
    ])
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scan-crawled-pages-${scanId}.csv`;
  a.click();
};
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error context"
    }
  }
}
```

Common error codes:
- `INVALID_URL`: Target URL format is invalid
- `UNREACHABLE_URL`: Target URL cannot be reached
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `SCAN_IN_PROGRESS`: Project already has active scan
- `SCANNER_UNAVAILABLE`: DAST scanner service unavailable
- `SCAN_NOT_FOUND`: Requested scan does not exist
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Integration Notes

### With Findings API

DAST scan results automatically create entries in the Findings API:
- Each vulnerability becomes a `Vulnerability` record
- Each instance becomes a `Finding` record linked to the project
- Findings include the specific URL where vulnerability was found
- Source is set to descriptive value like "Stagehand DAST (OWASP ZAP)"

### With Permissions System

DAST scanning integrates with the new permissions system:
- The `'project:update'` permission is required to launch and cancel scans.
- The `'project:read'` permission is required to view scan results.
- Permissions are inherited from parent resources (Team, Company, etc.).

### Real-time Updates

For real-time scan progress updates:
1. Frontend should poll the scan status endpoint every 5 seconds during active scans
2. Polling should stop when scan reaches terminal status (`COMPLETED`, `FAILED`, `CANCELLED`)
3. Use exponential backoff for failed requests
4. Consider WebSocket upgrades for future real-time implementations 
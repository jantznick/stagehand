// DAST scan-specific schemas
export const ScanExecution = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    projectId: { type: 'string' },
    provider: {
      type: 'string',
      enum: ['OWASP_ZAP', 'BURP_SUITE', 'ACUNETIX']
    },
    targetUrl: { type: 'string' },
    scanType: {
      type: 'string',
      enum: ['ACTIVE', 'PASSIVE', 'BASELINE', 'FULL', 'CUSTOM']
    },
    status: {
      type: 'string',
      enum: ['PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']
    },
    progress: {
      type: 'integer',
      minimum: 0,
      maximum: 100
    },
    queuedAt: {
      type: 'string',
      format: 'date-time'
    },
    startedAt: {
      type: 'string',
      format: 'date-time'
    },
    completedAt: {
      type: 'string',
      format: 'date-time'
    },
    duration: {
      type: 'integer',
      description: 'Scan duration in seconds'
    },
    findingsCount: { type: 'integer' },
    criticalCount: { type: 'integer' },
    highCount: { type: 'integer' },
    mediumCount: { type: 'integer' },
    lowCount: { type: 'integer' },
    infoCount: { type: 'integer' },
    errorMessage: { type: 'string' },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
  }
};

export const LaunchScanRequest = {
  type: 'object',
  required: ['targetUrl'],
  properties: {
    targetUrl: {
      type: 'string',
      format: 'uri',
      description: 'The URL to scan'
    },
    provider: {
      type: 'string',
      enum: ['OWASP_ZAP'],
      default: 'OWASP_ZAP',
      description: 'DAST tool provider'
    },
    scanType: {
      type: 'string',
      enum: ['ACTIVE', 'PASSIVE', 'BASELINE'],
      default: 'ACTIVE',
      description: 'Type of scan to perform'
    },
    scanConfig: {
      type: 'object',
      description: 'Tool-specific scan configuration'
    }
  }
}; 
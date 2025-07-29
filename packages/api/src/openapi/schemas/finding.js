// Finding-specific schemas
export const Vulnerability = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    cveId: {
      type: 'string',
      description: 'CVE identifier'
    },
    title: {
      type: 'string',
      description: 'Vulnerability title'
    },
    description: {
      type: 'string',
      description: 'Detailed vulnerability description'
    },
    severity: {
      type: 'string',
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'],
      description: 'Vulnerability severity level'
    },
    cvssScore: {
      type: 'number',
      format: 'float',
      description: 'CVSS score'
    },
    packageName: {
      type: 'string',
      description: 'Affected package name'
    },
    packageVersion: {
      type: 'string',
      description: 'Affected package version'
    },
    fixedVersion: {
      type: 'string',
      description: 'Version that fixes the vulnerability'
    },
    references: {
      type: 'array',
      items: { type: 'string' },
      description: 'Reference URLs'
    },
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

export const FindingWithVulnerability = {
  allOf: [
    { $ref: '#/components/schemas/Finding' },
    {
      type: 'object',
      properties: {
        vulnerability: { $ref: '#/components/schemas/Vulnerability' }
      }
    }
  ]
}; 
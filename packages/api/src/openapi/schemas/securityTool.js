// Security tool-specific schemas
export const SecurityTool = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: {
      type: 'string',
      description: 'Security tool name'
    },
    type: {
      type: 'string',
      enum: ['SNYK'],
      description: 'Type of security tool'
    },
    organizationId: {
      type: 'string',
      description: 'Organization ID this tool belongs to'
    },
    credentials: {
      type: 'string',
      description: 'Encrypted credentials for the tool'
    },
    lastSyncAt: {
      type: 'string',
      format: 'date-time',
      description: 'Last synchronization timestamp'
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

export const CreateSecurityToolRequest = {
  type: 'object',
  required: ['provider', 'type', 'resourceType', 'resourceId', 'credentials'],
  properties: {
    provider: {
      type: 'string',
      enum: ['Snyk'],
      description: 'Security tool provider name'
    },
    type: {
      type: 'string',
      enum: ['SNYK'],
      description: 'Type of security tool'
    },
    displayName: {
      type: 'string',
      description: 'Display name for the security tool integration'
    },
    resourceType: {
      type: 'string',
      enum: ['organization', 'company', 'team', 'project'],
      description: 'Type of resource to associate with'
    },
    resourceId: {
      type: 'string',
      description: 'Resource ID to associate with'
    },
    credentials: {
      type: 'object',
      description: 'Security tool credentials (will be encrypted)',
      properties: {
        apiToken: {
          type: 'string',
          description: 'API token for the security tool'
        },
        orgId: {
          type: 'string',
          description: 'Organization ID in the security tool'
        }
      }
    }
  }
};

export const SecurityToolProject = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: {
      type: 'string',
      description: 'Project name in security tool'
    },
    externalId: {
      type: 'string',
      description: 'External project ID from security tool'
    },
    url: {
      type: 'string',
      description: 'Project URL in security tool'
    },
    securityToolId: {
      type: 'string',
      description: 'Security tool ID this project belongs to'
    },
    lastScanAt: {
      type: 'string',
      format: 'date-time',
      description: 'Last scan timestamp'
    },
    vulnerabilityCount: {
      type: 'integer',
      description: 'Total number of vulnerabilities found'
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

export const LinkSecurityToolProjectRequest = {
  type: 'object',
  required: ['securityToolProjectIds', 'projectIds'],
  properties: {
    securityToolProjectIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Security tool project IDs to link'
    },
    projectIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Application project IDs to link to'
    }
  }
}; 
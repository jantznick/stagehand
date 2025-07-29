// OIDC-specific schemas
export const OIDCConfig = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'OIDC configuration ID'
    },
    name: {
      type: 'string',
      description: 'Display name for the OIDC provider'
    },
    issuer: {
      type: 'string',
      description: 'OIDC issuer URL'
    },
    clientId: {
      type: 'string',
      description: 'OIDC client ID'
    },
    clientSecret: {
      type: 'string',
      description: 'Encrypted OIDC client secret'
    },
    scopes: {
      type: 'string',
      description: 'OIDC scopes (space-separated)'
    },
    organizationId: {
      type: 'string',
      description: 'Organization ID this configuration belongs to'
    },
    isActive: {
      type: 'boolean',
      description: 'Whether this OIDC configuration is active'
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

export const CreateOIDCConfigRequest = {
  type: 'object',
  required: ['name', 'issuer', 'clientId', 'clientSecret', 'organizationId'],
  properties: {
    name: {
      type: 'string',
      description: 'Display name for the OIDC provider'
    },
    issuer: {
      type: 'string',
      description: 'OIDC issuer URL'
    },
    clientId: {
      type: 'string',
      description: 'OIDC client ID'
    },
    clientSecret: {
      type: 'string',
      description: 'OIDC client secret (will be encrypted)'
    },
    scopes: {
      type: 'string',
      description: 'OIDC scopes (space-separated)',
      default: 'openid profile email'
    },
    organizationId: {
      type: 'string',
      description: 'Organization ID to associate with'
    }
  }
};

export const UpdateOIDCConfigRequest = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Display name for the OIDC provider'
    },
    issuer: {
      type: 'string',
      description: 'OIDC issuer URL'
    },
    clientId: {
      type: 'string',
      description: 'OIDC client ID'
    },
    clientSecret: {
      type: 'string',
      description: 'OIDC client secret (will be encrypted)'
    },
    scopes: {
      type: 'string',
      description: 'OIDC scopes (space-separated)'
    },
    isActive: {
      type: 'boolean',
      description: 'Whether this OIDC configuration is active'
    }
  }
}; 
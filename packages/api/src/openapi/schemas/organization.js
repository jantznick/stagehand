// Organization-specific schemas
export const UpdateOrganizationRequest = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Organization name'
    },
    description: {
      type: 'string',
      description: 'Organization description'
    },
    accountType: {
      type: 'string',
      enum: ['STANDARD', 'ENTERPRISE'],
      description: 'Account type'
    },
    defaultCompanyId: {
      type: 'string',
      description: 'Default company ID (required when downgrading to STANDARD)'
    },
    hierarchyDisplayNames: {
      type: 'object',
      description: 'Custom display names for hierarchy levels'
    }
  }
};

export const OrganizationAutoJoinDomain = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    domain: { type: 'string', description: 'Email domain' },
    role: { type: 'string', enum: ['ADMIN', 'EDITOR', 'READER'], description: 'Role assigned to users from this domain' },
    organizationId: { type: 'string', description: 'Organization ID' },
    companyId: { type: 'string', description: 'Company ID (if domain is for company-level auto-join)' },
    status: { type: 'string', enum: ['PENDING', 'VERIFIED'], description: 'Domain verification status' },
    verificationCode: { type: 'string', description: 'DNS verification code' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const OrganizationAddDomainRequest = {
  type: 'object',
  required: ['domain', 'role'],
  properties: {
    domain: {
      type: 'string',
      description: 'Email domain (e.g., example.com)'
    },
    role: {
      type: 'string',
      enum: ['ADMIN', 'EDITOR', 'READER'],
      description: 'Role to assign to users from this domain'
    }
  }
}; 
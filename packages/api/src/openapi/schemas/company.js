// Company-specific schemas
export const CreateCompanyRequest = {
  type: 'object',
  required: ['name', 'organizationId'],
  properties: {
    name: {
      type: 'string',
      description: 'Company name'
    },
    description: {
      type: 'string',
      description: 'Company description'
    },
    organizationId: {
      type: 'string',
      description: 'Parent organization ID'
    }
  }
};

export const UpdateCompanyRequest = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Company name'
    },
    description: {
      type: 'string',
      description: 'Company description'
    }
  }
};

export const AddDomainRequest = {
  type: 'object',
  required: ['domain', 'role'],
  properties: {
    domain: {
      type: 'string',
      description: 'Email domain to add for auto-join'
    },
    role: {
      type: 'string',
      enum: ['ADMIN', 'EDITOR', 'READER'],
      description: 'Default role for users joining via this domain'
    }
  }
};

export const AutoJoinDomain = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    domain: { type: 'string' },
    role: { type: 'string', enum: ['ADMIN', 'EDITOR', 'READER'] },
    status: { type: 'string', enum: ['PENDING', 'VERIFIED'] },
    verificationCode: { type: 'string' },
    companyId: { type: 'string' },
    organizationId: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
}; 
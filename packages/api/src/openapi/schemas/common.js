// Common schemas used across multiple endpoints
export const Error = {
  type: 'object',
  properties: {
    error: {
      type: 'string',
      description: 'Error message'
    }
  }
};

export const User = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    status: { type: 'string', enum: ['ACTIVE', 'PENDING'] },
    lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
    emailVerifiedAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const Organization = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    accountType: { type: 'string', enum: ['STANDARD', 'ENTERPRISE'] },
    defaultCompanyId: { type: 'string', nullable: true },
    hierarchyDisplayNames: { type: 'object' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const Company = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    organizationId: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const Team = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    companyId: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const Project = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    teamId: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const Technology = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    type: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const ProjectTechnology = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    projectId: { type: 'string' },
    technologyId: { type: 'string' },
    version: { type: 'string', nullable: true },
    source: { type: 'string' },
    technology: { $ref: '#/components/schemas/Technology' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const NavigationTreeNode = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    type: { type: 'string', enum: ['organization', 'company', 'team', 'project'] },
    children: {
      type: 'array',
      items: { $ref: '#/components/schemas/NavigationTreeNode' }
    }
  }
}; 
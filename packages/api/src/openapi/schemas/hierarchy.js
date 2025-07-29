// Hierarchy-specific schemas
export const HierarchyItem = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    type: {
      type: 'string',
      enum: ['organization', 'company', 'team', 'project']
    },
    isMember: {
      type: 'boolean',
      description: 'Whether the user is a direct member of this item'
    },
    description: { type: 'string' },
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

export const OrganizationHierarchy = {
  allOf: [
    { $ref: '#/components/schemas/HierarchyItem' },
    {
      type: 'object',
      properties: {
        companies: {
          type: 'array',
          items: { $ref: '#/components/schemas/CompanyHierarchy' }
        }
      }
    }
  ]
};

export const CompanyHierarchy = {
  allOf: [
    { $ref: '#/components/schemas/HierarchyItem' },
    {
      type: 'object',
      properties: {
        teams: {
          type: 'array',
          items: { $ref: '#/components/schemas/TeamHierarchy' }
        }
      }
    }
  ]
};

export const TeamHierarchy = {
  allOf: [
    { $ref: '#/components/schemas/HierarchyItem' },
    {
      type: 'object',
      properties: {
        projects: {
          type: 'array',
          items: { $ref: '#/components/schemas/HierarchyItem' }
        }
      }
    }
  ]
};

export const ProjectSummary = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    repositoryUrl: { type: 'string' }
  }
}; 
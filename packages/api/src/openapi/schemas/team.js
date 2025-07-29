// Team-specific schemas
export const CreateTeamRequest = {
  type: 'object',
  required: ['name', 'companyId'],
  properties: {
    name: {
      type: 'string',
      description: 'Team name'
    },
    description: {
      type: 'string',
      description: 'Team description'
    },
    companyId: {
      type: 'string',
      description: 'Parent company ID'
    }
  }
};

export const UpdateTeamRequest = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Team name'
    },
    description: {
      type: 'string',
      description: 'Team description'
    }
  }
};

export const TeamWithProjects = {
  allOf: [
    { $ref: '#/components/schemas/Team' },
    {
      type: 'object',
      properties: {
        projects: {
          type: 'array',
          items: { $ref: '#/components/schemas/Project' }
        }
      }
    }
  ]
}; 
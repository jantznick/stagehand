// Membership-specific schemas
export const CreateMembershipRequest = {
  type: 'object',
  required: ['userId', 'role'],
  properties: {
    userId: {
      type: 'string',
      description: 'User ID to grant membership to'
    },
    role: {
      type: 'string',
      enum: ['ADMIN', 'EDITOR', 'READER'],
      description: 'Role to assign to the user'
    },
    organizationId: {
      type: 'string',
      description: 'Organization ID (if adding organization-level membership)'
    },
    companyId: {
      type: 'string',
      description: 'Company ID (if adding company-level membership)'
    },
    teamId: {
      type: 'string',
      description: 'Team ID (if adding team-level membership)'
    },
    projectId: {
      type: 'string',
      description: 'Project ID (if adding project-level membership)'
    }
  }
};

export const UpdateMembershipRequest = {
  type: 'object',
  required: ['role'],
  properties: {
    role: {
      type: 'string',
      enum: ['ADMIN', 'EDITOR', 'READER'],
      description: 'New role to assign to the user'
    }
  }
};

export const MembershipWithUser = {
  allOf: [
    { $ref: '#/components/schemas/Membership' },
    {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: {
              type: 'string',
              format: 'email'
            },
            name: { type: 'string' }
          }
        },
        effectiveRole: {
          type: 'string',
          enum: ['ADMIN', 'EDITOR', 'READER'],
          description: 'Effective role considering hierarchy inheritance'
        }
      }
    }
  ]
}; 
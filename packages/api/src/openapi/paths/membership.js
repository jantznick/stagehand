// Membership endpoint paths
export const membershipPaths = {
  '/api/v1/memberships': {
    get: {
      summary: 'Get memberships for a resource',
      description: 'Retrieves all memberships for a specific organization, company, team, or project including effective roles from hierarchy inheritance',
      tags: ['Memberships'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'organizationId',
          schema: { type: 'string' },
          description: 'Organization ID to get memberships for'
        },
        {
          in: 'query',
          name: 'companyId',
          schema: { type: 'string' },
          description: 'Company ID to get memberships for'
        },
        {
          in: 'query',
          name: 'teamId',
          schema: { type: 'string' },
          description: 'Team ID to get memberships for'
        },
        {
          in: 'query',
          name: 'projectId',
          schema: { type: 'string' },
          description: 'Project ID to get memberships for'
        }
      ],
      responses: {
        200: {
          description: 'List of memberships with effective roles',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/MembershipWithUser' }
              }
            }
          }
        },
        400: {
          description: 'Exactly one resource ID must be provided',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to view memberships for this resource',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    post: {
      summary: 'Create new membership',
      description: 'Adds a user to an organization, company, team, or project with specified role',
      tags: ['Memberships'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateMembershipRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Membership successfully created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Membership' }
            }
          }
        },
        400: {
          description: 'Invalid request data or exactly one resource ID required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to manage memberships for this resource',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'User or resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        409: {
          description: 'User already has membership for this resource',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/v1/memberships/{id}': {
    put: {
      summary: 'Update membership role',
      description: 'Updates the role of an existing membership',
      tags: ['Memberships'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Membership ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateMembershipRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Membership successfully updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Membership' }
            }
          }
        },
        400: {
          description: 'Invalid role provided',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to manage this membership',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Membership not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    delete: {
      summary: 'Remove membership',
      description: 'Removes a user\'s membership from an organization, company, team, or project',
      tags: ['Memberships'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Membership ID'
        }
      ],
      responses: {
        204: {
          description: 'Membership successfully removed'
        },
        403: {
          description: 'Not authorized to remove this membership',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Membership not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  }
}; 
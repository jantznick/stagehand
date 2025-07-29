// Hierarchy endpoint paths
export const hierarchyPaths = {
  '/api/v1/hierarchy': {
    get: {
      summary: 'Get user\'s accessible organizational hierarchy',
      description: 'Returns the complete organizational hierarchy that the authenticated user has access to, structured as nested organizations, companies, teams, and projects',
      tags: ['Hierarchy'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'Hierarchical structure of accessible organizations',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/OrganizationHierarchy' }
              }
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
  '/api/v1/hierarchy/{resourceType}/{resourceId}/projects': {
    get: {
      summary: 'Get all projects within a resource\'s hierarchy',
      description: 'Returns a flat list of all projects within the specified resource\'s hierarchy',
      tags: ['Hierarchy'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'resourceType',
          required: true,
          schema: {
            type: 'string',
            enum: ['organization', 'company', 'team', 'project']
          },
          description: 'Type of resource'
        },
        {
          in: 'path',
          name: 'resourceId',
          required: true,
          schema: { type: 'string' },
          description: 'Resource ID'
        }
      ],
      responses: {
        200: {
          description: 'List of projects within the resource hierarchy',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ProjectSummary' }
              }
            }
          }
        },
        403: {
          description: 'Not authorized to view this resource',
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
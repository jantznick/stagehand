// Finding endpoint paths
export const findingPaths = {
  '/api/v1/projects/{projectId}/findings': {
    get: {
      summary: 'Get security findings for a project',
      description: 'Retrieves all security vulnerability findings for a specific project',
      tags: ['Security Findings'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'projectId',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID to fetch findings for'
        }
      ],
      responses: {
        200: {
          description: 'List of security findings with vulnerability details',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/FindingWithVulnerability' }
              }
            }
          }
        },
        403: {
          description: 'Access denied - insufficient permissions to view findings',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Project not found',
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
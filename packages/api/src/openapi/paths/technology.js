// Technology endpoint paths
export const technologyPaths = {
  '/api/v1/technologies/search': {
    get: {
      summary: 'Search technologies',
      description: 'Searches for technologies by name with autocomplete functionality',
      tags: ['Technologies'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'q',
          required: true,
          schema: {
            type: 'string',
            minLength: 1
          },
          description: 'Search query for technology name'
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 50
          },
          description: 'Maximum number of results to return'
        }
      ],
      responses: {
        200: {
          description: 'List of matching technologies',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Technology' }
              }
            }
          }
        },
        400: {
          description: 'Search query is required',
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
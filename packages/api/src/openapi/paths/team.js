// Team endpoint paths
export const teamPaths = {
  '/api/v1/teams/{id}': {
    get: {
      summary: 'Get team by ID',
      description: 'Retrieves a single team by its ID, including associated projects',
      tags: ['Teams'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Team ID'
        }
      ],
      responses: {
        200: {
          description: 'Team details with projects',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TeamWithProjects' }
            }
          }
        },
        403: {
          description: 'Not authorized to view this team',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Team not found',
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
  '/api/v1/teams': {
    get: {
      summary: 'List all teams user has access to',
      description: 'Returns all teams that the authenticated user has access to view',
      tags: ['Teams'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of teams',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Team' }
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
    },
    post: {
      summary: 'Create a new team',
      description: 'Creates a new team within a company',
      tags: ['Teams'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateTeamRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Team successfully created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Team' }
            }
          }
        },
        400: {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to create team in this company',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Company not found',
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
  '/api/v1/teams/{id}': {
    put: {
      summary: 'Update team details',
      description: 'Updates team information such as name and description',
      tags: ['Teams'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Team ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateTeamRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Team successfully updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Team' }
            }
          }
        },
        403: {
          description: 'Not authorized to update this team',
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
      summary: 'Delete team',
      description: 'Permanently deletes a team and all associated data',
      tags: ['Teams'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Team ID'
        }
      ],
      responses: {
        204: {
          description: 'Team successfully deleted'
        },
        403: {
          description: 'Not authorized to delete this team',
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
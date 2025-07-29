// Relationship endpoint paths
export const relationshipPaths = {
  '/api/v1/relationships': {
    get: {
      summary: 'Get project relationships',
      description: 'Retrieves all relationships for projects within a specific company',
      tags: ['Relationships'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'companyId',
          required: true,
          schema: { type: 'string' },
          description: 'Company ID to get project relationships for'
        }
      ],
      responses: {
        200: {
          description: 'List of project relationships',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ProjectRelationship' }
              }
            }
          }
        },
        400: {
          description: 'Company ID is required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to view relationships for this company',
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
      summary: 'Create project relationship',
      description: 'Creates a new dependency relationship between two projects',
      tags: ['Relationships'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateRelationshipRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Relationship successfully created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectRelationship' }
            }
          }
        },
        400: {
          description: 'Invalid request data or cannot create self-referencing relationship',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to create relationships between these projects',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'One or both projects not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        409: {
          description: 'Relationship already exists between these projects',
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
  '/api/v1/relationships/{id}': {
    put: {
      summary: 'Update project relationship',
      description: 'Updates an existing project relationship\'s type or description',
      tags: ['Relationships'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Relationship ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateRelationshipRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Relationship successfully updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectRelationship' }
            }
          }
        },
        403: {
          description: 'Not authorized to update this relationship',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Relationship not found',
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
      summary: 'Delete project relationship',
      description: 'Removes a project relationship',
      tags: ['Relationships'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Relationship ID'
        }
      ],
      responses: {
        204: {
          description: 'Relationship successfully deleted'
        },
        403: {
          description: 'Not authorized to delete this relationship',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Relationship not found',
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
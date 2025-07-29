// OIDC endpoint paths
export const oidcPaths = {
  '/api/v1/oidc': {
    get: {
      summary: 'Get OIDC configurations for organization',
      description: 'Retrieves all OIDC configurations for a specific organization',
      tags: ['OIDC'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'organizationId',
          required: true,
          schema: { type: 'string' },
          description: 'Organization ID to get OIDC configurations for'
        }
      ],
      responses: {
        200: {
          description: 'List of OIDC configurations',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/OIDCConfig' }
              }
            }
          }
        },
        400: {
          description: 'Organization ID is required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to view OIDC configurations for this organization',
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
      summary: 'Create OIDC configuration',
      description: 'Creates a new OIDC SSO configuration for an organization',
      tags: ['OIDC'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateOIDCConfigRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'OIDC configuration successfully created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OIDCConfig' }
            }
          }
        },
        400: {
          description: 'Missing required fields or invalid data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to create OIDC configurations for this organization',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error during creation',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/v1/oidc/{id}': {
    put: {
      summary: 'Update OIDC configuration',
      description: 'Updates an existing OIDC configuration',
      tags: ['OIDC'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'OIDC configuration ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateOIDCConfigRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'OIDC configuration successfully updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OIDCConfig' }
            }
          }
        },
        403: {
          description: 'Not authorized to update this OIDC configuration',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'OIDC configuration not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error during update',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    delete: {
      summary: 'Delete OIDC configuration',
      description: 'Removes an OIDC configuration from the organization',
      tags: ['OIDC'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'OIDC configuration ID'
        }
      ],
      responses: {
        204: {
          description: 'OIDC configuration successfully deleted'
        },
        403: {
          description: 'Not authorized to delete this OIDC configuration',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'OIDC configuration not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error during deletion',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/v1/oidc/{id}/test': {
    post: {
      summary: 'Test OIDC configuration',
      description: 'Tests the OIDC configuration by attempting to discover the provider endpoints',
      tags: ['OIDC'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'OIDC configuration ID'
        }
      ],
      responses: {
        200: {
          description: 'OIDC configuration test successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'OIDC configuration is valid'
                  },
                  discovery: {
                    type: 'object',
                    description: 'OIDC discovery document information'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'OIDC configuration test failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to test this OIDC configuration',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'OIDC configuration not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error during test',
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
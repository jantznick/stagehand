// Organization endpoint paths
export const organizationPaths = {
  '/api/v1/organizations/{id}': {
    get: {
      summary: 'Get organization by ID',
      description: 'Retrieves a single organization by its ID',
      tags: ['Organizations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Organization ID'
        }
      ],
      responses: {
        200: {
          description: 'Organization details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Organization' }
            }
          }
        },
        403: {
          description: 'Not authorized to view this organization',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Organization not found',
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
    put: {
      summary: 'Update organization',
      description: 'Updates organization details including account type, name, and other settings',
      tags: ['Organizations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Organization ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateOrganizationRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Organization successfully updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Organization' }
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
          description: 'Not authorized to update this organization',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Organization not found',
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
  '/api/v1/organizations/{id}/domains': {
    get: {
      summary: 'Get auto-join domains for organization',
      description: 'Retrieves all auto-join domain configurations for an organization',
      tags: ['Organizations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Organization ID'
        }
      ],
      responses: {
        200: {
          description: 'List of auto-join domains',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/OrganizationAutoJoinDomain' }
              }
            }
          }
        },
        403: {
          description: 'Not authorized to view domains for this organization',
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
      summary: 'Add auto-join domain to organization',
      description: 'Adds a new email domain for automatic user registration to the organization',
      tags: ['Organizations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Organization ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OrganizationAddDomainRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Domain successfully added',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrganizationAutoJoinDomain' }
            }
          }
        },
        400: {
          description: 'Invalid request data or public domain not allowed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to manage domains for this organization',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Organization not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        409: {
          description: 'Domain already added to this organization',
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
  '/api/v1/organizations/{id}/domains/{domainMappingId}/verify': {
    post: {
      summary: 'Verify domain ownership via DNS',
      description: 'Verifies domain ownership by checking for a specific TXT record in DNS',
      tags: ['Organizations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Organization ID'
        },
        {
          in: 'path',
          name: 'domainMappingId',
          required: true,
          schema: { type: 'string' },
          description: 'Domain mapping ID'
        }
      ],
      responses: {
        200: {
          description: 'Domain successfully verified',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrganizationAutoJoinDomain' }
            }
          }
        },
        400: {
          description: 'DNS verification failed or TXT record not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to manage domains for this organization',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Domain mapping not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error during verification',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/v1/organizations/{id}/domains/{domainMappingId}': {
    delete: {
      summary: 'Remove auto-join domain from organization',
      description: 'Removes an auto-join domain configuration from the organization',
      tags: ['Organizations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Organization ID'
        },
        {
          in: 'path',
          name: 'domainMappingId',
          required: true,
          schema: { type: 'string' },
          description: 'Domain mapping ID'
        }
      ],
      responses: {
        204: {
          description: 'Domain successfully removed'
        },
        403: {
          description: 'Not authorized to manage domains for this organization',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Domain mapping not found or does not belong to this organization',
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
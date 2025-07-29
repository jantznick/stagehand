// Integration endpoint paths
export const integrationPaths = {
  '/api/v1/integrations/github/install': {
    get: {
      summary: 'Get GitHub App installation URL',
      description: 'Generates the URL to install the GitHub App for an organization',
      tags: ['Integrations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'organizationId',
          required: true,
          schema: { type: 'string' },
          description: 'Organization ID to install GitHub App for'
        }
      ],
      responses: {
        200: {
          description: 'GitHub App installation URL',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  installUrl: {
                    type: 'string',
                    description: 'URL to install the GitHub App'
                  }
                }
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
          description: 'Not authorized to manage integrations for this organization',
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
  '/api/v1/integrations/github/callback': {
    get: {
      summary: 'Handle GitHub App installation callback',
      description: 'Processes the callback from GitHub after App installation, creating the integration record',
      tags: ['Integrations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'installation_id',
          required: true,
          schema: { type: 'string' },
          description: 'GitHub App installation ID'
        },
        {
          in: 'query',
          name: 'setup_action',
          required: true,
          schema: {
            type: 'string',
            enum: ['install', 'update']
          },
          description: 'Setup action performed'
        },
        {
          in: 'query',
          name: 'state',
          required: true,
          schema: { type: 'string' },
          description: 'State parameter containing organization ID'
        }
      ],
      responses: {
        302: {
          description: 'Redirect to frontend with success/error status'
        },
        400: {
          description: 'Missing required parameters or invalid state',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized or user session not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error during integration setup',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/v1/integrations': {
    get: {
      summary: 'Get organization integrations',
      description: 'Retrieves all integrations for a specific organization',
      tags: ['Integrations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'organizationId',
          required: true,
          schema: { type: 'string' },
          description: 'Organization ID to get integrations for'
        }
      ],
      responses: {
        200: {
          description: 'List of organization integrations',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Integration' }
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
          description: 'Not authorized to view integrations for this organization',
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
  '/api/v1/integrations/{integrationId}/repositories': {
    get: {
      summary: 'Get repositories for integration',
      description: 'Retrieves all repositories associated with a specific integration',
      tags: ['Integrations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'integrationId',
          required: true,
          schema: { type: 'string' },
          description: 'Integration ID'
        }
      ],
      responses: {
        200: {
          description: 'List of repositories',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Repository' }
              }
            }
          }
        },
        403: {
          description: 'Not authorized to view this integration',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Integration not found',
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
  '/api/v1/integrations/{integrationId}/sync': {
    post: {
      summary: 'Sync integration repositories',
      description: 'Synchronizes repositories from the SCM provider, updating the local database',
      tags: ['Integrations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'integrationId',
          required: true,
          schema: { type: 'string' },
          description: 'Integration ID'
        }
      ],
      responses: {
        200: {
          description: 'Sync completed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Sync completed successfully'
                  },
                  added: {
                    type: 'integer',
                    description: 'Number of new repositories added'
                  },
                  updated: {
                    type: 'integer',
                    description: 'Number of existing repositories updated'
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'Not authorized to sync this integration',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Integration not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error during sync',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/v1/integrations/link-repositories': {
    post: {
      summary: 'Link repositories to projects',
      description: 'Creates associations between repositories and projects',
      tags: ['Integrations'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LinkRepositoryRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Repositories successfully linked',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Repositories linked successfully'
                  },
                  linkedCount: {
                    type: 'integer',
                    description: 'Number of repository-project links created'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Missing required data (repositoryIds and projectIds)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to link repositories to projects',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error during linking',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/v1/integrations/{integrationId}': {
    delete: {
      summary: 'Delete integration',
      description: 'Removes an integration and all associated repositories and links',
      tags: ['Integrations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'integrationId',
          required: true,
          schema: { type: 'string' },
          description: 'Integration ID'
        }
      ],
      responses: {
        204: {
          description: 'Integration successfully deleted'
        },
        403: {
          description: 'Not authorized to delete this integration',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Integration not found',
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
  }
}; 
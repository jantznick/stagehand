// Security tool endpoint paths
export const securityToolPaths = {
  '/api/v1/security-tools': {
    get: {
      summary: 'Get security tools for resource',
      description: 'Retrieves all security tool integrations for a specific resource (organization, company, team, or project)',
      tags: ['Security Tools'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'resourceType',
          required: true,
          schema: {
            type: 'string',
            enum: ['organization', 'company', 'team', 'project']
          },
          description: 'Type of resource to get security tools for'
        },
        {
          in: 'query',
          name: 'resourceId',
          required: true,
          schema: { type: 'string' },
          description: 'Resource ID to get security tools for'
        }
      ],
      responses: {
        200: {
          description: 'List of security tools',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/SecurityTool' }
              }
            }
          }
        },
        400: {
          description: 'Resource type and ID are required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to view security tools for this resource',
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
      summary: 'Create security tool integration',
      description: 'Creates a new security tool integration with encrypted credential storage',
      tags: ['Security Tools'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateSecurityToolRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Security tool successfully created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SecurityTool' }
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
          description: 'Not authorized to create security tools for this resource',
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
  '/api/v1/security-tools/{securityToolId}/projects': {
    get: {
      summary: 'Get security tool projects',
      description: 'Retrieves all projects from a specific security tool integration',
      tags: ['Security Tools'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'securityToolId',
          required: true,
          schema: { type: 'string' },
          description: 'Security tool ID'
        }
      ],
      responses: {
        200: {
          description: 'List of security tool projects',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/SecurityToolProject' }
              }
            }
          }
        },
        403: {
          description: 'Not authorized to view this security tool',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Security tool not found',
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
  '/api/v1/security-tools/{securityToolId}/sync': {
    post: {
      summary: 'Sync security tool projects',
      description: 'Synchronizes projects and findings from the security tool, updating the local database',
      tags: ['Security Tools'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'securityToolId',
          required: true,
          schema: { type: 'string' },
          description: 'Security tool ID'
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
                  projectsAdded: {
                    type: 'integer',
                    description: 'Number of new projects added'
                  },
                  projectsUpdated: {
                    type: 'integer',
                    description: 'Number of existing projects updated'
                  },
                  findingsAdded: {
                    type: 'integer',
                    description: 'Number of new findings added'
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'Not authorized to sync this security tool',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Security tool not found',
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
  '/api/v1/security-tools/link-projects': {
    post: {
      summary: 'Link security tool projects to applications',
      description: 'Creates associations between security tool projects and application projects',
      tags: ['Security Tools'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LinkSecurityToolProjectRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Projects successfully linked',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Security tool projects linked successfully'
                  },
                  linkedCount: {
                    type: 'integer',
                    description: 'Number of project links created'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Missing required data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to link projects',
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
  '/api/v1/security-tools/{securityToolId}': {
    delete: {
      summary: 'Delete security tool integration',
      description: 'Removes a security tool integration and all associated projects and findings',
      tags: ['Security Tools'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'securityToolId',
          required: true,
          schema: { type: 'string' },
          description: 'Security tool ID'
        }
      ],
      responses: {
        204: {
          description: 'Security tool successfully deleted'
        },
        403: {
          description: 'Not authorized to delete this security tool',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Security tool not found',
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
  '/api/v1/security-tools/{integrationId}/snyk/projects': {
    get: {
      summary: 'Get Snyk projects from integration',
      description: 'Retrieves all projects from a Snyk security tool integration via Snyk API',
      tags: ['Security Tools'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'integrationId',
          required: true,
          schema: { type: 'string' },
          description: 'Security tool integration ID'
        }
      ],
      responses: {
        200: {
          description: 'List of Snyk projects',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    type: { type: 'string' },
                    origin: { type: 'string' },
                    browseUrl: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Missing Snyk credentials',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to access this integration',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Snyk integration not found',
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
  '/api/v1/security-tools/{integrationId}/sync': {
    post: {
      summary: 'Sync security tool findings',
      description: 'Triggers background synchronization of security findings for specific projects from the security tool',
      tags: ['Security Tools'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'integrationId',
          required: true,
          schema: { type: 'string' },
          description: 'Security tool integration ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['projectIds'],
              properties: {
                projectIds: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of project IDs to sync findings for'
                }
              }
            }
          }
        }
      },
      responses: {
        202: {
          description: 'Sync process initiated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Sync process initiated successfully'
                  }
                }
              }
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
        404: {
          description: 'Security tool integration not found',
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
  '/api/v1/security-tools/{integrationId}/sync-logs': {
    get: {
      summary: 'Get security tool sync logs',
      description: 'Retrieves the last 20 synchronization logs for a security tool integration',
      tags: ['Security Tools'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'integrationId',
          required: true,
          schema: { type: 'string' },
          description: 'Security tool integration ID'
        }
      ],
      responses: {
        200: {
          description: 'List of sync logs',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    securityToolIntegrationId: { type: 'string' },
                    startTime: {
                      type: 'string',
                      format: 'date-time'
                    },
                    endTime: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true
                    },
                    status: {
                      type: 'string',
                      enum: ['STARTED', 'COMPLETED', 'FAILED']
                    },
                    errorMessage: {
                      type: 'string',
                      nullable: true
                    },
                    projectsSynced: { type: 'integer' },
                    findingsAdded: { type: 'integer' },
                    findingsUpdated: { type: 'integer' }
                  }
                }
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
  }
}; 
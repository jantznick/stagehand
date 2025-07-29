// Project endpoint paths
export const projectPaths = {
  '/api/v1/projects/{id}': {
    get: {
      summary: 'Get project by ID with full details',
      description: 'Retrieves a single project with comprehensive details including team hierarchy, contacts, technologies, and dependencies',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        }
      ],
      responses: {
        200: {
          description: 'Detailed project information',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectDetailed' }
            }
          }
        },
        403: {
          description: 'Not authorized to view this project',
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
    },
    put: {
      summary: 'Update project details',
      description: 'Updates project information including application details, security metadata, and operational information',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateProjectRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Project successfully updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Project' }
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
          description: 'Not authorized to update this project',
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
      summary: 'Delete project',
      description: 'Permanently deletes a project and all associated data',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        }
      ],
      responses: {
        204: {
          description: 'Project successfully deleted'
        },
        403: {
          description: 'Not authorized to delete this project',
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
  '/api/v1/projects': {
    get: {
      summary: 'List all projects user has access to',
      description: 'Returns all projects that the authenticated user has access to view',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of projects',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Project' }
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
      summary: 'Create a new project',
      description: 'Creates a new project within a team and assigns creator as admin',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateProjectRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Project successfully created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Project' }
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
          description: 'Not authorized to create project in this team',
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
  '/api/v1/projects/{id}/members': {
    get: {
      summary: 'Get project members',
      description: 'Retrieves all users with access to the project from the parent organization, excluding those already assigned as contacts',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        }
      ],
      responses: {
        200: {
          description: 'List of available project members',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string', format: 'email' }
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'Not authorized to view this project',
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
  },
  '/api/v1/projects/{id}/contacts': {
    post: {
      summary: 'Add contact to project',
      description: 'Adds a new contact to the project with specified role. Creates contact if it doesn\'t exist.',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'name', 'role'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'Contact email address'
                },
                name: {
                  type: 'string',
                  description: 'Contact full name'
                },
                role: {
                  type: 'string',
                  description: 'Contact role in the project'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Contact successfully added',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectContact' }
            }
          }
        },
        400: {
          description: 'Missing required fields',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to add contacts to this project',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        409: {
          description: 'Contact already associated with this project',
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
  '/api/v1/projects/{projectId}/contacts/{contactId}': {
    put: {
      summary: 'Update project contact',
      description: 'Updates contact information and role for a project',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'projectId',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        },
        {
          in: 'path',
          name: 'contactId',
          required: true,
          schema: { type: 'string' },
          description: 'Contact ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'oldContactType', 'newContactType'],
              properties: {
                name: {
                  type: 'string',
                  description: 'Updated contact name'
                },
                oldContactType: {
                  type: 'string',
                  description: 'Current contact role/type'
                },
                newContactType: {
                  type: 'string',
                  description: 'New contact role/type'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Contact successfully updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectContact' }
            }
          }
        },
        400: {
          description: 'Missing required fields',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to update contacts for this project',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        409: {
          description: 'Contact with new role already exists for this project',
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
  '/api/v1/projects/{id}/contacts/{contactId}/{contactType}': {
    delete: {
      summary: 'Remove contact from project',
      description: 'Removes a contact association from the project',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        },
        {
          in: 'path',
          name: 'contactId',
          required: true,
          schema: { type: 'string' },
          description: 'Contact ID'
        },
        {
          in: 'path',
          name: 'contactType',
          required: true,
          schema: { type: 'string' },
          description: 'Contact type/role'
        }
      ],
      responses: {
        204: {
          description: 'Contact successfully removed'
        },
        400: {
          description: 'Missing required parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to remove contacts from this project',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Contact not found for this project',
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
  '/api/v1/projects/{id}/technologies': {
    get: {
      summary: 'Get project technologies',
      description: 'Retrieves all technologies associated with the project',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        }
      ],
      responses: {
        200: {
          description: 'List of project technologies',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ProjectTechnology' }
              }
            }
          }
        },
        403: {
          description: 'Not authorized to view this project',
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
      summary: 'Add technology to project',
      description: 'Associates a technology with the project. Can add new technology or reference existing one.',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Technology name (required if technologyId not provided)'
                },
                type: {
                  type: 'string',
                  description: 'Technology type (required if technologyId not provided)'
                },
                version: {
                  type: 'string',
                  description: 'Technology version'
                },
                technologyId: {
                  type: 'string',
                  description: 'Existing technology ID (alternative to name/type)'
                },
                source: {
                  type: 'string',
                  default: 'user-entered',
                  description: 'Source of the technology information'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Technology successfully added',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectTechnology' }
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
          description: 'Not authorized to add technologies to this project',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Specified technology does not exist',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        409: {
          description: 'Technology with this version already exists for this project',
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
  '/api/v1/projects/{id}/technologies/{projectTechnologyId}': {
    put: {
      summary: 'Update project technology version',
      description: 'Updates the version of a technology associated with the project',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        },
        {
          in: 'path',
          name: 'projectTechnologyId',
          required: true,
          schema: { type: 'string' },
          description: 'Project technology association ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                version: {
                  type: 'string',
                  description: 'New technology version'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Technology version successfully updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProjectTechnology' }
            }
          }
        },
        403: {
          description: 'Not authorized to update technologies for this project',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Technology association not found for this project',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        409: {
          description: 'Technology with this version already exists for this project',
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
      summary: 'Remove technology from project',
      description: 'Removes a technology association from the project',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        },
        {
          in: 'path',
          name: 'projectTechnologyId',
          required: true,
          schema: { type: 'string' },
          description: 'Project technology association ID'
        }
      ],
      responses: {
        204: {
          description: 'Technology successfully removed'
        },
        403: {
          description: 'Not authorized to remove technologies from this project',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Technology association not found',
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
  '/api/v1/projects/graph': {
    get: {
      summary: 'Get company-wide project dependency graph',
      description: 'Retrieves project nodes and relationship edges for a company\'s dependency graph visualization',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'companyId',
          required: true,
          schema: { type: 'string' },
          description: 'Company ID to get project graph for'
        }
      ],
      responses: {
        200: {
          description: 'Project graph data with nodes and edges',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nodes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string', example: 'default' },
                        data: {
                          type: 'object',
                          properties: {
                            label: { type: 'string' }
                          }
                        },
                        position: {
                          type: 'object',
                          properties: {
                            x: { type: 'number' },
                            y: { type: 'number' }
                          }
                        }
                      }
                    }
                  },
                  edges: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        source: { type: 'string' },
                        target: { type: 'string' },
                        label: { type: 'string' },
                        type: { type: 'string', example: 'default' }
                      }
                    }
                  }
                }
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
          description: 'Not a member of this company',
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
  '/api/v1/projects/{id}/graph': {
    get: {
      summary: 'Get project-specific dependency mini-graph',
      description: 'Retrieves a focused dependency graph for a specific project showing its immediate relationships',
      tags: ['Projects'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID'
        }
      ],
      responses: {
        200: {
          description: 'Project mini-graph data with nodes and edges',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nodes: {
                    type: 'array',
                    items: { type: 'object' }
                  },
                  edges: {
                    type: 'array',
                    items: { type: 'object' }
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'Not authorized to view this project',
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
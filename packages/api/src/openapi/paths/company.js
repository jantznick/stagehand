// Company endpoint paths
export const companyPaths = {
  '/api/v1/companies/{id}': {
    get: {
      summary: 'Get company by ID',
      description: 'Retrieves a single company by its ID',
      tags: ['Companies'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Company ID'
        }
      ],
      responses: {
        200: {
          description: 'Company details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Company' }
            }
          }
        },
        403: {
          description: 'Not authorized to view this company',
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
    },
    put: {
      summary: 'Update company details',
      description: 'Updates company information such as name and description',
      tags: ['Companies'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Company ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateCompanyRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Company successfully updated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Company' }
            }
          }
        },
        403: {
          description: 'Not authorized to update this company',
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
      summary: 'Delete company',
      description: 'Permanently deletes a company and all associated data',
      tags: ['Companies'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Company ID'
        }
      ],
      responses: {
        204: {
          description: 'Company successfully deleted'
        },
        403: {
          description: 'Not authorized to delete this company',
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
  '/api/v1/companies': {
    get: {
      summary: 'List all companies user has access to',
      description: 'Returns all companies that the authenticated user has access to view',
      tags: ['Companies'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of companies',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Company' }
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
      summary: 'Create a new company',
      description: 'Creates a new company within an organization',
      tags: ['Companies'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateCompanyRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Company successfully created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Company' }
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
          description: 'Not authorized to create company in this organization',
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
  '/api/v1/companies/{id}/domains': {
    get: {
      summary: 'Get auto-join domains for company',
      description: 'Retrieves all auto-join domain configurations for a company',
      tags: ['Companies'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Company ID'
        }
      ],
      responses: {
        200: {
          description: 'List of auto-join domains',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AutoJoinDomain' }
              }
            }
          }
        },
        403: {
          description: 'Not authorized to view domains for this company',
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
      summary: 'Add auto-join domain to company',
      description: 'Adds a new email domain for automatic user registration to the company',
      tags: ['Companies'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Company ID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AddDomainRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Domain successfully added',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AutoJoinDomain' }
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
          description: 'Not authorized to manage domains for this company',
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
        409: {
          description: 'Domain already added to this company',
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
  '/api/v1/companies/{id}/domains/{domainMappingId}/verify': {
    post: {
      summary: 'Verify company domain ownership via DNS',
      description: 'Verifies domain ownership by checking for a specific TXT record in DNS',
      tags: ['Companies'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Company ID'
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
              schema: { $ref: '#/components/schemas/AutoJoinDomain' }
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
          description: 'Not authorized to manage domains for this company',
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
  '/api/v1/companies/{id}/domains/{domainMappingId}': {
    delete: {
      summary: 'Remove auto-join domain from company',
      description: 'Removes an auto-join domain configuration from the company',
      tags: ['Companies'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Company ID'
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
          description: 'Not authorized to manage domains for this company',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Domain mapping not found or does not belong to this company',
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
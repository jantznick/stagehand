// DAST scan endpoint paths
export const dastScanPaths = {
  '/api/v1/projects/{projectId}/dast/scan': {
    post: {
      summary: 'Launch a DAST scan',
      description: 'Launches a new DAST scan for the specified project with URL confirmation',
      tags: ['DAST Scans'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'projectId',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID to scan'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LaunchScanRequest' }
          }
        }
      },
      responses: {
        202: {
          description: 'Scan launched successfully and running in background',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'DAST scan launched successfully'
                  },
                  scanExecutionId: { type: 'string' },
                  scanExecution: { $ref: '#/components/schemas/ScanExecution' }
                }
              }
            }
          }
        },
        400: {
          description: 'Invalid request data'
        },
        403: {
          description: 'Insufficient permissions (requires ADMIN or EDITOR role)'
        },
        404: {
          description: 'Project not found'
        },
        500: {
          description: 'Server error'
        }
      }
    }
  },
  '/api/v1/projects/{projectId}/dast/scans': {
    get: {
      summary: 'Get DAST scans for project',
      description: 'Retrieves all DAST scans for a specific project',
      tags: ['DAST Scans'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'projectId',
          required: true,
          schema: { type: 'string' },
          description: 'Project ID to get scans for'
        }
      ],
      responses: {
        200: {
          description: 'List of DAST scans',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ScanExecution' }
              }
            }
          }
        },
        403: {
          description: 'Insufficient permissions'
        },
        404: {
          description: 'Project not found'
        },
        500: {
          description: 'Server error'
        }
      }
    }
  },
  '/api/v1/dast/scans/{scanId}': {
    get: {
      summary: 'Get DAST scan details',
      description: 'Retrieves detailed information about a specific DAST scan',
      tags: ['DAST Scans'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'scanId',
          required: true,
          schema: { type: 'string' },
          description: 'Scan execution ID'
        }
      ],
      responses: {
        200: {
          description: 'DAST scan details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ScanExecution' }
            }
          }
        },
        403: {
          description: 'Insufficient permissions'
        },
        404: {
          description: 'Scan not found'
        },
        500: {
          description: 'Server error'
        }
      }
    },
    delete: {
      summary: 'Cancel DAST scan',
      description: 'Cancels a running DAST scan',
      tags: ['DAST Scans'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'scanId',
          required: true,
          schema: { type: 'string' },
          description: 'Scan execution ID'
        }
      ],
      responses: {
        200: {
          description: 'Scan cancelled successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Scan cancelled successfully'
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'Insufficient permissions'
        },
        404: {
          description: 'Scan not found'
        },
        409: {
          description: 'Scan cannot be cancelled (already completed or failed)'
        },
        500: {
          description: 'Server error'
        }
      }
    }
  },
  '/api/v1/dast/scans/{scanId}/status': {
    get: {
      summary: 'Get DAST scan status',
      description: 'Retrieves the current status and progress of a DAST scan',
      tags: ['DAST Scans'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'scanId',
          required: true,
          schema: { type: 'string' },
          description: 'Scan execution ID'
        }
      ],
      responses: {
        200: {
          description: 'Scan status and progress',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']
                  },
                  progress: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 100
                  },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        403: {
          description: 'Insufficient permissions'
        },
        404: {
          description: 'Scan not found'
        },
        500: {
          description: 'Server error'
        }
      }
    }
  },
  '/api/v1/dast/providers': {
    get: {
      summary: 'Get supported DAST providers',
      description: 'Retrieves list of supported DAST scanning providers',
      tags: ['DAST Scans'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of supported providers',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    scanTypes: {
                      type: 'array',
                      items: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        500: {
          description: 'Server error'
        }
      }
    }
  }
}; 
// Invitation endpoint paths
export const invitationPaths = {
  '/api/v1/invitations': {
    get: {
      summary: 'Get pending invitations for a resource',
      description: 'Retrieves all pending (unaccepted) invitations for a specific organization, company, team, or project',
      tags: ['Invitations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'organizationId',
          schema: { type: 'string' },
          description: 'Organization ID to get invitations for'
        },
        {
          in: 'query',
          name: 'companyId',
          schema: { type: 'string' },
          description: 'Company ID to get invitations for'
        },
        {
          in: 'query',
          name: 'teamId',
          schema: { type: 'string' },
          description: 'Team ID to get invitations for'
        },
        {
          in: 'query',
          name: 'projectId',
          schema: { type: 'string' },
          description: 'Project ID to get invitations for'
        }
      ],
      responses: {
        200: {
          description: 'List of pending invitations',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/InvitationWithRecipient' }
              }
            }
          }
        },
        400: {
          description: 'Exactly one resource ID must be provided',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Not authorized to view invitations for this resource',
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
  '/api/v1/invitations/{id}/resend': {
    post: {
      summary: 'Resend invitation',
      description: 'Resends an existing invitation email to the recipient with a new expiration time',
      tags: ['Invitations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Invitation ID'
        }
      ],
      responses: {
        200: {
          description: 'Invitation successfully resent',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Invitation resent successfully'
                  },
                  invitation: { $ref: '#/components/schemas/InvitationWithRecipient' }
                }
              }
            }
          }
        },
        403: {
          description: 'Not authorized to resend this invitation',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Invitation not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        409: {
          description: 'Invitation has already been accepted',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error during resend',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/v1/invitations/{id}': {
    delete: {
      summary: 'Cancel invitation',
      description: 'Cancels (deletes) a pending invitation',
      tags: ['Invitations'],
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Invitation ID'
        }
      ],
      responses: {
        204: {
          description: 'Invitation successfully cancelled'
        },
        403: {
          description: 'Not authorized to cancel this invitation',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        404: {
          description: 'Invitation not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        500: {
          description: 'Server error during cancellation',
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
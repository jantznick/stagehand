// Invitation-specific schemas
export const InvitationWithRecipient = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'Invitation ID'
    },
    recipientEmail: {
      type: 'string',
      format: 'email',
      description: 'Email address of the invitation recipient'
    },
    recipientName: {
      type: 'string',
      description: 'Name of the invitation recipient'
    },
    inviterName: {
      type: 'string',
      description: 'Name of the user who sent the invitation'
    },
    invitationLink: {
      type: 'string',
      description: 'Magic link for the invitation'
    },
    expiresAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the invitation expires'
    },
    acceptedAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description: 'When the invitation was accepted (null if not yet accepted)'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the invitation was created'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'When the invitation was last updated'
    }
  }
}; 
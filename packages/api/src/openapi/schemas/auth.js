// Authentication-specific schemas
export const LoginRequest = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User\'s email address'
    },
    password: {
      type: 'string',
      minLength: 8,
      description: 'User\'s password'
    }
  }
};

export const RegisterRequest = {
  type: 'object',
  required: ['email'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User\'s email address'
    },
    password: {
      type: 'string',
      minLength: 8,
      description: 'User\'s password (required if not using magic link)'
    },
    accountType: {
      type: 'string',
      enum: ['STANDARD', 'ENTERPRISE'],
      description: 'Account type for new organizations'
    },
    useMagicLink: {
      type: 'boolean',
      description: 'Whether to use magic link authentication instead of password'
    }
  }
};

export const ForgotPasswordRequest = {
  type: 'object',
  required: ['email'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User\'s email address'
    }
  }
};

export const ResetPasswordRequest = {
  type: 'object',
  required: ['token', 'password'],
  properties: {
    token: {
      type: 'string',
      description: 'Password reset token from email'
    },
    password: {
      type: 'string',
      minLength: 8,
      description: 'New password'
    }
  }
};

export const AcceptInvitationRequest = {
  type: 'object',
  required: ['token'],
  properties: {
    token: {
      type: 'string',
      description: 'Invitation token'
    },
    password: {
      type: 'string',
      minLength: 8,
      description: 'Password (required if not using magic link)'
    },
    useMagicLink: {
      type: 'boolean',
      description: 'Whether to use magic link authentication'
    }
  }
};

export const VerifyEmailRequest = {
  type: 'object',
  required: ['token'],
  properties: {
    token: {
      type: 'string',
      description: 'Email verification token'
    }
  }
};

export const MagicLinkRequest = {
  type: 'object',
  required: ['email'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User\'s email address'
    }
  }
};

export const MagicLinkVerifyRequest = {
  type: 'object',
  required: ['token'],
  properties: {
    token: {
      type: 'string',
      description: 'Magic link token from email'
    }
  }
};

export const DomainCheckResponse = {
  type: 'object',
  properties: {
    willJoin: {
      type: 'boolean',
      description: 'Whether user will auto-join an organization/company'
    },
    entityType: {
      type: 'string',
      enum: ['organization', 'company'],
      description: 'Type of entity user will join'
    },
    entityName: {
      type: 'string',
      description: 'Name of organization/company user will join'
    }
  }
};

export const OIDCCheckResponse = {
  type: 'object',
  properties: {
    ssoEnabled: {
      type: 'boolean',
      description: 'Whether SSO is enabled for this domain'
    },
    buttonText: {
      type: 'string',
      description: 'Text to display on SSO button'
    },
    organizationId: {
      type: 'string',
      description: 'Organization ID for SSO'
    }
  }
}; 
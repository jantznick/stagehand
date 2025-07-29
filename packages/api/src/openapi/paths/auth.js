// Authentication endpoint paths
export const authPaths = {
  '/api/v1/auth/register': {
    post: {
      summary: 'Register a new user account',
      description: 'Creates a new user account with automatic organization/company assignment based on email domain or creates new organization',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RegisterRequest'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'User successfully registered',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/User' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'A magic link has been sent to user@example.com'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        400: {
          description: 'Invalid input data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        409: {
          description: 'User already exists',
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

  '/api/v1/auth/login': {
    post: {
      summary: 'Authenticate user with email and password',
      description: 'Logs in a user using email and password credentials',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LoginRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'User successfully logged in',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' }
            }
          }
        },
        400: {
          description: 'Invalid credentials',
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

  '/api/v1/auth/logout': {
    post: {
      summary: 'Log out current user',
      description: 'Terminates the user\'s session and clears authentication cookies',
      tags: ['Authentication'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'User successfully logged out',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Logged out successfully'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  '/api/v1/auth/forgot-password': {
    post: {
      summary: 'Request password reset',
      description: 'Sends a password reset link to the user\'s email address',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ForgotPasswordRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Password reset email sent (or user not found - same response for security)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'If an account with that email exists, a password reset link has been sent'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Email is required',
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

  '/api/v1/auth/reset-password': {
    post: {
      summary: 'Reset user password',
      description: 'Resets user password using a valid reset token',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ResetPasswordRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Password successfully reset',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Password has been reset successfully'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Invalid token or password requirements not met',
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

  '/api/v1/auth/check-domain': {
    get: {
      summary: 'Check if email domain has auto-join configuration',
      description: 'Checks if the provided email domain will auto-join an organization or company',
      tags: ['Authentication'],
      parameters: [
        {
          in: 'query',
          name: 'email',
          required: true,
          schema: {
            type: 'string',
            format: 'email'
          },
          description: 'Email address to check domain for'
        }
      ],
      responses: {
        200: {
          description: 'Domain check result',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DomainCheckResponse' }
            }
          }
        },
        400: {
          description: 'Invalid email format',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },

  '/api/v1/auth/invitation/{token}': {
    get: {
      summary: 'Get invitation details',
      description: 'Retrieves invitation details for display before accepting',
      tags: ['Authentication'],
      parameters: [
        {
          in: 'path',
          name: 'token',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Invitation token'
        }
      ],
      responses: {
        200: {
          description: 'Invitation details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  invitation: {
                    $ref: '#/components/schemas/Invitation'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Invalid or expired token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },

  '/api/v1/auth/accept-invitation': {
    post: {
      summary: 'Accept invitation and create account',
      description: 'Accepts an invitation to join an organization/company and creates user account',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AcceptInvitationRequest'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Invitation accepted and user created',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/User' },
                  {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'A magic link has been sent to user@example.com'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        400: {
          description: 'Invalid input or expired token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },

  '/api/v1/auth/oidc': {
    get: {
      summary: 'Initiate OIDC authentication',
      description: 'Starts OIDC/SSO authentication flow for an organization',
      tags: ['Authentication'],
      parameters: [
        {
          in: 'query',
          name: 'organizationId',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Organization ID for OIDC configuration'
        }
      ],
      responses: {
        302: {
          description: 'Redirect to OIDC provider'
        },
        400: {
          description: 'OIDC not configured or invalid organization',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },

  '/api/v1/auth/me': {
    get: {
      summary: 'Get current user information',
      description: 'Returns the authenticated user\'s profile information',
      tags: ['Authentication'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'User profile information',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' }
            }
          }
        },
        401: {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },

  '/api/v1/auth/check-oidc': {
    get: {
      summary: 'Check if OIDC/SSO is enabled for email domain',
      description: 'Checks if SSO is configured for the email domain and returns SSO details',
      tags: ['Authentication'],
      parameters: [
        {
          in: 'query',
          name: 'email',
          required: true,
          schema: {
            type: 'string',
            format: 'email'
          },
          description: 'Email address to check for SSO'
        }
      ],
      responses: {
        200: {
          description: 'OIDC check result',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OIDCCheckResponse' }
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

  '/api/v1/auth/verify-email': {
    post: {
      summary: 'Verify email address with token',
      description: 'Verifies user\'s email address using verification token',
      tags: ['Authentication'],
      security: [{ cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/VerifyEmailRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Email successfully verified',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' }
            }
          }
        },
        400: {
          description: 'Invalid or expired token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        401: {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },

  '/api/v1/auth/resend-verification': {
    post: {
      summary: 'Resend email verification code',
      description: 'Sends a new email verification code to the authenticated user',
      tags: ['Authentication'],
      security: [{ cookieAuth: [] }],
      responses: {
        200: {
          description: 'New verification code sent',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'A new verification code has been sent'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Not authenticated',
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

  '/api/v1/auth/magic-link': {
    post: {
      summary: 'Request magic link for passwordless login',
      description: 'Sends a magic login link to the user\'s email address',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/MagicLinkRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Magic link sent (or user not found - same response for security)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'If an account with this email exists, a magic link has been sent'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Email is required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },

  '/api/v1/auth/magic-link/verify': {
    post: {
      summary: 'Verify magic link token and log in',
      description: 'Verifies a magic link token and logs the user in',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/MagicLinkVerifyRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'User successfully logged in via magic link',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/User' }
            }
          }
        },
        400: {
          description: 'Invalid, used, or expired token',
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
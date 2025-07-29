// Integration-specific schemas
export const Integration = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    type: {
      type: 'string',
      enum: ['GITHUB'],
      description: 'Integration type'
    },
    organizationId: {
      type: 'string',
      description: 'Organization ID this integration belongs to'
    },
    installationId: {
      type: 'string',
      description: 'GitHub App installation ID'
    },
    ownerName: {
      type: 'string',
      description: 'GitHub organization/user name'
    },
    repositoryCount: {
      type: 'integer',
      description: 'Number of repositories in this integration'
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
  }
};

export const Repository = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: {
      type: 'string',
      description: 'Repository name'
    },
    fullName: {
      type: 'string',
      description: 'Full repository name (owner/repo)'
    },
    url: {
      type: 'string',
      description: 'Repository URL'
    },
    isPrivate: {
      type: 'boolean',
      description: 'Whether repository is private'
    },
    description: {
      type: 'string',
      description: 'Repository description'
    },
    language: {
      type: 'string',
      description: 'Primary programming language'
    },
    integrationId: {
      type: 'string',
      description: 'Integration ID this repository belongs to'
    },
    externalId: {
      type: 'string',
      description: 'External repository ID from the SCM provider'
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time'
    }
  }
};

export const LinkRepositoryRequest = {
  type: 'object',
  required: ['repositoryIds', 'projectIds'],
  properties: {
    repositoryIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Repository IDs to link'
    },
    projectIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Project IDs to link repositories to'
    }
  }
}; 
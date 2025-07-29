// Project-specific schemas
export const ProjectDetailed = {
  allOf: [
    { $ref: '#/components/schemas/Project' },
    {
      type: 'object',
      properties: {
        applicationUrl: {
          type: 'string',
          description: 'URL of the deployed application'
        },
        version: {
          type: 'string',
          description: 'Current version of the application'
        },
        deploymentStatus: {
          type: 'string',
          enum: ['DEVELOPMENT', 'STAGING', 'PRODUCTION', 'DEPRECATED'],
          description: 'Current deployment status'
        },
        repositoryUrl: {
          type: 'string',
          description: 'Source code repository URL'
        },
        repositoryBranch: {
          type: 'string',
          description: 'Primary repository branch'
        },
        repositoryProvider: {
          type: 'string',
          enum: ['GITHUB', 'GITLAB', 'BITBUCKET'],
          description: 'Source code repository provider'
        },
        ciCdPipelineUrl: {
          type: 'string',
          description: 'CI/CD pipeline URL'
        },
        projectType: {
          type: 'string',
          enum: ['WEB_APPLICATION', 'MOBILE_APPLICATION', 'API', 'LIBRARY', 'MICROSERVICE', 'DATABASE', 'INFRASTRUCTURE'],
          description: 'Type of project'
        },
        dataClassification: {
          type: 'string',
          enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'],
          description: 'Data classification level'
        },
        applicationCriticality: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          description: 'Business criticality level'
        },
        isExternallyExposed: {
          type: 'boolean',
          description: 'Whether the application is exposed to external users'
        },
        communicationChannel: {
          type: 'string',
          description: 'Team communication channel (e.g., Slack channel)'
        },
        documentationUrl: {
          type: 'string',
          description: 'Project documentation URL'
        },
        apiReferenceUrl: {
          type: 'string',
          description: 'API reference documentation URL'
        },
        runbookUrl: {
          type: 'string',
          description: 'Operational runbook URL'
        },
        threatModelUrl: {
          type: 'string',
          description: 'Security threat model URL'
        },
        lastSecurityReview: {
          type: 'string',
          format: 'date-time',
          description: 'Date of last security review'
        },
        securityToolProjectId: {
          type: 'string',
          description: 'Associated security tool project ID'
        },
        team: {
          $ref: '#/components/schemas/TeamWithCompanyAndOrg'
        },
        contacts: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProjectContact' }
        },
        technologies: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProjectTechnology' }
        },
        dependencies: {
          type: 'array',
          items: { $ref: '#/components/schemas/ProjectDependency' }
        }
      }
    }
  ]
};

export const CreateProjectRequest = {
  type: 'object',
  required: ['name', 'teamId'],
  properties: {
    name: {
      type: 'string',
      description: 'Project name'
    },
    description: {
      type: 'string',
      description: 'Project description'
    },
    teamId: {
      type: 'string',
      description: 'Parent team ID'
    }
  }
};

export const UpdateProjectRequest = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Project name'
    },
    description: {
      type: 'string',
      description: 'Project description'
    },
    applicationUrl: {
      type: 'string',
      description: 'URL of the deployed application'
    },
    version: {
      type: 'string',
      description: 'Current version of the application'
    },
    deploymentStatus: {
      type: 'string',
      enum: ['DEVELOPMENT', 'STAGING', 'PRODUCTION', 'DEPRECATED'],
      description: 'Current deployment status'
    },
    repositoryUrl: {
      type: 'string',
      description: 'Source code repository URL'
    },
    ciCdPipelineUrl: {
      type: 'string',
      description: 'CI/CD pipeline URL'
    },
    projectType: {
      type: 'string',
      enum: ['WEB_APPLICATION', 'MOBILE_APPLICATION', 'API', 'LIBRARY', 'MICROSERVICE', 'DATABASE', 'INFRASTRUCTURE'],
      description: 'Type of project'
    },
    dataClassification: {
      type: 'string',
      enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'],
      description: 'Data classification level'
    },
    applicationCriticality: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      description: 'Business criticality level'
    },
    isExternallyExposed: {
      type: 'boolean',
      description: 'Whether the application is exposed to external users'
    },
    communicationChannel: {
      type: 'string',
      description: 'Team communication channel (e.g., Slack channel)'
    },
    documentationUrl: {
      type: 'string',
      description: 'Project documentation URL'
    },
    apiReferenceUrl: {
      type: 'string',
      description: 'API reference documentation URL'
    },
    runbookUrl: {
      type: 'string',
      description: 'Operational runbook URL'
    },
    threatModelUrl: {
      type: 'string',
      description: 'Security threat model URL'
    },
    lastSecurityReview: {
      type: 'string',
      format: 'date-time',
      description: 'Date of last security review'
    }
  }
};

export const Contact = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', description: "Contact's role in the project" },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const ProjectContact = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    projectId: { type: 'string' },
    contactId: { type: 'string' },
    contact: { $ref: '#/components/schemas/Contact' },
    user: {
      type: 'object',
      nullable: true,
      properties: {
        id: { type: 'string' },
        email: { type: 'string', format: 'email' }
      }
    },
    projectMembership: {
      type: 'object',
      nullable: true,
      properties: {
        userId: { type: 'string' },
        role: { type: 'string', enum: ['ADMIN', 'EDITOR', 'READER'] }
      }
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const Technology = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    category: { type: 'string' },
    version: { type: 'string' },
    description: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const ProjectTechnology = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    projectId: { type: 'string' },
    technologyId: { type: 'string' },
    technology: { $ref: '#/components/schemas/Technology' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const ProjectDependency = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    fromProjectId: { type: 'string' },
    toProjectId: { type: 'string' },
    dependencyType: {
      type: 'string',
      enum: ['API', 'DATABASE', 'SERVICE', 'LIBRARY'],
      description: 'Type of dependency relationship'
    },
    description: {
      type: 'string',
      description: 'Description of the dependency'
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

export const TeamWithCompanyAndOrg = {
  allOf: [
    { $ref: '#/components/schemas/Team' },
    {
      type: 'object',
      properties: {
        company: {
          allOf: [
            { $ref: '#/components/schemas/Company' },
            {
              type: 'object',
              properties: {
                organization: { $ref: '#/components/schemas/Organization' }
              }
            }
          ]
        }
      }
    }
  ]
}; 
// Relationship-specific schemas
export const ProjectRelationship = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'Relationship ID'
    },
    sourceProjectId: {
      type: 'string',
      description: 'Source project ID (the project that depends on another)'
    },
    targetProjectId: {
      type: 'string',
      description: 'Target project ID (the project being depended upon)'
    },
    type: {
      type: 'string',
      enum: ['DEPENDS_ON', 'USES', 'INTEGRATES_WITH', 'EXTENDS'],
      description: 'Type of relationship between projects'
    },
    description: {
      type: 'string',
      nullable: true,
      description: 'Optional description of the relationship'
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

export const CreateRelationshipRequest = {
  type: 'object',
  required: ['sourceProjectId', 'targetProjectId', 'type'],
  properties: {
    sourceProjectId: {
      type: 'string',
      description: 'Source project ID'
    },
    targetProjectId: {
      type: 'string',
      description: 'Target project ID'
    },
    type: {
      type: 'string',
      enum: ['DEPENDS_ON', 'USES', 'INTEGRATES_WITH', 'EXTENDS'],
      description: 'Type of relationship'
    },
    description: {
      type: 'string',
      description: 'Optional description of the relationship'
    }
  }
};

export const UpdateRelationshipRequest = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['DEPENDS_ON', 'USES', 'INTEGRATES_WITH', 'EXTENDS'],
      description: 'Updated relationship type'
    },
    description: {
      type: 'string',
      description: 'Updated description of the relationship'
    }
  }
}; 
// Technology-specific schemas
export const Technology = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'Technology ID'
    },
    name: {
      type: 'string',
      description: 'Technology name'
    },
    type: {
      type: 'string',
      description: 'Technology type/category'
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
import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Query {
    project(id: ID!): Project
  }

  type Project {
    id: ID!
    name: String!
    description: String
    userPermission: UserPermission
  }

  type UserPermission {
    role: Role
    hasAdminAccess: Boolean
    hasEditorAccess: Boolean
    hasReaderAccess: Boolean
  }

  enum Role {
    ADMIN
    EDITOR
    READER
  }
`; 
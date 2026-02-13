import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import all schema and path modules
import * as authSchemas from './schemas/auth.js';
import * as commonSchemas from './schemas/common.js';
import * as companySchemas from './schemas/company.js';
import * as organizationSchemas from './schemas/organization.js';
import * as teamSchemas from './schemas/team.js';
import * as projectSchemas from './schemas/project.js';
import * as relationshipSchemas from './schemas/relationship.js';
import * as technologySchemas from './schemas/technology.js';
import * as findingSchemas from './schemas/finding.js';
import * as hierarchySchemas from './schemas/hierarchy.js';
import * as invitationSchemas from './schemas/invitation.js';
import * as oidcSchemas from './schemas/oidc.js';
import * as membershipSchemas from './schemas/membership.js';
import * as integrationSchemas from './schemas/integration.js';
import * as securityToolSchemas from './schemas/securityTool.js';
import * as dastScanSchemas from './schemas/dastScan.js';

import * as authPaths from './paths/auth.js';
import * as companyPaths from './paths/company.js';
import * as organizationPaths from './paths/organization.js';
import * as teamPaths from './paths/team.js';
import * as projectPaths from './paths/project.js';
import * as relationshipPaths from './paths/relationship.js';
import * as technologyPaths from './paths/technology.js';
import * as findingPaths from './paths/finding.js';
import * as hierarchyPaths from './paths/hierarchy.js';
import * as invitationPaths from './paths/invitation.js';
import * as oidcPaths from './paths/oidc.js';
import * as membershipPaths from './paths/membership.js';
import * as integrationPaths from './paths/integration.js';
import * as securityToolPaths from './paths/securityTool.js';
import * as dastScanPaths from './paths/dastScan.js';
import * as sastScanPaths from './paths/sastScans.js';
import * as internalPaths from './paths/internal.js';

// Combine all schemas
const schemas = {
  ...commonSchemas,
  ...authSchemas,
  ...companySchemas,
  ...organizationSchemas,
  ...teamSchemas,
  ...projectSchemas,
  ...relationshipSchemas,
  ...technologySchemas,
  ...findingSchemas,
  ...hierarchySchemas,
  ...invitationSchemas,
  ...oidcSchemas,
  ...membershipSchemas,
  ...integrationSchemas,
  ...securityToolSchemas,
  ...dastScanSchemas,
};

// Combine all paths
const paths = {
  ...authPaths.authPaths,
  ...companyPaths.companyPaths,
  ...organizationPaths.organizationPaths,
  ...teamPaths.teamPaths,
  ...projectPaths.projectPaths,
  ...relationshipPaths.relationshipPaths,
  ...technologyPaths.technologyPaths,
  ...findingPaths.findingPaths,
  ...hierarchyPaths.hierarchyPaths,
  ...invitationPaths.invitationPaths,
  ...oidcPaths.oidcPaths,
  ...membershipPaths.membershipPaths,
  ...integrationPaths.integrationPaths,
  ...securityToolPaths.securityToolPaths,
  ...dastScanPaths.dastScanPaths,
  ...sastScanPaths.sastScanPaths,
  ...internalPaths.internalPaths,
};

// Build the complete OpenAPI specification
export const buildOpenAPISpec = () => {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Stagehand API',
      version: '1.0.0',
      description: 'A comprehensive API for managing security governance across organizational hierarchies',
      contact: {
        name: 'Stagehand Development Team',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'session',
          description: 'Session cookie authentication'
        }
      },
      schemas,
    },
    paths,
    security: [
      {
        cookieAuth: [],
      },
    ],
  };
}; 
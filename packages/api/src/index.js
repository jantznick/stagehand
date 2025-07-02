import express from 'express';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import configurePassport from './utils/passport.js';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/company.js';
import teamRoutes from './routes/teams.js';
import projectRoutes from './routes/projects.js';
import hierarchyRoutes from './routes/hierarchy.js';
import organizationRoutes from './routes/organizations.js';
import membershipRoutes from './routes/memberships.js';
import invitationRoutes from './routes/invitations.js';
import oidcRoutes from './routes/oidc.js';
import technologyRoutes from './routes/technologies.js';
import relationshipRoutes from './routes/relationships.js';
import integrationRoutes from './routes/integrations.js';
import securityToolRoutes from './routes/securityTools.js';
import findingsRoutes from './routes/findings.js';
import dastScanRoutes from './routes/dastScans.js';

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Configure and initialize passport
configurePassport();

// Swagger configuration
const swaggerOptions = {
  definition: {
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
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        
        // Base entity schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'PENDING'] },
            lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
            emailVerifiedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        Organization: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            accountType: { type: 'string', enum: ['STANDARD', 'ENTERPRISE'] },
            defaultCompanyId: { type: 'string', nullable: true },
            hierarchyDisplayNames: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            organizationId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        Team: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            companyId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            teamId: { type: 'string' },
            applicationUrl: { type: 'string', nullable: true },
            version: { type: 'string', nullable: true },
            deploymentStatus: { type: 'string', enum: ['DEVELOPMENT', 'STAGING', 'PRODUCTION', 'DEPRECATED'] },
            repositoryUrl: { type: 'string', nullable: true },
            ciCdPipelineUrl: { type: 'string', nullable: true },
            projectType: { type: 'string', enum: ['WEB_APPLICATION', 'MOBILE_APPLICATION', 'API', 'SERVICE', 'LIBRARY', 'DATABASE', 'INFRASTRUCTURE'] },
            dataClassification: { type: 'string', enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'] },
            applicationCriticality: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            isExternallyExposed: { type: 'boolean' },
            communicationChannel: { type: 'string', nullable: true },
            documentationUrl: { type: 'string', nullable: true },
            apiReferenceUrl: { type: 'string', nullable: true },
            runbookUrl: { type: 'string', nullable: true },
            threatModelUrl: { type: 'string', nullable: true },
            lastSecurityReview: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        Membership: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'EDITOR', 'READER'] },
            organizationId: { type: 'string', nullable: true },
            companyId: { type: 'string', nullable: true },
            teamId: { type: 'string', nullable: true },
            projectId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        Finding: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            externalId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] },
            status: { type: 'string', enum: ['OPEN', 'FIXED', 'IGNORED', 'FALSE_POSITIVE'] },
            firstFound: { type: 'string', format: 'date-time' },
            lastSeen: { type: 'string', format: 'date-time' },
            securityToolProjectId: { type: 'string' },
            vulnerabilities: {
              type: 'array',
              items: { $ref: '#/components/schemas/Vulnerability' }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        Vulnerability: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            cveId: { type: 'string', nullable: true },
            title: { type: 'string' },
            description: { type: 'string' },
            severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] },
            cvssScore: { type: 'number', nullable: true },
            package: { type: 'string', nullable: true },
            version: { type: 'string', nullable: true },
            fixedIn: { type: 'string', nullable: true },
            publishedDate: { type: 'string', format: 'date-time', nullable: true },
            findingId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        // Contact and Project Association schemas
        Contact: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            userId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        ProjectContact: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            projectId: { type: 'string' },
            contactId: { type: 'string' },
            contactType: { type: 'string' },
            contact: { $ref: '#/components/schemas/Contact' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        Technology: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        ProjectTechnology: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            projectId: { type: 'string' },
            technologyId: { type: 'string' },
            version: { type: 'string', nullable: true },
            source: { type: 'string' },
            technology: { $ref: '#/components/schemas/Technology' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        
        // Hierarchy navigation schema
        NavigationTreeNode: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['organization', 'company', 'team', 'project'] },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/NavigationTreeNode' }
            }
          }
        }
      }
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cookieParser());
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'a-very-strong-secret-in-development',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Stagehand API Documentation',
}));

// Auth routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/hierarchy', hierarchyRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/memberships', membershipRoutes);
app.use('/api/v1/invitations', invitationRoutes);
app.use('/api/v1', oidcRoutes);
app.use('/api/v1/technologies', technologyRoutes);
app.use('/api/v1/relationships', relationshipRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/security-tools', securityToolRoutes);
app.use('/api/v1/projects', findingsRoutes);
app.use('/api/v1/projects', dastScanRoutes);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
}); 
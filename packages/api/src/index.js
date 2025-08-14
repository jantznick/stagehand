import express from 'express';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
import vulnerabilitiesRoutes from './routes/vulnerabilities.js';

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Configure and initialize passport
configurePassport();

// Load static OpenAPI specification
const openApiSpec = JSON.parse(readFileSync(join(__dirname, 'openapi', 'openapi-spec.json'), 'utf8'));

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
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
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
app.use('/api/v1', vulnerabilitiesRoutes);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
}); 
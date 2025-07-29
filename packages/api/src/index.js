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
import swaggerUi from 'swagger-ui-express';
import configurePassport from './utils/passport.js';
import { setupGraphQL } from './graphql/index.js';
import authRoutes from './routes/auth.js';
import oidcRoutes from './routes/oidc.js';
import invitationsRoutes from './routes/invitations.js';
import membershipsRoutes from './routes/memberships.js';
import organizationsRoutes from './routes/organizations.js';
import companyRoutes from './routes/company.js';
import teamsRoutes from './routes/teams.js';
import projectsRoutes from './routes/projects.js';
import relationshipsRoutes from './routes/relationships.js';
import hierarchyRoutes from './routes/hierarchy.js';
import integrationsRoutes from './routes/integrations.js';
import securityToolsRoutes from './routes/securityTools.js';
import technologiesRoutes from './routes/technologies.js';
import findingsRoutes from './routes/findings.js';
import dastScanRoutes from './routes/dastScans.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;
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

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/oidc', oidcRoutes);
app.use('/api/v1/invitations', invitationsRoutes);
app.use('/api/v1/memberships', membershipsRoutes);
app.use('/api/v1/organizations', organizationsRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/teams', teamsRoutes);
app.use('/api/v1/projects', projectsRoutes);
app.use('/api/v1/relationships', relationshipsRoutes);
app.use('/api/v1/hierarchy', hierarchyRoutes);
app.use('/api/v1/integrations', integrationsRoutes);
app.use('/api/v1/security-tools', securityToolsRoutes);
app.use('/api/v1/technologies', technologiesRoutes);
app.use('/api/v1/findings', findingsRoutes);
app.use('/api/v1/dast-scans', dastScanRoutes);

// Setup GraphQL
setupGraphQL(app);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
}); 
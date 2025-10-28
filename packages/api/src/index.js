const express = require('express');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
const { PrismaClient } = require('@prisma/client');
const { readFileSync } = require('fs');
const { join } = require('path');

const swaggerUi = require('swagger-ui-express');
const configurePassport = require('./utils/passport.js');
const authRoutes = require('./routes/auth.js');
const companyRoutes = require('./routes/company.js');
const teamRoutes = require('./routes/teams.js');
const projectRoutes = require('./routes/projects.js');
const hierarchyRoutes = require('./routes/hierarchy.js');
const organizationRoutes = require('./routes/organizations.js');
const membershipRoutes = require('./routes/memberships.js');
const invitationRoutes = require('./routes/invitations.js');
const oidcRoutes = require('./routes/oidc.js');
const technologyRoutes = require('./routes/technologies.js');
const relationshipRoutes = require('./routes/relationships.js');
const integrationRoutes = require('./routes/integrations.js');
const securityToolRoutes = require('./routes/securityTools.js');
const findingsRoutes = require('./routes/findings.js');
const dastScanRoutes = require('./routes/dastScans.js');
const sastScanRoutes = require('./routes/sastScans.js');
const vulnerabilitiesRoutes = require('./routes/vulnerabilities.js');
const internalRoutes = require('./routes/internal.js');

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
app.use('/api/v1/projects/:projectId/findings', findingsRoutes);
app.use('/api/v1/projects/:projectId/dast', dastScanRoutes);
app.use('/api/v1/projects/:projectId/sast', sastScanRoutes);
app.use('/api/v1/vulnerabilities', vulnerabilitiesRoutes);
app.use('/api/v1/internal', internalRoutes);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
}); 
/**
 * @openapi
 * tags:
 *   - name: Security Tools
 *     description: Security tool integrations and vulnerability scanning management
 * 
 * components:
 *   schemas:
 *     SecurityTool:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *           description: Security tool name
 *         type:
 *           type: string
 *           enum: [SNYK]
 *           description: Type of security tool
 *         organizationId:
 *           type: string
 *           description: Organization ID this tool belongs to
 *         credentials:
 *           type: string
 *           description: Encrypted credentials for the tool
 *         lastSyncAt:
 *           type: string
 *           format: date-time
 *           description: Last synchronization timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateSecurityToolRequest:
 *       type: object
 *       required:
 *         - provider
 *         - type
 *         - resourceType
 *         - resourceId
 *         - credentials
 *       properties:
 *         provider:
 *           type: string
 *           enum: [Snyk]
 *           description: Security tool provider name
 *         type:
 *           type: string
 *           enum: [SNYK]
 *           description: Type of security tool
 *         displayName:
 *           type: string
 *           description: Display name for the security tool integration
 *         resourceType:
 *           type: string
 *           enum: [organization, company, team, project]
 *           description: Type of resource to associate with
 *         resourceId:
 *           type: string
 *           description: Resource ID to associate with
 *         credentials:
 *           type: object
 *           description: Security tool credentials (will be encrypted)
 *           properties:
 *             apiToken:
 *               type: string
 *               description: API token for the security tool
 *             orgId:
 *               type: string
 *               description: Organization ID in the security tool
 *     
 *     SecurityToolProject:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *           description: Project name in security tool
 *         externalId:
 *           type: string
 *           description: External project ID from security tool
 *         url:
 *           type: string
 *           description: Project URL in security tool
 *         securityToolId:
 *           type: string
 *           description: Security tool ID this project belongs to
 *         lastScanAt:
 *           type: string
 *           format: date-time
 *           description: Last scan timestamp
 *         vulnerabilityCount:
 *           type: integer
 *           description: Total number of vulnerabilities found
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     LinkSecurityToolProjectRequest:
 *       type: object
 *       required:
 *         - securityToolProjectIds
 *         - projectIds
 *       properties:
 *         securityToolProjectIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Security tool project IDs to link
 *         projectIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Application project IDs to link to
 * 
 * /api/v1/security-tools:
 *   get:
 *     summary: Get security tools for resource
 *     description: Retrieves all security tool integrations for a specific resource (organization, company, team, or project)
 *     tags: [Security Tools]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: resourceType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [organization, company, team, project]
 *         description: Type of resource to get security tools for
 *       - in: query
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID to get security tools for
 *     responses:
 *       200:
 *         description: List of security tools
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SecurityTool'
 *       400:
 *         description: Resource type and ID are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to view security tools for this resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   
 *   post:
 *     summary: Create security tool integration
 *     description: Creates a new security tool integration with encrypted credential storage
 *     tags: [Security Tools]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSecurityToolRequest'
 *     responses:
 *       201:
 *         description: Security tool successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SecurityTool'
 *       400:
 *         description: Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to create security tools for this resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during creation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/security-tools/{securityToolId}/projects:
 *   get:
 *     summary: Get security tool projects
 *     description: Retrieves all projects from a specific security tool integration
 *     tags: [Security Tools]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: securityToolId
 *         required: true
 *         schema:
 *           type: string
 *         description: Security tool ID
 *     responses:
 *       200:
 *         description: List of security tool projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SecurityToolProject'
 *       403:
 *         description: Not authorized to view this security tool
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Security tool not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/security-tools/{securityToolId}/sync:
 *   post:
 *     summary: Sync security tool projects
 *     description: Synchronizes projects and findings from the security tool, updating the local database
 *     tags: [Security Tools]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: securityToolId
 *         required: true
 *         schema:
 *           type: string
 *         description: Security tool ID
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sync completed successfully
 *                 projectsAdded:
 *                   type: integer
 *                   description: Number of new projects added
 *                 projectsUpdated:
 *                   type: integer
 *                   description: Number of existing projects updated
 *                 findingsAdded:
 *                   type: integer
 *                   description: Number of new findings added
 *       403:
 *         description: Not authorized to sync this security tool
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Security tool not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during sync
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/security-tools/link-projects:
 *   post:
 *     summary: Link security tool projects to applications
 *     description: Creates associations between security tool projects and application projects
 *     tags: [Security Tools]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkSecurityToolProjectRequest'
 *     responses:
 *       200:
 *         description: Projects successfully linked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Security tool projects linked successfully
 *                 linkedCount:
 *                   type: integer
 *                   description: Number of project links created
 *       400:
 *         description: Missing required data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to link projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during linking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/security-tools/{securityToolId}:
 *   delete:
 *     summary: Delete security tool integration
 *     description: Removes a security tool integration and all associated projects and findings
 *     tags: [Security Tools]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: securityToolId
 *         required: true
 *         schema:
 *           type: string
 *         description: Security tool ID
 *     responses:
 *       204:
 *         description: Security tool successfully deleted
 *       403:
 *         description: Not authorized to delete this security tool
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Security tool not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during deletion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { syncSnykFindings } from '../utils/findings.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

// Route is already documented above with comprehensive OpenAPI spec
router.post('/', async (req, res) => {
    const { provider, type, displayName, credentials, resourceType, resourceId } = req.body;
    const { id: userId } = req.user;

    if (!provider || !type || !credentials || !resourceType || !resourceId) {
        return res.status(400).json({ error: 'Missing required fields for creating a security tool integration.' });
    }

    try {
        const canManage = await hasPermission(req.user, ['ADMIN'], resourceType, resourceId);
        if (!canManage) {
            return res.status(403).json({ error: 'You are not authorized to add integrations to this resource.' });
        }

        const encryptedCredentials = encrypt(JSON.stringify(credentials));

        const integration = await prisma.securityToolIntegration.create({
            data: {
                provider,
                type,
                displayName: displayName || provider,
                encryptedCredentials,
                createdById: userId,
                [`${resourceType}Id`]: resourceId,
            }
        });

        res.status(201).json(integration);

    } catch (error) {
        console.error('Failed to create security tool integration:', error);
        res.status(500).json({ error: 'An internal error occurred.' });
    }
});


// Route is already documented above with comprehensive OpenAPI spec
router.get('/', async (req, res) => {
    const { resourceType, resourceId } = req.query;

    if (!resourceType || !resourceId) {
        return res.status(400).json({ error: 'resourceType and resourceId query parameters are required.' });
    }

    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], resourceType, resourceId);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view integrations for this resource.' });
    }

    try {
        let whereClause = {};

        if (resourceType === 'project') {
            const project = await prisma.project.findUnique({
                where: { id: resourceId },
                include: {
                    team: {
                        include: {
                            company: true
                        }
                    }
                }
            });

            if (!project) {
                return res.status(404).json({ error: 'Project not found.' });
            }

            const teamId = project.teamId;
            const companyId = project.team.companyId;
            const organizationId = project.team.company.organizationId;

            whereClause = {
                OR: [
                    { teamId },
                    { companyId },
                    { organizationId }
                ]
            };
        } else {
            whereClause = {
                [`${resourceType}Id`]: resourceId
            };
        }

        const integrations = await prisma.securityToolIntegration.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json(integrations);
    } catch (error) {
        console.error('Get security tool integrations error:', error);
        res.status(500).json({ error: 'Failed to retrieve integrations.' });
    }
});

/**
 * @openapi
 * /api/v1/security-tools/{integrationId}/snyk/projects:
 *   get:
 *     summary: Get Snyk projects from integration
 *     description: Retrieves all projects from a Snyk security tool integration via Snyk API
 *     tags: [Security Tools]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Security tool integration ID
 *     responses:
 *       200:
 *         description: List of Snyk projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                   origin:
 *                     type: string
 *                   browseUrl:
 *                     type: string
 *       400:
 *         description: Missing Snyk credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to access this integration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Snyk integration not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:integrationId/snyk/projects', async (req, res) => {
    const { integrationId } = req.params;
    const { id: userId } = req.user;

    try {
        const integration = await prisma.securityToolIntegration.findUnique({
            where: { id: integrationId }
        });

        if (!integration || integration.provider !== 'Snyk') {
            return res.status(404).json({ error: 'Snyk integration not found.' });
        }

        // Basic permission check: Ensure user who created it can access it.
        // More robust checks can be added later if needed.
        if (integration.createdById !== userId) {
            return res.status(403).json({ error: 'You are not authorized to access this integration.' });
        }

        const credentials = JSON.parse(decrypt(integration.encryptedCredentials));
        const { apiToken, orgId } = credentials;

        if (!apiToken || !orgId) {
            return res.status(400).json({ error: 'Integration is missing Snyk API token or Organization ID.' });
        }

        const snykApiUrl = `https://api.snyk.io/v1/org/${orgId}/projects`;
        const snykResponse = await fetch(snykApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${apiToken}`,
            },
        });

        const snykData = await snykResponse.json();

        if (!snykResponse.ok) {
            console.error('Snyk API error:', snykData);
            return res.status(snykResponse.status).json({ error: 'Failed to fetch projects from Snyk.', details: snykData.message });
        }
        
        // Transform the data to a simpler format for the frontend
        const projects = snykData.projects.map(p => ({
            id: p.id,
            name: p.name,
            type: p.type,
            origin: p.origin,
            browseUrl: p.browseUrl,
        }));

        res.status(200).json(projects);

    } catch (error) {
        console.error(`Failed to fetch Snyk projects for integration ${integrationId}:`, error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

/**
 * @openapi
 * /api/v1/security-tools/{integrationId}/sync:
 *   post:
 *     summary: Sync security tool findings
 *     description: Triggers background synchronization of security findings for specific projects from the security tool
 *     tags: [Security Tools]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Security tool integration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectIds
 *             properties:
 *               projectIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of project IDs to sync findings for
 *     responses:
 *       202:
 *         description: Sync process initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sync process initiated successfully
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Security tool integration not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:integrationId/sync', async (req, res) => {
    const { integrationId } = req.params;
    const { projectIds } = req.body; // Expect an array of project IDs to sync

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
        return res.status(400).json({ error: 'An array of projectIds is required.' });
    }

    try {
        const integration = await prisma.securityToolIntegration.findUnique({
            where: { id: integrationId },
        });

        if (!integration) {
            return res.status(404).json({ error: 'Security tool integration not found.' });
        }
        
        // Basic permission check can go here if needed

        // Do not await this call. This allows us to send an immediate response to the client.
        // The sync will run in the background.
        if (integration.provider === 'Snyk') {
            syncSnykFindings(integrationId, projectIds).catch(error => {
                console.error(`[Background Sync Error] Failed to sync Snyk integration ${integrationId}:`, error);
            });
        } else {
            return res.status(400).json({ error: `Sync not supported for provider: ${integration.provider}` });
        }

        res.status(202).json({ message: 'Sync process initiated successfully.' });

    } catch (error) {
        console.error(`Error syncing integration ${integrationId}:`, error);
        res.status(500).json({ error: 'An error occurred during the sync process.' });
    }
});

/**
 * @openapi
 * /api/v1/security-tools/{integrationId}/sync-logs:
 *   get:
 *     summary: Get security tool sync logs
 *     description: Retrieves the last 20 synchronization logs for a security tool integration
 *     tags: [Security Tools]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Security tool integration ID
 *     responses:
 *       200:
 *         description: List of sync logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   securityToolIntegrationId:
 *                     type: string
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   status:
 *                     type: string
 *                     enum: [STARTED, COMPLETED, FAILED]
 *                   errorMessage:
 *                     type: string
 *                     nullable: true
 *                   projectsSynced:
 *                     type: integer
 *                   findingsAdded:
 *                     type: integer
 *                   findingsUpdated:
 *                     type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:integrationId/sync-logs', async (req, res) => {
    const { integrationId } = req.params;

    try {
        // Basic permission check can be added here if needed
        const logs = await prisma.integrationSyncLog.findMany({
            where: { securityToolIntegrationId: integrationId },
            orderBy: { startTime: 'desc' },
            take: 20, // Limit to the last 20 syncs
        });
        res.status(200).json(logs);
    } catch (error) {
        console.error(`Failed to fetch sync logs for security tool integration ${integrationId}:`, error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

export default router; 
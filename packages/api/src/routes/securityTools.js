// Security tool routes - OpenAPI documentation moved to packages/api/src/openapi/

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
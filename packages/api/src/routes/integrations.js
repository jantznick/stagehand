// Integration routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../utils/permissions.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { syncGitHubFindings } from '../utils/findings.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

/**
 * @route POST /api/v1/integrations/github/auth-start
 * @desc Generate the GitHub App installation URL
 * @access Private
 */
router.post('/github/auth-start', async (req, res) => {
	console.log('--- GITHUB AUTH START ---');
	console.log(process.env.GITHUB_APP_ID);
  const { resourceType, resourceId } = req.body;
  const { id: userId } = req.user;

  if (!resourceType || !resourceId) {
    return res.status(400).json({ error: 'resourceType and resourceId are required.' });
  }

  // Authorization: User must be an ADMIN or EDITOR of the resource to manage integrations.
  const canManage = await checkPermission(req.user, ['ADMIN', 'EDITOR'], resourceType, resourceId);
  if (!canManage) {
    return res.status(403).json({ error: 'You are not authorized to manage integrations for this resource.' });
  }

  const statePayload = { userId, resourceType, resourceId };
  const state = jwt.sign(statePayload, process.env.JWT_SECRET, { expiresIn: '10m' });

  const githubAppUrl = `https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new`;
  
  const installUrl = `${githubAppUrl}?state=${state}`;
  console.log(installUrl);

  res.status(200).json({ installUrl });
});

/**
 * @route GET /api/v1/integrations/github/callback
 * @desc Handle the callback from GitHub after app installation.
 * @access Private
 */
router.get('/github/callback', async (req, res) => {
    const { state, installation_id } = req.query;

    if (!state || !installation_id) {
        return res.status(400).json({ error: 'Missing state or installation_id from GitHub callback.' });
    }

    try {
        const decodedState = jwt.verify(state, process.env.JWT_SECRET);
        const { userId, resourceType, resourceId } = decodedState;

        const now = Math.floor(Date.now() / 1000);
        const appJwt = jwt.sign(
            {
                iat: now - 60,
                exp: now + (10 * 60),
                iss: process.env.GITHUB_APP_ID,
            },
            process.env.GITHUB_PRIVATE_KEY,
            {
                algorithm: 'RS256',
            }
        );

        const tokenResponse = await fetch(`https://api.github.com/app/installations/${installation_id}/access_tokens`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${appJwt}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });
        
        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            return res.status(tokenResponse.status).json({ error: 'Failed to obtain installation access token from GitHub.', details: tokenData.message });
        }

        // Fetch installation details to get the account login name
        const installationResponse = await fetch(`https://api.github.com/app/installations/${installation_id}`, {
            headers: {
                'Authorization': `Bearer ${appJwt}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });
        const installationData = await installationResponse.json();
        const displayName = installationData.account?.login;

        const encryptedAccessToken = encrypt(tokenData.token);

        await prisma.sCMIntegration.create({
            data: {
                provider: 'GITHUB',
                displayName,
                installationId: installation_id.toString(),
                encryptedAccessToken,
                createdById: userId,
                [`${resourceType}Id`]: resourceId,
            }
        });

        const redirectUrl = new URL(`${process.env.WEB_URL}/settings/${resourceType}/${resourceId}`);
        redirectUrl.searchParams.set('integration_success', 'true');
        res.redirect(redirectUrl.toString());

    } catch (error) {
        console.error('--- GITHUB CALLBACK FAILED ---', error);
        res.status(500).json({ error: 'An internal error occurred during the GitHub callback process.' });
    }
});

/**
 * @route GET /api/v1/integrations/:id/repositories
 * @desc Get all repositories accessible by a specific integration
 * @access Private
 */
router.get('/:id/repositories', async (req, res) => {
    const { id } = req.params;
    const { id: userId } = req.user;

    try {
        const integration = await prisma.sCMIntegration.findUnique({
            where: { id }
        });

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found.' });
        }

        // Basic permission check: For now, only the user who created it can fetch repos.
        // This can be expanded later to include resource admins.
        if (integration.createdById !== userId) {
            return res.status(403).json({ error: 'You are not authorized to access repositories for this integration.' });
        }
        
        const accessToken = decrypt(integration.encryptedAccessToken);

        const reposResponse = await fetch(`https://api.github.com/installation/repositories`, {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        const reposData = await reposResponse.json();

        if (!reposResponse.ok) {
            console.error('GitHub Repos Fetch Error:', reposData);
            return res.status(reposResponse.status).json({ error: 'Failed to fetch repositories from GitHub.', details: reposData.message });
        }

        res.status(200).json(reposData.repositories);

    } catch (error) {
        console.error('Get repositories error:', error);
        res.status(500).json({ error: 'Failed to retrieve repositories.' });
    }
});

/**
 * @route GET /api/v1/integrations
 * @desc Get all integrations for a specific resource
 * @access Private
 */
router.get('/', async (req, res) => {
    const { resourceType, resourceId } = req.query;

    if (!resourceType || !resourceId) {
        return res.status(400).json({ error: 'resourceType and resourceId query parameters are required.' });
    }

    // Authorization check: User must have at least reader access to the resource
    const canView = await checkPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], resourceType, resourceId);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view these integrations.' });
    }

    try {
        const integrations = await prisma.sCMIntegration.findMany({
            where: {
                [`${resourceType}Id`]: resourceId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json(integrations);
    } catch (error) {
        console.error('Get integrations error:', error);
        res.status(500).json({ error: 'Failed to retrieve integrations.' });
    }
});

/**
 * @route DELETE /api/v1/integrations/:integrationId
 * @desc Delete an SCM integration
 * @access Private
 */
router.delete('/:integrationId', async (req, res) => {
    const { integrationId } = req.params;
    const { id: userId } = req.user;

    try {
        const integration = await prisma.sCMIntegration.findUnique({
            where: { id: integrationId }
        });

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found.' });
        }

        const canDelete = await canUserDeleteIntegration(req.user, integration);
        if (!canDelete) {
            return res.status(403).json({ error: 'You are not authorized to delete this integration.' });
        }

        // Use a transaction to ensure data integrity
        await prisma.$transaction(async (tx) => {
            // 1. Unlink all projects associated with this integration.
            // This sets their scmIntegrationId to null but leaves repositoryUrl intact.
            await tx.project.updateMany({
                where: { scmIntegrationId: integrationId },
                data: { scmIntegrationId: null },
            });

            // 2. Delete the integration itself.
            await tx.sCMIntegration.delete({
                where: { id: integrationId },
            });
        });

        return res.status(204).send();

    } catch (error) {
        console.error('Delete integration error:', error);
        res.status(500).json({ error: 'Failed to delete integration.' });
    }
});

/**
 * @route POST /api/v1/integrations/:integrationId/sync
 * @desc Trigger a sync for a specific SCM integration to fetch findings
 * @access Private
 */
router.post('/sync/:integrationId', async (req, res) => {
    const { integrationId } = req.params;

    try {
        const integration = await prisma.sCMIntegration.findUnique({
            where: { id: integrationId },
        });

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found.' });
        }
        
        let resourceType, resourceId;
        if (integration.organizationId) {
            resourceType = 'organization';
            resourceId = integration.organizationId;
        } else if (integration.companyId) {
            resourceType = 'company';
            resourceId = integration.companyId;
        } else if (integration.teamId) {
            resourceType = 'team';
            resourceId = integration.teamId;
        } else if (integration.projectId) {
            resourceType = 'project';
            resourceId = integration.projectId;
        }

        if (resourceType && resourceId) {
            const canView = await checkPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], resourceType, resourceId);
            if (!canView) {
                return res.status(403).json({ error: 'You are not authorized to sync this integration.' });
            }
        }
        
        // For now, we only support GitHub, so we'll hardcode the sync logic here.
        if (integration.provider === 'GITHUB') {
            await syncGitHubFindings(integrationId);
        }

        res.status(202).json({ message: 'Sync process initiated successfully.' });

    } catch (error) {
        console.error(`Error syncing integration ${integrationId}:`, error);
        res.status(500).json({ error: 'An error occurred during the sync process.' });
    }
});

/**
 * @route GET /api/v1/integrations/:integrationId/sync-logs
 * @desc Get sync logs for a specific SCM integration
 * @access Private
 */
router.get('/:integrationId/sync-logs', async (req, res) => {
    const { integrationId } = req.params;

    try {
        // Authorization check: User must have at least reader access to the resource
        const canView = await checkPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'scmIntegration', integrationId);
        if (!canView) {
            return res.status(403).json({ error: 'You are not authorized to view sync history.' });
        }
        const logs = await prisma.integrationSyncLog.findMany({
            where: { scmIntegrationId: integrationId },
            orderBy: { startTime: 'desc' },
            take: 20, // Limit to the last 20 syncs
        });
        res.status(200).json(logs);
    } catch (error) {
        console.error(`Failed to fetch sync logs for integration ${integrationId}:`, error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// Helper to consolidate deletion permission logic
const canUserDeleteIntegration = async (user, integration) => {
    // Rule: The user who created the integration can delete it.
    if (integration.createdById === user.id) {
        return true;
    }

    // Rule: An admin of the attached resource can delete it.
    const resourceType = ['organization', 'company', 'team', 'project'].find(r => integration[`${r}Id`]);
    if (resourceType) {
        const resourceId = integration[`${resourceType}Id`];
        return await checkPermission(user, ['ADMIN'], resourceType, resourceId);
    }

    return false;
}

export default router; 
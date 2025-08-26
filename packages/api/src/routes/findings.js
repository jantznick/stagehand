// Security findings routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import { lookupExternalVulnerability } from '../utils/vulnerabilityLookup.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected and scoped to a project
router.use(protect);

/**
 * GET /api/v1/projects/:projectId/findings
 * Fetches all findings for a specific project.
 */
router.get('/:projectId/findings', async (req, res) => {
    const { projectId } = req.params;

    try {
        const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', projectId);
        if (!canView) {
            return res.status(403).json({ error: 'You are not authorized to view findings for this project.' });
        }

        const findings = await prisma.finding.findMany({
            where: { projectId },
            include: {
                vulnerability: true, // Include the full vulnerability details
            },
            orderBy: {
                lastSeenAt: 'desc',
            },
        });

        res.status(200).json(findings);
    } catch (error) {
        console.error(`Failed to fetch findings for project ${projectId}:`, error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

/**
 * POST /api/v1/projects/:projectId/findings
 * Creates a new manual finding for a project.
 */
router.post('/:projectId/findings', async (req, res) => {
    const { projectId } = req.params;
    const { vulnerabilityId, title, severity, description, remediation } = req.body;

    if (!vulnerabilityId || !title || !severity) {
        return res.status(400).json({ error: 'Missing required fields: vulnerabilityId, title, and severity are required.' });
    }

    try {
        const canCreate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
        if (!canCreate) {
            return res.status(403).json({ error: 'You are not authorized to create findings for this project.' });
        }

        const source = 'MANUAL';

        // Upsert the vulnerability. This ensures we have a canonical record for this manual entry.
        const vulnerability = await prisma.vulnerability.upsert({
            where: {
                vulnerabilityId_source: { vulnerabilityId, source },
            },
            update: {
                title,
                description: description || 'No description provided.',
                severity: severity.toUpperCase(),
                remediation,
            },
            create: {
                vulnerabilityId,
                source,
                title,
                description: description || 'No description provided.',
                severity: severity.toUpperCase(),
                remediation,
                type: vulnerabilityId.startsWith('CVE-') ? 'CVE' : 'CUSTOM',
            },
        });

        // Create the finding, linking the vulnerability to the project.
        const newFinding = await prisma.finding.create({
            data: {
                projectId,
                vulnerabilityId: vulnerability.vulnerabilityId,
                source,
                type: 'SCA', // Defaulting to SCA for manual, can be adjusted
                status: 'NEW',
                metadata: {
                    enteredBy: req.user.id,
                    entryDate: new Date().toISOString(),
                },
            },
            include: {
                vulnerability: true,
            },
        });

        res.status(201).json(newFinding);
    } catch (error) {
        console.error(`Failed to create manual finding for project ${projectId}:`, error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

export default router;
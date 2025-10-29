// DAST scan routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { createDastScanner } from '../utils/dastService.js';
import { hasPermission } from '../utils/permissions.js';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// All routes in this file are protected
router.use(protect);

/**
 * @route   POST /scans
 * @desc    Launch a new DAST scan for a project
 * @access  Private
 */
router.post('/scans', async (req, res) => {
    const { projectId } = req.params;
    const { targetUrl, scanType, provider = 'OWASP_ZAP' } = req.body;

    if (!targetUrl) {
        return res.status(400).json({ error: 'targetUrl is required.' });
    }

    const canScan = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canScan) {
        return res.status(403).json({ error: 'You do not have permission to launch scans for this project.' });
    }

    try {
        const scanner = await createDastScanner(provider);
        const scanResult = await scanner.launchScan({ projectId, targetUrl, scanType, initiatedById: req.user.id });
        res.status(202).json(scanResult);
    } catch (error) {
        console.error('DAST Scan Launch Error:', error);
        res.status(500).json({ error: `Failed to launch DAST scan: ${error.message}` });
    }
});

/**
 * @route   GET /scans
 * @desc    Get all DAST scan executions for a project
 * @access  Private
 */
router.get('/scans', async (req, res) => {
    const { projectId } = req.params;
    
    const scans = await prisma.scanExecution.findMany({
        where: {
            projectId: projectId
        },
        orderBy: {
            queuedAt: 'desc'
        }
    });

    res.status(200).json(scans);
});

export default router; 
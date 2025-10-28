// DAST scan routes - OpenAPI documentation moved to packages/api/src/openapi/

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');
const { launchDastScan } = require('../utils/dastService');
const { hasPermission } = require('../utils/permissions'); // Assuming a permissions utility exists

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });

/**
 * @route   POST /scans
 * @desc    Launch a new DAST scan for a project
 * @access  Private
 */
router.post('/scans', protect, async (req, res) => {
    const { projectId } = req.params;
    const { targetUrl } = req.body;

    if (!targetUrl) {
        return res.status(400).json({ error: 'targetUrl is required' });
    }

    try {
        const scan = await launchDastScan(projectId, targetUrl, req.user.id);
        res.status(202).json(scan);
    } catch (error) {
        console.error(`Error launching DAST scan for project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to launch DAST scan.' });
    }
});

/**
 * @route   GET /scans
 * @desc    Get all DAST scan executions for a project
 * @access  Private
 */
router.get('/scans', protect, async (req, res) => {
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

module.exports = router; 
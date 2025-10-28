import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import { triggerSastScan } from '../utils/sastService.js';

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });


/**
 * @route   POST /
 * @desc    Launch a new SAST scan for a project
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
    const { projectId } = req.params;

    try {
        // 1. Check permissions
        const canScan = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
        if (!canScan) {
            return res.status(403).json({ error: 'Access denied. You do not have permission to launch scans for this project.' });
        }

        // 2. Get project details to find the repository URL
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project || !project.repositoryUrl) {
            return res.status(404).json({ error: 'Project not found or repository URL is not configured.' });
        }

        // 3. Create a ScanExecution record
        const scanExecution = await prisma.scanExecution.create({
            data: {
                projectId: projectId,
                provider: 'Semgrep',
                targetUrl: project.repositoryUrl, // For SAST, targetUrl is the repo URL
                scanType: 'SAST', // A new type to distinguish from DAST
                status: 'QUEUED',
                queuedAt: new Date(),
                initiatedById: req.user.id
            }
        });

        // 4. Trigger the scanner service asynchronously
        await triggerSastScan(scanExecution.id, project.repositoryUrl);

        res.status(202).json({
            message: 'SAST scan successfully queued.',
            scanExecutionId: scanExecution.id,
        });

    } catch (error) {
        console.error(`[Project: ${projectId}] Failed to initiate SAST scan:`, error);
        res.status(500).json({ error: 'An unexpected error occurred while queueing the scan.' });
    }
});

/**
 * @route   GET /
 * @desc    Get all SAST scan executions for a project
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
    const { projectId } = req.params;
    
    // Permission check
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', projectId);
    if(!canView) {
        return res.status(403).json({ error: 'Access denied. You do not have permission to view scans for this project.' });
    }

    const scans = await prisma.scanExecution.findMany({
        where: {
            projectId: projectId,
            provider: 'Semgrep'
        },
        orderBy: {
            queuedAt: 'desc'
        }
    });

    res.status(200).json(scans);
});

export default router;

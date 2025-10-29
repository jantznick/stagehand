// Security findings routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// All routes in this file are protected
router.use(protect);

/**
 * @route   GET /
 * @desc    Get all findings for a project
 * @access  Private
 */
router.get('/', async (req, res) => {
    const { projectId } = req.params;

    const findings = await prisma.finding.findMany({
        where: {
            projectId: projectId,
        },
        include: {
            vulnerability: true
        },
        orderBy: {
            lastSeenAt: 'desc'
        }
    });

    res.json(findings);
});


export default router;
// Security findings routes - OpenAPI documentation moved to packages/api/src/openapi/

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');
const { hasPermission } = require('../utils/permissions'); // Assuming a permissions utility exists

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });

/**
 * @route   GET /
 * @desc    Get all findings for a project
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
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


module.exports = router;
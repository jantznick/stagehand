const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { protect } = require('../middleware/authMiddleware');
const { hasPermission } = require('../utils/permissions');

// GET /api/v1/projects/:projectId/findings
// Fetches all findings for a specific project
router.get('/:projectId/findings', protect, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    // Verify the user has at least READER permission on the project or its parents.
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', projectId);

    if (!canView) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to view findings for this project.' });
    }

    const findings = await prisma.finding.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        vulnerability: true, // Include details of the associated vulnerability
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    });

    res.json(findings);
  } catch (error) {
    console.error(`Error fetching findings for project ${projectId}:`, error);
    // Check if the error is due to the project not being found in the permissions check
    if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Project not found.' });
    }
    res.status(500).json({ error: 'An error occurred while fetching findings.' });
  }
});

module.exports = router; 
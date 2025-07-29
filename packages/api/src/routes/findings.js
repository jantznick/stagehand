// Security findings routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../utils/permissions.js';

const prisma = new PrismaClient();
const router = Router();

// GET /api/v1/projects/:projectId/findings
// Fetches all findings for a specific project
router.get('/:projectId/findings', protect, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    // Verify the user has at least READER permission on the project or its parents.
    const canView = await checkPermission(req.user, 'project:read', 'project', projectId);

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

export default router; 
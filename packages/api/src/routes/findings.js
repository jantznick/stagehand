// Security findings routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission, checkPermission } from '../utils/permissions.js';
import { lookupVulnerability, validateVulnerabilityId } from '../utils/vulnerabilityLookup.js';
import { API_ERROR_MESSAGES } from '../config/vulnerability-apis.js';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// All routes in this file are protected
router.use(protect);
// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

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

// POST /api/v1/projects/:projectId/findings/bulk-upload
// Initiates a bulk upload job for findings from a CSV file.
router.post('/:projectId/findings/bulk-upload', protect, upload.single('file'), async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    // Verify the user has ADMIN or EDITOR permission
    const canEdit = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canEdit) {
      return res.status(403).json({
        error: 'Access denied. You must be an ADMIN or EDITOR to perform bulk uploads.'
      });
    }

    // Create a new bulk upload job record in the database
    const job = await prisma.bulkUploadJob.create({
      data: {
        projectId,
        initiatedById: userId,
        originalFilename: req.file.originalname,
        storedFilepath: req.file.path,
        status: 'PENDING',
      },
    });

    res.status(202).json({
      message: 'File upload received. Processing has been initiated.',
      jobId: job.id,
    });

  } catch (error) {
    console.error(`Error initiating bulk upload for project ${projectId}:`, error);
    if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Project not found.' });
    }
    res.status(500).json({ error: 'An error occurred while initiating the bulk upload.' });
  }
});

// GET /api/v1/projects/findings/bulk-upload/:jobId
// Fetches the status of a bulk upload job.
router.get('/findings/bulk-upload/:jobId', protect, async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await prisma.bulkUploadJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    // Optional: Check if the user has permission to view the job's project
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', job.projectId);
    if (!canView) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(job);
  } catch (error) {
    console.error(`Error fetching job status for job ${jobId}:`, error);
    res.status(500).json({ error: 'An error occurred while fetching the job status.' });
  }
});

export default router;
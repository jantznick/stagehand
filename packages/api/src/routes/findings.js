// Security findings routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import { lookupVulnerability, validateVulnerabilityId } from '../utils/vulnerabilityLookup.js';
import { API_ERROR_MESSAGES } from '../config/vulnerability-apis.js';

const prisma = new PrismaClient();
const router = Router();

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

/**
 * POST /api/v1/projects/:projectId/findings
 * Create a manual finding for a project
 */
router.post('/:projectId/findings', protect, async (req, res) => {
  const { projectId } = req.params;
  const { vulnerabilityId, source = 'Manual Entry', status = 'NEW', metadata = {} } = req.body;

  try {
    // Verify the user has ADMIN or EDITOR permission
    const canEdit = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);

    if (!canEdit) {
      return res.status(403).json({
        error: 'Access denied. You must be an ADMIN or EDITOR to create findings.'
      });
    }

    let vulnerability;

    // If it's a CVE/GHSA ID, fetch from external source if not in database
    if (validateVulnerabilityId(vulnerabilityId)) {
      // Check if vulnerability exists in database
      vulnerability = await prisma.vulnerability.findUnique({
        where: {
          vulnerabilityId
        },
        select: {
          id: true,
          vulnerabilityId: true,
          title: true,
          description: true,
          type: true,
          severity: true,
          cvssScore: true,
          remediation: true,
          references: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!vulnerability) {
        // Lookup from external source and create in database
        const vulnData = await lookupVulnerability(vulnerabilityId);
        vulnerability = await prisma.vulnerability.create({
          data: vulnData
        });
      }
    } else {
      // For non-CVE/GHSA IDs, vulnerability must already exist in database
      // For non-CVE/GHSA IDs, the vulnerability must already exist in the database.
      // We find it by its unique vulnerabilityId.
      vulnerability = await prisma.vulnerability.findUnique({
        where: {
          vulnerabilityId
        }
      });

      if (!vulnerability) {
        return res.status(404).json({
          error: 'Vulnerability not found. For manual entries, vulnerability must exist in database.'
        });
      }
    }

    // Create the finding
    const finding = await prisma.finding.create({
      data: {
        projectId,
        source,
        status,
        vulnerabilityId: vulnerability.vulnerabilityId,
        metadata: {
          ...metadata,
          enteredBy: req.user.id,
          entryDate: new Date().toISOString()
        }
      },
      include: {
        vulnerability: true
      }
    });

    res.status(201).json(finding);

  } catch (error) {
    console.error('Error creating finding:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'A finding for this vulnerability already exists in this project.'
      });
    }

    if (error.message === API_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED) {
      return res.status(429).json({ error: error.message });
    }

    if (error.message === API_ERROR_MESSAGES.INVALID_CVE_FORMAT) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: 'An error occurred while creating the finding.'
    });
  }
});

export default router;
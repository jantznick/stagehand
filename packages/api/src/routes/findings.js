/**
 * @openapi
 * tags:
 *   - name: Security Findings
 *     description: Security vulnerability findings management
 * 
 * components:
 *   schemas:
 *     Vulnerability:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         cveId:
 *           type: string
 *           description: CVE identifier
 *         title:
 *           type: string
 *           description: Vulnerability title
 *         description:
 *           type: string
 *           description: Detailed vulnerability description
 *         severity:
 *           type: string
 *           enum: [CRITICAL, HIGH, MEDIUM, LOW, INFO]
 *           description: Vulnerability severity level
 *         cvssScore:
 *           type: number
 *           format: float
 *           description: CVSS score
 *         packageName:
 *           type: string
 *           description: Affected package name
 *         packageVersion:
 *           type: string
 *           description: Affected package version
 *         fixedVersion:
 *           type: string
 *           description: Version that fixes the vulnerability
 *         references:
 *           type: array
 *           items:
 *             type: string
 *           description: Reference URLs
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     FindingWithVulnerability:
 *       allOf:
 *         - $ref: '#/components/schemas/Finding'
 *         - type: object
 *           properties:
 *             vulnerability:
 *               $ref: '#/components/schemas/Vulnerability'
 */

/**
 * @openapi
 * /api/v1/projects/{projectId}/findings:
 *   get:
 *     summary: Get security findings for a project
 *     description: Retrieves all security vulnerability findings for a specific project
 *     tags: [Security Findings]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID to fetch findings for
 *     responses:
 *       200:
 *         description: List of security findings with vulnerability details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FindingWithVulnerability'
 *       403:
 *         description: Access denied - insufficient permissions to view findings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';

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

export default router; 
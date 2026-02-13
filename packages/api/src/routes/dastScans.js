// DAST scan routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission, hasPermission } from '../utils/permissions.js';
import { processDastScan, cancelDastScan, getDastScanStatus } from '../utils/scanProcessor.js';
import { getSupportedProviders, createDastScanner } from '../utils/dastService.js';
import { progressCache } from '../utils/progressCache.js';

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

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            company: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions - requires project:update permission to launch a scan
    const canLaunchScan = await checkPermission(req.user, 'project:update', 'project', projectId);
    if (!canLaunchScan) {
      return res.status(403).json({ error: 'Insufficient permissions to launch scans' });
    }

    // Validate provider
    const supportedProviders = getSupportedProviders();
    if (!supportedProviders.includes(provider)) {
      return res.status(400).json({ 
        error: `Unsupported provider: ${provider}. Supported providers: ${supportedProviders.join(', ')}` 
      });
    }

    // Check for concurrent scans on the same project
    const runningScan = await prisma.scanExecution.findFirst({
      where: {
        projectId: projectId,
        status: { in: ['PENDING', 'QUEUED', 'RUNNING'] }
      }
    });

    if (runningScan) {
      return res.status(409).json({ 
        error: 'A scan is already running for this project. Please wait for it to complete or cancel it first.',
        runningScanId: runningScan.id
      });
    }

    // Create scan execution record
    const scanExecution = await prisma.scanExecution.create({
      data: {
        projectId: projectId,
        provider: provider,
        targetUrl: targetUrl,
        scanType: scanType,
        status: 'PENDING',
        queuedAt: new Date(),
        toolConfig: scanConfig,
        initiatedById: userId
      },
      include: {
        project: { select: { name: true } },
        initiatedBy: { select: { email: true } }
      }
    });

    // Start background processing - don't await this
    processDastScan(scanExecution.id).catch(error => {
      console.error(`Background scan processing failed for ${scanExecution.id}:`, error);
    });

    console.log(`DAST scan ${scanExecution.id} launched for project ${project.name} by ${req.user.email}`);

    res.status(202).json({
      message: 'DAST scan launched successfully',
      scanExecutionId: scanExecution.id,
      scanExecution: {
        id: scanExecution.id,
        status: scanExecution.status,
        targetUrl: scanExecution.targetUrl,
        provider: scanExecution.provider,
        scanType: scanExecution.scanType,
        queuedAt: scanExecution.queuedAt,
        projectName: scanExecution.project.name,
        initiatedBy: scanExecution.initiatedBy?.email
      }
    });

  } catch (error) {
    console.error(`Failed to launch DAST scan for project ${projectId}:`, error);
    res.status(500).json({ error: 'Failed to launch DAST scan' });
  }
});



router.get('/:projectId/dast/scans', async (req, res) => {
  const { projectId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  try {
    // Check if project exists and user has permission
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            company: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions - any role can view scans
    const canView = await checkPermission(req.user, 'project:read', 'project', projectId);
    if (!canView) {
      return res.status(403).json({ error: 'Insufficient permissions to view scans' });
    }

    // Get scans with pagination
    const [scans, total] = await Promise.all([
      prisma.scanExecution.findMany({
        where: { projectId: projectId },
        include: {
          initiatedBy: { select: { email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.scanExecution.count({
        where: { projectId: projectId }
      })
    ]);

    res.json({
      scans: scans.map(scan => ({
        id: scan.id,
        status: scan.status,
        targetUrl: scan.targetUrl,
        provider: scan.provider,
        scanType: scan.scanType,
        queuedAt: scan.queuedAt,
        startedAt: scan.startedAt,
        completedAt: scan.completedAt,
        duration: scan.duration,
        findingsCount: scan.findingsCount,
        criticalCount: scan.criticalCount,
        highCount: scan.highCount,
        mediumCount: scan.mediumCount,
        lowCount: scan.lowCount,
        infoCount: scan.infoCount,
        errorMessage: scan.errorMessage,
        initiatedBy: scan.initiatedBy?.email,
        createdAt: scan.createdAt,
        updatedAt: scan.updatedAt
      })),
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error(`Failed to get DAST scans for project ${projectId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve DAST scans' });
  }
});

/**
 * @openapi
 * /api/v1/projects/{projectId}/dast/scans/{scanId}:
 *   get:
 *     summary: Get DAST scan details
 *     description: Retrieves detailed information about a specific DAST scan execution
 *     tags: [DAST Scans]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: scanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Scan execution ID
 *     responses:
 *       200:
 *         description: DAST scan details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScanExecution'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Scan not found
 */
router.get('/:projectId/dast/scans/:scanId', async (req, res) => {
  const { projectId, scanId } = req.params;

  try {
    // Check permissions
    const canView = await checkPermission(req.user, 'project:read', 'project', projectId);
    if (!canView) {
      return res.status(403).json({ error: 'Insufficient permissions to view scan details' });
    }

    // Get scan status (includes live status for running scans)
    const scanStatus = await getDastScanStatus(scanId);

    // Verify scan belongs to the project
    const scan = await prisma.scanExecution.findUnique({
      where: { id: scanId }
    });

    if (!scan || scan.projectId !== projectId) {
      return res.status(404).json({ error: 'Scan not found for this project' });
    }

    res.json(scanStatus);

  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    console.error(`Failed to get DAST scan details ${scanId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve scan details' });
  }
});

/**
 * @openapi
 * /api/v1/projects/{projectId}/dast/scans/{scanId}/details:
 *   get:
 *     summary: Get detailed DAST scan information
 *     description: Retrieves comprehensive scan details including crawled pages, statistics, and detailed findings
 *     tags: [DAST Scans]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: scanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Scan execution ID
 *     responses:
 *       200:
 *         description: Detailed scan information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scanDetails:
 *                   type: object
 *                   properties:
 *                     crawledPages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           site:
 *                             type: string
 *                           discoveredAt:
 *                             type: string
 *                             format: date-time
 *                     totalPagesCrawled:
 *                       type: integer
 *                     uniqueDomains:
 *                       type: array
 *                       items:
 *                         type: string
 *                     detailedAlerts:
 *                       type: array
 *                       items:
 *                         type: object
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project or scan not found
 */
router.get('/:projectId/dast/scans/:scanId/details', async (req, res) => {
  const { projectId, scanId } = req.params;

  try {
    // Check permissions
    const canView = await checkPermission(req.user, 'project:read', 'project', projectId);
    if (!canView) {
      return res.status(403).json({ error: 'Insufficient permissions to view scan details' });
    }

    // Get scan execution record
    const scan = await prisma.scanExecution.findUnique({
      where: { id: scanId },
      include: {
        project: { select: { name: true } },
        initiatedBy: { select: { email: true } }
      }
    });

    if (!scan || scan.projectId !== projectId) {
      return res.status(404).json({ error: 'Scan not found for this project' });
    }

    // Get detailed information from ZAP (for completed scans)
    let detailedInfo = null;
    if (scan.status === 'COMPLETED' && scan.toolMetadata?.zapScanId) {
      try {
        const scanner = await createDastScanner(scan.provider);
        detailedInfo = await scanner.getDetailedScanInfo(scan.toolMetadata.zapScanId, scan.targetUrl);
      } catch (error) {
        console.error(`Failed to get detailed scan info from ZAP for scan ${scanId}:`, error);
        // Continue without detailed ZAP info
      }
    }

    // Combine basic scan data with detailed information
    const response = {
      id: scan.id,
      status: scan.status,
      targetUrl: scan.targetUrl,
      provider: scan.provider,
      scanType: scan.scanType,
      projectName: scan.project.name,
      initiatedBy: scan.initiatedBy?.email,
      queuedAt: scan.queuedAt,
      startedAt: scan.startedAt,
      completedAt: scan.completedAt,
      duration: scan.duration,
      findingsCount: scan.findingsCount,
      criticalCount: scan.criticalCount,
      highCount: scan.highCount,
      mediumCount: scan.mediumCount,
      lowCount: scan.lowCount,
      infoCount: scan.infoCount,
      errorMessage: scan.errorMessage,
      toolConfig: scan.toolConfig,
      toolMetadata: scan.toolMetadata,
      createdAt: scan.createdAt,
      updatedAt: scan.updatedAt,
      // Include detailed ZAP information if available
      ...(detailedInfo && { scanDetails: detailedInfo.scanDetails })
    };

    res.json(response);

  } catch (error) {
    console.error(`Failed to get detailed scan information for ${scanId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve detailed scan information' });
  }
});

/**
 * @openapi
 * /api/v1/projects/{projectId}/dast/scans/{scanId}/progress:
 *   get:
 *     summary: Get DAST scan progress
 *     description: Get real-time progress information for a running DAST scan
 *     tags: [DAST Scans]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: path
 *         name: scanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Scan execution ID
 *     responses:
 *       200:
 *         description: Scan progress information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scanId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [PENDING, QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED]
 *                 progress:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 100
 *                 isActive:
 *                   type: boolean
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project or scan not found
 */
router.get('/:projectId/dast/scans/:scanId/progress', async (req, res) => {
  const { projectId, scanId } = req.params;

  try {
    // Check permissions
    const canView = await checkPermission(req.user, 'project:read', 'project', projectId);
    if (!canView) {
      return res.status(403).json({ error: 'Insufficient permissions to view scan progress' });
    }

    // Get scan execution record
    const scan = await prisma.scanExecution.findUnique({
      where: { id: scanId }
    });

    if (!scan || scan.projectId !== projectId) {
      return res.status(404).json({ error: 'Scan not found for this project' });
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
  
    try {
    // Check permissions
    const canView = await checkPermission(req.user, 'project:read', 'project', projectId);
    if (!canView) {
      return res.status(403).json({ error: 'Insufficient permissions to view scan progress' });
    }
    
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
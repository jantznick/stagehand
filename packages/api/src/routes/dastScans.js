/**
 * @openapi
 * tags:
 *   - name: DAST Scans
 *     description: Dynamic Application Security Testing scan management
 * 
 * components:
 *   schemas:
 *     ScanExecution:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         projectId:
 *           type: string
 *         provider:
 *           type: string
 *           enum: [OWASP_ZAP, BURP_SUITE, ACUNETIX]
 *         targetUrl:
 *           type: string
 *         scanType:
 *           type: string
 *           enum: [ACTIVE, PASSIVE, BASELINE, FULL, CUSTOM]
 *         status:
 *           type: string
 *           enum: [PENDING, QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED]
 *         progress:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         queuedAt:
 *           type: string
 *           format: date-time
 *         startedAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *         duration:
 *           type: integer
 *           description: Scan duration in seconds
 *         findingsCount:
 *           type: integer
 *         criticalCount:
 *           type: integer
 *         highCount:
 *           type: integer
 *         mediumCount:
 *           type: integer
 *         lowCount:
 *           type: integer
 *         infoCount:
 *           type: integer
 *         errorMessage:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     LaunchScanRequest:
 *       type: object
 *       required:
 *         - targetUrl
 *       properties:
 *         targetUrl:
 *           type: string
 *           format: uri
 *           description: The URL to scan
 *         provider:
 *           type: string
 *           enum: [OWASP_ZAP]
 *           default: OWASP_ZAP
 *           description: DAST tool provider
 *         scanType:
 *           type: string
 *           enum: [ACTIVE, PASSIVE, BASELINE]
 *           default: ACTIVE
 *           description: Type of scan to perform
 *         scanConfig:
 *           type: object
 *           description: Tool-specific scan configuration
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import { processDastScan, cancelDastScan, getDastScanStatus } from '../utils/scanProcessor.js';
import { getSupportedProviders, createDastScanner } from '../utils/dastService.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

/**
 * @openapi
 * /api/v1/projects/{projectId}/dast/scan:
 *   post:
 *     summary: Launch a DAST scan
 *     description: Launches a new DAST scan for the specified project with URL confirmation
 *     tags: [DAST Scans]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID to scan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LaunchScanRequest'
 *     responses:
 *       202:
 *         description: Scan launched successfully and running in background
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: DAST scan launched successfully
 *                 scanExecutionId:
 *                   type: string
 *                 scanExecution:
 *                   $ref: '#/components/schemas/ScanExecution'
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Insufficient permissions (requires ADMIN or EDITOR role)
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post('/:projectId/dast/scan', async (req, res) => {
  const { projectId } = req.params;
  const { targetUrl, provider = 'OWASP_ZAP', scanType = 'ACTIVE', scanConfig = {} } = req.body;
  const { id: userId } = req.user;

  try {
    // Validate required fields
    if (!targetUrl) {
      return res.status(400).json({ error: 'Target URL is required' });
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

    // Check permissions - requires ADMIN or EDITOR role
    const canLaunchScan = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
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

/**
 * @openapi
 * /api/v1/projects/{projectId}/dast/scans:
 *   get:
 *     summary: List DAST scans for a project
 *     description: Retrieves all DAST scan executions for the specified project
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of scans to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of scans to skip
 *     responses:
 *       200:
 *         description: List of DAST scans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scans:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScanExecution'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
 */
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
    const canView = await hasPermission(req.user, ['READER', 'EDITOR', 'ADMIN'], 'project', projectId);
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
 *         description: DAST scan details with live status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScanExecution'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project or scan not found
 */
router.get('/:projectId/dast/scans/:scanId', async (req, res) => {
  const { projectId, scanId } = req.params;

  try {
    // Check permissions
    const canView = await hasPermission(req.user, ['READER', 'EDITOR', 'ADMIN'], 'project', projectId);
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
    const canView = await hasPermission(req.user, ['READER', 'EDITOR', 'ADMIN'], 'project', projectId);
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
 * /api/v1/projects/{projectId}/dast/scans/{scanId}:
 *   delete:
 *     summary: Cancel a DAST scan
 *     description: Cancels a running DAST scan
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
 *         description: Scan cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Scan cancelled successfully
 *       400:
 *         description: Scan cannot be cancelled (already completed/failed)
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project or scan not found
 */
router.delete('/:projectId/dast/scans/:scanId', async (req, res) => {
  const { projectId, scanId } = req.params;

  try {
    // Check permissions - any role can cancel scans
    const canCancel = await hasPermission(req.user, ['READER', 'EDITOR', 'ADMIN'], 'project', projectId);
    if (!canCancel) {
      return res.status(403).json({ error: 'Insufficient permissions to cancel scans' });
    }

    // Verify scan belongs to the project
    const scan = await prisma.scanExecution.findUnique({
      where: { id: scanId }
    });

    if (!scan || scan.projectId !== projectId) {
      return res.status(404).json({ error: 'Scan not found for this project' });
    }

    // Check if scan can be cancelled
    if (!['PENDING', 'QUEUED', 'RUNNING'].includes(scan.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel scan in status: ${scan.status}`,
        currentStatus: scan.status
      });
    }

    // Cancel the scan
    const success = await cancelDastScan(scanId);

    if (success) {
      console.log(`DAST scan ${scanId} cancelled by ${req.user.email}`);
      res.json({ message: 'Scan cancelled successfully' });
    } else {
      res.status(500).json({ error: 'Failed to cancel scan' });
    }

  } catch (error) {
    console.error(`Failed to cancel DAST scan ${scanId}:`, error);
    res.status(500).json({ error: 'Failed to cancel scan' });
  }
});

/**
 * Test ZAP connectivity - DEBUG ENDPOINT
 * GET /api/v1/projects/:projectId/dast/test
 */
router.get('/:projectId/dast/test', async (req, res) => {
  try {
    console.log('Testing ZAP connectivity from API container...');
    
    const scanner = await createDastScanner('OWASP_ZAP');
    
    // Test 1: Direct ZAP API call (bypass isAvailable method)
    console.log('Testing direct ZAP API call...');
    let directApiResult;
    try {
      directApiResult = await scanner.zapApiRequest('/JSON/core/view/version/');
      console.log('Direct API result:', directApiResult);
    } catch (directError) {
      console.error('Direct API call failed:', directError);
      return res.json({ 
        error: 'Direct ZAP API call failed: ' + directError.message,
        tests: { directApi: false }
      });
    }
    
    // Test 2: Check if ZAP is available using method
    const isAvailable = await scanner.isAvailable();
    console.log('ZAP availability:', isAvailable);
    
    // Test 2: Access a URL
    console.log('Testing URL access...');
    const accessResult = await scanner.zapApiRequest('/JSON/core/action/accessUrl/', {
      url: 'http://httpbin.org/get'
    });
    console.log('Access result:', accessResult);
    
    // Test 3: Start a scan
    console.log('Testing scan start...');
    const scanResult = await scanner.zapApiRequest('/JSON/ascan/action/scan/', {
      url: 'http://httpbin.org/get'
    });
    console.log('Scan result:', scanResult);
    
    const scanId = scanResult.scan;
    
    // Test 4: Check scan status immediately
    console.log('Testing immediate status check...');
    const statusResult = await scanner.zapApiRequest('/JSON/ascan/view/status/', {
      scanId: scanId
    });
    console.log('Status result:', statusResult);
    
    // Test 5: Wait a bit and check again
    console.log('Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const statusResult2 = await scanner.zapApiRequest('/JSON/ascan/view/status/', {
      scanId: scanId
    });
    console.log('Status result after wait:', statusResult2);
    
    res.json({
      success: true,
      tests: {
        directApi: !!directApiResult,
        availability: isAvailable,
        access: !!accessResult,
        scanStart: !!scanResult,
        scanId: scanId,
        immediateStatus: statusResult,
        delayedStatus: statusResult2
      }
    });
    
  } catch (error) {
    console.error('ZAP test failed:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

export default router; 
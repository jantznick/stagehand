// DAST scan routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../utils/permissions.js';
import { DastService } from '../utils/dastService.js';
import { getDescendants } from '../utils/hierarchy.js';
import { progressCache } from '../utils/progressCache.js';
import { processDastScan, cancelDastScan, getDastScanStatus } from '../utils/scanProcessor.js';
import { getSupportedProviders, createDastScanner } from '../utils/dastService.js';


const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

// Launch a new DAST scan
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
  
      const project = await prisma.project.findUnique({ where: { id: projectId } });
  
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
  
      // Authorization check: User needs at least EDITOR access to the project to launch a scan.
      const canLaunchScan = await checkPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
      if (!canLaunchScan) {
          return res.status(403).json({ error: 'You are not authorized to launch scans for this project.' });
      }
  
      const supportedProviders = getSupportedProviders();
      if (!supportedProviders.includes(provider)) {
        return res.status(400).json({ 
          error: `Unsupported provider: ${provider}. Supported providers: ${supportedProviders.join(', ')}` 
        });
      }
  
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

// GET /api/v1/dast-scans/by-project/:projectId
router.get('/by-project/:projectId', async (req, res) => {
    const { projectId } = req.params;

    // Authorization check
    const canView = await checkPermission(req.user, ['READER', 'EDITOR', 'ADMIN'], 'project', projectId);
    if (!canView) {
        return res.status(403).json({ error: 'You do not have permission to view these scans.' });
    }

    try {
        const scans = await DastService.getScansByProject(projectId);
        return res.status(200).json(scans);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Internal server error' });
    }
});

// GET /api/v1/dast-scans/by-resource
router.get('/by-resource', async (req, res) => {
    const { resourceType, resourceId } = req.query;

    if (!resourceType || !resourceId) {
        return res.status(400).json({ error: 'resourceType and resourceId query parameters are required.' });
    }

    // Authorization check
    const canView = await checkPermission(req.user, ['READER', 'EDITOR', 'ADMIN'], resourceType, resourceId);
    if (!canView) {
        return res.status(403).json({ error: 'You do not have permission to view scans for this resource.' });
    }

    try {
        const descendantIds = await getDescendants(resourceType, resourceId);
        let projectIds = descendantIds.projectIds || [];

        if (resourceType === 'project') {
            projectIds.push(resourceId);
        }

        const scans = await DastService.getScansByProjects(projectIds);
        res.status(200).json(scans);

    } catch (error) {
        console.error('Get scans by resource error:', error);
        res.status(500).json({ error: 'Failed to retrieve scans.' });
    }
});

// GET /api/v1/dast-scans/:scanId
router.get('/:scanId', async (req, res) => {
    const { scanId } = req.params;

    try {
        const scan = await DastService.getScan(scanId);
        if (!scan) {
            return res.status(404).json({ error: 'Scan not found.' });
        }

        // Authorization check
        const canView = await checkPermission(req.user, ['READER', 'EDITOR', 'ADMIN'], 'project', scan.projectId);
        if (!canView) {
            return res.status(403).json({ error: 'You do not have permission to view this scan.' });
        }

        res.json(scan);

    } catch (error) {
        console.error(`Get scan error for scanId ${scanId}:`, error);
        res.status(500).json({ error: 'Failed to get scan.' });
    }
});

// GET /api/v1/dast-scans/:scanId/report
router.get('/:scanId/report', async (req, res) => {
    const { scanId } = req.params;
    const { format = 'json' } = req.query; // Default to JSON format

    try {
        const scan = await DastService.getScan(scanId);
        if (!scan) {
            return res.status(404).json({ error: 'Scan not found.' });
        }

        // Authorization check
        const canView = await checkPermission(req.user, ['READER', 'EDITOR', 'ADMIN'], 'project', scan.projectId);
        if (!canView) {
            return res.status(403).json({ error: 'You do not have permission to view this report.' });
        }

        const report = await DastService.getScanReport(scanId, format);
        if (!report) {
            return res.status(404).json({ error: 'Report not found or not yet available.' });
        }

        if (format === 'json') {
            res.json(report);
        } else if (format === 'html') {
            res.setHeader('Content-Type', 'text/html');
            res.send(report);
        } else {
            return res.status(400).json({ error: 'Invalid report format.' });
        }

    } catch (error) {
        console.error(`Get scan report error for scanId ${scanId}:`, error);
        res.status(500).json({ error: 'Failed to get scan report.' });
    }
});

// POST /api/v1/dast-scans/:scanId/cancel
router.post('/:scanId/cancel', async (req, res) => {
    const { scanId } = req.params;

    try {
        const scan = await DastService.getScan(scanId);
        if (!scan) {
            return res.status(404).json({ error: 'Scan not found.' });
        }

        // Authorization check
        const canCancel = await checkPermission(req.user, ['ADMIN', 'EDITOR'], 'project', scan.projectId);
        if (!canCancel) {
            return res.status(403).json({ error: 'You do not have permission to cancel this scan.' });
        }

        const result = await DastService.cancelScan(scanId);
        res.status(200).json(result);

    } catch (error) {
        console.error(`Cancel scan error for scanId ${scanId}:`, error);
        res.status(500).json({ error: 'Failed to cancel scan.' });
    }
});

export default router; 
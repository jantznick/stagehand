import { PrismaClient } from '@prisma/client';
import { createDastScanner } from './dastService.js';

const prisma = new PrismaClient();

/**
 * Process a DAST scan in the background
 * @param {string} scanExecutionId - The scan execution ID from database
 */
export const processDastScan = async (scanExecutionId) => {
  let scanExecution;
  
  try {
    // Get the scan execution record
    scanExecution = await prisma.scanExecution.findUnique({
      where: { id: scanExecutionId },
      include: { 
        project: true,
        securityToolIntegration: true 
      }
    });

    if (!scanExecution) {
      throw new Error(`Scan execution ${scanExecutionId} not found`);
    }

    console.log(`Processing DAST scan ${scanExecutionId} for project ${scanExecution.project.name}`);

    // Update status to running
    await prisma.scanExecution.update({
      where: { id: scanExecutionId },
      data: { 
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    // Create scanner instance
    const scanner = await createDastScanner(scanExecution.provider, {
      securityToolIntegration: scanExecution.securityToolIntegration
    });

    // Start the scan
    const scanResult = await scanner.startScan(
      scanExecution.targetUrl, 
      scanExecution.toolConfig || {}
    );

    // Update with tool metadata
    await prisma.scanExecution.update({
      where: { id: scanExecutionId },
      data: { 
        toolMetadata: scanResult.toolMetadata || {}
      }
    });

    // Wait fixed time for scan to complete (ZAP scans are typically quick)
    console.log(`Waiting 60 seconds for ZAP scan to complete...`);
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Get scan results regardless of polling status
    const scanResults = await scanner.getScanResults(scanResult.scanId, scanExecution.targetUrl);
    
    // Only process findings if we have valid results
    if (scanResults && scanResults.findings && Array.isArray(scanResults.findings)) {
      await processScanFindings(scanExecutionId, scanResults.findings, scanExecution.provider);
    } else {
      console.warn(`No valid findings returned for scan ${scanExecutionId}`);
    }

    // Update scan execution with final results
    await prisma.scanExecution.update({
      where: { id: scanExecutionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        duration: scanResults.duration || calculateDuration(scanExecution.startedAt),
        findingsCount: scanResults.findingsCount,
        criticalCount: scanResults.criticalCount,
        highCount: scanResults.highCount,
        mediumCount: scanResults.mediumCount,
        lowCount: scanResults.lowCount,
        infoCount: scanResults.infoCount
      }
    });

    // Update project's last scan date
    await prisma.project.update({
      where: { id: scanExecution.projectId },
      data: { lastDastScanDate: new Date() }
    });

    console.log(`DAST scan ${scanExecutionId} completed successfully with ${scanResults.findingsCount} findings`);

  } catch (error) {
    console.error(`DAST scan ${scanExecutionId} failed:`, error);

    // Update scan execution with error
    if (scanExecution) {
      await prisma.scanExecution.update({
        where: { id: scanExecutionId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
          duration: scanExecution.startedAt ? calculateDuration(scanExecution.startedAt) : null
        }
      });
    }

    throw error;
  }
};

/**
 * Ensure DAST finding has a URL, using fallback if necessary
 * Only applies to DAST scans - other scan types (SAST, SCA) don't need URLs
 * @param {object} finding - The finding object
 * @param {string} scanTargetUrl - The target URL from the scan
 * @param {string} provider - The scanner provider
 * @returns {object} - Finding with URL for DAST scans
 */
const ensureFindingHasUrl = (finding, scanTargetUrl, provider) => {
  // Only apply URLs for DAST providers
  const isDastProvider = ['OWASP_ZAP', 'BURP_SUITE', 'ACUNETIX'].includes(provider?.toUpperCase());
  
  if (!isDastProvider) {
    return finding; // Don't add URLs for non-DAST findings
  }

  if (finding.url) {
    return finding; // Already has a URL
  }

  // Extract URL from metadata if available
  let urlFromMetadata = null;
  if (finding.metadata?.url) {
    urlFromMetadata = finding.metadata.url;
  }

  return {
    ...finding,
    url: urlFromMetadata || scanTargetUrl || null
  };
};

/**
 * Process scan findings and convert to Vulnerability/Finding records
 * @param {string} scanExecutionId - The scan execution ID
 * @param {array} findings - Array of findings from the scanner
 * @param {string} provider - Scanner provider name
 */
export const processScanFindings = async (scanExecutionId, findings, provider) => {
  // Validate inputs
  if (!findings || !Array.isArray(findings)) {
    console.warn(`Invalid findings array for scan ${scanExecutionId}:`, findings);
    return 0;
  }

  console.log(`Processing ${findings.length} findings for scan ${scanExecutionId}`);

  const scanExecution = await prisma.scanExecution.findUnique({
    where: { id: scanExecutionId },
    select: { projectId: true, targetUrl: true }
  });

  if (!scanExecution) {
    throw new Error(`Scan execution ${scanExecutionId} not found`);
  }

  const { projectId, targetUrl } = scanExecution;
  let processedCount = 0;

  for (const rawFinding of findings) {
    try {
      // Validate the finding has required properties
      if (!rawFinding || typeof rawFinding !== 'object') {
        console.warn(`Skipping invalid finding:`, rawFinding);
        continue;
      }

      if (!rawFinding.vulnerabilityId || !rawFinding.title) {
        console.warn(`Skipping finding with missing required properties:`, rawFinding);
        continue;
      }

      // Ensure DAST finding has a URL (only for DAST providers)
      const finding = ensureFindingHasUrl(rawFinding, targetUrl, provider);

      // Map provider to vulnerability source and type
      const vulnerabilitySource = mapProviderToSource(provider);
      const vulnerabilityType = mapProviderToType(provider);
      
      // Create or update vulnerability record
      const vulnerability = await prisma.vulnerability.upsert({
        where: {
          vulnerabilityId_source: {
            vulnerabilityId: finding.vulnerabilityId,
            source: vulnerabilitySource
          }
        },
        update: {
          title: finding.title,
          description: finding.description,
          severity: finding.severity,
          type: vulnerabilityType,
          remediation: finding.solution || null,
          references: finding.reference ? { urls: [finding.reference] } : null
        },
        create: {
          vulnerabilityId: finding.vulnerabilityId,
          source: vulnerabilitySource,
          type: vulnerabilityType,
          title: finding.title,
          description: finding.description,
          severity: finding.severity,
          remediation: finding.solution || null,
          references: finding.reference ? { urls: [finding.reference] } : null
        }
      });

      // Create or update finding record
      await prisma.finding.upsert({
        where: {
          projectId_vulnerabilityId_source: {
            projectId: projectId,
            vulnerabilityId: vulnerability.vulnerabilityId,
            source: vulnerability.source
          }
        },
        update: {
          status: 'NEW', // Reset status for new scan results
          lastSeenAt: new Date(),
          url: finding.url || null,
          metadata: {
            scanExecutionId: scanExecutionId,
            provider: provider,
            confidence: finding.confidence,
            ...finding.metadata
          }
        },
        create: {
          projectId: projectId,
          vulnerabilityId: vulnerability.vulnerabilityId,
          source: vulnerability.source,
          status: 'NEW',
          url: finding.url || null,
          metadata: {
            scanExecutionId: scanExecutionId,
            provider: provider,
            confidence: finding.confidence,
            ...finding.metadata
          }
        }
      });

      processedCount++;

    } catch (error) {
      console.error(`Failed to process finding ${rawFinding?.vulnerabilityId || 'unknown'}:`, error);
      // Continue processing other findings
    }
  }

  console.log(`Successfully processed ${processedCount}/${findings.length} findings`);
  return processedCount;
};

/**
 * Cancel a running DAST scan
 * @param {string} scanExecutionId - The scan execution ID
 * @returns {Promise<boolean>} - Success status
 */
export const cancelDastScan = async (scanExecutionId) => {
  try {
    const scanExecution = await prisma.scanExecution.findUnique({
      where: { id: scanExecutionId },
      include: { securityToolIntegration: true }
    });

    if (!scanExecution) {
      throw new Error(`Scan execution ${scanExecutionId} not found`);
    }

    if (!['PENDING', 'QUEUED', 'RUNNING'].includes(scanExecution.status)) {
      throw new Error(`Cannot cancel scan in status: ${scanExecution.status}`);
    }

    // Create scanner instance and cancel the scan
    const scanner = await createDastScanner(scanExecution.provider, {
      securityToolIntegration: scanExecution.securityToolIntegration
    });

    const toolScanId = scanExecution.toolMetadata?.zapScanId || scanExecution.toolMetadata?.scanId;
    if (toolScanId) {
      await scanner.cancelScan(toolScanId);
    }

    // Update scan execution status
    await prisma.scanExecution.update({
      where: { id: scanExecutionId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
        duration: scanExecution.startedAt ? calculateDuration(scanExecution.startedAt) : null
      }
    });

    console.log(`DAST scan ${scanExecutionId} cancelled successfully`);
    return true;

  } catch (error) {
    console.error(`Failed to cancel DAST scan ${scanExecutionId}:`, error);
    return false;
  }
};

/**
 * Get the status of a DAST scan
 * @param {string} scanExecutionId - The scan execution ID
 * @returns {Promise<object>} - Scan status information
 */
export const getDastScanStatus = async (scanExecutionId) => {
  const scanExecution = await prisma.scanExecution.findUnique({
    where: { id: scanExecutionId },
    include: {
      project: { select: { name: true } },
      initiatedBy: { select: { email: true } }
    }
  });

  if (!scanExecution) {
    throw new Error(`Scan execution ${scanExecutionId} not found`);
  }

  return {
    id: scanExecution.id,
    status: scanExecution.status,
    targetUrl: scanExecution.targetUrl,
    provider: scanExecution.provider,
    projectName: scanExecution.project.name,
    initiatedBy: scanExecution.initiatedBy?.email,
    queuedAt: scanExecution.queuedAt,
    startedAt: scanExecution.startedAt,
    completedAt: scanExecution.completedAt,
    duration: scanExecution.duration,
    findingsCount: scanExecution.findingsCount,
    criticalCount: scanExecution.criticalCount,
    highCount: scanExecution.highCount,
    mediumCount: scanExecution.mediumCount,
    lowCount: scanExecution.lowCount,
    infoCount: scanExecution.infoCount,
    errorMessage: scanExecution.errorMessage
  };
};

/**
 * Map scanner provider to descriptive source string
 * @param {string} provider - Scanner provider name
 * @returns {string} - Descriptive source string
 */
const mapProviderToSource = (provider) => {
  const sourceMap = {
    'OWASP_ZAP': 'Stagehand DAST (OWASP ZAP)',
    'BURP_SUITE': 'Stagehand DAST (Burp Suite)',
    'ACUNETIX': 'Stagehand DAST (Acunetix)'
  };

  return sourceMap[provider.toUpperCase()] || 'Manual';
};

/**
 * Map scanner provider to SecurityToolType enum
 * @param {string} provider - Scanner provider name
 * @returns {string} - SecurityToolType enum value
 */
const mapProviderToType = (provider) => {
  const typeMap = {
    'OWASP_ZAP': 'DAST',
    'BURP_SUITE': 'DAST', 
    'ACUNETIX': 'DAST'
  };

  return typeMap[provider.toUpperCase()] || null;
};

/**
 * Calculate scan duration in seconds
 * @param {Date} startTime - Scan start time
 * @returns {number} - Duration in seconds
 */
const calculateDuration = (startTime) => {
  if (!startTime) return null;
  return Math.floor((new Date() - new Date(startTime)) / 1000);
}; 
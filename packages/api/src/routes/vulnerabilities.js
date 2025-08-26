import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { lookupVulnerability, searchVulnerabilities, validateVulnerabilityId } from '../utils/vulnerabilityLookup.js';
import { API_ERROR_MESSAGES } from '../config/vulnerability-apis.js';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/v1/vulnerabilities/search
 * Search for vulnerabilities in database and external sources
 */
router.get('/search', protect, async (req, res) => {
  const { q: query } = req.query;

  if (!query || query.length < 3) {
    return res.status(400).json({
      error: 'Search query must be at least 3 characters long'
    });
  }

  try {
    // First search in local database
    const dbVulnerabilities = await prisma.vulnerability.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { vulnerabilityId: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
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
      },
      take: 10
    });
    console.log('Found vulnerabilities in DB:', dbVulnerabilities);

    // If we have enough results from DB, return them
    if (dbVulnerabilities.length >= 5) {
      return res.json({ vulnerabilities: dbVulnerabilities });
    }

    // Otherwise, also search external sources
    const externalVulnerabilities = await searchVulnerabilities(query);
    
    console.log('Found vulnerabilities in external sources:', externalVulnerabilities);
    // Combine and deduplicate results
    const allVulnerabilities = [...dbVulnerabilities];
    for (const extVuln of externalVulnerabilities) {
      if (!allVulnerabilities.some(v => v.vulnerabilityId === extVuln.vulnerabilityId)) {
        allVulnerabilities.push(extVuln);
      }
    }

    // Return combined results, limited to 10
    res.json({
      vulnerabilities: allVulnerabilities.slice(0, 10)
    });

  } catch (error) {
    console.error('Error searching vulnerabilities:', error);
    res.status(500).json({
      error: 'An error occurred while searching vulnerabilities'
    });
  }
});

/**
 * GET /api/v1/vulnerabilities/external/:id
 * Lookup vulnerability from external sources by CVE/GHSA ID
 */
router.get('/external/:id', protect, async (req, res) => {
  const { id } = req.params;

  if (!validateVulnerabilityId(id)) {
    return res.status(400).json({
      error: API_ERROR_MESSAGES.INVALID_CVE_FORMAT
    });
  }

  try {
    // Check if vulnerability already exists in database
    const existingVuln = await prisma.vulnerability.findUnique({
      where: {
        vulnerabilityId: id
      }
    });

    if (existingVuln) {
      return res.json(existingVuln);
    }

    // Lookup from external sources
    const vulnerability = await lookupVulnerability(id);

    // Store in database for future use
    const storedVuln = await prisma.vulnerability.create({
      data: vulnerability
    });

    res.json(storedVuln);

  } catch (error) {
    console.error('Error looking up vulnerability:', error);
    
    // Handle specific error cases
    if (error.message === API_ERROR_MESSAGES.RATE_LIMIT_EXCEEDED) {
      return res.status(429).json({ error: error.message });
    }
    
    if (error.message === API_ERROR_MESSAGES.INVALID_CVE_FORMAT) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: error.message || 'An error occurred while looking up the vulnerability'
    });
  }
});

export default router;
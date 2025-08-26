import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { lookupExternalVulnerability, searchVulnerabilities } from '../utils/vulnerabilityLookup.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

/**
 * GET /api/v1/vulnerabilities/search
 * Search for vulnerabilities in the local database.
 */
router.get('/search', async (req, res) => {
    const { q: query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'A search query "q" is required.' });
    }

    try {
        // A basic permission check to ensure the user is part of an organization
        const canSearch = req.user.memberships && req.user.memberships.length > 0;
        if (!canSearch) {
            return res.status(403).json({ error: 'You are not authorized to search for vulnerabilities.' });
        }

        const results = await prisma.vulnerability.findMany({
            where: {
                OR: [
                    { vulnerabilityId: { contains: query, mode: 'insensitive' } },
                    { title: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 20,
        });

        res.status(200).json({ vulnerabilities: results });
    } catch (error) {
        console.error('Vulnerability search failed:', error);
        res.status(500).json({ error: 'An internal server error occurred during vulnerability search.' });
    }
});

/**
 * GET /api/v1/vulnerabilities/external/{cveId}
 * Fetch vulnerability details from external sources like NVD.
 */
router.get('/external/:cveId', async (req, res) => {
    const { cveId } = req.params;

    try {
        const canSearch = req.user.memberships && req.user.memberships.length > 0;
        if (!canSearch) {
            return res.status(403).json({ error: 'You are not authorized to look up external vulnerabilities.' });
        }

        const vulnerability = await lookupExternalVulnerability(cveId);

        if (!vulnerability) {
            return res.status(404).json({ error: `Vulnerability with ID ${cveId} not found in external databases.` });
        }

        res.status(200).json(vulnerability);
    } catch (error) {
        console.error(`External vulnerability lookup for ${cveId} failed:`, error);
        if (error.message.includes('Invalid CVE')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'An internal server error occurred during the external lookup.' });
    }
});

export default router;
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { isSuperAdmin } from '../middleware/adminAuth.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected and require super admin privileges
router.use(protect, isSuperAdmin);

// GET /api/v1/admin/organizations - List all organizations
router.get('/organizations', async (req, res) => {
    try {
        const organizations = await prisma.organization.findMany({
            select: {
                id: true,
                name: true,
                hostname: true,
                plan: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                features: {
                    select: {
                        status: true,
                        feature: {
                            select: {
                                id: true,
                                key: true
                            }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(organizations);
    } catch (error) {
        console.error('Admin: Failed to get organizations:', error);
        res.status(500).json({ error: 'Failed to retrieve organizations.' });
    }
});

// GET /api/v1/admin/features - List all available features
router.get('/features', async (req, res) => {
    try {
        const features = await prisma.feature.findMany({
            orderBy: { key: 'asc' }
        });
        res.json(features);
    } catch (error) {
        console.error('Admin: Failed to get features:', error);
        res.status(500).json({ error: 'Failed to retrieve features.' });
    }
});

// GET /api/v1/admin/organizations/:orgId/features - Get feature statuses for a specific org
router.get('/organizations/:orgId/features', async (req, res) => {
    const { orgId } = req.params;
    try {
        const orgFeatures = await prisma.organizationFeature.findMany({
            where: { organizationId: orgId },
            include: { feature: true }
        });
        res.json(orgFeatures);
    } catch (error) {
        console.error(`Admin: Failed to get features for org ${orgId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve organization features.' });
    }
});

// PUT /api/v1/admin/organizations/:orgId/features - Update feature statuses for an org
router.put('/organizations/:orgId/features', async (req, res) => {
    const { orgId } = req.params;
    const { features } = req.body; // Expects an array of { featureId, status }

    if (!Array.isArray(features)) {
        return res.status(400).json({ error: 'A "features" array is required.' });
    }

    // Validate each feature update
    for (const feature of features) {
        if (!feature.featureId || !['ACTIVE', 'DISABLED', 'PROMO'].includes(feature.status)) {
            return res.status(400).json({ error: `Invalid feature update provided: ${JSON.stringify(feature)}` });
        }
    }

    try {
        const updatePromises = features.map(feature => 
            prisma.organizationFeature.upsert({
                where: {
                    organizationId_featureId: {
                        organizationId: orgId,
                        featureId: feature.featureId,
                    }
                },
                update: { status: feature.status },
                create: {
                    organizationId: orgId,
                    featureId: feature.featureId,
                    status: feature.status,
                }
            })
        );

        // Execute all updates in a single transaction
        await prisma.$transaction(updatePromises);
        
        res.status(200).json({ message: 'Features updated successfully.' });
    } catch (error) {
        console.error(`Admin: Failed to update features for org ${orgId}:`, error);
        res.status(500).json({ error: 'Failed to update organization features.' });
    }
});

export default router;

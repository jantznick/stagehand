// Company routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { promises as dns } from 'dns';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission, getVisibleResourceIdsV2 } from '../utils/permissions.js';
import { getAncestors, getDescendants } from '../utils/hierarchy.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

// GET /api/v1/companies/:id - Get a single company
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    // Authorization: User must have at least READER access to the company
    const canView = await checkPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'company', id);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this company.' });
    }

    try {
        const company = await prisma.company.findUnique({
            where: { id },
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found.' });
        }

        res.status(200).json(company);

    } catch (error) {
        console.error('Get company error:', error);
        res.status(500).json({ error: 'Failed to get company.' });
    }
});

// GET /api/v1/companies - List all companies a user has access to
router.get('/', async (req, res) => {
    try {
        const visibleCompanyIds = await getVisibleResourceIdsV2(req.user, 'company');
        const companies = await prisma.company.findMany({
            where: { id: { in: visibleCompanyIds } }
        });
        res.status(200).json(companies);
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ error: 'Failed to retrieve companies.' });
    }
});

// POST /api/v1/companies - Create a new company
router.post('/', async (req, res) => {
    const { name, description, organizationId } = req.body;

    // Authorization: User must be an ADMIN of the parent organization.
    const canCreate = await checkPermission(req.user, 'ADMIN', 'organization', organizationId);
    if (!canCreate) {
        return res.status(403).json({ error: 'You must be an Organization Admin to create a company.' });
    }

    try {
        // Create the new company
        const newCompany = await prisma.company.create({
            data: {
                name,
                description,
                organizationId,
            }
        });

        res.status(201).json(newCompany);

    } catch (error) {
        // Handle potential errors, e.g., if the organizationId doesn't exist
        if (error.code === 'P2003') { // Foreign key constraint failed
             return res.status(400).json({ error: 'The specified organization does not exist.' });
        }
        console.error('Create company error:', error);
        res.status(500).json({ error: 'Failed to create company.' });
    }
});

// PUT /api/v1/companies/:id/settings - Update company settings (name, etc.)
router.put('/:id/settings', async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    // Authorization: User must be an ADMIN of the company.
    const canManage = await checkPermission(req.user, 'ADMIN', 'company', id);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage this company.' });
    }

    try {
        const company = await prisma.company.findUnique({ where: { id } });
        if (!company) {
            return res.status(404).json({ error: 'Company not found.' });
        }

        const updatedCompany = await prisma.company.update({
            where: { id },
            data: { name, description }
        });
        res.status(200).json(updatedCompany);
    } catch (error) {
        console.error('Update company settings error:', error);
        res.status(500).json({ error: 'Failed to update company settings.' });
    }
});

// --- Domain Management ---

// GET /api/v1/companies/:companyId/domains - Get all auto-join domains for a company
router.get('/:companyId/domains', async (req, res) => {
    const { companyId } = req.params;

    const canManage = await checkPermission(req.user, 'ADMIN', 'company', companyId);
     if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage this company.' });
    }

    try {
        // Authorization Check: User must be a member of the hierarchy to view its domains.
        const ancestors = await getAncestors('company', companyId);
        const descendants = await getDescendants('company', companyId);

        const resourceTreeIds = {
            organizationIds: [ancestors.organizationId].filter(Boolean),
            companyIds: [companyId, ...Object.values(ancestors).filter(Boolean)],
            teamIds: descendants.teamIds,
            projectIds: descendants.projectIds,
        };
        
        const userMembership = await prisma.membership.findFirst({
            where: {
                userId: req.user.id,
                OR: [
                    { organizationId: { in: resourceTreeIds.organizationIds } },
                    { companyId: { in: resourceTreeIds.companyIds } },
                    { teamId: { in: resourceTreeIds.teamIds } },
                    { projectId: { in: resourceTreeIds.projectIds } },
                ]
            }
        });

        if (!userMembership) {
            return res.status(403).json({ error: 'You are not authorized to view domains for this company.' });
        }

        const domains = await prisma.autoJoinDomain.findMany({
            where: { companyId: companyId },
            orderBy: { domain: 'asc' }
        });
        res.json(domains);
    } catch (error) {
        console.error('Get domains error:', error);
        res.status(500).json({ error: 'Failed to get domains.' });
    }
});

// POST /api/v1/companies/:companyId/domains - Add an auto-join domain
router.post('/:companyId/domains', async (req, res) => {
    const { companyId } = req.params;
    const { domain, role } = req.body;

    const canManage = await checkPermission(req.user, 'ADMIN', 'company', companyId);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage this company.' });
    }

    if (PUBLIC_DOMAINS.has(domain.toLowerCase())) {
        return res.status(400).json({ error: 'Public email domains cannot be used for auto-join.' });
    }

    try {
        // Verify the company exists
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return res.status(404).json({ error: 'Company not found.' });
        }

        const newDomain = await prisma.autoJoinDomain.create({
            data: {
                domain: domain.toLowerCase(),
                role,
                companyId: companyId,
                verificationCode: crypto.randomBytes(16).toString('hex'),
                status: 'PENDING'
            }
        });
        res.status(201).json(newDomain);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'This domain has already been added to this company.' });
        }
        console.error('Add domain error:', error);
        res.status(500).json({ error: 'Failed to add domain.' });
    }
});

// POST /api/v1/companies/:id/domains/:domainMappingId/verify - Verify a domain via DNS
router.post('/:id/domains/:domainMappingId/verify', async (req, res) => {
    const { id: companyId, domainMappingId } = req.params;

    const canManage = await checkPermission(req.user, 'ADMIN', 'company', companyId);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage domains for this company.' });
    }

    try {
        const domainMapping = await prisma.autoJoinDomain.findUnique({
            where: { id: domainMappingId }
        });

        if (!domainMapping || domainMapping.companyId !== companyId) {
            return res.status(404).json({ error: 'Domain mapping not found.' });
        }

        const expectedRecord = `stagehand-verification=${domainMapping.verificationCode}`;
        let txtRecords = [];
        try {
            txtRecords = await dns.resolveTxt(domainMapping.domain);
        } catch (err) {
            return res.status(400).json({ error: `Could not find TXT record for ${domainMapping.domain}. Please ensure the record has been added and has had time to propagate.` });
        }
        
        const isVerified = txtRecords.some(record => record.includes(expectedRecord));

        if (isVerified) {
            const updatedDomain = await prisma.autoJoinDomain.update({
                where: { id: domainMappingId },
                data: { status: 'VERIFIED' }
            });
            return res.status(200).json(updatedDomain);
        } else {
            return res.status(400).json({ error: 'Verification failed. The TXT record found does not match the expected value.' });
        }

    } catch (error) {
        console.error('Verify domain error:', error);
        res.status(500).json({ error: 'An unexpected error occurred during verification.' });
    }
});

// DELETE /api/v1/companies/:companyId/domains/:domainId - Delete an auto-join domain
router.delete('/:companyId/domains/:domainId', async (req, res) => {
    const { companyId, domainId } = req.params;

    const canManage = await checkPermission(req.user, 'ADMIN', 'company', companyId);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage this company.' });
    }

    try {
        const domainMapping = await prisma.autoJoinDomain.findFirst({
            where: { id: domainId, companyId }
        });

        if (!domainMapping) {
            return res.status(404).json({ error: 'Domain mapping not found or does not belong to this company.' });
        }

        await prisma.autoJoinDomain.delete({
            where: { id: domainId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Delete domain error:', error);
        res.status(500).json({ error: 'Failed to delete domain.' });
    }
});

export default router; 
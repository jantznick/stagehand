// Company routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { promises as dns } from 'dns';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission, getVisibleResourceIds } from '../utils/permissions.js';
import { getAncestors, getDescendants } from '../utils/hierarchy.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

// Get company by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: Check if the user has at least READER access to the company
    const canView = await checkPermission(req.user, 'company:read', 'company', id);
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

// List all companies user has access to
router.get('/', async (req, res) => {
    try {
        const visibleCompanyIds = await getVisibleResourceIds(req.user, 'company');
        const companies = await prisma.company.findMany({
            where: { id: { in: visibleCompanyIds } }
        });
        res.status(200).json(companies);
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ error: 'Failed to retrieve companies.' });
    }
});

// Create a new company
router.post('/', async (req, res) => {
    const { name, description, organizationId } = req.body;
    
    if (!name || !organizationId) {
        return res.status(400).json({ error: 'Name and organizationId are required.' });
    }

    // Authorization: Check if the user can create a company in this organization.
    const canCreate = await checkPermission(req.user, 'company:create', 'organization', organizationId);
    if (!canCreate) {
        return res.status(403).json({ error: 'You are not authorized to create a company in this organization.' });
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

        // The creator automatically becomes an ADMIN of the new company.
        const adminRole = await prisma.role.findFirst({
            where: {
                name: 'Admin',
                organizationId: organizationId
            }
        });

        if (adminRole) {
            await prisma.membership.create({
                data: {
                    userId: req.user.id,
                    companyId: newCompany.id,
                    roleId: adminRole.id
                }
            });
        }

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

// Auto-join domain management for companies

// A blocklist of common public email domains to prevent them from being registered for auto-join.
const PUBLIC_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'msn.com']);

// --- Auto-Join Domain Management for Companies ---

// GET /api/v1/companies/:id/domains - Get all auto-join domains for a company
router.get('/:id/domains', async (req, res) => {
    const { id } = req.params;
    
    // Authorization: User must have permission to update company settings to view domains.
    const canManage = await checkPermission(req.user, 'company:update', 'company', id);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage domains for this company.' });
    }

    try {
        const domains = await prisma.autoJoinDomain.findMany({
            where: { companyId: id },
            orderBy: { domain: 'asc' }
        });
        res.json(domains);
    } catch (error) {
        console.error('Get domains error:', error);
        res.status(500).json({ error: 'Failed to get domains.' });
    }
});

// POST /api/v1/companies/:id/domains - Add a new auto-join domain
router.post('/:id/domains', async (req, res) => {
    const { id } = req.params;
    const { domain, roleId } = req.body;

    if (!domain || !roleId) {
        return res.status(400).json({ error: 'Domain and roleId are required.' });
    }

    if (PUBLIC_DOMAINS.has(domain.toLowerCase())) {
        return res.status(400).json({ error: 'Public email domains cannot be used for auto-join.' });
    }

    const canManage = await checkPermission(req.user, 'company:update', 'company', id);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage domains for this company.' });
    }

    try {
        // Verify the company exists
        const company = await prisma.company.findUnique({ where: { id } });
        if (!company) {
            return res.status(404).json({ error: 'Company not found.' });
        }

        const newDomain = await prisma.autoJoinDomain.create({
            data: {
                domain: domain.toLowerCase(),
                roleId: roleId,
                companyId: id,
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

    const canManage = await checkPermission(req.user, 'company:update', 'company', companyId);
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

// DELETE /api/v1/companies/:id/domains/:domainMappingId - Remove an auto-join domain
router.delete('/:id/domains/:domainMappingId', async (req, res) => {
    const { id: companyId, domainMappingId } = req.params;

    const canManage = await checkPermission(req.user, 'company:update', 'company', companyId);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage domains for this company.' });
    }

    try {
        const domainMapping = await prisma.autoJoinDomain.findFirst({
            where: { id: domainMappingId, companyId }
        });

        if (!domainMapping) {
            return res.status(404).json({ error: 'Domain mapping not found or does not belong to this company.' });
        }

        await prisma.autoJoinDomain.delete({
            where: { id: domainMappingId }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Delete domain error:', error);
        res.status(500).json({ error: 'Failed to delete domain.' });
    }
});

export default router; 
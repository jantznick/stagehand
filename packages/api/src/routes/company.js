/**
 * @openapi
 * tags:
 *   - name: Companies
 *     description: Company management and domain configuration
 * 
 * components:
 *   schemas:
 *     CreateCompanyRequest:
 *       type: object
 *       required:
 *         - name
 *         - organizationId
 *       properties:
 *         name:
 *           type: string
 *           description: Company name
 *         description:
 *           type: string
 *           description: Company description
 *         organizationId:
 *           type: string
 *           description: Parent organization ID
 *     
 *     UpdateCompanyRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Company name
 *         description:
 *           type: string
 *           description: Company description
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { promises as dns } from 'dns';
import { protect } from '../middleware/authMiddleware.js';
import { getVisibleResourceIds, hasPermission } from '../utils/permissions.js';
import { getAncestors, getDescendants } from '../utils/hierarchy.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

/**
 * @openapi
 * /api/v1/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     description: Retrieves a single company by its ID
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       403:
 *         description: Not authorized to view this company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Company not found
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
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: Check if the user has at least READER access to the company
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'company', id);
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

/**
 * @openapi
 * /api/v1/companies:
 *   get:
 *     summary: List all companies user has access to
 *     description: Returns all companies that the authenticated user has access to view
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /api/v1/companies:
 *   post:
 *     summary: Create a new company
 *     description: Creates a new company within an organization
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompanyRequest'
 *     responses:
 *       201:
 *         description: Company successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to create company in this organization
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
router.post('/', async (req, res) => {
    const { name, description, organizationId } = req.body;
    
    if (!name || !organizationId) {
        return res.status(400).json({ error: 'Name and organizationId are required.' });
    }

    // Authorization: Check if the user is an ADMIN of the organization.
    const canCreate = await hasPermission(req.user, 'ADMIN', 'organization', organizationId);
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

/**
 * @openapi
 * /api/v1/companies/{id}:
 *   put:
 *     summary: Update company details
 *     description: Updates company information such as name and description
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCompanyRequest'
 *     responses:
 *       200:
 *         description: Company successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       403:
 *         description: Not authorized to update this company
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
 *   
 *   delete:
 *     summary: Delete company
 *     description: Permanently deletes a company and all associated data
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       204:
 *         description: Company successfully deleted
 *       403:
 *         description: Not authorized to delete this company
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
 * 
 * /api/v1/companies/{id}/domains:
 *   get:
 *     summary: Get auto-join domains for company
 *     description: Retrieves all auto-join domain configurations for a company
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: List of auto-join domains
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AutoJoinDomain'
 *       403:
 *         description: Not authorized to view domains for this company
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
 *   
 *   post:
 *     summary: Add auto-join domain to company
 *     description: Adds a new email domain for automatic user registration to the company
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddDomainRequest'
 *     responses:
 *       201:
 *         description: Domain successfully added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AutoJoinDomain'
 *       400:
 *         description: Invalid request data or public domain not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to manage domains for this company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Domain already added to this company
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
 * 
 * /api/v1/companies/{id}/domains/{domainMappingId}/verify:
 *   post:
 *     summary: Verify company domain ownership via DNS
 *     description: Verifies domain ownership by checking for a specific TXT record in DNS
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *       - in: path
 *         name: domainMappingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain mapping ID
 *     responses:
 *       200:
 *         description: Domain successfully verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AutoJoinDomain'
 *       400:
 *         description: DNS verification failed or TXT record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to manage domains for this company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Domain mapping not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during verification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/companies/{id}/domains/{domainMappingId}:
 *   delete:
 *     summary: Remove auto-join domain from company
 *     description: Removes an auto-join domain configuration from the company
 *     tags: [Companies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *       - in: path
 *         name: domainMappingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain mapping ID
 *     responses:
 *       204:
 *         description: Domain successfully removed
 *       403:
 *         description: Not authorized to manage domains for this company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Domain mapping not found or does not belong to this company
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

// A blocklist of common public email domains to prevent them from being registered for auto-join.
const PUBLIC_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'msn.com']);

// --- Auto-Join Domain Management for Companies ---

// GET /api/v1/companies/:id/domains - Get all auto-join domains for a company
router.get('/:id/domains', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Authorization Check: User must be a member of the hierarchy to view its domains.
        const ancestors = await getAncestors('company', id);
        const descendants = await getDescendants('company', id);

        const resourceTreeIds = {
            organizationIds: [ancestors.organizationId].filter(Boolean),
            companyIds: [id, ...Object.values(ancestors).filter(Boolean)],
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
    const { domain, role } = req.body;

    if (!domain || !role) {
        return res.status(400).json({ error: 'Domain and role are required.' });
    }

    if (PUBLIC_DOMAINS.has(domain.toLowerCase())) {
        return res.status(400).json({ error: 'Public email domains cannot be used for auto-join.' });
    }

    const canManage = await hasPermission(req.user, 'ADMIN', 'company', id);
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
                role,
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

    const canManage = await hasPermission(req.user, 'ADMIN', 'company', companyId);
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

    const canManage = await hasPermission(req.user, 'ADMIN', 'company', companyId);
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
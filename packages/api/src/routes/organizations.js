/**
 * @openapi
 * tags:
 *   - name: Organizations
 *     description: Organization management and domain configuration
 * 
 * components:
 *   schemas:
 *     UpdateOrganizationRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Organization name
 *         description:
 *           type: string
 *           description: Organization description
 *         accountType:
 *           type: string
 *           enum: [STANDARD, ENTERPRISE]
 *           description: Account type
 *         defaultCompanyId:
 *           type: string
 *           description: Default company ID (required when downgrading to STANDARD)
 *         hierarchyDisplayNames:
 *           type: object
 *           description: Custom display names for hierarchy levels
 *     
 *     AutoJoinDomain:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         domain:
 *           type: string
 *           description: Email domain
 *         role:
 *           type: string
 *           enum: [ADMIN, EDITOR, READER]
 *           description: Role assigned to users from this domain
 *         organizationId:
 *           type: string
 *           description: Organization ID
 *         companyId:
 *           type: string
 *           description: Company ID (if domain is for company-level auto-join)
 *         status:
 *           type: string
 *           enum: [PENDING, VERIFIED]
 *           description: Domain verification status
 *         verificationCode:
 *           type: string
 *           description: DNS verification code
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     AddDomainRequest:
 *       type: object
 *       required:
 *         - domain
 *         - role
 *       properties:
 *         domain:
 *           type: string
 *           description: Email domain (e.g., example.com)
 *         role:
 *           type: string
 *           enum: [ADMIN, EDITOR, READER]
 *           description: Role to assign to users from this domain
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { promises as dns } from 'dns';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import { getAncestors, getDescendants } from '../utils/hierarchy.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

/**
 * @openapi
 * /api/v1/organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     description: Retrieves a single organization by its ID
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organization'
 *       403:
 *         description: Not authorized to view this organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization not found
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
    
    // Authorization: Check if the user has at least READER access to the organization
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'organization', id);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this organization.' });
    }

    try {
        const organization = await prisma.organization.findUnique({
            where: { id },
        });

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found.' });
        }

        res.status(200).json(organization);

    } catch (error) {
        console.error('Get organization error:', error);
        res.status(500).json({ error: 'Failed to get organization.' });
    }
});

/**
 * @openapi
 * /api/v1/organizations/{id}:
 *   put:
 *     summary: Update organization
 *     description: Updates organization details including account type, name, and other settings
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrganizationRequest'
 *     responses:
 *       200:
 *         description: Organization successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organization'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to update this organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization not found
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
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, accountType, defaultCompanyId, hierarchyDisplayNames } = req.body;

    const canUpdate = await hasPermission(req.user, 'ADMIN', 'organization', id);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update this organization.' });
    }

    try {
        const currentOrg = await prisma.organization.findUnique({ where: { id } });
        if (!currentOrg) {
            return res.status(404).json({ error: 'Organization not found.' });
        }

        const isDowngrading = currentOrg.accountType === 'ENTERPRISE' && accountType === 'STANDARD';

        if (isDowngrading) {
            if (!defaultCompanyId) {
                return res.status(400).json({ error: 'When downgrading to Standard, a default company must be selected.' });
            }

            const company = await prisma.company.findFirst({
                where: { id: defaultCompanyId, organizationId: id }
            });
            if (!company) {
                return res.status(400).json({ error: 'The selected default company does not belong to this organization.' });
            }
            
            // Non-destructive downgrade: just update the org type and default company
            const updatedOrganization = await prisma.organization.update({
                where: { id },
                data: {
                    accountType: 'STANDARD',
                    defaultCompanyId: defaultCompanyId
                }
            });

            return res.status(200).json(updatedOrganization);
        }

        // Handle normal updates (name, description) and upgrades
        const dataToUpdate = {};
        if (name) dataToUpdate.name = name;
        if (description !== undefined) dataToUpdate.description = description;
        if (accountType) dataToUpdate.accountType = accountType;
        if (defaultCompanyId) dataToUpdate.defaultCompanyId = defaultCompanyId;
        if (hierarchyDisplayNames) dataToUpdate.hierarchyDisplayNames = hierarchyDisplayNames;

        const updatedOrganization = await prisma.organization.update({
            where: { id },
            data: dataToUpdate
        });

        res.status(200).json(updatedOrganization);

    } catch (error) {
        console.error('Update organization error:', error);
        res.status(500).json({ error: 'Failed to update organization.' });
    }
});

// A blocklist of common public email domains to prevent them from being registered for auto-join.
const PUBLIC_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'msn.com']);

// --- Auto-Join Domain Management for Organizations ---

/**
 * @openapi
 * /api/v1/organizations/{id}/domains:
 *   get:
 *     summary: Get auto-join domains for organization
 *     description: Retrieves all auto-join domain configurations for an organization
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
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
 *         description: Not authorized to view domains for this organization
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
 *     summary: Add auto-join domain to organization
 *     description: Adds a new email domain for automatic user registration to the organization
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
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
 *         description: Not authorized to manage domains for this organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Domain already added to this organization
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
 * /api/v1/organizations/{id}/domains/{domainMappingId}/verify:
 *   post:
 *     summary: Verify domain ownership via DNS
 *     description: Verifies domain ownership by checking for a specific TXT record in DNS
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
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
 *         description: Not authorized to manage domains for this organization
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
 * /api/v1/organizations/{id}/domains/{domainMappingId}:
 *   delete:
 *     summary: Remove auto-join domain from organization
 *     description: Removes an auto-join domain configuration from the organization
 *     tags: [Organizations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
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
 *         description: Not authorized to manage domains for this organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Domain mapping not found or does not belong to this organization
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

// GET /api/v1/organizations/:id/domains - Get all auto-join domains for an organization
router.get('/:id/domains', async (req, res) => {
    const { id } = req.params;

    try {
        // Authorization Check: User must be a member of the hierarchy to view its domains.
        const ancestors = await getAncestors('organization', id);
        const descendants = await getDescendants('organization', id);

        const resourceTreeIds = {
            organizationIds: [id, ...Object.values(ancestors).filter(Boolean)],
            companyIds: descendants.companyIds,
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
            return res.status(403).json({ error: 'You are not authorized to view domains for this organization.' });
        }

        const domains = await prisma.autoJoinDomain.findMany({
            where: { organizationId: id },
            orderBy: { domain: 'asc' }
        });
        res.json(domains);
    } catch (error) {
        console.error('Get domains error:', error);
        res.status(500).json({ error: 'Failed to get domains.' });
    }
});

// POST /api/v1/organizations/:id/domains - Add a new auto-join domain
router.post('/:id/domains', async (req, res) => {
    const { id } = req.params;
    const { domain, role } = req.body;

    if (!domain || !role) {
        return res.status(400).json({ error: 'Domain and role are required.' });
    }
    
    if (PUBLIC_DOMAINS.has(domain.toLowerCase())) {
        return res.status(400).json({ error: 'Public email domains cannot be used for auto-join.' });
    }

    const canManage = await hasPermission(req.user, 'ADMIN', 'organization', id);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage domains for this organization.' });
    }

    try {
        // Verify the organization exists
        const organization = await prisma.organization.findUnique({ where: { id } });
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found.' });
        }

        const newDomain = await prisma.autoJoinDomain.create({
            data: {
                domain: domain.toLowerCase(),
                role,
                organizationId: id,
                verificationCode: crypto.randomBytes(16).toString('hex'),
                status: 'PENDING'
            }
        });
        res.status(201).json(newDomain);
    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint violation
            return res.status(409).json({ error: 'This domain has already been added to this organization.' });
        }
        console.error('Add domain error:', error);
        res.status(500).json({ error: 'Failed to add domain.' });
    }
});

// POST /api/v1/organizations/:id/domains/:domainMappingId/verify - Verify a domain via DNS
router.post('/:id/domains/:domainMappingId/verify', async (req, res) => {
    const { id: organizationId, domainMappingId } = req.params;

    const canManage = await hasPermission(req.user, 'ADMIN', 'organization', organizationId);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage domains for this organization.' });
    }

    try {
        const domainMapping = await prisma.autoJoinDomain.findUnique({
            where: { id: domainMappingId }
        });

        if (!domainMapping || domainMapping.organizationId !== organizationId) {
            return res.status(404).json({ error: 'Domain mapping not found.' });
        }

        const expectedRecord = `stagehand-verification=${domainMapping.verificationCode}`;
        let txtRecords = [];
        try {
            txtRecords = await dns.resolveTxt(domainMapping.domain);
        } catch (err) {
            // This error (e.g., ENOTFOUND) means the domain or TXT record doesn't exist.
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

// DELETE /api/v1/organizations/:id/domains/:domainMappingId - Remove an auto-join domain
router.delete('/:id/domains/:domainMappingId', async (req, res) => {
    const { id: organizationId, domainMappingId } = req.params;

    const canManage = await hasPermission(req.user, 'ADMIN', 'organization', organizationId);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to manage domains for this organization.' });
    }

    try {
        // Ensure the domain mapping belongs to the specified organization before deleting
        const domainMapping = await prisma.autoJoinDomain.findFirst({
            where: { id: domainMappingId, organizationId }
        });

        if (!domainMapping) {
            return res.status(404).json({ error: 'Domain mapping not found or does not belong to this organization.' });
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

// NOTE: GET, POST, DELETE routes for organizations might be needed.
// For now, only implementing the PUT route as requested.
// GET all for a user is handled by the hierarchy route.
// POST for a new org might be a super-admin function or a different flow.
// DELETE is a sensitive operation and needs careful consideration of what happens to child resources.

export default router; 
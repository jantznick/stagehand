// Membership routes - OpenAPI documentation moved to packages/api/src/openapi/

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../utils/permissions.js';
import { getMembershipDetails } from '../utils/membership.js';
import { sendEmail } from '../utils/email.js';

const prisma = new PrismaClient();
const router = Router();

router.use(protect);

// Get members for a resource
router.get('/', async (req, res) => {
    const { organizationId, companyId, teamId, projectId } = req.query;
    let resourceType, resourceId;

    if (organizationId) { resourceType = 'organization'; resourceId = organizationId; } 
    else if (companyId) { resourceType = 'company'; resourceId = companyId; }
    else if (teamId) { resourceType = 'team'; resourceId = teamId; }
    else if (projectId) { resourceType = 'project'; resourceId = projectId; }
    else { return res.status(400).json({ error: 'A resource ID must be provided.' }); }

    // NOTE: This check might need to be more granular in the future, e.g., 'organization:members:read'
    const canView = await checkPermission(req.user, `${resourceType}:read`, resourceType, resourceId);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view members of this resource.' });
    }

    try {
        const memberships = await prisma.membership.findMany({
            where: { [`${resourceType}Id`]: resourceId },
            include: {
                user: { select: { id: true, email: true } },
                team: { select: { id: true, name: true } },
                role: { select: { id: true, name: true } }
            }
        });
        res.json(memberships);
    } catch (error) {
        console.error(`Error fetching members for ${resourceType}:`, error);
        res.status(500).json({ error: 'An error occurred while fetching members.' });
    }
});

// Add a member to a resource
router.post('/', async (req, res) => {
    const { email, roleId, resourceId, resourceType } = req.body;
    
    if (!email || !roleId || !resourceId || !resourceType) {
        return res.status(400).json({ error: 'Email, roleId, resourceId, and resourceType are required.' });
    }
    
    const canManage = await checkPermission(req.user, `${resourceType}:members:manage`, resourceType, resourceId);
    if (!canManage) {
        return res.status(403).json({ error: 'You are not authorized to add members to this resource.' });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    let invitationLink = null;

    try {
        // If user does not exist, create them and send an invitation
        if (!user) {
            const invitationToken = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

            user = await prisma.user.create({
                data: {
                    email,
                    invitation: {
                        create: {
                            email,
                            token: invitationToken,
							expires,
                            expiresAt:expires,
                        },
                    },
                },
            });
            
            invitationLink = `${process.env.WEB_URL}/register?invite_token=${invitationToken}`;
			const inviter = await prisma.user.findUnique({ where: { id: req.user.id } });
			const resourceName = await getMembershipDetails(resourceType, resourceId);
			const itemName = resourceName || 'Stagehand';
	
			await sendEmail({
			  to: user.email,
			  subject: `You've been invited to join ${itemName}`,
			  templateName: 'userInvitation',
			  templateProps: {
				inviterName: inviter?.name || inviter?.email,
				organizationName: itemName,
				inviteLink: invitationLink,
			  },
			});
        }

        const newMembership = await prisma.membership.create({
            data: {
                userId: user.id,
                roleId: roleId,
                [`${resourceType}Id`]: resourceId,
            },
        });

        res.status(201).json({ ...newMembership, invitationLink });

    } catch (error) {
        if (error.code === 'P2002') {
            console.error('Duplicate entry error:', error);
            res.status(409).json({ error: 'User already exists or duplicate entry error.' });
        } else {
            console.error('Error adding member:', error);
            res.status(500).json({ error: 'An error occurred while adding the member.' });
        }
    }
});


// Remove a member from a resource
router.delete('/:membershipId', async (req, res) => {
    const { membershipId } = req.params;

    try {
        const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
        if (!membership) {
            return res.status(404).json({ error: 'Membership not found.' });
        }

        const { organizationId, companyId, teamId, projectId } = membership;
        const resourceType = organizationId ? 'organization' : companyId ? 'company' : teamId ? 'team' : 'project';
        const resourceId = organizationId || companyId || teamId || projectId;
        
        const canManage = await checkPermission(req.user, `${resourceType}:members:manage`, resourceType, resourceId);
        if (!canManage) {
            return res.status(403).json({ error: 'You are not authorized to remove members from this resource.' });
        }
        
        await prisma.membership.delete({ where: { id: membershipId } });
        res.status(204).send();

    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'An error occurred while removing the member.' });
    }
});

// Update a member's role
router.put('/:membershipId', async (req, res) => {
    const { membershipId } = req.params;
    const { roleId } = req.body;

    if (!roleId) {
        return res.status(400).json({ error: 'roleId is required.' });
    }
    
    try {
        const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
        if (!membership) {
            return res.status(404).json({ error: 'Membership not found.' });
        }

        const { organizationId, companyId, teamId, projectId } = membership;
        const resourceType = organizationId ? 'organization' : companyId ? 'company' : teamId ? 'team' : 'project';
        const resourceId = organizationId || companyId || teamId || projectId;

        const canManage = await checkPermission(req.user, `${resourceType}:members:manage`, resourceType, resourceId);
        if (!canManage) {
            return res.status(403).json({ error: 'You are not authorized to change roles for this resource.' });
        }

        const updatedMembership = await prisma.membership.update({
            where: { id: membershipId },
            data: { roleId },
        });

        res.json(updatedMembership);

    } catch (error) {
        console.error('Error updating member role:', error);
        res.status(500).json({ error: 'An error occurred while updating the member role.' });
    }
});

export default router;
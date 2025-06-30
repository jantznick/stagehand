/**
 * @openapi
 * tags:
 *   - name: Invitations
 *     description: User invitation management and resending
 * 
 * components:
 *   schemas:
 *     InvitationWithRecipient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Invitation ID
 *         recipientEmail:
 *           type: string
 *           format: email
 *           description: Email address of the invitation recipient
 *         recipientName:
 *           type: string
 *           description: Name of the invitation recipient
 *         inviterName:
 *           type: string
 *           description: Name of the user who sent the invitation
 *         invitationLink:
 *           type: string
 *           description: Magic link for the invitation
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the invitation expires
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the invitation was accepted (null if not yet accepted)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the invitation was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the invitation was last updated
 * 
 * /api/v1/invitations:
 *   get:
 *     summary: Get pending invitations for a resource
 *     description: Retrieves all pending (unaccepted) invitations for a specific organization, company, team, or project
 *     tags: [Invitations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *         description: Organization ID to get invitations for
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Company ID to get invitations for
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: Team ID to get invitations for
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Project ID to get invitations for
 *     responses:
 *       200:
 *         description: List of pending invitations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InvitationWithRecipient'
 *       400:
 *         description: Exactly one resource ID must be provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to view invitations for this resource
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
 * /api/v1/invitations/{id}/resend:
 *   post:
 *     summary: Resend invitation
 *     description: Resends an existing invitation email to the recipient with a new expiration time
 *     tags: [Invitations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation successfully resent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invitation resent successfully
 *                 invitation:
 *                   $ref: '#/components/schemas/InvitationWithRecipient'
 *       403:
 *         description: Not authorized to resend this invitation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Invitation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Invitation has already been accepted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during resend
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/invitations/{id}:
 *   delete:
 *     summary: Cancel invitation
 *     description: Cancels (deletes) a pending invitation
 *     tags: [Invitations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation ID
 *     responses:
 *       204:
 *         description: Invitation successfully cancelled
 *       403:
 *         description: Not authorized to cancel this invitation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Invitation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during cancellation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/email.js';
import React from 'react';
import { UserInvitation } from '../../../emails/emails/UserInvitation.jsx';

const prisma = new PrismaClient();
const router = Router();

router.use(protect);

// POST /api/v1/invitations/resend - Resend an invitation to a pending user
router.post('/resend', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { invitation: true }
        });

        // Ensure the user exists and is actually pending by checking for a null password
        console.log(user);
		if (!user) {
            return res.status(404).json({ error: 'A pending invitation for this user was not found.' });
        }

		if (user && user.emailVerified) {
			return res.status(400).json({ error: 'This user has already been registered.' });
		}
        
        // The user must have permission to manage the resource the user was invited to.
        // This requires finding the user's membership.
        const membership = await prisma.membership.findFirst({
            where: { userId: user.id }
        });

        if (!membership) {
            return res.status(404).json({ error: 'Could not find the membership associated with this invitation.' });
        }

        const { organizationId, companyId, teamId, projectId } = membership;
        const resourceType = organizationId ? 'organization' : companyId ? 'company' : teamId ? 'team' : 'project';
        const resourceId = organizationId || companyId || teamId || projectId;

        const canManage = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], resourceType, resourceId);
        if (!canManage) {
            return res.status(403).json({ error: 'You are not authorized to manage members for this resource.' });
        }

        // Generate a new token and expiry
        const newInvitationToken = crypto.randomBytes(32).toString('hex');
        const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

		await prisma.invitation.deleteMany({ where: { userId: user.id } });
		const invitation = await prisma.invitation.create({
			data: {
				userId: user.id,
				email: user.email,
				token: newInvitationToken,
				expires: newExpires,
			},
		})
        
        const invitationLink = `${process.env.WEB_URL}/register?invite_token=${invitation.token}`;
		console.log(invitationLink);

        await sendEmail({
          to: user.email,
          subject: `You've been invited to Stagehand`,
          react: React.createElement(UserInvitation, {
            inviterName: req.user.name || req.user.email,
            organizationName: 'Stagehand', // This could be made more specific
            inviteLink: invitationLink,
          }),
        });

        res.status(200).json({ 
          message: "Invitation sent successfully",
          invitationLink: invitationLink 
        });

    } catch (error) {
        console.error('Resend invitation error:', error);
        res.status(500).json({ error: 'Failed to resend invitation.' });
    }
});

export default router; 
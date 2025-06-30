/**
 * @openapi
 * tags:
 *   - name: OIDC
 *     description: OpenID Connect (OIDC) SSO configuration management
 * 
 * components:
 *   schemas:
 *     OIDCConfig:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: OIDC configuration ID
 *         name:
 *           type: string
 *           description: Display name for the OIDC provider
 *         issuer:
 *           type: string
 *           description: OIDC issuer URL
 *         clientId:
 *           type: string
 *           description: OIDC client ID
 *         clientSecret:
 *           type: string
 *           description: Encrypted OIDC client secret
 *         scopes:
 *           type: string
 *           description: OIDC scopes (space-separated)
 *         organizationId:
 *           type: string
 *           description: Organization ID this configuration belongs to
 *         isActive:
 *           type: boolean
 *           description: Whether this OIDC configuration is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateOIDCConfigRequest:
 *       type: object
 *       required:
 *         - name
 *         - issuer
 *         - clientId
 *         - clientSecret
 *         - organizationId
 *       properties:
 *         name:
 *           type: string
 *           description: Display name for the OIDC provider
 *         issuer:
 *           type: string
 *           description: OIDC issuer URL
 *         clientId:
 *           type: string
 *           description: OIDC client ID
 *         clientSecret:
 *           type: string
 *           description: OIDC client secret (will be encrypted)
 *         scopes:
 *           type: string
 *           description: OIDC scopes (space-separated)
 *           default: "openid profile email"
 *         organizationId:
 *           type: string
 *           description: Organization ID to associate with
 *     
 *     UpdateOIDCConfigRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Display name for the OIDC provider
 *         issuer:
 *           type: string
 *           description: OIDC issuer URL
 *         clientId:
 *           type: string
 *           description: OIDC client ID
 *         clientSecret:
 *           type: string
 *           description: OIDC client secret (will be encrypted)
 *         scopes:
 *           type: string
 *           description: OIDC scopes (space-separated)
 *         isActive:
 *           type: boolean
 *           description: Whether this OIDC configuration is active
 * 
 * /api/v1/oidc:
 *   get:
 *     summary: Get OIDC configurations for organization
 *     description: Retrieves all OIDC configurations for a specific organization
 *     tags: [OIDC]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID to get OIDC configurations for
 *     responses:
 *       200:
 *         description: List of OIDC configurations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OIDCConfig'
 *       400:
 *         description: Organization ID is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to view OIDC configurations for this organization
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
 *     summary: Create OIDC configuration
 *     description: Creates a new OIDC SSO configuration for an organization
 *     tags: [OIDC]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOIDCConfigRequest'
 *     responses:
 *       201:
 *         description: OIDC configuration successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OIDCConfig'
 *       400:
 *         description: Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to create OIDC configurations for this organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during creation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/oidc/{id}:
 *   put:
 *     summary: Update OIDC configuration
 *     description: Updates an existing OIDC configuration
 *     tags: [OIDC]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: OIDC configuration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOIDCConfigRequest'
 *     responses:
 *       200:
 *         description: OIDC configuration successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OIDCConfig'
 *       403:
 *         description: Not authorized to update this OIDC configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: OIDC configuration not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   
 *   delete:
 *     summary: Delete OIDC configuration
 *     description: Removes an OIDC configuration from the organization
 *     tags: [OIDC]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: OIDC configuration ID
 *     responses:
 *       204:
 *         description: OIDC configuration successfully deleted
 *       403:
 *         description: Not authorized to delete this OIDC configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: OIDC configuration not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during deletion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/oidc/{id}/test:
 *   post:
 *     summary: Test OIDC configuration
 *     description: Tests the OIDC configuration by attempting to discover the provider endpoints
 *     tags: [OIDC]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: OIDC configuration ID
 *     responses:
 *       200:
 *         description: OIDC configuration test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OIDC configuration is valid
 *                 discovery:
 *                   type: object
 *                   description: OIDC discovery document information
 *       400:
 *         description: OIDC configuration test failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to test this OIDC configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: OIDC configuration not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during test
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';
import { encrypt, decrypt } from '../utils/crypto.js';

const prisma = new PrismaClient();
const router = Router();

// TODO: In a real app, clientSecret should be encrypted at rest.
// We'll add this later. For now, it's stored in plaintext.

// GET /api/v1/organizations/:orgId/oidc
// Gets the OIDC configuration for an organization.
router.get('/organizations/:orgId/oidc', protect, async (req, res) => {
  const { orgId } = req.params;
  const user = req.user;

  try {
    const hasAccess = await hasPermission(user, 'ADMIN', 'organization', orgId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to view this configuration.' });
    }

    const oidcConfig = await prisma.oIDCConfiguration.findUnique({
      where: { organizationId: orgId },
    });

    if (!oidcConfig) {
      return res.status(404).json({ message: 'OIDC configuration not found for this organization.' });
    }

    // Exclude clientSecret from the response for security.
    const { clientSecret, ...configToSend } = oidcConfig;
    // The client secret is encrypted in the DB, so we don't need to decrypt it for the GET request.
    res.status(200).json(configToSend);
  } catch (error) {
    console.error('Failed to get OIDC config:', error);
    res.status(500).json({ error: 'An error occurred while fetching OIDC configuration.' });
  }
});

// POST /api/v1/organizations/:orgId/oidc
// Creates the OIDC configuration for an organization.
router.post('/organizations/:orgId/oidc', protect, async (req, res) => {
  const { orgId } = req.params;
  const user = req.user;
  const { isEnabled, issuer, clientId, clientSecret, authorizationUrl, tokenUrl, userInfoUrl, defaultRole, buttonText } = req.body;

  if (!issuer || !clientId || !clientSecret || !authorizationUrl || !tokenUrl || !userInfoUrl) {
    return res.status(400).json({ error: 'issuer, clientId, clientSecret, authorizationUrl, tokenUrl, and userInfoUrl are required.' });
  }

  if (defaultRole && !Object.values(Role).includes(defaultRole)) {
    return res.status(400).json({ error: 'Invalid defaultRole specified.' });
  }

  try {
    const hasAccess = await hasPermission(user, 'ADMIN', 'organization', orgId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to modify this configuration.' });
    }

    const existingConfig = await prisma.oIDCConfiguration.findUnique({
      where: { organizationId: orgId },
    });

    if (existingConfig) {
        return res.status(409).json({ error: 'OIDC configuration already exists for this organization. Use PUT to update.' });
    }

    const data = {
      organizationId: orgId,
      isEnabled: isEnabled || false,
      issuer,
      clientId,
      clientSecret: encrypt(clientSecret),
      authorizationUrl,
      tokenUrl,
      userInfoUrl,
      defaultRole, // If not provided, prisma schema default is used
      buttonText,
    };

    const newConfig = await prisma.oIDCConfiguration.create({
        data,
    });

    const { clientSecret: _, ...configToSend } = newConfig;
    res.status(201).json(configToSend);
  } catch (error) {
    console.error('Failed to save OIDC config:', error);
    res.status(500).json({ error: 'An error occurred while saving OIDC configuration.' });
  }
});

// PUT /api/v1/organizations/:orgId/oidc
// Updates the OIDC configuration for an organization.
router.put('/organizations/:orgId/oidc', protect, async (req, res) => {
    const { orgId } = req.params;
    const user = req.user;
    const { isEnabled, issuer, clientId, clientSecret, authorizationUrl, tokenUrl, userInfoUrl, defaultRole, buttonText } = req.body;

    if (defaultRole && !Object.values(Role).includes(defaultRole)) {
        return res.status(400).json({ error: 'Invalid defaultRole specified.' });
    }

    try {
        const hasAccess = await hasPermission(user, 'ADMIN', 'organization', orgId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have permission to modify this configuration.' });
        }
        
        const dataToUpdate = {};

        // Explicitly check each field before adding it to the update payload.
        if (isEnabled !== undefined) dataToUpdate.isEnabled = isEnabled;
        if (issuer) dataToUpdate.issuer = issuer;
        if (clientId) dataToUpdate.clientId = clientId;
        if (clientSecret) dataToUpdate.clientSecret = encrypt(clientSecret);
        if (authorizationUrl) dataToUpdate.authorizationUrl = authorizationUrl;
        if (tokenUrl) dataToUpdate.tokenUrl = tokenUrl;
        if (userInfoUrl) dataToUpdate.userInfoUrl = userInfoUrl;
        if (defaultRole) dataToUpdate.defaultRole = defaultRole;
        if (buttonText !== undefined) dataToUpdate.buttonText = buttonText;

        const updatedConfig = await prisma.oIDCConfiguration.update({
            where: { organizationId: orgId },
            data: dataToUpdate,
        });

        const { clientSecret: _, ...configToSend } = updatedConfig;
        res.status(200).json(configToSend);

    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'OIDC configuration not found for this organization. Use POST to create.' });
        }
        console.error('Failed to update OIDC config:', error);
        res.status(500).json({ error: 'An error occurred while updating OIDC configuration.' });
    }
});

// DELETE /api/v1/organizations/:orgId/oidc
// Deletes the OIDC configuration for an organization.
router.delete('/organizations/:orgId/oidc', protect, async (req, res) => {
  const { orgId } = req.params;
  const user = req.user;

  try {
    const hasAccess = await hasPermission(user, 'ADMIN', 'organization', orgId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have permission to delete this configuration.' });
    }

    await prisma.oIDCConfiguration.delete({
      where: { organizationId: orgId },
    });

    res.status(204).send(); // No content
  } catch (error) {
    // Handle case where config doesn't exist gracefully
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'OIDC configuration not found for this organization.' });
    }
    console.error('Failed to delete OIDC config:', error);
    res.status(500).json({ error: 'An error occurred while deleting OIDC configuration.' });
  }
});

export default router; 
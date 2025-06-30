/**
 * @openapi
 * tags:
 *   - name: Relationships
 *     description: Project dependency and relationship management
 * 
 * components:
 *   schemas:
 *     ProjectRelationship:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Relationship ID
 *         sourceProjectId:
 *           type: string
 *           description: Source project ID (the project that depends on another)
 *         targetProjectId:
 *           type: string
 *           description: Target project ID (the project being depended upon)
 *         type:
 *           type: string
 *           enum: [DEPENDS_ON, USES, INTEGRATES_WITH, EXTENDS]
 *           description: Type of relationship between projects
 *         description:
 *           type: string
 *           nullable: true
 *           description: Optional description of the relationship
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateRelationshipRequest:
 *       type: object
 *       required:
 *         - sourceProjectId
 *         - targetProjectId
 *         - type
 *       properties:
 *         sourceProjectId:
 *           type: string
 *           description: Source project ID
 *         targetProjectId:
 *           type: string
 *           description: Target project ID
 *         type:
 *           type: string
 *           enum: [DEPENDS_ON, USES, INTEGRATES_WITH, EXTENDS]
 *           description: Type of relationship
 *         description:
 *           type: string
 *           description: Optional description of the relationship
 *     
 *     UpdateRelationshipRequest:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [DEPENDS_ON, USES, INTEGRATES_WITH, EXTENDS]
 *           description: Updated relationship type
 *         description:
 *           type: string
 *           description: Updated description of the relationship
 * 
 * /api/v1/relationships:
 *   get:
 *     summary: Get project relationships
 *     description: Retrieves all relationships for projects within a specific company
 *     tags: [Relationships]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID to get project relationships for
 *     responses:
 *       200:
 *         description: List of project relationships
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectRelationship'
 *       400:
 *         description: Company ID is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to view relationships for this company
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
 *     summary: Create project relationship
 *     description: Creates a new dependency relationship between two projects
 *     tags: [Relationships]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRelationshipRequest'
 *     responses:
 *       201:
 *         description: Relationship successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectRelationship'
 *       400:
 *         description: Invalid request data or cannot create self-referencing relationship
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to create relationships between these projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: One or both projects not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Relationship already exists between these projects
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
 * /api/v1/relationships/{id}:
 *   put:
 *     summary: Update project relationship
 *     description: Updates an existing project relationship's type or description
 *     tags: [Relationships]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Relationship ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRelationshipRequest'
 *     responses:
 *       200:
 *         description: Relationship successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectRelationship'
 *       403:
 *         description: Not authorized to update this relationship
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Relationship not found
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
 *     summary: Delete project relationship
 *     description: Removes a project relationship
 *     tags: [Relationships]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Relationship ID
 *     responses:
 *       204:
 *         description: Relationship successfully deleted
 *       403:
 *         description: Not authorized to delete this relationship
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Relationship not found
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

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { hasPermission } from '../utils/permissions.js';

const router = express.Router();
const prisma = new PrismaClient();

// Protect all routes in this file
router.use(protect);

// Middleware to authorize if a user has editor or admin rights in a company.
const canEditCompanyResources = async (req, res, next) => {
    const { companyId } = req.query;
    const user = req.user;

    if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required.' });
    }

    const hasEditPermission = await hasPermission(user, ['ADMIN', 'EDITOR'], 'company', companyId);
    if (!hasEditPermission) {
        return res.status(403).json({ error: 'You do not have permission to edit resources in this company.' });
    }
    
    next();
};

// Create a new project relationship
router.post('/', canEditCompanyResources, async (req, res) => {
  const { sourceProjectId, targetProjectId, type, description } = req.body;
  const { companyId } = req.query;

  if (!sourceProjectId || !targetProjectId || !type) {
    return res.status(400).json({ error: 'Source project, target project, and type are required' });
  }

  try {
    // Verify both projects exist and belong to the same company
    const sourceProject = await prisma.project.findUnique({
        where: { id: sourceProjectId },
        include: { team: true }
    });

    const targetProject = await prisma.project.findUnique({
        where: { id: targetProjectId },
        include: { team: true }
    });

    if (!sourceProject || !targetProject) {
        return res.status(404).json({ error: 'One or both projects not found.' });
    }

    if (sourceProject.team.companyId !== companyId || targetProject.team.companyId !== companyId) {
        return res.status(403).json({ error: 'Both projects must belong to the specified company.' });
    }

    const relationship = await prisma.projectRelationship.create({
      data: {
        sourceProjectId,
        targetProjectId,
        type,
        description,
      },
    });
    res.status(201).json(relationship);
  } catch (error) {
    console.error('Failed to create project relationship:', error);
    if (error.code === 'P2002') {
        return res.status(409).json({ error: 'This relationship already exists.' });
    }
    res.status(500).json({ error: 'Failed to create project relationship' });
  }
});

// Delete a project relationship
router.delete('/:id', canEditCompanyResources, async (req, res) => {
  const { id } = req.params;

  try {
    const relationship = await prisma.projectRelationship.findUnique({
        where: { id },
        include: { 
            sourceProject: { 
                include: { 
                    team: true 
                } 
            } 
        }
    });

    if (!relationship) {
        return res.status(404).json({ error: 'Relationship not found.' });
    }
    
    if (relationship.sourceProject.team.companyId !== req.query.companyId) {
        return res.status(403).json({ error: 'You are not authorized to delete this relationship.' });
    }

    await prisma.projectRelationship.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete project relationship:', error);
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Relationship not found.' });
    }
    res.status(500).json({ error: 'Failed to delete project relationship' });
  }
});


export default router; 
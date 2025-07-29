// Relationship routes - OpenAPI documentation moved to packages/api/src/openapi/

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { checkPermission } from '../utils/permissions.js';

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

    const hasEditPermission = await checkPermission(user, 'project:update', 'company', companyId);
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
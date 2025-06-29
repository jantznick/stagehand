import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { getVisibleResourceIds, hasPermission, isMemberOfCompany } from '../utils/permissions.js';
import { getDescendants } from '../utils/hierarchy.js';

const prisma = new PrismaClient();
const router = Router();

// All routes in this file are protected
router.use(protect);

// GET /api/v1/projects/:id - Get a single project with all Stagehand details
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: Check if the user has at least READER access to the project
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', id);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this project.' });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                team: {
                    include: {
                        company: {
                            include: {
                                organization: true
                            }
                        }
                    }
                },
                contacts: {
                    include: {
                        contact: true,
                    }
                },
                technologies: { include: { technology: true } },
                dependencies: true,
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        // --- Start: Enrich Contacts with User and Membership info ---
        if (project.contacts && project.contacts.length > 0) {
            const contactEmails = project.contacts.map(c => c.contact.email);

            // Find users that match the contact emails
            const users = await prisma.user.findMany({
                where: { email: { in: contactEmails } },
                select: { id: true, email: true }
            });

            // Find memberships for those users specifically on this project
            const userIds = users.map(u => u.id);
            const memberships = await prisma.membership.findMany({
                where: {
                    projectId: id,
                    userId: { in: userIds }
                },
                select: { userId: true, role: true }
            });

            const usersByEmail = new Map(users.map(u => [u.email, u]));
            const membershipsByUserId = new Map(memberships.map(m => [m.userId, m]));

            // Inject the user and membership info into the contact objects
            project.contacts = project.contacts.map(pc => {
                const user = usersByEmail.get(pc.contact.email);
                const projectMembership = user ? membershipsByUserId.get(user.id) : null;
                return {
                    ...pc,
                    user: user || null,
                    projectMembership: projectMembership || null,
                };
            });
        }
        // --- End: Enrich Contacts ---

        res.status(200).json(project);

    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to get project.' });
    }
});

// GET /api/v1/projects - List all projects a user has access to
router.get('/', async (req, res) => {
    try {
        const visibleProjectIds = await getVisibleResourceIds(req.user, 'project');
        const projects = await prisma.project.findMany({
            where: { id: { in: visibleProjectIds } }
        });
        res.status(200).json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to retrieve projects.' });
    }
});

// POST /api/v1/projects - Create a new project
router.post('/', async (req, res) => {
    const { name, description, teamId } = req.body;

    if (!name || !teamId) {
        return res.status(400).json({ error: 'Name and teamId are required.' });
    }

    // Authorization: User must be ADMIN or EDITOR of the parent team.
    const canCreate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'team', teamId);
    if (!canCreate) {
        return res.status(403).json({ error: 'You are not authorized to create a project in this team.' });
    }
    
    try {
        const newProject = await prisma.project.create({
            data: { name, description, teamId }
        });

        // The creator automatically becomes an ADMIN of the new project.
        await prisma.membership.create({
            data: {
                userId: req.user.id,
                projectId: newProject.id,
                role: 'ADMIN'
            }
        });

        res.status(201).json(newProject);

    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project.' });
    }
});

// PUT /api/v1/projects/:id - Update a project
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        name, description, applicationUrl, version, deploymentStatus, 
        repositoryUrl, ciCdPipelineUrl, projectType, dataClassification, 
        applicationCriticality, isExternallyExposed, communicationChannel, 
        documentationUrl, apiReferenceUrl, runbookUrl, threatModelUrl, 
        lastSecurityReview 
    } = req.body;

    // Authorization: User must be an ADMIN or EDITOR of the project to update it.
    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', id);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update this project.' });
    }

    try {
        const updatedProject = await prisma.project.update({
            where: { id },
            data: { 
                name, 
                description,
                applicationUrl,
                version,
                deploymentStatus,
                repositoryUrl,
                ciCdPipelineUrl,
                projectType,
                dataClassification,
                applicationCriticality,
                isExternallyExposed,
                communicationChannel,
                documentationUrl,
                apiReferenceUrl,
                runbookUrl,
                threatModelUrl,
                lastSecurityReview: lastSecurityReview ? new Date(lastSecurityReview) : null,
            }
        });
        res.status(200).json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project.' });
    }
});

// DELETE /api/v1/projects/:id - Delete a project
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    // Authorization: User must be an ADMIN of the project to delete it.
    const canDelete = await hasPermission(req.user, 'ADMIN', 'project', id);
    if (!canDelete) {
        return res.status(403).json({ error: 'You are not authorized to delete this project.' });
    }

    try {
        await prisma.project.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project.' });
    }
});

// GET /api/v1/projects/:id/members - Get all users with access to the project
router.get('/:id/members', async (req, res) => {
    const { id } = req.params;

    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', id);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this project.' });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                team: { include: { company: { include: { organization: true } } } }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        const orgId = project.team.company.organization.id;

        // Find all members of the parent organization
        const orgMemberships = await prisma.membership.findMany({
            where: { organizationId: orgId },
            include: { user: { select: { id: true, email: true } } }
        });
        
        // Get contacts already on the project to filter them out
        const projectContacts = await prisma.projectContact.findMany({
            where: { projectId: id },
            include: { contact: true }
        });
        const existingContactEmails = new Set(projectContacts.map(pc => pc.contact.email));

        const members = orgMemberships
            .map(m => m.user)
            .filter(user => user && !existingContactEmails.has(user.email));

        res.status(200).json(members);
    } catch (error) {
        console.error(`Error getting project members for project ${id}:`, error);
        res.status(500).json({ error: 'Failed to retrieve project members.' });
    }
});

// POST /api/v1/projects/:id/contacts - Add a contact to a project
router.post('/:id/contacts', async (req, res) => {
    const { id: projectId } = req.params;
    const { email, name, role } = req.body;

    if (!email || !name || !role) {
        return res.status(400).json({ error: 'Email, name, and role are required fields.' });
    }

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to add contacts to this project.' });
    }

    try {
        // Check if a user with this email exists in the system
        const user = await prisma.user.findUnique({ where: { email } });

        const contact = await prisma.contact.upsert({
            where: { email },
            update: { name }, // Update name if email already exists
            create: { 
                email, 
                name,
                userId: user ? user.id : null,
            },
        });

        // If the contact was just created and we found a user, connect them.
        if (user && !contact.userId) {
            await prisma.contact.update({
                where: { id: contact.id },
                data: { userId: user.id }
            });
        }

        // Check if this contact is already associated with the project
        const existingProjectContact = await prisma.projectContact.findFirst({
            where: { projectId, contactId: contact.id }
        });

        if (existingProjectContact) {
            return res.status(409).json({ error: `Contact with email ${contact.email} is already associated with this project.` });
        }

        const newContact = await prisma.projectContact.create({
            data: {
                projectId,
                contactId: contact.id,
                contactType: role,
            },
            include: {
                contact: true // Include the full contact details in the response
            }
        });

        res.status(201).json(newContact);

    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint violation
            return res.status(409).json({ error: `A contact with the role '${role}' already exists for this project.` });
        }
        console.error(`Error adding contact to project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to add contact.' });
    }
});

// PUT /api/v1/projects/:projectId/contacts/:contactId - Update a project contact
router.put('/:projectId/contacts/:contactId', async (req, res) => {
    const { projectId, contactId } = req.params;
    const { name, oldContactType, newContactType } = req.body;

    if (!name || !oldContactType || !newContactType) {
        return res.status(400).json({ error: 'Name, oldContactType, and newContactType are required.' });
    }

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update contacts for this project.' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update the name on the base Contact model
            await tx.contact.update({
                where: { id: contactId },
                data: { name },
            });

            // 2. If the role/type has changed, we must delete and recreate the ProjectContact
            if (oldContactType !== newContactType) {
                await tx.projectContact.delete({
                    where: {
                        projectId_contactId_contactType: {
                            projectId,
                            contactId,
                            contactType: oldContactType,
                        }
                    },
                });

                const newProjectContact = await tx.projectContact.create({
                    data: {
                        projectId,
                        contactId,
                        contactType: newContactType,
                    },
                    include: { contact: true },
                });
                return newProjectContact;
            } else {
                // 3. If only the name was changed, just return the existing record
                const existing = await tx.projectContact.findUnique({
                     where: {
                        projectId_contactId_contactType: {
                            projectId,
                            contactId,
                            contactType: oldContactType,
                        }
                    },
                    include: { contact: true },
                });
                return existing;
            }
        });
        res.status(200).json(result);
    } catch (error) {
         if (error.code === 'P2002') { // Unique constraint violation on create
            return res.status(409).json({ error: `A contact with the role '${newContactType}' already exists for this project.` });
        }
        console.error(`Error updating contact ${contactId} for project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to update contact.' });
    }
});

// DELETE /api/v1/projects/:id/contacts/:contactId/:contactType - Remove a contact from a project
router.delete('/:id/contacts/:contactId/:contactType', async (req, res) => {
    const { id: projectId, contactId, contactType } = req.params;

    if (!contactId || !contactType) {
        return res.status(400).json({ error: 'contactId and contactType are required.' });
    }

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to remove contacts from this project.' });
    }

    try {
        await prisma.projectContact.delete({
            where: {
                projectId_contactId_contactType: {
                    projectId,
                    contactId,
                    contactType,
                }
            },
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') { // Record to delete not found
            return res.status(404).json({ error: 'Contact not found for this project.' });
        }
        console.error(`Error removing contact from project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to remove contact.' });
    }
});

// --- Technology Management for a Project ---

// GET /api/v1/projects/:id/technologies - Get all technologies for a project
router.get('/:id/technologies', async (req, res) => {
    const { id: projectId } = req.params;

    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], 'project', projectId);
    if (!canView) {
        return res.status(403).json({ error: 'You are not authorized to view this project.' });
    }

    try {
        const technologies = await prisma.projectTechnology.findMany({
            where: { projectId },
            include: {
                technology: true
            }
        });
        res.status(200).json(technologies);
    } catch (error) {
        console.error(`Error getting technologies for project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve technologies.' });
    }
});

// POST /api/v1/projects/:id/technologies - Add a technology to a project
router.post('/:id/technologies', async (req, res) => {
    const { id: projectId } = req.params;
    const { name, type, version, technologyId, source } = req.body;

    if ((!name || !type) && !technologyId) {
        return res.status(400).json({ error: 'Technology name and type are required.' });
    }

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to add technologies to this project.' });
    }

    let technology; // Define here to be available in the catch block

    try {
        if (technologyId) {
            // Case 1: Adding a new version to an existing technology
            technology = await prisma.technology.findUnique({ where: { id: technologyId } });
            if (!technology) {
                return res.status(404).json({ error: 'The specified technology does not exist.' });
            }
        } else if (name && type) {
            // Case 2: Adding a new technology or a version of a potentially existing one
            // Upsert the technology: find it by name/type or create it if it doesn't exist
            technology = await prisma.technology.upsert({
                where: { name_type: { name, type } },
                update: {},
                create: { name, type },
            });
        } else {
            // If neither technologyId nor name/type is provided
            return res.status(400).json({ error: 'Either technologyId or both name and type are required.' });
        }
        
        // Now, create the link between the project and the technology
        const newProjectTechnology = await prisma.projectTechnology.create({
            data: {
                projectId,
                technologyId: technology.id,
                version,
                source: source || 'user-entered',
            },
            include: {
                technology: true, // Include the full technology details in the response
            },
        });

        res.status(201).json(newProjectTechnology);
    } catch (error) {
        if (error.code === 'P2002' && technology) {
            // Unique constraint violation
             return res.status(409).json({ error: `This project already has a record for technology '${technology.name}' (${technology.type}) with version '${version}'.` });
        }
        console.error(`Error adding technology to project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to add technology.' });
    }
});

// PUT /api/v1/projects/:id/technologies/:projectTechnologyId - Update a technology's version for a project
router.put('/:id/technologies/:projectTechnologyId', async (req, res) => {
    const { id: projectId, projectTechnologyId } = req.params;
    const { version } = req.body;

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update technologies for this project.' });
    }

    try {
        const updatedProjectTechnology = await prisma.projectTechnology.update({
            where: { 
                id: projectTechnologyId,
                projectId: projectId, // Extra check to ensure it belongs to the project
            },
            data: {
                version,
            },
            include: {
                technology: true,
            }
        });
        res.status(200).json(updatedProjectTechnology);
    } catch (error) {
        if (error.code === 'P2025') { // Record to update not found
            return res.status(404).json({ error: 'Technology association not found for this project.' });
        }
        if (error.code === 'P2002') { // Unique constraint violation
             return res.status(409).json({ error: `This project already has a record for this technology with version '${version}'.` });
        }
        console.error(`Error updating technology version for project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to update technology version.' });
    }
});

// DELETE /api/v1/projects/:id/technologies/:projectTechnologyId - Remove a technology from a project
router.delete('/:id/technologies/:projectTechnologyId', async (req, res) => {
    const { id: projectId, projectTechnologyId } = req.params;

    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', projectId);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to remove technologies from this project.' });
    }

    try {
        await prisma.projectTechnology.delete({
            where: { 
                id: projectTechnologyId,
                projectId: projectId, // Extra check
             }
        });
        res.status(204).send();
    } catch (error) {
        if (error.code === 'P2025') { // Record to delete not found
            return res.status(404).json({ error: 'Technology association not found.' });
        }
        console.error(`Error removing technology from project ${projectId}:`, error);
        res.status(500).json({ error: 'Failed to remove technology.' });
    }
});

// GET endpoint for company-wide project graph data
router.get('/graph', async (req, res) => {
    const { companyId } = req.query;
    const userId = req.user.id;

    if (!companyId) {
        return res.status(400).json({ error: 'A company ID is required.' });
    }

    // Authorize: Check if user is part of the company
    const isMember = await isMemberOfCompany(userId, companyId);
    if (!isMember) {
        return res.status(403).json({ error: 'You are not a member of this company.' });
    }

    try {
        const projects = await prisma.project.findMany({
            where: { team: { companyId: companyId } },
        });

        const relationships = await prisma.projectRelationship.findMany({
            where: { sourceProject: { team: { companyId: companyId } } },
        });

        const nodes = projects.map(project => ({
            id: project.id,
            type: 'default',
            data: { label: project.name },
            position: { x: Math.random() * 400, y: Math.random() * 400 },
        }));

        const edges = relationships.map(rel => ({
            id: rel.id,
            source: rel.sourceProjectId,
            target: rel.targetProjectId,
            label: rel.type,
            type: 'default',
            style: { strokeWidth: 4 },
            markerEnd: { type: 'arrowclosed', width: 25, height: 25 },
        }));

        res.json({ nodes, edges });
    } catch (error) {
        console.error('Failed to fetch company graph:', error);
        res.status(500).json({ error: 'Failed to fetch company graph data.' });
    }
});

// GET endpoint for project-specific "mini-graph"
router.get('/:id/graph', async (req, res) => {
    const { id: projectId } = req.params;
    const userId = req.user.id;

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { team: true },
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        const isMember = await isMemberOfCompany(userId, project.team.companyId);
        if (!isMember) {
            return res.status(403).json({ error: 'You are not authorized to view this project.' });
        }

        const relationships = await prisma.projectRelationship.findMany({
            where: {
                OR: [
                    { sourceProjectId: projectId },
                    { targetProjectId: projectId },
                ],
            },
        });

        const relatedProjectIds = new Set([projectId]);
        relationships.forEach(rel => {
            relatedProjectIds.add(rel.sourceProjectId);
            relatedProjectIds.add(rel.targetProjectId);
        });

        const relatedProjects = await prisma.project.findMany({
            where: { id: { in: [...relatedProjectIds] } },
        });

        const nodes = relatedProjects.map(p => ({
            id: p.id,
            type: 'default', // All nodes are default to have both handles
            data: { 
              label: p.name,
              isPrimary: p.id === projectId // Flag for styling the main project
            },
            position: { x: Math.random() * 250, y: Math.random() * 250 },
        }));

        const edges = relationships.map(rel => ({
            id: rel.id,
            source: rel.sourceProjectId,
            target: rel.targetProjectId,
            label: rel.type,
            style: { strokeWidth: 2 },
            markerEnd: { type: 'arrowclosed', width: 25, height: 25 },
        }));

        res.json({ nodes, edges });
    } catch (error) {
        console.error('Failed to fetch project graph:', error);
        res.status(500).json({ error: 'Failed to fetch project graph data.' });
    }
});

/**
 * @route GET /api/v1/projects/by-resource
 * @desc Get a flat list of all projects within a given resource's hierarchy
 * @access Private
 */
router.get('/by-resource', async (req, res) => {
    const { resourceType, resourceId } = req.query;

    if (!resourceType || !resourceId) {
        return res.status(400).json({ error: 'resourceType and resourceId query parameters are required.' });
    }

    // First, ensure the user has permission to view the parent resource
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], resourceType, resourceId);
    if (!canView) {
        return res.status(403).json({ error: `You are not authorized to view projects for this ${resourceType}.` });
    }

    try {
        let allProjectIds = [];
        
        if (resourceType === 'project') {
            allProjectIds = [resourceId];
        } else {
            const descendantIds = await getDescendants(resourceType, resourceId);
            allProjectIds = descendantIds.projectIds;
        }

        const projects = await prisma.project.findMany({
            where: {
                id: { in: allProjectIds }
            },
            select: {
                id: true,
                name: true,
                repositoryUrl: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.status(200).json(projects);

    } catch (error) {
        console.error(`Get projects for ${resourceType} error:`, error);
        res.status(500).json({ error: 'Failed to retrieve projects.' });
    }
});

/**
 * @route POST /api/v1/projects/:id/link-repo
 * @desc Link a repository to a project
 * @access Private
 */
router.post('/:id/link-repo', async (req, res) => {
    const { id } = req.params;
    const { repositoryUrl, scmIntegrationId } = req.body;

    if (!repositoryUrl || !scmIntegrationId) {
        return res.status(400).json({ error: 'repositoryUrl and scmIntegrationId are required.' });
    }
    
    // Authorization: Check if the user is an ADMIN or EDITOR of the project.
    const canUpdate = await hasPermission(req.user, ['ADMIN', 'EDITOR'], 'project', id);
    if (!canUpdate) {
        return res.status(403).json({ error: 'You are not authorized to update this project.' });
    }

    try {
        const updatedProject = await prisma.project.update({
            where: { id },
            data: { 
                repositoryUrl,
                scmIntegrationId,
            }
        });

        res.status(200).json(updatedProject);

    } catch (error) {
        console.error('Link repo error:', error);
        res.status(500).json({ error: 'Failed to link repository.' });
    }
});

export default router; 
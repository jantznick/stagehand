import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { getVisibleResourceIds, hasPermission } from '../utils/permissions.js';

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
                team: true,
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
    const { name, description, applicationUrl, version, deploymentStatus, repositoryUrl, ciCdPipelineUrl } = req.body;

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

export default router; 
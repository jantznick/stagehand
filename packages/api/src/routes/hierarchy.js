/**
 * @openapi
 * tags:
 *   - name: Hierarchy
 *     description: Organizational hierarchy navigation and structure
 * 
 * components:
 *   schemas:
 *     HierarchyItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [organization, company, team, project]
 *         isMember:
 *           type: boolean
 *           description: Whether the user is a direct member of this item
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     OrganizationHierarchy:
 *       allOf:
 *         - $ref: '#/components/schemas/HierarchyItem'
 *         - type: object
 *           properties:
 *             companies:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CompanyHierarchy'
 *     
 *     CompanyHierarchy:
 *       allOf:
 *         - $ref: '#/components/schemas/HierarchyItem'
 *         - type: object
 *           properties:
 *             teams:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TeamHierarchy'
 *     
 *     TeamHierarchy:
 *       allOf:
 *         - $ref: '#/components/schemas/HierarchyItem'
 *         - type: object
 *           properties:
 *             projects:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HierarchyItem'
 *     
 *     ProjectSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         repositoryUrl:
 *           type: string
 */

/**
 * @openapi
 * /api/v1/hierarchy:
 *   get:
 *     summary: Get user's accessible organizational hierarchy
 *     description: Returns the complete organizational hierarchy that the authenticated user has access to, structured as nested organizations, companies, teams, and projects
 *     tags: [Hierarchy]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Hierarchical structure of accessible organizations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OrganizationHierarchy'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/v1/hierarchy/{resourceType}/{resourceId}/projects:
 *   get:
 *     summary: Get all projects within a resource's hierarchy
 *     description: Returns a flat list of all projects within the specified resource's hierarchy
 *     tags: [Hierarchy]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [organization, company, team, project]
 *         description: Type of resource
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: List of projects within the resource hierarchy
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProjectSummary'
 *       403:
 *         description: Not authorized to view this resource
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

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/authMiddleware.js';
import { getAncestors, getDescendants } from '../utils/hierarchy.js';
import { getVisibleResourceIds, hasPermission } from '../utils/permissions.js';

const prisma = new PrismaClient();
const router = Router();

router.use(protect);

router.get('/', async (req, res) => {
    try {
        const user = req.user;

        // 1. Fetch all of the user's DIRECT memberships. These are the source of truth for permissions.
        const memberships = await prisma.membership.findMany({
            where: { userId: user.id },
            select: {
                organizationId: true,
                companyId: true,
                teamId: true,
                projectId: true,
            }
        });

        const directOrgIds = new Set(memberships.map(m => m.organizationId).filter(Boolean));
        const directCompanyIds = new Set(memberships.map(m => m.companyId).filter(Boolean));
        const directTeamIds = new Set(memberships.map(m => m.teamId).filter(Boolean));
        const directProjectIds = new Set(memberships.map(m => m.projectId).filter(Boolean));

        // 2. Fetch all DESCENDANTS of direct memberships. Any membership grants downward visibility.
        const descendantCompanyIds = new Set();
        if (directOrgIds.size > 0) {
            const companies = await prisma.company.findMany({ where: { organizationId: { in: [...directOrgIds] } }, select: { id: true } });
            companies.forEach(c => descendantCompanyIds.add(c.id));
        }

        const descendantTeamIds = new Set();
        const companyIdsForTeamSearch = [...new Set([...directCompanyIds, ...descendantCompanyIds])];
        if (companyIdsForTeamSearch.length > 0) {
            const teams = await prisma.team.findMany({ where: { companyId: { in: companyIdsForTeamSearch } }, select: { id: true } });
            teams.forEach(t => descendantTeamIds.add(t.id));
        }

        const descendantProjectIds = new Set();
        const teamIdsForProjectSearch = [...new Set([...directTeamIds, ...descendantTeamIds])];
        if (teamIdsForProjectSearch.length > 0) {
            const projects = await prisma.project.findMany({ where: { teamId: { in: teamIdsForProjectSearch } }, select: { id: true } });
            projects.forEach(p => descendantProjectIds.add(p.id));
        }

        // 3. This gives us the complete set of items the user has permission to see/access.
        const accessibleProjectIds = new Set([...directProjectIds, ...descendantProjectIds]);
        const accessibleTeamIds = new Set([...directTeamIds, ...descendantTeamIds]);
        const accessibleCompanyIds = new Set([...directCompanyIds, ...descendantCompanyIds]);
        const accessibleOrgIds = new Set(directOrgIds);

        // 4. Fetch ANCESTORS of all accessible items purely for UI context.
        // These do NOT grant permissions, they just build the tree structure.
        const ancestorTeamIds = new Set();
        if (accessibleProjectIds.size > 0) {
            const projects = await prisma.project.findMany({ where: { id: { in: [...accessibleProjectIds] } }, select: { teamId: true } });
            projects.forEach(p => p.teamId && ancestorTeamIds.add(p.teamId));
        }

        const ancestorCompanyIds = new Set();
        const teamsForCompanySearch = [...new Set([...accessibleTeamIds, ...ancestorTeamIds])];
        if (teamsForCompanySearch.length > 0) {
            const teams = await prisma.team.findMany({ where: { id: { in: teamsForCompanySearch } }, select: { companyId: true } });
            teams.forEach(t => t.companyId && ancestorCompanyIds.add(t.companyId));
        }
        
        const ancestorOrgIds = new Set();
        const companiesForOrgSearch = [...new Set([...accessibleCompanyIds, ...ancestorCompanyIds])];
        if (companiesForOrgSearch.length > 0) {
            const companies = await prisma.company.findMany({ where: { id: { in: companiesForOrgSearch } }, select: { organizationId: true } });
            companies.forEach(c => c.organizationId && ancestorOrgIds.add(c.organizationId));
        }

        // 5. Combine ACCESSIBLE and ANCESTOR IDs to get the final list of all models to fetch from the DB.
        const finalOrgIds = [...new Set([...accessibleOrgIds, ...ancestorOrgIds])];
        const finalCompanyIds = [...new Set([...accessibleCompanyIds, ...ancestorCompanyIds])];
        const finalTeamIds = [...new Set([...accessibleTeamIds, ...ancestorTeamIds])];
        const finalProjectIds = [...accessibleProjectIds];
        
        // 6. Fetch all the necessary data in one batch.
        const [allOrgs, allCompanies, allTeams, allProjects] = await Promise.all([
            prisma.organization.findMany({ where: { id: { in: finalOrgIds } } }),
            prisma.company.findMany({ where: { id: { in: finalCompanyIds } } }),
            prisma.team.findMany({ where: { id: { in: finalTeamIds } } }),
            prisma.project.findMany({ where: { id: { in: finalProjectIds } } })
        ]);

        // 7. Build the final hierarchy. Because we only fetched exactly what's needed,
        // this process automatically excludes any items (like sibling teams) the user shouldn't see.
        const projectMap = new Map(allProjects.map(p => [p.id, { 
            ...p, 
            type: 'project',
            isMember: directProjectIds.has(p.id) 
        }]));
        
        const teamMap = new Map(allTeams.map(t => {
            const projects = allProjects.filter(p => p.teamId === t.id);
            return [t.id, { 
                ...t, 
                type: 'team', 
                projects: projects.map(p => projectMap.get(p.id)).filter(Boolean),
                isMember: directTeamIds.has(t.id)
            }];
        }));

        const companyMap = new Map(allCompanies.map(c => {
            const teams = allTeams.filter(t => t.companyId === c.id);
            return [c.id, { ...c, type: 'company', teams: teams.map(t => teamMap.get(t.id)).filter(Boolean) }];
        }));

        const hierarchy = allOrgs.map(o => {
            const companies = allCompanies.filter(c => c.organizationId === o.id);
            return { ...o, type: 'organization', companies: companies.map(c => companyMap.get(c.id)).filter(Boolean) };
        });
        
        res.status(200).json(hierarchy);

    } catch (error) {
        console.error('Get hierarchy error:', error);
        res.status(500).json({ error: 'Failed to retrieve hierarchy.' });
    }
});

/**
 * @route GET /api/v1/:resourceType/:resourceId/projects
 * @desc Get a flat list of all projects within a given resource's hierarchy
 * @access Private
 */
router.get('/:resourceType/:resourceId/projects', async (req, res) => {
    const { resourceType, resourceId } = req.params;

    // First, ensure the user has permission to view the parent resource
    const canView = await hasPermission(req.user, ['ADMIN', 'EDITOR', 'READER'], resourceType, resourceId);
    if (!canView) {
        return res.status(403).json({ error: `You are not authorized to view this ${resourceType}.` });
    }

    try {
        const descendantIds = await getDescendants(resourceType, resourceId);
        
        let allProjectIds = [];

        if (resourceType === 'project') {
            allProjectIds = [resourceId];
        } else if (resourceType === 'team') {
            allProjectIds = descendantIds.projectIds;
        } else if (resourceType === 'company') {
            allProjectIds = descendantIds.projectIds;
        } else if (resourceType === 'organization') {
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

export default router; 
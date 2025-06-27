import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Gets all IDs of a given resource type that a user can see.
 * @param {object} user - The user object from req.user
 * @param {('organization'|'company'|'team'|'project')} resourceType - The type of resource.
 * @returns {Promise<string[]>} - A promise that resolves to an array of resource IDs.
 */
export async function getVisibleResourceIds(user, resourceType) {
    if (!user || !user.memberships) return [];

    const directIds = user.memberships
        .filter(m => m[`${resourceType}Id`])
        .map(m => m[`${resourceType}Id`]);

    if (resourceType === 'organization') {
        return directIds;
    }

    if (resourceType === 'company') {
        const orgIds = await getVisibleResourceIds(user, 'organization');
        const companiesInOrgs = await prisma.company.findMany({
            where: { organizationId: { in: orgIds } },
            select: { id: true }
        });
        return [...new Set([...directIds, ...companiesInOrgs.map(c => c.id)])];
    }
    
    if (resourceType === 'team') {
        const companyIds = await getVisibleResourceIds(user, 'company');
        const teamsInCompanies = await prisma.team.findMany({
            where: { companyId: { in: companyIds } },
            select: { id: true }
        });
        return [...new Set([...directIds, ...teamsInCompanies.map(t => t.id)])];
    }
    
    if (resourceType === 'project') {
        const teamIds = await getVisibleResourceIds(user, 'team');
        const projectsInTeams = await prisma.project.findMany({
            where: { teamId: { in: teamIds } },
            select: { id: true }
        });
        return [...new Set([...directIds, ...projectsInTeams.map(p => p.id)])];
    }

    return [];
}

/**
 * Checks if a user has a specific role on a resource or its parents.
 * @param {object} user - The user object from req.user
 * @param {('ADMIN'|'EDITOR'|'READER')|('ADMIN'|'EDITOR'|'READER')[]} roles - The role(s) to check for.
 * @param {('organization'|'company'|'team'|'project')} resourceType - The type of resource.
 * @param {string} resourceId - The ID of the resource.
 * @returns {Promise<boolean>} - A promise that resolves to true if the user has permission.
 */
export async function hasPermission(user, roles, resourceType, resourceId) {
    if (!user || !user.memberships) return false;

    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    // Direct membership check
    const hasDirectRole = user.memberships.some(m => 
        m[`${resourceType}Id`] === resourceId && requiredRoles.includes(m.role)
    );
    if (hasDirectRole) return true;

    // Check for ADMIN role on parent resources, which grants all permissions downwards.
    const parentChecks = {
        project: async () => {
            const project = await prisma.project.findUnique({ where: { id: resourceId }, select: { teamId: true } });
            return project ? await hasPermission(user, 'ADMIN', 'team', project.teamId) : false;
        },
        team: async () => {
            const team = await prisma.team.findUnique({ where: { id: resourceId }, select: { companyId: true } });
            return team ? await hasPermission(user, 'ADMIN', 'company', team.companyId) : false;
        },
        company: async () => {
            const company = await prisma.company.findUnique({ where: { id: resourceId }, select: { organizationId: true } });
            return company ? await hasPermission(user, 'ADMIN', 'organization', company.organizationId) : false;
        },
        organization: () => Promise.resolve(false) // No parent to check
    };
    
    return await parentChecks[resourceType]();
}

/**
 * Checks if a user is a member of a specific company, respecting hierarchy.
 * @param {string} userId - The ID of the user.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<boolean>} - True if the user has any role in the company, directly or implicitly.
 */
export async function isMemberOfCompany(userId, companyId) {
    if (!userId || !companyId) return false;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { memberships: true },
    });

    if (!user) return false;

    const visibleCompanyIds = await getVisibleResourceIds(user, 'company');
    return visibleCompanyIds.includes(companyId);
} 
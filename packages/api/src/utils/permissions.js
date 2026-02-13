import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Checks if a user has a specific permission for a given resource,
 * considering their direct roles and the roles of any teams they are in,
 * respecting the resource hierarchy.
 *
 * @param {object} user - The user object from req.user, must include memberships and teamMemberships.
 * @param {string} requiredPermission - The permission string to check for (e.g., 'project:update').
 * @param {string} resourceType - The type of resource ('organization', 'company', 'team', 'project').
 * @param {string} resourceId - The ID of the resource to check against.
 * @returns {Promise<boolean>} - True if the user has the permission, false otherwise.
 */
export async function checkPermission(user, requiredPermission, resourceType, resourceId) {
    if (!user || !user.id) return false;

    // 1. Get the full ancestry of the resource
    const ancestors = await getResourceAncestry(resourceType, resourceId);
    if (!ancestors) return false; // Resource not found

    // 2. Gather all relevant role IDs from the user's direct memberships and team memberships
    const userRoleIds = getUserRoleIdsForHierarchy(user, ancestors);
    const teamRoleIds = await getTeamRoleIdsForHierarchy(user, ancestors);
    const allRoleIds = [...new Set([...userRoleIds, ...teamRoleIds])];

    if (allRoleIds.length === 0) return false;

    // 3. Check if any of these roles contain the required permission
    const permissionCount = await prisma.role.count({
        where: {
            id: { in: allRoleIds },
            permissions: {
                some: {
                    action: requiredPermission
                }
            }
        }
    });

    return permissionCount > 0;
}

/**
 * Fetches the ancestry of a given resource.
 * @returns {Promise<object|null>} - An object containing the IDs of the resource and its parents, or null.
 */
async function getResourceAncestry(resourceType, resourceId) {
    let project, team, company, organization;

    if (resourceType === 'project') {
        project = await prisma.project.findUnique({
            where: { id: resourceId },
            include: { team: { include: { company: true } } }
        });
        if (!project) return null;
        team = project.team;
        company = team.company;
        organization = company.organization;
    } else if (resourceType === 'team') {
        team = await prisma.team.findUnique({
            where: { id: resourceId },
            include: { company: { include: { organization: true } } }
        });
        if (!team) return null;
        company = team.company;
        organization = company.organization;
    } else if (resourceType === 'company') {
        company = await prisma.company.findUnique({
            where: { id: resourceId },
            include: { organization: true }
        });
        if (!company) return null;
        organization = company.organization;
    } else if (resourceType === 'organization') {
        organization = { id: resourceId };
    } else {
        return null;
    }

    return {
        projectId: project?.id,
        teamId: team?.id,
        companyId: company?.id,
        organizationId: organization?.id
    };
}

/**
 * Gets role IDs from a user's direct memberships that apply to a given resource hierarchy.
 */
function getUserRoleIdsForHierarchy(user, ancestors) {
    return user.memberships
        .filter(m =>
            (m.organizationId && m.organizationId === ancestors.organizationId) ||
            (m.companyId && m.companyId === ancestors.companyId) ||
            (m.teamId && m.teamId === ancestors.teamId) ||
            (m.projectId && m.projectId === ancestors.projectId)
        )
        .map(m => m.roleId);
}

/**
 * Gets role IDs from the teams a user is in, for roles that apply to a given resource hierarchy.
 */
async function getTeamRoleIdsForHierarchy(user, ancestors) {
    const teamIds = user.teamMemberships.map(tm => tm.teamId);
    if (teamIds.length === 0) return [];

    const teamMemberships = await prisma.membership.findMany({
        where: {
            teamId: { in: teamIds },
            OR: [
                { organizationId: ancestors.organizationId },
                { companyId: ancestors.companyId },
                { teamId: ancestors.teamId },
                { projectId: ancestors.projectId }
            ].filter(Boolean)
        }
    });

    return teamMemberships.map(m => m.roleId);
}

/**
 * Gets all IDs of a given resource type that a user can see.
 */
export async function getVisibleResourceIds(user, resourceType) {
    if (!user || !user.id) return [];
    
    // Get all roles for the user and their teams
    const userRoleIds = user.memberships.map(m => m.roleId);
    const teamMemberships = await prisma.membership.findMany({
        where: { teamId: { in: user.teamMemberships.map(tm => tm.teamId) } }
    });
    const teamRoleIds = teamMemberships.map(m => m.roleId);
    const allRoleIds = [...new Set([...userRoleIds, ...teamRoleIds])];

    // Find all permissions for these roles that grant read access
    const readPermissions = await prisma.permission.findMany({
        where: {
            roles: { some: { id: { in: allRoleIds } } },
            action: { endsWith: ':read' }
        }
    });
    const readableResourceTypes = new Set(readPermissions.map(p => p.resourceType.toLowerCase()));

    if (!readableResourceTypes.has(resourceType)) {
        return [];
    }
    
    // For the given resource type, find all direct and inherited IDs
    const directIds = new Set();
    user.memberships.forEach(m => {
        if (m[`${resourceType}Id`]) {
            directIds.add(m[`${resourceType}Id`]);
        }
    });
    teamMemberships.forEach(m => {
        if (m[`${resourceType}Id`]) {
            directIds.add(m[`${resourceType}Id`]);
        }
    });

    const hierarchy = {
        project: { parent: 'team', child: null },
        team: { parent: 'company', child: 'projects' },
        company: { parent: 'organization', child: 'teams' },
        organization: { parent: null, child: 'companies' }
    };

    let parentResourceType = hierarchy[resourceType].parent;
    if (!parentResourceType) {
        return Array.from(directIds);
    }

    const parentIds = await getVisibleResourceIds(user, parentResourceType);

    if(parentIds.length === 0) {
        return Array.from(directIds);
    }
    
    const children = await prisma[resourceType].findMany({
        where: { [`${parentResourceType}Id`]: { in: parentIds } },
        select: { id: true }
    });
    
    children.forEach(c => directIds.add(c.id));
    
    return Array.from(directIds);
} 
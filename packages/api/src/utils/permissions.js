import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = ['ADMIN', 'EDITOR', 'READER'];

const roleLevels = {
  ADMIN: 3,
  EDITOR: 2,
  READER: 1,
};

/**
 * A new, more efficient and correct implementation of hasPermission.
 * This function fetches the resource's ancestry and the user's memberships in a single query.
 * @param {object} user - The user object from req.user
 * @param {('ADMIN'|'EDITOR'|'READER')|('ADMIN'|'EDITOR'|'READER')[]} requiredRoles - The role(s) to check for.
 * @param {('organization'|'company'|'team'|'project')} resourceType - The type of resource.
 * @param {string} resourceId - The ID of the resource.
 * @returns {Promise<boolean>} - A promise that resolves to true if the user has permission.
 */
export async function checkPermission(user, requiredRoles, resourceType, resourceId) {
    if (!user || !user.memberships) return false;

    const requiredRoleLevel = Math.min(...(Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]).map(r => roleLevels[r]));

    let resourceWithAncestors;
    try {
        switch (resourceType) {
            case 'project':
                resourceWithAncestors = await prisma.project.findUnique({
                    where: { id: resourceId },
                    select: { team: { select: { id: true, company: { select: { id: true, organizationId: true } } } } }
                });
                break;
            case 'team':
                resourceWithAncestors = await prisma.team.findUnique({
                    where: { id: resourceId },
                    select: { company: { select: { id: true, organizationId: true } } }
                });
                break;
            case 'company':
                resourceWithAncestors = await prisma.company.findUnique({
                    where: { id: resourceId },
                    select: { organizationId: true }
                });
                break;
            case 'organization':
                resourceWithAncestors = { id: resourceId };
                break;
            default:
                return false;
        }
    } catch (e) {
        console.error(`Error fetching resource for permission check`, e);
        return false;
    }

    if (!resourceWithAncestors) return false;

    const resourceIds = {
        projectId: null,
        teamId: null,
        companyId: null,
        organizationId: null,
    };

    if (resourceType === 'project') {
        resourceIds.projectId = resourceId;
        resourceIds.teamId = resourceWithAncestors.team?.id;
        resourceIds.companyId = resourceWithAncestors.team?.company?.id;
        resourceIds.organizationId = resourceWithAncestors.team?.company?.organizationId;
    } else if (resourceType === 'team') {
        resourceIds.teamId = resourceId;
        resourceIds.companyId = resourceWithAncestors.company?.id;
        resourceIds.organizationId = resourceWithAncestors.company?.organizationId;
    } else if (resourceType === 'company') {
        resourceIds.companyId = resourceId;
        resourceIds.organizationId = resourceWithAncestors.organizationId;
    } else if (resourceType === 'organization') {
        resourceIds.organizationId = resourceId;
    }

    const relevantMemberships = user.memberships.filter(m => 
        (m.projectId && m.projectId === resourceIds.projectId) ||
        (m.teamId && m.teamId === resourceIds.teamId) ||
        (m.companyId && m.companyId === resourceIds.companyId) ||
        (m.organizationId && m.organizationId === resourceIds.organizationId)
    );

    if (relevantMemberships.length === 0) return false;

    const highestRoleLevel = Math.max(...relevantMemberships.map(m => roleLevels[m.role]));

    return highestRoleLevel >= requiredRoleLevel;
}

/**
 * A more performant version of getVisibleResourceIds.
 * @param {object} user - The user object from req.user
 * @param {('organization'|'company'|'team'|'project')} resourceType - The type of resource.
 * @returns {Promise<string[]>} - A promise that resolves to an array of resource IDs.
 */
export async function getVisibleResourceIdsV2(user, resourceType) {
    if (!user || !user.memberships) return [];

    // 1. Get all unique organization IDs the user is a member of.
    const orgIds = [...new Set(user.memberships.filter(m => m.organizationId).map(m => m.organizationId))];
    if (resourceType === 'organization') return orgIds;

    // 2. Get all companies in those organizations, plus any companies the user is a direct member of.
    const companiesInOrgs = await prisma.company.findMany({
        where: { organizationId: { in: orgIds } },
        select: { id: true }
    });
    const directCompanyIds = user.memberships.filter(m => m.companyId).map(m => m.companyId);
    const companyIds = [...new Set([...companiesInOrgs.map(c => c.id), ...directCompanyIds])];
    if (resourceType === 'company') return companyIds;

    // 3. Get all teams in those companies, plus any teams the user is a direct member of.
    const teamsInCompanies = await prisma.team.findMany({
        where: { companyId: { in: companyIds } },
        select: { id: true }
    });
    const directTeamIds = user.memberships.filter(m => m.teamId).map(m => m.teamId);
    const teamIds = [...new Set([...teamsInCompanies.map(t => t.id), ...directTeamIds])];
    if (resourceType === 'team') return teamIds;

    // 4. Get all projects in those teams, plus any projects the user is a direct member of.
    const projectsInTeams = await prisma.project.findMany({
        where: { teamId: { in: teamIds } },
        select: { id: true }
    });
    const directProjectIds = user.memberships.filter(m => m.projectId).map(m => m.projectId);
    const projectIds = [...new Set([...projectsInTeams.map(p => p.id), ...directProjectIds])];
    if (resourceType === 'project') return projectIds;
    
    return [];
} 
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Gets the name of a specific resource.
 * @param {string} resourceType - The type of the resource (project, team, company, organization).
 * @param {string} resourceId - The ID of the resource.
 * @returns {Promise<string|null>} - The name of the resource, or null if not found.
 */
export const getMembershipDetails = async (resourceType, resourceId) => {
    if (!resourceType || !resourceId) {
        return null;
    }

    let resource;
    try {
        switch (resourceType) {
            case 'project':
                resource = await prisma.project.findUnique({ where: { id: resourceId }, select: { name: true } });
                break;
            case 'team':
                resource = await prisma.team.findUnique({ where: { id: resourceId }, select: { name: true } });
                break;
            case 'company':
                resource = await prisma.company.findUnique({ where: { id: resourceId }, select: { name: true } });
                break;
            case 'organization':
                resource = await prisma.organization.findUnique({ where: { id: resourceId }, select: { name: true } });
                break;
            default:
                console.warn(`Invalid resourceType provided to getMembershipDetails: ${resourceType}`);
                return null;
        }
        return resource?.name || null;
    } catch (error) {
        console.error(`Error in getMembershipDetails for ${resourceType}:${resourceId}`, error);
        return null;
    }
}; 
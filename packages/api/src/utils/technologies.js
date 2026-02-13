import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Adds a technology to a project. It handles both creating a new technology
 * and linking an existing one, along with associating a version.
 * @param {string} projectId - The ID of the project.
 * @param {object} techData - The technology data.
 * @param {string} [techData.technologyId] - The ID of an existing technology.
 * @param {string} [techData.name] - The name of the new technology.
 * @param {string} [techData.type] - The type of the new technology.
 * @param {string} [techData.version] - The version of the technology.
 * @param {string} [techData.source] - The source of the technology information.
 * @returns {Promise<object>} The new project-technology association.
 */
export async function addTechnologyToProject(projectId, { technologyId, name, type, version, source = 'user-entered' }) {
    if (!projectId) {
        throw new Error('Project ID is required.');
    }

    if (!technologyId && (!name || !type)) {
        throw new Error('Either technologyId or both name and type are required.');
    }

    let technology;

    if (technologyId) {
        technology = await prisma.technology.findUnique({ where: { id: technologyId } });
        if (!technology) {
            throw new Error('The specified technology does not exist.');
        }
    } else {
        technology = await prisma.technology.upsert({
            where: { name_type: { name, type } },
            update: {}, // No update needed if it exists
            create: { name, type },
        });
    }

    // Check if this technology version is already associated with the project
    const existingProjectTech = await prisma.projectTechnology.findFirst({
        where: {
            projectId,
            technologyId: technology.id,
            version: version || null, // Handle case where version is not provided
        },
    });

    if (existingProjectTech) {
        // If it already exists, you can either throw an error or return the existing one.
        // Throwing an error is often better to signal that no new record was created.
        throw new Error(`This technology version (${technology.name}${version ? `@${version}` : ''}) already exists in the project.`);
    }

    const newProjectTechnology = await prisma.projectTechnology.create({
        data: {
            projectId,
            technologyId: technology.id,
            version: version, // Allow null version
            source: source,
        },
        include: {
            technology: true,
        },
    });

    return newProjectTechnology;
}



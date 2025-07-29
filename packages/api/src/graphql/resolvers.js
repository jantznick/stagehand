import { PrismaClient } from '@prisma/client';
import { checkPermission } from '../utils/permissions.js';

const prisma = new PrismaClient();

const roleLevels = {
    ADMIN: 3,
    EDITOR: 2,
    READER: 1,
};

export const resolvers = {
    Query: {
        project: async (_, { id }, { user }) => {
            if (!user) {
                throw new Error('You must be logged in to do that.');
            }

            const canView = await checkPermission(user, ['ADMIN', 'EDITOR', 'READER'], 'project', id);
            if (!canView) {
                throw new Error('You are not authorized to view this project.');
            }

            return prisma.project.findUnique({ where: { id } });
        },
    },
    Project: {
        userPermission: async (project, _, { user }) => {
            if (!user) return null;

            const hasAdminAccess = await checkPermission(user, 'ADMIN', 'project', project.id);
            if (hasAdminAccess) {
                return { role: 'ADMIN', hasAdminAccess: true, hasEditorAccess: true, hasReaderAccess: true };
            }

            const hasEditorAccess = await checkPermission(user, 'EDITOR', 'project', project.id);
            if (hasEditorAccess) {
                return { role: 'EDITOR', hasAdminAccess: false, hasEditorAccess: true, hasReaderAccess: true };
            }

            const hasReaderAccess = await checkPermission(user, 'READER', 'project', project.id);
            if (hasReaderAccess) {
                return { role: 'READER', hasAdminAccess: false, hasEditorAccess: false, hasReaderAccess: true };
            }

            return null;
        }
    }
}; 
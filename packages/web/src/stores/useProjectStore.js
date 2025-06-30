import { create } from 'zustand';
import useHierarchyStore from './useHierarchyStore';

const useProjectStore = create((set) => ({
    isLoading: false,
    error: null,
    repoStats: null,
    isStatsLoading: false,
    statsError: null,

    // Create a new project
    createProject: async (projectData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/v1/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create project');
            }
            const newProject = await response.json();
            set({ isLoading: false });
            return newProject;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Update an existing project
    updateProject: async (id, projectData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData),
            });
            if (!response.ok) {
                 const err = await response.json();
                throw new Error(err.error || 'Failed to update project');
            }
            const updatedProject = await response.json();
            set({ isLoading: false });
            return updatedProject;
        } catch (error) {
            set({ error: error.message, isLoading: false });
             throw error;
        }
    },

    // Delete a project
    deleteProject: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/projects/${id}`, {
                method: 'DELETE',
            });
             if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete project');
            }
            set({ isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
             throw error;
        }
    },

    reset: () => set({ isLoading: false, error: null, repoStats: null, isStatsLoading: false, statsError: null }),

    fetchRepoStats: async (projectId) => {
        set({ isStatsLoading: true, statsError: null });
        try {
            const response = await fetch(`/api/v1/projects/${projectId}/repo-stats`);
            
            if (response.status === 404) {
                // This is an expected case, not an error. Project just isn't linked.
                set({ repoStats: null, isStatsLoading: false });
                return;
            }

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to fetch repository stats');
            }
            const stats = await response.json();
            set({ repoStats: stats, isStatsLoading: false });
        } catch (error) {
            set({ statsError: error.message, isStatsLoading: false });
        }
    },

    linkRepositoryToProject: async (projectId, repoData) => {
        try {
            const response = await fetch(`/api/v1/projects/${projectId}/link-repo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(repoData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to link repo to project');
            }
            // Optimistically update the store or trigger a refetch
            useHierarchyStore.getState().fetchAndSetSelectedItem('project', projectId);
        } catch (error) {
            console.error("Failed to link repo to project:", error);
            throw error;
        }
    },

    linkSecurityToolToProject: async (projectId, linkData) => {
        try {
            const response = await fetch(`/api/v1/projects/${projectId}/link-security-tool`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(linkData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to link security tool to project');
            }
            // Optimistically update the store or trigger a refetch
            useHierarchyStore.getState().fetchAndSetSelectedItem('project', projectId);
        } catch (error) {
            console.error("Failed to link security tool to project:", error);
            throw error;
        }
    },
}));

export default useProjectStore; 
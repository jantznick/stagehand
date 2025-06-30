import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

const useIntegrationStore = create((set, get) => ({
  integrations: [],
  securityToolIntegrations: [],
  fetchedResourceIds: new Set(), // To avoid re-fetching
  loading: false,
  error: null,
  syncLogs: {}, // Object to store logs per integration ID
  isLogsLoading: false,

  clearIntegrations: () => set({ integrations: [], fetchedResourceIds: new Set() }),

  connectGitHub: async (resourceType, resourceId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/v1/integrations/github/auth-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resourceType, resourceId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to start GitHub connection');
      }

      const { installUrl } = await response.json();
	  console.log(installUrl);
      // Redirect the user to GitHub to authorize the app
      window.location.href = installUrl;

    } catch (error) {
      set({ loading: false, error: error.message });
      console.error("Failed to connect GitHub:", error);
    }
  },

  fetchIntegrations: async (resourceType, resourceId) => {
    set({ loading: true, error: null });
    try {
      // Fetch SCM Integrations
      const scmRes = await fetch(`/api/v1/integrations?resourceType=${resourceType}&resourceId=${resourceId}`);
      if (!scmRes.ok) throw new Error('Failed to fetch SCM integrations');
      const scmIntegrations = await scmRes.json();
      set({ integrations: scmIntegrations });

      // Fetch Security Tool Integrations
      const securityRes = await fetch(`/api/v1/security-tools?resourceType=${resourceType}&resourceId=${resourceId}`);
      if (!securityRes.ok) throw new Error('Failed to fetch security tool integrations');
      const securityToolIntegrations = await securityRes.json();
      set({ securityToolIntegrations });

    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchSyncLogs: async (integrationId, integrationType) => {
    set({ isLogsLoading: true, error: null });
    try {
        const url = integrationType === 'SCM'
            ? `/api/v1/integrations/${integrationId}/sync-logs`
            : `/api/v1/security-tools/${integrationId}/sync-logs`;
        
        const response = await fetch(url);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to fetch sync logs');
        }
        const logs = await response.json();
        set(state => ({
            syncLogs: { ...state.syncLogs, [integrationId]: logs },
            isLogsLoading: false,
        }));
    } catch (error) {
        set({ error: error.message, isLogsLoading: false });
        console.error('Failed to fetch sync logs:', error);
    }
  },

  fetchSnykProjects: async (integrationId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/security-tools/${integrationId}/snyk/projects`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch Snyk projects');
      }
      return await response.json(); // Return the data
    } catch (error) {
      set({ error: error.message });
      console.error("Failed to fetch Snyk projects:", error);
      return []; // Return empty array on error
    } finally {
      set({ loading: false });
    }
  },

  addSnykIntegration: async (integrationData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/v1/security-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integrationData),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add Snyk integration');
      }
      const newIntegration = await response.json();
      set(state => ({
        securityToolIntegrations: [...state.securityToolIntegrations, newIntegration],
      }));
    } catch (error) {
      set({ error: error.message });
      console.error("Failed to add Snyk integration:", error);
    } finally {
      set({ loading: false });
    }
  },

  disconnectIntegration: async (integrationId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/integrations/${integrationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to disconnect integration');
      }
      set(state => ({
        integrations: state.integrations.filter(i => i.id !== integrationId),
      }));
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  syncSecurityToolIntegration: async (integrationId, resourceType, resourceId) => {
    set({ loading: true, error: null });
    try {
        const linkedProjects = await get().fetchLinkedProjects(integrationId, resourceType, resourceId);
        const projectIds = linkedProjects.map(p => p.id);

        if (projectIds.length === 0) {
            console.log("No projects linked to this integration. Nothing to sync.");
            // Optionally, set a non-error message in the store for the UI
            return;
        }

        const response = await fetch(`/api/v1/security-tools/${integrationId}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectIds }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to initiate sync');
        }
    } catch (error) {
        set({ error: error.message });
        console.error("Failed to sync security tool integration:", error);
    } finally {
        set({ loading: false });
    }
  },

  fetchLinkedProjects: async (integrationId, resourceType, resourceId) => {
    try {
      const response = await fetch(`/api/v1/${resourceType}/${resourceId}/projects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects for the resource.');
      }
      const projects = await response.json();
      // Now filter these relevant projects to find the ones linked to the specific integration
      return projects.filter(p => p.securityToolIntegrationId === integrationId);
    } catch (error) {
        console.error('Failed to fetch linked projects:', error);
        set({ error: error.message });
        return [];
    }
  },
}));

export default useIntegrationStore; 
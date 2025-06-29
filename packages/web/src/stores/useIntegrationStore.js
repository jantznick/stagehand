import { create } from 'zustand';

const useIntegrationStore = create((set, get) => ({
  integrations: [],
  fetchedResourceIds: new Set(), // To avoid re-fetching
  loading: false,
  error: null,

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
    if (!resourceId || get().fetchedResourceIds.has(resourceId)) {
        return; // Don't fetch if null or already fetched
    }

    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/integrations?resourceType=${resourceType}&resourceId=${resourceId}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch integrations');
      }
      const newIntegrations = await response.json();
      
      set(state => {
        const existingIds = new Set(state.integrations.map(i => i.id));
        const uniqueNewIntegrations = newIntegrations.filter(i => !existingIds.has(i.id));
        
        return { 
          integrations: [...state.integrations, ...uniqueNewIntegrations], 
          loading: false,
          fetchedResourceIds: new Set(state.fetchedResourceIds).add(resourceId)
        };
      });

    } catch (error) {
      set({ loading: false, error: error.message });
      console.error("Failed to fetch integrations:", error);
    }
  },

  disconnectIntegration: async (integrationId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/v1/integrations/${integrationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to disconnect integration');
      }

      set(state => ({
        integrations: state.integrations.filter(i => i.id !== integrationId),
        loading: false
      }));

    } catch (error) {
      set({ loading: false, error: error.message });
      console.error("Failed to disconnect integration:", error);
    }
  },
}));

export default useIntegrationStore; 
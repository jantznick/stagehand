import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useFindingStore = create(
  immer((set) => ({
    // Findings state
    findings: {}, // Store findings per project
    lastFetched: {}, // Store timestamps per project

    // Loading states
    isLoading: false,
    isSearching: false,
    isCreating: false,

    // Error states
    error: null,
    searchError: null,
    createError: null,

    // Search state
    searchResults: [],

    fetchFindings: async (projectId) => {
      if (!projectId) return;

      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await fetch(`/api/v1/projects/${projectId}/findings`);

        if (!response.ok) {
          throw new Error('Failed to fetch findings');
        }

        const findingsData = await response.json();

        set((state) => {
          state.findings[projectId] = findingsData;
          state.isLoading = false;
          state.lastFetched[projectId] = new Date(); // Set timestamp for the specific project
        });
      } catch (error) {
        set((state) => {
          state.error = error.message;
          state.isLoading = false;
        });
        console.error('Error fetching findings:', error);
      }
    },

    syncFindings: async (integrationId, projectIds) => {
        set((state) => {
            state.isLoading = true;
            state.error = null;
        });

        try {
            const response = await fetch(`/api/v1/integrations/${integrationId}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ projectIds }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to initiate sync');
            }

            // Optionally, you could return a success message or handle the 202 response
            set((state) => {
                state.isLoading = false;
            });

            return { success: true, message: 'Sync process initiated.' };

        } catch (error) {
            set((state) => {
                state.error = error.message;
                state.isLoading = false;
            });
            console.error('Error syncing findings:', error);
            return { success: false, error: error.message };
        }
    },

    // Search vulnerabilities
    searchVulnerabilities: async (query) => {
      if (!query || query.length < 3) return;

      set((state) => {
        state.isSearching = true;
        state.searchError = null;
      });

      try {
        const response = await fetch(`/api/v1/vulnerabilities/search?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
          throw new Error('Failed to search vulnerabilities');
        }

        const { vulnerabilities } = await response.json();

        set((state) => {
          state.searchResults = vulnerabilities;
          state.isSearching = false;
        });
      } catch (error) {
        set((state) => {
          state.searchError = error.message;
          state.isSearching = false;
        });
        console.error('Error searching vulnerabilities:', error);
      }
    },

    // Look up external vulnerability by ID
    lookupExternalVulnerability: async (id) => {
      set((state) => {
        state.isSearching = true;
        state.searchError = null;
      });

      try {
        const response = await fetch(`/api/v1/vulnerabilities/external/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to lookup vulnerability');
        }

        const vulnerability = await response.json();

        set((state) => {
          state.isSearching = false;
          // Add to search results so it can be selected
          state.searchResults = [vulnerability];
        });

        return vulnerability;
      } catch (error) {
        set((state) => {
          state.searchError = error.message;
          state.isSearching = false;
        });
        console.error('Error looking up vulnerability:', error);
        return null;
      }
    },

    // Create a manual finding
    createFinding: async (projectId, findingData) => {
      if (!projectId || !findingData) return null;

      set((state) => {
        state.isCreating = true;
        state.createError = null;
      });

      try {
        const response = await fetch(`/api/v1/projects/${projectId}/findings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(findingData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create finding');
        }

        const finding = await response.json();

        set((state) => {
          // Add the new finding to the project's findings list
          if (!state.findings[projectId]) {
            state.findings[projectId] = [];
          }
          state.findings[projectId].unshift(finding);
          state.isCreating = false;
        });

        return finding;
      } catch (error) {
        set((state) => {
          state.createError = error.message;
          state.isCreating = false;
        });
        console.error('Error creating finding:', error);
        return null;
      }
    },

    // Clear search results and errors
    clearSearch: () => {
      set((state) => {
        state.searchResults = [];
        state.searchError = null;
        state.isSearching = false;
      });
    }
  }))
);

export default useFindingStore; 
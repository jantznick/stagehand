import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useFindingStore = create(
  immer((set) => ({
    findings: {}, // Store findings per project
    isLoading: false,
    error: null,
    lastFetched: {}, // Changed to an object to store timestamps per project

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
    }
  }))
);

export default useFindingStore; 
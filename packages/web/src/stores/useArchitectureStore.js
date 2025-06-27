import { create } from 'zustand';

const useArchitectureStore = create((set, get) => ({
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,
  // context can be { type: 'company', id: '...' } or { type: 'project', id: '...' }
  context: null, 

  fetchCompanyGraph: async (companyId) => {
    set({ isLoading: true, error: null, context: { type: 'company', id: companyId } });
    try {
      const response = await fetch(`/api/v1/projects/graph?companyId=${companyId}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch company graph');
      }
      const { nodes, edges } = await response.json();
      set({ nodes, edges, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchProjectGraph: async (projectId) => {
    set({ isLoading: true, error: null, context: { type: 'project', id: projectId } });
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/graph`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch project graph');
      }
      const { nodes, edges } = await response.json();
      set({ nodes, edges, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createRelationship: async (companyId, relationshipData) => {
    try {
      const response = await fetch(`/api/v1/relationships?companyId=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relationshipData),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || err.error || 'Failed to create relationship');
      }
      const newRelationship = await response.json();
      
      // After creating, intelligently refresh the graph to get any new nodes
      const { context } = get();
      if (context?.type === 'project') {
        get().fetchProjectGraph(context.id);
      } else if (context?.type === 'company') {
        get().fetchCompanyGraph(context.id);
      } else {
        // Fallback if context is lost (should be rare)
        const newEdge = {
          id: newRelationship.id,
          source: newRelationship.sourceProjectId,
          target: newRelationship.targetProjectId,
          label: newRelationship.type,
          markerEnd: { type: 'arrowclosed' },
        };
        set((state) => ({ edges: [...state.edges, newEdge] }));
      }
    } catch (error) {
      throw error;
    }
  },

  deleteRelationship: async (companyId, relationshipId) => {
    try {
      const response = await fetch(`/api/v1/relationships/${relationshipId}?companyId=${companyId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || err.error || 'Failed to delete relationship');
      }
      
      set((state) => ({
        edges: state.edges.filter((edge) => edge.id !== relationshipId),
      }));

      // After deleting, intelligently refresh the graph to remove edge and any orphaned nodes
      const { context } = get();
      if (context?.type === 'project') {
        get().fetchProjectGraph(context.id);
      } else if (context?.type === 'company') {
        get().fetchCompanyGraph(context.id);
      }
    } catch (error) {
      throw error;
    }
  },
}));

export default useArchitectureStore; 
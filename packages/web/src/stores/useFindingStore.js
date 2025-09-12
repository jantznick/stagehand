import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useFindingStore = create(devtools((set, get) => ({
    // State for displaying findings
    findings: [],
    isLoading: false,
    error: null,

    // State for creating/searching findings
    vulnerabilitySearchResults: [],
    isSearching: false,
    searchError: null,
    isCreating: false,
    createError: null,

    // --- Actions ---

    /**
     * Fetches all findings for a given project.
     * @param {string} projectId - The ID of the project.
     */
    fetchFindings: async (projectId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`/api/v1/projects/${projectId}/findings`);
            if (!response.ok) {
                throw new Error('Failed to fetch findings.');
            }
            const findings = await response.json();
            set({ findings, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    /**
     * Searches for vulnerabilities in the local database.
     * @param {string} query - The search query.
     */
    searchVulnerabilities: async (query) => {
        if (!query) {
            set({ vulnerabilitySearchResults: [], isSearching: false });
            return;
        }
        set({ isSearching: true, searchError: null });
        try {
            const response = await fetch(`/api/v1/vulnerabilities/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Failed to search vulnerabilities.');
            }
            const data = await response.json();
            set({ vulnerabilitySearchResults: data.vulnerabilities, isSearching: false });
        } catch (error) {
            set({ searchError: error.message, isSearching: false });
        }
    },

    /**
     * Looks up a single vulnerability from an external source.
     * @param {string} cveId - The CVE ID to look up.
     * @returns {Promise<object|null>} The vulnerability data or null if an error occurs.
     */
    lookupExternalVulnerability: async (cveId) => {
        set({ isSearching: true, searchError: null });
        try {
            const response = await fetch(`/api/v1/vulnerabilities/external/${cveId}`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to look up external vulnerability.');
            }
            const vulnerability = await response.json();
            set({ isSearching: false });
            return vulnerability;
        } catch (error) {
            set({ searchError: error.message, isSearching: false });
            return null;
        }
    },

    /**
     * Creates a new manual finding for a project.
     * @param {string} projectId - The ID of the project.
     * @param {object} findingData - The data for the new finding.
     */
    createManualFinding: async (projectId, findingData) => {
        set({ isCreating: true, createError: null });
        try {
            const response = await fetch(`/api/v1/projects/${projectId}/findings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(findingData),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to create finding.');
            }
            const newFinding = await response.json();
            set((state) => ({
                findings: [newFinding, ...state.findings],
                isCreating: false,
            }));
        } catch (error) {
            set({ createError: error.message, isCreating: false });
        }
    },

    /**
     * Clears the search results and errors.
     */
    clearSearch: () => {
        set({ vulnerabilitySearchResults: [], searchError: null, isSearching: false });
    },
}));

export default useFindingStore;
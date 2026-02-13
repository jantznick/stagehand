import { create } from 'zustand';

/**
 * Zustand store for managing instance-specific (organization) state.
 * This includes the organization's details and its feature entitlements.
 */
const useInstanceStore = create((set) => ({
    // The organization's ID
    id: null,
    // The organization's name
    name: null,
    // A map of feature keys to their status (e.g., { 'sast-scanning': 'ACTIVE' })
    features: {},
    // A flag to indicate if the instance data has been loaded
    isInstanceLoaded: false,

    /**
     * Sets the instance data. Called after successfully fetching data from the backend.
     * @param {object} instanceData - The organization data from the API.
     * @param {string} instanceData.id - The organization's ID.
     * @param {string} instanceData.name - The organization's name.
     * @param {object} instanceData.features - The feature map.
     */
    setInstance: (instanceData) => set({
        id: instanceData.id,
        name: instanceData.name,
        features: instanceData.features || {},
        isInstanceLoaded: true,
    }),

    /**
     * Resets the store to its initial state. Called on logout.
     */
    clearInstance: () => set({
        id: null,
        name: null,
        features: {},
        isInstanceLoaded: false,
    }),
}));

export default useInstanceStore;

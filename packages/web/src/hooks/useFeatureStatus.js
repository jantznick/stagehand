import useInstanceStore from '../stores/useInstanceStore';

/**
 * A hook to check the status of a specific feature for the current organization.
 * 
 * @param {string} featureKey The unique key for the feature (e.g., 'sast-scanning').
 * @returns {'ACTIVE' | 'PROMO' | 'DISABLED'} The status of the feature. Defaults to 'DISABLED'.
 */
export const useFeatureStatus = (featureKey) => {
  const features = useInstanceStore(state => state.features);
  
  if (!featureKey) {
    return 'DISABLED';
  }

  return features[featureKey] || 'DISABLED';
};

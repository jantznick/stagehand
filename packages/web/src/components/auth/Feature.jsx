import React from 'react';
import { useFeatureStatus } from '../../hooks/useFeatureStatus';

/**
 * A component that acts as a guard for feature-flagged UI elements.
 * It conditionally renders its children based on the status of a feature.
 *
 * @param {object} props
 * @param {string} props.feature The unique key for the feature to check (e.g., 'sast-scanning').
 * @param {React.ReactNode} [props.active] The content to render if the feature status is 'ACTIVE'.
 * @param {React.ReactNode} [props.promo] The content to render if the feature status is 'PROMO'.
 * @param {React.ReactNode} [props.disabled] The content to render if the feature is 'DISABLED'. If not provided, nothing is rendered.
 * @returns {React.ReactNode | null}
 */
export const Feature = ({ feature, active, promo, disabled }) => {
  const status = useFeatureStatus(feature);

  switch (status) {
    case 'ACTIVE':
      return active || null;
    case 'PROMO':
      return promo || null;
    case 'DISABLED':
      return disabled || null;
    default:
      return null;
  }
};

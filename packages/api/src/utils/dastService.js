import { DastScannerBase } from './dastScannerBase.js';
import { ZapScanner } from './zapScanner.js';

// Re-export the base class for convenience
export { DastScannerBase };

/**
 * Factory function to create scanner instances
 * @param {string} provider - Scanner provider name (e.g., 'OWASP_ZAP', 'BURP_SUITE')
 * @param {object} config - Scanner configuration
 * @returns {DastScannerBase} - Scanner instance
 */
export const createDastScanner = async (provider, config = {}) => {
  switch (provider.toUpperCase()) {
    case 'OWASP_ZAP':
      return new ZapScanner(config);
    
    case 'BURP_SUITE':
      // Future implementation
      throw new Error('Burp Suite scanner not yet implemented');
    
    case 'ACUNETIX':
      // Future implementation
      throw new Error('Acunetix scanner not yet implemented');
    
    default:
      throw new Error(`Unsupported DAST provider: ${provider}`);
  }
};

/**
 * Get list of supported DAST providers
 * @returns {string[]} - Array of supported provider names
 */
export const getSupportedProviders = () => {
  return ['OWASP_ZAP'];
}; 
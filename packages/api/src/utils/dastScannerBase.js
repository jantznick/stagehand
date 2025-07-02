/**
 * Abstract base class for DAST scanners
 * All DAST scanner implementations should extend this class
 */
export class DastScannerBase {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Start a DAST scan on the target URL
   * @param {string} targetUrl - The URL to scan
   * @param {object} scanConfig - Scanner-specific configuration
   * @returns {Promise<object>} - Scan result with scanId and status
   */
  async startScan(targetUrl, scanConfig = {}) {
    throw new Error('startScan method must be implemented by scanner');
  }

  /**
   * Get the current status of a running scan
   * @param {string} scanId - The scan identifier
   * @returns {Promise<object>} - Scan status and progress information
   */
  async getScanStatus(scanId) {
    throw new Error('getScanStatus method must be implemented by scanner');
  }

  /**
   * Get the results of a completed scan
   * @param {string} scanId - The scan identifier
   * @returns {Promise<object>} - Scan results including findings
   */
  async getScanResults(scanId) {
    throw new Error('getScanResults method must be implemented by scanner');
  }

  /**
   * Cancel a running scan
   * @param {string} scanId - The scan identifier
   * @returns {Promise<boolean>} - Success status
   */
  async cancelScan(scanId) {
    throw new Error('cancelScan method must be implemented by scanner');
  }

  /**
   * Check if the scanner service is available
   * @returns {Promise<boolean>} - Service availability
   */
  async isAvailable() {
    throw new Error('isAvailable method must be implemented by scanner');
  }
} 
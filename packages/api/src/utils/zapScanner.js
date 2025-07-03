import { DastScannerBase } from './dastScannerBase.js';

/**
 * OWASP ZAP scanner implementation
 */
export class ZapScanner extends DastScannerBase {
  constructor(config = {}) {
    super(config);
    this.zapApiUrl = process.env.ZAP_API_URL || 'http://zap:8080';
    // Only use API key if it's set and not the placeholder value
    this.zapApiKey = (process.env.ZAP_API_KEY && process.env.ZAP_API_KEY !== 'auto-generated-key') 
      ? process.env.ZAP_API_KEY 
      : null;
    this.scanTimeout = parseInt(process.env.ZAP_SCAN_TIMEOUT) || 3600;
    
    console.log(`ZAP Scanner initialized: ${this.zapApiUrl}, API Key: ${this.zapApiKey ? 'configured' : 'disabled'}`);
  }

  /**
   * Make a request to the ZAP API
   * @param {string} endpoint - API endpoint
   * @param {object} params - Query parameters
   * @returns {Promise<object>} - API response
   */
  async zapApiRequest(endpoint, params = {}) {
    const url = new URL(`${this.zapApiUrl}${endpoint}`);
    
    // Add API key to parameters if configured
    if (this.zapApiKey) {
      params.apikey = this.zapApiKey;
    }
    
    // Add all parameters to URL (only if they have values)
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    console.log(`ZAP API Request: ${url.toString()}`);
    console.log(`ZAP API Params sent:`, Object.keys(params).length ? params : 'none');

    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`ZAP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code && data.code !== 'OK') {
        throw new Error(`ZAP API error: ${data.message || data.code}`);
      }

      return data;
    } catch (error) {
      console.error('ZAP API request failed:', error);
      throw error;
    }
  }

  /**
   * Check if ZAP service is available
   * @returns {Promise<boolean>} - Service availability
   */
  async isAvailable(retries = 3, retryDelay = 5000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.zapApiRequest('/JSON/core/view/version/');
        if (response.version) {
          console.log(`ZAP is available (attempt ${attempt}/${retries})`);
          return true;
        }
      } catch (error) {
        console.error(`ZAP availability check failed (attempt ${attempt}/${retries}):`, error.message);
        
        if (attempt < retries) {
          console.log(`Waiting ${retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    console.error(`ZAP is not available after ${retries} attempts`);
    return false;
  }

  /**
   * Start a DAST scan on the target URL
   * @param {string} targetUrl - The URL to scan
   * @param {object} scanConfig - ZAP-specific configuration
   * @returns {Promise<object>} - Scan result with scanId and status
   */
  async startScan(targetUrl, scanConfig = {}) {
          console.log(`🚀 Enhanced startScan called for ${targetUrl} with config:`, scanConfig);
      
      // First, check if ZAP is available
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        throw new Error('ZAP scanner service is not available');
      }

      try {
      // Step 1: Access the URL to add it to ZAP's site tree
      console.log(`Adding target URL to ZAP: ${targetUrl}`);
      await this.zapApiRequest('/JSON/core/action/accessUrl/', {
        url: targetUrl,
        followRedirects: 'true'
      });

      // Wait a moment for the URL to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Configure spider settings based on scan config
      console.log(`🔧 Step 2: Configuring spider settings...`);
      const spiderConfig = this.getSpiderConfig(scanConfig);
      console.log(`Spider config:`, spiderConfig);
      
      // Set spider depth
      if (spiderConfig.maxDepth) {
        await this.zapApiRequest('/JSON/spider/action/setOptionMaxDepth/', {
          Integer: spiderConfig.maxDepth
        });
      }

      // Set spider thread count for performance
      await this.zapApiRequest('/JSON/spider/action/setOptionThreadCount/', {
        Integer: spiderConfig.threadCount || 4
      });

      // Step 2.5: Disable problematic passive scan rules that cause CPU spikes
      console.log(`🔧 Step 2.5: Disabling problematic passive scan rules...`);
      await this.disableProblematicPassiveScanRules();

      // Step 3: Start spider to discover all pages
      console.log(`🕷️ Step 3: Starting spider crawl on: ${targetUrl}`);
      const spiderResponse = await this.zapApiRequest('/JSON/spider/action/scan/', {
        url: targetUrl,
        maxChildren: spiderConfig.maxChildren || '',
        recurse: spiderConfig.recurse ? 'true' : 'false',
        contextName: '',
        subtreeOnly: spiderConfig.subtreeOnly ? 'true' : 'false'
      });

      const spiderId = spiderResponse.scan;
      console.log(`✅ Spider started with ID: ${spiderId}`);

      // Step 4: Wait for spider to complete discovery
      console.log(`🕷️ Waiting for spider to discover pages... (timeout: ${scanConfig.spiderTimeout || 120000}ms)`);
      await this.waitForSpiderCompletion(spiderId, scanConfig.spiderTimeout || 120000);
      console.log(`✅ Spider completed, moving to active scan`);

      // Step 5: Get discovered URLs
      const sitesResponse = await this.zapApiRequest('/JSON/core/view/sites/');
      console.log(`Spider discovered sites:`, sitesResponse.sites?.length || 0);

      // Step 6: Start the active scan with enhanced configuration
      console.log(`Starting active scan on: ${targetUrl}`);
      const scanResponse = await this.zapApiRequest('/JSON/ascan/action/scan/', {
        url: targetUrl,
        recurse: 'true', // Scan all discovered pages
        inScopeOnly: scanConfig.inScopeOnly || 'false',
        // Remove scanPolicyName - let ZAP use default policy
        method: scanConfig.method || 'GET',
        postData: scanConfig.postData || ''
      });

      const scanId = scanResponse.scan;
      
      console.log(`ZAP active scan response:`, scanResponse);
      
      if (!scanId) {
        throw new Error('Failed to start ZAP scan - no scan ID returned');
      }

      console.log(`🎯 ZAP active scan started with ID: ${scanId}`);

      const result = {
        scanId: scanId.toString(),
        status: 'RUNNING',
        targetUrl,
        startTime: new Date().toISOString(),
        provider: 'OWASP_ZAP',
        toolMetadata: {
          zapScanId: scanId,
          spiderId: spiderId,
          scanConfig
        }
      };

      console.log(`✅ Enhanced scan started successfully:`, result);
      return result;

    } catch (error) {
      console.error('❌ Failed to start enhanced ZAP scan:', error);
      console.error('Error details:', error.stack);
      throw new Error(`Failed to start ZAP scan: ${error.message}`);
    }
  }

  /**
   * Configure spider settings based on scan configuration
   * @param {object} scanConfig - Frontend scan configuration
   * @returns {object} - ZAP spider configuration
   */
  getSpiderConfig(scanConfig) {
    const config = {
      recurse: true,
      subtreeOnly: false,
      threadCount: 4
    };

    // Map crawl depth to spider settings
    switch (scanConfig.depth) {
      case 'shallow':
        config.maxDepth = 2;
        config.maxChildren = 10;
        break;
      case 'medium':
        config.maxDepth = 5;
        config.maxChildren = 50;
        break;
      case 'deep':
        config.maxDepth = 0; // Unlimited
        config.maxChildren = 0; // Unlimited
        break;
      default:
        config.maxDepth = 3;
        config.maxChildren = 25;
    }

    // Adjust for subdomain inclusion
    if (scanConfig.includeSubdomains) {
      config.subtreeOnly = false;
    }

    return config;
  }

  /**
   * Get scan policy based on intensity
   * @param {string} intensity - Scan intensity (baseline, quick, standard, thorough)
   * @returns {string} - ZAP scan policy name
   */
  getScanPolicy(intensity) {
    switch (intensity) {
      case 'baseline':
        return 'baseline'; // Spider + passive scan only (most stable)
      case 'quick':
        return 'Light'; // Faster but fewer tests
      case 'thorough':
        return 'Default Policy'; // Most comprehensive
      case 'standard':
      default:
        return ''; // Default ZAP policy
    }
  }

  /**
   * Disable problematic passive scan rules that cause CPU spikes
   * Reference: https://github.com/zaproxy/zaproxy/issues/7957
   */
  async disableProblematicPassiveScanRules() {
    try {
      // First, get the list of all passive scan rules to find the correct IDs
      const rulesResponse = await this.zapApiRequest('/JSON/pscan/view/scanners/');
      const rules = rulesResponse.scanners || [];

      // Find problematic authhelper rules by name
      const problematicRuleNames = [
        'Session Management Response Identified',
        'Authentication Request Identified',
        'Verification Request Identified'
      ];

      let disabledCount = 0;
      for (const rule of rules) {
        if (problematicRuleNames.includes(rule.name)) {
          try {
            await this.zapApiRequest('/JSON/pscan/action/disablePassiveScanRule/', {
              scanRuleId: rule.id
            });
            console.log(`✅ Disabled passive scan rule: ${rule.name} (ID: ${rule.id})`);
            disabledCount++;
          } catch (error) {
            console.warn(`⚠️ Could not disable rule ${rule.name}: ${error.message}`);
          }
        }
      }

      if (disabledCount > 0) {
        console.log(`✅ Successfully disabled ${disabledCount} problematic passive scan rules`);
      } else {
        console.log(`ℹ️ No problematic authhelper rules found to disable`);
      }

    } catch (error) {
      console.warn(`⚠️ Could not disable passive scan rules: ${error.message}`);
      // Continue anyway - this is not critical for scan functionality
    }
  }

  /**
   * Wait for spider to complete crawling
   * @param {string} spiderId - The spider scan ID
   * @param {number} timeout - Maximum time to wait in milliseconds
   */
  async waitForSpiderCompletion(spiderId, timeout = 120000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const statusResponse = await this.zapApiRequest('/JSON/spider/view/status/', {
          scanId: spiderId
        });

        const progress = parseInt(statusResponse.status) || 0;
        console.log(`Spider ${spiderId} progress: ${progress}%`);

        if (progress >= 100) {
          console.log(`Spider ${spiderId} completed`);
          return;
        }

        // Wait 20 seconds before checking again (reduce API pressure)
        await new Promise(resolve => setTimeout(resolve, 20000));
        
      } catch (error) {
        console.error(`Error checking spider status: ${error.message}`);
        // Continue waiting, might be temporary  
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    }

    console.warn(`Spider ${spiderId} timed out after ${timeout}ms, proceeding with scan`);
  }

  /**
   * Get the current status of a running scan
   * @param {string} scanId - The ZAP scan identifier
   * @returns {Promise<object>} - Scan status and progress information
   */
  async getScanStatus(scanId) {
    try {
      console.log(`Checking status for ZAP scan ${scanId}`);
      
      // First check if scan exists in the scans list
      const scansResponse = await this.zapApiRequest('/JSON/ascan/view/scans/');
      console.log(`Active ZAP scans:`, scansResponse.scans || []);
      
      const statusResponse = await this.zapApiRequest('/JSON/ascan/view/status/', {
        scanId: scanId
      });

      console.log(`ZAP scan ${scanId} status response:`, statusResponse);

      const progress = parseInt(statusResponse.status) || 0;
      const isComplete = progress >= 100;

      return {
        scanId,
        status: isComplete ? 'COMPLETED' : 'RUNNING',
        progress: progress,
        isComplete,
        message: `Scan ${progress}% complete`
      };

    } catch (error) {
      console.error(`Failed to get ZAP scan status for ${scanId}:`, error);
      
      // For any error, just throw it and let the calling code handle it
      // Don't assume scan is completed just because we can't get status
      throw error;
    }
  }

  /**
   * Get only progress information for a running scan (lightweight version)
   * Handles both spider and active scan phases for enhanced scans
   * @param {string} scanId - The ZAP scan identifier
   * @param {object} toolMetadata - Optional metadata containing spiderId
   * @returns {Promise<object>} - Progress information only
   */
  async getProgressOnly(scanId, toolMetadata = {}) {
    try {
      const spiderId = toolMetadata?.spiderId;
      
      // For enhanced scans with spider, check both phases
      if (spiderId) {
        const result = await this.getCombinedProgress(scanId, spiderId);
        
        // Add real-time logging for enhanced scans
        if (result.isActive) {
          await this.logCurrentScanActivity(scanId, result.phase);
        }
        
        return result;
      }
      
      // For legacy scans, just check active scan progress
      const statusResponse = await this.zapApiRequest('/JSON/ascan/view/status/', {
        scanId: scanId
      });

      const progress = parseInt(statusResponse.status) || 0;
      const isActive = progress < 100;

      // Add real-time logging for legacy scans
      if (isActive) {
        await this.logCurrentScanActivity(scanId, 'active_scan');
      }

      return {
        scanId,
        progress: progress,
        isActive,
        status: isActive ? 'RUNNING' : 'COMPLETED',
        phase: 'active_scan'
      };

    } catch (error) {
      console.error(`Failed to get ZAP scan progress for ${scanId}:`, error);
      
      // Return graceful fallback response with phase/message fields
      return {
        scanId,
        progress: 0,
        isActive: false,
        status: 'ERROR',
        phase: 'error',
        message: `Failed to get scan progress: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Log current scanning activity for real-time visibility
   * @param {string} scanId - The ZAP scan identifier
   * @param {string} phase - Current scan phase (discovery/scanning)
   */
  async logCurrentScanActivity(scanId, phase) {
    try {
      if (phase === 'discovery') {
        // Log spider activity
        const spiderScans = await this.zapApiRequest('/JSON/spider/view/scans/');
        if (spiderScans.scans && spiderScans.scans.length > 0) {
          const activeSpider = spiderScans.scans.find(scan => scan.progress < '100');
          if (activeSpider) {
            console.log(`🕷️  SPIDER: Discovering pages... ${activeSpider.progress}% complete`);
          }
        }
      } else {
        // Log active scan activity
        const scanProgressResponse = await this.zapApiRequest('/JSON/ascan/view/scanProgress/', {
          scanId: scanId
        });
        
        if (scanProgressResponse.scanProgress && scanProgressResponse.scanProgress.length > 1) {
          const hostProcess = scanProgressResponse.scanProgress[1];
          const targetUrl = scanProgressResponse.scanProgress[0];
          
          console.log(`🎯 SCANNING: ${targetUrl}`);
          
          // Log currently active plugins
          if (hostProcess.HostProcess) {
            const activePlugins = hostProcess.HostProcess.filter(plugin => {
              const status = plugin.Plugin[3];
              return status !== 'Complete' && status !== 'Pending' && status !== 'Skipped';
            });

            const completedPlugins = hostProcess.HostProcess.filter(plugin => {
              const status = plugin.Plugin[3];
              const alertCount = parseInt(plugin.Plugin[6]) || 0;
              return status === 'Complete' && alertCount > 0;
            });

            // Log active tests
            activePlugins.forEach(plugin => {
              const [name, id, category, progress, testCount] = plugin.Plugin;
              console.log(`  🔬 TESTING: ${name} (${progress}) - ${testCount} tests`);
            });

            // Log any findings from completed tests
            completedPlugins.forEach(plugin => {
              const [name, id, category, status, testCount, , alertCount] = plugin.Plugin;
              if (parseInt(alertCount) > 0) {
                console.log(`  🚨 FOUND: ${name} - ${alertCount} potential issues`);
              }
            });

            // Log overall progress
            const totalTests = hostProcess.HostProcess.reduce((sum, plugin) => {
              return sum + (parseInt(plugin.Plugin[4]) || 0);
            }, 0);
            const completedTests = hostProcess.HostProcess.filter(p => p.Plugin[3] === 'Complete').length;
            const totalPlugins = hostProcess.HostProcess.length;
            
            console.log(`  📊 PROGRESS: ${completedTests}/${totalPlugins} test suites complete, ${totalTests} total tests run`);
          }
        }
      }
    } catch (error) {
      // Don't let logging errors break the scan progress
      console.log(`Note: Could not retrieve detailed scan activity (${error.message})`);
    }
  }

  /**
   * Get combined progress for spider + active scan phases
   * @param {string} scanId - The active scan ID
   * @param {string} spiderId - The spider scan ID
   * @returns {Promise<object>} - Combined progress information
   */
  async getCombinedProgress(scanId, spiderId) {
    try {
      // Check spider progress first
      let spiderProgress = 100;
      let spiderComplete = true;
      
      try {
        const spiderResponse = await this.zapApiRequest('/JSON/spider/view/status/', {
          scanId: spiderId
        });
        spiderProgress = parseInt(spiderResponse.status) || 0;
        spiderComplete = spiderProgress >= 100;
      } catch (spiderError) {
        // If spider check fails, assume it's complete and check active scan
        console.log(`Spider status check failed, assuming complete: ${spiderError.message}`);
      }

      // If spider is still running, return spider progress (0-30%)
      if (!spiderComplete) {
        const mappedProgress = Math.floor(spiderProgress * 0.3); // Map 0-100% to 0-30%
        return {
          scanId,
          progress: mappedProgress,
          isActive: true,
          status: 'RUNNING',
          phase: 'discovery',
          message: `Discovering pages: ${spiderProgress}%`
        };
      }

      // Spider is complete, check active scan progress (30-100%)
      const activeScanResponse = await this.zapApiRequest('/JSON/ascan/view/status/', {
        scanId: scanId
      });

      const activeScanProgress = parseInt(activeScanResponse.status) || 0;
      const activeScanComplete = activeScanProgress >= 100;
      
      // Map active scan progress from 30-100%
      const baseProgress = 30;
      const mappedProgress = baseProgress + Math.floor(activeScanProgress * 0.7);

      return {
        scanId,
        progress: mappedProgress,
        isActive: !activeScanComplete,
        status: activeScanComplete ? 'COMPLETED' : 'RUNNING',
        phase: activeScanComplete ? 'completed' : 'scanning',
        message: activeScanComplete ? 'Scan completed' : `Scanning: ${activeScanProgress}%`
      };

    } catch (error) {
      console.error(`Failed to get combined progress for ${scanId}/${spiderId}:`, error);
      
      // Return graceful fallback response instead of throwing
      return {
        scanId,
        progress: 0,
        isActive: false,
        status: 'ERROR',
        phase: 'error',
        message: `Failed to get combined progress: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Get the results of a completed scan
   * @param {string} scanId - The ZAP scan identifier
   * @param {string} targetUrl - The target URL that was scanned
   * @returns {Promise<object>} - Scan results including findings
   */
  async getScanResults(scanId, targetUrl = '') {
    try {
      console.log(`Retrieving results for ZAP scan ${scanId} (target: ${targetUrl})`);
      
      // Get alerts filtered by target URL to only get alerts from this scan
      const alertsResponse = await this.zapApiRequest('/JSON/core/view/alerts/', {
        baseurl: targetUrl, // Filter alerts to only this target URL
        start: '0',
        count: '1000'
      });

      console.log(`ZAP returned ${alertsResponse.alerts?.length || 0} alerts for target ${targetUrl}`);

      const alerts = alertsResponse.alerts || [];
      const findings = alerts.map(alert => this.transformZapAlertToFinding(alert, targetUrl));

      // Count findings by severity
      const severityCounts = findings.reduce((counts, finding) => {
        const severity = finding.severity.toLowerCase();
        counts[severity] = (counts[severity] || 0) + 1;
        return counts;
      }, {});

      console.log(`Processed ${findings.length} findings:`, severityCounts);

      return {
        scanId,
        status: 'COMPLETED',
        findingsCount: findings.length,
        criticalCount: severityCounts.critical || 0,
        highCount: severityCounts.high || 0,
        mediumCount: severityCounts.medium || 0,
        lowCount: severityCounts.low || 0,
        infoCount: severityCounts.informational || severityCounts.info || 0,
        findings,
        completedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Failed to get ZAP scan results for ${scanId}:`, error);
      
      // If we can't get results, return a basic completed status
      console.log(`Returning empty results for scan ${scanId} due to error`);
      return {
        scanId,
        status: 'COMPLETED',
        findingsCount: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        infoCount: 0,
        findings: [],
        completedAt: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Cancel a running scan
   * @param {string} scanId - The ZAP scan identifier
   * @returns {Promise<boolean>} - Success status
   */
  async cancelScan(scanId) {
    try {
      await this.zapApiRequest('/JSON/ascan/action/stop/', {
        scanId: scanId
      });

      console.log(`ZAP scan ${scanId} cancelled successfully`);
      return true;

    } catch (error) {
      console.error(`Failed to cancel ZAP scan ${scanId}:`, error);
      return false;
    }
  }

  /**
   * Get detailed scan information including crawled pages and statistics
   * @param {string} scanId - The ZAP scan identifier
   * @param {string} targetUrl - The target URL that was scanned
   * @returns {Promise<object>} - Detailed scan information
   */
  async getDetailedScanInfo(scanId, targetUrl) {
    try {
      console.log(`Getting detailed scan info for ZAP scan ${scanId} (target: ${targetUrl})`);

      // Get basic scan info
      const basicInfo = await this.getScanResults(scanId, targetUrl);

      // Get all URLs discovered by ZAP for this target
      const sitesResponse = await this.zapApiRequest('/JSON/core/view/sites/');
      const allSites = sitesResponse.sites || [];
      
      // Filter sites to only include those under our target domain
      const targetDomain = new URL(targetUrl).origin;
      const crawledPages = [];
      
      // Get URLs from site tree
      for (const site of allSites) {
        if (site.startsWith(targetDomain) || site.includes(new URL(targetUrl).hostname)) {
          try {
            const urlsResponse = await this.zapApiRequest('/JSON/core/view/urls/', {
              baseurl: site
            });
            
            const urls = urlsResponse.urls || [];
            urls.forEach(url => {
              // Add metadata about each crawled page
              crawledPages.push({
                url: url,
                site: site,
                discoveredAt: new Date().toISOString(), // ZAP doesn't provide timestamp
                method: 'GET', // Default, ZAP could have POST/etc
                statusCode: null, // Would need additional API calls to get this
                responseSize: null,
                responseTime: null
              });
            });
          } catch (error) {
            console.warn(`Failed to get URLs for site ${site}:`, error.message);
          }
        }
      }

      // Remove duplicates
      const uniquePages = crawledPages.filter((page, index, self) => 
        index === self.findIndex(p => p.url === page.url)
      );

      // Get ZAP statistics if available
      let zapStats = {};
      try {
        const statsResponse = await this.zapApiRequest('/JSON/core/view/stats/');
        zapStats = statsResponse.stats || {};
      } catch (error) {
        console.warn('Failed to get ZAP stats:', error.message);
      }

      // Get alerts with more detail
      const alertsResponse = await this.zapApiRequest('/JSON/core/view/alerts/', {
        baseurl: targetUrl,
        start: '0',
        count: '1000'
      });

      const detailedAlerts = (alertsResponse.alerts || []).map(alert => ({
        id: alert.id,
        pluginId: alert.pluginId,
        name: alert.alert || alert.name,
        description: alert.desc || alert.description,
        risk: alert.risk,
        confidence: alert.confidence,
        url: alert.url,
        param: alert.param,
        attack: alert.attack,
        evidence: alert.evidence,
        solution: alert.solution,
        reference: alert.reference,
        cweid: alert.cweid,
        wascid: alert.wascid,
        instances: alert.instances || []
      }));

      // Get scan configuration info
      let scanConfig = {};
      try {
        const policiesResponse = await this.zapApiRequest('/JSON/ascan/view/policies/');
        scanConfig.availablePolicies = policiesResponse.policies || [];
      } catch (error) {
        console.warn('Failed to get scan policies:', error.message);
      }

      return {
        ...basicInfo,
        scanDetails: {
          scanId: scanId,
          targetUrl: targetUrl,
          crawledPages: uniquePages,
          totalPagesCrawled: uniquePages.length,
          uniqueDomains: [...new Set(uniquePages.map(p => new URL(p.url).hostname))],
          zapStatistics: zapStats,
          detailedAlerts: detailedAlerts,
          scanConfiguration: scanConfig
        }
      };

    } catch (error) {
      console.error(`Failed to get detailed scan info for ${scanId}:`, error);
      throw error;
    }
  }

  /**
   * Transform a ZAP alert into a standardized finding format
   * @param {object} zapAlert - ZAP alert object
   * @param {string} fallbackUrl - Fallback URL if alert doesn't have specific URL
   * @returns {object} - Standardized finding object
   */
  transformZapAlertToFinding(zapAlert, fallbackUrl = '') {
    // Map ZAP risk levels to standard severity levels
    const severityMap = {
      'High': 'HIGH',
      'Medium': 'MEDIUM',
      'Low': 'LOW',
      'Informational': 'INFORMATIONAL'
    };

    // Use specific URL from the alert, or fallback to the scan target URL
    const findingUrl = zapAlert.url || fallbackUrl;

    return {
      vulnerabilityId: zapAlert.pluginId || zapAlert.id,
      source: 'ZAP',
      title: zapAlert.alert || zapAlert.name,
      description: zapAlert.desc || zapAlert.description,
      severity: severityMap[zapAlert.risk] || 'INFORMATIONAL',
      confidence: zapAlert.confidence,
      solution: zapAlert.solution,
      reference: zapAlert.reference,
      url: findingUrl,
      metadata: {
        zapAlertId: zapAlert.id,
        pluginId: zapAlert.pluginId,
        url: zapAlert.url, // Keep original URL in metadata for reference
        param: zapAlert.param,
        attack: zapAlert.attack,
        evidence: zapAlert.evidence,
        cweid: zapAlert.cweid,
        wascid: zapAlert.wascid,
        instances: zapAlert.instances || []
      }
    };
  }

  /**
   * Wait for a scan to complete with polling
   * @param {string} scanId - The ZAP scan identifier
   * @param {number} pollInterval - Polling interval in milliseconds (default: 5000)
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<object>} - Final scan status
   */
  async waitForScanCompletion(scanId, pollInterval = 5000, timeout = null) {
    const maxTimeout = timeout || this.scanTimeout * 1000;
    const startTime = Date.now();
    let pollCount = 0;
    let consecutiveFailures = 0;
    let hasSeenProgress = false; // Track if we've seen the scan making progress
    let lastKnownProgress = 0;

    console.log(`Waiting for ZAP scan ${scanId} to complete (timeout: ${maxTimeout / 1000}s)`);

    // Initial short delay to let scan start
    await new Promise(resolve => setTimeout(resolve, 2000));

    while (Date.now() - startTime < maxTimeout) {
      pollCount++;
      console.log(`Poll #${pollCount} for scan ${scanId}`);
      
      try {
        const status = await this.getScanStatus(scanId);
        consecutiveFailures = 0; // Reset failure counter on success
        
        // Track that we've seen the scan progressing
        if (status.progress > 0) {
          hasSeenProgress = true;
          lastKnownProgress = status.progress;
        }
        
        if (status.isComplete) {
          console.log(`ZAP scan ${scanId} completed after ${pollCount} polls`);
          return status;
        }

        console.log(`ZAP scan ${scanId} progress: ${status.progress}%`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        consecutiveFailures++;
        console.log(`Poll ${pollCount} failed (${consecutiveFailures} consecutive failures):`, error.message);
        
        // Check if this is a connection issue (ZAP restart) vs scan completion
        const isConnectionIssue = error.message.includes('ECONNREFUSED') || 
                                 error.message.includes('ECONNRESET') || 
                                 error.message.includes('fetch failed');
        
        const isScanNotFound = error.message.includes('does_not_exist') || 
                              error.message.includes('Does Not Exist');

        // If scan doesn't exist after some successful polls, it likely completed
        if (isScanNotFound && pollCount > 3) {
          console.log(`ZAP scan ${scanId} not found - likely completed`);
          return {
            scanId,
            status: 'COMPLETED',
            progress: 100,
            isComplete: true,
            message: 'Scan completed (not found in active scans)'
          };
        }
        
        // For connection issues, check if we should assume completion
        if (isConnectionIssue) {
          // If we've seen progress and have multiple connection failures after some successful polls,
          // assume the scan completed and ZAP cleaned up
          if (hasSeenProgress && consecutiveFailures >= 3 && pollCount > 5) {
            console.log(`ZAP scan ${scanId} likely completed - seen ${lastKnownProgress}% progress, then connection issues after ${pollCount} polls`);
            return {
              scanId,
              status: 'COMPLETED',
              progress: 100,
              isComplete: true,
              message: 'Scan completed (detected via connection issues after progress)'
            };
          }
          
          if (consecutiveFailures >= 5) {
            console.log(`ZAP appears to be down after ${consecutiveFailures} connection failures`);
            throw new Error(`ZAP scanner is unavailable after ${consecutiveFailures} connection attempts`);
          }
          
          // Wait longer for connection issues (ZAP might be restarting)
          console.log(`ZAP connection issue, waiting ${pollInterval * 2}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval * 2));
          continue;
        }
        
        // For other errors, wait normal interval before retrying
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    // Timeout reached, cancel the scan
    console.log(`ZAP scan ${scanId} timed out, attempting to cancel`);
    await this.cancelScan(scanId);
    throw new Error(`ZAP scan ${scanId} timed out after ${maxTimeout / 1000} seconds`);
  }
} 
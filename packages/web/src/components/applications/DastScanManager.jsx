import React, { useState, useEffect } from 'react';
import { Shield, Play, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmationModal from '../ConfirmationModal';
import ScanDetailsModal from './ScanDetailsModal';
import ScanRow from './ScanRow';
import useFindingStore from '../../stores/useFindingStore';

const DastScanManager = ({ project }) => {
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [targetUrl, setTargetUrl] = useState(project.applicationUrl || '');
  
  // Scan configuration options
  const [scanIntensity, setScanIntensity] = useState('standard');
  const [crawlDepth, setCrawlDepth] = useState('medium');
  const [includeSubdomains, setIncludeSubdomains] = useState(false);
  const [maxDuration, setMaxDuration] = useState(30);
  const [totalScans, setTotalScans] = useState(0);
  
  // Get findings refresh function
  const { fetchFindings } = useFindingStore();
  
  // Modal state for viewing all scans
  const [showAllScansModal, setShowAllScansModal] = useState(false);
  const [allScans, setAllScans] = useState([]);
  const [isLoadingAllScans, setIsLoadingAllScans] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [scansPerPage] = useState(10);

  // Modal state for scan details
  const [showScanDetailsModal, setShowScanDetailsModal] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState(null);

  // Fetch scan history (limited to most recent 5)
  const fetchScans = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/projects/${project.id}/dast/scans?limit=5&offset=0`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const scanList = data.scans || [];
        setScans(scanList);
        setTotalScans(data.total || 0);
      } else {
        throw new Error('Failed to fetch scans');
      }
    } catch (err) {
      console.error('Error fetching scans:', err);
      setError('Failed to load scan history');
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  };



  // Fetch all scans with pagination
  const fetchAllScans = async (page = 0) => {
    setIsLoadingAllScans(true);
    try {
      const offset = page * scansPerPage;
      const response = await fetch(`/api/v1/projects/${project.id}/dast/scans?limit=${scansPerPage}&offset=${offset}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllScans(data.scans || []);
        setTotalScans(data.total || 0);
        setCurrentPage(page);
      } else {
        throw new Error('Failed to fetch all scans');
      }
    } catch (err) {
      console.error('Error fetching all scans:', err);
      setError('Failed to load all scans');
    } finally {
      setIsLoadingAllScans(false);
    }
  };

  // Open all scans modal
  const openAllScansModal = () => {
    setShowAllScansModal(true);
    setCurrentPage(0);
    fetchAllScans(0);
  };

  // Close all scans modal
  const closeAllScansModal = () => {
    setShowAllScansModal(false);
    setAllScans([]);
    setCurrentPage(0);
  };

  // Navigate to previous page
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      fetchAllScans(currentPage - 1);
    }
  };

  // Navigate to next page
  const goToNextPage = () => {
    const maxPage = Math.ceil(totalScans / scansPerPage) - 1;
    if (currentPage < maxPage) {
      fetchAllScans(currentPage + 1);
    }
  };

  // Open scan details modal
  const openScanDetails = (scanId) => {
    setSelectedScanId(scanId);
    setShowScanDetailsModal(true);
  };

  // Close scan details modal
  const closeScanDetails = () => {
    setSelectedScanId(null);
    setShowScanDetailsModal(false);
  };

  // Launch scan
  const launchScan = async () => {
    if (!targetUrl?.trim()) {
      setError('Target URL is required');
      return;
    }

    setIsLaunching(true);
    setError(null);

    try {
      // Map user-friendly options to enhanced ZAP configuration
      const scanConfig = {
        // Scan intensity affects which scan policy is used
        intensity: scanIntensity,
        
        // Crawl depth affects spider behavior  
        depth: crawlDepth,
        
        // Subdomain inclusion
        includeSubdomains: includeSubdomains,
        
        // Timeout settings
        spiderTimeout: Math.min(maxDuration * 60 * 1000 * 0.3, 120000), // 30% of total time for spider, max 2 min
        maxDuration: maxDuration,
        
        // Advanced spider settings based on intensity
        ...(scanIntensity === 'quick' && {
          spiderTimeout: 30000, // 30 seconds for quick scans
        }),
        ...(scanIntensity === 'thorough' && {
          spiderTimeout: 180000, // 3 minutes for thorough scans
        }),
        
        // Legacy ZAP settings (for compatibility)
        recurse: true, // Always crawl discovered pages
        inScopeOnly: false // Let spider determine scope
      };

      const response = await fetch(`/api/v1/projects/${project.id}/dast/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          targetUrl: targetUrl.trim(),
          provider: 'OWASP_ZAP',
          scanType: 'ACTIVE',
          scanConfig: scanConfig
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowLaunchModal(false);
        resetScanConfig(); // Reset configuration
        await fetchScans(); // Refresh scan list to get the new scan
        console.log('Scan launched:', data);
        // Polling will automatically start due to the new running scan
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to launch scan');
      }
    } catch (err) {
      console.error('Error launching scan:', err);
      setError(err.message);
    } finally {
      setIsLaunching(false);
    }
  };




  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get severity badge
  const getSeverityBadge = (count, label, colorClass) => {
    if (count === 0) return null;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {count} {label}
      </span>
    );
  };

  // Reset scan configuration when modal closes
  const resetScanConfig = () => {
    setScanIntensity('standard');
    setCrawlDepth('medium');
    setIncludeSubdomains(false);
    setMaxDuration(30);
    setTargetUrl(project.applicationUrl || '');
  };

  // Handle scan completion - refresh data when a scan finishes
  const handleScanComplete = async (scanId) => {
    console.log(`handleScanComplete called for scan ${scanId}, refreshing data...`);
    
    // Refresh scan list (without loading spinner to avoid UI flickering)
    await fetchScans(false);
    
    // Refresh findings to show new vulnerabilities
    await fetchFindings(project.id);
    
    console.log(`Data refresh completed for scan ${scanId}`);
  };

  // Initial load and project change
  useEffect(() => {
    fetchScans();
    resetScanConfig(); // Reset config when project changes
  }, [project.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 bg-purple-500/10 p-2 rounded-lg">
            <Shield size={20} className="text-purple-400" />
          </div>
          <div>
            <h4 className="text-lg font-medium text-white">
              DAST Scanning
            </h4>
            <p className="text-sm text-gray-400">Dynamic Application Security Testing</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchScans()}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
          >
            <Shield size={16} />
            Refresh
          </button>
          <button
            onClick={() => setShowLaunchModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed"
          >
            <Play size={16} />
            Launch Scan
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 text-sm text-red-200 bg-red-800/50 rounded-md">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        </div>
      )}

      {/* Scan History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-md font-medium text-white">Recent Scans</h5>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {totalScans <= 5 
                ? `${totalScans} scan${totalScans !== 1 ? 's' : ''}`
                : `Showing latest 5 of ${totalScans} scans`
              }
            </span>
            {totalScans > 5 && (
              <button 
                className="text-xs text-purple-400 hover:text-purple-300 underline"
                onClick={openAllScansModal}
              >
                View All
              </button>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">
            Loading scan history...
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No scans have been run yet. Launch your first DAST scan to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => (
              <ScanRow
                key={scan.id}
                scan={scan}
                project={project}
                onScanClick={openScanDetails}
                formatDate={formatDate}
                formatDuration={formatDuration}
                getSeverityBadge={getSeverityBadge}
                onScanComplete={handleScanComplete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Launch Scan Modal */}
      <ConfirmationModal
        isOpen={showLaunchModal}
        onClose={() => {
          setShowLaunchModal(false);
          resetScanConfig();
        }}
        onConfirm={launchScan}
        title="Launch DAST Scan"
        message={
          <div className="space-y-6">
            <p className="text-gray-300">
              Configure and launch an OWASP ZAP scan against your application. The scan may take several minutes to complete.
            </p>
            
            {/* Target URL */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Target URL *
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Scan Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scan Intensity */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Scan Intensity
                </label>
                <select
                  value={scanIntensity}
                  onChange={(e) => setScanIntensity(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="quick">Quick (~5-10 min)</option>
                  <option value="standard">Standard (~15-30 min)</option>
                  <option value="thorough">Thorough (~30+ min)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Higher intensity finds more vulnerabilities but takes longer
                </p>
              </div>

              {/* Crawl Depth */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Crawl Depth
                </label>
                <select
                  value={crawlDepth}
                  onChange={(e) => setCrawlDepth(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="shallow">Shallow (1-2 levels)</option>
                  <option value="medium">Medium (3-5 levels)</option>
                  <option value="deep">Deep (unlimited)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  How deep to crawl links from the target URL
                </p>
              </div>

              {/* Max Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Max Duration (minutes)
                </label>
                <select
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Scan will timeout after this duration
                </p>
              </div>

              {/* Include Subdomains */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Scope Options
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="includeSubdomains"
                    checked={includeSubdomains}
                    onChange={(e) => setIncludeSubdomains(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="includeSubdomains" className="text-sm text-gray-300">
                    Include subdomains
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Scan links to subdomains of the target
                </p>
              </div>
            </div>

            <div className="text-sm text-yellow-300 bg-yellow-900/20 p-3 rounded-md">
              ⚠️ Only scan applications you own or have explicit permission to test.
            </div>
          </div>
        }
        confirmText={isLaunching ? "Launching..." : "Launch Scan"}
        cancelText="Cancel"
        confirmButtonClass="bg-purple-600 hover:bg-purple-700"
        isLoading={isLaunching}
      />

      {/* All Scans Modal */}
      {showAllScansModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAllScansModal();
            }
          }}
        >
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">All DAST Scans</h3>
              <button
                onClick={closeAllScansModal}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {isLoadingAllScans ? (
                <div className="text-center py-8 text-gray-400">
                  Loading scans...
                </div>
              ) : allScans.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No scans found.
                </div>
              ) : (
                <div className="space-y-3">
                  {allScans.map((scan) => (
                    <ScanRow
                      key={scan.id}
                      scan={scan}
                      project={project}
                      onScanClick={openScanDetails}
                      formatDate={formatDate}
                      formatDuration={formatDuration}
                      getSeverityBadge={getSeverityBadge}
                      onScanComplete={handleScanComplete}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer with Pagination */}
            {totalScans > 0 && (
              <div className="flex items-center justify-between p-6 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Page {currentPage + 1} of {Math.max(1, Math.ceil(totalScans / scansPerPage))} • 
                  Showing {currentPage * scansPerPage + 1}-{Math.min((currentPage + 1) * scansPerPage, totalScans)} of {totalScans} scans
                </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= Math.ceil(totalScans / scansPerPage) - 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Scan Details Modal */}
      {showScanDetailsModal && (
        <ScanDetailsModal
          scanId={selectedScanId}
          projectId={project.id}
          onClose={closeScanDetails}
        />
      )}
    </div>
  );
};

export default DastScanManager; 
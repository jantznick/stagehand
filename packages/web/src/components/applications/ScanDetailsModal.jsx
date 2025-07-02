import React, { useState, useEffect } from 'react';
import { X, Download, Globe, Clock, Shield, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

const ScanDetailsModal = ({ scanId, projectId, onClose }) => {
  const [scanDetails, setScanDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (scanId && projectId) {
      fetchScanDetails();
    }
  }, [scanId, projectId]);

  const fetchScanDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/dast/scans/${scanId}/details`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setScanDetails(data);
      } else {
        throw new Error('Failed to fetch scan details');
      }
    } catch (err) {
      console.error('Error fetching scan details:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCrawledPages = () => {
    if (!scanDetails?.scanDetails?.crawledPages) return;

    const csvContent = [
      ['URL', 'Site', 'Discovered At'],
      ...scanDetails.scanDetails.crawledPages.map(page => [
        page.url,
        page.site,
        new Date(page.discoveredAt).toLocaleString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-${scanId}-crawled-pages.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'FAILED':
        return <XCircle className="text-red-400" size={20} />;
      case 'RUNNING':
        return <Clock className="text-blue-400 animate-pulse" size={20} />;
      default:
        return <Info className="text-gray-400" size={20} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (!scanId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gray-900 border border-white/20 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Shield className="text-purple-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">DAST Scan Details</h2>
              <p className="text-sm text-gray-400">
                {scanDetails ? scanDetails.targetUrl : 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-white/10 p-4">
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: Info },
                { id: 'crawled', label: 'Crawled Pages', icon: Globe },
                { id: 'findings', label: 'Findings', icon: AlertTriangle },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    activeTab === id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading scan details...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <XCircle className="text-red-400 mx-auto mb-4" size={48} />
                  <p className="text-red-400 mb-2">Failed to load scan details</p>
                  <p className="text-gray-400 text-sm">{error}</p>
                </div>
              </div>
            ) : (
              <div>
                {/* Overview Tab */}
                {activeTab === 'overview' && scanDetails && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Info */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          {getStatusIcon(scanDetails.status)}
                          Scan Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className="text-white capitalize">{scanDetails.status.toLowerCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Provider:</span>
                            <span className="text-white">{scanDetails.provider}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Started:</span>
                            <span className="text-white">
                              {scanDetails.startedAt ? new Date(scanDetails.startedAt).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Duration:</span>
                            <span className="text-white">{formatDuration(scanDetails.duration)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Initiated by:</span>
                            <span className="text-white">{scanDetails.initiatedBy || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Findings Summary */}
                      <div className="bg-white/5 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Findings Summary</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Findings:</span>
                            <span className="text-white font-semibold">{scanDetails.findingsCount || 0}</span>
                          </div>
                          {scanDetails.criticalCount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Critical:</span>
                              <span className="text-red-400 font-semibold">{scanDetails.criticalCount}</span>
                            </div>
                          )}
                          {scanDetails.highCount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">High:</span>
                              <span className="text-orange-400 font-semibold">{scanDetails.highCount}</span>
                            </div>
                          )}
                          {scanDetails.mediumCount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Medium:</span>
                              <span className="text-yellow-400 font-semibold">{scanDetails.mediumCount}</span>
                            </div>
                          )}
                          {scanDetails.lowCount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Low:</span>
                              <span className="text-sky-400 font-semibold">{scanDetails.lowCount}</span>
                            </div>
                          )}
                          {scanDetails.infoCount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Info:</span>
                              <span className="text-gray-400 font-semibold">{scanDetails.infoCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Scan Configuration */}
                    {scanDetails.toolConfig && (
                      <div className="bg-white/5 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Scan Configuration</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(scanDetails.toolConfig).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="text-white">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Discovery Summary */}
                    {scanDetails.scanDetails && (
                      <div className="bg-white/5 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Discovery Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Pages Crawled:</span>
                            <span className="text-white font-semibold">
                              {scanDetails.scanDetails.totalPagesCrawled || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Unique Domains:</span>
                            <span className="text-white font-semibold">
                              {scanDetails.scanDetails.uniqueDomains?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Crawled Pages Tab */}
                {activeTab === 'crawled' && scanDetails?.scanDetails?.crawledPages && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Crawled Pages ({scanDetails.scanDetails.crawledPages.length})
                      </h3>
                      <button
                        onClick={downloadCrawledPages}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                      >
                        <Download size={16} />
                        Download CSV
                      </button>
                    </div>

                    <div className="bg-white/5 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full divide-y divide-white/10">
                          <thead className="bg-black/30">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                URL
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Site
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Discovered
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {scanDetails.scanDetails.crawledPages.map((page, index) => (
                              <tr key={index} className="hover:bg-black/30 transition-colors">
                                <td className="px-6 py-3 text-sm text-white break-all">
                                  <a 
                                    href={page.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 hover:underline"
                                  >
                                    {page.url}
                                  </a>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-400">{page.site}</td>
                                <td className="px-6 py-3 text-sm text-gray-400">
                                  {new Date(page.discoveredAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Findings Tab */}
                {activeTab === 'findings' && scanDetails?.scanDetails?.detailedAlerts && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">
                      Detailed Findings ({scanDetails.scanDetails.detailedAlerts.length})
                    </h3>

                    <div className="space-y-3">
                      {scanDetails.scanDetails.detailedAlerts.map((alert, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-white font-medium mb-1">{alert.name}</h4>
                              <p className="text-sm text-gray-400 mb-2">{alert.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.risk)}`}>
                                  {alert.risk}
                                </span>
                                <span className="text-gray-400">Confidence: {alert.confidence}</span>
                                {alert.cweid && (
                                  <span className="text-gray-400">CWE-{alert.cweid}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {alert.url && (
                            <div className="text-sm text-gray-400 mb-2">
                              <span className="font-medium">URL:</span> 
                              <a 
                                href={alert.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 hover:underline ml-1"
                              >
                                {alert.url}
                              </a>
                            </div>
                          )}
                          
                          {alert.param && (
                            <div className="text-sm text-gray-400 mb-2">
                              <span className="font-medium">Parameter:</span> {alert.param}
                            </div>
                          )}
                          
                          {alert.solution && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-400">Solution:</span>
                              <p className="text-gray-300 mt-1">{alert.solution}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanDetailsModal; 
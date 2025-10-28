import React, { useState, useEffect } from 'react';
import { Code, Play, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmationModal from '../ConfirmationModal';
import ScanDetailsModal from './ScanDetailsModal';
import ScanRow from './ScanRow';
import useFindingStore from '../../stores/useFindingStore';

const SastScanManager = ({ project }) => {
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  
  const [totalScans, setTotalScans] = useState(0);
  
  const { fetchFindings } = useFindingStore();
  
  const [showAllScansModal, setShowAllScansModal] = useState(false);
  const [allScans, setAllScans] = useState([]);
  const [isLoadingAllScans, setIsLoadingAllScans] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [scansPerPage] = useState(10);

  const [showScanDetailsModal, setShowScanDetailsModal] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState(null);

  const fetchScans = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/projects/${project.id}/sast/scans?limit=5&offset=0`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const scanList = data || []; // The endpoint returns an array directly
        setScans(scanList.slice(0, 5));
        setTotalScans(scanList.length); // Assuming the endpoint returns all scans for now
      } else {
        throw new Error('Failed to fetch SAST scans');
      }
    } catch (err) {
      console.error('Error fetching SAST scans:', err);
      setError('Failed to load SAST scan history');
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  };

  const fetchAllScans = async (page = 0) => {
    setIsLoadingAllScans(true);
    try {
      const offset = page * scansPerPage;
      const response = await fetch(`/api/v1/projects/${project.id}/sast/scans?limit=${scansPerPage}&offset=${offset}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllScans(data); // Assuming it returns a simple array
        setTotalScans(data.length); // This needs a proper count from backend later
        setCurrentPage(page);
      } else {
        throw new Error('Failed to fetch all SAST scans');
      }
    } catch (err) {
      console.error('Error fetching all SAST scans:', err);
      setError('Failed to load all SAST scans');
    } finally {
      setIsLoadingAllScans(false);
    }
  };
  
  const openAllScansModal = () => {
    setShowAllScansModal(true);
    setCurrentPage(0);
    fetchAllScans(0);
  };

  const closeAllScansModal = () => {
    setShowAllScansModal(false);
    setAllScans([]);
    setCurrentPage(0);
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      fetchAllScans(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    const maxPage = Math.ceil(totalScans / scansPerPage) - 1;
    if (currentPage < maxPage) {
      fetchAllScans(currentPage + 1);
    }
  };

  const openScanDetails = (scanId) => {
    setSelectedScanId(scanId);
    setShowScanDetailsModal(true);
  };

  const closeScanDetails = () => {
    setSelectedScanId(null);
    setShowScanDetailsModal(false);
  };

  const launchScan = async () => {
    if (!project.repositoryUrl) {
      setError('A repository URL must be linked to this project before launching a SAST scan.');
      return;
    }

    setIsLaunching(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/projects/${project.id}/sast/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}) // No body needed for SAST scan launch
      });

      if (response.ok) {
        const data = await response.json();
        setShowLaunchModal(false);
        await fetchScans(); // Refresh scan list
        console.log('SAST Scan launched:', data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to launch SAST scan');
      }
    } catch (err) {
      console.error('Error launching SAST scan:', err);
      setError(err.message);
    } finally {
      setIsLaunching(false);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getSeverityBadge = (count, label, colorClass) => {
    if (count === 0) return null;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {count} {label}
      </span>
    );
  };

  const handleScanComplete = async (scanId) => {
    console.log(`SAST scan ${scanId} completed, refreshing data...`);
    await fetchScans(false);
    await fetchFindings(project.id);
  };

  useEffect(() => {
    fetchScans();
  }, [project.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 bg-blue-500/10 p-2 rounded-lg">
            <Code size={20} className="text-blue-400" />
          </div>
          <div>
            <h4 className="text-lg font-medium text-white">
              SAST Scanning
            </h4>
            <p className="text-sm text-gray-400">Static Application Security Testing (Semgrep)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLaunchModal(true)}
            disabled={!project.repositoryUrl}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            <Play size={16} />
            Launch Scan
          </button>
        </div>
      </div>
      
      {!project.repositoryUrl && (
        <div className="p-3 text-sm text-yellow-200 bg-yellow-800/50 rounded-md">
            Link a repository in the 'Details' tab to enable SAST scanning.
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-200 bg-red-800/50 rounded-md">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-md font-medium text-white">Recent Scans</h5>
          {totalScans > 5 && (
              <button 
                className="text-xs text-blue-400 hover:text-blue-300 underline"
                onClick={openAllScansModal}
              >
                View All
              </button>
            )}
        </div>
        
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading scan history...</div>
        ) : scans.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No SAST scans have been run yet.
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

      <ConfirmationModal
        isOpen={showLaunchModal}
        onClose={() => setShowLaunchModal(false)}
        onConfirm={launchScan}
        title="Launch SAST Scan"
        message={
          <div className="space-y-4">
            <p className="text-gray-300">
              This will start a Semgrep scan on the linked repository: <br/>
              <strong className="font-mono text-blue-300">{project.repositoryUrl}</strong>
            </p>
            <p className="text-gray-400">
              The scan will run in the background. You can monitor its progress in the scan history.
            </p>
          </div>
        }
        confirmText={isLaunching ? "Launching..." : "Confirm & Launch"}
        cancelText="Cancel"
        confirmButtonClass="bg-blue-600 hover:bg-blue-700"
        isLoading={isLaunching}
      />
      
      {/* TODO: We need a generic Scan Details modal and a way to view all scans */}

    </div>
  );
};

export default SastScanManager;

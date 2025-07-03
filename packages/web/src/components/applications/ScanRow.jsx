import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Info, Play, X } from 'lucide-react';
import useProgressPolling from '../../hooks/useProgressPolling';

const ScanRow = ({ scan, project, onScanClick, formatDate, formatDuration, getSeverityBadge, onScanComplete }) => {
  const isRunning = scan.status === 'RUNNING';
  const isActive = ['PENDING', 'QUEUED', 'RUNNING'].includes(scan.status);
  const [isCanceling, setIsCanceling] = useState(false);
  
  // Use progress polling for active scans
  const { progress, phase, message } = useProgressPolling(
    scan.id, 
    project.id, 
    isActive,
    onScanComplete
  );

  // Cancel scan handler
  const handleCancelScan = async (e) => {
    e.stopPropagation(); // Prevent triggering onScanClick
    
    if (isCanceling) return;
    
    setIsCanceling(true);
    try {
      const response = await fetch(`/api/v1/projects/${project.id}/dast/scans/${scan.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        console.log(`Scan ${scan.id} cancelled successfully`);
        // Trigger refresh if available
        if (onScanComplete) {
          onScanComplete(scan.id);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to cancel scan:', errorData.error);
        alert('Failed to cancel scan: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error canceling scan:', error);
      alert('Failed to cancel scan');
    } finally {
      setIsCanceling(false);
    }
  };

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'PENDING':
      case 'QUEUED':
        return { icon: Clock, color: 'text-yellow-400' };
      case 'RUNNING':
        return { icon: Play, color: 'text-blue-400' };
      case 'COMPLETED':
        return { icon: CheckCircle, color: 'text-green-400' };
      case 'FAILED':
        return { icon: XCircle, color: 'text-red-400' };
      case 'CANCELLED':
        return { icon: XCircle, color: 'text-gray-400' };
      default:
        return { icon: Info, color: 'text-gray-400' };
    }
  };



  const { icon: StatusIcon, color } = getStatusDisplay(scan.status);
  
  return (
    <div 
      className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
      onClick={() => onScanClick(scan.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon size={16} className={color} />
          <div>
            <div className="text-white font-medium">
              {scan.targetUrl}
            </div>
            <div className="text-sm text-gray-400">
              Started {formatDate(scan.queuedAt)} by {scan.initiatedBy}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Status and Progress */}
          <div className="text-right">
            <div className="text-sm text-white">
              {progress !== null && isActive
                ? message || `${progress}% complete`
                : scan.status.charAt(0) + scan.status.slice(1).toLowerCase()
              }
            </div>
            {/* Show phase for enhanced scans */}
            {phase && isActive && (
              <div className="text-xs text-gray-400">
                {phase === 'discovery' && 'Discovering pages...'}
                {phase === 'scanning' && 'Security testing...'}
                {phase === 'active_scan' && 'Scanning...'}
              </div>
            )}
            {scan.duration && (
              <div className="text-xs text-gray-400">
                Duration: {formatDuration(scan.duration)}
              </div>
            )}
            
            {/* Progress bar for active scans only */}
            {progress !== null && isActive && (
              <div className="mt-1 w-24 bg-gray-700 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                    phase === 'discovery' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`}
                  style={{ width: `${Math.max(progress, 5)}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* Cancel Button for Active Scans */}
          {isActive && (
            <button
              onClick={handleCancelScan}
              disabled={isCanceling}
              className="flex items-center justify-center w-8 h-8 bg-red-900/50 hover:bg-red-900/70 text-red-400 hover:text-red-300 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel scan"
            >
              {isCanceling ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <X size={14} />
              )}
            </button>
          )}

          {/* Findings Summary */}
          {scan.status === 'COMPLETED' && scan.findingsCount > 0 && (
            <div className="flex gap-2">
              {getSeverityBadge(scan.criticalCount, 'Critical', 'bg-red-900 text-red-200')}
              {getSeverityBadge(scan.highCount, 'High', 'bg-orange-900 text-orange-200')}
              {getSeverityBadge(scan.mediumCount, 'Medium', 'bg-yellow-900 text-yellow-200')}
              {getSeverityBadge(scan.lowCount, 'Low', 'bg-blue-900 text-blue-200')}
              {getSeverityBadge(scan.infoCount, 'Info', 'bg-gray-900 text-gray-200')}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {scan.status === 'FAILED' && scan.errorMessage && (
        <div className="mt-2 text-sm text-red-300">
          Error: {scan.errorMessage}
        </div>
      )}
    </div>
  );
};

export default ScanRow; 
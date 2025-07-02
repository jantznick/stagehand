import React from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Info, Play } from 'lucide-react';
import useProgressPolling from '../../hooks/useProgressPolling';

const ScanRow = ({ scan, project, onScanClick, formatDate, formatDuration, getSeverityBadge, onScanComplete }) => {
  const isRunning = scan.status === 'RUNNING';
  const isActive = ['PENDING', 'QUEUED', 'RUNNING'].includes(scan.status);
  
  // Use progress polling for active scans
  const { progress } = useProgressPolling(
    scan.id, 
    project.id, 
    isActive,
    onScanComplete
  );

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
                ? `${progress}% complete`
                : scan.status.charAt(0) + scan.status.slice(1).toLowerCase()
              }
            </div>
            {scan.duration && (
              <div className="text-xs text-gray-400">
                Duration: {formatDuration(scan.duration)}
              </div>
            )}
            
            {/* Progress bar for active scans only */}
            {progress !== null && isActive && (
              <div className="mt-1 w-24 bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-400 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(progress, 5)}%` }}
                ></div>
              </div>
            )}
          </div>

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
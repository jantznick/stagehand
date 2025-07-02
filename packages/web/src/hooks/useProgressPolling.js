import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for polling scan progress
 * @param {string} scanId - The scan ID to poll
 * @param {string} projectId - The project ID
 * @param {boolean} isActive - Whether the scan is active (RUNNING status)
 * @param {function} onComplete - Callback triggered when scan completes
 * @returns {object} - { progress, status, isPolling }
 */
const useProgressPolling = (scanId, projectId, isActive, onComplete = null) => {
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup function
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPolling(false);
    }
  };

  // Fetch progress from API
  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/dast/scans/${scanId}/progress`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update state with API response
        setProgress(data.progress);
        setStatus(data.status);

        // If scan completed, trigger callback and stop polling
        if (!data.isActive && !hasCompleted && onComplete) {
          console.log(`Scan ${scanId} completed, triggering refresh...`);
          setHasCompleted(true);
          onComplete(scanId);
          stopPolling();
        } else if (!data.isActive) {
          stopPolling();
        }
      }
    } catch (error) {
      console.error(`Failed to fetch progress for scan ${scanId}:`, error);
      // Don't update state on error - keep last known values
    }
  };

  // Start polling when scan becomes active
  useEffect(() => {
    console.log(`useProgressPolling: isActive=${isActive}, scanId=${scanId}, projectId=${projectId}, hasInterval=${!!intervalRef.current}`);
    
    if (isActive && scanId && projectId && !intervalRef.current) {
      console.log(`Starting polling for scan ${scanId}`);
      setIsPolling(true);
      
      // Fetch immediately
      fetchProgress();
      
      // Then poll every 5 seconds
      intervalRef.current = setInterval(fetchProgress, 5000);
    } else if (!isActive && intervalRef.current) {
      console.log(`Stopping polling for scan ${scanId} - not active`);
      // Stop polling if scan is no longer active
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [isActive, scanId, projectId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, []);

  return {
    progress,
    status,
    isPolling
  };
};

export default useProgressPolling; 
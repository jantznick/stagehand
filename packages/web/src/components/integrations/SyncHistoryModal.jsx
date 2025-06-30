import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock } from 'lucide-react';
import useIntegrationStore from '../../stores/useIntegrationStore';
import { format } from 'date-fns';

const StatusIcon = ({ status }) => {
    switch (status) {
        case 'SUCCESS':
            return <CheckCircle className="text-green-500" size={18} />;
        case 'FAILURE':
            return <XCircle className="text-red-500" size={18} />;
        case 'IN_PROGRESS':
            return <Clock className="text-yellow-500" size={18} />;
        default:
            return null;
    }
};

const SyncHistoryModal = ({ isOpen, onClose, integrationId, integrationType }) => {
    const { syncLogs, isLogsLoading, error, fetchSyncLogs } = useIntegrationStore(state => ({
        syncLogs: state.syncLogs[integrationId] || [],
        isLogsLoading: state.isLogsLoading,
        error: state.error,
        fetchSyncLogs: state.fetchSyncLogs,
    }));

    useEffect(() => {
        if (isOpen && integrationId) {
            fetchSyncLogs(integrationId, integrationType);
        }
    }, [isOpen, integrationId, integrationType, fetchSyncLogs]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[var(--prussian-blue)] rounded-xl shadow-xl w-full max-w-2xl mx-4 border border-white/10">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-[var(--vanilla)]">Sync History</h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {isLogsLoading && <div className="text-center p-4">Loading history...</div>}
                    {error && <div className="text-center p-4 text-red-400">Error: {error}</div>}
                    {!isLogsLoading && !error && syncLogs.length === 0 && (
                        <div className="text-center p-4 text-gray-400">No sync history found for this integration.</div>
                    )}
                    {!isLogsLoading && !error && syncLogs.length > 0 && (
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-white/10 text-gray-300">
                                <tr>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Start Time</th>
                                    <th className="p-2">Duration</th>
                                    <th className="p-2">Added</th>
                                    <th className="p-2">Updated</th>
                                    <th className="p-2">Synced Projects</th>
                                    <th className="p-2">Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {syncLogs.map(log => {
                                    const startTime = new Date(log.startTime);
                                    const endTime = log.endTime ? new Date(log.endTime) : null;
                                    const duration = endTime ? `${((endTime - startTime) / 1000).toFixed(2)}s` : 'N/A';
                                    const syncedProjects = log.syncedProjectsJson && Array.isArray(log.syncedProjectsJson) ? log.syncedProjectsJson.join(', ') : 'N/A';
                                    
                                    return (
                                        <tr key={log.id} className="border-b border-white/5">
                                            <td className="p-2"><StatusIcon status={log.status} /></td>
                                            <td className="p-2">{format(startTime, 'yyyy-MM-dd HH:mm:ss')}</td>
                                            <td className="p-2">{duration}</td>
                                            <td className="p-2 text-green-400">{log.findingsAdded}</td>
                                            <td className="p-2 text-yellow-400">{log.findingsUpdated}</td>
                                            <td className="p-2 text-gray-300 truncate max-w-xs" title={syncedProjects}>
                                                {syncedProjects}
                                            </td>
                                            <td className="p-2 text-red-400 truncate max-w-xs" title={log.errorMessage}>
                                                {log.errorMessage || 'None'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SyncHistoryModal; 
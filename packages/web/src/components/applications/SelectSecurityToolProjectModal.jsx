import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import useProjectStore from '../../stores/useProjectStore';
import useIntegrationStore from '../../stores/useIntegrationStore';

const SelectSecurityToolProjectModal = ({ isOpen, onClose, project }) => {
  const { securityToolIntegrations, loading: integrationsLoading, error: integrationsError, fetchIntegrations, fetchSnykProjects } = useIntegrationStore();
  const { linkSecurityToolToProject } = useProjectStore();

  const [selectedIntegrationId, setSelectedIntegrationId] = useState('');
  const [snykProjects, setSnykProjects] = useState([]);
  const [selectedSnykProjectId, setSelectedSnykProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
        // We can reuse the fetchIntegrations from the store, it fetches both types
        const fetchAllIntegrations = async () => {
            if (!project) return;
            const resources = [];
            if (project.team?.company?.organizationId) resources.push({ type: 'organization', id: project.team.company.organizationId });
            for (const resource of resources) {
                await fetchIntegrations(resource.type, resource.id);
            }
        };
        fetchAllIntegrations();
    } else {
        // Reset state on close
        setSelectedIntegrationId('');
        setSnykProjects([]);
        setSelectedSnykProjectId('');
    }
  }, [isOpen, project, fetchIntegrations]);


  const handleIntegrationChange = async (integrationId) => {
    setSelectedIntegrationId(integrationId);
    setSelectedSnykProjectId('');
    setSnykProjects([]);
    
    if (!integrationId) return;
    setLoading(true);
    setError(null);
    try {
        const data = await fetchSnykProjects(integrationId);
        setSnykProjects(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleLinkProject = async () => {
      if (!selectedSnykProjectId) {
          setError('Please select a Snyk project.');
          return;
      }
      setLoading(true);
      setError(null);
      try {
          await linkSecurityToolToProject(project.id, {
              securityToolIntegrationId: selectedIntegrationId,
              provider: 'snyk',
              toolSpecificId: selectedSnykProjectId,
          });
          onClose(); // Close modal on success
      } catch (err) {
          setError(err.message);
      } finally {
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[var(--prussian-blue)] rounded-xl shadow-xl w-full max-w-xl mx-4 border border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-[var(--vanilla)]">Link Snyk Project to {project.name}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
            <div className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">Available Snyk Integrations</label>
                <select value={selectedIntegrationId} onChange={e => handleIntegrationChange(e.target.value)} className="w-full p-2 bg-white/5 border border-white/10 rounded-lg" disabled={integrationsLoading}>
                    <option value="">Select an integration...</option>
                    {securityToolIntegrations.filter(i => i.provider === 'Snyk').map(int => <option key={int.id} value={int.id}>{int.displayName} ({int.type})</option>)}
                </select>
            </div>
            {(integrationsLoading || integrationsError) && (
                <div className="text-sm">
                    {integrationsLoading && <p>Loading integrations...</p>}
                    {integrationsError && <p className="text-red-400">{integrationsError}</p>}
                </div>
            )}
            <div className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">Snyk Projects</label>
                <select value={selectedSnykProjectId} onChange={e => setSelectedSnykProjectId(e.target.value)} disabled={!selectedIntegrationId || loading} className="w-full p-2 bg-white/5 border border-white/10 rounded-lg">
                    <option value="">Select a project...</option>
                    {snykProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            {(loading || error) && (
                <div className="text-sm">
                    {loading && <p>Loading projects...</p>}
                    {error && <p className="text-red-400">{error}</p>}
                </div>
            )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-white/10">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
            <button onClick={handleLinkProject} disabled={loading || !selectedSnykProjectId} className="px-4 py-2 text-sm font-bold text-[var(--prussian-blue)] bg-[var(--orange-wheel)] rounded-md hover:bg-opacity-90">
                {loading ? 'Linking...' : 'Link Snyk Project'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SelectSecurityToolProjectModal; 
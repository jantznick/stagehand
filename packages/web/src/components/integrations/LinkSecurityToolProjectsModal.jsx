import React, { useState, useEffect, useCallback } from 'react';
import { X, Link } from 'lucide-react';
import useProjectStore from '../../stores/useProjectStore';
import useIntegrationStore from '../../stores/useIntegrationStore';

const LinkSecurityToolProjectsModal = ({ isOpen, onClose, integration, resourceType, resourceId }) => {
  const [snykProjects, setSnykProjects] = useState([]);
  const [stagehandProjects, setStagehandProjects] = useState([]);
  const [selectedSnykProject, setSelectedSnykProject] = useState('');
  const [selectedStagehandProject, setSelectedStagehandProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { linkSecurityToolToProject } = useProjectStore();
  const { fetchSnykProjects } = useIntegrationStore();

  const fetchSnyk = useCallback(async () => {
    if (!integration) return;
    setLoading(true);
    try {
      const data = await fetchSnykProjects(integration.id);
      setSnykProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [integration, fetchSnykProjects]);

  const fetchStagehandProjects = useCallback(async () => {
    if (!resourceType || !resourceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/by-resource?resourceType=${resourceType}&resourceId=${resourceId}`);
      if (!res.ok) throw new Error('Failed to fetch projects.');
      const data = await res.json();
      setStagehandProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [resourceType, resourceId]);

  useEffect(() => {
    if (isOpen) {
      fetchSnyk();
      fetchStagehandProjects();
    }
  }, [isOpen, fetchSnyk, fetchStagehandProjects]);
  
  const handleLink = async () => {
    if (!selectedStagehandProject || !selectedSnykProject) {
        setError('Please select both a Snyk project and a Stagehand project.');
        return;
    }
    setError(null);
    setLoading(true);
    try {
        const snykProj = snykProjects.find(p => p.id === selectedSnykProject);
        await linkSecurityToolToProject(selectedStagehandProject, {
            securityToolIntegrationId: integration.id,
            provider: 'snyk',
            toolSpecificId: snykProj.id,
        });
        fetchStagehandProjects(); // Refresh the projects list
        setSelectedSnykProject('');
        setSelectedStagehandProject('');
    } catch(err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[var(--prussian-blue)] rounded-xl shadow-xl w-full max-w-3xl mx-4 border border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-[var(--vanilla)]">
            Link Snyk Projects to Stagehand
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
            {error && <div className="text-red-400 text-sm">{error}</div>}
            
            <div className="flex items-end gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Available Snyk Projects</label>
                    <select value={selectedSnykProject} onChange={e => setSelectedSnykProject(e.target.value)} className="w-full p-2 bg-white/5 border border-white/10 rounded-lg">
                        <option value="">Select a Snyk project...</option>
                        {snykProjects.map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Stagehand Projects</label>
                    <select value={selectedStagehandProject} onChange={e => setSelectedStagehandProject(e.target.value)} className="w-full p-2 bg-white/5 border border-white/10 rounded-lg">
                        <option value="">Select a project...</option>
                        {stagehandProjects.filter(p => !p.toolSpecificIds?.snyk).map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
                    </select>
                </div>
                <button onClick={handleLink} disabled={loading} className="px-4 py-2 text-sm font-bold text-[var(--prussian-blue)] bg-[var(--orange-wheel)] rounded-md hover:bg-opacity-90">
                    Link
                </button>
            </div>

            <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold mb-3">Existing Links</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {stagehandProjects.filter(p => p.toolSpecificIds?.snyk).map(proj => (
                        <div key={proj.id} className="flex items-center gap-4 p-2 bg-black/20 rounded-md">
                            <Link size={16} className="text-gray-400" />
                            <span className="flex-1 font-medium">{proj.name}</span>
                            <span className="text-sm text-gray-400">
                                Linked to Snyk project
                            </span>
                        </div>
                    ))}
                    {stagehandProjects.filter(p => p.toolSpecificIds?.snyk).length === 0 && (
                        <p className="text-sm text-gray-500 text-center">No Snyk projects have been linked yet.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LinkSecurityToolProjectsModal; 
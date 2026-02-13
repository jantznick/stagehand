import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import useProjectStore from '../../stores/useProjectStore';
import useIntegrationStore from '../../stores/useIntegrationStore';

const SelectRepositoryModal = ({ isOpen, onClose, project, integration, resourceType, resourceId }) => {
  const { integrations, loading: integrationsLoading, error: integrationsError, fetchIntegrations, clearIntegrations } = useIntegrationStore();
  const { linkRepositoryToProject } = useProjectStore();

  const [selectedIntegrationId, setSelectedIntegrationId] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [selectedRepoUrl, setSelectedRepoUrl] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState(null);

  useEffect(() => {
    // Clear previous state when modal opens
    if (isOpen) {
      clearIntegrations();
      setSelectedIntegrationId('');
      setRepositories([]);
      setSelectedRepoUrl('');
    }
  }, [isOpen, clearIntegrations]);

  useEffect(() => {
    const fetchAllIntegrations = async () => {
        if (!isOpen) return;
        
        const resources = [];
        if (project?.id) resources.push({ type: 'project', id: project.id });
        if (project?.teamId) resources.push({ type: 'team', id: project.teamId });
        if (project?.team?.companyId) resources.push({ type: 'company', id: project.team.companyId });
        if (project?.team?.company?.organizationId) resources.push({ type: 'organization', id: project.team.company.organizationId });

        // If an integration is passed directly, use it.
        if (integration) {
            useIntegrationStore.setState({ integrations: [integration] });
            setSelectedIntegrationId(integration.id);
            handleIntegrationChange(integration.id);
        } else {
            // Otherwise, fetch all available integrations for the hierarchy
            for (const resource of resources) {
                await fetchIntegrations(resource.type, resource.id);
            }
        }
    };
    fetchAllIntegrations();

    if (isOpen && !project && resourceType && resourceId) {
        // If no project is passed, fetch all projects for the resource
        const fetchAllProjects = async () => {
            try {
                const res = await fetch(`/api/v1/projects/by-resource?resourceType=${resourceType}&resourceId=${resourceId}`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch projects: ${res.statusText}`);
                }
                const data = await res.json();
                setProjects(Array.isArray(data) ? data : []); // Ensure data is an array
            } catch (err) {
                setRepoError(err.message);
                setProjects([]); // Reset to empty array on error
            }
        };
        fetchAllProjects();
    }
  }, [isOpen, project, integration, fetchIntegrations]);


  const handleIntegrationChange = async (integrationId) => {
    setSelectedIntegrationId(integrationId);
    setSelectedRepoUrl('');
    setRepositories([]);
    
    if (!integrationId) {
        return;
    }
    setRepoLoading(true);
    setRepoError(null);
    try {
        const res = await fetch(`/api/v1/integrations/${integrationId}/repositories`);
        if (!res.ok) throw new Error('Failed to fetch repositories.');
        const data = await res.json();
        setRepositories(data);
    } catch (err) {
        setRepoError(err.message);
    } finally {
        setRepoLoading(false);
    }
  };

  const handleLinkRepository = async () => {
      if (!selectedRepoUrl) {
          setRepoError('Please select a repository.');
          return;
      }
      // Re-using repoLoading and repoError for the final link action
      setRepoLoading(true);
      setRepoError(null);
      try {
          await linkRepositoryToProject(project ? project.id : selectedProject, {
              repositoryUrl: selectedRepoUrl,
              scmIntegrationId: selectedIntegrationId
          });
          onClose(); // Close modal on success
      } catch (err) {
          setRepoError(err.message);
      } finally {
          setRepoLoading(false);
      }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[var(--prussian-blue)] rounded-xl shadow-xl w-full max-w-xl mx-4 border border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-[var(--vanilla)]">
            {project ? `Link Repository to ${project.name}` : 'Link Repositories'}
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
            {integration ? (
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Integration</label>
                    <div className="w-full p-2 bg-black/20 border border-white/10 rounded-lg text-white/80">
                        {integration.displayName} ({integration.provider})
                    </div>
                </div>
            ) : (
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Available Integrations</label>
                    <select value={selectedIntegrationId} onChange={e => handleIntegrationChange(e.target.value)} className="w-full p-2 bg-white/5 border border-white/10 rounded-lg" disabled={integrationsLoading}>
                        <option value="">Select an integration...</option>
                        {integrations.map(int => <option key={int.id} value={int.id}>{int.displayName} ({int.provider})</option>)}
                    </select>
                </div>
            )}
            {(integrationsLoading || integrationsError) && (
                <div className="text-sm">
                    {integrationsLoading && <p>Loading integrations...</p>}
                    {integrationsError && <p className="text-red-400">{integrationsError}</p>}
                </div>
            )}
            <div className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">Repositories</label>
                <select value={selectedRepoUrl} onChange={e => setSelectedRepoUrl(e.target.value)} disabled={!selectedIntegrationId || repoLoading} className="w-full p-2 bg-white/5 border border-white/10 rounded-lg">
                    <option value="">Select a repository...</option>
                    {repositories.map(repo => <option key={repo.id} value={repo.html_url}>{repo.full_name}</option>)}
                </select>
            </div>
            {!project && (
                <div className="w-full">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Project</label>
                    <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} disabled={!selectedIntegrationId || repoLoading} className="w-full p-2 bg-white/5 border border-white/10 rounded-lg">
                        <option value="">Select a project...</option>
                        {Array.isArray(projects) && projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            )}
            {(repoLoading || repoError) && (
                <div className="text-sm">
                    {repoLoading && <p>Loading repositories...</p>}
                    {repoError && <p className="text-red-400">{repoError}</p>}
                </div>
            )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-white/10">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
            <button onClick={handleLinkRepository} disabled={repoLoading || !selectedRepoUrl} className="px-4 py-2 text-sm font-bold text-[var(--prussian-blue)] bg-[var(--orange-wheel)] rounded-md hover:bg-opacity-90">
                {repoLoading ? 'Linking...' : 'Link Repository'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SelectRepositoryModal; 
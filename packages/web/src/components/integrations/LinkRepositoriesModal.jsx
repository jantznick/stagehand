import React, { useState, useEffect, useCallback } from 'react';
import { X, Link } from 'lucide-react';
import useProjectStore from '../../stores/useProjectStore';

const LinkRepositoriesModal = ({ isOpen, onClose, integration, resourceType, resourceId }) => {
  const [repositories, setRepositories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { linkRepositoryToProject } = useProjectStore();

  const fetchRepos = useCallback(async () => {
    if (!integration) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/integrations/${integration.id}/repositories`);
      if (!res.ok) throw new Error('Failed to fetch repositories.');
      const data = await res.json();
      setRepositories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [integration]);

  const fetchProjects = useCallback(async () => {
    if (!resourceType || !resourceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/by-resource?resourceType=${resourceType}&resourceId=${resourceId}`);
      if (!res.ok) throw new Error('Failed to fetch projects.');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [resourceType, resourceId]);

  useEffect(() => {
    if (isOpen) {
      fetchRepos();
      fetchProjects();
    }
  }, [isOpen, fetchRepos, fetchProjects]);
  
  const handleLink = async () => {
    if (!selectedProject || !selectedRepo) {
        setError('Please select both a repository and a project.');
        return;
    }
    setError(null);
    setLoading(true);
    try {
        const repo = repositories.find(r => r.html_url === selectedRepo);
        await linkRepositoryToProject(selectedProject, {
            repositoryUrl: repo.html_url,
            scmIntegrationId: integration.id,
        });
        // Refresh the projects list to show the new link
        fetchProjects();
        setSelectedProject('');
        setSelectedRepo('');
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
            Link Repositories from <span className="font-bold">{integration?.displayName}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
            {error && <div className="text-red-400 text-sm">{error}</div>}
            
            {/* Form to add a new link */}
            <div className="flex items-end gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Available Repositories</label>
                    <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} className="w-full p-2 bg-white/5 border border-white/10 rounded-lg">
                        <option value="">Select a repository...</option>
                        {repositories.map(repo => <option key={repo.id} value={repo.html_url}>{repo.full_name}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Stagehand Projects</label>
                    <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} className="w-full p-2 bg-white/5 border border-white/10 rounded-lg">
                        <option value="">Select a project...</option>
                        {projects.filter(p => !p.repositoryUrl).map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
                    </select>
                </div>
                <button onClick={handleLink} disabled={loading} className="px-4 py-2 text-sm font-bold text-[var(--prussian-blue)] bg-[var(--orange-wheel)] rounded-md hover:bg-opacity-90">
                    Link
                </button>
            </div>

            {/* List of already linked projects */}
            <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold mb-3">Existing Links</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {projects.filter(p => p.repositoryUrl).map(proj => (
                        <div key={proj.id} className="flex items-center gap-4 p-2 bg-black/20 rounded-md">
                            <Link size={16} className="text-gray-400" />
                            <span className="flex-1 font-medium">{proj.name}</span>
                            <a href={proj.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">
                                {proj.repositoryUrl.replace('https://github.com/', '')}
                            </a>
                        </div>
                    ))}
                    {projects.filter(p => p.repositoryUrl).length === 0 && (
                        <p className="text-sm text-gray-500 text-center">No repositories have been linked yet.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LinkRepositoriesModal; 
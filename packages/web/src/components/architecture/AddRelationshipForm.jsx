import React, { useState, useMemo } from 'react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import useArchitectureStore from '../../stores/useArchitectureStore';
import { ArrowRightLeft } from 'lucide-react';

const AddRelationshipForm = ({ sourceProjectId }) => {
  const [targetProjectId, setTargetProjectId] = useState('');
  const [type, setType] = useState('API');
  const [direction, setDirection] = useState('outbound'); // 'outbound' or 'inbound'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { activeCompany } = useHierarchyStore((state) => ({
    activeCompany: state.activeCompany,
  }));

  const createRelationship = useArchitectureStore((state) => state.createRelationship);

  const allProjects = useMemo(() => {
    if (!activeCompany?.teams) return [];
    return activeCompany.teams.flatMap(team => team.projects || []);
  }, [activeCompany]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetProjectId || !type) {
      setError('Please select a target project and a type.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const relationshipData = {
      sourceProjectId: direction === 'outbound' ? sourceProjectId : targetProjectId,
      targetProjectId: direction === 'outbound' ? targetProjectId : sourceProjectId,
      type,
    };

    try {
      await createRelationship(activeCompany.id, relationshipData);
      setTargetProjectId('');
      setType('API');
      setDirection('outbound');
    } catch (err) {
      const apiError = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      setError(apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <div className="flex items-center justify-between p-3 my-4 text-sm text-red-300 bg-red-900/40 border border-red-700/50 rounded-md">
        <p className="flex-grow"><span className="font-semibold">Error:</span> {error}</p>
        <button
          type="button"
          onClick={() => setError(null)}
          className="ml-4 p-1 rounded-full text-red-300 hover:bg-red-800/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Close error message"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div>
      {renderError()}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-end gap-x-3">
          <div className="flex-grow">
            <label htmlFor="target-project" className="block text-sm font-medium text-gray-400">
              {direction === 'outbound' ? 'This Application Depends On...' : 'This Application Is Used By...'}
            </label>
            <select
              id="target-project"
              value={targetProjectId}
              onChange={(e) => setTargetProjectId(e.target.value)}
              disabled={isSubmitting}
              required
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            >
              <option value="" disabled>Select a project...</option>
              {allProjects
                .filter(p => p.id !== sourceProjectId)
                .map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
            </select>
          </div>
          
          <button
            type="button"
            onClick={() => setDirection(d => d === 'outbound' ? 'inbound' : 'outbound')}
            className="p-2 self-end mb-1 text-gray-400 hover:text-white"
            title="Switch dependency direction"
          >
            <ArrowRightLeft size={20} />
          </button>

          <div className="flex-grow">
            <label htmlFor="relationship-type" className="block text-sm font-medium text-gray-400">
              As a...
            </label>
            <input
              id="relationship-type"
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g., API, DATABASE"
              disabled={isSubmitting}
              required
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRelationshipForm; 
import React, { useState, useEffect } from 'react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import ContactManager from '../contacts/ContactManager';
import TechnologyManager from '../technologies/TechnologyManager';
import ProjectGraphContainer from '../architecture/ProjectGraphContainer';

const ApplicationDetails = ({ project }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableProject, setEditableProject] = useState(project);

  const { updateProject, isLoading, fetchAndSetSelectedItem } = useHierarchyStore();

  useEffect(() => {
    setEditableProject(project);
  }, [project]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableProject(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProject(project.id, editableProject);
      await fetchAndSetSelectedItem('project', project.id); // Refresh data
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update project", error);
      // Optionally: show an error message to the user
    }
  };

  const handleCancel = () => {
    setEditableProject(project);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      {/* Header with Edit/Save buttons */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <h3 className="text-xl font-semibold text-white">
          Application Details
        </h3>
        <div>
          {isEditing ? (
            <div className="flex items-center gap-x-2">
              <button onClick={handleCancel} className="px-3 py-1 text-sm rounded-md bg-gray-600 hover:bg-gray-500">Cancel</button>
              <button onClick={handleSave} className="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-500" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-3 py-1 text-sm rounded-md bg-gray-700 hover:bg-gray-600">Edit</button>
          )}
        </div>
      </div>
      
      {/* Core Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400">Application URL</label>
          {isEditing ? (
            <input type="text" name="applicationUrl" value={editableProject.applicationUrl || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
          ) : (
            <p className="mt-1 text-white">{project.applicationUrl || 'Not set'}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400">Version</label>
          {isEditing ? (
            <input type="text" name="version" value={editableProject.version || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
          ) : (
            <p className="mt-1 text-white">{project.version || 'Not set'}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400">Deployment Status</label>
           {isEditing ? (
            <select name="deploymentStatus" value={editableProject.deploymentStatus || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2">
              <option value="PLANNING">Planning</option>
              <option value="IN_DEVELOPMENT">In Development</option>
              <option value="TESTING">Testing</option>
              <option value="RELEASED">Released</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          ) : (
            <p className="mt-1 text-white capitalize">{project.deploymentStatus?.toLowerCase().replace('_', ' ') || 'Not set'}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400">Repository</label>
          {isEditing ? (
            <input type="text" name="repositoryUrl" value={editableProject.repositoryUrl || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
          ) : (
            <p className="mt-1 text-white">{project.repositoryUrl || 'Not set'}</p>
          )}
        </div>
      </div>

      {/* Contacts Section */}
      <ContactManager project={project} />

      {/* Technologies Section */}
      <TechnologyManager project={project} />

	  {/* Dependencies Graph Section */}
	  <div className="pt-8">
        <ProjectGraphContainer 
          projectId={project.id} 
          companyId={project.team?.companyId} 
        />
      </div>
    </div>
  );
};

export default ApplicationDetails; 
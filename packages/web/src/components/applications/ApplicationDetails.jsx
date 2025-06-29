import React, { useState, useEffect } from 'react';
import useHierarchyStore from '../../stores/useHierarchyStore';
import ContactManager from '../contacts/ContactManager';
import TechnologyManager from '../technologies/TechnologyManager';
import ProjectGraphContainer from '../architecture/ProjectGraphContainer';
import LinkRepositoryControl from './LinkRepositoryControl';

const ApplicationDetails = ({ project }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableProject, setEditableProject] = useState(project);

  const { updateProject, isLoading, fetchAndSetSelectedItem } = useHierarchyStore();

  useEffect(() => {
    setEditableProject(project);
  }, [project]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditableProject(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
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

  const formatEnum = (value) => {
    if (!value) return 'Not set';
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
        <LinkRepositoryControl project={project} isEditing={isEditing} />
      </div>

      {/* Operational Readiness Section */}
      <div className="pt-6">
        <h4 className="text-lg font-medium text-white pb-2 border-b border-white/10">Operational Readiness</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Communication Channel</label>
            {isEditing ? (
              <input type="text" name="communicationChannel" value={editableProject.communicationChannel || ''} onChange={handleInputChange} placeholder="e.g., #engineering-app-alerts" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
            ) : (
              <p className="mt-1 text-white">{project.communicationChannel || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Documentation URL</label>
            {isEditing ? (
              <input type="text" name="documentationUrl" value={editableProject.documentationUrl || ''} onChange={handleInputChange} placeholder="e.g., Confluence, Notion" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
            ) : (
              <p className="mt-1 text-white">{project.documentationUrl || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">API Reference URL</label>
            {isEditing ? (
              <input type="text" name="apiReferenceUrl" value={editableProject.apiReferenceUrl || ''} onChange={handleInputChange} placeholder="e.g., Swagger, OpenAPI" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
            ) : (
              <p className="mt-1 text-white">{project.apiReferenceUrl || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Runbook URL</label>
            {isEditing ? (
              <input type="text" name="runbookUrl" value={editableProject.runbookUrl || ''} onChange={handleInputChange} placeholder="Link to on-call runbooks" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
            ) : (
              <p className="mt-1 text-white">{project.runbookUrl || 'Not set'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Security & Compliance Section */}
      <div className="pt-6">
        <h4 className="text-lg font-medium text-white pb-2 border-b border-white/10">Security & Compliance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-400">Application Type</label>
            {isEditing ? (
              <select name="projectType" value={editableProject.projectType || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2">
                <option value="">Select type...</option>
                <option value="SERVICE">Service</option>
                <option value="LIBRARY">Library</option>
                <option value="FRONTEND_APP">Frontend App</option>
				<option value="BACKEND_APP">Backend App</option>
                <option value="MOBILE_APP">Mobile App</option>
                <option value="CLI_TOOL">CLI Tool</option>
				<option value="OWNED_HARDWARE">Owned Hardware</option>
				<option value="CLOUD_HARDWARE">Cloud Hardware</option>
				<option value="EXTERNAL_BOUGHT_SOFTWARE">External Bought Software</option>
                <option value="OTHER">Other</option>
              </select>
            ) : (
              <p className="mt-1 text-white">{formatEnum(project.projectType)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Data Classification</label>
            {isEditing ? (
              <select name="dataClassification" value={editableProject.dataClassification || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2">
                <option value="">Select classification...</option>
                <option value="PUBLIC">Public</option>
                <option value="INTERNAL">Internal</option>
                <option value="SENSITIVE">Sensitive</option>
                <option value="RESTRICTED">Restricted</option>
              </select>
            ) : (
              <p className="mt-1 text-white">{formatEnum(project.dataClassification)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Application Criticality</label>
            {isEditing ? (
              <select name="applicationCriticality" value={editableProject.applicationCriticality || ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2">
                <option value="">Select criticality...</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            ) : (
              <p className="mt-1 text-white">{formatEnum(project.applicationCriticality)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Last Security Review</label>
            {isEditing ? (
              <input type="date" name="lastSecurityReview" value={editableProject.lastSecurityReview ? new Date(editableProject.lastSecurityReview).toISOString().split('T')[0] : ''} onChange={handleInputChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
            ) : (
              <p className="mt-1 text-white">{project.lastSecurityReview ? new Date(project.lastSecurityReview).toLocaleDateString() : 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Threat Model</label>
            {isEditing ? (
              <input type="text" name="threatModelUrl" value={editableProject.threatModelUrl || ''} onChange={handleInputChange} placeholder="Link to threat model" className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2" />
            ) : (
              <p className="mt-1 text-white">{project.threatModelUrl || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Externally Exposed</label>
            {isEditing ? (
                <div className="flex items-center h-full">
                    <input id="isExternallyExposed" name="isExternallyExposed" type="checkbox" checked={editableProject.isExternallyExposed || false} onChange={handleInputChange} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500" />
                </div>
            ) : (
              <p className="mt-1 text-white">{project.isExternallyExposed ? 'Yes' : 'No'}</p>
            )}
          </div>
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
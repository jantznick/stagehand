import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectRepositoryModal from './SelectRepositoryModal';
import { GitBranch } from 'lucide-react';

const LinkRepositoryControl = ({ project, isEditing }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasIntegrations, setHasIntegrations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkForIntegrations = async () => {
      if (!isEditing || !project) {
        setHasIntegrations(false);
        return;
      }
      
      setIsLoading(true);
      const resources = [];
      if (project.id) resources.push({ type: 'project', id: project.id });
      if (project.teamId) resources.push({ type: 'team', id: project.teamId });
      if (project.team?.companyId) resources.push({ type: 'company', id: project.team.companyId });
      if (project.team?.company?.organizationId) resources.push({ type: 'organization', id: project.team.company.organizationId });

      let found = false;
      for (const resource of resources) {
        try {
          const response = await fetch(`/api/v1/integrations?resourceType=${resource.type}&resourceId=${resource.id}`);
          if (response.ok) {
            const integrations = await response.json();
            if (integrations.length > 0) {
              found = true;
              break; // Found an integration, no need to check further
            }
          }
        } catch (error) {
          console.error(`Failed to check integrations for ${resource.type}`, error);
        }
      }
      setHasIntegrations(found);
      setIsLoading(false);
    };

    checkForIntegrations();
  }, [isEditing, project]);

  const handleLinkClick = () => {
    if (hasIntegrations) {
      setIsModalOpen(true);
    } else {
      const orgId = project.team?.company?.organizationId;
      if (orgId) {
        navigate(`/settings/organization/${orgId}#integrations-section`);
      } else {
        // Fallback or error for when there's no org context
        console.error("Cannot navigate to settings, organization ID not found in project context.");
        // Maybe show a toast notification to the user
      }
    }
  };

  // In view mode, display the linked repository with an icon if integrated.
  if (!isEditing) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-400">Repository</label>
        <div className="flex items-center gap-2 mt-1">
          {project.repositoryUrl ? (
            <>
              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                {project.repositoryUrl}
              </a>
              {project.scmIntegrationId && (
                <div title="Managed by SCM Integration">
                  <GitBranch size={16} className="text-gray-400" />
                </div>
              )}
            </>
          ) : (
            <p className="text-white">Not set</p>
          )}
        </div>
      </div>
    );
  }

  // In editing mode, show a text link to open the modal or navigate.
  return (
    <div>
      <div className="flex items-center gap-x-2">
        <label className="block text-sm font-medium text-gray-400">Repository</label>
        {!isLoading && (
          <button 
            onClick={handleLinkClick}
            className="text-xs text-blue-400 hover:underline"
            title={hasIntegrations ? "Link repository from an existing integration" : "No integrations found. Click to go to Settings to add one."}
          >
            (link via SCM integration)
          </button>
        )}
      </div>
      <div className="flex items-center gap-4 mt-1">
        <p className="flex-grow p-2 bg-gray-800 border-gray-600 rounded-md shadow-sm text-white truncate">
          {project.repositoryUrl || 'No repository linked.'}
        </p>
      </div>
      
      {hasIntegrations && (
        <SelectRepositoryModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          project={project}
        />
      )}
    </div>
  );
};

export default LinkRepositoryControl; 
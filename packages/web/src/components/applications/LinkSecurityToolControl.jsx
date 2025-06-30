import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectSecurityToolProjectModal from './SelectSecurityToolProjectModal';
import { ShieldCheck } from 'lucide-react';

const LinkSecurityToolControl = ({ project, isEditing }) => {
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
          const response = await fetch(`/api/v1/security-tools?resourceType=${resource.type}&resourceId=${resource.id}`);
          if (response.ok) {
            const integrations = await response.json();
            if (integrations.some(i => i.provider === 'Snyk')) { // Specifically check for Snyk
              found = true;
              break;
            }
          }
        } catch (error) {
          console.error(`Failed to check security tool integrations for ${resource.type}`, error);
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
        navigate(`/settings/organization/${orgId}#security-tool-integrations-section`);
      } else {
        console.error("Cannot navigate to settings, organization ID not found in project context.");
      }
    }
  };

  const snykProjectId = project.toolSpecificIds?.snyk;

  if (!isEditing) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-400">Snyk Project Link</label>
        <div className="flex items-center gap-2 mt-1">
          {snykProjectId ? (
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck size={16} className="text-green-400" />
              <span>Linked</span>
            </div>
          ) : (
            <p className="text-white">Not linked</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-x-2">
        <label className="block text-sm font-medium text-gray-400">Snyk Project Link</label>
        {!isLoading && (
          <button 
            onClick={handleLinkClick}
            className="text-xs text-blue-400 hover:underline"
            title={hasIntegrations ? "Link Snyk project" : "No Snyk integrations found. Click to go to Settings to add one."}
          >
            (link Snyk project)
          </button>
        )}
      </div>
      <div className="flex items-center gap-4 mt-1">
        <p className="flex-grow p-2 bg-gray-800 border-gray-600 rounded-md shadow-sm text-white truncate">
          {snykProjectId || 'No Snyk project linked.'}
        </p>
      </div>
      
      {hasIntegrations && (
        <SelectSecurityToolProjectModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          project={project}
        />
      )}
    </div>
  );
};

export default LinkSecurityToolControl; 
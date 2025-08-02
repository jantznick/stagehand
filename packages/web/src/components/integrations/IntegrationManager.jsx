import React, { useState, useEffect } from 'react';
import useIntegrationStore from '../../stores/useIntegrationStore';
import { Github, Trash2, Link, ShieldCheck, History } from 'lucide-react';
import { DiBitbucket } from "react-icons/di";
import AddIntegrationModal from './AddIntegrationModal';
import ConfirmationModal from '../ConfirmationModal';
import SelectRepositoryModal from '../applications/SelectRepositoryModal';
import LinkSecurityToolProjectsModal from './LinkSecurityToolProjectsModal';
import SyncHistoryModal from './SyncHistoryModal';
import {
  CloudArrowDownIcon,
  LinkIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';

const SCM_ICONS = {
  GITHUB: Github,
  // Add other icons as needed
};

const SECURITY_TOOL_ICONS = {
  Snyk: ShieldCheck,
};

const IntegrationManager = ({ resourceType, resourceId }) => {
  const {
    integrations,
    securityToolIntegrations,
    loading,
    error,
    fetchIntegrations,
    connectGitHub,
    addSnykIntegration,
    disconnectIntegration,
    syncSecurityToolIntegration,
  } = useIntegrationStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLinkRepoModalOpen, setIsLinkRepoModalOpen] = useState(false);
  const [isLinkSecurityModalOpen, setIsLinkSecurityModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState('');
  const [integrationToDisconnect, setIntegrationToDisconnect] = useState(null);

  useEffect(() => {
    if (resourceType && resourceId) {
      fetchIntegrations(resourceType, resourceId);
    }
  }, [resourceType, resourceId, fetchIntegrations]);

  const handleDisconnect = () => {
    if (integrationToDisconnect) {
      disconnectIntegration(integrationToDisconnect.id);
      setIntegrationToDisconnect(null);
    }
  };

  const openLinkRepoModal = (integration) => {
    setSelectedIntegration(integration);
    setIsLinkRepoModalOpen(true);
  };

  const openLinkSecurityModal = (integration) => {
    setSelectedIntegration(integration);
    setIsLinkSecurityModalOpen(true);
  };

  const openHistoryModal = (integration, type) => {
    setSelectedIntegration(integration);
    setSelectedIntegrationType(type);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="mt-8 space-y-8">
      {/* SCM Integrations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" id="integrations-section">SCM Integrations</h2>
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 text-sm font-bold text-[var(--prussian-blue)] bg-[var(--orange-wheel)] rounded-md hover:bg-opacity-90 disabled:bg-opacity-50"
            >
                Add Integration
            </button>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            {error && <p className="text-red-400 mb-4">{error}</p>}
            
            <div className="space-y-3">
              {integrations.length > 0 ? (
                integrations.map(integration => {
                  const Icon = SCM_ICONS[integration.provider] || Github;
                  return (
                    <div key={integration.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1">
                        <Icon className="w-6 h-6 text-gray-300" />
                        <div>
                          <span className="font-medium">{integration.provider}</span>
                            <p className="text-sm text-gray-400">
                                Connected as: <span className="font-semibold text-gray-300">{integration.displayName}</span>
                            </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                            onClick={() => openLinkRepoModal(integration)}
                            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title="Link Repositories"
                        >
                            <Link size={18} />
                        </button>
                        <button
                            onClick={() => openHistoryModal(integration, 'SCM')}
                            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title="Sync History"
                        >
                            <History size={18} />
                        </button>
                        <button
                            onClick={() => setIntegrationToDisconnect(integration)}
                            disabled={loading}
                            className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                            title="Disconnect"
                        >
                            <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-400 text-center py-4">No SCM integrations connected.</p>
              )}
            </div>
        </div>
      </div>

      {/* Security Tool Integrations Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" id="security-tool-integrations-section">Security Tool Integrations</h2>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="space-y-3">
              {securityToolIntegrations.length > 0 ? (
                securityToolIntegrations.map(integration => {
                  const Icon = SECURITY_TOOL_ICONS[integration.provider] || ShieldCheck;
                  return (
                    <div key={integration.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1">
                        <Icon className="w-6 h-6 text-gray-300" />
                        <div>
                          <span className="font-medium">{integration.provider}</span>
                            <p className="text-sm text-gray-400">
                                Type: <span className="font-semibold text-gray-300">{integration.type}</span>
                            </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                            onClick={() => openLinkSecurityModal(integration)}
                            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title="Link Projects"
                        >
                            <Link size={18} />
                        </button>
                        <button
                          onClick={() => openHistoryModal(integration, 'SecurityTool')}
                          className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                          title="Sync History"
                        >
                          <History size={18} />
                        </button>
                        <button
                          onClick={() => syncSecurityToolIntegration(integration.id, resourceType, resourceId)}
                          disabled={loading}
                          className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Sync Now"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => alert('Editing coming soon!')}
                          className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => alert('Deletion coming soon!')}
                          className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-400 text-center py-4">No security tool integrations connected.</p>
              )}
            </div>
        </div>
      </div>

        <AddIntegrationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onConnectGitHub={connectGitHub}
          onAddSnyk={addSnykIntegration}
          resourceType={resourceType}
          resourceId={resourceId}
        />
        
        {selectedIntegration && (
            <SelectRepositoryModal
                isOpen={isLinkRepoModalOpen}
                onClose={() => setIsLinkRepoModalOpen(false)}
                integration={selectedIntegration}
                resourceType={resourceType}
                resourceId={resourceId}
            />
        )}

        {selectedIntegration && (
            <LinkSecurityToolProjectsModal
                isOpen={isLinkSecurityModalOpen}
                onClose={() => setIsLinkSecurityModalOpen(false)}
                integration={selectedIntegration}
                resourceType={resourceType}
                resourceId={resourceId}
            />
        )}
        
        {isHistoryModalOpen && selectedIntegration && (
            <SyncHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                integrationId={selectedIntegration.id}
                integrationType={selectedIntegrationType}
            />
        )}
        
        {integrationToDisconnect && (
            <ConfirmationModal
                isOpen={!!integrationToDisconnect}
                onClose={() => setIntegrationToDisconnect(null)}
                onConfirm={handleDisconnect}
                title="Disconnect Integration"
                message={`Are you sure you want to disconnect the integration with ${integrationToDisconnect.displayName}? Stagehand will lose access to this installation.`}
                confirmText="Disconnect"
                isLoading={loading}
            />
        )}
    </div>
  );
};

export default IntegrationManager; 
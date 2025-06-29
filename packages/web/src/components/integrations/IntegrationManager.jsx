import React, { useState, useEffect } from 'react';
import useIntegrationStore from '../../stores/useIntegrationStore';
import { Github, Trash2, Link } from 'lucide-react';
import { DiBitbucket } from "react-icons/di";
import AddIntegrationModal from './AddIntegrationModal';
import ConfirmationModal from '../ConfirmationModal';
import LinkRepositoriesModal from './LinkRepositoriesModal';

const SCM_PROVIDERS = [
  {
    name: 'GitHub',
    providerKey: 'GITHUB',
    Icon: Github,
    connect: (resourceType, resourceId, connectFn) => connectFn(resourceType, resourceId),
  },
  // {
  //   name: 'Bitbucket',
  //   providerKey: 'BITBUCKET',
//     Icon: DiBitbucket,
//     connect: () => alert('Bitbucket integration coming soon!'),
//   },
];

// A map to get the correct icon for a given provider key
const ICONS = {
  GITHUB: Github,
  // Add other icons as needed
};

const IntegrationManager = ({ resourceType, resourceId }) => {
  const {
    integrations,
    loading,
    error,
    fetchIntegrations,
    connectGitHub,
    disconnectIntegration
  } = useIntegrationStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
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

  const openLinkModal = (integration) => {
    setSelectedIntegration(integration);
    setIsLinkModalOpen(true);
  };

  return (
    <div className="mt-8">
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
                  const Icon = ICONS[integration.provider] || Github;
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
                            onClick={() => openLinkModal(integration)}
                            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title="Link Repositories"
                        >
                            <Link size={18} />
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
                <p className="text-gray-400 text-center py-4">No integrations connected.</p>
              )}
            </div>
        </div>

        <AddIntegrationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onConnectGitHub={connectGitHub}
          resourceType={resourceType}
          resourceId={resourceId}
        />
        
        {selectedIntegration && (
            <LinkRepositoriesModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                integration={selectedIntegration}
                resourceType={resourceType}
                resourceId={resourceId}
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
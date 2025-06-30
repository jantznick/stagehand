import React, { useState } from 'react';
import { X, Github, Gitlab } from 'lucide-react';
import { DiBitbucket } from "react-icons/di";
import { SiSnyk } from "react-icons/si";
import { FaCode } from "react-icons/fa";
import { MdOutlineSecurity } from "react-icons/md";
import { VscAzureDevops } from "react-icons/vsc"; // Using react-icons for Azure DevOps as it's not in lucide
import AddSecurityToolModal from './AddSecurityToolModal';

const SCM_PROVIDERS = [
  {
    name: 'GitHub',
    providerKey: 'GITHUB',
    Icon: Github,
    action: (connectFn, resourceType, resourceId) => connectFn(resourceType, resourceId),
  },
  {
    name: 'Azure DevOps',
    providerKey: 'AZURE_DEVOPS',
    Icon: VscAzureDevops,
    action: () => alert('Azure DevOps integration coming soon!'),
    disabled: true
  },
  {
    name: 'Bitbucket',
    providerKey: 'BITBUCKET',
    Icon: DiBitbucket,
    action: () => alert('Bitbucket integration coming soon!'),
    disabled: true
  },
];

const SECURITY_TOOL_PROVIDERS = [
  {
    name: 'Snyk',
    providerKey: 'SNYK',
    Icon: SiSnyk,
    action: (setScreen) => setScreen('snyk_form'),
  },
  // Future tools can be added here
];

const INTEGRATION_TYPES = [
    {
      name: 'SCM Integration',
      description: 'Connect to providers like GitHub for repository linking.',
      Icon: FaCode,
      action: (setScreen) => setScreen('scm_select'),
    },
    {
      name: 'Security Tool',
      description: 'Connect to tools like Snyk for vulnerability scanning.',
      Icon: MdOutlineSecurity,
      action: (setScreen) => setScreen('security_tool_select'),
    },
];

const AddIntegrationModal = ({ isOpen, onClose, onConnectGitHub, onAddSnyk, resourceType, resourceId }) => {
  const [screen, setScreen] = useState('initial'); // 'initial', 'scm_select', 'security_tool_select', 'snyk_form'

  if (!isOpen) return null;

  const handleClose = () => {
    setScreen('initial');
    onClose();
  };

  if (screen === 'snyk_form') {
    return <AddSecurityToolModal isOpen={true} onClose={handleClose} onAddSnyk={onAddSnyk} resourceType={resourceType} resourceId={resourceId} />
  }

  const renderInitialSelection = () => (
    <div className="p-6">
        <p className="text-sm text-gray-400 mb-6">What type of integration would you like to add?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {INTEGRATION_TYPES.map(({ name, description, Icon, action }) => (
                <button
                    key={name}
                    onClick={() => action(setScreen)}
                    className="flex flex-col items-start p-6 bg-white/5 border border-white/10 rounded-lg text-left text-white/80 hover:bg-white/10 hover:border-[var(--orange-wheel)] transition-all duration-200"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Icon size={24} />
                        <span className="font-semibold text-lg">{name}</span>
                    </div>
                    <p className="text-sm text-gray-400">{description}</p>
                </button>
            ))}
        </div>
    </div>
  );

  const renderScmProviderSelection = () => (
    <div className="p-6">
        <button onClick={() => setScreen('initial')} className="text-sm text-gray-400 hover:text-white mb-4">&larr; Back</button>
        <p className="text-sm text-gray-400 mb-6">Select an SCM provider to connect to this resource.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCM_PROVIDERS.map(({ name, Icon, action, disabled }) => (
              <button
                key={name}
                onClick={() => action(onConnectGitHub, resourceType, resourceId)}
                disabled={disabled}
                className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-lg text-center text-white/80 hover:bg-white/10 hover:border-[var(--orange-wheel)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/10"
              >
                <Icon size={32} className="mb-3" />
                <span className="font-semibold">{name}</span>
                {disabled && <span className="text-xs text-gray-500 mt-1">(Coming Soon)</span>}
              </button>
            ))}
        </div>
    </div>
  );

  const renderSecurityProviderSelection = () => (
    <div className="p-6">
      <button onClick={() => setScreen('initial')} className="text-sm text-gray-400 hover:text-white mb-4">&larr; Back</button>
      <p className="text-sm text-gray-400 mb-6">Select a Security Tool provider to connect.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECURITY_TOOL_PROVIDERS.map(({ name, Icon, action, disabled }) => (
          <button
            key={name}
            onClick={() => action(setScreen)}
            disabled={disabled}
            className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-lg text-center text-white/80 hover:bg-white/10 hover:border-[var(--orange-wheel)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:border-white/10"
          >
            <Icon size={32} className="mb-3" />
            <span className="font-semibold">{name}</span>
            {disabled && <span className="text-xs text-gray-500 mt-1">(Coming Soon)</span>}
          </button>
        ))}
      </div>
    </div>
  );
  
  const renderContent = () => {
    switch (screen) {
        case 'scm_select':
            return renderScmProviderSelection();
        case 'security_tool_select':
            return renderSecurityProviderSelection();
        case 'initial':
        default:
            return renderInitialSelection();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[var(--prussian-blue)] rounded-xl shadow-xl w-full max-w-lg mx-4 border border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-[var(--vanilla)]">
            Add New Integration
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]"
          >
            <X size={20} />
          </button>
        </div>
        
        {renderContent()}

      </div>
    </div>
  );
};

export default AddIntegrationModal; 
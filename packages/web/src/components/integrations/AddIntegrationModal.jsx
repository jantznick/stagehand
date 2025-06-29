import React from 'react';
import { X, Github, Gitlab } from 'lucide-react';
import { DiBitbucket } from "react-icons/di";
import { VscAzureDevops } from "react-icons/vsc"; // Using react-icons for Azure DevOps as it's not in lucide

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


const AddIntegrationModal = ({ isOpen, onClose, onConnectGitHub, resourceType, resourceId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[var(--prussian-blue)] rounded-xl shadow-xl w-full max-w-lg mx-4 border border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-[var(--vanilla)]">
            Add New SCM Integration
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-400 mb-6">Select a provider to connect to this resource.</p>
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
      </div>
    </div>
  );
};

export default AddIntegrationModal; 
import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';

const AddSecurityToolModal = ({ isOpen, onClose, resourceType, resourceId, onAddSnyk }) => {
  const [apiToken, setApiToken] = useState('');
  const [orgId, setOrgId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddSnyk({ 
      provider: 'Snyk', 
      type: 'SCA', 
      displayName: `Snyk (${orgId.substring(0, 8)})`,
      credentials: { apiToken, orgId }, 
      resourceType, 
      resourceId 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[var(--prussian-blue)] rounded-xl shadow-xl w-full max-w-lg mx-4 border border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-[var(--vanilla)]">
            Add Snyk Integration
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-[var(--vanilla)]/60 hover:text-[var(--xanthous)]"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                <ShieldCheck size={32} className="text-[var(--orange-wheel)]" />
                <p className="text-sm text-gray-300">
                    Connect your Snyk organization to import vulnerability data from your monitored projects.
                </p>
            </div>

            <div>
              <label htmlFor="orgId" className="block text-sm font-medium text-gray-300 mb-1">
                Snyk Organization ID
              </label>
              <input
                type="text"
                id="orgId"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                required
                className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-white placeholder-gray-400 focus:ring-1 focus:ring-[var(--orange-wheel)] focus:border-[var(--orange-wheel)]"
                placeholder="e.g., 2a1b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
              />
            </div>

            <div>
              <label htmlFor="apiToken" className="block text-sm font-medium text-gray-300 mb-1">
                Snyk API Token
              </label>
              <input
                type="password"
                id="apiToken"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                required
                className="w-full bg-black/20 border border-white/10 rounded-md p-2 text-white placeholder-gray-400 focus:ring-1 focus:ring-[var(--orange-wheel)] focus:border-[var(--orange-wheel)]"
                placeholder="v1.xxxx-xxxx-xxxx-xxxx"
              />
            </div>
          </div>
          <div className="p-6 bg-black/20 rounded-b-xl flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-white/10 text-white hover:bg-white/20">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-bold text-[var(--prussian-blue)] bg-[var(--orange-wheel)] rounded-md hover:bg-opacity-90">
              Add Integration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSecurityToolModal; 
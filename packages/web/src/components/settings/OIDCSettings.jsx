import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import useOIDCStore from '../../stores/useOIDCStore';
import useHierarchyStore from '../../stores/useHierarchyStore';
import ConfirmationModal from '../ConfirmationModal';

export default function OIDCSettings() {
  const { activeOrganization } = useHierarchyStore();
  const { oidcConfig, fetchOIDCConfig, saveOIDCConfig, deleteOIDCConfig, loading, error } = useOIDCStore();
  
  const [formData, setFormData] = useState({
    isEnabled: false,
    issuer: '',
    clientId: '',
    clientSecret: '',
    authorizationUrl: '',
    tokenUrl: '',
    userInfoUrl: '',
    defaultRole: 'READER',
    buttonText: '',
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const orgId = activeOrganization?.id;

  const callbackUrl = useMemo(() => {
    // Construct the callback URL based on the current window's origin.
    // This is more reliable than environment variables on the frontend.
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/v1/auth/oidc/callback`;
    }
    return '';
  }, []);

  useEffect(() => {
    if (orgId) {
      fetchOIDCConfig(orgId);
    }
  }, [orgId, fetchOIDCConfig]);

  useEffect(() => {
    if (oidcConfig) {
      setFormData({
        isEnabled: oidcConfig.isEnabled || false,
        issuer: oidcConfig.issuer || '',
        clientId: oidcConfig.clientId || '',
        clientSecret: '', // Always leave secret blank for security
        authorizationUrl: oidcConfig.authorizationUrl || '',
        tokenUrl: oidcConfig.tokenUrl || '',
        userInfoUrl: oidcConfig.userInfoUrl || '',
        defaultRole: oidcConfig.defaultRole || 'READER',
        buttonText: oidcConfig.buttonText || 'Login with SSO',
      });
    } else {
      // Reset form if there's no config
      setFormData({
        isEnabled: false,
        issuer: '',
        clientId: '',
        clientSecret: '',
        authorizationUrl: '',
        tokenUrl: '',
        userInfoUrl: '',
        defaultRole: 'READER',
        buttonText: 'Login with SSO',
      });
    }
  }, [oidcConfig]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
	console.log(orgId);
    const dataToSave = { ...formData };
    if (!dataToSave.clientSecret) {
      delete dataToSave.clientSecret;
    }
    await saveOIDCConfig(orgId, dataToSave);
  };
  
  const handleDelete = async () => {
    await deleteOIDCConfig(orgId);
    setIsDeleteModalOpen(false);
  };

  const isPrivilegedRole = formData.defaultRole !== 'READER';

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Single Sign-On (OIDC)</h2>
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <p className="mb-6 text-white/70">
          Allow users to sign in using your organization's identity provider.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative flex items-start">
            <div className="flex h-6 items-center">
              <input
                id="isEnabled"
                name="isEnabled"
                type="checkbox"
                checked={formData.isEnabled}
                onChange={handleChange}
                className="h-4 w-4 rounded border-white/30 bg-white/5 text-[var(--orange-wheel)] focus:ring-[var(--orange-wheel)]"
              />
            </div>
            <div className="ml-3 text-sm leading-6">
              <label htmlFor="isEnabled" className="font-medium text-white">
                Enable OIDC Single Sign-On
              </label>
              <p className="text-white/50">Allow users to log in using the configured identity provider.</p>
            </div>
          </div>

          <div className="sm:col-span-6">
              <label htmlFor="callbackUrl" className="block text-sm font-medium leading-6 text-white/80">
                Callback / Redirect URL
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="callbackUrl"
                  id="callbackUrl"
                  value={callbackUrl}
                  readOnly
                  className="block w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg disabled:bg-black/10 disabled:cursor-not-allowed text-white/50"
                />
                 <p className="mt-2 text-xs text-white/50">Provide this URL to your identity provider.</p>
              </div>
            </div>
          
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-6 sm:gap-x-4">
            <div className="sm:col-span-6">
              <label htmlFor="issuer" className="block text-sm font-medium leading-6 text-white/80">
                Issuer URL
              </label>
              <div className="mt-2">
                <input
                  type="url"
                  name="issuer"
                  id="issuer"
                  value={formData.issuer}
                  onChange={handleChange}
                  className="block w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]"
                  placeholder="https://your-provider.com"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-6">
                 <p className=" -mt-4 mb-4 text-xs text-white/50">If your provider supports OIDC Discovery, you can leave the URL fields below blank.</p>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="clientId" className="block text-sm font-medium leading-6 text-white/80">
                Client ID
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="clientId"
                  id="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  className="block w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="clientSecret" className="block text-sm font-medium leading-6 text-white/80">
                Client Secret
              </label>
              <div className="mt-2">
                <input
                  type="password"
                  name="clientSecret"
                  id="clientSecret"
                  value={formData.clientSecret}
                  onChange={handleChange}
                  className="block w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]"
                  placeholder="Leave blank to keep existing secret"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="authorizationUrl" className="block text-sm font-medium leading-6 text-white/80">
                Authorization URL <span className="text-white/50">(Optional)</span>
              </label>
              <div className="mt-2">
                <input type="url" name="authorizationUrl" id="authorizationUrl" value={formData.authorizationUrl} onChange={handleChange} required={!!(formData.tokenUrl || formData.userInfoUrl)} className="block w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]" />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="tokenUrl" className="block text-sm font-medium leading-6 text-white/80">
                Token URL <span className="text-white/50">(Optional)</span>
              </label>
              <div className="mt-2">
                <input type="url" name="tokenUrl" id="tokenUrl" value={formData.tokenUrl} onChange={handleChange} required={!!(formData.authorizationUrl || formData.userInfoUrl)} className="block w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]" />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="userInfoUrl" className="block text-sm font-medium leading-6 text-white/80">
                User Info URL <span className="text-white/50">(Optional)</span>
              </label>
              <div className="mt-2">
                <input type="url" name="userInfoUrl" id="userInfoUrl" value={formData.userInfoUrl} onChange={handleChange} required={!!(formData.authorizationUrl || formData.tokenUrl)} className="block w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]" />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="buttonText" className="block text-sm font-medium leading-6 text-white/80">
                Button Text (Optional)
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="buttonText"
                  id="buttonText"
                  value={formData.buttonText}
                  onChange={handleChange}
                  className="block w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]"
                  placeholder="e.g., Login with Acme Corp"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="defaultRole" className="block text-sm font-medium leading-6 text-white/80">
                Default Role for New Users
              </label>
              <div className="mt-2">
                <select
                  id="defaultRole"
                  name="defaultRole"
                  value={formData.defaultRole}
                  onChange={handleChange}
                  className="block w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange-wheel)]"
                >
                  <option>READER</option>
                  <option>EDITOR</option>
                  <option>ADMIN</option>
                </select>
              </div>
            </div>
          </div>

          {isPrivilegedRole && (
            <div className="mt-6 bg-yellow-900/50 border border-yellow-400/50 text-yellow-300 px-4 py-3 rounded-lg relative flex items-start gap-3">
              <AlertTriangle size={20} className="flex-shrink-0 mt-1" />
              <div>
                <strong className="font-bold">Warning: Privileged Role Selected</strong>
                <p className="text-sm">Any new user signing in via your identity provider for the first time will be granted <span className="font-bold">{formData.defaultRole}</span> permissions. This could lead to unintended access. We recommend the 'READER' role as the default.</p>
              </div>
            </div>
          )}

          {error && <div className="mb-4 text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-400/50">{error}</div>}

          <div className="flex items-center justify-end gap-x-4 border-t border-white/10 pt-6">
            {oidcConfig && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={loading}
                className="text-sm font-semibold leading-6 text-red-500 hover:text-red-400 disabled:opacity-50"
              >
                Delete Configuration
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[var(--orange-wheel)] text-[var(--prussian-blue)] font-bold rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--prussian-blue)] focus:ring-[var(--orange-wheel)] disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete OIDC Configuration"
        message="Are you sure you want to delete this configuration? All users will lose the ability to sign in via SSO. This action cannot be undone."
        confirmText="Delete"
        isLoading={loading}
      />
    </div>
  );
} 
import React, { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import useFindingStore from '../../stores/useFindingStore';
import VulnerabilitySearch from './VulnerabilitySearch';

const SeverityBadge = ({ severity }) => {
  const SEVERITY_STYLES = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    LOW: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    UNKNOWN: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.UNKNOWN;
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${style}`}>
      {severity}
    </span>
  );
};

export default function AddFindingModal({ isOpen, onClose, projectId }) {
  const [selectedVulnerability, setSelectedVulnerability] = useState(null);
  const [status, setStatus] = useState('NEW');
  const [notes, setNotes] = useState('');
  const [component, setComponent] = useState('');

  const {
    searchVulnerabilities,
    lookupExternalVulnerability,
    createFinding,
    searchResults,
    isSearching,
    searchError,
    isCreating,
    createError
  } = useFindingStore();

  const handleExternalLookup = async (externalId) => {
    const vulnerability = await lookupExternalVulnerability(externalId);
    if (vulnerability) {
      setSelectedVulnerability(vulnerability);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVulnerability) return;

    const finding = await createFinding(projectId, {
      vulnerabilityId: selectedVulnerability.vulnerabilityId,
      source: 'Manual Entry',
      status,
      metadata: {
        component,
        notes,
        enteredBy: 'user', // This will be set by the API
      }
    });

    if (finding) {
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedVulnerability(null);
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-gray-900 rounded-lg w-full max-w-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-medium text-white">Add Finding</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4">
              {!selectedVulnerability ? (
                <VulnerabilitySearch
                  onSelect={setSelectedVulnerability}
                  searchResults={searchResults}
                  isSearching={isSearching}
                  searchError={searchError}
                  onSearch={searchVulnerabilities}
                  onExternalLookup={handleExternalLookup}
                />
              ) : (
                /* Finding Details Form */
                <div className="space-y-4">
                  {/* Selected Vulnerability Info */}
                  <div className="p-3 bg-black/20 rounded-md border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{selectedVulnerability.title}</span>
                      <SeverityBadge severity={selectedVulnerability.severity} />
                    </div>
                    <p className="mt-1 text-sm text-gray-400">
                      {selectedVulnerability.description}
                    </p>
                    <button
                      type="button"
                      className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                      onClick={() => setSelectedVulnerability(null)}
                    >
                      Change vulnerability
                    </button>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="NEW">New</option>
                      <option value="TRIAGED">Triaged</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="IGNORED">Ignored</option>
                    </select>
                  </div>

                  {/* Component */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Component/Location
                    </label>
                    <input
                      type="text"
                      value={component}
                      onChange={(e) => setComponent(e.target.value)}
                      placeholder="e.g., Login form, User API, etc."
                      className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional context..."
                      rows={4}
                      className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {createError && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{createError}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              {selectedVulnerability && (
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreating && <Loader2 size={16} className="animate-spin" />}
                  Add Finding
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, AlertCircle, Loader2, FilePlus, Upload, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../stores/useAuthStore';
import useFindingStore from '../../stores/useFindingStore';
import VulnerabilitySearch from './VulnerabilitySearch';
import BulkUploadForm from './BulkUploadForm';

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
  const [activeTab, setActiveTab] = useState('initial');
  const [selectedVulnerability, setSelectedVulnerability] = useState(null);
  const [status, setStatus] = useState('NEW');
  const [notes, setNotes] = useState('');
  const [component, setComponent] = useState('');

  const { user } = useAuthStore();
  const {
    searchVulnerabilities,
    lookupExternalVulnerability,
    createFinding,
    searchResults,
    isSearching,
    searchError,
    isCreating,
    createError,
    isUploading,
    bulkUploadFindings,
    jobStatus,
    jobErrorFile,
  } = useFindingStore();

  const projectMembership = user?.memberships?.find(m => m.projectId === projectId);
  // const canBulkUpload = projectMembership?.role === 'ADMIN' || projectMembership?.role === 'EDITOR';
  const canBulkUpload = true;

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

  const handleUpload = (file) => {
    bulkUploadFindings(projectId, file);
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

          {activeTab === 'initial' && (
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-6">How would you like to add a finding?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('manual')}
                  className="flex flex-col items-start p-6 bg-white/5 border border-white/10 rounded-lg text-left text-white/80 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FilePlus size={24} />
                    <span className="font-semibold text-lg">Manual Entry</span>
                  </div>
                  <p className="text-sm text-gray-400">Add a single finding by searching for a vulnerability.</p>
                </button>
                {canBulkUpload && (
                  <button
                    onClick={() => setActiveTab('bulk')}
                    className="flex flex-col items-start p-6 bg-white/5 border border-white/10 rounded-lg text-left text-white/80 hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Upload size={24} />
                      <span className="font-semibold text-lg">Bulk Upload</span>
                    </div>
                    <p className="text-sm text-gray-400">Upload a CSV file with multiple findings.</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'manual' && (
            <>
              <div className="p-4 border-b border-white/10">
                <button onClick={() => setActiveTab('initial')} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2">
                  <ArrowLeft size={16} />
                  Back to selection
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
            </>
          )}

          {activeTab === 'bulk' && (
            <>
              <div className="p-4 border-b border-white/10">
                <button onClick={() => setActiveTab('initial')} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2">
                  <ArrowLeft size={16} />
                  Back to selection
                </button>
              </div>
              <div className="p-4">
                <BulkUploadForm onUpload={handleUpload} isUploading={isUploading} />
                {jobStatus && isUploading && (
                  <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Loader2 size={20} className="animate-spin text-blue-400" />
                      <div>
                        <p className="font-medium text-white">Upload in Progress</p>
                        <p className="text-sm text-gray-400">Status: {jobStatus}</p>
                      </div>
                    </div>
                  </div>
                )}
                {jobStatus === 'COMPLETED_WITH_ERRORS' && jobErrorFile && (
                  <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg text-yellow-400">
                     <div className="flex items-center gap-3">
                        <AlertCircle size={20} />
                        <div>
                          <p className="font-medium">Upload completed with errors.</p>
                          <a href={`/api/v1/uploads/errors/${jobErrorFile}`} download className="text-sm underline hover:text-yellow-300">
                            Download error report
                          </a>
                        </div>
                      </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
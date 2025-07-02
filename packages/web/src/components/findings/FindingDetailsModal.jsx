import React from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SEVERITY_STYLES = {
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  LOW: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  UNKNOWN: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const SeverityBadge = ({ severity }) => {
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.UNKNOWN;
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${style}`}>
      {severity}
    </span>
  );
};

const DetailItem = ({ label, value }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{value}</dd>
    </div>
);

const FindingDetailsModal = ({ finding, onClose }) => {
  if (!finding) {
    return null;
  }

  const { vulnerability, status, source, metadata, url } = finding;

  // Helper function to determine if this is a DAST finding
  const isDastFinding = source?.includes('DAST') || source?.includes('ZAP');

  // Helper function to get relevant metadata for display
  const getMetadataForDisplay = () => {
    if (isDastFinding) {
      return {
        url: url || 'N/A',
        confidence: metadata?.confidence || 'N/A',
        param: metadata?.param || 'N/A',
        attack: metadata?.attack || 'N/A',
        evidence: metadata?.evidence || 'N/A'
      };
    } else {
      return {
        dependencyName: metadata?.dependencyName || 'N/A',
        ecosystem: metadata?.ecosystem || 'N/A',
        manifestPath: metadata?.manifestPath || 'N/A',
        version: metadata?.version || 'N/A'
      };
    }
  };

  const displayMetadata = getMetadataForDisplay();

  const MarkdownWrapper = ({ content }) => (
    <div className="prose prose-sm prose-invert text-gray-300
                    prose-p:my-3 prose-headings:text-white prose-strong:text-white 
                    prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                    prose-code:text-amber-400 prose-code:bg-black/30 prose-code:p-1 prose-code:rounded-md
                    prose-blockquote:border-l-4 prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic
                    prose-ul:list-disc prose-ul:pl-5
                    prose-ol:list-decimal prose-ol:pl-5">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
    );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
      <div className="relative bg-gray-900 border border-white/20 rounded-xl shadow-2xl w-4/5 h-4/5 overflow-scroll" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between sticky top-0 bg-gray-900 p-5 border-b border-white/10 rounded-t-xl">
            <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-white">
                    {vulnerability.title}
                </h3>
                <p className="text-sm text-gray-400">Vulnerability Details</p>
            </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
            <div className="mb-6">
                <p className="text-sm font-medium text-gray-400 mb-2">Description</p>
                <MarkdownWrapper content={vulnerability.description || 'No description available.'} />
            </div>

            <div className="divide-y divide-white/10">
                <DetailItem label="Severity" value={<SeverityBadge severity={vulnerability.severity} />} />
                <DetailItem label="Status" value={<span className="capitalize">{status.toLowerCase().replace('_', ' ')}</span>} />
                <DetailItem label="Source" value={<span>{source}</span>} />
                
                {isDastFinding ? (
                  // DAST-specific metadata
                  <>
                    <DetailItem 
                      label="URL" 
                      value={
                        url && url !== 'N/A' ? (
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-mono text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                          >
                            {url}
                          </a>
                        ) : (
                          <span className="font-mono">N/A</span>
                        )
                      } 
                    />
                    <DetailItem label="Confidence" value={<span className="font-mono">{displayMetadata.confidence}</span>} />
                    {displayMetadata.param !== 'N/A' && (
                      <DetailItem label="Parameter" value={<span className="font-mono">{displayMetadata.param}</span>} />
                    )}
                    {displayMetadata.attack !== 'N/A' && (
                      <DetailItem label="Attack" value={<span className="font-mono break-all">{displayMetadata.attack}</span>} />
                    )}
                    {displayMetadata.evidence !== 'N/A' && (
                      <DetailItem label="Evidence" value={<span className="font-mono break-all">{displayMetadata.evidence}</span>} />
                    )}
                  </>
                ) : (
                  // Code-based finding metadata (Snyk, GitHub)
                  <>
                    <DetailItem label="Dependency" value={<span className="font-mono">{displayMetadata.dependencyName}</span>} />
                    {displayMetadata.ecosystem !== 'N/A' && (
                      <DetailItem label="Ecosystem" value={<span className="font-mono">{displayMetadata.ecosystem}</span>} />
                    )}
                    {displayMetadata.manifestPath !== 'N/A' && (
                      <DetailItem label="Manifest Path" value={<span className="font-mono">{displayMetadata.manifestPath}</span>} />
                    )}
                    {displayMetadata.version !== 'N/A' && (
                      <DetailItem label="Version" value={<span className="font-mono">{displayMetadata.version}</span>} />
                    )}
                  </>
                )}
                
                {vulnerability.remediation && (
                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-400">Remediation</dt>
                        <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                             <MarkdownWrapper content={vulnerability.remediation} />
                        </dd>
                    </div>
                )}
                
                {vulnerability.references?.urls && vulnerability.references.urls.length > 0 && (
                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-400">References</dt>
                        <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                            <div className="space-y-1">
                                {vulnerability.references.urls.map((url, index) => (
                                    <a 
                                        key={index}
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block text-blue-400 hover:text-blue-300 hover:underline transition-colors break-all"
                                    >
                                        {url}
                                    </a>
                                ))}
                            </div>
                        </dd>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default FindingDetailsModal; 
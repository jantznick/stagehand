import React, { useEffect } from 'react';
import useFindingStore from '../../stores/useFindingStore';

const FindingList = ({ projectId }) => {
  const { findings, isLoading, error, fetchFindings } = useFindingStore((state) => ({
    findings: state.findings[projectId] || [],
    isLoading: state.isLoading,
    error: state.error,
    fetchFindings: state.fetchFindings,
  }));

  useEffect(() => {
    if (projectId) {
      fetchFindings(projectId);
    }
  }, [projectId, fetchFindings]);

  if (isLoading) {
    return <div>Loading security findings...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (findings.length === 0) {
    return (
      <div>
        <p>No security findings found for this project.</p>
        <p className="text-sm text-gray-500 mt-2">
            Try linking this project to a source code repository and then syncing it to pull in vulnerability data from sources like Dependabot.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="w-full bg-gray-50 border-b">
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Severity</th>
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Title</th>
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Affected Component</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => (
            <tr key={finding.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">{finding.vulnerability.severity}</td>
              <td className="py-3 px-4">{finding.vulnerability.title}</td>
              <td className="py-3 px-4">{finding.status}</td>
              <td className="py-3 px-4">{finding.metadata?.dependencyName || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FindingList; 
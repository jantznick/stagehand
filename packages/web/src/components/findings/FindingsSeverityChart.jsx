import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import useFindingStore from '../../stores/useFindingStore';

const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const SEVERITY_COLORS = {
  CRITICAL: '#d62828',
  HIGH: '#f77f00',
  MEDIUM: '#fcbf49',
  LOW: '#003049',
};

const FindingsSeverityChart = ({ project }) => {
  const { findings, isLoading, error } = useFindingStore(state => ({
    findings: project ? state.findings[project.id] || [] : [],
    isLoading: state.isLoading,
    error: state.error,
  }));

  const chartData = useMemo(() => {
    const counts = findings.reduce((acc, finding) => {
      const severity = finding.vulnerability?.severity || 'UNKNOWN';
      if(finding.status === 'NEW' || finding.status === 'IN_PROGRESS' || finding.status === 'TRIAGED') {
        acc[severity] = (acc[severity] || 0) + 1;
      }
      return acc;
    }, {});

    return SEVERITY_ORDER.map(severity => ({
      name: severity.charAt(0) + severity.slice(1).toLowerCase(),
      count: counts[severity] || 0,
      fill: SEVERITY_COLORS[severity],
    }));
  }, [findings]);

  if (isLoading) return <div className="text-center p-4">Loading chart...</div>;
  if (error) return <div className="text-center p-4 text-red-400">Error loading findings.</div>;

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
      <h4 className="text-lg font-semibold text-white mb-4">Open Findings by Severity</h4>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis allowDecimals={false} stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-right text-xs text-gray-500 mt-2">
        {/* Placeholder for last sync date */}
        Last sync: Just now
      </div>
    </div>
  );
};

export default FindingsSeverityChart; 
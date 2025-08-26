import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import useFindingStore from '../../stores/useFindingStore';

const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const SEVERITY_STYLES = {
  CRITICAL: {
    gradientFrom: '#d62828',
    gradientTo: '#b21e1e',
  },
  HIGH: {
    gradientFrom: '#f77f00',
    gradientTo: '#c66200',
  },
  MEDIUM: {
    gradientFrom: '#fcbf49',
    gradientTo: '#d19e3c',
  },
  LOW: {
    gradientFrom: '#0077b6',
    gradientTo: '#005a8d',
  },
  UNKNOWN: {
    gradientFrom: '#6b7280',
    gradientTo: '#4b5563',
  },
};


const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-sm p-3 rounded-lg border border-white/20 shadow-lg">
        <p className="label text-base font-semibold text-white">{`${label}`}</p>
        <p className="intro text-sm text-blue-300">{`Count : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};


const FindingsSeverityChart = ({ project }) => {
  const { findings, isLoading, error, lastFetched } = useFindingStore(state => ({
    findings: project && state.findings ? state.findings[project.id] || [] : [],
    isLoading: state.isLoading,
    error: state.error,
    lastFetched: project && state.lastFetched ? state.lastFetched[project.id] || null : null,
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
      styles: SEVERITY_STYLES[severity],
    }));
  }, [findings]);

  if (isLoading) return <div className="text-center p-4">Loading chart...</div>;
  if (error) return <div className="text-center p-4 text-red-400">Error loading findings.</div>;

  const lastSyncDate = lastFetched ? new Date(lastFetched).toLocaleString() : 'Never';

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-white">Open Findings by Severity</h4>
            <div className="text-right text-xs text-gray-400">
                Last sync: {lastSyncDate}
            </div>
        </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
                {chartData.map((entry, index) => (
                    <linearGradient key={`gradient-${entry.name}`} id={`color-${entry.name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={entry.styles.gradientFrom} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={entry.styles.gradientTo} stopOpacity={0.9}/>
                    </linearGradient>
                ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
              content={<CustomTooltip />}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#color-${entry.name})`} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FindingsSeverityChart;
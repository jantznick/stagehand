import React, { useEffect, useState, useMemo } from 'react';
import useFindingStore from '../../stores/useFindingStore';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Plus } from 'lucide-react';
import FindingDetailsModal from './FindingDetailsModal';

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

const FindingList = (props) => {
  const { findings, isLoading, error, fetchFindings } = useFindingStore((state) => ({
    findings: state.findings[props.project.id] || [],
    isLoading: state.isLoading,
    error: state.error,
    fetchFindings: state.fetchFindings,
  }));

  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);

  useEffect(() => {
    if (props.project.id) {
      fetchFindings(props.project.id);
    }
  }, [props.project.id, fetchFindings]);

  // Helper function to determine if a finding is DAST-based
  const isDastFinding = (finding) => {
    return finding?.source?.includes('DAST') || finding?.source?.includes('ZAP');
  };

  // Helper function to get location information for different finding types
  const getLocationInfo = (finding) => {
    if (isDastFinding(finding)) {
      return finding.url || 'N/A';
    }
    // For code-based findings (Snyk, GitHub), show file/dependency info
    return finding.metadata?.manifestPath || 
           finding.metadata?.dependencyName || 
           finding.metadata?.filePath || 
           'N/A';
  };

  const columns = useMemo(() => [
    {
      id: 'vulnerability.title',
      accessorKey: 'vulnerability.title',
      header: 'Vulnerability',
      cell: ({ row, getValue }) => (
        <button
            onClick={() => setSelectedFinding(row.original)}
            className="font-medium text-white text-left truncate hover:text-blue-400 hover:underline transition-colors"
            title={getValue()}
        >
            {getValue()}
        </button>
        ),
    },
    {
      id: 'vulnerability.severity',
      accessorKey: 'vulnerability.severity',
      header: 'Severity',
      cell: info => <SeverityBadge severity={info.getValue()} />,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: info => <span className="text-sm text-gray-300 capitalize">{info.getValue().toLowerCase().replace('_', ' ')}</span>,
    },
    {
      id: 'location',
      accessorFn: row => getLocationInfo(row),
      header: 'Location',
      cell: ({ row, getValue }) => {
        const value = getValue();
        const finding = row.original;
        
        if (isDastFinding(finding) && finding.url && finding.url !== 'N/A') {
          return (
            <a
              href={finding.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 font-mono truncate hover:text-blue-300 hover:underline transition-colors"
              title={value}
            >
              {value}
            </a>
          );
        }
        
        return (
          <span className="text-sm text-gray-400 font-mono truncate" title={value}>
            {value}
          </span>
        );
      },
    },
    {
      id: 'dependency',
      accessorFn: row => row.metadata?.dependencyName,
      header: 'Dependency',
      cell: ({ getValue, row }) => {
        const dependencyName = getValue();
        const finding = row.original;
        
        // Only show dependency column for non-DAST findings
        if (isDastFinding(finding)) {
          return <span className="text-sm text-gray-500">-</span>;
        }
        
        return (
          <span className="text-sm text-gray-400 font-mono truncate" title={dependencyName}>
            {dependencyName || 'N/A'}
          </span>
        );
      },
    },
	{
		id: 'url',
		accessorKey: 'url',
		header: 'URL',
		cell: info => <span className="text-sm text-gray-400 font-mono truncate" title={info.getValue()}>{info.getValue() || 'N/A'}</span>,
	},
    {
        id: 'source',
        accessorKey: 'source',
        header: 'Source',
        cell: info => (
          <span className="text-sm text-gray-400" title={info.getValue()}>
            {info.getValue()}
          </span>
        )
    },
    {
      id: 'lastSeenAt',
      accessorKey: 'lastSeenAt',
      header: 'Last Seen',
      cell: info => {
        const date = new Date(info.getValue());
        return (
          <span className="text-sm text-gray-400">
            {date.toLocaleDateString()}
          </span>
        );
      },
    }
  ], []);

  const table = useReactTable({
    data: findings,
    columns,
    state: {
      columnFilters,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return <div className="text-center p-4">Loading security findings...</div>;
  }

  if (error) {
    return <div className="p-4 rounded-lg bg-red-500/10 text-red-400 text-center">Error: {error}</div>;
  }

  const severityFilter = columnFilters.find(f => f.id === 'vulnerability.severity')?.value || '';

  if (findings.length === 0 && !severityFilter) {
    return (
      <div className="text-center py-10 px-4 border-2 border-dashed border-gray-700 rounded-lg">
        <h3 className="text-lg font-medium text-white">No Findings Yet</h3>
        <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Launch a DAST scan from the Security tab, or link this project to a repository and run a sync to pull in vulnerability data from sources like Dependabot or Snyk.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <input
                  type="text"
                  placeholder="Filter vulnerabilities..."
                  className="w-full md:w-1/3 bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={table.getColumn('vulnerability.title')?.getFilterValue() ?? ''}
                  onChange={e =>
                      table.getColumn('vulnerability.title')?.setFilterValue(e.target.value)
                  }
              />
              <select
                  className="bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={table.getColumn('vulnerability.severity')?.getFilterValue() ?? ''}
                  onChange={e =>
                      table.getColumn('vulnerability.severity')?.setFilterValue(e.target.value)
                  }
              >
                  <option value="">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
              </select>
            </div>
            
        </div>
        <div className="overflow-x-auto bg-black/20 rounded-lg border border-white/10">
            <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-black/30">
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th key={header.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    <div
                                        className="flex items-center gap-2 cursor-pointer"
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {{
                                            asc: <ChevronUp size={14} />,
                                            desc: <ChevronDown size={14} />,
                                        }[header.column.getIsSorted()] ?? null}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-white/10">
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className="hover:bg-black/30 transition-colors duration-200">
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {table.getRowModel().rows.length === 0 && (
            <div className="text-center py-10">
                <p className="text-gray-400">No findings match your filters.</p>
            </div>
        )}
        <FindingDetailsModal finding={selectedFinding} onClose={() => setSelectedFinding(null)} />
    </div>
  );
};

export default FindingList; 
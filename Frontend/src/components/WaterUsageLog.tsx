import React, { useState, useMemo } from 'react';
import { CleanWaterUsage, CleanShiftReport } from '../types';
import { 
  Droplets, 
  Waves, 
  Gauge, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface WaterUsageLogProps {
  waterUsage: CleanWaterUsage[];
  reports?: CleanShiftReport[];
}

type SortField = 
  | 'report_date' 
  | 'shift' 
  | 'line' 
  | 'purple_pipe_time' 
  | 'purple_pipe_meter_reading' 
  | 'purple_pipe_usage' 
  | 'purple_pipe_gpm' 
  | 'wastewater_time' 
  | 'wastewater_discharge' 
  | 'wastewater_usage' 
  | 'wastewater_gpm' 
  | 'supervisor';

export function WaterUsageLog({ waterUsage, reports = [] }: WaterUsageLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('report_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Aggregated Summary Statistics
  const stats = useMemo(() => {
    let totalPurplePipeGal = 0;
    let totalWastewaterGal = 0;
    let purpleGpmSum = 0;
    let wastewaterGpmSum = 0;
    let purpleCount = 0;
    let wastewaterCount = 0;

    waterUsage.forEach(w => {
      const pUsage = w.purple_pipe_usage || 0;
      const wUsage = w.wastewater_usage || 0;
      const pGpm = w.purple_pipe_gpm || 0;
      const wGpm = w.wastewater_gpm || 0;

      totalPurplePipeGal += pUsage;
      totalWastewaterGal += wUsage;

      if (pGpm > 0) {
        purpleGpmSum += pGpm;
        purpleCount++;
      }
      if (wGpm > 0) {
        wastewaterGpmSum += wGpm;
        wastewaterCount++;
      }
    });

    const netRetainedGal = totalPurplePipeGal - totalWastewaterGal;
    const retentionRate = totalPurplePipeGal > 0 
      ? ((netRetainedGal / totalPurplePipeGal) * 100) 
      : 0;

    const avgPurpleGpm = purpleCount > 0 ? purpleGpmSum / purpleCount : 0;
    const avgWastewaterGpm = wastewaterCount > 0 ? wastewaterGpmSum / wastewaterCount : 0;

    return {
      totalPurplePipeGal,
      totalWastewaterGal,
      netRetainedGal,
      retentionRate,
      avgPurpleGpm,
      avgWastewaterGpm,
      recordCount: waterUsage.length
    };
  }, [waterUsage]);

  // Handle embedded column header sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'report_date' || field === 'purple_pipe_usage' || field === 'wastewater_usage' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted Water Usage Log Records
  const filteredRecords = useMemo(() => {
    return waterUsage
      .filter(w => {
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchesDate = (w.report_date || '').toLowerCase().includes(term);
          const matchesShift = `shift ${w.shift}`.toLowerCase().includes(term);
          const matchesLine = `line ${w.line}`.toLowerCase().includes(term);
          const matchesSupervisor = (w.supervisor || '').toLowerCase().includes(term);
          const matchesId = (w.shift_report_id || '').toLowerCase().includes(term);
          if (!matchesDate && !matchesShift && !matchesLine && !matchesSupervisor && !matchesId) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'report_date') {
          valA = new Date(a.report_date || a.created_at).getTime();
          valB = new Date(b.report_date || b.created_at).getTime();
        }

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        let res = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          res = valA - valB;
        } else {
          res = String(valA).localeCompare(String(valB));
        }

        return sortDirection === 'asc' ? res : -res;
      });
  }, [waterUsage, searchTerm, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRecords, startIndex, rowsPerPage]);

  // CSV Export Handler
  const handleExportCsv = () => {
    if (!filteredRecords.length) return;
    const headers = [
      'Shift Report ID', 'Report Date', 'Shift', 
      'Purple Pipe Time', 'Purple Pipe Meter Reading', 'Purple Pipe Supply (Gal)', 'Purple Pipe GPM',
      'Wastewater Time', 'Wastewater Discharge Reading', 'Wastewater Usage (Gal)', 'Wastewater GPM',
      'Supervisor', 'Created At'
    ];
    const rows = filteredRecords.map(w => [
      w.shift_report_id || '',
      w.report_date || '',
      w.shift || '',
      w.purple_pipe_time || '',
      w.purple_pipe_meter_reading ? w.purple_pipe_meter_reading.toFixed(2) : '',
      w.purple_pipe_usage ? w.purple_pipe_usage.toFixed(2) : '',
      w.purple_pipe_gpm ? w.purple_pipe_gpm.toFixed(2) : '',
      w.wastewater_time || '',
      w.wastewater_discharge ? w.wastewater_discharge.toFixed(2) : '',
      w.wastewater_usage ? w.wastewater_usage.toFixed(2) : '',
      w.wastewater_gpm ? w.wastewater_gpm.toFixed(2) : '',
      w.supervisor || '',
      w.created_at || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RePET_Water_Usage_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300 opacity-50 shrink-0" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600 font-bold shrink-0" />
      : <ArrowDown className="w-3 h-3 text-indigo-600 font-bold shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Purple Pipe Usage */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Purple Pipe Supply</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-900 tracking-tight">
                {stats.totalPurplePipeGal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-bold text-indigo-600 font-mono">Gal</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              Avg Flow: <strong className="text-indigo-950 font-bold">{stats.avgPurpleGpm.toFixed(1)} GPM</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Wastewater Discharge */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Wastewater Discharge</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight">
                {stats.totalWastewaterGal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-bold text-blue-600 font-mono">Gal</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              Avg Discharge: <strong className="text-blue-950 font-bold">{stats.avgWastewaterGpm.toFixed(1)} GPM</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Waves className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Process Water Retained */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Process Water Retained</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900 tracking-tight">
                {stats.netRetainedGal > 0 ? `+${stats.netRetainedGal.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : stats.netRetainedGal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-bold text-emerald-600 font-mono">Gal</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              Process Retention: <strong className="text-emerald-950 font-bold">{stats.retentionRate.toFixed(1)}%</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Meter Readings Logged */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Logged Shift Readings</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.recordCount}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">Shifts</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              Lines: <strong className="text-slate-800 font-bold">Lines 1, 2, 3</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card - Space Optimized */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-3 p-4 sm:p-5">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-indigo-600" />
              Water Usage & Wastewater Discharge Shift Log
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Reclaimed purple pipe water meter readings, GPM flow rates, and wastewater discharge measurements
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search date, supervisor, line..."
                className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 w-48 sm:w-56"
              />
            </div>

            {/* Export CSV in Liquid Glass Primary Capsule (Matching Shift Production Master Log) */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="liquid-glass-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-102"
              title="Export water usage shift records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({filteredRecords.length})</span>
            </button>
          </div>
        </div>

        {/* Space-Optimized Table with Frozen Sticky Header Row */}
        <div className="overflow-x-auto rounded-xl border border-gray-200/80 shadow-2xs max-h-[calc(100vh-320px)] overflow-y-auto relative">
          <table className="w-full text-center border-collapse text-xs min-w-[980px] xl:min-w-0">
            <thead className="sticky top-0 z-20 bg-slate-50 shadow-2xs">
              <tr className="bg-slate-50 text-slate-700 font-bold uppercase text-xs tracking-wider border-b border-gray-200">
                <th 
                  onClick={() => handleSort('report_date')}
                  className="sticky top-0 z-20 bg-slate-50 py-2.5 px-1.5 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="inline-flex items-center justify-center gap-0.5">
                    <span>Date</span>
                    {renderSortIcon('report_date')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('shift')}
                  className="sticky top-0 z-20 bg-slate-50 py-2.5 px-1 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="inline-flex items-center justify-center gap-0.5">
                    <span>Shift</span>
                    {renderSortIcon('shift')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('purple_pipe_time')}
                  className="sticky top-0 z-20 bg-indigo-50 text-indigo-950 py-2.5 px-1.5 text-center cursor-pointer hover:bg-indigo-100 transition-colors select-none"
                >
                  <div className="inline-flex items-center justify-center gap-0.5">
                    <span>Supply Time</span>
                    {renderSortIcon('purple_pipe_time')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('purple_pipe_meter_reading')}
                  className="sticky top-0 z-20 bg-indigo-50 text-indigo-950 py-2.5 px-1.5 text-center cursor-pointer hover:bg-indigo-100 transition-colors select-none"
                >
                  <div className="inline-flex items-center justify-center gap-0.5">
                    <span>Supply Rdg</span>
                    {renderSortIcon('purple_pipe_meter_reading')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('purple_pipe_usage')}
                  className="sticky top-0 z-20 bg-indigo-50 text-indigo-950 py-2.5 px-1.5 text-center cursor-pointer hover:bg-indigo-100 transition-colors select-none"
                >
                  <div className="inline-flex items-center justify-center gap-0.5">
                    <span>Supply (Gal)</span>
                    {renderSortIcon('purple_pipe_usage')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('purple_pipe_gpm')}
                  className="sticky top-0 z-20 bg-indigo-50 text-indigo-950 py-2.5 px-1.5 text-center cursor-pointer hover:bg-indigo-100 transition-colors select-none"
                >
                  <div className="inline-flex items-center justify-center gap-0.5">
                    <span>Supply (GPM)</span>
                    {renderSortIcon('purple_pipe_gpm')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('wastewater_time')}
                  className="sticky top-0 z-20 bg-blue-50 text-blue-950 py-2.5 px-1.5 text-center cursor-pointer hover:bg-blue-100 transition-colors select-none"
                >
                  <div className="inline-flex items-center justify-center gap-0.5">
                    <span>Waste Time</span>
                    {renderSortIcon('wastewater_time')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('wastewater_discharge')}
                  className="sticky top-0 z-20 bg-blue-50 text-blue-950 py-2.5 px-1.5 text-center cursor-pointer hover:bg-blue-100 transition-colors select-none"
                >
                  <div className="inline-flex items-center justify-center gap-0.5">
                    <span>Discharge Rdg</span>
                    {renderSortIcon('wastewater_discharge')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('wastewater_usage')}
                  className="sticky top-0 z-20 bg-blue-50 text-blue-950 py-2.5 px-1.5 text-center cursor-pointer hover:bg-blue-100 transition-colors select-none"
                >
                  <div className="inline-flex items-center justify-center gap-0.5">
                    <span>Discharge (Gal)</span>
                    {renderSortIcon('wastewater_usage')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('wastewater_gpm')}
                  className="sticky top-0 z-20 bg-blue-50 text-blue-950 py-2.5 px-1.5 text-center cursor-pointer hover:bg-blue-100 transition-colors select-none"
                >
                  <div className="inline-flex items-center justify-center gap-0.5">
                    <span>Discharge (GPM)</span>
                    {renderSortIcon('wastewater_gpm')}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('supervisor')}
                  className="sticky top-0 z-20 bg-slate-50 py-2.5 px-1.5 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="inline-flex items-center justify-center gap-0.5">
                    <span>Supervisor</span>
                    {renderSortIcon('supervisor')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((w, idx) => {
                  const pUsage = w.purple_pipe_usage || 0;
                  const wUsage = w.wastewater_usage || 0;

                  return (
                    <tr 
                      key={w.shift_report_id || idx}
                      className="hover:bg-slate-50/80 transition-colors text-center"
                    >
                      {/* Date */}
                      <td className="py-2.5 px-1.5 whitespace-nowrap font-bold text-gray-900 text-center">
                        {w.report_date || 'N/A'}
                      </td>

                      {/* Shift */}
                      <td className="py-2.5 px-1 whitespace-nowrap font-bold text-slate-800 text-center">
                        Shift {w.shift || '1'}
                      </td>

                      {/* Purple Pipe Time */}
                      <td className="py-2.5 px-1.5 whitespace-nowrap bg-indigo-50/20 font-mono text-[10.5px] font-bold text-indigo-950 text-center">
                        {w.purple_pipe_time ? (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100/60 text-indigo-900 border border-indigo-200/60 font-bold">
                            {w.purple_pipe_time}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Purple Pipe Meter Reading */}
                      <td className="py-2.5 px-1.5 whitespace-nowrap bg-indigo-50/20 font-mono text-center text-[10.5px]">
                        {w.purple_pipe_meter_reading > 0 ? w.purple_pipe_meter_reading.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Purple Pipe Usage */}
                      <td className="py-2.5 px-1.5 whitespace-nowrap bg-indigo-50/20 font-bold text-indigo-900 font-mono text-center">
                        {pUsage > 0 ? `${pUsage.toLocaleString()} gal` : '-'}
                      </td>

                      {/* Purple Pipe GPM */}
                      <td className="py-2.5 px-1.5 whitespace-nowrap bg-indigo-50/20 font-semibold text-indigo-700 font-mono text-center text-[10.5px]">
                        {w.purple_pipe_gpm > 0 ? `${w.purple_pipe_gpm.toFixed(2)}` : '-'}
                      </td>

                      {/* Wastewater Time */}
                      <td className="py-2.5 px-1.5 whitespace-nowrap bg-blue-50/20 font-mono text-[10.5px] font-bold text-blue-950 text-center">
                        {w.wastewater_time ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100/60 text-blue-900 border border-blue-200/60 font-bold">
                            {w.wastewater_time}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Wastewater Discharge Reading */}
                      <td className="py-2.5 px-1.5 whitespace-nowrap bg-blue-50/20 font-mono text-center text-[10.5px]">
                        {w.wastewater_discharge > 0 ? w.wastewater_discharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </td>

                      {/* Wastewater Usage */}
                      <td className="py-2.5 px-1.5 whitespace-nowrap bg-blue-50/20 font-bold text-blue-900 font-mono text-center">
                        {wUsage > 0 ? `${wUsage.toLocaleString()} gal` : '-'}
                      </td>

                      {/* Wastewater GPM */}
                      <td className="py-2.5 px-1.5 whitespace-nowrap bg-blue-50/20 font-semibold text-blue-700 font-mono text-center text-[10.5px]">
                        {w.wastewater_gpm > 0 ? `${w.wastewater_gpm.toFixed(2)}` : '-'}
                      </td>

                      {/* Supervisor */}
                      <td className="py-2.5 px-1.5 whitespace-nowrap font-semibold text-gray-800 text-center truncate max-w-[110px]" title={w.supervisor || 'Not Specified'}>
                        <span>{w.supervisor || 'Not Specified'}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-400 italic">
                    No water usage records found matching the current search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 text-xs text-gray-500 text-center sm:text-left">
          <p>
            Showing <span className="font-semibold text-gray-900">{filteredRecords.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold text-gray-900">{Math.min(startIndex + rowsPerPage, filteredRecords.length)}</span> of <span className="font-semibold text-gray-900">{filteredRecords.length}</span> records
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
            {/* Rows per page selector */}
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-1.5 rounded-full font-extrabold text-xs transition-all shadow-sm ${
                  currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200/60 opacity-60' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer hover:scale-102 active:scale-95'
                }`}
              >
                Previous
              </button>
              <span className="font-mono font-black text-gray-800 px-1">{currentPage} / {totalPages}</span>
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-1.5 rounded-full font-extrabold text-xs transition-all shadow-sm ${
                  currentPage === totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200/60 opacity-60' 
                    : 'bg-[#004d25] hover:bg-[#00381b] text-white cursor-pointer hover:scale-102 active:scale-95'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

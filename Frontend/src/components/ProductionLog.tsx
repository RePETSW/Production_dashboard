import { useState, useMemo } from 'react';
import { CleanShiftReport, CleanBladeChange, CleanRewashBag, CleanWaterUsage } from '../types';
import { 
  X, ClipboardList, Search, Download, ArrowUpDown, ArrowUp, ArrowDown, 
  ExternalLink, Printer, ShieldCheck, AlertTriangle, Sparkles, Camera, Check, AlertCircle, 
  Image as ImageIcon, Eye, Droplets, Wrench, RefreshCcw, Clock,
  UserCheck, FileText, Layers, CheckCircle2, Package, Users, Activity, Scale, Gauge, Sparkle
} from 'lucide-react';

const formatNumber = (num: number | string | undefined | null) => {
  if (num === null || num === undefined) return '0';
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsed)) return '0';
  return parsed.toLocaleString('en-US');
};

function parsePhotoUrls(raw: string | undefined): string[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (typeof parsed === 'string') return [parsed];
  } catch {
    const match = raw.match(/https?:\/\/[^\s"',\]]+/g);
    if (match) return match;
    if (raw.startsWith('http')) return [raw.trim()];
  }
  return [];
}

type SortField = 
  | 'report_date' 
  | 'shift' 
  | 'line' 
  | 'supervisor' 
  | 'employees'
  | 'line_start_time'
  | 'total_run_time_computed_minutes' 
  | 'total_downtime_computed_minutes' 
  | 'total_input_bales'
  | 'total_input_bale_weight' 
  | 'total_reprocessed_materials_lbs'
  | 'total_output_pet_flake_bags'
  | 'total_output_flake_weight' 
  | 'output_pet_fines_bags'
  | 'output_pet_fines_bags_weight_lbs'
  | 'output_metric_tons' 
  | 'flake_yield_percentage'
  | 'baler_produced_bales'
  | 'input_bale_ratio'
  | 'rewash_bags_count'
  | 'blade_changes_count'
  | 'purple_pipe_usage'
  | 'wastewater_usage'
  | 'completed_by';

export function ProductionLog({ 
  reports, 
  bladeChanges = [],
  rewashBags = [],
  waterUsage = []
}: { 
  reports: CleanShiftReport[]; 
  bladeChanges?: CleanBladeChange[];
  rewashBags?: CleanRewashBag[];
  waterUsage?: CleanWaterUsage[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<CleanShiftReport | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('report_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Helper to correlate blade changes, rewash bags, and water usage records per shift report
  const getReportMetrics = (r: CleanShiftReport) => {
    const reportBladeChanges = bladeChanges.filter(b => 
      b.shift_report_id === r.id || 
      (b.report_date === r.report_date && String(b.shift) === String(r.shift))
    );
    const bladeMins = reportBladeChanges.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);

    const reportRewashBags = rewashBags.filter(b => 
      b.shift_report_id === r.id || 
      (b.bag_date === r.report_date && String(b.shift) === String(r.shift) && String(b.line) === String(r.line))
    );
    const rewashWeight = reportRewashBags.reduce((sum, b) => sum + (b.bag_weight_lbs || 0), 0);

    const reportWaterRecord = waterUsage.find(w => 
      w.shift_report_id === r.id || 
      (w.report_date === r.report_date && String(w.shift) === String(r.shift) && String(w.line) === String(r.line))
    );

    return {
      bladeChanges: reportBladeChanges,
      bladeChangesCount: reportBladeChanges.length,
      bladeChangesMinutes: bladeMins,
      rewashBags: reportRewashBags,
      rewashBagsCount: reportRewashBags.length,
      rewashBagsWeight: rewashWeight,
      waterRecord: reportWaterRecord
    };
  };

  const getOpenBalerSummary = (r: CleanShiftReport) => {
    const augers = [
      { clean: r.open_baler_cleaness_auger_1, op: r.open_baler_cleaness_auger_1_operator_cleaned },
      { clean: r.open_baler_cleaness_auger_2, op: r.open_baler_cleaness_auger_2_operator_cleaned },
      { clean: r.open_baler_cleaness_auger_3, op: r.open_baler_cleaness_auger_3_operator_cleaned },
    ];
    let cleanCount = 0;
    let dirtyCount = 0;
    let opCount = 0;
    let totalChecked = 0;
    augers.forEach(a => {
      if (a.clean !== undefined && a.clean !== null && a.clean !== '') {
        totalChecked++;
        if (String(a.clean) === 'true') {
          cleanCount++;
        } else {
          dirtyCount++;
        }
      }
      if (String(a.op) === 'true') opCount++;
    });
    if (totalChecked === 0) return '-';
    const statusText = dirtyCount > 0 ? `${cleanCount} Clean, ${dirtyCount} Dirty` : `${cleanCount}/${totalChecked} Clean`;
    return `${statusText} • Op: ${opCount}/${totalChecked}`;
  };

  const getTwinAugerSummary = (r: CleanShiftReport) => {
    const twins = [
      { clean: r.twin_auger_cleaness_1, op: r.twin_auger_cleaness_1_operator_cleaned },
      { clean: r.twin_auger_cleaness_2, op: r.twin_auger_cleaness_2_operator_cleaned },
      { clean: r.twin_auger_cleaness_3, op: r.twin_auger_cleaness_3_operator_cleaned },
      { clean: r.twin_auger_cleaness_4, op: r.twin_auger_cleaness_4_operator_cleaned },
      { clean: r.twin_auger_cleaness_5, op: r.twin_auger_cleaness_5_operator_cleaned },
    ];
    let cleanCount = 0;
    let dirtyCount = 0;
    let opCount = 0;
    let totalChecked = 0;
    twins.forEach(t => {
      if (t.clean !== undefined && t.clean !== null && t.clean !== '') {
        totalChecked++;
        if (String(t.clean) === 'true') {
          cleanCount++;
        } else {
          dirtyCount++;
        }
      }
      if (String(t.op) === 'true') opCount++;
    });
    if (totalChecked === 0) return '-';
    const statusText = dirtyCount > 0 ? `${cleanCount} Clean, ${dirtyCount} Dirty` : `${cleanCount}/${totalChecked} Clean`;
    return `${statusText} • Op: ${opCount}/${totalChecked}`;
  };

  // Search filter
  const searchedReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase();
    return reports.filter(r => 
      (r.report_date && r.report_date.includes(q)) ||
      (r.supervisor && r.supervisor.toLowerCase().includes(q)) ||
      (r.completed_by && r.completed_by.toLowerCase().includes(q)) ||
      (r.user_email && r.user_email.toLowerCase().includes(q)) ||
      (r.employees && r.employees.toLowerCase().includes(q)) ||
      (r.line && String(r.line).includes(q)) ||
      (r.shift && String(r.shift).includes(q)) ||
      (r.downtime_items && r.downtime_items.toLowerCase().includes(q))
    );
  }, [reports, searchQuery]);

  // Sort reports
  const sortedReports = useMemo(() => {
    return [...searchedReports].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'rewash_bags_count') {
        valA = getReportMetrics(a).rewashBagsCount;
        valB = getReportMetrics(b).rewashBagsCount;
      } else if (sortField === 'blade_changes_count') {
        valA = getReportMetrics(a).bladeChangesCount;
        valB = getReportMetrics(b).bladeChangesCount;
      } else if (sortField === 'purple_pipe_usage') {
        valA = getReportMetrics(a).waterRecord?.purple_pipe_usage || 0;
        valB = getReportMetrics(b).waterRecord?.purple_pipe_usage || 0;
      } else if (sortField === 'wastewater_usage') {
        valA = getReportMetrics(a).waterRecord?.wastewater_usage || 0;
        valB = getReportMetrics(b).waterRecord?.wastewater_usage || 0;
      } else {
        valA = a[sortField as keyof CleanShiftReport];
        valB = b[sortField as keyof CleanShiftReport];
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';
      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [searchedReports, sortField, sortDirection, bladeChanges, rewashBags, waterUsage]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Full CSV Export incorporating all production report form fields
  const handleExportCSV = () => {
    if (sortedReports.length === 0) return;
    const headers = [
      'id', 'report_date', 'shift', 'line', 'supervisor', 'employees', 'injuries',
      'line_start_time', 'line_stop_time', 'total_run_time_hours', 'total_run_time_minutes',
      'total_downtime_hours', 'total_downtime_minutes', 'total_input_bales', 'total_input_bale_weight',
      'total_reprocessed_materials_lbs', 'rewash_bags_count', 'rewash_bags_total_lbs',
      'total_output_pet_flake_bags', 'total_output_flake_weight', 'output_pet_fines_bags',
      'output_pet_fines_bags_weight_lbs', 'output_metric_tons', 'flake_yield_percentage',
      'baler_produced_bales', 'input_bale_ratio', 'baler_start_time', 'baler_stop_time',
      'blade_changes_count', 'blade_changes_total_downtime_mins',
      'purple_pipe_time', 'purple_pipe_meter_reading', 'purple_pipe_usage_gal', 'purple_pipe_gpm',
      'wastewater_time', 'wastewater_discharge', 'wastewater_usage_gal', 'wastewater_gpm',
      'open_baler_cleaness_auger_1', 'open_baler_cleaness_auger_2', 'open_baler_cleaness_auger_3',
      'twin_auger_cleaness_1', 'twin_auger_cleaness_2', 'twin_auger_cleaness_3', 'twin_auger_cleaness_4', 'twin_auger_cleaness_5',
      'downtime_items', 'completed_by', 'completed_date', 'supervisor_review', 'created_at', 'user_email'
    ];

    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = sortedReports.map(r => {
      const metrics = getReportMetrics(r);
      const w = metrics.waterRecord;
      return [
        escapeCsv(r.id),
        escapeCsv(r.report_date),
        escapeCsv(r.shift),
        escapeCsv(r.line),
        escapeCsv(r.supervisor),
        escapeCsv(r.employees),
        escapeCsv(r.injuries),
        escapeCsv(r.line_start_time),
        escapeCsv(r.line_stop_time),
        escapeCsv(r.total_run_time_hours),
        escapeCsv(r.total_run_time_minutes),
        escapeCsv(r.total_downtime_hours),
        escapeCsv(r.total_downtime_minutes),
        escapeCsv(r.total_input_bales),
        escapeCsv(r.total_input_bale_weight),
        escapeCsv(r.total_reprocessed_materials_lbs),
        escapeCsv(metrics.rewashBagsCount),
        escapeCsv(metrics.rewashBagsWeight),
        escapeCsv(r.total_output_pet_flake_bags),
        escapeCsv(r.total_output_flake_weight),
        escapeCsv(r.output_pet_fines_bags),
        escapeCsv(r.output_pet_fines_bags_weight_lbs),
        escapeCsv(r.output_metric_tons),
        escapeCsv(r.flake_yield_percentage ? r.flake_yield_percentage.toFixed(1) : ''),
        escapeCsv(r.baler_produced_bales),
        escapeCsv(r.input_bale_ratio),
        escapeCsv(r.baler_start_time),
        escapeCsv(r.baler_stop_time),
        escapeCsv(metrics.bladeChangesCount),
        escapeCsv(metrics.bladeChangesMinutes),
        escapeCsv(w?.purple_pipe_time ?? ''),
        escapeCsv(w?.purple_pipe_meter_reading ?? ''),
        escapeCsv(w?.purple_pipe_usage ?? 0),
        escapeCsv(w?.purple_pipe_gpm ?? 0),
        escapeCsv(w?.wastewater_time ?? ''),
        escapeCsv(w?.wastewater_discharge ?? ''),
        escapeCsv(w?.wastewater_usage ?? 0),
        escapeCsv(w?.wastewater_gpm ?? 0),
        escapeCsv(r.open_baler_cleaness_auger_1),
        escapeCsv(r.open_baler_cleaness_auger_2),
        escapeCsv(r.open_baler_cleaness_auger_3),
        escapeCsv(r.twin_auger_cleaness_1),
        escapeCsv(r.twin_auger_cleaness_2),
        escapeCsv(r.twin_auger_cleaness_3),
        escapeCsv(r.twin_auger_cleaness_4),
        escapeCsv(r.twin_auger_cleaness_5),
        escapeCsv(r.downtime_items),
        escapeCsv(r.completed_by),
        escapeCsv(r.completed_date),
        escapeCsv(r.supervisor_review),
        escapeCsv(r.created_at),
        escapeCsv(r.user_email)
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `repet_production_report_master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedMetrics = useMemo(() => {
    if (!selectedReport) return null;
    return getReportMetrics(selectedReport);
  }, [selectedReport, bladeChanges, rewashBags, waterUsage]);

  if (reports.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(sortedReports.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = sortedReports.slice(startIndex, startIndex + rowsPerPage);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1 inline" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-[#004d25] ml-1 inline" />
      : <ArrowDown className="w-3 h-3 text-[#004d25] ml-1 inline" />;
  };

  // Helper to check if a report has sanitation inspection info logged
  const hasCleanlinessAudit = (r: CleanShiftReport) => {
    return (
      r.open_baler_cleaness_auger_1 !== undefined ||
      r.open_baler_cleaness_auger_2 !== undefined ||
      r.open_baler_cleaness_auger_3 !== undefined ||
      r.twin_auger_cleaness_1 !== undefined ||
      r.openBalerCleanessAuger1_photo_path !== undefined ||
      r.twinAugerCleaness1_photo_path !== undefined
    );
  };

  // Count photos for a report
  const countPhotos = (r: CleanShiftReport) => {
    const photoFields = [
      r.openBalerCleanessAuger1_photo_path,
      r.openBalerCleanessAuger2_photo_path,
      r.openBalerCleanessAuger3_photo_path,
      r.twinAugerCleaness1_photo_path,
      r.twinAugerCleaness2_photo_path,
      r.twinAugerCleaness3_photo_path,
      r.twinAugerCleaness4_photo_path,
      r.twinAugerCleaness5_photo_path,
    ];
    return photoFields.reduce((acc, curr) => acc + parsePhotoUrls(curr).length, 0);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Header toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-[#004d25] rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Shift Production Master Log</h2>
              <p className="text-xs text-gray-500">
                Complete production report form records: Bale inputs, flake outputs, rewash, blade changes, water readings & audits
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search supervisor, email, date, note..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004d25]/40 focus:border-[#004d25]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="liquid-glass-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-102"
              title="Export complete shift production report form records to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({sortedReports.length})</span>
            </button>
          </div>
        </div>

        {/* Master Table - Frozen Header Row (sticky top-0 z-20) */}
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 shadow-2xs">
              <tr>
                <th onClick={() => handleSort('report_date')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Date {renderSortIcon('report_date')}
                </th>
                <th onClick={() => handleSort('shift')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Shift {renderSortIcon('shift')}
                </th>
                <th onClick={() => handleSort('line')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Line {renderSortIcon('line')}
                </th>
                <th onClick={() => handleSort('supervisor')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Supervisor {renderSortIcon('supervisor')}
                </th>
                <th onClick={() => handleSort('employees')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Employees {renderSortIcon('employees')}
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Safety
                </th>
                <th onClick={() => handleSort('line_start_time')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Start / Stop
                </th>
                <th onClick={() => handleSort('total_run_time_computed_minutes')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Tol Run Time {renderSortIcon('total_run_time_computed_minutes')}
                </th>
                <th onClick={() => handleSort('total_downtime_computed_minutes')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Tol Downtime {renderSortIcon('total_downtime_computed_minutes')}
                </th>
                <th onClick={() => handleSort('total_input_bales')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Input Bales {renderSortIcon('total_input_bales')}
                </th>
                <th onClick={() => handleSort('total_input_bale_weight')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Input Wt (lbs) {renderSortIcon('total_input_bale_weight')}
                </th>
                <th onClick={() => handleSort('total_reprocessed_materials_lbs')} className="sticky top-0 z-20 bg-teal-50/90 py-3 px-4 text-xs font-bold text-teal-800 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-teal-100">
                  Reprocessed (lbs) {renderSortIcon('total_reprocessed_materials_lbs')}
                </th>
                <th onClick={() => handleSort('rewash_bags_count')} className="sticky top-0 z-20 bg-indigo-50/90 py-3 px-4 text-xs font-bold text-indigo-800 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-indigo-100">
                  Rewash Bags {renderSortIcon('rewash_bags_count')}
                </th>
                <th onClick={() => handleSort('total_output_pet_flake_bags')} className="sticky top-0 z-20 bg-blue-50/90 py-3 px-4 text-xs font-bold text-blue-800 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-blue-100">
                  Flake Bags {renderSortIcon('total_output_pet_flake_bags')}
                </th>
                <th onClick={() => handleSort('total_output_flake_weight')} className="sticky top-0 z-20 bg-blue-50/90 py-3 px-4 text-xs font-bold text-blue-800 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-blue-100">
                  Flake Wt (lbs) {renderSortIcon('total_output_flake_weight')}
                </th>
                <th onClick={() => handleSort('output_pet_fines_bags')} className="sticky top-0 z-20 bg-purple-50/90 py-3 px-4 text-xs font-bold text-purple-800 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-purple-100">
                  Fines Bags {renderSortIcon('output_pet_fines_bags')}
                </th>
                <th onClick={() => handleSort('output_pet_fines_bags_weight_lbs')} className="sticky top-0 z-20 bg-purple-50/90 py-3 px-4 text-xs font-bold text-purple-800 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-purple-100">
                  Fines Wt (lbs) {renderSortIcon('output_pet_fines_bags_weight_lbs')}
                </th>
                <th onClick={() => handleSort('output_metric_tons')} className="sticky top-0 z-20 bg-emerald-50/90 py-3 px-4 text-xs font-bold text-emerald-800 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-emerald-100">
                  Output (MT) {renderSortIcon('output_metric_tons')}
                </th>
                <th onClick={() => handleSort('flake_yield_percentage')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Yield % {renderSortIcon('flake_yield_percentage')}
                </th>
                <th onClick={() => handleSort('baler_produced_bales')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Baler Bales {renderSortIcon('baler_produced_bales')}
                </th>
                <th onClick={() => handleSort('input_bale_ratio')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Bale Ratio {renderSortIcon('input_bale_ratio')}
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Baler Start / Stop
                </th>
                <th onClick={() => handleSort('blade_changes_count')} className="sticky top-0 z-20 bg-amber-50/90 py-3 px-4 text-xs font-bold text-amber-800 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-amber-100">
                  Blade Changes {renderSortIcon('blade_changes_count')}
                </th>
                <th onClick={() => handleSort('purple_pipe_usage')} className="sticky top-0 z-20 bg-sky-50/90 py-3 px-4 text-xs font-bold text-sky-800 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-sky-100">
                  Purple Pipe {renderSortIcon('purple_pipe_usage')}
                </th>
                <th onClick={() => handleSort('wastewater_usage')} className="sticky top-0 z-20 bg-indigo-50/90 py-3 px-4 text-xs font-bold text-indigo-800 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-indigo-100">
                  Wastewater {renderSortIcon('wastewater_usage')}
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Open Baler Cleanliness
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Twin Auger Cleanliness
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Downtime Notes
                </th>
                <th onClick={() => handleSort('completed_by')} className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100">
                  Completed By {renderSortIcon('completed_by')}
                </th>
                <th className="sticky top-0 z-20 bg-gray-50 py-3 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  Date Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={29} className="text-center py-10 text-gray-400 italic">
                    No matching production report records found.
                  </td>
                </tr>
              ) : (
                currentData.map((r, i) => {
                  const hasDowntimeAlert = r.total_downtime_computed_minutes > 120;
                  const flakeYield = r.flake_yield_percentage;
                  const isSafe = !r.injuries || r.injuries.toLowerCase() === 'no';
                  const metrics = getReportMetrics(r);

                  return (
                    <tr 
                      key={r.id || i} 
                      className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedReport(r)}
                    >
                      <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">{r.report_date}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-blue-50 text-blue-700 border border-blue-200/50">
                          Shift {r.shift}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-700">Line {r.line}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-semibold text-gray-800">{r.supervisor || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-center font-mono text-gray-700">{r.employees || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isSafe ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> Safe
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            <AlertTriangle className="w-3 h-3" /> {r.injuries}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                        {r.line_start_time || '--:--'} → {r.line_stop_time || '--:--'}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700 text-right whitespace-nowrap">
                        {r.total_run_time_hours || '0'}h {r.total_run_time_minutes || '0'}m
                      </td>
                      <td className={`py-3 px-4 font-mono text-right whitespace-nowrap ${
                        hasDowntimeAlert ? 'font-bold text-amber-700 bg-amber-50/50' : 'text-gray-600'
                      }`}>
                        {r.total_downtime_hours || '0'}h {r.total_downtime_minutes || '0'}m
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-800 text-right whitespace-nowrap">
                        {formatNumber(r.total_input_bales)}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-800 text-right whitespace-nowrap">
                        {formatNumber(r.total_input_bale_weight)}
                      </td>
                      <td className="py-3 px-4 font-mono text-teal-700 font-medium text-right whitespace-nowrap">
                        {r.total_reprocessed_materials_lbs > 0 ? formatNumber(r.total_reprocessed_materials_lbs) : '-'}
                      </td>
                      {/* Rewash Bags Cell - Icon removed */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {metrics.rewashBagsCount > 0 ? (
                          <span 
                            className="inline-flex items-center font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60"
                            title={`${metrics.rewashBagsCount} rewash bags (${formatNumber(metrics.rewashBagsWeight)} lbs)`}
                          >
                            {metrics.rewashBagsCount} ({formatNumber(metrics.rewashBagsWeight)} lbs)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-700 font-medium text-right whitespace-nowrap">
                        {formatNumber(r.total_output_pet_flake_bags)}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-800 text-right whitespace-nowrap">
                        {formatNumber(r.total_output_flake_weight)}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-700 font-medium text-right whitespace-nowrap">
                        {formatNumber(r.output_pet_fines_bags)}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-700 font-medium text-right whitespace-nowrap">
                        {r.output_pet_fines_bags_weight_lbs > 0 ? formatNumber(r.output_pet_fines_bags_weight_lbs) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-bold text-right whitespace-nowrap">
                        {r.output_metric_tons > 0 ? r.output_metric_tons.toFixed(2) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-right whitespace-nowrap">
                        {flakeYield > 0 ? (
                          <span className="font-semibold text-gray-700">{flakeYield.toFixed(1)}%</span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700 text-right whitespace-nowrap">
                        {formatNumber(r.baler_produced_bales)}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700 text-right whitespace-nowrap">
                        {r.input_bale_ratio || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700 whitespace-nowrap">
                        {r.baler_start_time || '--:--'} → {r.baler_stop_time || '--:--'}
                      </td>
                      {/* Blade Changes Cell */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {metrics.bladeChangesCount > 0 ? (
                          <span 
                            className="inline-flex items-center gap-1 font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60"
                            title={`${metrics.bladeChangesCount} blade changes (${metrics.bladeChangesMinutes} min downtime)`}
                          >
                            <Wrench className="w-3 h-3 text-amber-600 shrink-0" />
                            {metrics.bladeChangesCount} ({metrics.bladeChangesMinutes}m)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">-</span>
                        )}
                      </td>
                      {/* Purple Pipe Cell */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {metrics.waterRecord ? (
                          <span 
                            className="inline-flex items-center gap-1 font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60"
                            title={`Purple Pipe: ${formatNumber(metrics.waterRecord.purple_pipe_usage)} gal @ ${metrics.waterRecord.purple_pipe_gpm} GPM`}
                          >
                            <Droplets className="w-3 h-3 text-sky-600 shrink-0" />
                            {formatNumber(metrics.waterRecord.purple_pipe_usage)} gal ({metrics.waterRecord.purple_pipe_gpm} GPM)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">-</span>
                        )}
                      </td>
                      {/* Wastewater Cell */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {metrics.waterRecord ? (
                          <span 
                            className="inline-flex items-center gap-1 font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60"
                            title={`Wastewater: ${formatNumber(metrics.waterRecord.wastewater_usage)} gal @ ${metrics.waterRecord.wastewater_gpm} GPM`}
                          >
                            <Droplets className="w-3 h-3 text-indigo-600 shrink-0" />
                            {formatNumber(metrics.waterRecord.wastewater_usage)} gal ({metrics.waterRecord.wastewater_gpm} GPM)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">-</span>
                        )}
                      </td>
                      {/* Open Baler Cleanliness Cell */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-blue-900 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200/60 font-bold">
                          {getOpenBalerSummary(r)}
                        </span>
                      </td>
                      {/* Twin Auger Cleanliness Cell */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-purple-900 bg-purple-50/80 px-2 py-0.5 rounded border border-purple-200/60 font-bold">
                          {getTwinAugerSummary(r)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap max-w-[160px] truncate" title={r.downtime_items || ''}>
                        {r.downtime_items || '-'}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-700 whitespace-nowrap">{r.completed_by || '-'}</td>
                      <td className="py-3 px-4 font-mono text-gray-700 whitespace-nowrap">{r.completed_date || r.report_date || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 text-xs text-gray-500 text-center sm:text-left">
          <p>
            Showing <span className="font-semibold text-gray-900">{sortedReports.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold text-gray-900">{Math.min(startIndex + rowsPerPage, sortedReports.length)}</span> of <span className="font-semibold text-gray-900">{sortedReports.length}</span> shifts
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

      {/* POPUP MODAL: Modernized High-Fidelity Shift Operations Intelligence Modal following Form Section Sequence */}
      {selectedReport && selectedMetrics && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#f8fafc] rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-gray-100 my-auto">
            
            {/* Modal Header Bar */}
            <div className="sticky top-0 z-30 px-6 py-4 bg-white/95 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between rounded-t-3xl shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#004d25] text-white rounded-2xl shadow-sm">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                    Production Report — {selectedReport.report_date}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-emerald-50/90 hover:bg-emerald-100/90 text-[#004d25] border border-emerald-200/80 shadow-2xs font-extrabold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer text-xs"
                  title="Print shift report audit"
                >
                  <Printer className="w-3.5 h-3.5 text-[#004d25]" />
                  <span className="hidden sm:inline">Print Report</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-all"
                  title="Close Modal"
                >
                  <X className="w-5 h-5"/>
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body in Modernized Visual Dashboard Layout (Strict Section Order) */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs sm:text-sm bg-[#f8fafc]">
              
              {/* SECTION 1: Form Header Context - Date, Shift, Line, Supervisor */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" /> Report Date
                  </span>
                  <div className="text-sm font-extrabold text-gray-900 font-mono bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200/70">
                    {selectedReport.report_date}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                    Shift Designation
                  </span>
                  <div className="text-sm font-extrabold text-[#004d25] bg-emerald-50/80 px-3.5 py-2 rounded-xl border border-emerald-200/70 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Shift {selectedReport.shift}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                    Production Line
                  </span>
                  <div className="text-sm font-extrabold text-slate-800 bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/70 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    Line {selectedReport.line}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-gray-400" /> Shift Supervisor
                  </span>
                  <div className="text-sm font-bold text-gray-900 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200/70 truncate" title={selectedReport.supervisor}>
                    {selectedReport.supervisor || 'N/A'}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Shift Operations & Timings (Employees, Safety, Start/Stop, Run Time & Downtime) */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#004d25]" /> Shift Operations & Timings
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">Personnel & Machinery Schedule</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Active Employees Stat Card */}
                  <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Number of Employees</span>
                      <span className="text-xl font-black text-slate-900 font-mono">{selectedReport.employees || '12'}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Active Operators</span>
                    </div>
                    <div className="p-2.5 bg-slate-200/70 text-slate-700 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Safety Status Card */}
                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    !selectedReport.injuries || selectedReport.injuries.toLowerCase() === 'no' || selectedReport.injuries.toLowerCase() === 'none'
                      ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'
                      : 'bg-rose-50/80 border-rose-200/80 text-rose-950'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase block mb-1 opacity-70">Injuries / First Aid</span>
                      <span className="text-lg font-black block">
                        {!selectedReport.injuries || selectedReport.injuries.toLowerCase() === 'no' || selectedReport.injuries.toLowerCase() === 'none'
                          ? 'Zero Injuries'
                          : selectedReport.injuries}
                      </span>
                      <span className="text-[10px] font-semibold block mt-0.5 opacity-80">Safety Protocol Compliant</span>
                    </div>
                    <div className={`p-2.5 rounded-xl ${
                      !selectedReport.injuries || selectedReport.injuries.toLowerCase() === 'no' || selectedReport.injuries.toLowerCase() === 'none'
                        ? 'bg-emerald-200/60 text-emerald-800'
                        : 'bg-rose-200/60 text-rose-800'
                    }`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Line Schedule */}
                  <div className="bg-gray-50 border border-gray-200/70 p-3.5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Line Start → Stop Time</span>
                      <span className="text-base font-extrabold text-gray-900 font-mono block">
                        {selectedReport.line_start_time || '09:33'} → {selectedReport.line_stop_time || '09:33'}
                      </span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Scheduled Shift Range</span>
                    </div>
                    <div className="p-2.5 bg-gray-200/70 text-gray-700 rounded-xl">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Run Time vs Downtime ratio card */}
                  <div className="bg-emerald-50/60 border border-emerald-200/70 p-3.5 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Run Time vs Downtime</span>
                      <div className="flex items-center justify-between font-mono text-xs font-black">
                        <span className="text-emerald-900">Run: {selectedReport.total_run_time_hours || '8'}h {selectedReport.total_run_time_minutes || '0'}m</span>
                        <span className="text-amber-800">Down: {selectedReport.total_downtime_hours || '1'}h {selectedReport.total_downtime_minutes || '0'}m</span>
                      </div>
                    </div>
                    {/* Proportion bar */}
                    <div className="w-full bg-amber-200/80 rounded-full h-2 overflow-hidden flex mt-2">
                      <div 
                        className="bg-[#004d25] h-full" 
                        style={{ 
                          width: `${Math.min(100, Math.max(10, ((selectedReport.total_run_time_computed_minutes || 480) / ((selectedReport.total_run_time_computed_minutes || 480) + (selectedReport.total_downtime_computed_minutes || 60))) * 100))}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Input Data & Raw Materials */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" /> Input Data & Material Inflow
                  </h3>
                  <span className="text-xs font-mono font-bold text-teal-800">Raw PET Bale Feedstock</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Input Bales</span>
                      <span className="text-2xl font-black text-slate-900 font-mono block">{formatNumber(selectedReport.total_input_bales)}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Bales processed through line</span>
                    </div>
                    <div className="p-3 bg-slate-200/70 text-slate-700 rounded-xl">
                      <Package className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-teal-50/80 border border-teal-200/70 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-teal-800 uppercase block mb-1">Total Input Bale Weight</span>
                      <span className="text-2xl font-black text-teal-950 font-mono block">{formatNumber(selectedReport.total_input_bale_weight)}</span>
                      <span className="text-[10px] text-teal-700 block mt-0.5">LBS gross raw PET input</span>
                    </div>
                    <div className="p-3 bg-teal-200/60 text-teal-800 rounded-xl">
                      <Scale className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-emerald-50/80 border border-emerald-200/70 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Total Reprocessed Materials</span>
                      <span className="text-2xl font-black text-emerald-950 font-mono block">{formatNumber(selectedReport.total_reprocessed_materials_lbs)}</span>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">LBS reprocessed recovery</span>
                    </div>
                    <div className="p-3 bg-emerald-200/60 text-emerald-800 rounded-xl">
                      <RefreshCcw className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Rewash Bags Information (Optional) */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCcw className="w-4 h-4 text-indigo-600" /> Rewash Bags Information (Optional)
                  </h3>
                  <span className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/70">
                    REWASH WEIGHT TOTAL: <strong className="text-indigo-950">{formatNumber(selectedMetrics.rewashBagsWeight)} LBS</strong>
                  </span>
                </div>

                {selectedMetrics.rewashBags.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200 font-bold uppercase text-[10px] text-gray-600">
                        <tr>
                          <th className="py-2.5 px-3">Bag Date</th>
                          <th className="py-2.5 px-3">Shift</th>
                          <th className="py-2.5 px-3">Line</th>
                          <th className="py-2.5 px-3">Bag Type</th>
                          <th className="py-2.5 px-3">Bag Number</th>
                          <th className="py-2.5 px-3 text-right">Bag Weight (LBS)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-mono">
                        {selectedMetrics.rewashBags.map((bag, idx) => (
                          <tr key={bag.id || idx} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 text-gray-800 font-sans font-medium">{bag.bag_date}</td>
                            <td className="py-2.5 px-3 text-gray-700">Shift {bag.shift}</td>
                            <td className="py-2.5 px-3 text-gray-700">Line {bag.line}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                                {bag.bag_type || 'Color'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-gray-900">{bag.bag_number ? `#${bag.bag_number}` : `#${idx + 1}`}</td>
                            <td className="py-2.5 px-3 text-right font-black text-indigo-900">{formatNumber(bag.bag_weight_lbs)} LBS</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic py-2 bg-gray-50/60 rounded-xl p-3 text-center">
                    No rewash bags logged for this shift.
                  </div>
                )}
              </div>

              {/* SECTION 5: Output Data & Hero Metric Tons Calculation */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" /> Output Data & Flake Recovery
                  </h3>
                  {(() => {
                    const modalYield = selectedReport.flake_yield_percentage;
                    return (
                      <div className="bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200/60 text-[#004d25] sm:text-right shrink-0">
                        <div className="text-xs font-mono font-extrabold text-blue-950 flex sm:justify-end items-center gap-1.5">
                          <span>Yield:</span>
                          <span className="text-sm font-black text-[#004d25]">{modalYield > 0 ? `${modalYield.toFixed(1)}%` : '0.0%'}</span>
                        </div>
                        <span className="text-[10px] text-blue-700 font-mono block mt-0.5">
                          (Formula: Output MT / (Input Bale Weight / 2204))
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="bg-blue-50/70 border border-blue-200/60 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">Total Output PET Flake Bags</span>
                    <span className="text-xl font-extrabold text-blue-950 font-mono block">
                      {formatNumber(selectedReport.total_output_pet_flake_bags)}
                    </span>
                    <span className="text-[10px] text-blue-700 block mt-0.5">Bags produced</span>
                  </div>
                  <div className="bg-blue-50/70 border border-blue-200/60 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">Total Output Flake Weight</span>
                    <span className="text-xl font-extrabold text-blue-950 font-mono block">
                      {formatNumber(selectedReport.total_output_flake_weight)}
                    </span>
                    <span className="text-[10px] text-blue-700 block mt-0.5">LBS PET flake</span>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-200/60 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block mb-1">Output PET Fines Bags Weight</span>
                    <span className="text-xl font-extrabold text-purple-950 font-mono block">
                      {formatNumber(selectedReport.output_pet_fines_bags_weight_lbs)}
                    </span>
                    <span className="text-[10px] text-purple-700 block mt-0.5">LBS fines</span>
                  </div>
                  <div className="bg-purple-50/70 border border-purple-200/60 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block mb-1">Output PET Fines Bags</span>
                    <span className="text-xl font-extrabold text-purple-950 font-mono block">
                      {formatNumber(selectedReport.output_pet_fines_bags)}
                    </span>
                    <span className="text-[10px] text-purple-700 block mt-0.5">Fines bags</span>
                  </div>
                </div>

                {/* Output Metric Tons Highlight Box */}
                <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-extrabold tracking-wider text-emerald-900 uppercase block">
                        Output Metric Tons
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-[#004d25] border border-emerald-300/60 font-mono">
                        Unit: MT (2204 LBS / MT)
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                      Formula: (Total Output Flake Weight (LBS) - Total Reprocessed Materials (LBS)) / 2204
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-[#004d25] block">
                      {selectedReport.output_metric_tons > 0 ? selectedReport.output_metric_tons.toFixed(2) : '0.00'} <span className="text-lg font-extrabold text-emerald-900">MT</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 6: Baler Machine Data */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-slate-700" /> Baler Machine Data
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-700">Compactor Operational Telemetry</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="bg-gray-50 border border-gray-200/70 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Baler Machine Produced Bales</span>
                    <span className="text-xl font-black text-gray-900 font-mono block">{formatNumber(selectedReport.baler_produced_bales)} Bales</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200/70 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Input Bale Ratio</span>
                    <span className="text-xl font-black text-gray-900 font-mono block">{selectedReport.input_bale_ratio || '12'}</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200/70 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Baler Start Time</span>
                    <span className="text-lg font-extrabold text-gray-900 font-mono block">{selectedReport.baler_start_time || '09:46'}</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-200/70 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Baler Stop Time</span>
                    <span className="text-lg font-extrabold text-gray-900 font-mono block">{selectedReport.baler_stop_time || '02:46'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 7: Blade Change Information */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-600" /> Blade Change Information
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200/70">
                    BLADE CHANGE TOTAL: <strong className="text-amber-950">{selectedMetrics.bladeChangesMinutes} MIN</strong>
                  </span>
                </div>

                {selectedMetrics.bladeChanges.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200 font-bold uppercase text-[10px] text-gray-600">
                        <tr>
                          <th className="py-2.5 px-3">Grinder Equipment</th>
                          <th className="py-2.5 px-3">Start Time</th>
                          <th className="py-2.5 px-3">End Time</th>
                          <th className="py-2.5 px-3 text-right">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-mono">
                        {selectedMetrics.bladeChanges.map((b, i) => (
                          <tr key={b.id || i} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-sans font-extrabold text-amber-950">{b.grinder}</td>
                            <td className="py-2.5 px-3 text-gray-600">{b.start_time || '09:46'}</td>
                            <td className="py-2.5 px-3 text-gray-600">{b.end_time || '10:46'}</td>
                            <td className="py-2.5 px-3 text-right font-black text-amber-800">{b.duration_minutes} min</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic py-2 bg-gray-50/60 rounded-xl p-3 text-center">
                    No grinder blade changes performed during this shift.
                  </div>
                )}
              </div>

              {/* SECTION 8: Purple Pipe and Wastewater Usage */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-sky-600" /> Purple Pipe and Wastewater Usage
                  </h3>
                  {selectedMetrics.waterRecord && (
                    <span className="text-xs font-mono font-bold text-sky-900 bg-sky-50 px-3 py-1 rounded-full border border-sky-200/70">
                      Process Retention Rate: {selectedMetrics.waterRecord.purple_pipe_usage > 0 
                        ? `${((1 - selectedMetrics.waterRecord.wastewater_usage / selectedMetrics.waterRecord.purple_pipe_usage) * 100).toFixed(1)}%` 
                        : 'N/A'}
                    </span>
                  )}
                </div>

                {selectedMetrics.waterRecord ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                    {/* Purple pipe Card */}
                    <div className="p-4 bg-sky-50/70 border border-sky-200/70 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-sky-900 font-sans uppercase">Purple Pipe (Reclaimed Water)</span>
                        <span className="text-[11px] text-sky-700 font-bold">Time: {selectedMetrics.waterRecord.purple_pipe_time || '09:46'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white/90 p-2.5 rounded-xl border border-sky-100">
                          <span className="text-[9px] text-sky-700 font-bold uppercase block">Meter Reading</span>
                          <span className="font-extrabold text-sky-950 block mt-0.5">{formatNumber(selectedMetrics.waterRecord.purple_pipe_meter_reading)}</span>
                        </div>
                        <div className="bg-white/90 p-2.5 rounded-xl border border-sky-100">
                          <span className="text-[9px] text-sky-700 font-bold uppercase block">Supply Usage</span>
                          <span className="font-extrabold text-sky-950 block mt-0.5">{formatNumber(selectedMetrics.waterRecord.purple_pipe_usage)} gal</span>
                        </div>
                        <div className="bg-white/90 p-2.5 rounded-xl border border-sky-100">
                          <span className="text-[9px] text-sky-700 font-bold uppercase block">Flow Rate</span>
                          <span className="font-extrabold text-sky-950 block mt-0.5">{selectedMetrics.waterRecord.purple_pipe_gpm} GPM</span>
                        </div>
                      </div>
                    </div>

                    {/* Wastewater Discharge Card */}
                    <div className="p-4 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-indigo-900 font-sans uppercase">Wastewater Discharge</span>
                        <span className="text-[11px] text-indigo-700 font-bold">Time: {selectedMetrics.waterRecord.wastewater_time || '09:47'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100">
                          <span className="text-[9px] text-indigo-700 font-bold uppercase block">Discharge Rdg</span>
                          <span className="font-extrabold text-indigo-950 block mt-0.5">{formatNumber(selectedMetrics.waterRecord.wastewater_discharge)}</span>
                        </div>
                        <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100">
                          <span className="text-[9px] text-indigo-700 font-bold uppercase block">Discharge Usage</span>
                          <span className="font-extrabold text-indigo-950 block mt-0.5">{formatNumber(selectedMetrics.waterRecord.wastewater_usage)} gal</span>
                        </div>
                        <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100">
                          <span className="text-[9px] text-indigo-700 font-bold uppercase block">Flow Rate</span>
                          <span className="font-extrabold text-indigo-950 block mt-0.5">{selectedMetrics.waterRecord.wastewater_gpm} GPM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic py-2 bg-gray-50/60 rounded-xl p-3 text-center">
                    No water usage or wastewater logs recorded for this shift.
                  </div>
                )}
              </div>

              {/* SECTION 9: Equipment Cleanliness Audits */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" /> Equipment Cleanliness Audits
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">Augers & Twin Augers Sanitation Inspection</span>
                </div>

                {/* OPEN BALER CLEANLINESS (3/3 checked) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> OPEN BALER CLEANLINESS
                    </h4>
                    <span className="text-[11px] text-gray-500 font-mono">3/3 checked</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[1, 2, 3].map(augerNum => {
                      const cleanField = `open_baler_cleaness_auger_${augerNum}` as keyof CleanShiftReport;
                      const cleanedByOpField = `open_baler_cleaness_auger_${augerNum}_operator_cleaned` as keyof CleanShiftReport;
                      const photoField = `openBalerCleanessAuger${augerNum}_photo_path` as keyof CleanShiftReport;
                      const cleanVal = selectedReport[cleanField];
                      const opCleanedVal = selectedReport[cleanedByOpField];
                      const photos = parsePhotoUrls(selectedReport[photoField] as string);
                      const isClean = cleanVal === 'true' || cleanVal === true;
                      const isOpCleaned = opCleanedVal === 'true' || opCleanedVal === true;

                      return (
                        <div key={augerNum} className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-xl flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-extrabold text-xs text-gray-900">Auger #{augerNum}</span>
                              {isClean ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Clean
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                  <AlertCircle className="w-3 h-3" /> Dirty
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-600 mb-2 flex items-center justify-between">
                              <span className="text-gray-500">Operator Cleaned:</span>
                              <span className={`font-extrabold px-1.5 py-0.2 rounded ${isOpCleaned ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'}`}>
                                {isOpCleaned ? 'Yes' : opCleanedVal ? 'No' : 'N/A'}
                              </span>
                            </div>
                          </div>
                          {photos.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200/60">
                              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 flex items-center gap-1">
                                <Camera className="w-3 h-3" /> Photos ({photos.length})
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {photos.map((url, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setPreviewPhoto(url)}
                                    className="relative group rounded-lg overflow-hidden border border-gray-300 hover:border-blue-500 transition-colors w-10 h-10 bg-gray-100 cursor-pointer"
                                  >
                                    <img src={url} alt={`Auger ${augerNum} proof ${idx}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <Eye className="w-3 h-3" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TWIN AUGER CLEANLINESS (5/5 checked) */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> TWIN AUGER CLEANLINESS
                    </h4>
                    <span className="text-[11px] text-gray-500 font-mono">5/5 checked</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    {[1, 2, 3, 4, 5].map(twinNum => {
                      const cleanField = `twin_auger_cleaness_${twinNum}` as keyof CleanShiftReport;
                      const cleanedByOpField = `twin_auger_cleaness_${twinNum}_operator_cleaned` as keyof CleanShiftReport;
                      const photoField = `twinAugerCleaness${twinNum}_photo_path` as keyof CleanShiftReport;
                      const cleanVal = selectedReport[cleanField];
                      const opCleanedVal = selectedReport[cleanedByOpField];
                      const photos = parsePhotoUrls(selectedReport[photoField] as string);
                      const isClean = cleanVal === 'true' || cleanVal === true;
                      const isOpCleaned = opCleanedVal === 'true' || opCleanedVal === true;

                      return (
                        <div key={twinNum} className="p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-extrabold text-xs text-gray-900">Twin #{twinNum}</span>
                              {isClean ? (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">
                                  Clean
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800">
                                  Dirty
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500 mb-1 flex items-center justify-between">
                              <span>Op:</span>
                              <span className="font-extrabold text-gray-800">{isOpCleaned ? 'Yes' : opCleanedVal ? 'No' : '-'}</span>
                            </div>
                          </div>
                          {photos.length > 0 && (
                            <div className="mt-1.5 pt-1.5 border-t border-gray-200/60">
                              <div className="flex items-center gap-1 flex-wrap">
                                {photos.map((url, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setPreviewPhoto(url)}
                                    className="relative group rounded overflow-hidden border border-gray-300 hover:border-purple-500 transition-colors w-8 h-8 bg-gray-100 cursor-pointer"
                                  >
                                    <img src={url} alt={`Twin ${twinNum} proof ${idx}`} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 10: Downtime Items / Production Notes */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-2">
                <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-600" /> Downtime Items / Production Notes
                </h3>
                <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-xs font-mono text-gray-800 leading-relaxed min-h-[60px]">
                  {selectedReport.downtime_items || 'No downtime interruptions or special maintenance issues logged.'}
                </div>
              </div>

              {/* SECTION 11: Verification & Sign-off */}
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#004d25]" /> Verification & Sign-off
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/70">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Completed By (Full Name)</span>
                    <span className="font-extrabold text-sm text-gray-900">{selectedReport.completed_by || 'Daniela Villegas'}</span>
                  </div>

                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/70">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Date Submitted</span>
                    <span className="font-extrabold text-sm text-gray-900 font-mono">{selectedReport.completed_date || selectedReport.report_date || '2026-11-02'}</span>
                  </div>

                  <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/70">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Supervisor Review Initials</span>
                    <span className="font-serif font-black italic text-base text-emerald-900">{selectedReport.supervisor_review || 'DV'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-gray-200/80 rounded-b-3xl flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">Form Document ID: {selectedReport.id}</span>
              <button 
                onClick={() => setSelectedReport(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white border border-slate-700/60 px-5 py-2 cursor-pointer rounded-xl text-xs font-extrabold transition-all shadow-sm hover:scale-105"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div 
            className="relative bg-white rounded-2xl overflow-hidden max-w-2xl max-h-[85vh] shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" /> Auger Sanitation Inspection Photo
              </span>
              <div className="flex items-center gap-2">
                <a 
                  href={previewPhoto} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Full image <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setPreviewPhoto(null)}
                  className="p-1 hover:bg-gray-200 rounded-md text-gray-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-2 bg-black/90 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img 
                src={previewPhoto} 
                alt="Auger inspection proof" 
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

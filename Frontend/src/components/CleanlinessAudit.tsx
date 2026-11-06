import React, { useState, useMemo } from 'react';
import { CleanShiftReport } from '../types';
import { 
  Sparkles, CheckCircle2, XCircle, AlertTriangle, 
  Camera, X, User, Calendar, ExternalLink, Image as ImageIcon
} from 'lucide-react';

interface CleanlinessAuditProps {
  reports: CleanShiftReport[];
}

type AuditSection = 'open_baler' | 'twin_auger';

// Safely extract up to 3 image URLs from stringified JSON array or raw string
function parsePhotos(photoField?: string): string[] {
  if (!photoField) return [];
  try {
    const parsed = JSON.parse(photoField);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(url => typeof url === 'string' && url.trim().length > 0)
        .slice(0, 3);
    }
    if (typeof parsed === 'string' && parsed.trim().length > 0) {
      return [parsed.trim()];
    }
  } catch {
    if (typeof photoField === 'string' && photoField.startsWith('http')) {
      return [photoField.trim()];
    }
  }
  return [];
}

interface AugerAuditItem {
  number: number;
  name: string;
  condition: 'clean' | 'dirty' | 'uninspected';
  operatorCleaned: 'yes' | 'no' | 'uninspected';
  photos: string[];
}

export function CleanlinessAudit({ reports }: CleanlinessAuditProps) {
  const [activeSection, setActiveSection] = useState<AuditSection>('open_baler');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'clean' | 'dirty'>('all');
  const [cleanedFilter, setCleanedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<{ 
    url: string; 
    title: string; 
    date: string; 
    shift: string;
    condition: string;
    operatorCleaned: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Process Open Baler records (Augers 1–3 only)
  const openBalerRecords = useMemo(() => {
    return reports.map(r => {
      const a1ConditionRaw = r.open_baler_cleaness_auger_1?.toLowerCase();
      const a2ConditionRaw = r.open_baler_cleaness_auger_2?.toLowerCase();
      const a3ConditionRaw = r.open_baler_cleaness_auger_3?.toLowerCase();

      const a1Has = a1ConditionRaw !== undefined && a1ConditionRaw !== '';
      const a2Has = a2ConditionRaw !== undefined && a2ConditionRaw !== '';
      const a3Has = a3ConditionRaw !== undefined && a3ConditionRaw !== '';

      const a1CleanedRaw = r.open_baler_cleaness_auger_1_operator_cleaned?.toLowerCase();
      const a2CleanedRaw = r.open_baler_cleaness_auger_2_operator_cleaned?.toLowerCase();
      const a3CleanedRaw = r.open_baler_cleaness_auger_3_operator_cleaned?.toLowerCase();

      const a1Photos = parsePhotos(r.openBalerCleanessAuger1_photo_path);
      const a2Photos = parsePhotos(r.openBalerCleanessAuger2_photo_path);
      const a3Photos = parsePhotos(r.openBalerCleanessAuger3_photo_path);

      const hasData = a1Has || a2Has || a3Has || 
                      a1Photos.length > 0 || a2Photos.length > 0 || a3Photos.length > 0 ||
                      a1CleanedRaw !== undefined || a2CleanedRaw !== undefined || a3CleanedRaw !== undefined;

      const augers: AugerAuditItem[] = [
        {
          number: 1,
          name: 'Auger 1',
          condition: !a1Has ? 'uninspected' : a1ConditionRaw === 'true' ? 'clean' : 'dirty',
          operatorCleaned: a1CleanedRaw === undefined || a1CleanedRaw === '' ? 'uninspected' : a1CleanedRaw === 'true' ? 'yes' : 'no',
          photos: a1Photos,
        },
        {
          number: 2,
          name: 'Auger 2',
          condition: !a2Has ? 'uninspected' : a2ConditionRaw === 'true' ? 'clean' : 'dirty',
          operatorCleaned: a2CleanedRaw === undefined || a2CleanedRaw === '' ? 'uninspected' : a2CleanedRaw === 'true' ? 'yes' : 'no',
          photos: a2Photos,
        },
        {
          number: 3,
          name: 'Auger 3',
          condition: !a3Has ? 'uninspected' : a3ConditionRaw === 'true' ? 'clean' : 'dirty',
          operatorCleaned: a3CleanedRaw === undefined || a3CleanedRaw === '' ? 'uninspected' : a3CleanedRaw === 'true' ? 'yes' : 'no',
          photos: a3Photos,
        },
      ];

      const cleanCount = augers.filter(a => a.condition === 'clean').length;
      const dirtyCount = augers.filter(a => a.condition === 'dirty').length;
      const cleanedYesCount = augers.filter(a => a.operatorCleaned === 'yes').length;
      const totalPhotos = augers.reduce((sum, a) => sum + a.photos.length, 0);

      return {
        id: r.id,
        report_date: r.report_date,
        shift: r.shift,
        line: r.line,
        supervisor: r.supervisor,
        completed_by: r.completed_by,
        hasData,
        augers,
        cleanCount,
        dirtyCount,
        cleanedYesCount,
        totalPhotos,
      };
    }).filter(r => r.hasData)
      .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime());
  }, [reports]);

  // Process Twin Auger records (Augers 1–5 only)
  const twinAugerRecords = useMemo(() => {
    return reports.map(r => {
      const a1ConditionRaw = r.twin_auger_cleaness_1?.toLowerCase();
      const a2ConditionRaw = r.twin_auger_cleaness_2?.toLowerCase();
      const a3ConditionRaw = r.twin_auger_cleaness_3?.toLowerCase();
      const a4ConditionRaw = r.twin_auger_cleaness_4?.toLowerCase();
      const a5ConditionRaw = r.twin_auger_cleaness_5?.toLowerCase();

      const a1Has = a1ConditionRaw !== undefined && a1ConditionRaw !== '';
      const a2Has = a2ConditionRaw !== undefined && a2ConditionRaw !== '';
      const a3Has = a3ConditionRaw !== undefined && a3ConditionRaw !== '';
      const a4Has = a4ConditionRaw !== undefined && a4ConditionRaw !== '';
      const a5Has = a5ConditionRaw !== undefined && a5ConditionRaw !== '';

      const a1CleanedRaw = r.twin_auger_cleaness_1_operator_cleaned?.toLowerCase();
      const a2CleanedRaw = r.twin_auger_cleaness_2_operator_cleaned?.toLowerCase();
      const a3CleanedRaw = r.twin_auger_cleaness_3_operator_cleaned?.toLowerCase();
      const a4CleanedRaw = r.twin_auger_cleaness_4_operator_cleaned?.toLowerCase();
      const a5CleanedRaw = r.twin_auger_cleaness_5_operator_cleaned?.toLowerCase();

      const a1Photos = parsePhotos(r.twinAugerCleaness1_photo_path);
      const a2Photos = parsePhotos(r.twinAugerCleaness2_photo_path);
      const a3Photos = parsePhotos(r.twinAugerCleaness3_photo_path);
      const a4Photos = parsePhotos(r.twinAugerCleaness4_photo_path);
      const a5Photos = parsePhotos(r.twinAugerCleaness5_photo_path);

      const hasData = a1Has || a2Has || a3Has || a4Has || a5Has ||
                      a1Photos.length > 0 || a2Photos.length > 0 || a3Photos.length > 0 || a4Photos.length > 0 || a5Photos.length > 0 ||
                      a1CleanedRaw !== undefined || a2CleanedRaw !== undefined || a3CleanedRaw !== undefined || a4CleanedRaw !== undefined || a5CleanedRaw !== undefined;

      const augers: AugerAuditItem[] = [
        {
          number: 1,
          name: 'Twin Auger 1',
          condition: !a1Has ? 'uninspected' : a1ConditionRaw === 'true' ? 'clean' : 'dirty',
          operatorCleaned: a1CleanedRaw === undefined || a1CleanedRaw === '' ? 'uninspected' : a1CleanedRaw === 'true' ? 'yes' : 'no',
          photos: a1Photos,
        },
        {
          number: 2,
          name: 'Twin Auger 2',
          condition: !a2Has ? 'uninspected' : a2ConditionRaw === 'true' ? 'clean' : 'dirty',
          operatorCleaned: a2CleanedRaw === undefined || a2CleanedRaw === '' ? 'uninspected' : a2CleanedRaw === 'true' ? 'yes' : 'no',
          photos: a2Photos,
        },
        {
          number: 3,
          name: 'Twin Auger 3',
          condition: !a3Has ? 'uninspected' : a3ConditionRaw === 'true' ? 'clean' : 'dirty',
          operatorCleaned: a3CleanedRaw === undefined || a3CleanedRaw === '' ? 'uninspected' : a3CleanedRaw === 'true' ? 'yes' : 'no',
          photos: a3Photos,
        },
        {
          number: 4,
          name: 'Twin Auger 4',
          condition: !a4Has ? 'uninspected' : a4ConditionRaw === 'true' ? 'clean' : 'dirty',
          operatorCleaned: a4CleanedRaw === undefined || a4CleanedRaw === '' ? 'uninspected' : a4CleanedRaw === 'true' ? 'yes' : 'no',
          photos: a4Photos,
        },
        {
          number: 5,
          name: 'Twin Auger 5',
          condition: !a5Has ? 'uninspected' : a5ConditionRaw === 'true' ? 'clean' : 'dirty',
          operatorCleaned: a5CleanedRaw === undefined || a5CleanedRaw === '' ? 'uninspected' : a5CleanedRaw === 'true' ? 'yes' : 'no',
          photos: a5Photos,
        },
      ];

      const cleanCount = augers.filter(a => a.condition === 'clean').length;
      const dirtyCount = augers.filter(a => a.condition === 'dirty').length;
      const cleanedYesCount = augers.filter(a => a.operatorCleaned === 'yes').length;
      const totalPhotos = augers.reduce((sum, a) => sum + a.photos.length, 0);

      return {
        id: r.id,
        report_date: r.report_date,
        shift: r.shift,
        line: r.line,
        supervisor: r.supervisor,
        completed_by: r.completed_by,
        hasData,
        augers,
        cleanCount,
        dirtyCount,
        cleanedYesCount,
        totalPhotos,
      };
    }).filter(r => r.hasData)
      .sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime());
  }, [reports]);

  // Active records based on the currently selected section
  const currentSectionRecords = activeSection === 'open_baler' ? openBalerRecords : twinAugerRecords;

  // Calculate Section-specific KPI statistics
  const stats = useMemo(() => {
    const totalShifts = currentSectionRecords.length;
    let totalAugerChecks = 0;
    let cleanChecks = 0;
    let dirtyChecks = 0;
    let cleanedYesChecks = 0;
    let cleanedNoChecks = 0;
    let totalPhotosLogged = 0;

    currentSectionRecords.forEach(r => {
      r.augers.forEach(a => {
        if (a.condition !== 'uninspected') {
          totalAugerChecks += 1;
          if (a.condition === 'clean') cleanChecks += 1;
          if (a.condition === 'dirty') dirtyChecks += 1;
        }
        if (a.operatorCleaned === 'yes') cleanedYesChecks += 1;
        if (a.operatorCleaned === 'no') cleanedNoChecks += 1;
        totalPhotosLogged += a.photos.length;
      });
    });

    const passRate = totalAugerChecks > 0 ? Math.round((cleanChecks / totalAugerChecks) * 100) : 100;

    return {
      totalShifts,
      totalAugerChecks,
      cleanChecks,
      dirtyChecks,
      passRate,
      cleanedYesChecks,
      cleanedNoChecks,
      totalPhotosLogged,
    };
  }, [currentSectionRecords]);

  // Filtered by Search, Condition, and Operator Cleaned
  const filteredList = useMemo(() => {
    return currentSectionRecords.filter(r => {
      // Condition filter
      if (conditionFilter === 'clean' && r.dirtyCount > 0) return false;
      if (conditionFilter === 'dirty' && r.dirtyCount === 0) return false;

      // Operator cleaned filter
      if (cleanedFilter === 'yes' && r.cleanedYesCount === 0) return false;
      if (cleanedFilter === 'no' && r.cleanedYesCount > 0) return false;

      return true;
    });
  }, [currentSectionRecords, conditionFilter, cleanedFilter]);

  const totalPages = Math.ceil(filteredList.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentItems = filteredList.slice(startIndex, startIndex + rowsPerPage);

  const handleSectionSwitch = (section: AuditSection) => {
    setActiveSection(section);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Primary Section Tab Switcher (Open Baler vs Twin Auger) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar">
          <div className="liquid-glass-track inline-flex items-center p-1 rounded-2xl max-w-full overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleSectionSwitch('open_baler')}
              className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-colors duration-150 cursor-pointer flex items-center gap-2 select-none ${
                activeSection === 'open_baler'
                  ? 'liquid-glass-btn-primary text-blue-900 font-extrabold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              <span className={`relative z-10 w-2 h-2 rounded-full ${activeSection === 'open_baler' ? 'bg-blue-600' : 'bg-blue-500'}`} />
              <span className="relative z-10">Open Baler Cleanliness</span>
              <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-colors ${
                activeSection === 'open_baler' ? 'bg-blue-600/15 text-blue-900 font-bold' : 'bg-gray-200/80 text-gray-700'
              }`}>
                Augers 1–3
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSectionSwitch('twin_auger')}
              className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-colors duration-300 cursor-pointer flex items-center gap-2 select-none ${
                activeSection === 'twin_auger'
                  ? 'liquid-glass-btn-indigo text-indigo-900 font-extrabold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              <span className={`relative z-10 w-2 h-2 rounded-full ${activeSection === 'twin_auger' ? 'bg-indigo-600' : 'bg-indigo-500'}`} />
              <span className="relative z-10">Twin Auger Cleanliness</span>
              <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-colors ${
                activeSection === 'twin_auger' ? 'bg-indigo-600/15 text-indigo-900 font-bold' : 'bg-gray-200/80 text-gray-700'
              }`}>
                Augers 1–5
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Specific KPI Summary Cards for Selected Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Audits */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
              {activeSection === 'open_baler' ? 'Open Baler Audits' : 'Twin Auger Audits'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight">{stats.totalShifts}</span>
              <span className="text-xs font-semibold text-gray-500">shifts</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              {stats.totalAugerChecks} individual checks
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Condition Pass Rate */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Cleanliness Pass Rate</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${stats.passRate >= 80 ? 'text-emerald-700' : 'text-amber-600'}`}>
                {stats.passRate}%
              </span>
              <span className="text-xs font-semibold text-gray-500">Clean status</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              {stats.cleanChecks} Clean &bull; {stats.dirtyChecks} Dirty
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Operator Cleaned Status */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Operator Cleaned</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono tracking-tight">
                {stats.cleanedYesChecks}
              </span>
              <span className="text-xs font-semibold text-gray-500">remediations</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              {stats.cleanedNoChecks} marked No
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Photos Uploaded (Max 3 / auger) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Inspection Photos</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 font-mono tracking-tight">{stats.totalPhotosLogged}</span>
              <span className="text-xs font-semibold text-gray-500">captured</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              Up to 3 photos per auger
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Camera className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 3. Filter Bar & Inspection Cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
        
        {/* Controls Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-4 border-b border-gray-100">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full overflow-x-auto no-scrollbar pb-1">
            {/* Condition Filter */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold shrink-0">
              <span className="text-gray-400 shrink-0">Condition:</span>
              <div className="liquid-glass-track inline-flex items-center p-1 rounded-2xl shrink-0">
                <button
                  type="button"
                  onClick={() => { setConditionFilter('all'); setCurrentPage(1); }}
                  className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-150 cursor-pointer whitespace-nowrap text-xs select-none ${
                    conditionFilter === 'all' ? 'liquid-glass-btn-dark text-slate-900 font-extrabold' : 'hover:text-gray-900 hover:bg-white/40 text-gray-600'
                  }`}
                >
                  <span className="relative z-10">All</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setConditionFilter('clean'); setCurrentPage(1); }}
                  className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-300 cursor-pointer whitespace-nowrap text-xs select-none ${
                    conditionFilter === 'clean' ? 'liquid-glass-btn-emerald text-emerald-900 font-extrabold' : 'hover:text-emerald-700 hover:bg-emerald-50/50 text-gray-600'
                  }`}
                >
                  <span className="relative z-10">Clean Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setConditionFilter('dirty'); setCurrentPage(1); }}
                  className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-300 cursor-pointer whitespace-nowrap text-xs select-none ${
                    conditionFilter === 'dirty' ? 'liquid-glass-btn-danger text-red-900 font-extrabold' : 'hover:text-rose-700 hover:bg-rose-50/50 text-gray-600'
                  }`}
                >
                  <span className="relative z-10">Dirty Only</span>
                </button>
              </div>
            </div>

            {/* Operator Cleaned Filter */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold shrink-0">
              <span className="text-gray-400 shrink-0">Operator Cleaned:</span>
              <div className="liquid-glass-track inline-flex items-center p-1 rounded-2xl shrink-0">
                <button
                  type="button"
                  onClick={() => { setCleanedFilter('all'); setCurrentPage(1); }}
                  className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-300 cursor-pointer whitespace-nowrap text-xs select-none ${
                    cleanedFilter === 'all' ? 'liquid-glass-btn-dark text-slate-900 font-extrabold' : 'hover:text-gray-900 hover:bg-white/40 text-gray-600'
                  }`}
                >
                  <span className="relative z-10">All</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setCleanedFilter('yes'); setCurrentPage(1); }}
                  className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-300 cursor-pointer whitespace-nowrap text-xs select-none ${
                    cleanedFilter === 'yes' ? 'liquid-glass-btn-primary text-blue-900 font-extrabold' : 'hover:text-indigo-700 hover:bg-indigo-50/50 text-gray-600'
                  }`}
                >
                  <span className="relative z-10">Operator Cleaned: Yes</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setCleanedFilter('no'); setCurrentPage(1); }}
                  className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-300 cursor-pointer whitespace-nowrap text-xs select-none ${
                    cleanedFilter === 'no' ? 'liquid-glass-btn-amber text-amber-900 font-extrabold' : 'hover:text-amber-800 hover:bg-amber-50/50 text-gray-600'
                  }`}
                >
                  <span className="relative z-10">Operator Cleaned: No</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Shift Records Container */}
        <div className="space-y-4">
          {currentItems.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-xs italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              No {activeSection === 'open_baler' ? 'Open Baler' : 'Twin Auger'} audit records match the current filter criteria.
            </div>
          ) : (
            currentItems.map((record) => {
              const hasDirty = record.dirtyCount > 0;

              return (
                <div 
                  key={record.id}
                  className="bg-gray-50/40 hover:bg-white rounded-xl p-4 sm:p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all space-y-4"
                >
                  {/* Shift Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-bold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-2xs font-mono">
                        {record.report_date || 'Unknown Date'}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">
                        Shift {record.shift || '-'} &bull; Line {record.line || '2'}
                      </span>
                      {record.supervisor && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          {record.supervisor}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {hasDirty ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                          <AlertTriangle className="w-3 h-3" />
                          {record.dirtyCount} Auger{record.dirtyCount > 1 ? 's' : ''} Dirty
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3" />
                          All Clean
                        </span>
                      )}

                      {record.cleanedYesCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          Operator Cleaned ({record.cleanedYesCount})
                        </span>
                      )}

                      {record.totalPhotos > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          <Camera className="w-3 h-3 text-gray-500" />
                          {record.totalPhotos} Photo{record.totalPhotos > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Augers Cards Grid: 3 columns for Open Baler, 5 columns for Twin Auger */}
                  <div className={`grid gap-3 ${
                    activeSection === 'open_baler' 
                      ? 'grid-cols-1 md:grid-cols-3' 
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
                  }`}>
                    {record.augers.map((auger) => {
                      const isClean = auger.condition === 'clean';
                      const isDirty = auger.condition === 'dirty';
                      const isCleanedYes = auger.operatorCleaned === 'yes';
                      const isCleanedNo = auger.operatorCleaned === 'no';

                      return (
                        <div 
                          key={auger.number}
                          className="bg-white rounded-xl p-3 border border-gray-100 shadow-2xs space-y-2.5 flex flex-col justify-between"
                        >
                          {/* Auger Title */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                            <span className="text-xs font-black text-gray-800 tracking-tight">
                              {auger.name}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              #{auger.number}
                            </span>
                          </div>

                          {/* Dual Status: Condition (Clean/Dirty) & Operator Cleaned (Yes/No) */}
                          <div className="space-y-2">
                            
                            {/* 1. Condition: Clean / Dirty */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[11px] font-medium text-gray-500">Condition:</span>
                              {isClean ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Clean
                                </span>
                              ) : isDirty ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" /> Dirty
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-400 italic">Not Checked</span>
                              )}
                            </div>

                            {/* 2. Operator Cleaned: Yes / No */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[11px] font-medium text-gray-500">Operator Cleaned:</span>
                              {isCleanedYes ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  Yes
                                </span>
                              ) : isCleanedNo ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                  No
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-400 italic">-</span>
                              )}
                            </div>

                          </div>

                          {/* Photos Section: Max 3 photos */}
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5 font-medium">
                              <span className="flex items-center gap-1">
                                <Camera className="w-3 h-3" /> Photos
                              </span>
                              <span>{auger.photos.length}/3 max</span>
                            </div>

                            {auger.photos.length > 0 ? (
                              <div className="grid grid-cols-3 gap-1.5">
                                {auger.photos.map((url, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setSelectedPhoto({
                                      url,
                                      title: `${auger.name} — Photo ${pIdx + 1} of ${auger.photos.length}`,
                                      date: record.report_date,
                                      shift: `Shift ${record.shift} (Line ${record.line})`,
                                      condition: auger.condition === 'clean' ? 'Clean' : auger.condition === 'dirty' ? 'Dirty' : 'Uninspected',
                                      operatorCleaned: auger.operatorCleaned === 'yes' ? 'Operator Cleaned: Yes' : 'Operator Cleaned: No',
                                    })}
                                    className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100 hover:border-blue-400 transition-all cursor-pointer shadow-2xs"
                                    title="Click to view full photo"
                                  >
                                    <img 
                                      src={url} 
                                      alt={`${auger.name} Inspection ${pIdx + 1}`} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                                      <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white rounded p-1 text-[9px] transition-opacity">
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="py-2 text-center text-[10px] text-gray-400 bg-gray-50/70 rounded-lg border border-dashed border-gray-200 flex items-center justify-center gap-1">
                                <ImageIcon className="w-3 h-3 text-gray-300" />
                                <span>No photos</span>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center sm:text-left">
          <p>
            Showing <span className="font-semibold text-gray-900">{filteredList.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold text-gray-900">{Math.min(startIndex + rowsPerPage, filteredList.length)}</span> of <span className="font-semibold text-gray-900">{filteredList.length}</span> {activeSection === 'open_baler' ? 'Open Baler' : 'Twin Auger'} records
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

      {/* 4. Full Photo Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-3 p-4 sm:p-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  {selectedPhoto.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span>{selectedPhoto.date}</span>
                  <span>&bull;</span>
                  <span>{selectedPhoto.shift}</span>
                  <span>&bull;</span>
                  <span className={`font-semibold ${selectedPhoto.condition === 'Clean' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedPhoto.condition}
                  </span>
                  <span>&bull;</span>
                  <span className="font-semibold text-indigo-600">
                    {selectedPhoto.operatorCleaned}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              <img 
                src={selectedPhoto.url} 
                alt="Auger inspection detail" 
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <span>Photo verification from shift inspection</span>
              <a 
                href={selectedPhoto.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                Open original in new tab <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import { CleanBladeChange } from '../types';
import { Wrench, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';

const extractGrinderNumber = (grinder: string | number | undefined) => {
  if (!grinder) return null;
  const match = String(grinder).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

export function BladeChangesList({ bladeChanges }: { bladeChanges: CleanBladeChange[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGrinderFilter, setSelectedGrinderFilter] = useState<string>('all');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const validChanges = useMemo(() => {
    return bladeChanges
      .filter(b => b.grinder)
      .sort((a, b) => {
        const shiftA = a.shift || '';
        const shiftB = b.shift || '';
        return shiftA.localeCompare(shiftB);
      });
  }, [bladeChanges]);

  // Active filtered changes based on top-right grinder tab
  const activeChanges = useMemo(() => {
    if (selectedGrinderFilter === 'all') return validChanges;
    const targetG = parseInt(selectedGrinderFilter, 10);
    return validChanges.filter(b => extractGrinderNumber(b.grinder) === targetG);
  }, [validChanges, selectedGrinderFilter]);

  // Blade Metrics depending on the selected grinder filter
  const stats = useMemo(() => {
    const totalChanges = activeChanges.length;
    const totalDuration = activeChanges.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);
    const avgDuration = totalChanges > 0 ? Math.round(totalDuration / totalChanges) : 0;
    
    // Count per grinder
    const grinderCounts: Record<number, number> = {};
    activeChanges.forEach(b => {
      const g = extractGrinderNumber(b.grinder);
      if (g) grinderCounts[g] = (grinderCounts[g] || 0) + 1;
    });

    return { totalChanges, totalDuration, avgDuration, grinderCounts };
  }, [activeChanges]);

  // Group by date
  const dateGroups = useMemo(() => {
    const groups: Record<string, CleanBladeChange[]> = {};
    validChanges.forEach(change => {
      const g = extractGrinderNumber(change.grinder);
      if (selectedGrinderFilter !== 'all' && String(g) !== selectedGrinderFilter) {
        return;
      }
      const dateLabel = change.report_date ? `${change.report_date} ${change.dayLabel ? `(${change.dayLabel})` : ''}` : 'Unknown Date';
      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(change);
    });

    return Object.entries(groups).sort((a, b) => {
      const dateA = a[1][0]?.report_date || '';
      const dateB = b[1][0]?.report_date || '';
      return dateB.localeCompare(dateA);
    });
  }, [validChanges, selectedGrinderFilter]);
  
  if (bladeChanges.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
        <div className="p-3 bg-gray-50 rounded-full mb-3 text-gray-400">
          <Wrench className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-gray-700">No Blade Changes Recorded</h3>
        <p className="text-xs text-gray-400 mt-1">No maintenance events found for the active filter range.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(dateGroups.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentGroups = dateGroups.slice(startIndex, startIndex + rowsPerPage);
  const defaultGrinders = [1, 2, 3];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[580px] justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Blade Change Log</h2>
              <p className="text-xs text-gray-500">Grinder servicing, blade rotations & downtime</p>
            </div>
          </div>

          {/* Grinder Filter Tabs */}
          <div className="liquid-glass-track inline-flex items-center p-1 rounded-full text-xs sm:text-sm font-bold tracking-tight text-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => { setSelectedGrinderFilter('all'); setCurrentPage(1); }}
              className={`relative px-3.5 py-1.5 rounded-full transition-colors duration-300 cursor-pointer whitespace-nowrap select-none ${
                selectedGrinderFilter === 'all' ? 'liquid-glass-btn-forest text-[#004d25] font-extrabold' : 'hover:text-black text-slate-800 hover:bg-white/50'
              }`}
            >
              <span className="relative z-10">All</span>
            </button>
            {[1, 2, 3].map(g => {
              const isSelected = selectedGrinderFilter === String(g);
              const grinderClass = 
                g === 1 ? 'liquid-glass-btn-primary' :
                g === 2 ? 'liquid-glass-btn-emerald' :
                'liquid-glass-btn-amber';

              const grinderTextColor =
                g === 1 ? 'text-blue-900' :
                g === 2 ? 'text-emerald-900' :
                'text-amber-900';

              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => { setSelectedGrinderFilter(String(g)); setCurrentPage(1); }}
                  className={`relative px-3.5 py-1.5 rounded-full transition-colors duration-300 cursor-pointer whitespace-nowrap select-none ${
                    isSelected ? `${grinderClass} ${grinderTextColor} font-extrabold` : 'hover:text-black text-slate-800 hover:bg-white/50'
                  }`}
                >
                  <span className="relative z-10">Grinder {g}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mini stats ribbon (Responsive for mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-4">
          <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              {selectedGrinderFilter === 'all' ? 'Total Changes' : `Grinder ${selectedGrinderFilter} Changes`}
            </span>
            <span className="text-base font-extrabold text-gray-800 font-mono">{stats.totalChanges}</span>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              {selectedGrinderFilter === 'all' ? 'Avg Maint. Time' : `G${selectedGrinderFilter} Avg Maint. Time`}
            </span>
            <span className="text-base font-extrabold text-blue-600 font-mono">{stats.avgDuration} <span className="text-xs font-normal">min</span></span>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              {selectedGrinderFilter === 'all' ? 'Total Maint. Time' : `G${selectedGrinderFilter} Total Maint. Time`}
            </span>
            <span className="text-base font-extrabold text-amber-600 font-mono">{(stats.totalDuration / 60).toFixed(1)} <span className="text-xs font-normal">hrs</span></span>
          </div>
        </div>

        {/* Date groups */}
        <div className="space-y-4">
          {currentGroups.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs italic">
              No changes recorded for Grinder {selectedGrinderFilter} in this period.
            </div>
          ) : (
            currentGroups.map(([dateLabel, changes]) => {
              const presentGrinders = new Set<number>();
              changes.forEach(c => {
                const g = extractGrinderNumber(c.grinder);
                if (g) presentGrinders.add(g);
              });
              
              const grindersToShow = selectedGrinderFilter !== 'all'
                ? [parseInt(selectedGrinderFilter, 10)]
                : Array.from(new Set([...defaultGrinders, ...Array.from(presentGrinders)])).sort((a, b) => a - b);
              
              return (
                <div key={dateLabel} className="rounded-xl border border-gray-200/80 shadow-2xs bg-white overflow-hidden">
                  {/* Date Header */}
                  <div className="bg-gray-50/90 border-b border-gray-200/80 px-3.5 py-2 flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-xs sm:text-sm">{dateLabel}</span>
                    <span className="text-[11px] font-semibold bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md shadow-2xs">
                      {changes.length} {changes.length === 1 ? 'event' : 'events'}
                    </span>
                  </div>
                  
                  {/* Grinders Grid */}
                  <div className={`grid divide-y md:divide-y-0 md:divide-x divide-gray-100 grid-cols-1 ${
                    grindersToShow.length === 1 ? 'md:grid-cols-1' :
                    grindersToShow.length === 2 ? 'md:grid-cols-2' :
                    'md:grid-cols-3'
                  }`}>
                    {grindersToShow.map((grinderNum) => {
                      const grinderChanges = changes.filter(c => extractGrinderNumber(c.grinder) === grinderNum);
                      
                      return (
                        <div key={grinderNum} className="p-3.5 flex flex-col bg-white">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              Grinder No. {grinderNum}
                            </span>
                            {grinderChanges.length > 0 && (
                              <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                {grinderChanges.length} serviced
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {grinderChanges.length > 0 ? grinderChanges.map((change, i) => {
                              const duration = change.duration_minutes || 0;
                              const isFast = duration > 0 && duration <= 30;
                              const isExtended = duration > 60;

                              return (
                                <div key={i} className="flex flex-col bg-gray-50/70 border border-gray-200/60 rounded-lg p-2.5 text-xs">
                                  <div className="flex items-center justify-between gap-1 mb-1.5">
                                    <span className="font-bold text-[11px] text-gray-700 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                                      Shift {String(change.shift).replace(/shift\s*/i, '')}
                                    </span>
                                    <span className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                      isFast 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                        : isExtended 
                                        ? 'bg-red-50 text-red-700 border border-red-200' 
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      <Clock className="w-3 h-3" />
                                      {duration > 0 ? `${duration}m` : '--'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
                                    <span>{change.start_time || '--:--'}</span>
                                    <span className="text-gray-300">→</span>
                                    <span>{change.end_time || '--:--'}</span>
                                  </div>
                                </div>
                              );
                            }) : (
                              <div className="flex items-center justify-center p-3 border border-dashed border-gray-200 rounded-lg bg-gray-50/30">
                                <span className="text-gray-400 text-xs italic">Operational / No changes</span>
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
      </div>
      
      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-3 border-t border-gray-100 text-xs text-center sm:text-left">
        <p className="text-gray-500">
          Showing <span className="font-semibold text-gray-800">{dateGroups.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold text-gray-800">{Math.min(startIndex + rowsPerPage, dateGroups.length)}</span> of <span className="font-semibold text-gray-800">{dateGroups.length}</span> days
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
          <div className="flex items-center justify-center gap-2">
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
  );
}

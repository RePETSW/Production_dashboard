import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Filter, RotateCcw, Calendar, Layers, User, ChevronUp, ChevronDown, SlidersHorizontal, X, Clock } from 'lucide-react';
import { FilterState } from './Filters';
import { MultiSelectFilter } from './MultiSelectFilter';

interface FloatingFilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  uniqueValues: {
    dates: string[];
    months: string[];
    weeks: string[];
    shifts: string[];
    lines: string[];
    supervisors?: string[];
  };
  totalCount: number;
  filteredCount: number;
  isVisible: boolean;
  onScrollToFilters?: () => void;
  topOffset: number;
}

export function FloatingFilterBar({
  filters,
  setFilters,
  uniqueValues,
  totalCount,
  filteredCount,
  isVisible,
  onScrollToFilters,
  topOffset
}: FloatingFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Build the list of active filter details
  const activeChips = [
    ...filters.shift.map(value => ({ field: 'shift' as const, category: 'Shift', value, display: `Shift ${value}`, color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70', icon: Clock })),
    ...filters.date.map(value => {
      let display = value;
      try {
        const parsed = parseISO(value);
        if (isValid(parsed)) display = `${format(parsed, 'MMM d, yyyy')} (${format(parsed, 'EEE')})`;
      } catch {}
      return { field: 'date' as const, category: 'Date', value, display, color: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/70', icon: Calendar };
    }),
    ...filters.month.map(value => ({ field: 'month' as const, category: 'Month', value, display: format(parseISO(`${value}-01`), 'MMMM yyyy'), color: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100/70', icon: Calendar })),
    ...filters.week.map(value => ({ field: 'week' as const, category: 'Week', value, display: value, color: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100/70', icon: Calendar })),
    ...filters.line.map(value => ({ field: 'line' as const, category: 'Line', value, display: `Line ${value}`, color: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100/70', icon: Layers })),
    ...filters.supervisor.map(value => ({ field: 'supervisor' as const, category: 'Supervisor', value, display: value, color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70', icon: User })),
  ].map(chip => ({
    ...chip,
    key: `${chip.field}-${chip.value}`,
  })) as {
    key: string;
    field: keyof FilterState;
    category: string;
    value: string;
    display: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];

  const activeCount = activeChips.length;
  const handleShiftSelect = (shiftVal: string) => {
    if (filters.shift.includes(shiftVal)) {
      const remainingShifts = filters.shift.filter(shift => shift !== shiftVal);
      setFilters(prev => ({ ...prev, shift: remainingShifts }));
    } else {
      setFilters(prev => ({ ...prev, shift: [...prev.shift, shiftVal] }));
    }
  };

  const removeSingleFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item !== value)
    }));
  };

  const handleReset = () => {
    setFilters({ date: [], month: [], week: [], shift: [], line: [], supervisor: [] });
    setIsExpanded(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Floating Shift Reports Filter Bar"
      style={{ top: `${topOffset}px` }}
      className="fixed inset-x-0 z-40 flex justify-center px-4 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      <div className="pointer-events-auto w-full max-w-7xl bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-[0_14px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] p-2.5 sm:p-3 transition-all duration-300">
        {/* Main Controls Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Left: Filter identity & status */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-2 bg-[#4f7c5e]/10 text-[#4f7c5e] rounded-xl flex items-center justify-center shrink-0 shadow-2xs">
              <Filter className="w-3.5 h-3.5" />
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold tracking-tight text-gray-900 hidden md:inline">
                Shift Filters
              </span>
              <div className="flex items-center gap-1.5 bg-gray-100/80 px-2 py-0.5 rounded-lg border border-gray-200/50">
                <span className="text-xs font-mono font-bold text-gray-900">{filteredCount}</span>
                <span className="text-[11px] text-gray-400 font-medium">/{totalCount}</span>
              </div>

              {activeCount === 0 && (
                <span className="text-[11px] text-gray-400 font-medium hidden xl:inline">
                  (All shifts shown)
                </span>
              )}
            </div>
          </div>

          {/* Center: Desktop inline quick-controls */}
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-center max-w-3xl">
            {/* Quick Shift selector */}
            <div className="inline-flex items-center liquid-glass-track p-0.5 rounded-xl text-xs font-semibold text-gray-600 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setFilters(prev => ({ ...prev, shift: [] }));
                }}
                className={`relative px-2.5 py-1 rounded-lg transition-colors duration-150 cursor-pointer select-none ${
                  !filters.shift.length ? 'liquid-glass-nav-lightgreen text-[#004d25] font-extrabold' : 'hover:text-gray-900 text-gray-600'
                }`}
              >
                <span className="relative z-10">All Shifts</span>
              </button>
              {uniqueValues.shifts.map(s => {
                const isSelected = filters.shift.includes(s);
                const activeTextColor =
                  s === '1' ? 'text-blue-900' :
                  s === '2' ? 'text-emerald-900' :
                  s === '3' ? 'text-amber-900' :
                  'text-slate-900';

                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleShiftSelect(s)}
                    className={`relative px-2.5 py-1 rounded-lg transition-colors duration-300 cursor-pointer flex items-center justify-center select-none ${
                      isSelected ? `liquid-glass-nav-lightgreen ${activeTextColor} font-extrabold` : 'hover:text-gray-900 text-gray-600'
                    }`}
                  >
                    <span className="relative z-10">Shift {s}</span>
                  </button>
                );
              })}
            </div>

            {/* Date select */}
            <MultiSelectFilter
              label="Dates"
              value={filters.date}
              onChange={date => setFilters(prev => ({ ...prev, date }))}
              options={uniqueValues.dates.map(date => {
                let label = date;
                try {
                  const parsed = parseISO(date);
                  if (isValid(parsed)) label = `${date} (${format(parsed, 'EEE')})`;
                } catch {}
                return { value: date, label };
              })}
              className={`w-36 bg-gray-50/90 hover:bg-white border rounded-xl px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4f7c5e]/40 transition-all ${
                filters.date.length ? 'border-[#4f7c5e] bg-emerald-50/60 font-semibold text-emerald-900 ring-1 ring-[#4f7c5e]/30' : 'border-gray-200'
              }`}
            />

            {/* Month select */}
            <MultiSelectFilter
              label="Months"
              value={filters.month}
              onChange={month => setFilters(prev => ({ ...prev, month }))}
              options={uniqueValues.months.map(month => ({
                value: month,
                label: format(parseISO(`${month}-01`), 'MMMM yyyy'),
              }))}
              className={`w-32 bg-gray-50/90 hover:bg-white border rounded-xl px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4f7c5e]/40 transition-all ${filters.month.length ? 'border-[#4f7c5e] bg-teal-50/60 font-semibold text-teal-900 ring-1 ring-[#4f7c5e]/30' : 'border-gray-200'}`}
            />

            {/* Week select */}
            <MultiSelectFilter label="Weeks" value={filters.week} onChange={week => setFilters(prev => ({ ...prev, week }))} options={uniqueValues.weeks.map(week => ({ value: week, label: week }))} className={`w-32 bg-gray-50/90 hover:bg-white border rounded-xl px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4f7c5e]/40 transition-all ${filters.week.length ? 'border-[#4f7c5e] bg-blue-50/60 font-semibold text-blue-900 ring-1 ring-[#4f7c5e]/30' : 'border-gray-200'}`} />

            {/* Line select */}
            <MultiSelectFilter label="Lines" value={filters.line} onChange={line => setFilters(prev => ({ ...prev, line }))} options={uniqueValues.lines.map(line => ({ value: line, label: `Line ${line}` }))} className={`w-28 bg-gray-50/90 hover:bg-white border rounded-xl px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4f7c5e]/40 transition-all ${filters.line.length ? 'border-[#4f7c5e] bg-purple-50/60 font-semibold text-purple-900 ring-1 ring-[#4f7c5e]/30' : 'border-gray-200'}`} />

            {/* Supervisor select */}
            <MultiSelectFilter label="Supervisors" value={filters.supervisor} onChange={supervisor => setFilters(prev => ({ ...prev, supervisor }))} options={(uniqueValues.supervisors || []).map(supervisor => ({ value: supervisor, label: supervisor }))} className={`w-32 bg-gray-50/90 hover:bg-white border rounded-xl px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4f7c5e]/40 transition-all ${filters.supervisor.length ? 'border-[#4f7c5e] bg-amber-50/60 font-semibold text-amber-900 ring-1 ring-[#4f7c5e]/30' : 'border-gray-200'}`} />
          </div>

          {/* Right: Actions (Reset, Edit drawer toggle, Scroll to top) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="liquid-glass-btn-danger-soft inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-102"
                title="Clear all active filters"
              >
                <RotateCcw className="w-3 h-3 text-red-600" />
                <span className="hidden sm:inline">Clear All</span>
                <span className="sm:hidden text-[11px]">Clear</span>
              </button>
            )}

            {/* Mobile / Tablet toggle button */}
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className={`lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs ${
                isExpanded || activeCount > 0
                  ? 'liquid-glass-btn-primary font-bold shadow-xs'
                  : 'liquid-glass-btn text-gray-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isExpanded ? 'Hide' : 'Filters'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Scroll back to main filter section */}
            <button
              type="button"
              onClick={onScrollToFilters}
              className="liquid-glass-btn inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Scroll up to top filter section"
              aria-label="Scroll up to top filter section"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Detailed Active Filters Ribbon: Displays explicit filter details chips instead of just "X active" */}
        {activeCount > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4f7c5e] inline-block animate-pulse"></span>
                Active:
              </span>

              {activeChips.map(chip => {
                const Icon = chip.icon;
                return (
                  <span
                    key={chip.key}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border shadow-2xs transition-all ${chip.color}`}
                  >
                    <Icon className="w-3 h-3 shrink-0 opacity-75" />
                    <span className="font-semibold opacity-75 text-[11px]">{chip.category}:</span>
                    <span className="font-bold">{chip.display}</span>
                    <button
                      type="button"
                      onClick={() => removeSingleFilter(chip.field, chip.value)}
                      aria-label={`Remove filter ${chip.category} ${chip.display}`}
                      className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 active:scale-90 transition-transform cursor-pointer inline-flex items-center justify-center text-current"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile / Tablet Expandable Drawer */}
        {isExpanded && (
          <div className="lg:hidden mt-2.5 pt-2.5 border-t border-gray-100 bg-gray-50/70 -mx-2.5 -mb-2.5 p-3 rounded-b-2xl sm:rounded-b-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
            {/* Shift pills */}
            <div className="sm:col-span-2 md:col-span-4 flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0">Shift:</span>
              <div className="inline-flex items-center bg-gray-200/80 p-0.5 rounded-xl text-xs font-semibold text-gray-600">
                <button
                  type="button"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, shift: [] }));
                  }}
                  className={`relative px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    !filters.shift.length ? 'bg-[#006837] text-white shadow-2xs font-bold' : 'hover:text-gray-900'
                  }`}
                >
                  <span className="relative z-10">All</span>
                </button>
                {uniqueValues.shifts.map(s => {
                  const isShiftSelected = filters.shift.includes(s);
                  const mobileShiftColor =
                    s === '1' ? 'bg-blue-600' :
                    s === '2' ? 'bg-emerald-600' :
                    s === '3' ? 'bg-amber-600' :
                    'bg-slate-900';

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleShiftSelect(s)}
                      className={`relative px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                        isShiftSelected ? `${mobileShiftColor} text-white font-bold` : 'hover:text-gray-900'
                      }`}
                    >
                      <span className="relative z-10">Shift {s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Date</label>
              <MultiSelectFilter label="Dates" value={filters.date} onChange={date => setFilters(prev => ({ ...prev, date }))} options={uniqueValues.dates.map(date => ({ value: date, label: date }))} className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 shadow-2xs" />
            </div>

            {/* Month */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Month</label>
              <MultiSelectFilter label="Months" value={filters.month} onChange={month => setFilters(prev => ({ ...prev, month }))} options={uniqueValues.months.map(month => ({ value: month, label: format(parseISO(`${month}-01`), 'MMMM yyyy') }))} className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 shadow-2xs" />
            </div>

            {/* Week */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Week</label>
              <MultiSelectFilter label="Weeks" value={filters.week} onChange={week => setFilters(prev => ({ ...prev, week }))} options={uniqueValues.weeks.map(week => ({ value: week, label: week }))} className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 shadow-2xs" />
            </div>

            {/* Line */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Line</label>
              <MultiSelectFilter label="Lines" value={filters.line} onChange={line => setFilters(prev => ({ ...prev, line }))} options={uniqueValues.lines.map(line => ({ value: line, label: `Line ${line}` }))} className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 shadow-2xs" />
            </div>

            {/* Supervisor */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Supervisor</label>
              <MultiSelectFilter label="Supervisors" value={filters.supervisor} onChange={supervisor => setFilters(prev => ({ ...prev, supervisor }))} options={(uniqueValues.supervisors || []).map(supervisor => ({ value: supervisor, label: supervisor }))} className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 shadow-2xs" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

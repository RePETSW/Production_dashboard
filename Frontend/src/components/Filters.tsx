import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar, Layers, User, RotateCcw, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { MultiSelectFilter } from './MultiSelectFilter';

export interface FilterState {
  date: string[];
  month: string[];
  week: string[];
  shift: string[];
  line: string[];
  supervisor: string[];
}

interface FiltersProps {
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
}

export function Filters({ filters, setFilters, uniqueValues, totalCount, filteredCount }: FiltersProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const handleShiftSelect = (shiftVal: string) => {
    if (filters.shift.includes(shiftVal)) {
      const remainingShifts = filters.shift.filter(shift => shift !== shiftVal);
      setFilters(prev => ({ ...prev, shift: remainingShifts }));
    } else {
      setFilters(prev => ({ ...prev, shift: [...prev.shift, shiftVal] }));
    }
  };

  const handleReset = () => {
    setFilters({ date: [], month: [], week: [], shift: [], line: [], supervisor: [] });
  };

  const activeCount = Object.values(filters).reduce((count, values) => count + values.length, 0);
  const filterChips = [
    ...filters.date.map(value => ({ key: `date-${value}`, label: `Date: ${value}`, field: 'date' as const, value, color: 'bg-emerald-50 text-emerald-800 border-emerald-200/60 hover:text-emerald-950' })),
    ...filters.month.map(value => ({ key: `month-${value}`, label: `Month: ${format(parseISO(`${value}-01`), 'MMM yyyy')}`, field: 'month' as const, value, color: 'bg-teal-50 text-teal-800 border-teal-200/60 hover:text-teal-950' })),
    ...filters.week.map(value => ({ key: `week-${value}`, label: `Week: ${value}`, field: 'week' as const, value, color: 'bg-blue-50 text-blue-800 border-blue-200/60 hover:text-blue-950' })),
    ...filters.shift.map(value => ({ key: `shift-${value}`, label: `Shift ${value}`, field: 'shift' as const, value, color: 'bg-indigo-50 text-indigo-800 border-indigo-200/60 hover:text-indigo-950' })),
    ...filters.line.map(value => ({ key: `line-${value}`, label: `Line ${value}`, field: 'line' as const, value, color: 'bg-purple-50 text-purple-800 border-purple-200/60 hover:text-purple-950' })),
    ...filters.supervisor.map(value => ({ key: `supervisor-${value}`, label: `Sup: ${value}`, field: 'supervisor' as const, value, color: 'bg-amber-50 text-amber-800 border-amber-200/60 hover:text-amber-950' })),
  ];

  const removeFilter = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: prev[field].filter(item => item !== value) }));
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-6 transition-all">
      {/* Top Filter Header: Quick Shifts, Reset & Collapse */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${!isCollapsed ? 'mb-4 pb-3 border-b border-gray-100' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-[#4f7c5e] rounded-lg">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Filter Shift Reports</span>
            <span className="text-xs text-gray-400 ml-2">
              Showing <strong className="text-gray-800">{filteredCount}</strong> of {totalCount} shifts
            </span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Shift selector */}
          <div className="liquid-glass-track inline-flex items-center p-1 rounded-2xl text-xs font-semibold text-gray-600">
            <button
              type="button"
              onClick={() => {
                setFilters(prev => ({ ...prev, shift: [] }));
              }}
              className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-150 cursor-pointer whitespace-nowrap select-none ${
                !filters.shift.length ? 'liquid-glass-btn-forest text-[#004d25] font-extrabold' : 'hover:text-gray-900 hover:bg-white/40 text-gray-600'
              }`}
            >
              <span className="relative z-10">All Shifts</span>
            </button>
            {uniqueValues.shifts.map(s => {
              const isSelected = filters.shift.includes(s);
              const shiftPillClass = 
                s === '1' ? 'liquid-glass-btn-primary' :
                s === '2' ? 'liquid-glass-btn-emerald' :
                s === '3' ? 'liquid-glass-btn-amber' :
                'liquid-glass-btn-dark';

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
                  className={`relative px-3.5 py-1.5 rounded-xl transition-colors duration-300 cursor-pointer flex items-center justify-center whitespace-nowrap select-none ${
                    isSelected ? `${shiftPillClass} ${activeTextColor} font-extrabold` : 'hover:text-gray-900 hover:bg-white/40 text-gray-600'
                  }`}
                >
                  <span className="relative z-10">Shift {s}</span>
                </button>
              );
            })}
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="liquid-glass-btn-danger-soft inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs hover:scale-102"
              title="Reset all active filters"
            >
              <RotateCcw className="w-3 h-3 text-red-600" />
              Reset ({activeCount})
            </button>
          )}

          {/* Toggle Expand / Collapse */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="liquid-glass-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 rounded-xl transition-all cursor-pointer shadow-2xs"
            title={isCollapsed ? "Expand filter options" : "Collapse filter options"}
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                <span>Show Options</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                <span>Hide Options</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Selectors Grid (collapsible) */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 animate-in fade-in duration-150">
          {/* Date Filter */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Specific Date
            </label>
            <MultiSelectFilter
              label="Dates"
              value={filters.date}
              onChange={date => setFilters(prev => ({ ...prev, date }))}
              options={uniqueValues.dates.map(date => {
                let label = date;
                try {
                  const parsed = parseISO(date);
                  if (isValid(parsed)) label = `${date} (${format(parsed, 'EEEE, MMM d')})`;
                } catch {}
                return { value: date, label };
              })}
              className="bg-gray-50/70 hover:bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4f7c5e]/40 focus:border-[#4f7c5e] transition-all"
            />
          </div>

          {/* Week Filter */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Production Week
            </label>
            <MultiSelectFilter
              label="Weeks"
              value={filters.week}
              onChange={week => setFilters(prev => ({ ...prev, week }))}
              options={uniqueValues.weeks.map(week => ({ value: week, label: week }))}
              className="bg-gray-50/70 hover:bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4f7c5e]/40 focus:border-[#4f7c5e] transition-all"
            />
          </div>

          {/* Month Filter */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              Production Month
            </label>
            <MultiSelectFilter
              label="Months"
              value={filters.month}
              onChange={month => setFilters(prev => ({ ...prev, month }))}
              options={uniqueValues.months.map(month => ({
                value: month,
                label: format(parseISO(`${month}-01`), 'MMMM yyyy'),
              }))}
              className="bg-gray-50/70 hover:bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4f7c5e]/40 focus:border-[#4f7c5e] transition-all"
            />
          </div>

          {/* Line Filter */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              Production Line
            </label>
            <MultiSelectFilter
              label="Lines"
              value={filters.line}
              onChange={line => setFilters(prev => ({ ...prev, line }))}
              options={uniqueValues.lines.map(line => ({ value: line, label: `Line ${line}` }))}
              className="bg-gray-50/70 hover:bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4f7c5e]/40 focus:border-[#4f7c5e] transition-all"
            />
          </div>

          {/* Supervisor Filter */}
          <div className="flex flex-col">
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              Supervisor
            </label>
            <MultiSelectFilter
              label="Supervisors"
              value={filters.supervisor}
              onChange={supervisor => setFilters(prev => ({ ...prev, supervisor }))}
              options={(uniqueValues.supervisors || []).map(supervisor => ({ value: supervisor, label: supervisor }))}
              className="bg-gray-50/70 hover:bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4f7c5e]/40 focus:border-[#4f7c5e] transition-all"
            />
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active:</span>
          {filterChips.map(chip => (
            <span key={chip.key} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${chip.color}`}>
              {chip.label}
              <button type="button" onClick={() => removeFilter(chip.field, chip.value)} aria-label={`Remove ${chip.label}`} className="font-bold ml-1 cursor-pointer">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

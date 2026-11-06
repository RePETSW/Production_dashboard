import React from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  FileText, 
  BarChart3, 
  Table, 
  Filter, 
  Printer, 
  RotateCcw,
  Sparkles,
  Droplets
} from 'lucide-react';

export type TabType = 
  | 'dashboard' 
  | 'blade-change' 
  | 'cleanliness-audit' 
  | 'rewash' 
  | 'water-usage'
  | 'analytics' 
  | 'shift-report' 
  | 'production-note';

interface LeftDockProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onScrollToFilters?: () => void;
  onResetFilters?: () => void;
  activeFilterCount?: number;
}

export function LeftDock({
  activeTab,
  setActiveTab,
  onScrollToFilters,
  onResetFilters,
  activeFilterCount = 0
}: LeftDockProps) {
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'blade-change' as TabType, label: 'Blade Change', icon: Wrench },
    { id: 'cleanliness-audit' as TabType, label: 'Cleanliness Audit', icon: Sparkles },
    { id: 'rewash' as TabType, label: 'Rewash', icon: RotateCcw },
    { id: 'water-usage' as TabType, label: 'Water Usage', icon: Droplets },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'shift-report' as TabType, label: 'Shift Report', icon: Table },
  ];

  return (
    <aside 
      aria-label="Quick Navigation Dock" 
      className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center liquid-glass-btn bg-slate-900/90 text-slate-300 backdrop-blur-xl border border-white/20 p-2 rounded-full shadow-2xl transition-all duration-300"
    >
      {/* Search / Filters button */}
      <div className="relative group">
        <button
          type="button"
          onClick={onScrollToFilters}
          aria-label="Filter Shift Reports"
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
        >
          <Filter className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
        {/* Tooltip */}
        <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-50">
          Filters {activeFilterCount > 0 ? `(${activeFilterCount} active)` : ''}
        </div>
      </div>

      <div className="w-6 h-px bg-white/10 my-1" />

      {/* Primary Section Switchers */}
      <nav className="flex flex-col items-center gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative group">
              <button
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 cursor-pointer select-none ${
                  isActive
                    ? 'liquid-glass-nav-lightgreen text-[#00562e] font-extrabold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/15'
                }`}
              >
                <Icon className="relative z-10 w-4 h-4" />
              </button>

              {/* Tooltip */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="w-6 h-px bg-white/10 my-1" />

      {/* Utility Actions */}
      <div className="flex flex-col items-center gap-1.5">
        {/* Print */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Print Current View"
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
          <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-50">
            Print View
          </div>
        </div>

        {/* Reset Filters */}
        {activeFilterCount > 0 && onResetFilters && (
          <div className="relative group">
            <button
              type="button"
              onClick={onResetFilters}
              aria-label="Clear All Filters"
              className="w-10 h-10 rounded-full flex items-center justify-center text-amber-300 hover:text-amber-200 hover:bg-amber-400/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap shadow-lg border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Clear All Filters
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

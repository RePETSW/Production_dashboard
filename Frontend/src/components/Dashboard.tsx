import { useState, useMemo, useRef, useEffect } from 'react';
import { parseISO, format, isValid } from 'date-fns';
import { Database, RefreshCw } from 'lucide-react';
import { CleanShiftReport, CleanBladeChange, CleanRewashBag, CleanWaterUsage } from '../types';
import { Filters, FilterState } from './Filters';
import { FloatingFilterBar } from './FloatingFilterBar';
import { TopNav } from './TopNav';
import { TabType, LeftDock } from './LeftDock';
import { WeeklyTarget } from './WeeklyTarget';
import { KPICards } from './KPICards';
import { BladeChangesList } from './BladeChangesList';
import { CleanlinessAudit } from './CleanlinessAudit';
import { RewashBags } from './RewashBags';
import { ProductionChartsSection } from './Charts';
import { ProductionLog } from './ProductionLog';
import { BladeMaintenanceAnalytics } from './BladeMaintenanceAnalytics';
import { RewashAnalyticsChart } from './RewashAnalyticsChart';
import { WaterUsageLog } from './WaterUsageLog';
import { WaterAnalyticsChart } from './WaterAnalyticsChart';
import { countCleanlinessAudits } from '../utils/metrics';
import { getProductionMonth, matchesProductionMonth } from '../utils/data-processing';

export function Dashboard({ 
  reports, 
  bladeChanges,
  rewashBags = [],
  waterUsage = [],
  onRefreshData,
  isSyncing,
  justSynced,
  loadError,
  emptyTables
}: { 
  reports: CleanShiftReport[]; 
  bladeChanges: CleanBladeChange[];
  rewashBags?: CleanRewashBag[];
  waterUsage?: CleanWaterUsage[];
  onRefreshData: () => Promise<void>;
  isSyncing: boolean;
  justSynced: boolean;
  loadError: string | null;
  emptyTables: string[];
}) {
  // Active Tab state for Top Nav and Left Dock
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const handleTabChange = (tab: TabType) => {
    setShowFloatingFilter(false);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  // Filter state across all views
  const [filters, setFilters] = useState<FilterState>({ 
    month: [],
    week: [], 
    date: [], 
    shift: [], 
    line: [], 
    supervisor: [] 
  });
  const filterSectionRef = useRef<HTMLDivElement>(null);
  const [showFloatingFilter, setShowFloatingFilter] = useState(false);
  const [floatingFilterTop, setFloatingFilterTop] = useState(72);
  const [isDarkMode, setIsDarkMode] = useState(() => window.localStorage.getItem('repet-theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    window.localStorage.setItem('repet-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  // Latest Data Update Date/Time from the database across reports and rewash bags
  const latestDatabaseUpdate = useMemo(() => {
    let latestTime: number = 0;
    // Check reports
    reports.forEach(r => {
      const ts = r.created_at || r.completed_date || r.report_date;
      if (ts) {
        const time = new Date(ts).getTime();
        if (!isNaN(time) && time > latestTime) {
          latestTime = time;
        }
      }
    });
    // Check rewashBags
    rewashBags.forEach(b => {
      const ts = b.created_at || b.bag_date;
      if (ts) {
        const time = new Date(ts).getTime();
        if (!isNaN(time) && time > latestTime) {
          latestTime = time;
        }
      }
    });
    // Check waterUsage
    waterUsage.forEach(w => {
      const ts = w.created_at || w.report_date;
      if (ts) {
        const time = new Date(ts).getTime();
        if (!isNaN(time) && time > latestTime) {
          latestTime = time;
        }
      }
    });
    if (latestTime === 0) return 'No records';
    const d = new Date(latestTime);
    try {
      return format(d, 'MMM d, h:mm a');
    } catch {
      return 'Nov 2, 11:20 AM';
    }
  }, [reports, rewashBags, waterUsage]);

  // Monitor scroll position to show floating filter bar when user scrolls down and filter cannot be seen on page
  useEffect(() => {
    const header = document.querySelector('header');
    const updateHeaderHeight = () => {
      setFloatingFilterTop((header?.getBoundingClientRect().height || 64) + 8);
    };
    const handleScroll = () => {
      if (filterSectionRef.current) {
        const rect = filterSectionRef.current.getBoundingClientRect();
        const headerHeight = header ? header.getBoundingClientRect().height : 64;
        // The inline filter is hidden when its bottom edge scrolls past the bottom of the sticky header
        const isOutOfView = rect.bottom <= headerHeight;
        setShowFloatingFilter(isOutOfView && window.scrollY > 80);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    window.addEventListener('resize', updateHeaderHeight, { passive: true });
    const resizeObserver = header ? new ResizeObserver(updateHeaderHeight) : null;
    if (header && resizeObserver) resizeObserver.observe(header);
    updateHeaderHeight();
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('resize', updateHeaderHeight);
      resizeObserver?.disconnect();
    };
  }, []);
  const handleScrollToFilters = () => {
    if (filterSectionRef.current) {
      filterSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const handleResetFilters = () => {
    setFilters({ week: [], date: [], month: [], shift: [], line: [], supervisor: [] });
  };
  const uniqueValues = useMemo(() => {
    const dates = Array.from(new Set(reports.map(r => r.report_date).filter(Boolean))).sort().reverse();
    const months = Array.from(new Set(reports.map(r => getProductionMonth(r.report_date)).filter(Boolean))).sort().reverse();
    const latestDateByWeek = new Map<string, string>();
    reports.forEach(report => {
      if (!report.weekLabel || !report.report_date) return;
      const latestDate = latestDateByWeek.get(report.weekLabel);
      if (!latestDate || report.report_date > latestDate) {
        latestDateByWeek.set(report.weekLabel, report.report_date);
      }
    });
    const weeks = Array.from(latestDateByWeek.entries())
      .sort(([weekA, dateA], [weekB, dateB]) => dateB.localeCompare(dateA) || weekB.localeCompare(weekA))
      .map(([week]) => week);
    const shifts = Array.from(new Set(reports.map(r => r.shift).filter(Boolean))).sort();
    const lines = Array.from(new Set(reports.map(r => r.line).filter(Boolean))).sort();
    const supervisors = Array.from(new Set(reports.map(r => r.supervisor).filter(Boolean))).sort();
    return { dates, months, weeks, shifts, lines, supervisors };
  }, [reports]);
  // Master Filtered Reports applied globally
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (filters.week.length && !filters.week.includes(r.weekLabel)) return false;
      if (filters.date.length && !filters.date.includes(r.report_date)) return false;
      if (!matchesProductionMonth(r.report_date, filters.month)) return false;
      if (filters.shift.length && !filters.shift.includes(r.shift)) return false;
      if (filters.line.length && !filters.line.includes(r.line)) return false;
      if (filters.supervisor.length && !filters.supervisor.includes(r.supervisor)) return false;
      return true;
    });
  }, [reports, filters]);

  // Join blade changes by shift_report_id with matched reports
  const enrichedBladeChanges = useMemo(() => {
    const reportMap = new Map(reports.map(r => [r.id, r]));
    return bladeChanges.map(b => {
      const r = reportMap.get(b.shift_report_id);
      let dayLabel = '';
      if (r?.report_date) {
        try {
          const d = parseISO(r.report_date);
          if (isValid(d)) {
            dayLabel = format(d, 'EEEE');
          }
        } catch (e) {}
      }
      return {
        ...b,
        report_date: r?.report_date,
        shift: r?.shift,
        dayLabel
      };
    });
  }, [bladeChanges, reports]);
  const filteredBladeChanges = useMemo(() => {
    const matchedReportIds = new Set(filteredReports.map(r => r.id));
    return enrichedBladeChanges.filter(b => matchedReportIds.has(b.shift_report_id));
  }, [enrichedBladeChanges, filteredReports]);

  // Filter Rewash Bags according to main filters
  const filteredRewashBags = useMemo(() => {
    const matchedReportIds = new Set(filteredReports.map(r => r.id));
    return rewashBags.filter(b => {
      if (b.shift_report_id) {
        return matchedReportIds.has(b.shift_report_id);
      }
      if (filters.week.length && (!b.weekLabel || !filters.week.includes(b.weekLabel))) return false;
      if (filters.date.length && !filters.date.includes(b.bag_date)) return false;
      if (!matchesProductionMonth(b.bag_date, filters.month)) return false;
      if (filters.shift.length && !filters.shift.includes(b.shift)) return false;
      if (filters.line.length && !filters.line.includes(b.line)) return false;
      if (filters.supervisor.length && !filters.supervisor.includes(b.supervisor || '')) return false;
      return true;
    });
  }, [rewashBags, filteredReports, filters]);

  // Filter Water Usage according to main filters
  const filteredWaterUsage = useMemo(() => {
    const matchedReportIds = new Set(filteredReports.map(r => r.id));
    return waterUsage.filter(w => {
      if (w.shift_report_id) {
        return matchedReportIds.has(w.shift_report_id);
      }
      if (filters.week.length && (!w.weekLabel || !filters.week.includes(w.weekLabel))) return false;
      if (filters.date.length && !filters.date.includes(w.report_date)) return false;
      if (!matchesProductionMonth(w.report_date, filters.month)) return false;
      if (filters.shift.length && !filters.shift.includes(w.shift)) return false;
      if (filters.line.length && !filters.line.includes(w.line)) return false;
      if (filters.supervisor.length && !filters.supervisor.includes(w.supervisor || '')) return false;
      return true;
    });
  }, [waterUsage, filteredReports, filters]);

  // Total recorded injuries
  const totalInjuries = useMemo(() => {
    return filteredReports.filter(r => 
      r.injuries && 
      r.injuries.toLowerCase() !== 'no' && 
      r.injuries.toLowerCase() !== 'none'
    ).length;
  }, [filteredReports]);
  const activeFilterCount =
    filters.date.length +
    filters.month.length +
    filters.week.length +
    filters.shift.length +
    filters.line.length +
    filters.supervisor.length;
  const totalAudits = useMemo(() => countCleanlinessAudits(filteredReports), [filteredReports]);
  return (
    <div className="dark-mode-page min-h-screen bg-[#f8fafc] text-gray-900 font-sans selection:bg-[#4f7c5e]/20 selection:text-[#2d4a37]">
      {/* 1. Top Navigation Bar */}
      <TopNav 
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        totalBladeChanges={filteredBladeChanges.length}
        totalReports={filteredReports.length}
        totalRewashBags={filteredRewashBags.length}
        totalAudits={totalAudits}
        totalWaterRecords={filteredWaterUsage.length}
        onResetFilters={handleResetFilters}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(mode => !mode)}
      />
      {/* Floating Shift Reports Filter Bar */}
      <FloatingFilterBar
        filters={filters}
        setFilters={setFilters}
        uniqueValues={uniqueValues}
        totalCount={reports.length}
        filteredCount={filteredReports.length}
        isVisible={showFloatingFilter}
        onScrollToFilters={handleScrollToFilters}
        topOffset={floatingFilterTop}
      />
      {/* Main Tabbed Content Viewport */}
      <main className="max-w-7xl mx-auto pt-3.5 pb-8 sm:pt-4 sm:pb-8 px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
        {/* Section Title & Context Header */}
        <div className="pb-2 border-b border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {activeTab === 'dashboard' && 'Operations Dashboard'}
              {activeTab === 'blade-change' && 'Blade Change Log & Grinder Maintenance'}
              {(activeTab === 'cleanliness-audit' || activeTab === 'production-note') && 'Cleanliness Audit'}
              {activeTab === 'rewash' && 'Rewash Material & Bag Inventory'}
              {activeTab === 'water-usage' && 'Water Usage & Wastewater Log'}
              {activeTab === 'analytics' && 'Production Analytics & Trends'}
              {activeTab === 'shift-report' && 'Shift Production Master Report'}
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {activeTab === 'dashboard' && 'Target progress, weekly performance and core operational KPI metrics'}
              {activeTab === 'blade-change' && 'Blade change procedures, duration tracking and grinder wear analytics'}
              {(activeTab === 'cleanliness-audit' || activeTab === 'production-note') && 'Dedicated Open Baler (Augers 1–3) and Twin Auger (Augers 1–5) cleanliness inspections, condition status, operator cleaning, and photo verification'}
              {activeTab === 'rewash' && 'Rewash bag records, weight tracking, and classification across Aluminum, Color, Label, Hotwash, Big Flake, PVC, and Rebag'}
              {activeTab === 'water-usage' && 'Reclaimed purple pipe water meter readings, GPM flow rates, and wastewater discharge measurements'}
              {activeTab === 'analytics' && 'Yield comparisons, throughput volume, water consumption, flake recovery and downtime hours'}
              {activeTab === 'shift-report' && 'Complete record of shift logs, bale inputs, flake output and supervisor audits'}
            </p>
          </div>

          {/* Database updated compact pill aligned right below top nav bar divider line */}
          <div className="flex items-center shrink-0 self-end sm:self-start -mt-1 sm:-mt-1.5">
            <button
              type="button"
              onClick={() => void onRefreshData()}
              disabled={isSyncing}
              title="Click to sync latest database updates"
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full text-slate-700 bg-emerald-50/70 border border-emerald-200/80 shadow-2xs hover:bg-[#7ac143]/20 hover:border-[#7ac143]/60 hover:text-[#00562e] transition-all cursor-pointer backdrop-blur-md active:scale-95"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full rounded-full ${justSynced ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
              </span>
              <Database className="w-3 h-3 text-[#00562e]" />
              <span className="whitespace-nowrap">Database updated: <strong className="text-slate-900 font-bold">{latestDatabaseUpdate}</strong></span>
              <RefreshCw className={`w-3 h-3 text-slate-500 hover:text-[#00562e] ${isSyncing ? 'animate-spin text-[#00562e]' : ''}`} />
            </button>
          </div>
        </div>
        {(loadError || emptyTables.length > 0) && (
          <div
            role="alert"
            className={`rounded-xl border px-4 py-3 text-sm ${loadError ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
          >
            {loadError
              ? `Unable to refresh Supabase data: ${loadError}. The last successfully loaded data is still shown.`
              : `Supabase returned no rows for: ${emptyTables.join(', ')}. Check that the tables contain data and the app's public role has a SELECT policy.`}
          </div>
        )}
        {/* Global Shift Reports Filters */}
        <div ref={filterSectionRef}>
          <Filters 
            filters={filters} 
            setFilters={setFilters} 
            uniqueValues={uniqueValues} 
            totalCount={reports.length}
            filteredCount={filteredReports.length}
          />
        </div>
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <WeeklyTarget 
              allReports={reports} 
              currentReports={filteredReports} 
              filters={filters} 
            />
            <KPICards reports={filteredReports} />
          </div>
        )}
        {/* Tab 2: Blade Change */}
        {activeTab === 'blade-change' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <BladeChangesList bladeChanges={filteredBladeChanges} />
          </div>
        )}
        {/* Tab 3: Cleanliness Audit */}
        {(activeTab === 'cleanliness-audit' || activeTab === 'production-note') && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <CleanlinessAudit reports={filteredReports} />
          </div>
        )}
        {/* Tab 4: Rewash */}
        {activeTab === 'rewash' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <RewashBags rewashBags={filteredRewashBags} reports={filteredReports} />
          </div>
        )}
        {/* Tab 5: Water Usage */}
        {activeTab === 'water-usage' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <WaterUsageLog waterUsage={filteredWaterUsage} reports={filteredReports} />
          </div>
        )}
        {/* Tab 6: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ProductionChartsSection reports={filteredReports} />
            <BladeMaintenanceAnalytics bladeChanges={filteredBladeChanges} reports={filteredReports} />
            <RewashAnalyticsChart rewashBags={filteredRewashBags} reports={filteredReports} />
            <WaterAnalyticsChart waterUsage={filteredWaterUsage} reports={filteredReports} />
          </div>
        )}
        {/* Tab 7: Shift Report */}
        {activeTab === 'shift-report' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ProductionLog 
              reports={filteredReports} 
              bladeChanges={filteredBladeChanges} 
              rewashBags={filteredRewashBags}
              waterUsage={filteredWaterUsage}
            />
          </div>
        )}
        {/* Clean Footer */}
        <footer className="pt-8 pb-6 border-t border-gray-200/70">
          <p className="mt-5 text-center text-xs leading-5 text-[#6B726B]">© 2027 RePET Inc. - ALL RIGHTS RESERVED</p>
        </footer>
      </main>
    </div>
  );
}

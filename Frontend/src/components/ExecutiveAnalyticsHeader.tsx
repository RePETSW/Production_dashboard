import React, { useState } from 'react';
import { Bell, Download, Recycle } from 'lucide-react';
import { FilterState } from './Filters';
import { CleanShiftReport } from '../types';
import { UserAvatar } from './UserAvatar';

export type TimeRangeOption = '7D' | '30D' | '90D' | '12M' | 'All';
export type LineOption = 'All' | 'Line 1' | 'Line 2' | 'Baler';

interface ExecutiveAnalyticsHeaderProps {
  totalReportsCount: number;
  filteredReportsCount: number;
  timeRange: TimeRangeOption;
  setTimeRange: (val: TimeRangeOption) => void;
  selectedLine: LineOption;
  setSelectedLine: (val: LineOption) => void;
  vsPreviousPeriod: boolean;
  setVsPreviousPeriod: (val: boolean) => void;
  activeNavTab: string;
  setActiveNavTab: (val: string) => void;
  onNavigateSection: (sectionId: string) => void;
  filteredReports: CleanShiftReport[];
  filters: FilterState;
}

export function ExecutiveAnalyticsHeader({
  totalReportsCount,
  filteredReportsCount,
  timeRange,
  setTimeRange,
  selectedLine,
  setSelectedLine,
  vsPreviousPeriod,
  setVsPreviousPeriod,
  activeNavTab,
  setActiveNavTab,
  onNavigateSection,
  filteredReports,
}: ExecutiveAnalyticsHeaderProps) {
  const [showNotificationToast, setShowNotificationToast] = useState(false);

  // CSV export handler
  const handleExportCSV = () => {
    if (!filteredReports || filteredReports.length === 0) return;
    
    // Headers
    const headers = [
      'Report Date',
      'Shift',
      'Line',
      'Supervisor',
      'Output Metric Tons',
      'Total Output Flake (lbs)',
      'Total Input Bales',
      'Total Input Bale Weight (lbs)',
      'Baler Produced Bales',
      'Total Downtime (mins)',
      'Total Runtime (mins)',
      'Injuries'
    ];

    const rows = filteredReports.map(r => [
      r.report_date || '',
      r.shift || '',
      r.line || '',
      `"${(r.supervisor || '').replace(/"/g, '""')}"`,
      r.output_metric_tons || 0,
      r.total_output_flake_weight || 0,
      r.total_input_bales || 0,
      r.total_input_bale_weight || 0,
      r.baler_produced_bales || 0,
      r.total_downtime_computed_minutes || 0,
      r.total_run_time_computed_minutes || 0,
      `"${(r.injuries || 'None').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RePET_Shift_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', target: 'targets-section' },
    { id: 'reports', label: 'Shift Reports', badge: String(totalReportsCount), target: 'filters-section' },
    { id: 'blade_changes', label: 'Blade Change', target: 'blade-change-section' },
    { id: 'production_log', label: 'Master Log', target: 'production-log-section' },
    { id: 'analytics', label: 'Analytics', target: 'analytics-section' },
    { id: 'downtime', label: 'Downtime', target: 'downtime-section' },
  ];

  const timeRanges: TimeRangeOption[] = ['7D', '30D', '90D', '12M', 'All'];
  const lineOptions: LineOption[] = ['All', 'Line 1', 'Line 2', 'Baler'];

  return (
    <div className="space-y-6">
      {/* 1. Top Bar Navigation (Matches reference image header) */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
        {/* Left: Brand Monogram + Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#18191e] flex items-center justify-center text-white shadow-sm ring-1 ring-white/10">
            <Recycle className="w-5 h-5 stroke-[2.4]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-gray-900 tracking-tight">
                RePET Supply Co.
              </span>
            </div>
          </div>
        </div>

        {/* Center: Floating Segmented Capsule Menu */}
        <nav 
          aria-label="Main Navigation Tabs"
          className="liquid-glass-track p-1 rounded-full flex flex-wrap items-center gap-1 shadow-2xs"
        >
          {navTabs.map((tab) => {
            const isActive = activeNavTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveNavTab(tab.id);
                  onNavigateSection(tab.target);
                }}
                className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors duration-300 cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none ${
                  isActive
                    ? 'liquid-glass-nav-lightgreen text-[#00562e] font-extrabold'
                    : 'text-slate-800 hover:text-black hover:bg-white/50'
                }`}
              >
                <span className="relative z-10">{tab.label}</span>
                {tab.badge && (
                  <span className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                    isActive 
                      ? 'bg-[#00562e]/15 text-[#004d25] ring-1 ring-[#00562e]/20' 
                      : 'bg-black/10 text-slate-800'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Notification & User Profile Avatar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowNotificationToast(prev => !prev)}
            aria-label="View notifications"
            className="liquid-glass-btn relative w-8 h-8 rounded-full flex items-center justify-center text-slate-800 transition-all shadow-2xs cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-slate-800" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>

          {/* User profile avatar with initials AH (Allen Hsiao) */}
          <UserAvatar />
        </div>
      </header>

      {/* Notification Toast dropdown */}
      {showNotificationToast && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xl max-w-sm ml-auto text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-bold text-gray-900 border-b border-gray-100 pb-2">
            <span>Plant Activity & Alerts</span>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">Active</span>
          </div>
          <p className="text-gray-600">
            • 46 shift reports loaded and synced. All safety metrics nominal (0 incidents).
          </p>
          <p className="text-gray-500 text-[11px]">
            • Next scheduled blade inspection on Grinder 1: Shift 2.
          </p>
        </div>
      )}

      {/* 2. Page Title & Control Toolbar Section (Matches screenshot exactly) */}
      <div className="space-y-4">
        {/* Title row with live counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-sans">
            Analytics
          </h1>

          {/* Live indicator pill (matches • 1,284 live now) */}
          <div className="liquid-glass-pill inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono tabular-nums">{filteredReportsCount}</span>
            <span>reports active</span>
          </div>
        </div>

        {/* Filter Toolbar (Segmented Pills + Toggle + Export) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          {/* Left Pill Groups */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date range segmented pills */}
            <div className="liquid-glass-track p-1 rounded-full flex items-center gap-0.5 shadow-2xs text-xs font-semibold text-slate-800">
              {timeRanges.map((option) => {
                const isSelected = timeRange === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTimeRange(option)}
                    className={`relative px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-300 cursor-pointer select-none ${
                      isSelected
                        ? 'liquid-glass-nav-lightgreen text-slate-900 font-extrabold'
                        : 'text-slate-800 hover:text-black hover:bg-white/50'
                    }`}
                  >
                    <span className="relative z-10">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Line / Channel segmented pills */}
            <div className="liquid-glass-track p-1 rounded-full flex items-center gap-0.5 shadow-2xs text-xs font-semibold text-slate-800">
              {lineOptions.map((option) => {
                const isSelected = selectedLine === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedLine(option)}
                    className={`relative px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-300 cursor-pointer select-none ${
                      isSelected
                        ? 'liquid-glass-btn-primary text-blue-900 font-extrabold'
                        : 'text-slate-800 hover:text-black hover:bg-white/50'
                    }`}
                  >
                    <span className="relative z-10">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Action Controls: vs previous period toggle + Export CSV */}
          <div className="flex items-center gap-4">
            {/* Toggle switch: vs previous period */}
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={vsPreviousPeriod}
                onClick={() => setVsPreviousPeriod(!vsPreviousPeriod)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                  vsPreviousPeriod ? 'bg-[#18191e]' : 'bg-gray-300'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${
                    vsPreviousPeriod ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span>vs previous period</span>
            </label>

            {/* Export CSV button in Liquid Glass */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="liquid-glass-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-800 transition-all shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-700" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

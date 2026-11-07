import React from 'react';
import { motion } from 'motion/react';
import { Database, RefreshCw, Moon, Sun } from 'lucide-react';
import { Logo } from './Logo';
import { UserAvatar } from './UserAvatar';
import { TabType } from './LeftDock';

interface TopNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  totalBladeChanges: number;
  totalReports: number;
  totalRewashBags?: number;
  totalAudits?: number;
  totalWaterRecords?: number;
  onResetFilters: () => void;
  latestDatabaseUpdate?: string;
  isSyncing?: boolean;
  justSynced?: boolean;
  onManualSync?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  userEmail: string;
}

export function TopNav({
  activeTab,
  setActiveTab,
  totalBladeChanges,
  totalReports,
  totalRewashBags,
  totalAudits,
  totalWaterRecords,
  onResetFilters,
  latestDatabaseUpdate,
  isSyncing,
  justSynced,
  onManualSync,
  isDarkMode,
  onToggleTheme,
  userEmail
}: TopNavProps) {
  const tabs: { id: TabType; label: string; count?: number | string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'blade-change', label: 'Blade change', count: totalBladeChanges },
    { id: 'cleanliness-audit', label: 'Cleanliness audit', count: totalAudits },
    { id: 'rewash', label: 'Rewash', count: totalRewashBags },
    { id: 'water-usage', label: 'Water usage', count: totalWaterRecords },
    { id: 'analytics', label: 'Analytics' },
    { id: 'shift-report', label: 'Shift report', count: totalReports },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#fafafa]/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex items-center justify-start gap-4 min-h-[3.4rem] sm:min-h-[3.8rem]">
          
          {/* Zone 1: Left Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Logo />
          </div>

          {/* Zone 2: Center Segmented Navigation Pills with RePET Brand Color Sliding Indicator */}
          <nav 
            aria-label="Dashboard sections" 
            className="hidden md:flex items-center justify-center liquid-glass-track p-1 rounded-full max-w-full"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative inline-flex items-center justify-center px-4 md:px-5 lg:px-[22px] py-2 rounded-full text-sm md:text-base font-bold tracking-tight transition-colors duration-200 cursor-pointer whitespace-nowrap select-none ${
                    isActive
                      ? 'text-[#00562e] font-extrabold'
                      : 'text-slate-700 hover:text-[#00562e] hover:bg-[#7ac143]/15'
                  }`}
                >
                  {/* Sliding Liquid Glass Indicator in Light Green Translucent */}
                  {isActive && (
                    <motion.div
                      layoutId="topNavPillDesktop"
                      className="absolute inset-0 rounded-full liquid-glass-nav-lightgreen -z-0"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span 
                      className={`absolute -top-1.5 -right-0.5 z-20 text-[9px] md:text-[10px] min-w-[1.25rem] h-4 md:h-4.5 px-1.5 inline-flex items-center justify-center rounded-full font-bold tabular-nums shadow-xs transition-transform duration-200 ${
                        isActive 
                          ? 'bg-[#00562e] text-white ring-2 ring-white/95 shadow-sm scale-105' 
                          : 'bg-[#7ac143] text-[#004d25] ring-1.5 ring-white/90'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Right User Avatar & Database Updated Pill */}
          <div className="ml-auto flex items-center gap-2 sm:gap-2.5 shrink-0">
            {latestDatabaseUpdate && (
              <button
                type="button"
                onClick={onManualSync}
                disabled={isSyncing}
                title="Click to sync latest database updates"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full text-slate-700 bg-emerald-50/80 border border-emerald-200/80 shadow-2xs hover:bg-[#7ac143]/20 hover:border-[#7ac143]/60 hover:text-[#00562e] transition-all cursor-pointer backdrop-blur-md active:scale-95 select-none"
              >
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full ${justSynced ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <Database className="w-3.5 h-3.5 text-[#00562e]" />
                <span className="whitespace-nowrap hidden min-[520px]:inline">Database updated: </span>
                <strong className="text-slate-900 font-bold">{latestDatabaseUpdate}</strong>
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 hover:text-[#00562e] ${isSyncing ? 'animate-spin text-[#00562e]' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDarkMode ? 'Switch to day theme' : 'Switch to night theme'}
              title={isDarkMode ? 'Switch to day theme' : 'Switch to night theme'}
              className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/80 text-slate-700 shadow-2xs transition-colors hover:bg-amber-50 hover:text-amber-700"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <UserAvatar onResetFilters={onResetFilters} userEmail={userEmail} />
          </div>

        </div>

        {/* Mobile / Small Screen Segmented 2-Row Grid (No horizontal sliding bar, 100% visible) */}
        <div className="md:hidden pt-2 pb-1">
          <nav 
            aria-label="Dashboard sections mobile" 
            className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl liquid-glass-track w-full max-w-md mx-auto"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center justify-center px-2 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-colors duration-200 cursor-pointer text-center select-none ${
                    isActive
                      ? 'text-[#00562e] font-extrabold'
                      : 'text-slate-700 hover:text-[#00562e] hover:bg-[#7ac143]/15'
                  }`}
                >
                  {/* Sliding Liquid Glass Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="topNavPillMobile"
                      className="absolute inset-0 rounded-xl liquid-glass-nav-lightgreen -z-0"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 truncate leading-tight">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span 
                      className={`absolute -top-1.5 -right-0.5 z-20 text-[9px] min-w-[1.15rem] h-3.5 px-1 inline-flex items-center justify-center rounded-full font-bold tabular-nums shadow-xs ${
                        isActive 
                          ? 'bg-[#00562e] text-white ring-1.5 ring-white shadow-2xs' 
                          : 'bg-[#7ac143] text-[#004d25] ring-1 ring-white/90'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </div>
    </header>
  );
}

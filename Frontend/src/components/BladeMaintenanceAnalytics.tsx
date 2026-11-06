import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList 
} from 'recharts';
import { CleanBladeChange, CleanShiftReport } from '../types';
import { Wrench, Clock, Activity, BarChart2, Zap } from 'lucide-react';

interface BladeMaintenanceAnalyticsProps {
  bladeChanges: CleanBladeChange[];
  reports?: CleanShiftReport[];
}

const extractGrinderNumber = (grinder: string | number | undefined) => {
  if (!grinder) return null;
  const match = String(grinder).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

const GRINDER_COLORS: Record<number, string> = {
  1: '#3b82f6', // Sapphire Blue
  2: '#10b981', // Emerald Green
  3: '#f59e0b', // Amber Orange
};

type MaintenanceChartTab = 'duration' | 'grinder_comparison';
type ComparisonMetric = 'changes' | 'total_time' | 'avg';

export function BladeMaintenanceAnalytics({ bladeChanges, reports = [] }: BladeMaintenanceAnalyticsProps) {
  const [activeChartTab, setActiveChartTab] = useState<MaintenanceChartTab>('duration');
  const [selectedGrinder, setSelectedGrinder] = useState<string>('all');
  const [timeCadence, setTimeCadence] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [isStacked, setIsStacked] = useState<boolean>(true);
  const [comparisonMetric, setComparisonMetric] = useState<ComparisonMetric>('changes');
  const [showDataPoints, setShowDataPoints] = useState<boolean>(false);
  const [hiddenGrinders, setHiddenGrinders] = useState<number[]>([]);

  const toggleGrinder = (g: number) => {
    setHiddenGrinders(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  // Filter valid changes
  const validChanges = useMemo(() => {
    return bladeChanges.filter(b => b.grinder && (b.duration_minutes !== undefined));
  }, [bladeChanges]);

  // Filter by selected grinder (for Maintenance Time tab)
  const filteredChanges = useMemo(() => {
    if (selectedGrinder === 'all') return validChanges;
    const targetG = parseInt(selectedGrinder, 10);
    return validChanges.filter(b => extractGrinderNumber(b.grinder) === targetG);
  }, [validChanges, selectedGrinder]);

  // Core 3 KPIs: Total Changes, Total Downtime, Avg Duration
  const stats = useMemo(() => {
    const totalEvents = filteredChanges.length;
    const totalMinutes = filteredChanges.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);
    const avgMinutes = totalEvents > 0 ? Math.round(totalMinutes / totalEvents) : 0;

    // Per-grinder breakdown for comparison
    const grinderCounts: Record<number, { count: number; minutes: number }> = {
      1: { count: 0, minutes: 0 },
      2: { count: 0, minutes: 0 },
      3: { count: 0, minutes: 0 },
    };

    validChanges.forEach(b => {
      const g = extractGrinderNumber(b.grinder);
      if (g && grinderCounts[g]) {
        grinderCounts[g].count += 1;
        grinderCounts[g].minutes += (b.duration_minutes || 0);
      }
    });

    const grandTotalChanges = validChanges.length || 1;
    const grandTotalMinutes = validChanges.reduce((sum, b) => sum + (b.duration_minutes || 0), 0) || 1;

    return {
      totalEvents,
      totalMinutes,
      avgMinutes,
      grinderCounts,
      grandTotalChanges,
      grandTotalMinutes,
    };
  }, [filteredChanges, validChanges]);

  // Timeline Trend Data for Maintenance Time (Daily, Weekly, or Monthly)
  const timelineData = useMemo(() => {
    const reportMap = new Map(reports.map(r => [r.id, r]));
    const agg: Record<string, {
      date: string;
      sortKey: string;
      totalMinutes: number;
      eventCount: number;
      g1Minutes: number;
      g2Minutes: number;
      g3Minutes: number;
    }> = {};

    filteredChanges.forEach(b => {
      let key = b.report_date || 'Unknown';
      let sortKey = b.report_date || 'Unknown';

      if (timeCadence === 'Weekly' && b.shift_report_id) {
        const r = reportMap.get(b.shift_report_id);
        if (r?.weekLabel) {
          key = r.weekLabel;
          sortKey = r.report_date || r.weekLabel;
        }
      } else if (timeCadence === 'Monthly' && b.shift_report_id) {
        const r = reportMap.get(b.shift_report_id);
        if (r?.monthLabel) {
          key = r.monthLabel;
          sortKey = r.report_date || r.monthLabel;
        }
      }

      if (!agg[key]) {
        agg[key] = {
          date: key,
          sortKey,
          totalMinutes: 0,
          eventCount: 0,
          g1Minutes: 0,
          g2Minutes: 0,
          g3Minutes: 0,
        };
      }

      const dur = b.duration_minutes || 0;
      agg[key].totalMinutes += dur;
      agg[key].eventCount += 1;

      const g = extractGrinderNumber(b.grinder);
      if (g === 1) agg[key].g1Minutes += dur;
      if (g === 2) agg[key].g2Minutes += dur;
      if (g === 3) agg[key].g3Minutes += dur;
    });

    return Object.values(agg).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredChanges, timeCadence, reports]);

  // Grinder Comparison Data: Total Changes (first), Total Time (minutes), Avg Time
  const grinderComparisonData = useMemo(() => {
    // Calculate sum of averages to determine average share percentage
    const avgList = [1, 2, 3].map(g => {
      const data = stats.grinderCounts[g] || { count: 0, minutes: 0 };
      return data.count > 0 ? Math.round(data.minutes / data.count) : 0;
    });
    const sumOfAvgs = avgList.reduce((sum, a) => sum + a, 0) || 1;

    return [1, 2, 3].map((g, idx) => {
      const data = stats.grinderCounts[g] || { count: 0, minutes: 0 };
      const avg = avgList[idx];
      const totalMinutes = data.minutes;
      const totalHours = Number((data.minutes / 60).toFixed(1));

      // Separate workload shares
      const changeShare = Math.round((data.count / stats.grandTotalChanges) * 100);
      const timeShare = Math.round((data.minutes / stats.grandTotalMinutes) * 100);
      const avgShare = Math.round((avg / sumOfAvgs) * 100);

      let metricValue = data.count;
      let metricUnit = '';
      let metricLabel = 'Total Changes';

      if (comparisonMetric === 'total_time') {
        metricValue = totalMinutes;
        metricUnit = 'm';
        metricLabel = 'Total Time (Minutes)';
      } else if (comparisonMetric === 'avg') {
        metricValue = avg;
        metricUnit = 'm';
        metricLabel = 'Avg Time (Minutes)';
      }

      return {
        grinder: `Grinder ${g}`,
        grinderNum: g,
        events: data.count,
        totalMinutes,
        totalHours,
        avgMinutes: avg,
        changeShare,
        timeShare,
        avgShare,
        metricValue,
        metricUnit,
        metricLabel,
      };
    });
  }, [stats, comparisonMetric]);

  const displayGrinderComparison = useMemo(() => {
    return grinderComparisonData.filter(d => !hiddenGrinders.includes(d.grinderNum));
  }, [grinderComparisonData, hiddenGrinders]);

  if (bladeChanges.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <Wrench className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-800">No Blade Maintenance Data</h3>
        <p className="text-xs text-gray-400 mt-1">No blade replacement events found for the active filter range.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-6">
      
      {/* 1. Header with Title & All Controls on the Same Single Line */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            Blade Change Maintenance Analysis
          </h2>
        </div>

        {/* Controls Toolbar with Liquid Glass Buttons */}
        <div className="flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar py-0.5">
          
          {/* Main Tab Switcher */}
          <div className="liquid-glass-track inline-flex items-center p-1 rounded-full text-xs font-semibold text-gray-700 shrink-0">
            {[
              { id: 'duration' as const, label: 'Maintenance Time', icon: Clock, iconColor: 'text-blue-600', glassClass: 'liquid-glass-btn-primary', textColor: 'text-blue-900' },
              { id: 'grinder_comparison' as const, label: 'Grinder Comparison', icon: BarChart2, iconColor: 'text-amber-600', glassClass: 'liquid-glass-btn-amber', textColor: 'text-amber-900' },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeChartTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveChartTab(tab.id)}
                  className={`relative px-3.5 py-1.5 rounded-full transition-colors duration-300 cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none ${
                    isSelected ? `${tab.glassClass} ${tab.textColor} font-extrabold` : 'hover:text-black hover:bg-white/50 text-gray-700'
                  }`}
                >
                  <Icon className={`relative z-10 w-3.5 h-3.5 ${isSelected ? tab.textColor : tab.iconColor}`} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-controls for Maintenance Time Tab */}
          {activeChartTab === 'duration' && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* 1. Standardized Daily / Weekly / Monthly Granularity */}
              <div className="liquid-glass-track inline-flex items-center p-1 rounded-full text-xs font-semibold text-gray-700 shrink-0">
                {(['Daily', 'Weekly', 'Monthly'] as const).map(mode => {
                  const isSelected = timeCadence === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTimeCadence(mode)}
                      className={`relative px-3.5 py-1.5 rounded-full transition-colors duration-300 cursor-pointer whitespace-nowrap select-none ${
                        isSelected
                          ? 'liquid-glass-btn-dark text-slate-900 font-extrabold'
                          : 'hover:text-black hover:bg-white/50 text-gray-700'
                      }`}
                    >
                      <span className="relative z-10">{mode}</span>
                    </button>
                  );
                })}
              </div>

              {/* 2. Grinder Filter Tabs */}
              <div className="liquid-glass-track inline-flex items-center p-1 rounded-full text-xs font-semibold text-gray-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedGrinder('all')}
                  className={`relative px-3 py-1.5 rounded-full transition-colors duration-300 cursor-pointer whitespace-nowrap select-none ${
                    selectedGrinder === 'all'
                      ? 'liquid-glass-btn-forest text-[#004d25] font-extrabold'
                      : 'hover:text-black hover:bg-white/50 text-gray-700'
                  }`}
                >
                  <span className="relative z-10">All</span>
                </button>
                {[1, 2, 3].map(g => {
                  const isSelected = selectedGrinder === String(g);
                  const gClass = g === 1 ? 'liquid-glass-btn-primary' : g === 2 ? 'liquid-glass-btn-emerald' : 'liquid-glass-btn-amber';
                  const gTextColor = g === 1 ? 'text-blue-900' : g === 2 ? 'text-emerald-900' : 'text-amber-900';
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGrinder(String(g))}
                      className={`relative px-3 py-1.5 rounded-full transition-colors duration-300 cursor-pointer whitespace-nowrap select-none ${
                        isSelected
                          ? `${gClass} ${gTextColor} font-extrabold`
                          : 'hover:text-black hover:bg-white/50 text-gray-700'
                      }`}
                    >
                      <span className="relative z-10">G{g}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-controls for Grinder Comparison Tab */}
          {activeChartTab === 'grinder_comparison' && (
            <div className="liquid-glass-track inline-flex items-center p-1 rounded-full text-xs font-semibold text-gray-700 shrink-0">
              {[
                { id: 'changes' as const, label: 'Total Changes', glassClass: 'liquid-glass-btn-primary', textColor: 'text-blue-900' },
                { id: 'total_time' as const, label: 'Total Time', glassClass: 'liquid-glass-btn-amber', textColor: 'text-amber-900' },
                { id: 'avg' as const, label: 'Avg Time', glassClass: 'liquid-glass-btn-emerald', textColor: 'text-emerald-900' },
              ].map(item => {
                const isSelected = comparisonMetric === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setComparisonMetric(item.id)}
                    className={`relative px-3.5 py-1.5 rounded-full transition-colors duration-300 cursor-pointer whitespace-nowrap select-none ${
                      isSelected
                        ? `${item.glassClass} ${item.textColor} font-extrabold`
                        : 'hover:text-black hover:bg-white/50 text-gray-700'
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* 2. Core KPI Cards: ONLY shown on Maintenance Time tab (removed on grinder comparison per request) */}
      {activeChartTab === 'duration' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-in fade-in duration-150">
          
          {/* Total Blade Changes */}
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {selectedGrinder === 'all' ? 'Total Blade Changes' : `Grinder ${selectedGrinder} Changes`}
              </span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-gray-900 font-mono tabular-nums">
                {stats.totalEvents}
              </span>
              <span className="text-xs text-gray-500 font-medium">changes</span>
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {selectedGrinder === 'all' ? 'Across all operating grinders' : `Filtered to Grinder ${selectedGrinder}`}
            </span>
          </div>

          {/* Total Maintenance Downtime */}
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {selectedGrinder === 'all' ? 'Total Time' : `G${selectedGrinder} Time`}
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600 font-mono tabular-nums">
                {stats.totalMinutes.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 font-medium">minutes</span>
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {(stats.totalMinutes / 60).toFixed(1)} total hours recorded
            </span>
          </div>

          {/* Average Service Duration */}
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Avg Time
              </span>
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
                {stats.avgMinutes}
              </span>
              <span className="text-xs text-gray-500 font-medium">min / change</span>
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              Average servicing speed per procedure
            </span>
          </div>

        </div>
      )}

      {/* 3. Main Chart Canvas */}
      <div className="bg-gray-50/50 rounded-xl p-4 sm:p-5 border border-gray-100">
        
        {/* Chart View 1: Maintenance Time (Stacked or Grouped) */}
        {activeChartTab === 'duration' && (
          <div>
            {/* Top-Right Interactive Click-to-Filter Color Legend */}
            <div className="flex items-center justify-end gap-1.5 flex-wrap mb-3">
              <span className="text-[11px] font-semibold text-gray-400 mr-1">Filter Series:</span>
              {[
                { id: 1, name: 'Grinder 1', bg: 'bg-blue-500', pillStyle: 'bg-blue-50/90 text-blue-900 border-blue-200/80 hover:bg-blue-100/80' },
                { id: 2, name: 'Grinder 2', bg: 'bg-emerald-500', pillStyle: 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100/80' },
                { id: 3, name: 'Grinder 3', bg: 'bg-amber-500', pillStyle: 'bg-amber-50/90 text-amber-900 border-amber-200/80 hover:bg-amber-100/80' },
              ].map(g => {
                const isHidden = hiddenGrinders.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGrinder(g.id)}
                    className={`liquid-glass-pill text-xs font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      isHidden ? 'opacity-40 grayscale line-through bg-gray-100 text-gray-400 border-gray-200/60' : `${g.pillStyle}`
                    }`}
                    title={`Click to ${isHidden ? 'show' : 'hide'} ${g.name}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${g.bg} shrink-0`} />
                    <span className="font-semibold">{g.name}</span>
                  </button>
                );
              })}
            </div>

            {timelineData.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-gray-400 text-xs italic">
                No maintenance records to display for this timeframe.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData} margin={{ top: 15, right: 15, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      interval="preserveStartEnd"
                      dy={8}
                      label={{ 
                        value: timeCadence === 'Daily' ? 'Servicing Date' : timeCadence === 'Weekly' ? 'Servicing Week' : 'Servicing Month', 
                        position: 'insideBottom', 
                        offset: -12, 
                        fill: '#64748b', 
                        fontSize: 11, 
                        fontWeight: 600 
                      }}
                    />
                    <YAxis 
                      width={70}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      unit="m"
                      dx={-4}
                      label={{ 
                        value: 'Maintenance Downtime (Minutes)', 
                        angle: -90, 
                        position: 'insideLeft', 
                        offset: 0, 
                        fill: '#64748b', 
                        fontSize: 11, 
                        fontWeight: 600, 
                        style: { textAnchor: 'middle' } 
                      }}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(203, 213, 225, 0.45)' }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const totalMins = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
                        return (
                          <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-3 shadow-xl text-xs">
                            <p className="font-bold text-gray-900 border-b border-gray-100 pb-1 mb-2">{label}</p>
                            <div className="space-y-1 font-mono">
                              {payload.map((entry: any) => (
                                <div key={entry.name} className="flex items-center justify-between gap-4">
                                  <span className="flex items-center gap-1.5 text-gray-600">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    {entry.name}:
                                  </span>
                                  <span className="font-bold text-gray-900">{entry.value} mins</span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between pt-1 border-t border-gray-100 font-bold text-gray-900">
                                <span>Total Time:</span>
                                <span className="text-amber-600">{totalMins} mins ({(totalMins / 60).toFixed(1)}h)</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar 
                      dataKey="g1Minutes" 
                      name="Grinder 1" 
                      fill="#3b82f6" 
                      hide={hiddenGrinders.includes(1)}
                      stackId={isStacked ? "a" : undefined} 
                      radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                    >
                      {showDataPoints && (
                        <LabelList 
                          dataKey="g1Minutes" 
                          position={isStacked ? "inside" : "top"} 
                          fill={isStacked ? "#ffffff" : "#1e40af"} 
                          fontSize={9} 
                          fontWeight={600}
                          formatter={(v: any) => Number(v) > 0 ? `${v}m` : ''} 
                        />
                      )}
                    </Bar>
                    <Bar 
                      dataKey="g2Minutes" 
                      name="Grinder 2" 
                      fill="#10b981" 
                      hide={hiddenGrinders.includes(2)}
                      stackId={isStacked ? "a" : undefined} 
                      radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                    >
                      {showDataPoints && (
                        <LabelList 
                          dataKey="g2Minutes" 
                          position={isStacked ? "inside" : "top"} 
                          fill={isStacked ? "#ffffff" : "#065f46"} 
                          fontSize={9} 
                          fontWeight={600}
                          formatter={(v: any) => Number(v) > 0 ? `${v}m` : ''} 
                        />
                      )}
                    </Bar>
                    <Bar 
                      dataKey="g3Minutes" 
                      name="Grinder 3" 
                      fill="#f59e0b" 
                      hide={hiddenGrinders.includes(3)}
                      stackId={isStacked ? "a" : undefined} 
                      radius={[4, 4, 0, 0]} 
                    >
                      {showDataPoints && (
                        <LabelList 
                          dataKey="g3Minutes" 
                          position={isStacked ? "inside" : "top"} 
                          fill={isStacked ? "#ffffff" : "#92400e"} 
                          fontSize={9} 
                          fontWeight={600}
                          formatter={(v: any) => Number(v) > 0 ? `${v}m` : ''} 
                        />
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Chart View 2: Refined & Clear Grinder Comparison */}
        {activeChartTab === 'grinder_comparison' && (
          <div>
            {/* Top-Right Interactive Click-to-Filter Color Legend */}
            <div className="flex items-center justify-end gap-1.5 flex-wrap mb-3">
              <span className="text-[11px] font-semibold text-gray-400 mr-1">Filter Series:</span>
              {[
                { id: 1, name: 'Grinder 1', bg: 'bg-blue-500', pillStyle: 'bg-blue-50/90 text-blue-900 border-blue-200/80 hover:bg-blue-100/80' },
                { id: 2, name: 'Grinder 2', bg: 'bg-emerald-500', pillStyle: 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100/80' },
                { id: 3, name: 'Grinder 3', bg: 'bg-amber-500', pillStyle: 'bg-amber-50/90 text-amber-900 border-amber-200/80 hover:bg-amber-100/80' },
              ].map(g => {
                const isHidden = hiddenGrinders.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGrinder(g.id)}
                    className={`liquid-glass-pill text-xs font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                      isHidden ? 'opacity-40 grayscale line-through bg-gray-100 text-gray-400 border-gray-200/60' : `${g.pillStyle}`
                    }`}
                    title={`Click to ${isHidden ? 'show' : 'hide'} ${g.name}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${g.bg} shrink-0`} />
                    <span className="font-semibold">{g.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Clear, High-Contrast Single-Metric Comparison Bar Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayGrinderComparison} margin={{ top: 20, right: 15, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="grinder" 
                    tick={{ fontSize: 13, fill: '#334155', fontWeight: 600 }} 
                    dy={8} 
                    label={{ 
                      value: 'Grinder Equipment', 
                      position: 'insideBottom', 
                      offset: -12, 
                      fill: '#64748b', 
                      fontSize: 11, 
                      fontWeight: 600 
                    }}
                  />
                  <YAxis 
                    width={70}
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    unit={comparisonMetric === 'total_time' || comparisonMetric === 'avg' ? 'm' : ''} 
                    label={{ 
                      value: comparisonMetric === 'changes' ? 'Total Changes (Events)' : comparisonMetric === 'total_time' ? 'Total Servicing Time (Minutes)' : 'Average Servicing Time (Minutes)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      offset: 0, 
                      fill: '#64748b', 
                      fontSize: 11, 
                      fontWeight: 600, 
                      style: { textAnchor: 'middle' } 
                    }}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(203, 213, 225, 0.45)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-3.5 shadow-xl text-xs space-y-2 font-mono">
                          <p className="font-bold text-gray-900 font-sans border-b border-gray-100 pb-1 text-sm">{label}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-6">
                              <span className="text-gray-500 font-sans">Total Changes:</span>
                              <span className="font-bold text-blue-600">{d.events} changes</span>
                            </div>
                            <div className="flex justify-between gap-6">
                              <span className="text-gray-500 font-sans">Total Time:</span>
                              <span className="font-bold text-amber-600">{d.totalMinutes} mins ({(d.totalMinutes / 60).toFixed(1)}h)</span>
                            </div>
                            <div className="flex justify-between gap-6">
                              <span className="text-gray-500 font-sans">Avg Time:</span>
                              <span className="font-bold text-emerald-700">{d.avgMinutes} mins</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-100 space-y-1">
                            <p className="text-[11px] font-sans font-semibold text-gray-700 uppercase tracking-wider">Workload Shares</p>
                            <div className="flex justify-between gap-6 text-[11px]">
                              <span className="text-gray-500 font-sans">Change Share:</span>
                              <span className="font-bold text-blue-600">{d.changeShare}%</span>
                            </div>
                            <div className="flex justify-between gap-6 text-[11px]">
                              <span className="text-gray-500 font-sans">Total Time Share:</span>
                              <span className="font-bold text-amber-600">{d.timeShare}%</span>
                            </div>
                            <div className="flex justify-between gap-6 text-[11px]">
                              <span className="text-gray-500 font-sans">Avg Time Share:</span>
                              <span className="font-bold text-emerald-700">{d.avgShare}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="metricValue" name="Value" radius={[6, 6, 0, 0]}>
                    {displayGrinderComparison.map(entry => (
                      <Cell key={entry.grinder} fill={GRINDER_COLORS[entry.grinderNum] || '#3b82f6'} />
                    ))}
                    {showDataPoints && (
                      <LabelList
                        dataKey="metricValue"
                        position="top"
                        fill="#0f172a"
                        fontSize={11}
                        fontWeight={700}
                        formatter={(val: any) => comparisonMetric === 'changes' ? `${val}` : `${val}m`}
                      />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Clear Side-by-Side Machine Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-200/80 mt-4">
              {displayGrinderComparison.map(d => {
                const accentColor = GRINDER_COLORS[d.grinderNum] || '#3b82f6';
                return (
                  <div key={d.grinderNum} className="bg-white rounded-xl p-3.5 border border-gray-200/70 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                        {d.grinder}
                      </span>
                    </div>

                    {/* 3 Core Metrics: Total Changes first, Total Time second, Avg Time third */}
                    <div className="grid grid-cols-3 gap-1 pt-1.5 pb-2 text-center text-xs border-t border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-semibold">Total Changes</span>
                        <span className="font-mono font-bold text-gray-800 text-sm">{d.events}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-semibold">Total Time</span>
                        <span className="font-mono font-bold text-amber-600 text-sm">{d.totalMinutes}m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase font-semibold">Avg Time</span>
                        <span className="font-mono font-bold text-emerald-700 text-sm">{d.avgMinutes}m</span>
                      </div>
                    </div>

                    {/* Separated Workload Shares */}
                    <div className="pt-2 border-t border-gray-100/90 text-[10px] space-y-1">
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Change Share</span>
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{d.changeShare}%</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Total Time Share</span>
                        <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{d.timeShare}%</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Avg Time Share</span>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{d.avgShare}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Bottom Controls Bar: Data Points & Stacked/Grouped relocated to bottom right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-400 font-medium">
          {activeChartTab === 'duration' 
            ? 'Cumulative servicing downtime minutes across operating grinders' 
            : 'Comparative performance and workload distribution by grinder'}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Stacked vs Grouped Toggle Button (only on duration tab) in Liquid Glass */}
          {activeChartTab === 'duration' && (
            <button
              type="button"
              onClick={() => setIsStacked(!isStacked)}
              className={`text-xs font-extrabold px-3.5 py-1.5 rounded-full cursor-pointer transition-all border shadow-2xs active:scale-95 whitespace-nowrap select-none ${
                isStacked 
                  ? 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-900 border-indigo-400/40 backdrop-blur-md shadow-xs' 
                  : 'bg-white/70 hover:bg-white/90 text-slate-700 border-slate-200/80 backdrop-blur-md'
              }`}
              title="Toggle stacked vs grouped bars"
            >
              {isStacked ? 'Stack: On' : 'Grouped'}
            </button>
          )}

          {/* Data Points Display Toggle Button in Liquid Glass */}
          <button
            type="button"
            onClick={() => setShowDataPoints(!showDataPoints)}
            className={`text-xs font-extrabold px-4 py-1.5 rounded-full transition-all cursor-pointer border shadow-2xs active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0 select-none ${
              showDataPoints 
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-900 border-emerald-400/40 backdrop-blur-md shadow-xs' 
                : 'bg-white/70 hover:bg-white/90 text-slate-700 border-slate-200/80 backdrop-blur-md'
            }`}
            title="Toggle data points display on chart bars"
          >
            <span className={`w-2 h-2 rounded-full ${showDataPoints ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span>Data Points: {showDataPoints ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LabelList
} from 'recharts';
import { CleanShiftReport } from '../types';
import { BarChart3, TrendingUp, Clock, Scale, Layers } from 'lucide-react';
import { calculateFlakeYieldPercentage } from '../utils/metrics';

type ViewOption = 'Daily' | 'Weekly' | 'Monthly';
type ChartTab = 'output' | 'input_flake' | 'downtime' | 'yield';

const SHIFT_COLORS: Record<string, string> = {
  'Shift 1': '#3b82f6', // Sapphire Blue
  'Shift 2': '#10b981', // Emerald Green
  'Shift 3': '#f59e0b', // Amber Orange
  'Total': '#64748b'    // Slate
};

function useAggregatedData(reports: CleanShiftReport[], getValue: (r: CleanShiftReport) => number, view: ViewOption) {
  return useMemo(() => {
    const agg: Record<string, any> = {};
    
    reports.forEach(r => {
      let d = r.report_date;
      if (view === 'Weekly') d = r.weekLabel;
      if (view === 'Monthly') d = r.monthLabel;
      
      if (!d) return;
      if (!agg[d]) {
        agg[d] = {
          date: d,
          sortKey: r.report_date || d,
          total: 0,
          '1': 0,
          '2': 0,
          '3': 0
        };
      }
      
      const val = getValue(r);
      const s = r.shift ? String(r.shift).replace(/shift\s*/i, '').trim() : '1';
      if (agg[d][s] !== undefined) {
        agg[d][s] += val;
      } else {
        agg[d][s] = val;
      }
      agg[d].total += val;
    });
    
    const chartData = Object.values(agg)
      .map(item => ({
        date: item.date,
        sortKey: item.sortKey,
        Total: Number(item.total.toFixed(2)),
        'Shift 1': Number((item['1'] || 0).toFixed(2)),
        'Shift 2': Number((item['2'] || 0).toFixed(2)),
        'Shift 3': Number((item['3'] || 0).toFixed(2)),
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return {
      data: chartData,
      shifts: ['Shift 1', 'Shift 2', 'Shift 3']
    };
  }, [reports, getValue, view]);
}

// Custom Tooltip component for crisp presentation
function CustomChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload || !payload.length) return null;

  const total = payload.reduce((sum: number, p: any) => sum + (Number(p.value) || 0), 0);

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3.5 shadow-xl text-xs min-w-[180px]">
      <p className="font-bold text-gray-900 border-b border-gray-100 pb-1.5 mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => {
          const val = Number(entry.value) || 0;
          const pct = total > 0 ? ((val / total) * 100).toFixed(0) : '0';
          return (
            <div key={entry.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="font-bold text-gray-900">{val.toLocaleString()} {unit}</span>
                {payload.length > 1 && total > 0 && (
                  <span className="text-[10px] text-gray-400">({pct}%)</span>
                )}
              </div>
            </div>
          );
        })}
        {payload.length > 1 && (
          <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-gray-100 font-bold text-gray-900">
            <span>Period Total</span>
            <span className="font-mono text-emerald-700">{total.toLocaleString()} {unit}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductionChartsSection({ reports }: { reports: CleanShiftReport[] }) {
  const [activeTab, setActiveTab] = useState<ChartTab>('output');
  const [view, setView] = useState<ViewOption>('Daily');
  const [isStacked, setIsStacked] = useState<boolean>(true);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const [showDataPoints, setShowDataPoints] = useState<boolean>(false);

  const toggleSeriesKey = (seriesKey: string) => {
    setHiddenSeries(prev => prev.includes(seriesKey) ? prev.filter(s => s !== seriesKey) : [...prev, seriesKey]);
  };

  const currentLegendItems = useMemo(() => {
    if (activeTab === 'output') {
      return [
        { key: 'Shift 1', label: 'Shift 1', color: SHIFT_COLORS['Shift 1'], pillClass: 'bg-blue-50/90 text-blue-900 border-blue-200/80 hover:bg-blue-100/80' },
        { key: 'Shift 2', label: 'Shift 2', color: SHIFT_COLORS['Shift 2'], pillClass: 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100/80' },
        { key: 'Shift 3', label: 'Shift 3', color: SHIFT_COLORS['Shift 3'], pillClass: 'bg-amber-50/90 text-amber-900 border-amber-200/80 hover:bg-amber-100/80' },
      ];
    }
    if (activeTab === 'input_flake') {
      return [
        { key: 'Input Bale Wt', label: 'Input Bale Wt', color: '#3b82f6', pillClass: 'bg-blue-50/90 text-blue-900 border-blue-200/80 hover:bg-blue-100/80' },
        { key: 'Output Flake Wt', label: 'Output Flake Wt', color: '#10b981', pillClass: 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100/80' },
      ];
    }
    if (activeTab === 'downtime') {
      return [
        { key: 'Shift 1', label: 'Shift 1', color: '#f59e0b', pillClass: 'bg-amber-50/90 text-amber-900 border-amber-200/80 hover:bg-amber-100/80' },
        { key: 'Shift 2', label: 'Shift 2', color: '#ef4444', pillClass: 'bg-rose-50/90 text-rose-900 border-rose-200/80 hover:bg-rose-100/80' },
        { key: 'Shift 3', label: 'Shift 3', color: '#8b5cf6', pillClass: 'bg-purple-50/90 text-purple-900 border-purple-200/80 hover:bg-purple-100/80' },
      ];
    }
    return [
      { key: 'Yield Rate (%)', label: 'Flake Recovery (%)', color: '#4f7c5e', pillClass: 'bg-emerald-50/90 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100/80' },
    ];
  }, [activeTab]);

  // Data sets
  const outputData = useAggregatedData(reports, r => r.output_metric_tons || 0, view);
  const downtimeData = useAggregatedData(reports, r => r.total_downtime_computed_minutes || 0, view);

  // Flake Yield & Comparison data
  const comparisonData = useMemo(() => {
    const dailyAgg: Record<string, {
      date: string;
      weekLabel: string;
      monthLabel: string;
      inputWeight: number;
      flakeWeight: number;
      outputMT: number;
    }> = {};
    reports.forEach(r => {
      if (!r.report_date) return;
      if (!dailyAgg[r.report_date]) {
        dailyAgg[r.report_date] = {
          date: r.report_date,
          weekLabel: r.weekLabel,
          monthLabel: r.monthLabel,
          inputWeight: 0,
          flakeWeight: 0,
          outputMT: 0,
        };
      }
      dailyAgg[r.report_date].inputWeight += r.total_input_bale_weight || 0;
      dailyAgg[r.report_date].flakeWeight += r.total_output_flake_weight || 0;
      dailyAgg[r.report_date].outputMT += r.output_metric_tons || 0;
    });

    const periods: Record<string, {
      date: string;
      sortKey: string;
      inputWeight: number;
      flakeWeight: number;
      outputMT: number;
    }> = {};

    Object.values(dailyAgg).forEach(day => {
      const period = view === 'Weekly'
        ? day.weekLabel || day.date
        : view === 'Monthly'
          ? day.monthLabel || day.date
          : day.date;
      if (!periods[period]) {
        periods[period] = {
          date: period,
          sortKey: day.date,
          inputWeight: 0,
          flakeWeight: 0,
          outputMT: 0,
        };
      }
      const bucket = periods[period];
      bucket.inputWeight += day.inputWeight;
      bucket.flakeWeight += day.flakeWeight;
      bucket.outputMT += day.outputMT;
    });

    return Object.values(periods)
      .map(item => {
        const yieldVal = calculateFlakeYieldPercentage(item.outputMT, item.inputWeight);
        return {
          date: item.date,
          sortKey: item.sortKey,
          'Input Bale Wt': Math.round(item.inputWeight),
          'Output Flake Wt': Math.round(item.flakeWeight),
          'Yield Rate (%)': Number(yieldVal.toFixed(1))
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [reports, view]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-6">
      {/* Chart Navigation Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#4f7c5e]" />
            Production Analytics & Trends
          </h2>
        </div>

        {/* Controls Toolbar with Liquid Glass Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chart Tab Navigation */}
          <div className="liquid-glass-track inline-flex p-1 rounded-full text-xs font-semibold text-gray-700">
            {[
              { id: 'output' as const, label: 'Output (MT)', icon: TrendingUp, iconColor: 'text-emerald-700', glassClass: 'liquid-glass-btn-forest', textColor: 'text-[#004d25]' },
              { id: 'input_flake' as const, label: 'Input vs Flake', icon: Scale, iconColor: 'text-blue-700', glassClass: 'liquid-glass-btn-primary', textColor: 'text-blue-900' },
              { id: 'downtime' as const, label: 'Downtime', icon: Clock, iconColor: 'text-amber-700', glassClass: 'liquid-glass-btn-amber', textColor: 'text-amber-900' },
              { id: 'yield' as const, label: 'Yield (%)', icon: Layers, iconColor: 'text-purple-700', glassClass: 'liquid-glass-btn-purple', textColor: 'text-purple-900' },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 py-1.5 rounded-full transition-colors duration-300 cursor-pointer flex items-center gap-1.5 select-none ${
                    isSelected ? `${tab.glassClass} ${tab.textColor} font-extrabold` : 'hover:text-black hover:bg-white/50 text-gray-700'
                  }`}
                >
                  <Icon className={`relative z-10 w-3.5 h-3.5 ${isSelected ? tab.textColor : tab.iconColor}`} />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Standardized Time Granularity Buttons: Daily / Weekly / Monthly in Liquid Glass */}
          <div className="liquid-glass-track inline-flex items-center p-1 rounded-full text-xs font-semibold text-gray-700 shrink-0">
            {(['Daily', 'Weekly', 'Monthly'] as const).map(option => {
              const isSelected = view === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`relative px-3.5 py-1.5 rounded-full transition-colors duration-300 cursor-pointer whitespace-nowrap select-none ${
                    isSelected
                      ? 'liquid-glass-btn-dark text-slate-900 font-extrabold'
                      : 'hover:text-black hover:bg-white/50 text-gray-700'
                  }`}
                >
                  <span className="relative z-10">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top-Right Interactive Color Code Legend with Click-to-Filter Functionality */}
      {activeTab !== 'yield' && (
        <div className="flex items-center justify-end gap-2 mb-3 flex-wrap">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Filter Series:</span>
          {currentLegendItems.map(item => {
            const isHidden = hiddenSeries.includes(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleSeriesKey(item.key)}
                className={`liquid-glass-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                  isHidden 
                    ? 'opacity-40 grayscale line-through bg-gray-100 text-gray-400 border-gray-200/60' 
                    : `${item.pillClass} shadow-2xs`
                }`}
                title={`Click to ${isHidden ? 'show' : 'hide'} ${item.label}`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Chart Rendering Canvas */}
      <div className="bg-gray-50/50 rounded-xl p-4 sm:p-5 border border-gray-100">
        <div className="h-[380px] w-full">
        {activeTab === 'output' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={outputData.data}
              margin={{ top: 15, right: 15, left: 20, bottom: 25 }}
              barCategoryGap={isStacked ? "25%" : "15%"}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: view === 'Daily' ? 'Production Date' : view === 'Weekly' ? 'Production Week' : 'Production Month', 
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
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: 'Output (Metric Tons - MT)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 0, 
                  fill: '#64748b', 
                  fontSize: 11, 
                  fontWeight: 600, 
                  style: { textAnchor: 'middle' } 
                }}
              />
              <RechartsTooltip content={<CustomChartTooltip unit="MT" />} cursor={{ fill: 'rgba(203, 213, 225, 0.45)' }} />
              {outputData.shifts.map((s) => (
                <Bar
                  key={s}
                  dataKey={s}
                  stackId={isStacked ? "a" : undefined}
                  fill={SHIFT_COLORS[s] || '#94a3b8'}
                  maxBarSize={44}
                  hide={hiddenSeries.includes(s)}
                  radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                >
                  {showDataPoints && !hiddenSeries.includes(s) && (
                    <LabelList 
                      position={isStacked ? "center" : "top"} 
                      fill={isStacked ? "#ffffff" : "#475569"} 
                      fontSize={9} 
                      fontWeight={600} 
                      formatter={(val: any) => Number(val) > 0 ? Number(val).toFixed(1) : ''} 
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'input_flake' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 20, right: 15, left: 25, bottom: 25 }}
              barCategoryGap="20%"
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: view === 'Daily' ? 'Production Date' : view === 'Weekly' ? 'Production Week' : 'Production Month', 
                  position: 'insideBottom', 
                  offset: -12, 
                  fill: '#64748b', 
                  fontSize: 11, 
                  fontWeight: 600 
                }}
              />
              <YAxis
                width={76}
                tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: 'Raw Bale Input vs Flake Output (lbs)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 0, 
                  fill: '#64748b', 
                  fontSize: 11, 
                  fontWeight: 600, 
                  style: { textAnchor: 'middle' } 
                }}
              />
              <RechartsTooltip content={<CustomChartTooltip unit="lbs" />} cursor={{ fill: 'rgba(203, 213, 225, 0.45)' }} />
              <Bar dataKey="Input Bale Wt" fill="#3b82f6" maxBarSize={40} radius={[4, 4, 0, 0]} hide={hiddenSeries.includes('Input Bale Wt')}>
                {showDataPoints && !hiddenSeries.includes('Input Bale Wt') && (
                  <LabelList 
                    position="top" 
                    fill="#2563eb" 
                    fontSize={9} 
                    fontWeight={600} 
                    formatter={(val: any) => Number(val) > 0 ? (Number(val) >= 1000 ? `${(Number(val)/1000).toFixed(0)}k` : String(val)) : ''} 
                  />
                )}
              </Bar>
              <Bar dataKey="Output Flake Wt" fill="#10b981" maxBarSize={40} radius={[4, 4, 0, 0]} hide={hiddenSeries.includes('Output Flake Wt')}>
                {showDataPoints && !hiddenSeries.includes('Output Flake Wt') && (
                  <LabelList 
                    position="top" 
                    fill="#059669" 
                    fontSize={9} 
                    fontWeight={600} 
                    formatter={(val: any) => Number(val) > 0 ? (Number(val) >= 1000 ? `${(Number(val)/1000).toFixed(0)}k` : String(val)) : ''} 
                  />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'downtime' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={downtimeData.data}
              margin={{ top: 20, right: 15, left: 20, bottom: 25 }}
              barCategoryGap={isStacked ? "25%" : "15%"}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: view === 'Daily' ? 'Production Date' : view === 'Weekly' ? 'Production Week' : 'Production Month', 
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
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: 'Downtime Duration (Minutes)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 0, 
                  fill: '#64748b', 
                  fontSize: 11, 
                  fontWeight: 600, 
                  style: { textAnchor: 'middle' } 
                }}
              />
              <RechartsTooltip content={<CustomChartTooltip unit="mins" />} cursor={{ fill: 'rgba(203, 213, 225, 0.45)' }} />
              {downtimeData.shifts.map((s) => (
                <Bar
                  key={s}
                  dataKey={s}
                  stackId={isStacked ? "a" : undefined}
                  fill={s === 'Shift 1' ? '#f59e0b' : s === 'Shift 2' ? '#ef4444' : '#8b5cf6'}
                  maxBarSize={44}
                  hide={hiddenSeries.includes(s)}
                  radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                >
                  {showDataPoints && !hiddenSeries.includes(s) && (
                    <LabelList 
                      position={isStacked ? "center" : "top"} 
                      fill={isStacked ? "#ffffff" : "#475569"} 
                      fontSize={9} 
                      fontWeight={600} 
                      formatter={(val: any) => Number(val) > 0 ? `${val}m` : ''} 
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'yield' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={comparisonData}
              margin={{ top: 20, right: 15, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: view === 'Daily' ? 'Production Date' : view === 'Weekly' ? 'Production Week' : 'Production Month', 
                  position: 'insideBottom', 
                  offset: -12, 
                  fill: '#64748b', 
                  fontSize: 11, 
                  fontWeight: 600 
                }}
              />
              <YAxis
                width={70}
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: 'Flake Recovery Yield (%)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: 0, 
                  fill: '#64748b', 
                  fontSize: 11, 
                  fontWeight: 600, 
                  style: { textAnchor: 'middle' } 
                }}
              />
              <RechartsTooltip content={<CustomChartTooltip unit="%" />} />
              <Line
                type="monotone"
                dataKey="Yield Rate (%)"
                stroke="#4f7c5e"
                strokeWidth={3}
                hide={hiddenSeries.includes('Yield Rate (%)')}
                dot={showDataPoints ? { r: 4.5, fill: '#4f7c5e', strokeWidth: 2, stroke: '#ffffff' } : { r: 3, fill: '#4f7c5e' }}
                activeDot={{ r: 6 }}
              >
                {showDataPoints && !hiddenSeries.includes('Yield Rate (%)') && (
                  <LabelList 
                    position="top" 
                    fill="#2d4a37" 
                    fontSize={10} 
                    fontWeight={700} 
                    offset={8}
                    formatter={(val: any) => Number(val) > 0 ? `${Number(val).toFixed(1)}%` : ''} 
                  />
                )}
              </Line>
            </LineChart>
          </ResponsiveContainer>
        )}
        </div>
      </div>

      {/* Bottom Controls Bar: Relocated Data Points & Grouped/Stack to bottom right in Liquid Glass */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-4">
        <div className="text-xs text-gray-400 font-medium">
          {activeTab === 'output' && 'Total & Shift-by-Shift PET Flake Output Volume'}
          {activeTab === 'input_flake' && 'Total Bale Input vs Produced Flake Weight'}
          {activeTab === 'downtime' && 'Total Unplanned & Planned Line Downtime Duration'}
          {activeTab === 'yield' && 'Material Conversion Yield Percentage'}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Stacked vs Grouped Toggle in Liquid Glass (for shift charts) */}
          {activeTab !== 'yield' && activeTab !== 'input_flake' && (
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
            title="Toggle display of data point labels on the chart"
          >
            <span className={`w-2 h-2 rounded-full ${showDataPoints ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span>Data Points: {showDataPoints ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Standalone backward compatibility wrappers
export function OutputChart({ reports }: { reports: CleanShiftReport[] }) {
  return <ProductionChartsSection reports={reports} />;
}

export function DowntimeChart({ reports }: { reports: CleanShiftReport[] }) {
  return null; // Integrated into ProductionChartsSection
}

export function InputBaleWeightChart({ reports }: { reports: CleanShiftReport[] }) {
  return null; // Integrated into ProductionChartsSection
}

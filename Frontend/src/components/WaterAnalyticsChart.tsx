import React, { useState, useMemo } from 'react';
import { parseISO, format, isValid } from 'date-fns';
import { CleanWaterUsage, CleanShiftReport } from '../types';
import { Droplets, Gauge, Percent } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, LabelList 
} from 'recharts';

interface WaterAnalyticsChartProps {
  waterUsage: CleanWaterUsage[];
  reports?: CleanShiftReport[];
}

type ViewCadence = 'Daily' | 'Weekly' | 'Monthly';
type ViewMetric = 'usage' | 'gpm' | 'retention_rate';

export function WaterAnalyticsChart({ waterUsage, reports = [] }: WaterAnalyticsChartProps) {
  const [metricView, setMetricView] = useState<ViewMetric>('usage');
  const [viewCadence, setViewCadence] = useState<ViewCadence>('Daily');
  const [isStacked, setIsStacked] = useState<boolean>(false);
  const [showDataPoints, setShowDataPoints] = useState<boolean>(false);
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);

  const toggleSeries = (seriesKey: string) => {
    setHiddenSeries(prev => 
      prev.includes(seriesKey) ? prev.filter(x => x !== seriesKey) : [...prev, seriesKey]
    );
  };

  // Aggregated data timeline for Daily, Weekly, Monthly views
  const timelineData = useMemo(() => {
    const agg: Record<string, {
      date: string;
      sortKey: string;
      purplePipeGal: number;
      wastewaterGal: number;
      netGal: number;
      purplePipeGpmSum: number;
      purpleCount: number;
      wastewaterGpmSum: number;
      wastewaterCount: number;
    }> = {};

    waterUsage.forEach(w => {
      let key = w.report_date || 'Unknown';
      let sortKey = w.report_date || 'Unknown';

      if (viewCadence === 'Weekly') {
        key = w.weekLabel || 'Unknown';
        sortKey = w.report_date || w.weekLabel || 'Unknown';
      } else if (viewCadence === 'Monthly' && w.report_date) {
        try {
          const d = parseISO(w.report_date);
          if (isValid(d)) {
            key = format(d, 'MMM yyyy');
            sortKey = format(d, 'yyyy-MM');
          }
        } catch (e) {}
      }

      if (!agg[key]) {
        agg[key] = {
          date: key,
          sortKey,
          purplePipeGal: 0,
          wastewaterGal: 0,
          netGal: 0,
          purplePipeGpmSum: 0,
          purpleCount: 0,
          wastewaterGpmSum: 0,
          wastewaterCount: 0,
        };
      }

      const pGal = w.purple_pipe_usage || 0;
      const wGal = w.wastewater_usage || 0;
      const pGpm = w.purple_pipe_gpm || 0;
      const wGpm = w.wastewater_gpm || 0;

      agg[key].purplePipeGal += pGal;
      agg[key].wastewaterGal += wGal;
      agg[key].netGal += (pGal - wGal);

      if (pGpm > 0) {
        agg[key].purplePipeGpmSum += pGpm;
        agg[key].purpleCount += 1;
      }
      if (wGpm > 0) {
        agg[key].wastewaterGpmSum += wGpm;
        agg[key].wastewaterCount += 1;
      }
    });

    return Object.values(agg)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(d => {
        const retentionRate = d.purplePipeGal > 0 ? ((d.netGal / d.purplePipeGal) * 100) : 0;
        const avgPurpleGpm = d.purpleCount > 0 ? d.purplePipeGpmSum / d.purpleCount : 0;
        const avgWastewaterGpm = d.wastewaterCount > 0 ? d.wastewaterGpmSum / d.wastewaterCount : 0;
        const retainedGpm = Math.max(0, avgPurpleGpm - avgWastewaterGpm);

        return {
          date: d.date,
          purplePipe: d.purplePipeGal,
          wastewater: d.wastewaterGal,
          netBalance: d.netGal > 0 ? d.netGal : 0,
          retentionRate: parseFloat(Math.max(0, retentionRate).toFixed(1)),
          purplePipeGpm: parseFloat(avgPurpleGpm.toFixed(2)),
          wastewaterGpm: parseFloat(avgWastewaterGpm.toFixed(2)),
          retainedGpm: parseFloat(retainedGpm.toFixed(2)),
        };
      });
  }, [waterUsage, viewCadence]);

  const seriesConfig = useMemo(() => {
    if (metricView === 'gpm') {
      return [
        { key: 'purplePipeGpm', label: 'Purple Pipe Supply (GPM)', color: '#4f46e5', lightBg: 'bg-indigo-50/80', border: 'border-indigo-200' },
        { key: 'wastewaterGpm', label: 'Wastewater Discharge (GPM)', color: '#2563eb', lightBg: 'bg-blue-50/80', border: 'border-blue-200' },
        { key: 'retainedGpm', label: 'Process Water Retained (GPM)', color: '#10b981', lightBg: 'bg-emerald-50/80', border: 'border-emerald-200' },
      ];
    } else if (metricView === 'retention_rate') {
      return [
        { key: 'retentionRate', label: 'Retention Rate (%)', color: '#10b981', lightBg: 'bg-emerald-50/80', border: 'border-emerald-200' },
      ];
    } else {
      return [
        { key: 'purplePipe', label: 'Purple Pipe Supply', color: '#4f46e5', lightBg: 'bg-indigo-50/80', border: 'border-indigo-200' },
        { key: 'wastewater', label: 'Wastewater Discharge', color: '#2563eb', lightBg: 'bg-blue-50/80', border: 'border-blue-200' },
        { key: 'netBalance', label: 'Process Water Retained', color: '#10b981', lightBg: 'bg-emerald-50/80', border: 'border-emerald-200' },
      ];
    }
  }, [metricView]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-indigo-600" />
            Water Usage & Wastewater Analysis: {metricView === 'usage' ? 'Usage (Gallons)' : metricView === 'gpm' ? 'Flow Rates (GPM)' : 'Retention Rate (%)'}
          </h3>
        </div>

        {/* Controls: Usage vs GPM vs Retention Rate + Cadence buttons */}
        <div className="flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar">
          {/* Toggle Metric View */}
          <div className="liquid-glass-track inline-flex items-center p-1 rounded-full text-xs font-semibold text-gray-700 shrink-0">
            {[
              { id: 'usage' as const, label: 'Supply (Gal)', icon: Droplets, iconColor: 'text-indigo-600', glassClass: 'liquid-glass-btn-indigo', textColor: 'text-indigo-900' },
              { id: 'gpm' as const, label: 'Flow Rate (GPM)', icon: Gauge, iconColor: 'text-blue-600', glassClass: 'liquid-glass-btn-primary', textColor: 'text-blue-900' },
              { id: 'retention_rate' as const, label: 'Retention Rate', icon: Percent, iconColor: 'text-emerald-600', glassClass: 'liquid-glass-btn-emerald', textColor: 'text-emerald-900' },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = metricView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMetricView(item.id)}
                  className={`relative px-3.5 py-1.5 rounded-full transition-colors duration-300 cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none ${
                    isSelected 
                      ? `${item.glassClass} ${item.textColor} font-extrabold` 
                      : 'hover:text-black hover:bg-white/50 text-gray-700'
                  }`}
                >
                  <Icon className={`relative z-10 w-3.5 h-3.5 ${item.iconColor}`} />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Standardized Cadence Buttons (By Line filter removed as requested) */}
          <div className="liquid-glass-track inline-flex items-center p-1 rounded-full text-xs font-semibold text-gray-700 shrink-0">
            {(['Daily', 'Weekly', 'Monthly'] as const).map(option => {
              const isSelected = viewCadence === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setViewCadence(option)}
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

      {/* Interactive Click-to-Filter Series Buttons */}
      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 pb-1 pt-1">
        <span className="text-[11px] font-semibold text-gray-400 mr-1">Filter Series:</span>
        {seriesConfig.map(s => {
          const isHidden = hiddenSeries.includes(s.key);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSeries(s.key)}
              className={`liquid-glass-pill text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 border ${
                isHidden 
                  ? 'opacity-40 grayscale line-through bg-gray-100 text-gray-400 border-gray-200/60' 
                  : `${s.lightBg} ${s.border} text-slate-900 font-extrabold shadow-2xs hover:scale-102`
              }`}
              title={`Click to ${isHidden ? 'show' : 'hide'} ${s.label}`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: s.color }} />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chart Canvas */}
      <div className="bg-gray-50/50 rounded-xl p-4 sm:p-5 border border-gray-100">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={timelineData} 
              margin={{ top: 15, right: 15, left: 25, bottom: 25 }}
              barCategoryGap={isStacked ? "25%" : "20%"}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                dy={8}
                interval="preserveStartEnd"
                label={{ 
                  value: viewCadence === 'Daily' ? 'Production Date' : viewCadence === 'Weekly' ? 'Production Week' : 'Production Month', 
                  position: 'insideBottom', 
                  offset: -12, 
                  fill: '#64748b', 
                  fontSize: 11, 
                  fontWeight: 600 
                }}
              />
              <YAxis 
                width={76}
                tick={{ fontSize: 11, fill: '#64748b' }}
                allowDecimals={false}
                domain={metricView === 'retention_rate' ? [0, 100] : undefined}
                tickFormatter={
                  metricView === 'retention_rate'
                    ? (val) => `${val}%`
                    : metricView === 'gpm'
                    ? (val) => `${val}`
                    : (val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)
                }
                dx={-4}
                label={{ 
                  value: metricView === 'retention_rate' ? 'Retention Rate (%)' : metricView === 'gpm' ? 'Flow Rate (GPM)' : 'Water Usage (Gallons)', 
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
                  const item = payload[0]?.payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-3 shadow-xl text-xs space-y-1 font-mono min-w-[220px]">
                      <p className="font-bold text-gray-900 font-sans border-b border-gray-100 pb-1 flex items-center justify-between">
                        <span>{label}</span>
                        {item && item.retentionRate !== undefined && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Retention: {item.retentionRate}%
                          </span>
                        )}
                      </p>
                      <div className="space-y-1.5 pt-1">
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-gray-600 font-sans">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              {entry.name}:
                            </span>
                            <span className="font-bold text-gray-900">
                              {metricView === 'retention_rate'
                                ? `${Number(entry.value).toFixed(1)}%`
                                : metricView === 'gpm'
                                ? `${Number(entry.value).toFixed(2)} GPM`
                                : `${Number(entry.value).toLocaleString()} gal`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />

              {/* Usage Mode Bars */}
              {metricView === 'usage' && (
                <>
                  <Bar
                    dataKey="purplePipe"
                    name="Purple Pipe Supply"
                    hide={hiddenSeries.includes('purplePipe')}
                    stackId={isStacked ? 'a' : undefined}
                    fill="#4f46e5"
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  >
                    {showDataPoints && (
                      <LabelList
                        dataKey="purplePipe"
                        position={isStacked ? 'center' : 'top'}
                        fill={isStacked ? '#ffffff' : '#1e293b'}
                        fontSize={9}
                        fontWeight={700}
                        formatter={(val: any) => {
                          const num = Number(val) || 0;
                          if (num === 0) return '';
                          return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : `${num}`;
                        }}
                      />
                    )}
                  </Bar>
                  <Bar
                    dataKey="wastewater"
                    name="Wastewater Discharge"
                    hide={hiddenSeries.includes('wastewater')}
                    stackId={isStacked ? 'a' : undefined}
                    fill="#2563eb"
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  >
                    {showDataPoints && (
                      <LabelList
                        dataKey="wastewater"
                        position={isStacked ? 'center' : 'top'}
                        fill={isStacked ? '#ffffff' : '#1e293b'}
                        fontSize={9}
                        fontWeight={700}
                        formatter={(val: any) => {
                          const num = Number(val) || 0;
                          if (num === 0) return '';
                          return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : `${num}`;
                        }}
                      />
                    )}
                  </Bar>
                  <Bar
                    dataKey="netBalance"
                    name="Process Water Retained"
                    hide={hiddenSeries.includes('netBalance')}
                    stackId={isStacked ? 'a' : undefined}
                    fill="#10b981"
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  >
                    {showDataPoints && (
                      <LabelList
                        dataKey="netBalance"
                        position={isStacked ? 'center' : 'top'}
                        fill={isStacked ? '#ffffff' : '#1e293b'}
                        fontSize={9}
                        fontWeight={700}
                        formatter={(val: any) => {
                          const num = Number(val) || 0;
                          if (num === 0) return '';
                          return num >= 1000 ? `${(num / 1000).toFixed(0)}k` : `${num}`;
                        }}
                      />
                    )}
                  </Bar>
                </>
              )}

              {/* GPM Mode Bars (including Process Water Retained GPM) */}
              {metricView === 'gpm' && (
                <>
                  <Bar
                    dataKey="purplePipeGpm"
                    name="Purple Pipe Supply (GPM)"
                    hide={hiddenSeries.includes('purplePipeGpm')}
                    stackId={isStacked ? 'a' : undefined}
                    fill="#4f46e5"
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  >
                    {showDataPoints && (
                      <LabelList
                        dataKey="purplePipeGpm"
                        position={isStacked ? 'center' : 'top'}
                        fill={isStacked ? '#ffffff' : '#1e293b'}
                        fontSize={9}
                        fontWeight={700}
                        formatter={(val: any) => (val ? Number(val).toFixed(1) : '')}
                      />
                    )}
                  </Bar>
                  <Bar
                    dataKey="wastewaterGpm"
                    name="Wastewater Discharge (GPM)"
                    hide={hiddenSeries.includes('wastewaterGpm')}
                    stackId={isStacked ? 'a' : undefined}
                    fill="#2563eb"
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  >
                    {showDataPoints && (
                      <LabelList
                        dataKey="wastewaterGpm"
                        position={isStacked ? 'center' : 'top'}
                        fill={isStacked ? '#ffffff' : '#1e293b'}
                        fontSize={9}
                        fontWeight={700}
                        formatter={(val: any) => (val ? Number(val).toFixed(1) : '')}
                      />
                    )}
                  </Bar>
                  <Bar
                    dataKey="retainedGpm"
                    name="Process Water Retained (GPM)"
                    hide={hiddenSeries.includes('retainedGpm')}
                    stackId={isStacked ? 'a' : undefined}
                    fill="#10b981"
                    radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  >
                    {showDataPoints && (
                      <LabelList
                        dataKey="retainedGpm"
                        position={isStacked ? 'center' : 'top'}
                        fill={isStacked ? '#ffffff' : '#1e293b'}
                        fontSize={9}
                        fontWeight={700}
                        formatter={(val: any) => (val ? Number(val).toFixed(1) : '')}
                      />
                    )}
                  </Bar>
                </>
              )}

              {/* Retention Rate Mode Bar */}
              {metricView === 'retention_rate' && (
                <Bar
                  dataKey="retentionRate"
                  name="Retention Rate (%)"
                  hide={hiddenSeries.includes('retentionRate')}
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                >
                  {showDataPoints && (
                    <LabelList
                      dataKey="retentionRate"
                      position="top"
                      fill="#1e293b"
                      fontSize={10}
                      fontWeight={700}
                      formatter={(val: any) => `${val}%`}
                    />
                  )}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-400 font-medium">
          {`${viewCadence} trend comparison of reclaimed supply, wastewater discharge, and process water retention`}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Stacked vs Grouped Toggle Button */}
          {metricView !== 'retention_rate' && (
            <button
              type="button"
              onClick={() => setIsStacked(!isStacked)}
              className={`text-xs font-extrabold px-3.5 py-1.5 rounded-full cursor-pointer transition-all border shadow-2xs active:scale-95 whitespace-nowrap select-none ${
                isStacked 
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200 shadow-xs' 
                  : 'bg-white hover:bg-gray-50 text-slate-700 border-gray-200'
              }`}
              title="Toggle stacked vs grouped bars"
            >
              {isStacked ? 'Stack: On' : 'Grouped'}
            </button>
          )}

          {/* Data Points Display Toggle Button */}
          <button
            type="button"
            onClick={() => setShowDataPoints(!showDataPoints)}
            className={`text-xs font-extrabold px-4 py-1.5 rounded-full transition-all cursor-pointer border shadow-2xs active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0 select-none ${
              showDataPoints 
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200 shadow-xs' 
                : 'bg-white hover:bg-gray-50 text-slate-700 border-gray-200'
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
}

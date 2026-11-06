import React, { useState, useMemo } from 'react';
import { parseISO, format, isValid } from 'date-fns';
import { CleanRewashBag, CleanShiftReport } from '../types';
import { isOfficialRewashType, OFFICIAL_REWASH_TYPES, REWASH_TYPE_CONFIG } from './RewashBags';
import { Recycle, Layers, Scale, Percent } from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

interface RewashAnalyticsChartProps {
  rewashBags: CleanRewashBag[];
  reports: CleanShiftReport[];
}

type ViewCadence = 'Daily' | 'Weekly' | 'Monthly' | 'By Type';
const REWASH_CHART_TYPES = [...OFFICIAL_REWASH_TYPES, 'Unassigned'];

export function RewashAnalyticsChart({ rewashBags, reports }: RewashAnalyticsChartProps) {
  const [chartViewMode, setChartViewMode] = useState<'bag_counts' | 'bag_weight' | 'rewash_rate'>('bag_counts');
  const [viewCadence, setViewCadence] = useState<ViewCadence>('Daily');
  const [isStacked, setIsStacked] = useState<boolean>(true);
  const [showDataPoints, setShowDataPoints] = useState<boolean>(false);
  const [hiddenTypes, setHiddenTypes] = useState<string[]>([]);
  const toggleType = (t: string) => {
    setHiddenTypes(prev => 
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  // Timeline aggregated data for Daily, Weekly, or Monthly view
  const timelineData = useMemo(() => {
    const agg: Record<string, {
      date: string;
      sortKey: string;
      totalCount: number;
      totalWeight: number;
      [key: string]: any;
    }> = {};

    rewashBags.forEach(b => {
      let key = b.bag_date || 'Unknown';
      let sortKey = b.bag_date || 'Unknown';

      if (viewCadence === 'Weekly') {
        key = b.weekLabel || 'Unknown';
        sortKey = b.bag_date || b.weekLabel || 'Unknown';
      } else if (viewCadence === 'Monthly' && b.bag_date) {
        try {
          const d = parseISO(b.bag_date);
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
          totalCount: 0,
          totalWeight: 0,
        };
        REWASH_CHART_TYPES.forEach(t => {
          agg[key][t] = 0;
        });
      }

      const typeKey = isOfficialRewashType(b.bag_type) ? b.bag_type : 'Unassigned';

      const weight = b.bag_weight_lbs || 0;
      agg[key].totalCount += 1;
      agg[key].totalWeight += weight;

      if (chartViewMode === 'bag_counts') {
        agg[key][typeKey] = (agg[key][typeKey] || 0) + 1;
      } else {
        agg[key][typeKey] = (agg[key][typeKey] || 0) + weight;
      }
    });

    return Object.values(agg).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [rewashBags, viewCadence, chartViewMode]);

  const rewashRateData = useMemo(() => {
    const periods: Record<string, {
      date: string;
      sortKey: string;
      reprocessedMaterials: number;
      inputBaleWeight: number;
    }> = {};

    reports.forEach(report => {
      if (!report.report_date) return;
      const date = viewCadence === 'Weekly'
        ? report.weekLabel || report.report_date
        : viewCadence === 'Monthly'
          ? report.monthLabel || report.report_date
          : report.report_date;
      if (!periods[date]) {
        periods[date] = {
          date,
          sortKey: report.report_date,
          reprocessedMaterials: 0,
          inputBaleWeight: 0,
        };
      }
      periods[date].reprocessedMaterials += report.total_reprocessed_materials_lbs || 0;
      periods[date].inputBaleWeight += report.total_input_bale_weight || 0;
    });

    return Object.values(periods)
      .map(period => ({
        date: period.date,
        sortKey: period.sortKey,
        rate: period.inputBaleWeight > 0
          ? (period.reprocessedMaterials / period.inputBaleWeight) * 100
          : 0,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [reports, viewCadence]);

  // Aggregate by Category view (all 7 types on X-axis)
  const byTypeData = useMemo(() => {
    const breakdown: Record<string, { count: number; weight: number }> = {};
    REWASH_CHART_TYPES.forEach(t => {
      breakdown[t] = { count: 0, weight: 0 };
    });

    rewashBags.forEach(b => {
      const typeKey = isOfficialRewashType(b.bag_type) ? b.bag_type : 'Unassigned';
      if (breakdown[typeKey]) {
        breakdown[typeKey].count += 1;
        breakdown[typeKey].weight += (b.bag_weight_lbs || 0);
      }
    });

    return REWASH_CHART_TYPES.map(type => {
      const info = breakdown[type] || { count: 0, weight: 0 };
      return {
        name: type,
        value: chartViewMode === 'bag_counts' ? info.count : info.weight,
        count: info.count,
        weight: info.weight,
        color: REWASH_TYPE_CONFIG[type]?.color || '#64748b',
      };
    });
  }, [rewashBags, chartViewMode]);

  const filteredByTypeData = useMemo(() => {
    return byTypeData.filter(d => !hiddenTypes.includes(d.name));
  }, [byTypeData, hiddenTypes]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Recycle className="w-5 h-5 text-emerald-600" />
            Rewash Material Analysis: {chartViewMode === 'bag_counts' ? 'Bag Counts' : chartViewMode === 'bag_weight' ? 'Bag Weight' : 'Rewash Rate'}
          </h3>
        </div>

        {/* Chart type and cadence controls */}
        <div className="flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar pb-1">
          {/* Toggle between Bag Counts and Bag Weight */}
          <div className="liquid-glass-track inline-flex items-center p-1 rounded-full text-xs font-semibold text-slate-800 shrink-0">
            {[
              { id: 'bag_counts' as const, label: 'Bag Counts', icon: Layers, iconColor: 'text-emerald-700', glassClass: 'liquid-glass-btn-forest', textColor: 'text-[#004d25]' },
              { id: 'bag_weight' as const, label: 'Bag Weight', icon: Scale, iconColor: 'text-blue-700', glassClass: 'liquid-glass-btn-primary', textColor: 'text-blue-900' },
              { id: 'rewash_rate' as const, label: 'Rewash Rate', icon: Percent, iconColor: 'text-amber-700', glassClass: 'liquid-glass-btn-amber', textColor: 'text-amber-900' },
            ].map(item => {
              const Icon = item.icon;
              const isSelected = chartViewMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setChartViewMode(item.id);
                    if (item.id === 'rewash_rate' && viewCadence === 'By Type') setViewCadence('Daily');
                  }}
                  className={`relative px-3.5 py-1.5 rounded-full transition-colors duration-300 cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none ${
                    isSelected 
                      ? `${item.glassClass} ${item.textColor} font-extrabold` 
                      : 'hover:text-black hover:bg-white/50 text-slate-800 font-semibold'
                  }`}
                >
                  <Icon className={`relative z-10 w-3.5 h-3.5 ${isSelected ? item.textColor : item.iconColor}`} />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Standardized Cadence Buttons: Daily / Weekly / Monthly / By Type */}
          <div className="liquid-glass-track inline-flex items-center p-1 rounded-full text-xs font-semibold text-slate-800 shrink-0">
            {(['Daily', 'Weekly', 'Monthly', ...(chartViewMode === 'rewash_rate' ? [] : ['By Type' as const])] as const).map(option => {
              const isSelected = viewCadence === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setViewCadence(option)}
                  className={`relative px-3.5 py-1.5 rounded-full transition-colors duration-300 cursor-pointer whitespace-nowrap select-none ${
                    isSelected
                      ? 'liquid-glass-btn-dark text-slate-900 font-extrabold'
                      : 'hover:text-black hover:bg-white/50 text-slate-800 font-semibold'
                  }`}
                >
                  <span className="relative z-10">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top-Right Interactive Click-to-Filter Color Legend */}
      {chartViewMode !== 'rewash_rate' && (
      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1.5 max-w-full pb-1 pt-1">
        <span className="text-[11px] font-semibold text-gray-400 mr-1">Filter Series:</span>
        {REWASH_CHART_TYPES.map(type => {
          const isHidden = hiddenTypes.includes(type);
          const conf = REWASH_TYPE_CONFIG[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`liquid-glass-btn text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 border ${
                isHidden 
                  ? 'opacity-40 grayscale line-through bg-gray-100 text-gray-400 border-gray-200/60' 
                  : `${conf.bg} ${conf.border} ${conf.text} font-extrabold shadow-2xs hover:scale-102`
              }`}
              title={`Click to ${isHidden ? 'show' : 'hide'} ${type}`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: conf?.color || '#64748b' }} />
              <span>{type}</span>
            </button>
          );
        })}
      </div>
      )}

      {/* Chart Canvas */}
      <div className="bg-gray-50/50 rounded-xl p-4 sm:p-5 border border-gray-100">
        <div className="h-[360px] w-full">
        {chartViewMode === 'rewash_rate' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rewashRateData} margin={{ top: 20, right: 20, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickMargin={8} axisLine={false} tickLine={false} />
              <YAxis
                width={70}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={value => `${value}%`}
                label={{ value: 'Rewash Rate (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11, fontWeight: 600, style: { textAnchor: 'middle' } }}
              />
              <RechartsTooltip
                formatter={(value: number | undefined) => [`${(value || 0).toFixed(2)}%`, 'Rewash Rate']}
                contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="rate"
                name="Rewash Rate"
                stroke="#d97706"
                strokeWidth={3}
                dot={{ r: 4, fill: '#d97706', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              >
                {showDataPoints && (
                  <LabelList
                    position="top"
                    offset={8}
                    fill="var(--rewash-rate-label)"
                    fontSize={10}
                    fontWeight={700}
                    formatter={(value: number | undefined) => `${(value || 0).toFixed(2)}%`}
                  />
                )}
              </Line>
            </LineChart>
          </ResponsiveContainer>
        ) : viewCadence !== 'By Type' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={timelineData} 
              margin={{ top: 15, right: 15, left: 25, bottom: 25 }}
              barCategoryGap={isStacked ? "25%" : "15%"}
              barGap={2}
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
                tickFormatter={
                  chartViewMode === 'bag_counts'
                    ? (val) => String(val)
                    : (val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)
                }
                dx={-4}
                label={{ 
                  value: chartViewMode === 'bag_counts' ? 'Rewash Bag Quantity (Bags)' : 'Rewash Material Weight (lbs)', 
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
                  const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
                  const activeItems = payload.filter((p: any) => Number(p.value) > 0);
                  return (
                    <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-3 shadow-xl text-xs space-y-1 font-mono min-w-[190px]">
                      <p className="font-bold text-gray-900 font-sans border-b border-gray-100 pb-1">{label}</p>
                      <div className="space-y-1">
                        {activeItems.map((entry: any) => (
                          <div key={entry.name} className="flex justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-gray-600 font-sans">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              {entry.name}:
                            </span>
                            <span className="font-bold text-gray-900">
                              {chartViewMode === 'bag_counts' 
                                ? `${entry.value} bags` 
                                : `${Number(entry.value).toLocaleString()} lbs`}
                            </span>
                          </div>
                        ))}
                        {activeItems.length === 0 && (
                          <div className="text-gray-400 italic font-sans">No bags recorded</div>
                        )}
                        <div className="flex justify-between gap-4 pt-1 border-t border-gray-100 font-bold text-gray-900">
                          <span className="font-sans">Total {chartViewMode === 'bag_counts' ? 'Bags' : 'Weight'}:</span>
                          <span className="text-emerald-700">
                            {chartViewMode === 'bag_counts' 
                              ? `${total} bags` 
                              : `${total.toLocaleString()} lbs`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              {REWASH_CHART_TYPES.map(type => (
                <Bar
                  key={type}
                  dataKey={type}
                  name={type}
                  hide={hiddenTypes.includes(type)}
                  stackId={isStacked ? "a" : undefined}
                  fill={REWASH_TYPE_CONFIG[type]?.color || '#64748b'}
                  radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                >
                  {showDataPoints && (
                    <LabelList
                      dataKey={type}
                      position={isStacked ? "center" : "top"}
                      fill={isStacked ? "#ffffff" : "#1e293b"}
                      fontSize={9}
                      fontWeight={600}
                      formatter={(val: any) => {
                        const num = Number(val) || 0;
                        if (num === 0) return '';
                        return chartViewMode === 'bag_counts'
                          ? `${num}`
                          : (num >= 1000 ? `${(num / 1000).toFixed(0)}k` : `${num}`);
                      }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={filteredByTypeData} 
              margin={{ top: 20, right: 15, left: 25, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                dy={8} 
                label={{ 
                  value: 'Rewash Material Classification', 
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
                tickFormatter={
                  chartViewMode === 'bag_counts'
                    ? (val) => String(val)
                    : (val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)
                }
                dx={-4}
                label={{ 
                  value: chartViewMode === 'bag_counts' ? 'Rewash Bag Quantity (Bags)' : 'Rewash Material Weight (lbs)', 
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
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-3 shadow-xl text-xs space-y-1 font-mono">
                      <p className="font-bold text-gray-900 font-sans border-b border-gray-100 pb-1 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </p>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500 font-sans">Bag Count:</span>
                        <span className="font-bold text-blue-600">{d.count} bags</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500 font-sans">Total Weight:</span>
                        <span className="font-bold text-amber-600">{Number(d.weight).toLocaleString()} lbs</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar 
                dataKey="value" 
                name={chartViewMode === 'bag_counts' ? 'Bag Count' : 'Weight (lbs)'} 
                radius={[6, 6, 0, 0]}
              >
                {filteredByTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                {showDataPoints && (
                  <LabelList 
                    position="top" 
                    fill="#1e293b" 
                    fontSize={11} 
                    fontWeight={700}
                    formatter={(val: any) => {
                      const num = Number(val) || 0;
                      if (num === 0) return '';
                      return chartViewMode === 'bag_counts' 
                        ? `${num} bags` 
                        : `${num.toLocaleString()} lbs`;
                    }} 
                  />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        </div>
      </div>

      {/* Bottom Controls Bar: Data Points & Stacked/Grouped relocated to bottom right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-400 font-medium">
          {chartViewMode === 'rewash_rate'
            ? `Rewash rate = total reprocessed materials ÷ total input bale weight (${viewCadence.toLowerCase()})`
            : viewCadence === 'By Type'
            ? 'Cumulative totals across all 7 official material classifications'
            : `${viewCadence} accumulation trend across 7 official material classifications`}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Stacked vs Grouped Toggle Button (for timeline view) in Liquid Glass */}
          {chartViewMode !== 'rewash_rate' && viewCadence !== 'By Type' && (
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
            title="Toggle data point labels on the chart"
          >
            <span className={`w-2 h-2 rounded-full ${showDataPoints ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span>Data Points: {showDataPoints ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

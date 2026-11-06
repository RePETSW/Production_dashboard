import { Activity, ClockAlert, Box, Gauge, Package, Percent, Timer } from 'lucide-react';
import { CleanShiftReport } from '../types';
interface KPICardsProps {
  reports: CleanShiftReport[];
}
export function KPICards({ reports }: KPICardsProps) {
  const totalMT = reports.reduce((sum, r) => sum + (r.output_metric_tons || 0), 0);
  const totalDowntimeMins = reports.reduce((sum, r) => sum + (r.total_downtime_computed_minutes || 0), 0);
  const totalRunTimeMins = reports.reduce((sum, r) => sum + (r.total_run_time_computed_minutes || 0), 0);
  const totalBales = reports.reduce((sum, r) => sum + (r.total_input_bales || 0), 0);
  const totalInputBaleWt = reports.reduce((sum, r) => sum + (r.total_input_bale_weight || 0), 0);
  const totalBalerBales = reports.reduce((sum, r) => sum + (r.baler_produced_bales || 0), 0);
  const totalOutputFlakeWt = reports.reduce((sum, r) => sum + (r.total_output_flake_weight || 0), 0);
  // System yield calculation: output metric tons / (Total input bale weight / 2204)
  const totalInputMT = totalInputBaleWt > 0 ? (totalInputBaleWt / 2204) : 0;
  const yieldPct = totalInputMT > 0 ? (totalMT / totalInputMT) * 100 : 0;
  // Total operational time & uptime availability
  const totalShiftOperatingMins = totalRunTimeMins + totalDowntimeMins;
  const availabilityPct = totalShiftOperatingMins > 0 ? (totalRunTimeMins / totalShiftOperatingMins) * 100 : 0;
  const totalDays = new Set(reports.filter(r => r.report_date).map(r => r.report_date)).size || 1;
  // Format minutes into clean hours and minutes
  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };
  // Group by shift helper
  const getShiftBreakdown = (getValue: (r: CleanShiftReport) => number) => {
    const agg: Record<string, number> = {};
    reports.forEach(r => {
      const s = r.shift || '1';
      agg[s] = (agg[s] || 0) + getValue(r);
    });
    return Object.entries(agg).sort((a, b) => a[0].localeCompare(b[0]));
  };
  const kpis = [
    {
      id: 'output_mt',
      label: 'Production Output (MT)',
      value: totalMT.toFixed(2),
      unit: 'MT',
      avg: `${(totalMT / totalDays).toFixed(2)} MT / day`,
      note: '2,204 lbs / Metric Ton',
      icon: <Activity className="w-5 h-5 text-[#2d6a4f]" />,
      bg: 'bg-emerald-50 text-[#2d6a4f] border-emerald-100',
      totalVal: totalMT,
      shifts: getShiftBreakdown(r => r.output_metric_tons),
      format: (val: number) => `${val.toFixed(2)} MT`
    },
    {
      id: 'output_lbs',
      label: 'Total Output Flake Weight',
      value: Math.round(totalOutputFlakeWt).toLocaleString(),
      unit: 'lbs',
      avg: `${Math.round(totalOutputFlakeWt / totalDays).toLocaleString()} lbs / day`,
      note: 'Clean PET Flake Produced',
      icon: <Box className="w-5 h-5 text-teal-600" />,
      bg: 'bg-teal-50 text-teal-700 border-teal-100',
      totalVal: totalOutputFlakeWt,
      shifts: getShiftBreakdown(r => r.total_output_flake_weight),
      format: (val: number) => `${Math.round(val).toLocaleString()} lbs`
    },
    {
      id: 'input_lbs',
      label: 'Input Bale Weight',
      value: Math.round(totalInputBaleWt).toLocaleString(),
      unit: 'lbs',
      avg: `${Math.round(totalInputBaleWt / totalDays).toLocaleString()} lbs / day`,
      note: `${Math.round(totalBales).toLocaleString()} raw bales fed`,
      icon: <Gauge className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50 text-blue-700 border-blue-100',
      totalVal: totalInputBaleWt,
      shifts: getShiftBreakdown(r => r.total_input_bale_weight),
      format: (val: number) => `${Math.round(val).toLocaleString()} lbs`
    },
    {
      id: 'total_input_bales_counts',
      label: 'Total input bales counts',
      value: Math.round(totalBales).toLocaleString(),
      unit: 'Bales',
      avg: `${(totalBales / totalDays).toFixed(2)} Bales / day`,
      note: 'Total raw bales fed into plant',
      icon: <Package className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      totalVal: totalBales,
      shifts: getShiftBreakdown(r => r.total_input_bales),
      format: (val: number) => `${Math.round(val).toLocaleString()} Bales`
    },
    {
      id: 'downtime',
      label: 'Total Plant Downtime',
      value: Math.round(totalDowntimeMins).toLocaleString(),
      unit: 'Mins',
      avg: `${formatMins(totalDowntimeMins / totalDays)} / day`,
      note: `${(totalDowntimeMins / 60).toFixed(1)} total hours lost`,
      icon: <ClockAlert className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50 text-amber-700 border-amber-100',
      totalVal: totalDowntimeMins,
      shifts: getShiftBreakdown(r => r.total_downtime_computed_minutes),
      format: (val: number) => `${Math.round(val)}m (${(val / 60).toFixed(1)}h)`
    },
    {
      id: 'baler_machine_produced_bales',
      label: 'Baler Machine Produced Bales',
      value: Math.round(totalBalerBales).toLocaleString(),
      unit: 'Bales',
      avg: `${(totalBalerBales / totalDays).toFixed(2)} Bales / day`,
      note: 'Baler machine produced bales output',
      icon: <Timer className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50 text-purple-700 border-purple-100',
      totalVal: totalBalerBales,
      shifts: getShiftBreakdown(r => r.baler_produced_bales),
      format: (val: number) => `${Math.round(val).toLocaleString()} Bales`
    }
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {kpis.map((kpi) => {
        return (
          <div 
            key={kpi.id} 
            className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col justify-between"
          >
            {/* Top Metric Header */}
            <div className="p-5 sm:p-6 pb-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-[11px] text-gray-400 font-medium">{kpi.note}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${kpi.bg}`}>
                  {kpi.icon}
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-mono">
                  {kpi.value}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-gray-500">{kpi.unit}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                  {kpi.avg}
                </span>
              </div>
            </div>
            {/* Shift Breakdown Section */}
            <div className="px-5 py-3.5 bg-gray-50/70 border-t border-gray-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Shift Breakdown</span>
                <span>Share %</span>
              </div>
              {kpi.shifts.length > 0 ? (
                <div className="space-y-2">
                  {kpi.shifts.map(([shift, val]) => {
                    const sharePct = kpi.totalVal > 0 ? Math.min(100, Math.max(0, (val / kpi.totalVal) * 100)) : 0;
                    return (
                      <div key={shift} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#4f7c5e]" />
                            Shift {shift}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-900 font-medium text-xs">
                              {kpi.format(val)}
                            </span>
                            <span className="font-mono text-[11px] text-gray-400 w-10 text-right">
                              {sharePct > 0 ? `${sharePct.toFixed(0)}%` : '--'}
                            </span>
                          </div>
                        </div>
                        {/* Visual mini bar */}
                        <div className="w-full bg-gray-200/70 h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#4f7c5e] h-full rounded-full transition-all duration-300"
                            style={{ width: `${sharePct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-1 italic">No shift breakdown recorded</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

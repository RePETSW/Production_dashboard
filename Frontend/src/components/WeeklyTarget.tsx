import { useState } from 'react';
import { TrendingUp, Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { CleanShiftReport } from '../types';
import { AnimatePresence, motion } from 'motion/react';
interface Filters {
  week: string;
  date: string;
  shift: string;
  line: string;
}
export function WeeklyTarget({ allReports, currentReports, filters }: { allReports: CleanShiftReport[], currentReports: CleanShiftReport[], filters: Filters }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const availableShifts = Array.from(new Set(allReports.map(r => r.shift).filter(Boolean))).sort();
  const [weeklyTargets, setWeeklyTargets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('repet_weekly_targets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [weeklyDaysMap, setWeeklyDaysMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('repet_weekly_days');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [editingWeeklyFor, setEditingWeeklyFor] = useState<string | null>(null);
  const [tempWeeklyTarget, setTempWeeklyTarget] = useState(500);
  const [tempWeeklyDays, setTempWeeklyDays] = useState(5);
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('repet_monthly_targets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [monthlyDaysMap, setMonthlyDaysMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('repet_monthly_days');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [editingMonthlyFor, setEditingMonthlyFor] = useState<string | null>(null);
  const [tempMonthlyTarget, setTempMonthlyTarget] = useState(2000);
  const [tempMonthlyDays, setTempMonthlyDays] = useState(22);
  const updateWeeklyTarget = (mode: string, target: number, days: number) => {
    setWeeklyTargets(prev => {
      const next = { ...prev, [mode]: target };
      try { localStorage.setItem('repet_weekly_targets', JSON.stringify(next)); } catch {}
      return next;
    });
    setWeeklyDaysMap(prev => {
      const next = { ...prev, [mode]: days };
      try { localStorage.setItem('repet_weekly_days', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const updateMonthlyTarget = (mode: string, target: number, days: number) => {
    setMonthlyTargets(prev => {
      const next = { ...prev, [mode]: target };
      try { localStorage.setItem('repet_monthly_targets', JSON.stringify(next)); } catch {}
      return next;
    });
    setMonthlyDaysMap(prev => {
      const next = { ...prev, [mode]: days };
      try { localStorage.setItem('repet_monthly_days', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const uniqueWeeks = Array.from(new Set(currentReports.map(r => r.weekLabel).filter(Boolean))).sort();
  const latestWeekLabel = uniqueWeeks[uniqueWeeks.length - 1] || 'N/A';
  const uniqueMonths = Array.from(new Set(currentReports.map(r => r.monthLabel).filter(Boolean))).sort();
  const latestMonthLabel = uniqueMonths[uniqueMonths.length - 1] || 'N/A';
  if (currentReports.length === 0) return null;
  const modesToRender = ['overall'];
  if (isExpanded) {
    modesToRender.push(...availableShifts);
  }
  const renderTargetForMode = (mode: string) => {
    const isOverall = mode === 'overall';
    const currentWeeklyTarget = weeklyTargets[mode] || (isOverall ? 500 : 160);
    const currentWeeklyDays = weeklyDaysMap[mode] || 5;
    const currentMonthlyTarget = monthlyTargets[mode] || (isOverall ? 2000 : 660);
    const currentMonthlyDays = monthlyDaysMap[mode] || 22;
    const modeWeeklyReports = allReports.filter(r => {
      if (r.weekLabel !== latestWeekLabel) return false;
      if (!isOverall) {
        if (r.shift !== mode) return false;
      } else {
        if (filters.shift.length && !filters.shift.includes(r.shift)) return false;
      }
      if (filters.line.length && !filters.line.includes(r.line)) return false;
      return true;
    });
    const weeklyMT = modeWeeklyReports.reduce((sum, r) => sum + (r.output_metric_tons || 0), 0);
    const weeklyDaysActual = new Set(modeWeeklyReports.map(r => r.report_date).filter(Boolean)).size || 1;
    const weeklyDailyAvg = (weeklyMT / weeklyDaysActual).toFixed(2);
    const weeklyReqDailyAvg = (currentWeeklyTarget / (currentWeeklyDays || 1)).toFixed(2);
    const weeklyPercentage = Math.min((weeklyMT / currentWeeklyTarget) * 100, 100) || 0;
    const modeMonthlyReports = allReports.filter(r => {
      if (r.monthLabel !== latestMonthLabel) return false;
      if (!isOverall) {
        if (r.shift !== mode) return false;
      } else {
        if (filters.shift.length && !filters.shift.includes(r.shift)) return false;
      }
      if (filters.line.length && !filters.line.includes(r.line)) return false;
      return true;
    });
    const monthlyMT = modeMonthlyReports.reduce((sum, r) => sum + (r.output_metric_tons || 0), 0);
    const monthlyDaysActual = new Set(modeMonthlyReports.map(r => r.report_date).filter(Boolean)).size || 1;
    const monthlyDailyAvg = (monthlyMT / monthlyDaysActual).toFixed(2);
    const monthlyReqDailyAvg = (currentMonthlyTarget / (currentMonthlyDays || 1)).toFixed(2);
    const monthlyPercentage = Math.min((monthlyMT / currentMonthlyTarget) * 100, 100) || 0;
    const isEditingWeekly = editingWeeklyFor === mode;
    const isEditingMonthly = editingMonthlyFor === mode;
    if (!isOverall) {
      return (
        <motion.div 
          key={mode} 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10, overflow: 'hidden' }}
          className="mt-3 pt-3 border-t border-gray-100/60"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <h4 className="text-sm font-bold text-gray-700 bg-gray-100/70 px-3 py-1.5 rounded-xl whitespace-nowrap text-center lg:text-left w-full lg:w-24">Shift {mode}</h4>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Weekly Compact */}
              <div className="bg-gray-50/60 hover:bg-gray-50/90 p-3 rounded-xl border border-gray-100 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Weekly</span>
                    {!isEditingWeekly && (
                      <button 
                        onClick={() => { 
                          setTempWeeklyTarget(currentWeeklyTarget); 
                          setTempWeeklyDays(currentWeeklyDays); 
                          setEditingWeeklyFor(mode); 
                        }} 
                        className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-gray-500 hover:text-gray-900 bg-white/70 hover:bg-white border border-gray-200/80 hover:border-gray-300 shadow-2xs transition-all cursor-pointer shrink-0"
                        title="Edit Weekly"
                      >
                        <Pencil className="w-2.5 h-2.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-gray-800 text-sm">{weeklyMT.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400">/ {currentWeeklyTarget} MT</span>
                  </div>
                </div>
                <AnimatePresence>
                  {isEditingWeekly && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, y: -4 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -4 }}
                      className="mb-2.5 p-2.5 bg-white/95 backdrop-blur-md rounded-lg border border-emerald-200/90 shadow-sm flex flex-col gap-2"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 border-b border-emerald-100/80 pb-1.5">
                        <span className="font-extrabold text-[11px] text-[#004d25] flex items-center gap-1">
                          <Pencil className="w-3 h-3 text-[#004d25]" /> Edit Shift {mode} Weekly
                        </span>
                        <span className="text-[10px] font-bold text-[#004d25] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                          Req: {(tempWeeklyTarget / (tempWeeklyDays || 1)).toFixed(2)} MT/day
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-700 font-bold block mb-0.5">Volume (MT)</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={tempWeeklyTarget} 
                              onChange={(e) => setTempWeeklyTarget(Number(e.target.value))}
                              className="w-full px-2 py-1 text-[11px] bg-emerald-50/20 border border-emerald-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004d25] font-black text-gray-900 pr-8 shadow-2xs"
                            />
                            <span className="absolute right-2 top-1 text-[10px] font-bold text-gray-400">MT</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="text-[9px] text-gray-400 font-semibold uppercase">Presets:</span>
                            {[100, 160, 200, 250].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setTempWeeklyTarget(val)}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                                  tempWeeklyTarget === val 
                                    ? 'bg-[#004d25] text-white shadow-2xs' 
                                    : 'bg-white hover:bg-emerald-50 text-gray-700 border border-emerald-100'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-700 font-bold block mb-0.5">Operating Days</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={tempWeeklyDays} 
                              onChange={(e) => setTempWeeklyDays(Number(e.target.value))}
                              className="w-full px-2 py-1 text-[11px] bg-emerald-50/20 border border-emerald-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004d25] font-black text-gray-900 pr-10 shadow-2xs"
                            />
                            <span className="absolute right-2 top-1 text-[10px] font-bold text-gray-400">Days</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="text-[9px] text-gray-400 font-semibold uppercase">Days:</span>
                            {[5, 6, 7].map(d => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setTempWeeklyDays(d)}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                                  tempWeeklyDays === d 
                                    ? 'bg-[#004d25] text-white shadow-2xs' 
                                    : 'bg-white hover:bg-emerald-50 text-gray-700 border border-emerald-100'
                                }`}
                              >
                                {d}d
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-emerald-100/80">
                        <button 
                          type="button" 
                          onClick={() => setEditingWeeklyFor(null)}
                          className="px-2.5 py-0.5 text-[11px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-md transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <X className="w-3 h-3 text-gray-500" />
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            updateWeeklyTarget(mode, tempWeeklyTarget, tempWeeklyDays);
                            setEditingWeeklyFor(null);
                          }}
                          className="px-3 py-0.5 text-[11px] font-extrabold text-white bg-[#004d25] hover:bg-[#00381b] rounded-md cursor-pointer shadow-xs transition-all flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-[#7ac143]" />
                          Save
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${weeklyPercentage >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${weeklyPercentage}%` }} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <div className="bg-white border border-gray-200 px-2 py-1 rounded shadow-sm text-gray-500">
                    Avg: <span className={`font-bold ${Number(weeklyDailyAvg) < Number(weeklyReqDailyAvg) ? 'text-red-500' : 'text-gray-700'}`}>{weeklyDailyAvg}</span>
                  </div>
                  <div className="bg-white border border-gray-200 px-2 py-1 rounded shadow-sm text-gray-500">
                    Req: <span className="font-bold text-indigo-600">{weeklyReqDailyAvg}</span>
                  </div>
                  <div className={`px-2 py-1 rounded shadow-sm border font-bold ml-auto ${weeklyPercentage >= 100 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                    {weeklyPercentage >= 100 ? 'Goal Met 🎉' : `${weeklyPercentage.toFixed(1)}%`}
                  </div>
                </div>
              </div>
              {/* Monthly Compact */}
              <div className="bg-gray-50/60 hover:bg-gray-50/90 p-3 rounded-xl border border-gray-100 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Monthly</span>
                    {!isEditingMonthly && (
                      <button 
                        onClick={() => { 
                          setTempMonthlyTarget(currentMonthlyTarget); 
                          setTempMonthlyDays(currentMonthlyDays); 
                          setEditingMonthlyFor(mode); 
                        }} 
                        className="group inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-gray-500 hover:text-gray-900 bg-white/70 hover:bg-white border border-gray-200/80 hover:border-gray-300 shadow-2xs transition-all cursor-pointer shrink-0"
                        title="Edit Monthly"
                      >
                        <Pencil className="w-2.5 h-2.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-gray-800 text-sm">{monthlyMT.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400">/ {currentMonthlyTarget} MT</span>
                  </div>
                </div>
                <AnimatePresence>
                  {isEditingMonthly && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, y: -4 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -4 }}
                      className="mb-2.5 p-2.5 bg-white/95 backdrop-blur-md rounded-lg border border-emerald-200/90 shadow-sm flex flex-col gap-2"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 border-b border-emerald-100/80 pb-1.5">
                        <span className="font-extrabold text-[11px] text-[#004d25] flex items-center gap-1">
                          <Pencil className="w-3 h-3 text-[#004d25]" /> Edit Shift {mode} Monthly
                        </span>
                        <span className="text-[10px] font-bold text-[#004d25] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                          Req: {(tempMonthlyTarget / (tempMonthlyDays || 1)).toFixed(2)} MT/day
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-700 font-bold block mb-0.5">Volume (MT)</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={tempMonthlyTarget} 
                              onChange={(e) => setTempMonthlyTarget(Number(e.target.value))}
                              className="w-full px-2 py-1 text-[11px] bg-emerald-50/20 border border-emerald-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004d25] font-black text-gray-900 pr-8 shadow-2xs"
                            />
                            <span className="absolute right-2 top-1 text-[10px] font-bold text-gray-400">MT</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="text-[9px] text-gray-400 font-semibold uppercase">Presets:</span>
                            {[400, 660, 800, 1000].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setTempMonthlyTarget(val)}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                                  tempMonthlyTarget === val 
                                    ? 'bg-[#004d25] text-white shadow-2xs' 
                                    : 'bg-white hover:bg-emerald-50 text-gray-700 border border-emerald-100'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-700 font-bold block mb-0.5">Operating Days</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={tempMonthlyDays} 
                              onChange={(e) => setTempMonthlyDays(Number(e.target.value))}
                              className="w-full px-2 py-1 text-[11px] bg-emerald-50/20 border border-emerald-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004d25] font-black text-gray-900 pr-10 shadow-2xs"
                            />
                            <span className="absolute right-2 top-1 text-[10px] font-bold text-gray-400">Days</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="text-[9px] text-gray-400 font-semibold uppercase">Days:</span>
                            {[20, 22, 24, 26].map(d => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setTempMonthlyDays(d)}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                                  tempMonthlyDays === d 
                                    ? 'bg-[#004d25] text-white shadow-2xs' 
                                    : 'bg-white hover:bg-emerald-50 text-gray-700 border border-emerald-100'
                                }`}
                              >
                                {d}d
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-emerald-100/80">
                        <button 
                          type="button" 
                          onClick={() => setEditingMonthlyFor(null)}
                          className="px-2.5 py-0.5 text-[11px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-md transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <X className="w-3 h-3 text-gray-500" />
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            updateMonthlyTarget(mode, tempMonthlyTarget, tempMonthlyDays);
                            setEditingMonthlyFor(null);
                          }}
                          className="px-3 py-0.5 text-[11px] font-extrabold text-white bg-[#004d25] hover:bg-[#00381b] rounded-md cursor-pointer shadow-xs transition-all flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-[#7ac143]" />
                          Save
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${monthlyPercentage >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${monthlyPercentage}%` }} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <div className="bg-white border border-gray-200 px-2 py-1 rounded shadow-sm text-gray-500">
                    Avg: <span className={`font-bold ${Number(monthlyDailyAvg) < Number(monthlyReqDailyAvg) ? 'text-red-500' : 'text-gray-700'}`}>{monthlyDailyAvg}</span>
                  </div>
                  <div className="bg-white border border-gray-200 px-2 py-1 rounded shadow-sm text-gray-500">
                    Req: <span className="font-bold text-indigo-600">{monthlyReqDailyAvg}</span>
                  </div>
                  <div className={`px-2 py-1 rounded shadow-sm border font-bold ml-auto ${monthlyPercentage >= 100 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                    {monthlyPercentage >= 100 ? 'Goal Met 🎉' : `${monthlyPercentage.toFixed(1)}%`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }
    return (
      <motion.div 
        key={mode} 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, y: -10, overflow: 'hidden' }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-stretch mb-2"
      >
        {/* Weekly Progress */}
        <div className="flex-1 w-full bg-gray-50/50 hover:bg-gray-50 p-3.5 sm:p-5 rounded-2xl border border-gray-100 transition-colors flex flex-col justify-between">
          <div className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-gray-800">
                    Weekly Target
                  </h3>
                  {!isEditingWeekly && (
                    <button 
                      onClick={() => { 
                        setTempWeeklyTarget(currentWeeklyTarget); 
                        setTempWeeklyDays(currentWeeklyDays); 
                        setEditingWeeklyFor(mode); 
                      }} 
                      className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold text-gray-500 hover:text-gray-900 bg-white/70 hover:bg-white border border-gray-200/80 hover:border-gray-300 shadow-2xs transition-all cursor-pointer shrink-0"
                      title="Edit target"
                    >
                      <Pencil className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
                <span className="text-gray-500 font-medium text-[11px] sm:text-xs">({latestWeekLabel})</span>
              </div>
              <div className="flex items-baseline gap-1 text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                <span className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{weeklyMT.toFixed(2)}</span>
                <span className="text-xs sm:text-sm text-gray-400 font-medium mx-0.5">/</span>
                <span className="text-xs sm:text-sm font-bold text-gray-600">
                  {currentWeeklyTarget} MT
                </span>
              </div>
            </div>
            <AnimatePresence>
              {isEditingWeekly && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  className="mb-3 p-3 sm:p-3.5 bg-white/95 backdrop-blur-md rounded-lg border border-emerald-200/90 shadow-md flex flex-col gap-2.5"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 border-b border-emerald-100/80 pb-2">
                    <span className="font-extrabold text-xs text-[#004d25] flex items-center gap-1.5">
                      <div className="p-1 bg-[#004d25]/10 text-[#004d25] rounded-md">
                        <Pencil className="w-3.5 h-3.5" />
                      </div>
                      Edit Weekly {mode !== 'overall' ? `(Shift ${mode})` : ''}
                    </span>
                    <span className="text-[10px] font-bold text-[#004d25] bg-emerald-50/90 px-2.5 py-0.5 rounded-md border border-emerald-200/80 shadow-2xs">
                      Req: {(tempWeeklyTarget / (tempWeeklyDays || 1)).toFixed(2)} MT / day
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-700 font-bold block mb-1">Volume (MT)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={tempWeeklyTarget} 
                          onChange={(e) => setTempWeeklyTarget(Number(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs bg-emerald-50/20 border border-emerald-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004d25] font-black text-gray-900 pr-9 shadow-2xs transition-all"
                        />
                        <span className="absolute right-2.5 top-1 text-[10px] font-bold text-gray-400">MT</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Presets:</span>
                        {[300, 500, 600, 750].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setTempWeeklyTarget(val)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer shadow-2xs ${
                              tempWeeklyTarget === val 
                                ? 'bg-[#004d25] text-white shadow-xs' 
                                : 'bg-white hover:bg-emerald-50 text-gray-700 border border-emerald-100 hover:border-emerald-200'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-700 font-bold block mb-1">Operating Days</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={tempWeeklyDays} 
                          onChange={(e) => setTempWeeklyDays(Number(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs bg-emerald-50/20 border border-emerald-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004d25] font-black text-gray-900 pr-11 shadow-2xs transition-all"
                        />
                        <span className="absolute right-2.5 top-1 text-[10px] font-bold text-gray-400">Days</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Days:</span>
                        {[5, 6, 7].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setTempWeeklyDays(d)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer shadow-2xs ${
                              tempWeeklyDays === d 
                                ? 'bg-[#004d25] text-white shadow-xs' 
                                : 'bg-white hover:bg-emerald-50 text-gray-700 border border-emerald-100 hover:border-emerald-200'
                            }`}
                          >
                            {d} Days
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-100/80">
                    <button 
                      type="button" 
                      onClick={() => setEditingWeeklyFor(null)}
                      className="px-3 py-1 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-md transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5 text-gray-500" />
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        updateWeeklyTarget(mode, tempWeeklyTarget, tempWeeklyDays);
                        setEditingWeeklyFor(null);
                      }}
                      className="px-3.5 py-1 text-xs font-extrabold text-white bg-[#004d25] hover:bg-[#00381b] rounded-md cursor-pointer shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-[#7ac143]" />
                      Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`relative w-full h-2.5 bg-gray-100 rounded-full overflow-hidden ${!isEditingWeekly ? 'mb-4 sm:mb-6' : 'mb-4 mt-1'}`}>
              <div 
                className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out ${weeklyPercentage >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${weeklyPercentage}%` }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-auto pt-1">
              <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-gray-200/60 shadow-xs flex items-center sm:flex-col justify-between sm:justify-between gap-1 hover:border-gray-300 transition-colors">
                <span className="text-gray-500 font-medium text-[11px] sm:text-xs leading-tight">Daily Average</span>
                <div className="flex items-baseline gap-1">
                  <span className={`font-bold text-sm sm:text-lg leading-none tracking-tight ${Number(weeklyDailyAvg) < Number(weeklyReqDailyAvg) ? 'text-red-500' : 'text-gray-800'}`}>
                    {weeklyDailyAvg}
                  </span>
                  <span className={`text-[10px] sm:text-xs ${Number(weeklyDailyAvg) < Number(weeklyReqDailyAvg) ? 'text-red-400' : 'text-gray-400'} font-medium`}>MT</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-gray-200/60 shadow-xs flex items-center sm:flex-col justify-between sm:justify-between gap-1 hover:border-gray-300 transition-colors">
                <span className="text-gray-500 font-medium text-[11px] sm:text-xs leading-tight">Required Daily Average</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-bold text-sm sm:text-lg leading-none tracking-tight text-indigo-600">
                    {weeklyReqDailyAvg}
                  </span>
                  <span className="text-indigo-400 text-[10px] sm:text-xs font-medium">MT</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-gray-200/60 shadow-xs flex items-center sm:flex-col justify-between sm:justify-between gap-1 hover:border-gray-300 transition-colors">
                <span className="text-gray-500 font-medium text-[11px] sm:text-xs leading-tight">Goal Status</span>
                <span className={`font-bold text-sm sm:text-lg leading-none tracking-tight ${weeklyPercentage >= 100 ? 'text-green-600' : 'text-indigo-600'}`}>
                  {weeklyPercentage >= 100 ? 'Goal Met 🎉' : `${weeklyPercentage.toFixed(1)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Monthly Progress */}
        <div className="flex-1 w-full bg-gray-50/50 hover:bg-gray-50 p-3.5 sm:p-5 rounded-2xl border border-gray-100 transition-colors flex flex-col justify-between">
          <div className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-gray-800">
                    Monthly Target
                  </h3>
                  {!isEditingMonthly && (
                    <button 
                      onClick={() => { 
                        setTempMonthlyTarget(currentMonthlyTarget); 
                        setTempMonthlyDays(currentMonthlyDays); 
                        setEditingMonthlyFor(mode); 
                      }} 
                      className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold text-gray-500 hover:text-gray-900 bg-white/70 hover:bg-white border border-gray-200/80 hover:border-gray-300 shadow-2xs transition-all cursor-pointer shrink-0"
                      title="Edit target"
                    >
                      <Pencil className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
                <span className="text-gray-500 font-medium text-[11px] sm:text-xs">({latestMonthLabel})</span>
              </div>
              <div className="flex items-baseline gap-1 text-left sm:text-right shrink-0 mt-1 sm:mt-0">
                <span className="text-xl sm:text-2xl font-bold text-gray-900 leading-none">{monthlyMT.toFixed(2)}</span>
                <span className="text-xs sm:text-sm text-gray-400 font-medium mx-0.5">/</span>
                <span className="text-xs sm:text-sm font-bold text-gray-600">
                  {currentMonthlyTarget} MT
                </span>
              </div>
            </div>
            <AnimatePresence>
              {isEditingMonthly && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  className="mb-3 p-3 sm:p-3.5 bg-white/95 backdrop-blur-md rounded-lg border border-emerald-200/90 shadow-md flex flex-col gap-2.5"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 border-b border-emerald-100/80 pb-2">
                    <span className="font-extrabold text-xs text-[#004d25] flex items-center gap-1.5">
                      <div className="p-1 bg-[#004d25]/10 text-[#004d25] rounded-md">
                        <Pencil className="w-3.5 h-3.5" />
                      </div>
                      Edit Monthly {mode !== 'overall' ? `(Shift ${mode})` : ''}
                    </span>
                    <span className="text-[10px] font-bold text-[#004d25] bg-emerald-50/90 px-2.5 py-0.5 rounded-md border border-emerald-200/80 shadow-2xs">
                      Req: {(tempMonthlyTarget / (tempMonthlyDays || 1)).toFixed(2)} MT / day
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-700 font-bold block mb-1">Volume (MT)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={tempMonthlyTarget} 
                          onChange={(e) => setTempMonthlyTarget(Number(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs bg-emerald-50/20 border border-emerald-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004d25] font-black text-gray-900 pr-9 shadow-2xs transition-all"
                        />
                        <span className="absolute right-2.5 top-1 text-[10px] font-bold text-gray-400">MT</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Presets:</span>
                        {[1500, 2000, 2500, 3000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setTempMonthlyTarget(val)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer shadow-2xs ${
                              tempMonthlyTarget === val 
                                ? 'bg-[#004d25] text-white shadow-xs' 
                                : 'bg-white hover:bg-emerald-50 text-gray-700 border border-emerald-100 hover:border-emerald-200'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-700 font-bold block mb-1">Operating Days</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={tempMonthlyDays} 
                          onChange={(e) => setTempMonthlyDays(Number(e.target.value))}
                          className="w-full px-2.5 py-1 text-xs bg-emerald-50/20 border border-emerald-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#004d25] font-black text-gray-900 pr-11 shadow-2xs transition-all"
                        />
                        <span className="absolute right-2.5 top-1 text-[10px] font-bold text-gray-400">Days</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Days:</span>
                        {[20, 22, 24, 26].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setTempMonthlyDays(d)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer shadow-2xs ${
                              tempMonthlyDays === d 
                                ? 'bg-[#004d25] text-white shadow-xs' 
                                : 'bg-white hover:bg-emerald-50 text-gray-700 border border-emerald-100 hover:border-emerald-200'
                            }`}
                          >
                            {d} Days
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-100/80">
                    <button 
                      type="button" 
                      onClick={() => setEditingMonthlyFor(null)}
                      className="px-3 py-1 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-md transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5 text-gray-500" />
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        updateMonthlyTarget(mode, tempMonthlyTarget, tempMonthlyDays);
                        setEditingMonthlyFor(null);
                      }}
                      className="px-3.5 py-1 text-xs font-extrabold text-white bg-[#004d25] hover:bg-[#00381b] rounded-md cursor-pointer shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-[#7ac143]" />
                      Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`relative w-full h-2.5 bg-gray-100 rounded-full overflow-hidden ${!isEditingMonthly ? 'mb-4 sm:mb-6' : 'mb-4 mt-1'}`}>
              <div 
                className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out ${monthlyPercentage >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${monthlyPercentage}%` }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-auto pt-1">
              <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-gray-200/60 shadow-xs flex items-center sm:flex-col justify-between sm:justify-between gap-1 hover:border-gray-300 transition-colors">
                <span className="text-gray-500 font-medium text-[11px] sm:text-xs leading-tight">Daily Average</span>
                <div className="flex items-baseline gap-1">
                  <span className={`font-bold text-sm sm:text-lg leading-none tracking-tight ${Number(monthlyDailyAvg) < Number(monthlyReqDailyAvg) ? 'text-red-500' : 'text-gray-800'}`}>
                    {monthlyDailyAvg}
                  </span>
                  <span className={`text-[10px] sm:text-xs ${Number(monthlyDailyAvg) < Number(monthlyReqDailyAvg) ? 'text-red-400' : 'text-gray-400'} font-medium`}>MT</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-gray-200/60 shadow-xs flex items-center sm:flex-col justify-between sm:justify-between gap-1 hover:border-gray-300 transition-colors">
                <span className="text-gray-500 font-medium text-[11px] sm:text-xs leading-tight">Required Daily Average</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-bold text-sm sm:text-lg leading-none tracking-tight text-indigo-600">
                    {monthlyReqDailyAvg}
                  </span>
                  <span className="text-indigo-400 text-[10px] sm:text-xs font-medium">MT</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-gray-200/60 shadow-xs flex items-center sm:flex-col justify-between sm:justify-between gap-1 hover:border-gray-300 transition-colors">
                <span className="text-gray-500 font-medium text-[11px] sm:text-xs leading-tight">Goal Status</span>
                <span className={`font-bold text-sm sm:text-lg leading-none tracking-tight ${monthlyPercentage >= 100 ? 'text-green-600' : 'text-indigo-600'}`}>
                  {monthlyPercentage >= 100 ? 'Goal Met 🎉' : `${monthlyPercentage.toFixed(1)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 border-b border-gray-100 pb-3 gap-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Production Performance</h2>
          </div>
        </div>
        {availableShifts.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="liquid-glass-btn flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer shadow-2xs hover:scale-102 text-gray-800"
          >
            <span>{isExpanded ? 'Hide Shift Breakdown' : 'View Shift Breakdown'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-0">
        <AnimatePresence initial={false}>
          {modesToRender.map(renderTargetForMode)}
        </AnimatePresence>
      </div>
    </div>
  );
}

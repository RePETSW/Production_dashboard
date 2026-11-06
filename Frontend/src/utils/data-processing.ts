import Papa from 'papaparse';
import { startOfISOWeek, endOfISOWeek, parseISO, format, isValid } from 'date-fns';
import { ShiftReport, BladeChange, CleanShiftReport, CleanBladeChange, RewashBag, CleanRewashBag, WaterUsage, CleanWaterUsage } from '../types';
import { calculateFlakeYieldPercentage } from './metrics';

export function getProductionMonth(reportDate: string | null | undefined): string {
  return reportDate?.slice(0, 7) ?? '';
}

export function matchesProductionMonth(reportDate: string | null | undefined, selectedMonths: string[]): boolean {
  return selectedMonths.length === 0 || selectedMonths.includes(getProductionMonth(reportDate));
}

export function parseData(reportsCsv: string, bladeChangesCsv: string, rewashBagsCsv: string = '', waterUsageCsv: string = '') {
  const reports = Papa.parse<ShiftReport>(reportsCsv, {
    header: true,
    skipEmptyLines: true,
  }).data;

  const bladeChanges = Papa.parse<BladeChange>(bladeChangesCsv, {
    header: true,
    skipEmptyLines: true,
  }).data;

  const rewashBags = Papa.parse<RewashBag>(rewashBagsCsv, {
    header: true,
    skipEmptyLines: true,
  }).data;

  const waterUsageRecords = Papa.parse<WaterUsage>(waterUsageCsv, {
    header: true,
    skipEmptyLines: true,
  }).data;

  // Clean data: map string values to numbers where appropriate
  const cleanReports: CleanShiftReport[] = reports
    .filter(r => r.report_date)
    .map((r) => {
      let weekLabel = '';
      let monthLabel = '';
      
      try {
        const d = parseISO(r.report_date);
        if (isValid(d)) {
          const start = startOfISOWeek(d);
          const end = endOfISOWeek(d);
          weekLabel = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
          monthLabel = format(d, 'MMM yyyy');
        }
      } catch(e) {}

      const hrs = parseFloat(r.total_downtime_hours || '0');
      const mins = parseFloat(r.total_downtime_minutes || '0');
      const runHrs = parseFloat(r.total_run_time_hours || '0');
      const runMins = parseFloat(r.total_run_time_minutes || '0');
      const inputBaleWt = parseFloat(r.total_input_bale_weight || '0');
      const outputFlakeWt = parseFloat(r.total_output_flake_weight || '0');
      const outputMT = parseFloat(r.output_metric_tons || '0');
      const flakeYield = calculateFlakeYieldPercentage(outputMT, inputBaleWt);

      return {
        ...r,
        shift: r.shift ? String(r.shift).replace(/shift\s*/i, '').trim() : '1',
        output_metric_tons: outputMT,
        total_downtime_computed_minutes: (hrs * 60) + mins,
        total_run_time_computed_minutes: (runHrs * 60) + runMins,
        total_input_bales: parseFloat(r.total_input_bales || '0'),
        total_input_bale_weight: inputBaleWt,
        total_output_flake_weight: outputFlakeWt,
        baler_produced_bales: parseFloat(r.baler_produced_bales || '0'),
        total_reprocessed_materials_lbs: parseFloat(r.total_reprocessed_materials_lbs || '0'),
        output_pet_fines_bags_weight_lbs: parseFloat(r.output_pet_fines_bags_weight_lbs || '0'),
        weekLabel,
        monthLabel,
        flake_yield_percentage: flakeYield
      };
    });

  const cleanBladeChanges: CleanBladeChange[] = bladeChanges.map((b) => ({
    ...b,
    duration_minutes: parseFloat(b.duration_minutes || '0'),
  }));

  const reportMap = new Map(cleanReports.map(r => [r.id, r]));

  const cleanRewashBags: CleanRewashBag[] = rewashBags
    .filter(b => b.id || b.bag_number || b.bag_weight_lbs)
    .map((b) => {
      const matchedReport = b.shift_report_id ? reportMap.get(b.shift_report_id) : undefined;
      const dateVal = b.bag_date || matchedReport?.report_date || '';
      let formattedDate = dateVal;
      if (dateVal) {
        try {
          const d = parseISO(dateVal);
          if (isValid(d)) formattedDate = format(d, 'MMM d, yyyy');
        } catch(e) {}
      }

      return {
        ...b,
        bag_date: dateVal,
        shift: b.shift || matchedReport?.shift || '-',
        line: b.line || matchedReport?.line || '2',
        bag_type: b.bag_type && b.bag_type.trim() ? b.bag_type.trim() : 'Unassigned',
        bag_weight_lbs: parseFloat(b.bag_weight_lbs || '0'),
        supervisor: matchedReport?.supervisor || 'Not Specified',
        weekLabel: matchedReport?.weekLabel || '',
        formattedDate,
      };
    });

  const cleanWaterUsage: CleanWaterUsage[] = waterUsageRecords
    .filter(w => w.shift_report_id || w.report_date)
    .map((w) => {
      const matchedReport = w.shift_report_id ? reportMap.get(w.shift_report_id) : undefined;
      const dateVal = w.report_date || matchedReport?.report_date || '';
      let formattedDate = dateVal;
      let weekLabel = matchedReport?.weekLabel || '';
      let monthLabel = matchedReport?.monthLabel || '';
      if (dateVal) {
        try {
          const d = parseISO(dateVal);
          if (isValid(d)) {
            formattedDate = format(d, 'MMM d, yyyy');
            if (!weekLabel) {
              const start = startOfISOWeek(d);
              const end = endOfISOWeek(d);
              weekLabel = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
            }
            if (!monthLabel) {
              monthLabel = format(d, 'MMM yyyy');
            }
          }
        } catch(e) {}
      }

      return {
        ...w,
        report_date: dateVal,
        shift: w.shift || matchedReport?.shift || '1',
        line: w.line || matchedReport?.line || '1',
        purple_pipe_meter_reading: Math.abs(parseFloat(w.purple_pipe_meter_reading || '0')),
        purple_pipe_usage: Math.abs(parseFloat(w.purple_pipe_usage || '0')),
        purple_pipe_gpm: Math.abs(parseFloat(w.purple_pipe_gpm || '0')),
        wastewater_discharge: Math.abs(parseFloat(w.wastewater_discharge || '0')),
        wastewater_usage: Math.abs(parseFloat(w.wastewater_usage || '0')),
        wastewater_gpm: Math.abs(parseFloat(w.wastewater_gpm || '0')),
        supervisor: matchedReport?.supervisor || 'Not Specified',
        formattedDate,
        weekLabel,
        monthLabel,
      };
    });

  return { 
    reports: cleanReports, 
    bladeChanges: cleanBladeChanges,
    rewashBags: cleanRewashBags,
    waterUsage: cleanWaterUsage,
  };
}

// Additional helper functions can be added for aggregations

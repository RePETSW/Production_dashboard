import { CleanShiftReport } from '../types';

export function calculateFlakeYieldPercentage(outputMetricTons: number, inputBaleWeightLbs: number) {
  const inputMetricTons = inputBaleWeightLbs / 2204;
  if (inputMetricTons <= 0) return 0;

  const yieldPercentage = (outputMetricTons / inputMetricTons) * 100;
  return yieldPercentage > 0 && yieldPercentage <= 150 ? yieldPercentage : 0;
}

export function countCleanlinessAudits(reports: Pick<
  CleanShiftReport,
  | 'open_baler_cleaness_auger_1'
  | 'open_baler_cleaness_auger_2'
  | 'open_baler_cleaness_auger_3'
  | 'twin_auger_cleaness_1'
  | 'twin_auger_cleaness_2'
  | 'twin_auger_cleaness_3'
  | 'twin_auger_cleaness_4'
  | 'twin_auger_cleaness_5'
  | 'downtime_items'
>[]) {
  const auditFields = [
    'open_baler_cleaness_auger_1',
    'open_baler_cleaness_auger_2',
    'open_baler_cleaness_auger_3',
    'twin_auger_cleaness_1',
    'twin_auger_cleaness_2',
    'twin_auger_cleaness_3',
    'twin_auger_cleaness_4',
    'twin_auger_cleaness_5',
  ] as const;

  return reports.filter(report =>
    auditFields.some(field => {
      const value = report[field];
      return value !== undefined && value !== null && String(value).trim() !== '';
    }) || Boolean(report.downtime_items?.trim())
  ).length;
}

export function calculateRewashRate(reports: Pick<
  CleanShiftReport,
  'total_reprocessed_materials_lbs' | 'total_input_bale_weight'
>[]) {
  const totalReprocessedMaterials = reports.reduce(
    (sum, report) => sum + (report.total_reprocessed_materials_lbs || 0),
    0,
  );
  const totalInputBaleWeight = reports.reduce(
    (sum, report) => sum + (report.total_input_bale_weight || 0),
    0,
  );

  return {
    totalReprocessedMaterials,
    totalInputBaleWeight,
    rate: totalInputBaleWeight > 0
      ? (totalReprocessedMaterials / totalInputBaleWeight) * 100
      : 0,
  };
}

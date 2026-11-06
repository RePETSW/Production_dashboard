import assert from 'node:assert/strict';
import test from 'node:test';
import Papa from 'papaparse';
import { calculateFlakeYieldPercentage, calculateRewashRate, countCleanlinessAudits } from './metrics';
import { getProductionMonth, matchesProductionMonth, parseData } from './data-processing';

test('production month options and selection use chronological YYYY-MM values', () => {
  const reportDates = ['2026-01-03', '2026-11-02', '2026-02-20', '2026-11-30'];
  const months = Array.from(new Set(reportDates.map(getProductionMonth))).sort().reverse();

  assert.deepEqual(months, ['2026-11', '2026-02', '2026-01']);
  assert.equal(matchesProductionMonth('2026-11-02', ['2026-11']), true);
  assert.equal(matchesProductionMonth('2026-10-30', ['2026-11']), false);
  assert.equal(matchesProductionMonth(undefined, ['2026-11']), false);
  assert.equal(matchesProductionMonth(undefined, []), true);
});

test('parses Supabase-shaped rows and joins related dashboard records', () => {
  const reports = Papa.unparse([
    {
      id: 'report-1',
      report_date: '2026-11-02',
      shift: 2,
      line: 1,
      supervisor: 'Test Supervisor',
      total_downtime_hours: 1,
      total_downtime_minutes: 15,
      total_run_time_hours: 7,
      total_run_time_minutes: 30,
      total_input_bales: 10,
      total_input_bale_weight: 2204,
      total_output_flake_weight: 1980,
      output_metric_tons: 1,
      total_reprocessed_materials_lbs: 220,
      open_baler_cleaness_auger_1: 'false',
    },
    {
      id: 'report-2',
      report_date: '2026-11-03',
      shift: 3,
      line: 2,
      total_input_bale_weight: 2204,
      total_reprocessed_materials_lbs: 110,
    },
  ]);
  const bladeChanges = Papa.unparse([
    { id: 'blade-1', shift_report_id: 'report-1', grinder: 'No. 2', duration_minutes: 30 },
  ]);
  const rewashBags = Papa.unparse([
    { id: 'bag-1', shift_report_id: 'report-1', bag_date: null, shift: null, line: null, bag_number: '1', bag_weight_lbs: 100, bag_type: null },
    { id: 'bag-2', shift_report_id: 'report-1', bag_date: null, shift: null, line: null, bag_number: '2', bag_weight_lbs: 200, bag_type: 'Label' },
  ]);
  const waterUsage = Papa.unparse([
    { shift_report_id: 'report-1', report_date: null, shift: null, line: null, purple_pipe_usage: 100, purple_pipe_gpm: 10, wastewater_usage: 20, wastewater_gpm: 2 },
  ]);

  const data = parseData(reports, bladeChanges, rewashBags, waterUsage);

  assert.equal(data.reports.length, 2);
  assert.equal(data.reports[0].shift, '2');
  assert.equal(data.reports[0].total_downtime_computed_minutes, 75);
  assert.equal(data.reports[0].total_run_time_computed_minutes, 450);
  assert.equal(data.reports[0].flake_yield_percentage, 100);
  assert.match(data.reports[0].weekLabel, /Nov 2 - Nov 8, 2026/);

  assert.equal(data.bladeChanges[0].duration_minutes, 30);
  assert.equal(data.rewashBags[0].bag_type, 'Unassigned');
  assert.equal(data.rewashBags[0].supervisor, 'Test Supervisor');
  assert.equal(data.rewashBags[0].shift, '2');
  assert.equal(data.waterUsage[0].purple_pipe_usage, 100);
  assert.equal(data.waterUsage[0].supervisor, 'Test Supervisor');
  assert.equal(data.waterUsage[0].line, '1');
  assert.equal(countCleanlinessAudits(data.reports), 1);
});

test('calculates weighted flake yield and rewash rate with invalid-input guards', () => {
  assert.equal(calculateFlakeYieldPercentage(1, 2204), 100);
  assert.equal(calculateFlakeYieldPercentage(0, 2204), 0);
  assert.equal(calculateFlakeYieldPercentage(1, 0), 0);
  assert.equal(calculateFlakeYieldPercentage(2, 2204), 0);

  const rate = calculateRewashRate([
    { total_reprocessed_materials_lbs: 220, total_input_bale_weight: 2204 },
    { total_reprocessed_materials_lbs: 110, total_input_bale_weight: 2204 },
  ]);
  assert.equal(rate.totalReprocessedMaterials, 330);
  assert.equal(rate.totalInputBaleWeight, 4408);
  assert.equal(rate.rate, (330 / 4408) * 100);
  assert.equal(calculateRewashRate([]).rate, 0);
});

test('counts completed cleanliness values while ignoring empty database columns', () => {
  const auditReports = [
    { open_baler_cleaness_auger_1: 'false', downtime_items: '' },
    { open_baler_cleaness_auger_1: '', twin_auger_cleaness_1: null, downtime_items: '  ' },
    { open_baler_cleaness_auger_1: '', twin_auger_cleaness_1: '', downtime_items: 'Conveyor jam' },
  ];

  assert.equal(countCleanlinessAudits(auditReports), 2);
});

export interface ShiftReport {
  id: string;
  report_date: string;
  shift: string;
  line: string;
  supervisor: string;
  employees: string;
  injuries: string;
  line_start_time: string;
  total_downtime_hours: string;
  total_downtime_minutes: string;
  line_stop_time: string;
  total_run_time_hours: string;
  total_run_time_minutes: string;
  total_input_bales: string;
  total_input_bale_weight: string;
  total_output_pet_flake_bags: string;
  total_output_flake_weight: string;
  output_metric_tons: string;
  output_pet_fines_bags: string;
  baler_produced_bales: string;
  input_bale_ratio: string;
  baler_start_time: string;
  baler_stop_time: string;
  downtime_items: string;
  completed_by: string;
  completed_date: string;
  supervisor_review: string;
  created_at: string;
  user_email: string;
  total_reprocessed_materials_lbs?: string;
  output_pet_fines_bags_weight_lbs?: string;
  open_baler_cleaness_auger_1?: string;
  open_baler_cleaness_auger_2?: string;
  open_baler_cleaness_auger_3?: string;
  twin_auger_cleaness_1?: string;
  twin_auger_cleaness_2?: string;
  twin_auger_cleaness_3?: string;
  twin_auger_cleaness_4?: string;
  twin_auger_cleaness_5?: string;
  openBalerCleanessAuger1_photo_path?: string;
  openBalerCleanessAuger2_photo_path?: string;
  openBalerCleanessAuger3_photo_path?: string;
  twinAugerCleaness1_photo_path?: string;
  twinAugerCleaness2_photo_path?: string;
  twinAugerCleaness3_photo_path?: string;
  twinAugerCleaness4_photo_path?: string;
  twinAugerCleaness5_photo_path?: string;
  open_baler_cleaness_auger_1_operator_cleaned?: string;
  open_baler_cleaness_auger_2_operator_cleaned?: string;
  open_baler_cleaness_auger_3_operator_cleaned?: string;
  twin_auger_cleaness_1_operator_cleaned?: string;
  twin_auger_cleaness_2_operator_cleaned?: string;
  twin_auger_cleaness_3_operator_cleaned?: string;
  twin_auger_cleaness_4_operator_cleaned?: string;
  twin_auger_cleaness_5_operator_cleaned?: string;
}

export interface CleanShiftReport extends Omit<ShiftReport, 'output_metric_tons' | 'total_downtime_hours' | 'total_downtime_minutes' | 'total_input_bales' | 'total_input_bale_weight' | 'total_output_flake_weight' | 'baler_produced_bales' | 'total_reprocessed_materials_lbs' | 'output_pet_fines_bags_weight_lbs'> {
  output_metric_tons: number;
  total_downtime_computed_minutes: number;
  total_run_time_computed_minutes: number;
  total_input_bales: number;
  total_input_bale_weight: number;
  total_output_flake_weight: number;
  baler_produced_bales: number;
  total_reprocessed_materials_lbs: number;
  output_pet_fines_bags_weight_lbs: number;
  weekLabel: string;
  monthLabel: string;
  flake_yield_percentage: number;
}

export interface BladeChange {
  id: string;
  shift_report_id: string;
  grinder: string;
  start_time: string;
  end_time: string;
  duration_minutes: string;
}

export interface CleanBladeChange extends Omit<BladeChange, 'duration_minutes'> {
  duration_minutes: number;
  report_date?: string;
  shift?: string;
  dayLabel?: string;
}

export interface RewashBag {
  id: string;
  shift_report_id: string;
  bag_date: string;
  shift: string;
  line: string;
  bag_number: string;
  bag_weight_lbs: string;
  created_at: string;
  bag_type: string;
}

export interface CleanRewashBag extends Omit<RewashBag, 'bag_weight_lbs'> {
  bag_weight_lbs: number;
  supervisor?: string;
  formattedDate?: string;
  weekLabel?: string;
}

export interface WaterUsage {
  shift_report_id: string;
  report_date: string;
  shift: string;
  line: string;
  purple_pipe_time: string;
  purple_pipe_meter_reading: string;
  purple_pipe_usage: string;
  purple_pipe_gpm: string;
  wastewater_time: string;
  wastewater_discharge: string;
  wastewater_usage: string;
  wastewater_gpm: string;
  created_at: string;
}

export interface CleanWaterUsage extends Omit<WaterUsage, 'purple_pipe_meter_reading' | 'purple_pipe_usage' | 'purple_pipe_gpm' | 'wastewater_discharge' | 'wastewater_usage' | 'wastewater_gpm'> {
  purple_pipe_meter_reading: number;
  purple_pipe_usage: number;
  purple_pipe_gpm: number;
  wastewater_discharge: number;
  wastewater_usage: number;
  wastewater_gpm: number;
  supervisor?: string;
  formattedDate?: string;
  weekLabel?: string;
  monthLabel?: string;
}


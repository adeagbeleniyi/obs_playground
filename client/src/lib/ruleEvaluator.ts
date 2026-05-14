/**
 * Rule Evaluator — client-side
 *
 * Evaluates a RuleDefinition against a snapshot of simulated fleet data.
 * Returns a list of MatchResult objects: one per asset that satisfies the rule.
 */

import type { RuleDefinition, RuleCondition, AssetType, Metric } from "@shared/ruleTypes";

// ─── Match result ─────────────────────────────────────────────────────────────

export interface MatchResult {
  assetId: string;
  assetType: AssetType;
  label: string;
  metric: Metric;
  value: number;
  unit: string;
  operator: string;
  threshold: number;
  subdivision?: string;
  location?: string;
  severity: "alarm" | "alert" | "elevated" | "watch";
  timestamp: Date;
}

// ─── Simulated fleet snapshot ─────────────────────────────────────────────────
// These values mirror the data used in the AI system prompt and Network Overview.

interface CarReading {
  carId: string;
  label: string;
  wild_kips: number;
  hbd_temp_rise: number;
  ded_status: number;
  weight_tons: number;
  speed_mph: number;
  defect_count: number;
  days_since_inspection: number;
  subdivision: string;
  location: string;
  timestamp: Date;
}

interface WheelReading {
  wheelId: string;
  label: string;
  carId: string;
  wild_kips: number;
  hbd_temp_rise: number;
  tread_wear_mm: number;
  flange_height_mm: number;
  subdivision: string;
  timestamp: Date;
}

interface LocomotiveReading {
  locoId: string;
  label: string;
  speed_mph: number;
  fuel_level_pct: number;
  oil_pressure_psi: number;
  coolant_temp_c: number;
  fault_code_count: number;
  hours_since_service: number;
  subdivision: string;
  timestamp: Date;
}

interface TrainReading {
  trainId: string;
  label: string;
  speed_mph: number;
  car_count: number;
  tonnage_tons: number;
  alarm_count: number;
  hos_remaining_min: number;
  ptc_status: number;
  subdivision: string;
  timestamp: Date;
}

interface WaysideReading {
  detectorId: string;
  label: string;
  wild_kips: number;
  hbd_temp_rise: number;
  passage_count_24h: number;
  alarm_count_24h: number;
  last_calibration_days: number;
  subdivision: string;
  timestamp: Date;
}

interface SubdivisionReading {
  subId: string;
  label: string;
  car_passage_count_7d: number;
  alarm_count_7d: number;
  active_train_count: number;
  avg_speed_mph: number;
  defect_rate_pct: number;
  timestamp: Date;
}

interface YardReading {
  yardId: string;
  label: string;
  capacity_pct: number;
  car_count: number;
  train_count: number;
  dwell_time_avg_hours: number;
  timestamp: Date;
}

// ─── Simulated data ───────────────────────────────────────────────────────────

const now = new Date();
const ago = (h: number) => new Date(now.getTime() - h * 3600 * 1000);

export const SIM_CARS: CarReading[] = [
  { carId: "TTX 891204",   label: "TTX 891204 — Flatcar 89ft",           wild_kips: 112, hbd_temp_rise: 18, ded_status: 0, weight_tons: 142, speed_mph: 52, defect_count: 2, days_since_inspection: 44, subdivision: "Kingston Sub",  location: "MP 188.4", timestamp: ago(1.2) },
  { carId: "BNSF 584291",  label: "BNSF 584291 — Boxcar 60ft",           wild_kips: 61,  hbd_temp_rise: 52, ded_status: 0, weight_tons: 118, speed_mph: 48, defect_count: 1, days_since_inspection: 67, subdivision: "Rivers Sub",    location: "MP 44.1",  timestamp: ago(2.1) },
  { carId: "UP 448812",    label: "UP 448812 — Tank Car 60ft (HAZMAT)",   wild_kips: 78,  hbd_temp_rise: 22, ded_status: 0, weight_tons: 198, speed_mph: 44, defect_count: 0, days_since_inspection: 28, subdivision: "Edson Sub",     location: "MP 112.8", timestamp: ago(0.8) },
  { carId: "TTGX 8841",    label: "TTGX 8841 — Flatcar",                  wild_kips: 68,  hbd_temp_rise: 31, ded_status: 0, weight_tons: 88,  speed_mph: 55, defect_count: 1, days_since_inspection: 91, subdivision: "Bala Sub",      location: "MP 88.2",  timestamp: ago(3.5) },
  { carId: "CN 714823",    label: "CN 714823 — Gondola 52ft",             wild_kips: 54,  hbd_temp_rise: 14, ded_status: 0, weight_tons: 156, speed_mph: 60, defect_count: 0, days_since_inspection: 12, subdivision: "Montréal Sub",  location: "MP 22.4",  timestamp: ago(1.0) },
  { carId: "CPKC 334521",  label: "CPKC 334521 — Covered Hopper 60ft",   wild_kips: 52,  hbd_temp_rise: 8,  ded_status: 0, weight_tons: 212, speed_mph: 44, defect_count: 0, days_since_inspection: 55, subdivision: "Kingston Sub",  location: "MP 144.8", timestamp: ago(4.2) },
  { carId: "NS 228834",    label: "NS 228834 — Boxcar 60ft",              wild_kips: 51,  hbd_temp_rise: 11, ded_status: 0, weight_tons: 104, speed_mph: 48, defect_count: 0, days_since_inspection: 38, subdivision: "Ruel Sub",      location: "MP 201.4", timestamp: ago(6.0) },
  { carId: "CN 892341",    label: "CN 892341 — Gondola",                  wild_kips: 34,  hbd_temp_rise: 7,  ded_status: 0, weight_tons: 168, speed_mph: 52, defect_count: 0, days_since_inspection: 22, subdivision: "Edson Sub",     location: "MP 80.1",  timestamp: ago(2.8) },
  { carId: "BNSF 771234",  label: "BNSF 771234 — Boxcar",                 wild_kips: 29,  hbd_temp_rise: 5,  ded_status: 0, weight_tons: 96,  speed_mph: 60, defect_count: 0, days_since_inspection: 15, subdivision: "Kingston Sub",  location: "MP 60.2",  timestamp: ago(1.5) },
  { carId: "TTX 445521",   label: "TTX 445521 — Flatcar 89ft",            wild_kips: 44,  hbd_temp_rise: 9,  ded_status: 1, weight_tons: 78,  speed_mph: 55, defect_count: 1, days_since_inspection: 102, subdivision: "Rivers Sub",   location: "MP 12.8",  timestamp: ago(0.5) },
];

export const SIM_WHEELS: WheelReading[] = [
  { wheelId: "TTX 891204 / Axle B2-Right", label: "TTX 891204 — Axle B2-Right",    carId: "TTX 891204",  wild_kips: 112, hbd_temp_rise: 18, tread_wear_mm: 28, flange_height_mm: 36, subdivision: "Kingston Sub", timestamp: ago(1.2) },
  { wheelId: "TTX 891204 / Axle A2-Right", label: "TTX 891204 — Axle A2-Right",    carId: "TTX 891204",  wild_kips: 88,  hbd_temp_rise: 12, tread_wear_mm: 24, flange_height_mm: 35, subdivision: "Kingston Sub", timestamp: ago(1.2) },
  { wheelId: "BNSF 584291 / Axle A1-Left", label: "BNSF 584291 — Axle A1-Left",   carId: "BNSF 584291", wild_kips: 61,  hbd_temp_rise: 52, tread_wear_mm: 31, flange_height_mm: 37, subdivision: "Rivers Sub",   timestamp: ago(2.1) },
  { wheelId: "UP 448812 / Axle A1-Left",   label: "UP 448812 — Axle A1-Left",     carId: "UP 448812",   wild_kips: 78,  hbd_temp_rise: 22, tread_wear_mm: 19, flange_height_mm: 34, subdivision: "Edson Sub",    timestamp: ago(0.8) },
  { wheelId: "TTGX 8841 / Axle A2-Right",  label: "TTGX 8841 — Axle A2-Right",   carId: "TTGX 8841",   wild_kips: 68,  hbd_temp_rise: 31, tread_wear_mm: 33, flange_height_mm: 38, subdivision: "Bala Sub",     timestamp: ago(3.5) },
  { wheelId: "CN 714823 / Axle B1-Left",   label: "CN 714823 — Axle B1-Left",     carId: "CN 714823",   wild_kips: 54,  hbd_temp_rise: 14, tread_wear_mm: 22, flange_height_mm: 35, subdivision: "Montréal Sub", timestamp: ago(1.0) },
  { wheelId: "CPKC 334521 / Axle A1-Right",label: "CPKC 334521 — Axle A1-Right", carId: "CPKC 334521", wild_kips: 52,  hbd_temp_rise: 8,  tread_wear_mm: 18, flange_height_mm: 34, subdivision: "Kingston Sub", timestamp: ago(4.2) },
  { wheelId: "NS 228834 / Axle B2-Left",   label: "NS 228834 — Axle B2-Left",     carId: "NS 228834",   wild_kips: 51,  hbd_temp_rise: 11, tread_wear_mm: 26, flange_height_mm: 36, subdivision: "Ruel Sub",     timestamp: ago(6.0) },
  { wheelId: "TTX 445521 / Axle A1-Left",  label: "TTX 445521 — Axle A1-Left",   carId: "TTX 445521",  wild_kips: 44,  hbd_temp_rise: 9,  tread_wear_mm: 30, flange_height_mm: 37, subdivision: "Rivers Sub",   timestamp: ago(0.5) },
];

export const SIM_LOCOS: LocomotiveReading[] = [
  { locoId: "CN 3012",   label: "CN 3012 — ES44AC",          speed_mph: 52, fuel_level_pct: 68, oil_pressure_psi: 62, coolant_temp_c: 82, fault_code_count: 0, hours_since_service: 312, subdivision: "Kingston Sub", timestamp: ago(1.2) },
  { locoId: "CN 2817",   label: "CN 2817 — SD70M-2",         speed_mph: 48, fuel_level_pct: 41, oil_pressure_psi: 58, coolant_temp_c: 88, fault_code_count: 1, hours_since_service: 580, subdivision: "Rivers Sub",   timestamp: ago(2.1) },
  { locoId: "CN 3156",   label: "CN 3156 — ES44DC",          speed_mph: 44, fuel_level_pct: 22, oil_pressure_psi: 55, coolant_temp_c: 91, fault_code_count: 2, hours_since_service: 710, subdivision: "Edson Sub",    timestamp: ago(0.8) },
  { locoId: "CN 2244",   label: "CN 2244 — SD40-2",          speed_mph: 0,  fuel_level_pct: 88, oil_pressure_psi: 64, coolant_temp_c: 72, fault_code_count: 0, hours_since_service: 88,  subdivision: "Ruel Sub",     timestamp: ago(5.0) },
  { locoId: "BNSF 6821", label: "BNSF 6821 — ES44C4",        speed_mph: 55, fuel_level_pct: 12, oil_pressure_psi: 52, coolant_temp_c: 96, fault_code_count: 3, hours_since_service: 820, subdivision: "Bala Sub",     timestamp: ago(3.5) },
  { locoId: "UP 8812",   label: "UP 8812 — SD70ACe (Foreign)",speed_mph: 60, fuel_level_pct: 74, oil_pressure_psi: 61, coolant_temp_c: 79, fault_code_count: 0, hours_since_service: 220, subdivision: "Montréal Sub", timestamp: ago(1.0) },
];

export const SIM_TRAINS: TrainReading[] = [
  { trainId: "Q11451-05", label: "Q11451-05 — MacMillan → Taschereau", speed_mph: 52, car_count: 85,  tonnage_tons: 19000, alarm_count: 0, hos_remaining_min: 280, ptc_status: 1, subdivision: "Kingston Sub", timestamp: ago(0.5) },
  { trainId: "M30151-05", label: "M30151-05 — Symington → Walker",     speed_mph: 48, car_count: 113, tonnage_tons: 14000, alarm_count: 1, hos_remaining_min: 95,  ptc_status: 1, subdivision: "Rivers Sub",   timestamp: ago(1.0) },
  { trainId: "L50251-05", label: "L50251-05 — Walker → MacMillan",     speed_mph: 44, car_count: 148, tonnage_tons: 24000, alarm_count: 2, hos_remaining_min: 180, ptc_status: 1, subdivision: "Edson Sub",    timestamp: ago(0.8) },
  { trainId: "T22151-05", label: "T22151-05 — Gordon → Symington",     speed_mph: 0,  car_count: 78,  tonnage_tons: 12000, alarm_count: 0, hos_remaining_min: 32,  ptc_status: 1, subdivision: "Ruel Sub",     timestamp: ago(2.0) },
  { trainId: "F77251-05", label: "F77251-05 — Walker → Symington",     speed_mph: 12, car_count: 96,  tonnage_tons: 16000, alarm_count: 0, hos_remaining_min: 18,  ptc_status: 1, subdivision: "Rivers Sub",   timestamp: ago(0.3) },
  { trainId: "G87351-05", label: "G87351-05 — MacMillan → Capreol",    speed_mph: 55, car_count: 42,  tonnage_tons: 6000,  alarm_count: 0, hos_remaining_min: 340, ptc_status: 1, subdivision: "Bala Sub",     timestamp: ago(1.5) },
];

export const SIM_WAYSIDE: WaysideReading[] = [
  { detectorId: "WILD-KGS-194.2", label: "WILD — Kingston Sub MP 194.2 (Napanee)", wild_kips: 112, hbd_temp_rise: 0,  passage_count_24h: 412, alarm_count_24h: 4, last_calibration_days: 8,  subdivision: "Kingston Sub", timestamp: ago(1.2) },
  { detectorId: "HBD-KGS-194.2",  label: "HBD — Kingston Sub MP 194.2 (Napanee)",  wild_kips: 0,   hbd_temp_rise: 52, passage_count_24h: 412, alarm_count_24h: 2, last_calibration_days: 8,  subdivision: "Kingston Sub", timestamp: ago(1.2) },
  { detectorId: "HBD-RUL-88.4",   label: "HBD — Ruel Sub MP 88.4",                 wild_kips: 0,   hbd_temp_rise: 40, passage_count_24h: 88,  alarm_count_24h: 1, last_calibration_days: 22, subdivision: "Ruel Sub",     timestamp: ago(5.0) },
  { detectorId: "WILD-EDN-112.8", label: "WILD — Edson Sub MP 112.8",              wild_kips: 78,  hbd_temp_rise: 0,  passage_count_24h: 224, alarm_count_24h: 1, last_calibration_days: 14, subdivision: "Edson Sub",    timestamp: ago(0.8) },
  { detectorId: "HBD-BAL-67.2",   label: "HBD — Bala Sub MP 67.2",                 wild_kips: 0,   hbd_temp_rise: 31, passage_count_24h: 156, alarm_count_24h: 0, last_calibration_days: 31, subdivision: "Bala Sub",     timestamp: ago(3.5) },
  { detectorId: "WILD-BAL-67.2",  label: "WILD — Bala Sub MP 67.2",                wild_kips: 68,  hbd_temp_rise: 0,  passage_count_24h: 156, alarm_count_24h: 1, last_calibration_days: 31, subdivision: "Bala Sub",     timestamp: ago(3.5) },
  { detectorId: "AEI-KGS-188.4",  label: "AEI — Kingston Sub MP 188.4",            wild_kips: 0,   hbd_temp_rise: 0,  passage_count_24h: 388, alarm_count_24h: 0, last_calibration_days: 5,  subdivision: "Kingston Sub", timestamp: ago(0.5) },
  { detectorId: "DED-KGS-194.2",  label: "DED — Kingston Sub MP 194.2",            wild_kips: 0,   hbd_temp_rise: 0,  passage_count_24h: 412, alarm_count_24h: 1, last_calibration_days: 8,  subdivision: "Kingston Sub", timestamp: ago(1.2) },
];

export const SIM_SUBDIVISIONS: SubdivisionReading[] = [
  { subId: "Kingston Sub",  label: "Kingston Sub",  car_passage_count_7d: 2890, alarm_count_7d: 18, active_train_count: 4, avg_speed_mph: 54, defect_rate_pct: 2.8, timestamp: ago(0.1) },
  { subId: "Edson Sub",     label: "Edson Sub",     car_passage_count_7d: 1680, alarm_count_7d: 9,  active_train_count: 2, avg_speed_mph: 48, defect_rate_pct: 1.4, timestamp: ago(0.1) },
  { subId: "Rivers Sub",    label: "Rivers Sub",    car_passage_count_7d: 1920, alarm_count_7d: 12, active_train_count: 3, avg_speed_mph: 51, defect_rate_pct: 1.9, timestamp: ago(0.1) },
  { subId: "Bala Sub",      label: "Bala Sub",      car_passage_count_7d: 880,  alarm_count_7d: 6,  active_train_count: 2, avg_speed_mph: 56, defect_rate_pct: 1.1, timestamp: ago(0.1) },
  { subId: "Ruel Sub",      label: "Ruel Sub",      car_passage_count_7d: 740,  alarm_count_7d: 4,  active_train_count: 1, avg_speed_mph: 44, defect_rate_pct: 0.9, timestamp: ago(0.1) },
  { subId: "Montréal Sub",  label: "Montréal Sub",  car_passage_count_7d: 3200, alarm_count_7d: 22, active_train_count: 5, avg_speed_mph: 58, defect_rate_pct: 3.1, timestamp: ago(0.1) },
  { subId: "MacTier Sub",   label: "MacTier Sub",   car_passage_count_7d: 560,  alarm_count_7d: 3,  active_train_count: 1, avg_speed_mph: 50, defect_rate_pct: 0.8, timestamp: ago(0.1) },
  { subId: "Wainwright Sub",label: "Wainwright Sub",car_passage_count_7d: 440,  alarm_count_7d: 2,  active_train_count: 1, avg_speed_mph: 52, defect_rate_pct: 0.6, timestamp: ago(0.1) },
];

export const SIM_YARDS: YardReading[] = [
  { yardId: "MacMillan Yard",    label: "MacMillan Yard — Toronto",     capacity_pct: 76, car_count: 2890, train_count: 15, dwell_time_avg_hours: 18, timestamp: ago(0.1) },
  { yardId: "Taschereau Yard",   label: "Taschereau Yard — Montréal",   capacity_pct: 67, car_count: 2140, train_count: 12, dwell_time_avg_hours: 22, timestamp: ago(0.1) },
  { yardId: "Walker Yard",       label: "Walker Yard — Edmonton",       capacity_pct: 70, car_count: 1680, train_count: 9,  dwell_time_avg_hours: 14, timestamp: ago(0.1) },
  { yardId: "Symington Yard",    label: "Symington Yard — Winnipeg",    capacity_pct: 69, car_count: 1920, train_count: 11, dwell_time_avg_hours: 16, timestamp: ago(0.1) },
  { yardId: "Gordon Yard",       label: "Gordon Yard — Moncton",        capacity_pct: 63, car_count: 880,  train_count: 5,  dwell_time_avg_hours: 28, timestamp: ago(0.1) },
  { yardId: "Harvey Yard",       label: "Harvey Yard — New Orleans",    capacity_pct: 74, car_count: 1340, train_count: 7,  dwell_time_avg_hours: 20, timestamp: ago(0.1) },
];

// ─── Comparison helper ────────────────────────────────────────────────────────

function compare(value: number, op: string, threshold: number): boolean {
  switch (op) {
    case ">":  return value > threshold;
    case ">=": return value >= threshold;
    case "<":  return value < threshold;
    case "<=": return value <= threshold;
    case "=":  return value === threshold;
    case "!=": return value !== threshold;
    default:   return false;
  }
}

function severityFor(metric: string, value: number): MatchResult["severity"] {
  if (metric === "wild_kips") {
    if (value >= 90) return "alarm";
    if (value >= 70) return "alert";
    if (value >= 50) return "elevated";
    return "watch";
  }
  if (metric === "hbd_temp_rise") {
    if (value >= 60) return "alarm";
    if (value >= 40) return "alert";
    if (value >= 25) return "elevated";
    return "watch";
  }
  if (metric === "hos_remaining_min") {
    if (value <= 30) return "alarm";
    if (value <= 60) return "alert";
    if (value <= 120) return "elevated";
    return "watch";
  }
  if (metric === "fuel_level_pct") {
    if (value <= 10) return "alarm";
    if (value <= 20) return "alert";
    return "watch";
  }
  return "watch";
}

// ─── Per-asset-type evaluators ────────────────────────────────────────────────

function getMetricValue(obj: unknown, metric: string): number | null {
  const rec = obj as Record<string, unknown>;
  if (metric in rec) {
    const val = rec[metric];
    if (typeof val === "number") return val;
  }
  return null;
}

function evalConditionOnCar(c: RuleCondition, car: CarReading): number | null {
  return getMetricValue(car, c.metric as string);
}

function evalConditionOnWheel(c: RuleCondition, w: WheelReading): number | null {
  return getMetricValue(w, c.metric as string);
}

function evalConditionOnLoco(c: RuleCondition, l: LocomotiveReading): number | null {
  return getMetricValue(l, c.metric as string);
}

function evalConditionOnTrain(c: RuleCondition, t: TrainReading): number | null {
  return getMetricValue(t, c.metric as string);
}

function evalConditionOnWayside(c: RuleCondition, w: WaysideReading): number | null {
  return getMetricValue(w, c.metric as string);
}

function evalConditionOnSubdivision(c: RuleCondition, s: SubdivisionReading): number | null {
  return getMetricValue(s, c.metric as string);
}

function evalConditionOnYard(c: RuleCondition, y: YardReading): number | null {
  return getMetricValue(y, c.metric as string);
}

// ─── Main evaluator ───────────────────────────────────────────────────────────

/**
 * Evaluate a RuleDefinition against the simulated fleet data.
 * Returns all assets that match the rule (respecting AND/OR logic).
 */
export function evaluateRule(rule: RuleDefinition): MatchResult[] {
  const results: MatchResult[] = [];
  const { logicalOperator, conditions } = rule;

  if (!conditions?.length) return results;

  // For each asset type referenced in the conditions, check each asset
  const assetTypes = new Set(conditions.map(c => c.assetType));

  // ── Cars ──────────────────────────────────────────────────────────────────
  if (assetTypes.has("car")) {
    const carConds = conditions.filter(c => c.assetType === "car");
    for (const car of SIM_CARS) {
      // Filter by assetId if specified (not "Any Car" or blank)
      const relevant = carConds.filter(c => !c.assetId || c.assetId === "Any Car" || c.assetId === car.carId);
      if (!relevant.length) continue;

      const condResults = relevant.map(c => {
        const val = evalConditionOnCar(c, car);
        if (val === null) return false;
        return compare(val, c.operator, Number(c.threshold));
      });

      const passes = logicalOperator === "AND" ? condResults.every(Boolean) : condResults.some(Boolean);
      if (!passes) continue;

      // Find the primary matching condition to show in the result
      const primary = relevant.find((c, i) => condResults[i]);
      if (!primary) continue;
      const val = evalConditionOnCar(primary, car)!;

      results.push({
        assetId: car.carId,
        assetType: "car",
        label: car.label,
        metric: primary.metric,
        value: val,
        unit: primary.unit ?? "",
        operator: primary.operator,
        threshold: Number(primary.threshold),
        subdivision: car.subdivision,
        location: car.location,
        severity: severityFor(primary.metric, val),
        timestamp: car.timestamp,
      });
    }
  }

  // ── Wheels ────────────────────────────────────────────────────────────────
  if (assetTypes.has("wheel")) {
    const wheelConds = conditions.filter(c => c.assetType === "wheel");
    for (const w of SIM_WHEELS) {
      const relevant = wheelConds.filter(c => !c.assetId || c.assetId === w.wheelId);
      if (!relevant.length) continue;

      const condResults = relevant.map(c => {
        const val = evalConditionOnWheel(c, w);
        if (val === null) return false;
        return compare(val, c.operator, Number(c.threshold));
      });

      const passes = logicalOperator === "AND" ? condResults.every(Boolean) : condResults.some(Boolean);
      if (!passes) continue;

      const primary = relevant.find((c, i) => condResults[i]);
      if (!primary) continue;
      const val = evalConditionOnWheel(primary, w)!;

      results.push({
        assetId: w.wheelId,
        assetType: "wheel",
        label: w.label,
        metric: primary.metric,
        value: val,
        unit: primary.unit ?? "",
        operator: primary.operator,
        threshold: Number(primary.threshold),
        subdivision: w.subdivision,
        severity: severityFor(primary.metric, val),
        timestamp: w.timestamp,
      });
    }
  }

  // ── Locomotives ───────────────────────────────────────────────────────────
  if (assetTypes.has("locomotive")) {
    const locoConds = conditions.filter(c => c.assetType === "locomotive");
    for (const l of SIM_LOCOS) {
      const relevant = locoConds.filter(c => !c.assetId || c.assetId === l.locoId);
      if (!relevant.length) continue;

      const condResults = relevant.map(c => {
        const val = evalConditionOnLoco(c, l);
        if (val === null) return false;
        return compare(val, c.operator, Number(c.threshold));
      });

      const passes = logicalOperator === "AND" ? condResults.every(Boolean) : condResults.some(Boolean);
      if (!passes) continue;

      const primary = relevant.find((c, i) => condResults[i]);
      if (!primary) continue;
      const val = evalConditionOnLoco(primary, l)!;

      results.push({
        assetId: l.locoId,
        assetType: "locomotive",
        label: l.label,
        metric: primary.metric,
        value: val,
        unit: primary.unit ?? "",
        operator: primary.operator,
        threshold: Number(primary.threshold),
        subdivision: l.subdivision,
        severity: severityFor(primary.metric, val),
        timestamp: l.timestamp,
      });
    }
  }

  // ── Trains ────────────────────────────────────────────────────────────────
  if (assetTypes.has("train")) {
    const trainConds = conditions.filter(c => c.assetType === "train");
    for (const t of SIM_TRAINS) {
      const relevant = trainConds.filter(c => !c.assetId || c.assetId === "Any Train" || c.assetId === t.trainId);
      if (!relevant.length) continue;

      const condResults = relevant.map(c => {
        const val = evalConditionOnTrain(c, t);
        if (val === null) return false;
        return compare(val, c.operator, Number(c.threshold));
      });

      const passes = logicalOperator === "AND" ? condResults.every(Boolean) : condResults.some(Boolean);
      if (!passes) continue;

      const primary = relevant.find((c, i) => condResults[i]);
      if (!primary) continue;
      const val = evalConditionOnTrain(primary, t)!;

      results.push({
        assetId: t.trainId,
        assetType: "train",
        label: t.label,
        metric: primary.metric,
        value: val,
        unit: primary.unit ?? "",
        operator: primary.operator,
        threshold: Number(primary.threshold),
        subdivision: t.subdivision,
        severity: severityFor(primary.metric, val),
        timestamp: t.timestamp,
      });
    }
  }

  // ── Wayside ───────────────────────────────────────────────────────────────
  if (assetTypes.has("wayside")) {
    const wsideConds = conditions.filter(c => c.assetType === "wayside");
    for (const w of SIM_WAYSIDE) {
      const relevant = wsideConds.filter(c => !c.assetId || c.assetId === w.detectorId);
      if (!relevant.length) continue;

      const condResults = relevant.map(c => {
        const val = evalConditionOnWayside(c, w);
        if (val === null) return false;
        return compare(val, c.operator, Number(c.threshold));
      });

      const passes = logicalOperator === "AND" ? condResults.every(Boolean) : condResults.some(Boolean);
      if (!passes) continue;

      const primary = relevant.find((c, i) => condResults[i]);
      if (!primary) continue;
      const val = evalConditionOnWayside(primary, w)!;

      results.push({
        assetId: w.detectorId,
        assetType: "wayside",
        label: w.label,
        metric: primary.metric,
        value: val,
        unit: primary.unit ?? "",
        operator: primary.operator,
        threshold: Number(primary.threshold),
        subdivision: w.subdivision,
        severity: severityFor(primary.metric, val),
        timestamp: w.timestamp,
      });
    }
  }

  // ── Subdivisions ──────────────────────────────────────────────────────────
  if (assetTypes.has("subdivision")) {
    const subConds = conditions.filter(c => c.assetType === "subdivision");
    for (const s of SIM_SUBDIVISIONS) {
      const relevant = subConds.filter(c => !c.assetId || c.assetId === s.subId);
      if (!relevant.length) continue;

      const condResults = relevant.map(c => {
        const val = evalConditionOnSubdivision(c, s);
        if (val === null) return false;
        return compare(val, c.operator, Number(c.threshold));
      });

      const passes = logicalOperator === "AND" ? condResults.every(Boolean) : condResults.some(Boolean);
      if (!passes) continue;

      const primary = relevant.find((c, i) => condResults[i]);
      if (!primary) continue;
      const val = evalConditionOnSubdivision(primary, s)!;

      results.push({
        assetId: s.subId,
        assetType: "subdivision",
        label: s.label,
        metric: primary.metric,
        value: val,
        unit: primary.unit ?? "",
        operator: primary.operator,
        threshold: Number(primary.threshold),
        severity: "watch",
        timestamp: s.timestamp,
      });
    }
  }

  // ── Yards ─────────────────────────────────────────────────────────────────
  if (assetTypes.has("yard")) {
    const yardConds = conditions.filter(c => c.assetType === "yard");
    for (const y of SIM_YARDS) {
      const relevant = yardConds.filter(c => !c.assetId || c.assetId === y.yardId);
      if (!relevant.length) continue;

      const condResults = relevant.map(c => {
        const val = evalConditionOnYard(c, y);
        if (val === null) return false;
        return compare(val, c.operator, Number(c.threshold));
      });

      const passes = logicalOperator === "AND" ? condResults.every(Boolean) : condResults.some(Boolean);
      if (!passes) continue;

      const primary = relevant.find((c, i) => condResults[i]);
      if (!primary) continue;
      const val = evalConditionOnYard(primary, y)!;

      results.push({
        assetId: y.yardId,
        assetType: "yard",
        label: y.label,
        metric: primary.metric,
        value: val,
        unit: primary.unit ?? "",
        operator: primary.operator,
        threshold: Number(primary.threshold),
        severity: val >= 90 ? "alarm" : val >= 80 ? "alert" : "watch",
        timestamp: y.timestamp,
      });
    }
  }

  // ── Fleet (single row) ────────────────────────────────────────────────────
  if (assetTypes.has("fleet")) {
    const fleetConds = conditions.filter(c => c.assetType === "fleet");
    const fleetData = {
      total_alarm_count: 7,
      total_alert_count: 12,
      ptc_compliance_pct: 99.2,
      cars_in_transit: 14200,
      cars_in_yard: 10850,
    };

    const condResults = fleetConds.map(c => {
      const val = (fleetData as Record<string, number>)[c.metric] ?? null;
      if (val === null) return false;
      return compare(val, c.operator, Number(c.threshold));
    });

    const passes = logicalOperator === "AND" ? condResults.every(Boolean) : condResults.some(Boolean);
    if (passes) {
      const primary = fleetConds.find((c, i) => condResults[i]);
      if (primary) {
        const val = (fleetData as Record<string, number>)[primary.metric];
        results.push({
          assetId: "CN Fleet",
          assetType: "fleet",
          label: "CN Rail Fleet (All Assets)",
          metric: primary.metric,
          value: val,
          unit: primary.unit ?? "",
          operator: primary.operator,
          threshold: Number(primary.threshold),
          severity: "watch",
          timestamp: now,
        });
      }
    }
  }

  return results;
}

/**
 * Get the most recent match timestamp from a list of results.
 */
export function lastMatchedAt(results: MatchResult[]): Date | null {
  if (!results.length) return null;
  return results.reduce((latest, r) => r.timestamp > latest ? r.timestamp : latest, results[0].timestamp);
}

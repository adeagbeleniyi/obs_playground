/**
 * Shared rule engine types — used by both the frontend rule builder
 * and the backend tRPC routers.
 *
 * A "rule" is composed of one or more conditions joined by a logical operator.
 * Each condition targets a specific asset and metric with a comparison operator
 * and threshold value.
 */

// ─── Asset types ─────────────────────────────────────────────────────────────

export type AssetType =
  | "car"          // A specific railcar by reporting mark (e.g. TTX 891204)
  | "wheel"        // A specific wheel/axle on a car (e.g. TTX 891204 / Axle B2-Right)
  | "locomotive"   // A specific locomotive (e.g. CN 3012)
  | "train"        // A specific train symbol (e.g. Q11451-05)
  | "wayside"      // A specific wayside detector (e.g. HBD at Kingston MP 194.2)
  | "subdivision"  // An entire subdivision (e.g. Kingston Sub)
  | "yard"         // A specific yard (e.g. MacMillan Yard)
  | "fleet";       // The entire fleet (no specific asset)

// ─── Metric catalogue per asset type ─────────────────────────────────────────

export type CarMetric =
  | "wild_kips"           // WILD wheel impact load in kips
  | "hbd_temp_rise"       // HBD bearing temp rise above ambient (°C)
  | "ded_status"          // DED dragging equipment (0=clear, 1=triggered)
  | "weight_tons"         // WIM weight in tons
  | "speed_mph"           // Train speed at detector (mph)
  | "tads_score"          // TADS truck instability score
  | "defect_count"        // Number of open defects
  | "days_since_inspection"; // Days since last mechanical inspection

export type WheelMetric =
  | "wild_kips"           // WILD reading for this specific axle
  | "hbd_temp_rise"       // HBD reading for this specific axle
  | "tread_wear_mm"       // Estimated tread wear (mm)
  | "flange_height_mm";   // Flange height (mm)

export type LocomotiveMetric =
  | "speed_mph"
  | "tractive_effort_pct" // Tractive effort as % of rated
  | "fuel_level_pct"      // Fuel level %
  | "oil_pressure_psi"
  | "coolant_temp_c"
  | "fault_code_count"    // Number of active fault codes
  | "hours_since_service";

export type TrainMetric =
  | "speed_mph"
  | "car_count"
  | "tonnage_tons"
  | "alarm_count"         // Number of active ALARM conditions in consist
  | "hos_remaining_min"   // Crew HOS remaining (minutes)
  | "ptc_status";         // PTC active (1) or not (0)

export type WaysideMetric =
  | "wild_kips"
  | "hbd_temp_rise"
  | "passage_count_24h"   // Cars passed in last 24 hours
  | "alarm_count_24h"     // Alarms triggered in last 24 hours
  | "last_calibration_days"; // Days since last calibration

export type SubdivisionMetric =
  | "car_passage_count_7d"
  | "alarm_count_7d"
  | "active_train_count"
  | "avg_speed_mph"
  | "defect_rate_pct";    // % of cars with defects detected

export type YardMetric =
  | "capacity_pct"
  | "car_count"
  | "train_count"
  | "dwell_time_avg_hours";

export type FleetMetric =
  | "total_alarm_count"
  | "total_alert_count"
  | "ptc_compliance_pct"
  | "cars_in_transit"
  | "cars_in_yard";

export type Metric =
  | CarMetric | WheelMetric | LocomotiveMetric | TrainMetric
  | WaysideMetric | SubdivisionMetric | YardMetric | FleetMetric;

// ─── Comparison operators ─────────────────────────────────────────────────────

export type ComparisonOperator = ">" | ">=" | "<" | "<=" | "=" | "!=" | "contains" | "not_contains";

// ─── Logical operators ────────────────────────────────────────────────────────

export type LogicalOperator = "AND" | "OR";

// ─── A single condition ───────────────────────────────────────────────────────

export interface RuleCondition {
  id: string;               // UUID for React key
  assetType: AssetType;
  assetId: string;          // The specific asset identifier (e.g. "TTX 891204", "Kingston Sub")
  assetLabel?: string;      // Human-readable label (e.g. "TTX 891204 / Axle B2-Right")
  metric: Metric;
  operator: ComparisonOperator;
  threshold: number | string;
  unit?: string;            // Display unit (e.g. "kips", "°C", "%")
  timeWindowHours?: number; // Optional: evaluate over last N hours (default: real-time)
}

// ─── A complete rule (one or more conditions) ─────────────────────────────────

export interface RuleDefinition {
  logicalOperator: LogicalOperator; // How to join multiple conditions
  conditions: RuleCondition[];
}

// ─── Metric metadata (for the UI dropdowns) ──────────────────────────────────

export interface MetricMeta {
  value: Metric;
  label: string;
  unit: string;
  defaultThreshold: number;
  operators: ComparisonOperator[];
  description: string;
}

export const METRIC_CATALOGUE: Record<AssetType, MetricMeta[]> = {
  car: [
    { value: "wild_kips", label: "WILD — Wheel Impact Load", unit: "kips", defaultThreshold: 90, operators: [">", ">=", "<", "<=", "=", "!="], description: "Wheel impact force measured by WILD detector" },
    { value: "hbd_temp_rise", label: "HBD — Bearing Temp Rise", unit: "°C above ambient", defaultThreshold: 60, operators: [">", ">=", "<", "<="], description: "Hot box detector bearing temperature rise above ambient" },
    { value: "ded_status", label: "DED — Dragging Equipment", unit: "", defaultThreshold: 1, operators: ["="], description: "Dragging equipment detector triggered (1 = triggered)" },
    { value: "weight_tons", label: "WIM — Car Weight", unit: "tons", defaultThreshold: 286, operators: [">", ">=", "<", "<="], description: "Weigh-in-motion car weight" },
    { value: "speed_mph", label: "Speed at Detector", unit: "mph", defaultThreshold: 60, operators: [">", ">=", "<", "<="], description: "Train speed when passing detector" },
    { value: "defect_count", label: "Open Defect Count", unit: "defects", defaultThreshold: 1, operators: [">", ">=", "="], description: "Number of unresolved defect flags" },
    { value: "days_since_inspection", label: "Days Since Inspection", unit: "days", defaultThreshold: 90, operators: [">", ">="], description: "Days elapsed since last mechanical inspection" },
  ],
  wheel: [
    { value: "wild_kips", label: "WILD — Axle Impact Load", unit: "kips", defaultThreshold: 70, operators: [">", ">=", "<", "<=", "="], description: "Wheel impact load on this specific axle" },
    { value: "hbd_temp_rise", label: "HBD — Axle Bearing Temp", unit: "°C above ambient", defaultThreshold: 40, operators: [">", ">=", "<", "<="], description: "Bearing temperature rise on this specific axle" },
    { value: "tread_wear_mm", label: "Tread Wear", unit: "mm", defaultThreshold: 32, operators: [">", ">="], description: "Estimated tread wear depth" },
    { value: "flange_height_mm", label: "Flange Height", unit: "mm", defaultThreshold: 38, operators: [">", ">=", "<", "<="], description: "Wheel flange height measurement" },
  ],
  locomotive: [
    { value: "speed_mph", label: "Speed", unit: "mph", defaultThreshold: 70, operators: [">", ">=", "<", "<="], description: "Locomotive speed" },
    { value: "fuel_level_pct", label: "Fuel Level", unit: "%", defaultThreshold: 15, operators: ["<", "<="], description: "Fuel tank level percentage" },
    { value: "oil_pressure_psi", label: "Oil Pressure", unit: "PSI", defaultThreshold: 30, operators: ["<", "<="], description: "Engine oil pressure" },
    { value: "coolant_temp_c", label: "Coolant Temperature", unit: "°C", defaultThreshold: 95, operators: [">", ">="], description: "Engine coolant temperature" },
    { value: "fault_code_count", label: "Active Fault Codes", unit: "faults", defaultThreshold: 1, operators: [">", ">=", "="], description: "Number of active diagnostic fault codes" },
    { value: "hours_since_service", label: "Hours Since Service", unit: "hours", defaultThreshold: 720, operators: [">", ">="], description: "Hours elapsed since last scheduled service" },
  ],
  train: [
    { value: "speed_mph", label: "Train Speed", unit: "mph", defaultThreshold: 60, operators: [">", ">=", "<", "<="], description: "Current train speed" },
    { value: "alarm_count", label: "Active Alarms in Consist", unit: "alarms", defaultThreshold: 1, operators: [">", ">=", "="], description: "Number of ALARM conditions in the train consist" },
    { value: "hos_remaining_min", label: "Crew HOS Remaining", unit: "min", defaultThreshold: 60, operators: ["<", "<="], description: "Crew hours-of-service remaining in minutes" },
    { value: "car_count", label: "Car Count", unit: "cars", defaultThreshold: 150, operators: [">", ">=", "<", "<="], description: "Number of cars in consist" },
    { value: "tonnage_tons", label: "Total Tonnage", unit: "tons", defaultThreshold: 15000, operators: [">", ">="], description: "Total train tonnage" },
    { value: "ptc_status", label: "PTC Status", unit: "", defaultThreshold: 0, operators: ["="], description: "PTC active (1) or inactive (0)" },
  ],
  wayside: [
    { value: "wild_kips", label: "WILD — Peak Reading", unit: "kips", defaultThreshold: 70, operators: [">", ">="], description: "Peak WILD reading at this detector site" },
    { value: "hbd_temp_rise", label: "HBD — Peak Temp Rise", unit: "°C above ambient", defaultThreshold: 40, operators: [">", ">="], description: "Peak HBD reading at this detector site" },
    { value: "alarm_count_24h", label: "Alarms in Last 24h", unit: "alarms", defaultThreshold: 3, operators: [">", ">="], description: "Number of ALARM events at this site in 24 hours" },
    { value: "passage_count_24h", label: "Car Passages (24h)", unit: "cars", defaultThreshold: 200, operators: [">", ">=", "<", "<="], description: "Number of cars that passed this detector in 24 hours" },
    { value: "last_calibration_days", label: "Days Since Calibration", unit: "days", defaultThreshold: 30, operators: [">", ">="], description: "Days since detector was last calibrated" },
  ],
  subdivision: [
    { value: "car_passage_count_7d", label: "Car Passages (7 days)", unit: "cars", defaultThreshold: 500, operators: [">", ">=", "<", "<="], description: "Total car passages through subdivision in 7 days" },
    { value: "alarm_count_7d", label: "Alarms (7 days)", unit: "alarms", defaultThreshold: 5, operators: [">", ">="], description: "Total ALARM events in subdivision over 7 days" },
    { value: "active_train_count", label: "Active Trains", unit: "trains", defaultThreshold: 10, operators: [">", ">=", "<", "<="], description: "Number of trains currently active in subdivision" },
    { value: "defect_rate_pct", label: "Defect Detection Rate", unit: "%", defaultThreshold: 2, operators: [">", ">="], description: "Percentage of cars with defects detected" },
  ],
  yard: [
    { value: "capacity_pct", label: "Yard Capacity", unit: "%", defaultThreshold: 90, operators: [">", ">="], description: "Percentage of yard capacity in use" },
    { value: "car_count", label: "Cars in Yard", unit: "cars", defaultThreshold: 3000, operators: [">", ">=", "<", "<="], description: "Total cars currently in yard" },
    { value: "dwell_time_avg_hours", label: "Avg Car Dwell Time", unit: "hours", defaultThreshold: 24, operators: [">", ">="], description: "Average car dwell time in yard" },
  ],
  fleet: [
    { value: "total_alarm_count", label: "Total Active Alarms", unit: "alarms", defaultThreshold: 10, operators: [">", ">="], description: "Total ALARM conditions across the entire fleet" },
    { value: "ptc_compliance_pct", label: "PTC Compliance", unit: "%", defaultThreshold: 95, operators: ["<", "<="], description: "Fleet-wide PTC compliance percentage" },
    { value: "cars_in_transit", label: "Cars in Transit", unit: "cars", defaultThreshold: 5000, operators: [">", ">=", "<", "<="], description: "Total cars currently in active consists" },
  ],
};

// ─── Known asset IDs for autocomplete ────────────────────────────────────────

export const KNOWN_ASSETS: Record<AssetType, { id: string; label: string }[]> = {
  car: [
    { id: "TTX 891204", label: "TTX 891204 — Flatcar 89ft" },
    { id: "BNSF 584291", label: "BNSF 584291 — Boxcar 60ft" },
    { id: "CN 714823", label: "CN 714823 — Gondola 52ft" },
    { id: "CPKC 334521", label: "CPKC 334521 — Covered Hopper 60ft" },
    { id: "UP 448812", label: "UP 448812 — Tank Car 60ft (HAZMAT)" },
    { id: "TTX 445521", label: "TTX 445521 — Flatcar 89ft" },
    { id: "NS 228834", label: "NS 228834 — Boxcar 60ft" },
    { id: "TTGX 8841", label: "TTGX 8841 — Flatcar" },
    { id: "CN 892341", label: "CN 892341 — Gondola" },
    { id: "BNSF 771234", label: "BNSF 771234 — Boxcar" },
  ],
  wheel: [
    { id: "TTX 891204 / Axle A1-Left", label: "TTX 891204 — Axle A1-Left" },
    { id: "TTX 891204 / Axle A1-Right", label: "TTX 891204 — Axle A1-Right" },
    { id: "TTX 891204 / Axle A2-Left", label: "TTX 891204 — Axle A2-Left" },
    { id: "TTX 891204 / Axle A2-Right", label: "TTX 891204 — Axle A2-Right" },
    { id: "TTX 891204 / Axle B1-Left", label: "TTX 891204 — Axle B1-Left" },
    { id: "TTX 891204 / Axle B1-Right", label: "TTX 891204 — Axle B1-Right" },
    { id: "TTX 891204 / Axle B2-Left", label: "TTX 891204 — Axle B2-Left" },
    { id: "TTX 891204 / Axle B2-Right", label: "TTX 891204 — Axle B2-Right (ALARM)" },
    { id: "BNSF 584291 / Axle A1-Left", label: "BNSF 584291 — Axle A1-Left (ALERT)" },
    { id: "UP 448812 / Axle A1-Left", label: "UP 448812 — Axle A1-Left" },
    { id: "TTGX 8841 / Axle A2-Right", label: "TTGX 8841 — Axle A2-Right (WATCH)" },
  ],
  locomotive: [
    { id: "CN 3012", label: "CN 3012 — ES44AC" },
    { id: "CN 2817", label: "CN 2817 — SD70M-2" },
    { id: "CN 3156", label: "CN 3156 — ES44DC" },
    { id: "CN 2244", label: "CN 2244 — SD40-2" },
    { id: "BNSF 6821", label: "BNSF 6821 — ES44C4 (Foreign)" },
    { id: "UP 8812", label: "UP 8812 — SD70ACe (Foreign)" },
  ],
  train: [
    { id: "Q11451-05", label: "Q11451-05 — Kingston Sub" },
    { id: "M30151-05", label: "M30151-05 — Rivers Sub (1 ALARM)" },
    { id: "L50251-05", label: "L50251-05 — Edson Sub (2 ALARMS)" },
    { id: "T22151-05", label: "T22151-05 — Kingston Sub (HOS 30m)" },
    { id: "F77251-05", label: "F77251-05 — Ruel Sub (HOS CRITICAL)" },
    { id: "G87351-05", label: "G87351-05 — Bala Sub" },
  ],
  wayside: [
    { id: "HBD-KGS-194.2", label: "HBD — Kingston Sub MP 194.2 (Napanee)" },
    { id: "WILD-KGS-194.2", label: "WILD — Kingston Sub MP 194.2 (Napanee)" },
    { id: "HBD-RUL-88.4", label: "HBD — Ruel Sub MP 88.4" },
    { id: "WILD-EDN-112.8", label: "WILD — Edson Sub MP 112.8" },
    { id: "HBD-BAL-67.2", label: "HBD — Bala Sub MP 67.2" },
    { id: "WILD-BAL-67.2", label: "WILD — Bala Sub MP 67.2" },
    { id: "AEI-KGS-188.4", label: "AEI — Kingston Sub MP 188.4" },
    { id: "DED-KGS-194.2", label: "DED — Kingston Sub MP 194.2" },
  ],
  subdivision: [
    { id: "Kingston Sub", label: "Kingston Sub" },
    { id: "Edson Sub", label: "Edson Sub" },
    { id: "Montréal Sub", label: "Montréal Sub" },
    { id: "Rivers Sub", label: "Rivers Sub" },
    { id: "Bala Sub", label: "Bala Sub" },
    { id: "Ruel Sub", label: "Ruel Sub" },
    { id: "Oakville Sub", label: "Oakville Sub" },
    { id: "MacTier Sub", label: "MacTier Sub" },
    { id: "Wainwright Sub", label: "Wainwright Sub" },
    { id: "Strathroy Sub", label: "Strathroy Sub" },
  ],
  yard: [
    { id: "MacMillan Yard", label: "MacMillan Yard — Toronto" },
    { id: "Taschereau Yard", label: "Taschereau Yard — Montréal" },
    { id: "Walker Yard", label: "Walker Yard — Edmonton" },
    { id: "Symington Yard", label: "Symington Yard — Winnipeg" },
  ],
  fleet: [
    { id: "CN Fleet", label: "CN Rail Fleet (All Assets)" },
  ],
};

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  car: "Railcar",
  wheel: "Wheel / Axle",
  locomotive: "Locomotive",
  train: "Train",
  wayside: "Wayside Detector",
  subdivision: "Subdivision",
  yard: "Yard",
  fleet: "Fleet (All)",
};

export const OPERATOR_LABELS: Record<ComparisonOperator, string> = {
  ">": "> Greater than",
  ">=": "≥ At least",
  "<": "< Less than",
  "<=": "≤ At most",
  "=": "= Equal to",
  "!=": "≠ Not equal to",
  "contains": "contains",
  "not_contains": "does not contain",
};

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
  // Additional cars
  { carId: "CN 412847",    label: "CN 412847 — Gondola 52ft",             wild_kips: 42,  hbd_temp_rise: 10, ded_status: 0, weight_tons: 198, speed_mph: 52, defect_count: 0, days_since_inspection: 8,  subdivision: "Kingston Sub",  location: "MP 188.4", timestamp: ago(0.3) },
  { carId: "CSX 441221",   label: "CSX 441221 — Boxcar 60ft",             wild_kips: 58,  hbd_temp_rise: 24, ded_status: 0, weight_tons: 108, speed_mph: 44, defect_count: 0, days_since_inspection: 42, subdivision: "Capreol Sub",   location: "MP 44.2",  timestamp: ago(1.8) },
  { carId: "CN 331204",    label: "CN 331204 — Covered Hopper",           wild_kips: 38,  hbd_temp_rise: 6,  ded_status: 0, weight_tons: 224, speed_mph: 48, defect_count: 0, days_since_inspection: 19, subdivision: "MacTier Sub",   location: "MP 44.2",  timestamp: ago(2.5) },
  { carId: "CSXT 4412",    label: "CSXT 4412 — Gondola",                  wild_kips: 142, hbd_temp_rise: 62, ded_status: 0, weight_tons: 134, speed_mph: 48, defect_count: 3, days_since_inspection: 88, subdivision: "Ruel Sub",      location: "MP 79.9",  timestamp: ago(4.5) },
  { carId: "UP 882341",    label: "UP 882341 — Autorack",                  wild_kips: 36,  hbd_temp_rise: 8,  ded_status: 0, weight_tons: 62,  speed_mph: 55, defect_count: 0, days_since_inspection: 31, subdivision: "Wainwright Sub", location: "MP 122.4", timestamp: ago(1.1) },
  { carId: "CN 778812",    label: "CN 778812 — Tank Car (HAZMAT)",         wild_kips: 55,  hbd_temp_rise: 16, ded_status: 0, weight_tons: 188, speed_mph: 44, defect_count: 0, days_since_inspection: 14, subdivision: "Edson Sub",     location: "MP 158.0", timestamp: ago(3.0) },
  { carId: "BNSF 992341",  label: "BNSF 992341 — Intermodal",             wild_kips: 48,  hbd_temp_rise: 12, ded_status: 0, weight_tons: 88,  speed_mph: 60, defect_count: 0, days_since_inspection: 22, subdivision: "Montréal Sub",  location: "MP 88.4",  timestamp: ago(0.9) },
  { carId: "CN 554321",    label: "CN 554321 — Coil Car",                  wild_kips: 82,  hbd_temp_rise: 28, ded_status: 0, weight_tons: 178, speed_mph: 44, defect_count: 1, days_since_inspection: 55, subdivision: "Kingston Sub",  location: "MP 100.2", timestamp: ago(2.2) },
  { carId: "NS 334812",    label: "NS 334812 — Centerbeam",               wild_kips: 44,  hbd_temp_rise: 9,  ded_status: 0, weight_tons: 96,  speed_mph: 52, defect_count: 0, days_since_inspection: 28, subdivision: "Capreol Sub",   location: "MP 178.4", timestamp: ago(3.8) },
  { carId: "TTX 221043",   label: "TTX 221043 — Flatcar 89ft",            wild_kips: 65,  hbd_temp_rise: 19, ded_status: 0, weight_tons: 122, speed_mph: 52, defect_count: 0, days_since_inspection: 44, subdivision: "Rivers Sub",    location: "MP 90.1",  timestamp: ago(1.4) },
  { carId: "CP 441882",    label: "CP 441882 — Covered Hopper",           wild_kips: 39,  hbd_temp_rise: 7,  ded_status: 0, weight_tons: 218, speed_mph: 48, defect_count: 0, days_since_inspection: 16, subdivision: "Wainwright Sub", location: "MP 44.8",  timestamp: ago(0.7) },
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
  // Additional wheels
  { wheelId: "CSXT 4412 / Axle A2-Left",   label: "CSXT 4412 — Axle A2-Left",    carId: "CSXT 4412",   wild_kips: 142, hbd_temp_rise: 62, tread_wear_mm: 41, flange_height_mm: 42, subdivision: "Ruel Sub",     timestamp: ago(4.5) },
  { wheelId: "CSXT 4412 / Axle B1-Right",  label: "CSXT 4412 — Axle B1-Right",   carId: "CSXT 4412",   wild_kips: 98,  hbd_temp_rise: 44, tread_wear_mm: 38, flange_height_mm: 40, subdivision: "Ruel Sub",     timestamp: ago(4.5) },
  { wheelId: "CN 554321 / Axle A1-Right",  label: "CN 554321 — Axle A1-Right",   carId: "CN 554321",   wild_kips: 82,  hbd_temp_rise: 28, tread_wear_mm: 29, flange_height_mm: 37, subdivision: "Kingston Sub", timestamp: ago(2.2) },
  { wheelId: "CN 554321 / Axle B2-Left",   label: "CN 554321 — Axle B2-Left",    carId: "CN 554321",   wild_kips: 74,  hbd_temp_rise: 22, tread_wear_mm: 27, flange_height_mm: 36, subdivision: "Kingston Sub", timestamp: ago(2.2) },
  { wheelId: "TTX 221043 / Axle A1-Left",  label: "TTX 221043 — Axle A1-Left",   carId: "TTX 221043",  wild_kips: 65,  hbd_temp_rise: 19, tread_wear_mm: 24, flange_height_mm: 35, subdivision: "Rivers Sub",   timestamp: ago(1.4) },
  { wheelId: "UP 448812 / Axle B2-Right",  label: "UP 448812 — Axle B2-Right",   carId: "UP 448812",   wild_kips: 58,  hbd_temp_rise: 18, tread_wear_mm: 21, flange_height_mm: 34, subdivision: "Edson Sub",    timestamp: ago(0.8) },
  { wheelId: "CN 778812 / Axle A1-Left",   label: "CN 778812 — Axle A1-Left",    carId: "CN 778812",   wild_kips: 55,  hbd_temp_rise: 16, tread_wear_mm: 20, flange_height_mm: 34, subdivision: "Edson Sub",    timestamp: ago(3.0) },
  { wheelId: "CSX 441221 / Axle B1-Right", label: "CSX 441221 — Axle B1-Right",  carId: "CSX 441221",  wild_kips: 58,  hbd_temp_rise: 24, tread_wear_mm: 23, flange_height_mm: 35, subdivision: "Capreol Sub",  timestamp: ago(1.8) },
];

export const SIM_LOCOS: LocomotiveReading[] = [
  { locoId: "CN 3012",   label: "CN 3012 — ES44AC",          speed_mph: 52, fuel_level_pct: 68, oil_pressure_psi: 62, coolant_temp_c: 82, fault_code_count: 0, hours_since_service: 312, subdivision: "Kingston Sub", timestamp: ago(1.2) },
  { locoId: "CN 2817",   label: "CN 2817 — SD70M-2",         speed_mph: 48, fuel_level_pct: 41, oil_pressure_psi: 58, coolant_temp_c: 88, fault_code_count: 1, hours_since_service: 580, subdivision: "Rivers Sub",   timestamp: ago(2.1) },
  { locoId: "CN 3156",   label: "CN 3156 — ES44DC",          speed_mph: 44, fuel_level_pct: 22, oil_pressure_psi: 55, coolant_temp_c: 91, fault_code_count: 2, hours_since_service: 710, subdivision: "Edson Sub",    timestamp: ago(0.8) },
  { locoId: "CN 2244",   label: "CN 2244 — SD40-2",          speed_mph: 0,  fuel_level_pct: 88, oil_pressure_psi: 64, coolant_temp_c: 72, fault_code_count: 0, hours_since_service: 88,  subdivision: "Ruel Sub",     timestamp: ago(5.0) },
  { locoId: "BNSF 6821", label: "BNSF 6821 — ES44C4",        speed_mph: 55, fuel_level_pct: 12, oil_pressure_psi: 52, coolant_temp_c: 96, fault_code_count: 3, hours_since_service: 820, subdivision: "Bala Sub",     timestamp: ago(3.5) },
  { locoId: "UP 8812",   label: "UP 8812 — SD70ACe (Foreign)",speed_mph: 60, fuel_level_pct: 74, oil_pressure_psi: 61, coolant_temp_c: 79, fault_code_count: 0, hours_since_service: 220, subdivision: "Montréal Sub", timestamp: ago(1.0) },
  // Additional locomotives
  { locoId: "CN 3864",   label: "CN 3864 — ES44AC",          speed_mph: 0,  fuel_level_pct: 58, oil_pressure_psi: 44, coolant_temp_c: 74, fault_code_count: 4, hours_since_service: 1020, subdivision: "Ruel Sub",     timestamp: ago(0.5) },
  { locoId: "CN 5501",   label: "CN 5501 — SD70M-2",         speed_mph: 48, fuel_level_pct: 72, oil_pressure_psi: 61, coolant_temp_c: 81, fault_code_count: 0, hours_since_service: 188, subdivision: "Bala Sub",     timestamp: ago(1.0) },
  { locoId: "CN 4412",   label: "CN 4412 — ES44DC",          speed_mph: 0,  fuel_level_pct: 34, oil_pressure_psi: 48, coolant_temp_c: 78, fault_code_count: 2, hours_since_service: 640, subdivision: "Kingston Sub", timestamp: ago(0.2) },
  { locoId: "CN 8012",   label: "CN 8012 — SD70M-2",         speed_mph: 55, fuel_level_pct: 81, oil_pressure_psi: 63, coolant_temp_c: 80, fault_code_count: 0, hours_since_service: 244, subdivision: "Kingston Sub", timestamp: ago(0.8) },
  { locoId: "CN 7701",   label: "CN 7701 — ES44AC",          speed_mph: 44, fuel_level_pct: 44, oil_pressure_psi: 56, coolant_temp_c: 84, fault_code_count: 1, hours_since_service: 488, subdivision: "Ruel Sub",     timestamp: ago(2.8) },
  { locoId: "CN 2743",   label: "CN 2743 — SD40-2",          speed_mph: 52, fuel_level_pct: 66, oil_pressure_psi: 60, coolant_temp_c: 83, fault_code_count: 0, hours_since_service: 312, subdivision: "Bala Sub",     timestamp: ago(1.5) },
  { locoId: "CN 9201",   label: "CN 9201 — ES44DC",          speed_mph: 44, fuel_level_pct: 28, oil_pressure_psi: 50, coolant_temp_c: 89, fault_code_count: 2, hours_since_service: 680, subdivision: "Wainwright Sub", timestamp: ago(1.2) },
  { locoId: "CN 5812",   label: "CN 5812 — ES44AC",          speed_mph: 0,  fuel_level_pct: 18, oil_pressure_psi: 42, coolant_temp_c: 92, fault_code_count: 5, hours_since_service: 1180, subdivision: "Edson Sub",    timestamp: ago(0.4) },
];

export const SIM_TRAINS: TrainReading[] = [
  { trainId: "Q11451-05", label: "Q11451-05 — MacMillan → Taschereau", speed_mph: 52, car_count: 85,  tonnage_tons: 19000, alarm_count: 0, hos_remaining_min: 280, ptc_status: 1, subdivision: "Kingston Sub", timestamp: ago(0.5) },
  { trainId: "M30151-05", label: "M30151-05 — Symington → Walker",     speed_mph: 48, car_count: 113, tonnage_tons: 14000, alarm_count: 1, hos_remaining_min: 95,  ptc_status: 1, subdivision: "Rivers Sub",   timestamp: ago(1.0) },
  { trainId: "L50251-05", label: "L50251-05 — Walker → MacMillan",     speed_mph: 44, car_count: 148, tonnage_tons: 24000, alarm_count: 2, hos_remaining_min: 180, ptc_status: 1, subdivision: "Edson Sub",    timestamp: ago(0.8) },
  { trainId: "T22151-05", label: "T22151-05 — Gordon → Symington",     speed_mph: 0,  car_count: 78,  tonnage_tons: 12000, alarm_count: 0, hos_remaining_min: 32,  ptc_status: 1, subdivision: "Ruel Sub",     timestamp: ago(2.0) },
  { trainId: "F77251-05", label: "F77251-05 — Walker → Symington",     speed_mph: 12, car_count: 96,  tonnage_tons: 16000, alarm_count: 0, hos_remaining_min: 18,  ptc_status: 1, subdivision: "Rivers Sub",   timestamp: ago(0.3) },
  { trainId: "G87351-05", label: "G87351-05 — MacMillan → Capreol",    speed_mph: 55, car_count: 42,  tonnage_tons: 6000,  alarm_count: 0, hos_remaining_min: 340, ptc_status: 1, subdivision: "Bala Sub",     timestamp: ago(1.5) },
  // Additional trains
  { trainId: "H22351-05", label: "H22351-05 — Walker → Biggar",        speed_mph: 58, car_count: 88,  tonnage_tons: 11000, alarm_count: 0, hos_remaining_min: 210, ptc_status: 1, subdivision: "Wainwright Sub", timestamp: ago(1.2) },
  { trainId: "K44151-05", label: "K44151-05 — MacMillan → Gordon",     speed_mph: 52, car_count: 72,  tonnage_tons: 9500,  alarm_count: 1, hos_remaining_min: 155, ptc_status: 1, subdivision: "MacTier Sub",   timestamp: ago(0.9) },
  { trainId: "N88251-05", label: "N88251-05 — Taschereau → MacMillan", speed_mph: 60, car_count: 94,  tonnage_tons: 13000, alarm_count: 0, hos_remaining_min: 312, ptc_status: 1, subdivision: "Montréal Sub",  timestamp: ago(0.4) },
  { trainId: "P33151-05", label: "P33151-05 — Gordon → Taschereau",    speed_mph: 44, car_count: 118, tonnage_tons: 18000, alarm_count: 3, hos_remaining_min: 44,  ptc_status: 0, subdivision: "Capreol Sub",   timestamp: ago(1.8) },
  { trainId: "R55251-05", label: "R55251-05 — Walker → Symington",     speed_mph: 48, car_count: 102, tonnage_tons: 15000, alarm_count: 0, hos_remaining_min: 188, ptc_status: 1, subdivision: "Rivers Sub",    timestamp: ago(2.2) },
  { trainId: "S11451-05", label: "S11451-05 — Symington → MacMillan",  speed_mph: 55, car_count: 66,  tonnage_tons: 8800,  alarm_count: 0, hos_remaining_min: 244, ptc_status: 1, subdivision: "Rivers Sub",    timestamp: ago(0.6) },
  { trainId: "V22351-05", label: "V22351-05 — MacMillan → Walker",     speed_mph: 0,  car_count: 134, tonnage_tons: 22000, alarm_count: 1, hos_remaining_min: 68,  ptc_status: 1, subdivision: "Edson Sub",     timestamp: ago(3.0) },
  { trainId: "W44151-05", label: "W44151-05 — Taschereau → Gordon",    speed_mph: 52, car_count: 58,  tonnage_tons: 7200,  alarm_count: 0, hos_remaining_min: 288, ptc_status: 1, subdivision: "Moncton Sub",   timestamp: ago(1.1) },
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
  // Additional wayside detectors
  { detectorId: "WILD-RUL-79.9",  label: "WILD — Ruel Sub MP 79.9",                wild_kips: 142, hbd_temp_rise: 0,  passage_count_24h: 88,  alarm_count_24h: 3, last_calibration_days: 18, subdivision: "Ruel Sub",     timestamp: ago(4.5) },
  { detectorId: "HBD-RUL-79.9",   label: "HBD — Ruel Sub MP 79.9",                 wild_kips: 0,   hbd_temp_rise: 62, passage_count_24h: 88,  alarm_count_24h: 2, last_calibration_days: 18, subdivision: "Ruel Sub",     timestamp: ago(4.5) },
  { detectorId: "WILD-CAP-44.2",  label: "WILD — Capreol Sub MP 44.2",             wild_kips: 44,  hbd_temp_rise: 0,  passage_count_24h: 144, alarm_count_24h: 0, last_calibration_days: 12, subdivision: "Capreol Sub",  timestamp: ago(1.8) },
  { detectorId: "HBD-CAP-44.2",   label: "HBD — Capreol Sub MP 44.2",              wild_kips: 0,   hbd_temp_rise: 28, passage_count_24h: 144, alarm_count_24h: 1, last_calibration_days: 12, subdivision: "Capreol Sub",  timestamp: ago(1.8) },
  { detectorId: "WILD-MTL-88.4",  label: "WILD — Montréal Sub MP 88.4",            wild_kips: 48,  hbd_temp_rise: 0,  passage_count_24h: 622, alarm_count_24h: 2, last_calibration_days: 4,  subdivision: "Montréal Sub", timestamp: ago(0.9) },
  { detectorId: "HBD-MTL-88.4",   label: "HBD — Montréal Sub MP 88.4",             wild_kips: 0,   hbd_temp_rise: 34, passage_count_24h: 622, alarm_count_24h: 1, last_calibration_days: 4,  subdivision: "Montréal Sub", timestamp: ago(0.9) },
  { detectorId: "WILD-WAI-122.4", label: "WILD — Wainwright Sub MP 122.4",         wild_kips: 55,  hbd_temp_rise: 0,  passage_count_24h: 112, alarm_count_24h: 1, last_calibration_days: 21, subdivision: "Wainwright Sub", timestamp: ago(1.2) },
  { detectorId: "DED-BAL-18.7",   label: "DED — Bala Sub MP 18.7",                 wild_kips: 0,   hbd_temp_rise: 0,  passage_count_24h: 156, alarm_count_24h: 0, last_calibration_days: 9,  subdivision: "Bala Sub",     timestamp: ago(2.0) },
  { detectorId: "TADS-KGS-100.2", label: "TADS — Kingston Sub MP 100.2",           wild_kips: 0,   hbd_temp_rise: 0,  passage_count_24h: 388, alarm_count_24h: 0, last_calibration_days: 15, subdivision: "Kingston Sub", timestamp: ago(1.5) },
  { detectorId: "HBD-EDN-158.0",  label: "HBD — Edson Sub MP 158.0",               wild_kips: 0,   hbd_temp_rise: 24, passage_count_24h: 88,  alarm_count_24h: 0, last_calibration_days: 28, subdivision: "Edson Sub",    timestamp: ago(3.0) },
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
  { subId: "Capreol Sub",   label: "Capreol Sub",   car_passage_count_7d: 1240, alarm_count_7d: 8,  active_train_count: 2, avg_speed_mph: 46, defect_rate_pct: 1.2, timestamp: ago(0.1) },
  { subId: "Moncton Sub",   label: "Moncton Sub",   car_passage_count_7d: 680,  alarm_count_7d: 4,  active_train_count: 1, avg_speed_mph: 50, defect_rate_pct: 0.7, timestamp: ago(0.1) },
  { subId: "Rivers Sub",    label: "Rivers Sub",    car_passage_count_7d: 1920, alarm_count_7d: 12, active_train_count: 3, avg_speed_mph: 51, defect_rate_pct: 1.9, timestamp: ago(0.1) },
  { subId: "Sprague Sub",   label: "Sprague Sub",   car_passage_count_7d: 320,  alarm_count_7d: 1,  active_train_count: 1, avg_speed_mph: 48, defect_rate_pct: 0.4, timestamp: ago(0.1) },
];

export const SIM_YARDS: YardReading[] = [
  { yardId: "MacMillan Yard",    label: "MacMillan Yard — Toronto",     capacity_pct: 76, car_count: 2890, train_count: 15, dwell_time_avg_hours: 18, timestamp: ago(0.1) },
  { yardId: "Taschereau Yard",   label: "Taschereau Yard — Montréal",   capacity_pct: 67, car_count: 2140, train_count: 12, dwell_time_avg_hours: 22, timestamp: ago(0.1) },
  { yardId: "Walker Yard",       label: "Walker Yard — Edmonton",       capacity_pct: 70, car_count: 1680, train_count: 9,  dwell_time_avg_hours: 14, timestamp: ago(0.1) },
  { yardId: "Symington Yard",    label: "Symington Yard — Winnipeg",    capacity_pct: 69, car_count: 1920, train_count: 11, dwell_time_avg_hours: 16, timestamp: ago(0.1) },
  { yardId: "Gordon Yard",       label: "Gordon Yard — Moncton",        capacity_pct: 63, car_count: 880,  train_count: 5,  dwell_time_avg_hours: 28, timestamp: ago(0.1) },
  { yardId: "Harvey Yard",       label: "Harvey Yard — New Orleans",    capacity_pct: 74, car_count: 1340, train_count: 7,  dwell_time_avg_hours: 20, timestamp: ago(0.1) },
  { yardId: "Capreol Yard",      label: "Capreol Yard — Capreol, ON",   capacity_pct: 58, car_count: 1120, train_count: 6,  dwell_time_avg_hours: 24, timestamp: ago(0.1) },
  { yardId: "Biggar Yard",       label: "Biggar Yard — Biggar, SK",     capacity_pct: 44, car_count: 680,  train_count: 4,  dwell_time_avg_hours: 32, timestamp: ago(0.1) },
  { yardId: "Jasper Yard",       label: "Jasper Yard — Jasper, AB",     capacity_pct: 52, car_count: 840,  train_count: 4,  dwell_time_avg_hours: 18, timestamp: ago(0.1) },
  { yardId: "Joffre Yard",       label: "Joffre Yard — Lévis, QC",      capacity_pct: 61, car_count: 1480, train_count: 8,  dwell_time_avg_hours: 20, timestamp: ago(0.1) },
  { yardId: "Brampton Yard",     label: "Brampton Yard — Brampton, ON", capacity_pct: 82, car_count: 2240, train_count: 14, dwell_time_avg_hours: 16, timestamp: ago(0.1) },
  { yardId: "Port Robinson Yard",label: "Port Robinson Yard — ON",      capacity_pct: 48, car_count: 560,  train_count: 3,  dwell_time_avg_hours: 36, timestamp: ago(0.1) },
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

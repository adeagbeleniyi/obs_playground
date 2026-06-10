// ─────────────────────────────────────────────────────────────────────────────
// CN Rail OT Observability — Consist Detail Data
// Individual car records, multi-locomotive health, wheel readings
// ─────────────────────────────────────────────────────────────────────────────

// ─── Locomotive Component Health ─────────────────────────────────────────────

export type ComponentStatus = "OK" | "WARNING" | "FAULT" | "UNKNOWN";

export interface WheelReading {
  axle: number; // 1–4 (per truck: A1, A2, B1, B2 for 4-axle loco)
  side: "LEFT" | "RIGHT";
  tempC: number;
  wornMm: number; // wheel profile wear in mm
  flangeHeightMm: number;
  flangeWidthMm: number;
  rimThicknessMm: number;
  status: ComponentStatus;
  lastMeasuredAt: string;
  lastMeasuredMp: number;
}

export interface TractionMotor {
  id: string; // e.g. "TM-A1", "TM-A2", "TM-B1", "TM-B2"
  status: ComponentStatus;
  tempC: number;
  currentAmps: number;
  voltageV: number;
  groundFaultOhms: number | null;
  faultCode?: string;
}

export interface LocoComponents {
  // Traction
  tractionMotors: TractionMotor[];
  wheelReadings: WheelReading[];
  // Braking
  dynamicBrakeStatus: ComponentStatus;
  airBrakeStatus: ComponentStatus;
  brakePipePressurePsi: number;
  brakeReservoirPressurePsi: number;
  // Power
  engineStatus: ComponentStatus;
  engineRPM: number;
  engineTempC: number;
  oilPressureKPa: number;
  coolantTempC: number;
  alternatorStatus: ComponentStatus;
  // Fuel & Fluids
  fuelLevelPct: number;
  fuelLevelGallons: number;
  oilLevelStatus: ComponentStatus;
  coolantLevelStatus: ComponentStatus;
  sandLevelPct: number;
  // Air System
  mainReservoirPressurePsi: number;
  compressorStatus: ComponentStatus;
  // HVAC & Cab
  hvacStatus: ComponentStatus;
  cabTempC: number;
  // Electronics
  etmsStatus: ComponentStatus;
  gpsStatus: ComponentStatus;
  radioStatus: ComponentStatus;
  eventRecorderStatus: ComponentStatus;
  // Lights & Safety
  headlightStatus: ComponentStatus;
  ditchLightStatus: ComponentStatus;
  hornStatus: ComponentStatus;
  bellStatus: ComponentStatus;
}

export interface LocomotiveDetail {
  roadNumber: string;           // e.g. "CN 3864"
  model: string;                // e.g. "ES44AC"
  series: string;               // e.g. "GE Evolution"
  horsepower: number;
  axles: number;
  weight: number;               // lbs
  builtYear: number;
  lastShopDate: string;
  nextShopDueMiles: number;
  milesSinceShop: number;
  trainId: string;
  position: "LEAD" | "TRAIL" | "DPU_REAR" | "DPU_MID" | "HELPER";
  positionInConsist: number;    // 1 = lead
  ptcEquipped: boolean;
  tripOptimizerEquipped: boolean;
  components: LocoComponents;
  activeAlarms: string[];
}

// ─── Car Record ───────────────────────────────────────────────────────────────

export type CarType =
  | "COVERED_HOPPER"
  | "OPEN_TOP_HOPPER"
  | "GONDOLA"
  | "BOXCAR"
  | "FLATCAR"
  | "INTERMODAL_FLAT"
  | "TANK_CAR"
  | "AUTORACK"
  | "COIL_CAR"
  | "CENTERBEAM"
  | "WELL_CAR"
  | "CABOOSE"
  | "MAINTENANCE_OF_WAY";

export type CarStatus = "IN_CONSIST" | "IN_YARD" | "BAD_ORDER" | "IN_SHOP" | "INTERCHANGED";

export interface CarRecord {
  carId: string;                // e.g. "CN 521044", "BNSF 112847"
  reportingMark: string;        // e.g. "CN", "BNSF", "CP", "CSXT", "NS"
  carNumber: string;            // e.g. "521044"
  carType: CarType;
  ownerRailroad: string;
  status: CarStatus;
  trainId: string | null;       // null if in yard or bad order
  positionInConsist: number | null; // 1-based from lead loco
  loadStatus: "LOADED" | "EMPTY";
  commodity?: string;
  grossWeightTons: number;
  hazmat: boolean;
  hazmatClass?: string;
  lastABTResult: "PASS" | "FAIL" | "PENDING" | "N/A";
  lastDetectorResult: "CLEAR" | "ALARM" | "WARNING" | "N/A";
  lastDetectorMp?: number;
  lastDetectorTime?: string;
  destinationYard: string;
  waybillNumber: string;
  setOutReason?: string;
  notes?: string;
  /** e.g. "A2-Left" — which wheel position has the active defect (for mini strip indicator) */
  wheelDefectAxle?: string;
  wheelDefectType?: "WILD" | "HBD" | "DED" | "TADS" | "ABT";
  wheelDefectSeverity?: "ALARM" | "WARNING";
}

// ─── Locomotive Detail Records ────────────────────────────────────────────────

const makeComponents = (overrides: Partial<LocoComponents> = {}): LocoComponents => ({
  tractionMotors: [
    { id: "TM-A1", status: "OK", tempC: 68, currentAmps: 820, voltageV: 740, groundFaultOhms: null },
    { id: "TM-A2", status: "OK", tempC: 71, currentAmps: 815, voltageV: 738, groundFaultOhms: null },
    { id: "TM-B1", status: "OK", tempC: 66, currentAmps: 822, voltageV: 742, groundFaultOhms: null },
    { id: "TM-B2", status: "OK", tempC: 69, currentAmps: 818, voltageV: 739, groundFaultOhms: null },
  ],
  wheelReadings: [
    { axle: 1, side: "LEFT",  tempC: 42, wornMm: 3.2, flangeHeightMm: 28.4, flangeWidthMm: 31.2, rimThicknessMm: 28.8, status: "OK", lastMeasuredAt: "2026-05-04 14:00:00", lastMeasuredMp: 0 },
    { axle: 1, side: "RIGHT", tempC: 44, wornMm: 3.4, flangeHeightMm: 28.2, flangeWidthMm: 31.0, rimThicknessMm: 28.6, status: "OK", lastMeasuredAt: "2026-05-04 14:00:00", lastMeasuredMp: 0 },
    { axle: 2, side: "LEFT",  tempC: 41, wornMm: 3.1, flangeHeightMm: 28.5, flangeWidthMm: 31.3, rimThicknessMm: 29.0, status: "OK", lastMeasuredAt: "2026-05-04 14:00:00", lastMeasuredMp: 0 },
    { axle: 2, side: "RIGHT", tempC: 43, wornMm: 3.3, flangeHeightMm: 28.3, flangeWidthMm: 31.1, rimThicknessMm: 28.7, status: "OK", lastMeasuredAt: "2026-05-04 14:00:00", lastMeasuredMp: 0 },
    { axle: 3, side: "LEFT",  tempC: 40, wornMm: 2.9, flangeHeightMm: 28.6, flangeWidthMm: 31.4, rimThicknessMm: 29.1, status: "OK", lastMeasuredAt: "2026-05-04 14:00:00", lastMeasuredMp: 0 },
    { axle: 3, side: "RIGHT", tempC: 42, wornMm: 3.0, flangeHeightMm: 28.4, flangeWidthMm: 31.2, rimThicknessMm: 28.9, status: "OK", lastMeasuredAt: "2026-05-04 14:00:00", lastMeasuredMp: 0 },
    { axle: 4, side: "LEFT",  tempC: 41, wornMm: 3.2, flangeHeightMm: 28.3, flangeWidthMm: 31.1, rimThicknessMm: 28.8, status: "OK", lastMeasuredAt: "2026-05-04 14:00:00", lastMeasuredMp: 0 },
    { axle: 4, side: "RIGHT", tempC: 43, wornMm: 3.1, flangeHeightMm: 28.5, flangeWidthMm: 31.3, rimThicknessMm: 29.0, status: "OK", lastMeasuredAt: "2026-05-04 14:00:00", lastMeasuredMp: 0 },
  ],
  dynamicBrakeStatus: "OK",
  airBrakeStatus: "OK",
  brakePipePressurePsi: 90,
  brakeReservoirPressurePsi: 110,
  engineStatus: "OK",
  engineRPM: 900,
  engineTempC: 82,
  oilPressureKPa: 340,
  coolantTempC: 78,
  alternatorStatus: "OK",
  fuelLevelPct: 68,
  fuelLevelGallons: 2720,
  oilLevelStatus: "OK",
  coolantLevelStatus: "OK",
  sandLevelPct: 74,
  mainReservoirPressurePsi: 130,
  compressorStatus: "OK",
  hvacStatus: "OK",
  cabTempC: 21,
  etmsStatus: "OK",
  gpsStatus: "OK",
  radioStatus: "OK",
  eventRecorderStatus: "OK",
  headlightStatus: "OK",
  ditchLightStatus: "OK",
  hornStatus: "OK",
  bellStatus: "OK",
  ...overrides,
});

export const LOCOMOTIVE_DETAILS: LocomotiveDetail[] = [
  // ── Train CN-Q11451-05 ──
  {
    roadNumber: "CN 3864", model: "ES44AC", series: "GE Evolution Series", horsepower: 4400, axles: 6, weight: 432000, builtYear: 2014, lastShopDate: "2026-01-15", nextShopDueMiles: 92000, milesSinceShop: 48200,
    trainId: "CN-Q11451-05", position: "LEAD", positionInConsist: 1, ptcEquipped: true, tripOptimizerEquipped: true,
    components: makeComponents({ fuelLevelPct: 62, fuelLevelGallons: 2480, engineRPM: 950, engineTempC: 84 }),
    activeAlarms: [],
  },
  {
    roadNumber: "CN 3901", model: "ES44AC", series: "GE Evolution Series", horsepower: 4400, axles: 6, weight: 432000, builtYear: 2015, lastShopDate: "2026-02-08", nextShopDueMiles: 92000, milesSinceShop: 31400,
    trainId: "CN-Q11451-05", position: "TRAIL", positionInConsist: 2, ptcEquipped: true, tripOptimizerEquipped: true,
    components: makeComponents({ fuelLevelPct: 58, fuelLevelGallons: 2320, engineRPM: 920 }),
    activeAlarms: [],
  },
  // ── Train CN-M30151-05 ──
  {
    roadNumber: "CN 5501", model: "SD70M-2", series: "EMD SD70", horsepower: 4300, axles: 6, weight: 420000, builtYear: 2012, lastShopDate: "2025-11-20", nextShopDueMiles: 92000, milesSinceShop: 62100,
    trainId: "CN-M30151-05", position: "LEAD", positionInConsist: 1, ptcEquipped: true, tripOptimizerEquipped: true,
    components: makeComponents({ fuelLevelPct: 71, fuelLevelGallons: 2840, sandLevelPct: 55 }),
    activeAlarms: [],
  },
  {
    roadNumber: "CN 5488", model: "SD70M-2", series: "EMD SD70", horsepower: 4300, axles: 6, weight: 420000, builtYear: 2012, lastShopDate: "2025-10-14", nextShopDueMiles: 92000, milesSinceShop: 71200,
    trainId: "CN-M30151-05", position: "TRAIL", positionInConsist: 2, ptcEquipped: true, tripOptimizerEquipped: false,
    components: makeComponents({
      fuelLevelPct: 66, fuelLevelGallons: 2640,
      tractionMotors: [
        { id: "TM-A1", status: "OK",      tempC: 70, currentAmps: 810, voltageV: 736, groundFaultOhms: null },
        { id: "TM-A2", status: "WARNING", tempC: 94, currentAmps: 780, voltageV: 720, groundFaultOhms: 4200, faultCode: "TM-TEMP-HIGH" },
        { id: "TM-B1", status: "OK",      tempC: 68, currentAmps: 815, voltageV: 738, groundFaultOhms: null },
        { id: "TM-B2", status: "OK",      tempC: 67, currentAmps: 820, voltageV: 740, groundFaultOhms: null },
      ],
    }),
    activeAlarms: ["TM-A2 TEMP HIGH — 94°C (limit 90°C). Monitor closely."],
  },
  // ── Train CN-K88151-05 (3 locos + DPU) ──
  {
    roadNumber: "CN 3864", model: "ES44AC", series: "GE Evolution Series", horsepower: 4400, axles: 6, weight: 432000, builtYear: 2014, lastShopDate: "2026-01-15", nextShopDueMiles: 92000, milesSinceShop: 48200,
    trainId: "CN-K88151-05", position: "LEAD", positionInConsist: 1, ptcEquipped: true, tripOptimizerEquipped: true,
    components: makeComponents({ fuelLevelPct: 88, fuelLevelGallons: 3520, engineRPM: 800 }),
    activeAlarms: [],
  },
  {
    roadNumber: "CN 3901", model: "ES44AC", series: "GE Evolution Series", horsepower: 4400, axles: 6, weight: 432000, builtYear: 2015, lastShopDate: "2026-02-08", nextShopDueMiles: 92000, milesSinceShop: 31400,
    trainId: "CN-K88151-05", position: "TRAIL", positionInConsist: 2, ptcEquipped: true, tripOptimizerEquipped: true,
    components: makeComponents({ fuelLevelPct: 84, fuelLevelGallons: 3360 }),
    activeAlarms: [],
  },
  {
    roadNumber: "CN 3888", model: "ES44AC", series: "GE Evolution Series", horsepower: 4400, axles: 6, weight: 432000, builtYear: 2016, lastShopDate: "2026-03-01", nextShopDueMiles: 92000, milesSinceShop: 22800,
    trainId: "CN-K88151-05", position: "DPU_REAR", positionInConsist: 123, ptcEquipped: true, tripOptimizerEquipped: true,
    components: makeComponents({ fuelLevelPct: 91, fuelLevelGallons: 3640 }),
    activeAlarms: [],
  },
  // ── Train CN-T22151-05 ──
  {
    roadNumber: "CN 3412", model: "C44-9W", series: "GE Dash 9", horsepower: 4400, axles: 6, weight: 420000, builtYear: 2008, lastShopDate: "2025-08-12", nextShopDueMiles: 92000, milesSinceShop: 78400,
    trainId: "CN-T22151-05", position: "LEAD", positionInConsist: 1, ptcEquipped: true, tripOptimizerEquipped: true,
    components: makeComponents({
      fuelLevelPct: 34, fuelLevelGallons: 1360,
      wheelReadings: [
        { axle: 1, side: "LEFT",  tempC: 48, wornMm: 7.8, flangeHeightMm: 25.1, flangeWidthMm: 29.4, rimThicknessMm: 23.2, status: "WARNING", lastMeasuredAt: "2026-05-04 22:00:00", lastMeasuredMp: 0 },
        { axle: 1, side: "RIGHT", tempC: 46, wornMm: 7.4, flangeHeightMm: 25.4, flangeWidthMm: 29.6, rimThicknessMm: 23.5, status: "WARNING", lastMeasuredAt: "2026-05-04 22:00:00", lastMeasuredMp: 0 },
        { axle: 2, side: "LEFT",  tempC: 44, wornMm: 6.9, flangeHeightMm: 25.8, flangeWidthMm: 30.0, rimThicknessMm: 24.1, status: "OK",      lastMeasuredAt: "2026-05-04 22:00:00", lastMeasuredMp: 0 },
        { axle: 2, side: "RIGHT", tempC: 45, wornMm: 7.1, flangeHeightMm: 25.6, flangeWidthMm: 29.8, rimThicknessMm: 23.8, status: "OK",      lastMeasuredAt: "2026-05-04 22:00:00", lastMeasuredMp: 0 },
        { axle: 3, side: "LEFT",  tempC: 42, wornMm: 6.4, flangeHeightMm: 26.2, flangeWidthMm: 30.4, rimThicknessMm: 24.6, status: "OK",      lastMeasuredAt: "2026-05-04 22:00:00", lastMeasuredMp: 0 },
        { axle: 3, side: "RIGHT", tempC: 43, wornMm: 6.6, flangeHeightMm: 26.0, flangeWidthMm: 30.2, rimThicknessMm: 24.4, status: "OK",      lastMeasuredAt: "2026-05-04 22:00:00", lastMeasuredMp: 0 },
        { axle: 4, side: "LEFT",  tempC: 41, wornMm: 6.2, flangeHeightMm: 26.4, flangeWidthMm: 30.6, rimThicknessMm: 24.8, status: "OK",      lastMeasuredAt: "2026-05-04 22:00:00", lastMeasuredMp: 0 },
        { axle: 4, side: "RIGHT", tempC: 42, wornMm: 6.3, flangeHeightMm: 26.3, flangeWidthMm: 30.5, rimThicknessMm: 24.7, status: "OK",      lastMeasuredAt: "2026-05-04 22:00:00", lastMeasuredMp: 0 },
      ],
    }),
    activeAlarms: ["Wheel wear approaching limit on Axle 1 — schedule shop inspection at next terminal"],
  },
  {
    roadNumber: "CN 3398", model: "C44-9W", series: "GE Dash 9", horsepower: 4400, axles: 6, weight: 420000, builtYear: 2007, lastShopDate: "2025-07-22", nextShopDueMiles: 92000, milesSinceShop: 84100,
    trainId: "CN-T22151-05", position: "TRAIL", positionInConsist: 2, ptcEquipped: true, tripOptimizerEquipped: false,
    components: makeComponents({ fuelLevelPct: 28, fuelLevelGallons: 1120, engineTempC: 91, coolantTempC: 88 }),
    activeAlarms: ["Low fuel — 28% (1,120 gal). Next fuel point: Capreol."],
  },
  // ── Train CN-U55451-05 (single loco) ──
  {
    roadNumber: "CN 8812", model: "ES44DC", series: "GE Evolution Series", horsepower: 4400, axles: 6, weight: 432000, builtYear: 2018, lastShopDate: "2026-03-10", nextShopDueMiles: 92000, milesSinceShop: 18200,
    trainId: "CN-U55451-05", position: "LEAD", positionInConsist: 1, ptcEquipped: true, tripOptimizerEquipped: true,
    components: makeComponents({ fuelLevelPct: 55, fuelLevelGallons: 2200 }),
    activeAlarms: [],
  },
  // ── Train CN-F77251-05 ──
  {
    roadNumber: "CN 6612", model: "SD70I", series: "EMD SD70", horsepower: 4000, axles: 6, weight: 415000, builtYear: 2010, lastShopDate: "2025-12-05", nextShopDueMiles: 92000, milesSinceShop: 54800,
    trainId: "CN-F77251-05", position: "LEAD", positionInConsist: 1, ptcEquipped: true, tripOptimizerEquipped: true,
    components: makeComponents({ fuelLevelPct: 22, fuelLevelGallons: 880 }),
    activeAlarms: ["Low fuel — 22% (880 gal). Arriving Symington — fuel scheduled."],
  },
  {
    roadNumber: "CN 6588", model: "SD70I", series: "EMD SD70", horsepower: 4000, axles: 6, weight: 415000, builtYear: 2010, lastShopDate: "2025-12-18", nextShopDueMiles: 92000, milesSinceShop: 51200,
    trainId: "CN-F77251-05", position: "TRAIL", positionInConsist: 2, ptcEquipped: true, tripOptimizerEquipped: false,
    components: makeComponents({ fuelLevelPct: 19, fuelLevelGallons: 760 }),
    activeAlarms: ["Low fuel — 19% (760 gal). Arriving Symington — fuel scheduled."],
  },
];

// ─── Car Records ──────────────────────────────────────────────────────────────

export const CAR_RECORDS: CarRecord[] = [
  // Train CN-Q11451-05 — 85 cars (showing representative sample)
  { carId: "CN 521044",    reportingMark: "CN",   carNumber: "521044", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-Q11451-05", positionInConsist: 3,  loadStatus: "LOADED",  commodity: "Grain",     grossWeightTons: 143, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 180.2, lastDetectorTime: "2026-05-05 11:44:00", destinationYard: "Taschereau", waybillNumber: "WB-2026-44120" },
  { carId: "CN 521188",    reportingMark: "CN",   carNumber: "521188", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-Q11451-05", positionInConsist: 4,  loadStatus: "LOADED",  commodity: "Grain",     grossWeightTons: 141, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 180.2, lastDetectorTime: "2026-05-05 11:44:00", destinationYard: "Taschereau", waybillNumber: "WB-2026-44121" },
  { carId: "NS 74412",     reportingMark: "NS",   carNumber: "74412",  carType: "AUTORACK",         ownerRailroad: "Norfolk Southern", status: "IN_CONSIST", trainId: "CN-Q11451-05", positionInConsist: 1, loadStatus: "LOADED",  commodity: "Automobiles", grossWeightTons: 88, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 180.2, lastDetectorTime: "2026-05-05 11:44:00", destinationYard: "Taschereau", waybillNumber: "WB-2026-44119" },
  { carId: "CN 881044",    reportingMark: "CN",   carNumber: "881044", carType: "GONDOLA",          ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-Q11451-05", positionInConsist: 12, loadStatus: "LOADED",  commodity: "Steel coil", grossWeightTons: 128, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 180.2, lastDetectorTime: "2026-05-05 11:44:00", destinationYard: "Taschereau", waybillNumber: "WB-2026-44125" },
  { carId: "BNSF 112847",  reportingMark: "BNSF", carNumber: "112847", carType: "GONDOLA",          ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-Q11451-05", positionInConsist: 22, loadStatus: "LOADED",  commodity: "Coal",      grossWeightTons: 138, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 180.2, lastDetectorTime: "2026-05-05 11:44:00", destinationYard: "Taschereau", waybillNumber: "WB-2026-44130" },
  { carId: "CN 334401",    reportingMark: "CN",   carNumber: "334401", carType: "BOXCAR",           ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-Q11451-05", positionInConsist: 31, loadStatus: "EMPTY",   grossWeightTons: 32,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 180.2, lastDetectorTime: "2026-05-05 11:44:00", destinationYard: "Taschereau", waybillNumber: "WB-2026-44135" },
  { carId: "TTGX 9012",    reportingMark: "TTGX", carNumber: "9012",   carType: "INTERMODAL_FLAT",  ownerRailroad: "TTX Company",    status: "IN_CONSIST", trainId: "CN-Q11451-05", positionInConsist: 44, loadStatus: "LOADED",  commodity: "Intermodal containers", grossWeightTons: 112, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 180.2, lastDetectorTime: "2026-05-05 11:44:00", destinationYard: "Taschereau", waybillNumber: "WB-2026-44140" },
  { carId: "CN 441288",    reportingMark: "CN",   carNumber: "441288", carType: "TANK_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-Q11451-05", positionInConsist: 55, loadStatus: "LOADED",  commodity: "Crude oil", grossWeightTons: 118, hazmat: true, hazmatClass: "Class 3 — Flammable Liquid", lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 180.2, lastDetectorTime: "2026-05-05 11:44:00", destinationYard: "Taschereau", waybillNumber: "WB-2026-44145" },
  { carId: "UP 812044",    reportingMark: "UP",   carNumber: "812044", carType: "COVERED_HOPPER",   ownerRailroad: "Union Pacific",  status: "IN_CONSIST", trainId: "CN-Q11451-05", positionInConsist: 66, loadStatus: "LOADED",  commodity: "Potash",    grossWeightTons: 144, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 180.2, lastDetectorTime: "2026-05-05 11:44:00", destinationYard: "Taschereau", waybillNumber: "WB-2026-44150" },
  { carId: "CN 228811",    reportingMark: "CN",   carNumber: "228811", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-Q11451-05", positionInConsist: 77, loadStatus: "LOADED",  commodity: "Intermodal containers", grossWeightTons: 98, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 180.2, lastDetectorTime: "2026-05-05 11:44:00", destinationYard: "Taschereau", waybillNumber: "WB-2026-44155" },
  // Train CN-M30151-05 — 113 cars (full consist)
  { carId: "CP 624411",    reportingMark: "CP",   carNumber: "624411", carType: "TANK_CAR",        ownerRailroad: "CP Rail",        status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 3,  loadStatus: "LOADED",  commodity: "Sodium hydroxide",    grossWeightTons: 110, hazmat: true,  hazmatClass: "Class 8 — Corrosive",        lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55203" },
  { carId: "CN 521045",    reportingMark: "CN",   carNumber: "521045", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 4,  loadStatus: "LOADED",  commodity: "Wheat",               grossWeightTons: 142, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55202" },
  { carId: "CN 521046",    reportingMark: "CN",   carNumber: "521046", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 5,  loadStatus: "LOADED",  commodity: "Wheat",               grossWeightTons: 140, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55204" },
  { carId: "CN 521047",    reportingMark: "CN",   carNumber: "521047", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 6,  loadStatus: "LOADED",  commodity: "Canola",              grossWeightTons: 138, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55205" },
  { carId: "CN 521048",    reportingMark: "CN",   carNumber: "521048", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 7,  loadStatus: "LOADED",  commodity: "Canola",              grossWeightTons: 139, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55206" },
  { carId: "CN 521049",    reportingMark: "CN",   carNumber: "521049", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 8,  loadStatus: "LOADED",  commodity: "Barley",              grossWeightTons: 136, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55207" },
  { carId: "CN 521050",    reportingMark: "CN",   carNumber: "521050", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 9,  loadStatus: "LOADED",  commodity: "Barley",              grossWeightTons: 137, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55208" },
  { carId: "CN 521051",    reportingMark: "CN",   carNumber: "521051", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 10, loadStatus: "LOADED",  commodity: "Wheat",               grossWeightTons: 141, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55209" },
  { carId: "CN 521052",    reportingMark: "CN",   carNumber: "521052", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 11, loadStatus: "LOADED",  commodity: "Wheat",               grossWeightTons: 143, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55210" },
  { carId: "CN 521053",    reportingMark: "CN",   carNumber: "521053", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 12, loadStatus: "LOADED",  commodity: "Durum",               grossWeightTons: 144, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55211" },
  { carId: "CN 521054",    reportingMark: "CN",   carNumber: "521054", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 13, loadStatus: "LOADED",  commodity: "Durum",               grossWeightTons: 142, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55212" },
  { carId: "CN 521055",    reportingMark: "CN",   carNumber: "521055", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 14, loadStatus: "LOADED",  commodity: "Oats",                grossWeightTons: 130, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55213" },
  { carId: "CN 521056",    reportingMark: "CN",   carNumber: "521056", carType: "COVERED_HOPPER", ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 15, loadStatus: "LOADED",  commodity: "Oats",                grossWeightTons: 131, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55214" },
  { carId: "BNSF 112848",  reportingMark: "BNSF", carNumber: "112848", carType: "GONDOLA",        ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 16, loadStatus: "LOADED",  commodity: "Coal",                grossWeightTons: 136, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55215" },
  { carId: "BNSF 112849",  reportingMark: "BNSF", carNumber: "112849", carType: "GONDOLA",        ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 17, loadStatus: "LOADED",  commodity: "Coal",                grossWeightTons: 134, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55216" },
  { carId: "BNSF 112850",  reportingMark: "BNSF", carNumber: "112850", carType: "GONDOLA",        ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 18, loadStatus: "LOADED",  commodity: "Coal",                grossWeightTons: 138, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55217" },
  { carId: "BNSF 112851",  reportingMark: "BNSF", carNumber: "112851", carType: "GONDOLA",        ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 19, loadStatus: "LOADED",  commodity: "Coal",                grossWeightTons: 135, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55218" },
  { carId: "BNSF 112852",  reportingMark: "BNSF", carNumber: "112852", carType: "GONDOLA",        ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 20, loadStatus: "LOADED",  commodity: "Coal",                grossWeightTons: 137, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "WARNING",  lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55219", wheelDefectAxle: "A1-Left",  wheelDefectType: "WILD", wheelDefectSeverity: "WARNING", notes: "WILD WARNING — Axle A1-Left 88 kips at MP 40.5. Monitor at next detector." },
  { carId: "BNSF 112853",  reportingMark: "BNSF", carNumber: "112853", carType: "GONDOLA",        ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 21, loadStatus: "LOADED",  commodity: "Coal",                grossWeightTons: 133, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55220" },
  { carId: "BNSF 112854",  reportingMark: "BNSF", carNumber: "112854", carType: "GONDOLA",        ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 22, loadStatus: "LOADED",  commodity: "Coal",                grossWeightTons: 136, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55221" },
  { carId: "BNSF 112855",  reportingMark: "BNSF", carNumber: "112855", carType: "GONDOLA",        ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 23, loadStatus: "LOADED",  commodity: "Coal",                grossWeightTons: 134, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55222" },
  { carId: "BNSF 112856",  reportingMark: "BNSF", carNumber: "112856", carType: "GONDOLA",        ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 24, loadStatus: "LOADED",  commodity: "Coal",                grossWeightTons: 139, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55223" },
  { carId: "BNSF 112857",  reportingMark: "BNSF", carNumber: "112857", carType: "GONDOLA",        ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 25, loadStatus: "LOADED",  commodity: "Coal",                grossWeightTons: 136, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55224" },
  { carId: "CN 334410",    reportingMark: "CN",   carNumber: "334410", carType: "BOXCAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 26, loadStatus: "LOADED",  commodity: "General merchandise", grossWeightTons: 78,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55225" },
  { carId: "CN 334411",    reportingMark: "CN",   carNumber: "334411", carType: "BOXCAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 27, loadStatus: "LOADED",  commodity: "Paper rolls",         grossWeightTons: 82,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55226" },
  { carId: "CN 334412",    reportingMark: "CN",   carNumber: "334412", carType: "BOXCAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 28, loadStatus: "LOADED",  commodity: "Paper rolls",         grossWeightTons: 80,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55227" },
  { carId: "CN 334413",    reportingMark: "CN",   carNumber: "334413", carType: "BOXCAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 29, loadStatus: "EMPTY",   grossWeightTons: 32,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55228" },
  { carId: "CN 334414",    reportingMark: "CN",   carNumber: "334414", carType: "BOXCAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 30, loadStatus: "EMPTY",   grossWeightTons: 31,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55229" },
  { carId: "TTGX 9100",    reportingMark: "TTGX", carNumber: "9100",   carType: "INTERMODAL_FLAT", ownerRailroad: "TTX Company",   status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 31, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 108, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55230" },
  { carId: "TTGX 9101",    reportingMark: "TTGX", carNumber: "9101",   carType: "INTERMODAL_FLAT", ownerRailroad: "TTX Company",   status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 32, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 112, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55231" },
  { carId: "TTGX 9102",    reportingMark: "TTGX", carNumber: "9102",   carType: "INTERMODAL_FLAT", ownerRailroad: "TTX Company",   status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 33, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 110, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55232" },
  { carId: "TTGX 9103",    reportingMark: "TTGX", carNumber: "9103",   carType: "INTERMODAL_FLAT", ownerRailroad: "TTX Company",   status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 34, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 114, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "ALARM",    lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55233", wheelDefectAxle: "B2-Right", wheelDefectType: "HBD", wheelDefectSeverity: "ALARM", notes: "HBD ALARM — Axle B2-Right 224°F exceeds 200°F threshold. Set out at next yard." },
  { carId: "TTGX 9104",    reportingMark: "TTGX", carNumber: "9104",   carType: "INTERMODAL_FLAT", ownerRailroad: "TTX Company",   status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 35, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 109, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55234" },
  { carId: "TTGX 9105",    reportingMark: "TTGX", carNumber: "9105",   carType: "INTERMODAL_FLAT", ownerRailroad: "TTX Company",   status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 36, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 111, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55235" },
  { carId: "CN 441300",    reportingMark: "CN",   carNumber: "441300", carType: "TANK_CAR",        ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 37, loadStatus: "LOADED",  commodity: "Crude oil",           grossWeightTons: 120, hazmat: true,  hazmatClass: "Class 3 — Flammable Liquid", lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55236" },
  { carId: "CN 441301",    reportingMark: "CN",   carNumber: "441301", carType: "TANK_CAR",        ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 38, loadStatus: "LOADED",  commodity: "Crude oil",           grossWeightTons: 118, hazmat: true,  hazmatClass: "Class 3 — Flammable Liquid", lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55237" },
  { carId: "CN 441302",    reportingMark: "CN",   carNumber: "441302", carType: "TANK_CAR",        ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 39, loadStatus: "LOADED",  commodity: "Crude oil",           grossWeightTons: 121, hazmat: true,  hazmatClass: "Class 3 — Flammable Liquid", lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55238" },
  { carId: "CN 441303",    reportingMark: "CN",   carNumber: "441303", carType: "TANK_CAR",        ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 40, loadStatus: "LOADED",  commodity: "Crude oil",           grossWeightTons: 119, hazmat: true,  hazmatClass: "Class 3 — Flammable Liquid", lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55239" },
  { carId: "CN 441304",    reportingMark: "CN",   carNumber: "441304", carType: "TANK_CAR",        ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 41, loadStatus: "LOADED",  commodity: "Crude oil",           grossWeightTons: 122, hazmat: true,  hazmatClass: "Class 3 — Flammable Liquid", lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55240" },
  { carId: "CN 441305",    reportingMark: "CN",   carNumber: "441305", carType: "TANK_CAR",        ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 42, loadStatus: "LOADED",  commodity: "Crude oil",           grossWeightTons: 117, hazmat: true,  hazmatClass: "Class 3 — Flammable Liquid", lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55241" },
  { carId: "CN 441306",    reportingMark: "CN",   carNumber: "441306", carType: "TANK_CAR",        ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 43, loadStatus: "LOADED",  commodity: "Crude oil",           grossWeightTons: 120, hazmat: true,  hazmatClass: "Class 3 — Flammable Liquid", lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55242" },
  { carId: "CN 441307",    reportingMark: "CN",   carNumber: "441307", carType: "TANK_CAR",        ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 44, loadStatus: "LOADED",  commodity: "Crude oil",           grossWeightTons: 118, hazmat: true,  hazmatClass: "Class 3 — Flammable Liquid", lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55243" },
  { carId: "CN 441308",    reportingMark: "CN",   carNumber: "441308", carType: "TANK_CAR",        ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 45, loadStatus: "LOADED",  commodity: "Crude oil",           grossWeightTons: 121, hazmat: true,  hazmatClass: "Class 3 — Flammable Liquid", lastABTResult: "PASS", lastDetectorResult: "WARNING",  lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55244", wheelDefectAxle: "B1-Right", wheelDefectType: "HBD",  wheelDefectSeverity: "WARNING", notes: "HBD WARNING — Axle B1-Right bearing temp 74°C (Kt 3.1 / Ke 1.9) at MP 40.5. Monitor at next detector." },
  { carId: "UP 812100",    reportingMark: "UP",   carNumber: "812100", carType: "COVERED_HOPPER",  ownerRailroad: "Union Pacific",  status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 46, loadStatus: "LOADED",  commodity: "Potash",              grossWeightTons: 144, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55245" },
  { carId: "UP 812101",    reportingMark: "UP",   carNumber: "812101", carType: "COVERED_HOPPER",  ownerRailroad: "Union Pacific",  status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 47, loadStatus: "LOADED",  commodity: "Potash",              grossWeightTons: 142, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55246" },
  { carId: "UP 812102",    reportingMark: "UP",   carNumber: "812102", carType: "COVERED_HOPPER",  ownerRailroad: "Union Pacific",  status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 48, loadStatus: "LOADED",  commodity: "Potash",              grossWeightTons: 146, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55247" },
  { carId: "UP 812103",    reportingMark: "UP",   carNumber: "812103", carType: "COVERED_HOPPER",  ownerRailroad: "Union Pacific",  status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 49, loadStatus: "LOADED",  commodity: "Potash",              grossWeightTons: 143, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55248" },
  { carId: "UP 812104",    reportingMark: "UP",   carNumber: "812104", carType: "COVERED_HOPPER",  ownerRailroad: "Union Pacific",  status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 50, loadStatus: "LOADED",  commodity: "Potash",              grossWeightTons: 145, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55249" },
  { carId: "NS 74420",     reportingMark: "NS",   carNumber: "74420",  carType: "AUTORACK",        ownerRailroad: "Norfolk Southern",status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 51, loadStatus: "LOADED",  commodity: "Automobiles",         grossWeightTons: 90,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55250" },
  { carId: "NS 74421",     reportingMark: "NS",   carNumber: "74421",  carType: "AUTORACK",        ownerRailroad: "Norfolk Southern",status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 52, loadStatus: "LOADED",  commodity: "Automobiles",         grossWeightTons: 88,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55251" },
  { carId: "NS 74422",     reportingMark: "NS",   carNumber: "74422",  carType: "AUTORACK",        ownerRailroad: "Norfolk Southern",status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 53, loadStatus: "LOADED",  commodity: "Automobiles",         grossWeightTons: 91,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55252" },
  { carId: "CN 881060",    reportingMark: "CN",   carNumber: "881060", carType: "GONDOLA",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 54, loadStatus: "LOADED",  commodity: "Steel scrap",         grossWeightTons: 128, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55253" },
  { carId: "CN 881061",    reportingMark: "CN",   carNumber: "881061", carType: "GONDOLA",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 55, loadStatus: "LOADED",  commodity: "Steel scrap",         grossWeightTons: 130, hazmat: false, lastABTResult: "FAIL", lastDetectorResult: "ALARM",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55254", wheelDefectAxle: "A2-Left",  wheelDefectType: "WILD", wheelDefectSeverity: "ALARM",   notes: "WILD ALARM — Axle A2-Left flat spot 104 kips at MP 40.5. Rule 41 set-out required at Walker Yard." },
  { carId: "CN 881062",    reportingMark: "CN",   carNumber: "881062", carType: "GONDOLA",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 56, loadStatus: "LOADED",  commodity: "Steel scrap",         grossWeightTons: 126, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55255" },
  { carId: "CN 881063",    reportingMark: "CN",   carNumber: "881063", carType: "GONDOLA",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 57, loadStatus: "LOADED",  commodity: "Steel scrap",         grossWeightTons: 132, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55256" },
  { carId: "CN 881064",    reportingMark: "CN",   carNumber: "881064", carType: "GONDOLA",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 58, loadStatus: "LOADED",  commodity: "Steel scrap",         grossWeightTons: 129, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55257" },
  { carId: "CN 881065",    reportingMark: "CN",   carNumber: "881065", carType: "GONDOLA",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 59, loadStatus: "LOADED",  commodity: "Steel scrap",         grossWeightTons: 127, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55258" },
  { carId: "CN 881066",    reportingMark: "CN",   carNumber: "881066", carType: "GONDOLA",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 60, loadStatus: "LOADED",  commodity: "Steel scrap",         grossWeightTons: 131, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55259" },
  { carId: "CN 881067",    reportingMark: "CN",   carNumber: "881067", carType: "GONDOLA",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 61, loadStatus: "LOADED",  commodity: "Steel scrap",         grossWeightTons: 128, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55260" },
  { carId: "CN 881068",    reportingMark: "CN",   carNumber: "881068", carType: "GONDOLA",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 62, loadStatus: "LOADED",  commodity: "Steel scrap",         grossWeightTons: 130, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55261" },
  { carId: "CN 881069",    reportingMark: "CN",   carNumber: "881069", carType: "GONDOLA",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 63, loadStatus: "LOADED",  commodity: "Steel scrap",         grossWeightTons: 125, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55262" },
  { carId: "CN 881070",    reportingMark: "CN",   carNumber: "881070", carType: "GONDOLA",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 64, loadStatus: "LOADED",  commodity: "Steel scrap",         grossWeightTons: 133, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55263" },
  { carId: "CSXT 44100",   reportingMark: "CSXT", carNumber: "44100",  carType: "BOXCAR",          ownerRailroad: "CSX Transportation",status:"IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 65, loadStatus: "LOADED",  commodity: "Auto parts",          grossWeightTons: 76,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "WARNING",  lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55264", wheelDefectAxle: "A1-Right", wheelDefectType: "TADS", wheelDefectSeverity: "WARNING", notes: "TADS WARNING — Axle A1-Right dragging equipment contact 3.2 kN at MP 40.5. Inspect at next crew change." },
  { carId: "CSXT 44101",   reportingMark: "CSXT", carNumber: "44101",  carType: "BOXCAR",          ownerRailroad: "CSX Transportation",status:"IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 66, loadStatus: "LOADED",  commodity: "Auto parts",          grossWeightTons: 74,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55265" },
  { carId: "CSXT 44102",   reportingMark: "CSXT", carNumber: "44102",  carType: "BOXCAR",          ownerRailroad: "CSX Transportation",status:"IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 67, loadStatus: "LOADED",  commodity: "Auto parts",          grossWeightTons: 77,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55266" },
  { carId: "CN 228820",    reportingMark: "CN",   carNumber: "228820", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 68, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 96,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55267" },
  { carId: "CN 228821",    reportingMark: "CN",   carNumber: "228821", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 69, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 100, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55268" },
  { carId: "CN 228822",    reportingMark: "CN",   carNumber: "228822", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 70, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 98,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55269" },
  { carId: "CN 228823",    reportingMark: "CN",   carNumber: "228823", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 71, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 102, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55270" },
  { carId: "CN 228824",    reportingMark: "CN",   carNumber: "228824", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 72, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 97,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55271" },
  { carId: "CN 228825",    reportingMark: "CN",   carNumber: "228825", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 73, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 101, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55272" },
  { carId: "CN 228826",    reportingMark: "CN",   carNumber: "228826", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 74, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 99,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55273" },
  { carId: "CN 228827",    reportingMark: "CN",   carNumber: "228827", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 75, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 103, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "ALARM",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55274", wheelDefectAxle: "B2-Left",  wheelDefectType: "HBD",  wheelDefectSeverity: "ALARM",   notes: "HBD ALARM — Axle B2-Left bearing temp 96°C (Kt 4.2 / Ke 2.8) at MP 40.5. WM51 §4.1.1 mandatory set-out at Walker Yard." },
  { carId: "CN 228828",    reportingMark: "CN",   carNumber: "228828", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 76, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 95,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55275" },
  { carId: "CN 228829",    reportingMark: "CN",   carNumber: "228829", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 77, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 104, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55276" },
  { carId: "CN 228830",    reportingMark: "CN",   carNumber: "228830", carType: "WELL_CAR",         ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 78, loadStatus: "LOADED",  commodity: "Intermodal containers",grossWeightTons: 98,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55277" },
  { carId: "CP 624420",    reportingMark: "CP",   carNumber: "624420", carType: "TANK_CAR",         ownerRailroad: "CP Rail",        status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 79, loadStatus: "LOADED",  commodity: "Chlorine",            grossWeightTons: 108, hazmat: true,  hazmatClass: "Class 2.3 — Toxic Gas",        lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55278" },
  { carId: "CP 624421",    reportingMark: "CP",   carNumber: "624421", carType: "TANK_CAR",         ownerRailroad: "CP Rail",        status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 80, loadStatus: "LOADED",  commodity: "Chlorine",            grossWeightTons: 106, hazmat: true,  hazmatClass: "Class 2.3 — Toxic Gas",        lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55279" },
  { carId: "CP 624422",    reportingMark: "CP",   carNumber: "624422", carType: "TANK_CAR",         ownerRailroad: "CP Rail",        status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 81, loadStatus: "LOADED",  commodity: "Chlorine",            grossWeightTons: 109, hazmat: true,  hazmatClass: "Class 2.3 — Toxic Gas",        lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55280" },
  { carId: "CN 334420",    reportingMark: "CN",   carNumber: "334420", carType: "BOXCAR",           ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 82, loadStatus: "LOADED",  commodity: "Consumer goods",      grossWeightTons: 72,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55281" },
  { carId: "CN 334421",    reportingMark: "CN",   carNumber: "334421", carType: "BOXCAR",           ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 83, loadStatus: "LOADED",  commodity: "Consumer goods",      grossWeightTons: 70,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55282" },
  { carId: "CN 334422",    reportingMark: "CN",   carNumber: "334422", carType: "BOXCAR",           ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 84, loadStatus: "LOADED",  commodity: "Consumer goods",      grossWeightTons: 73,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55283" },
  { carId: "CN 334423",    reportingMark: "CN",   carNumber: "334423", carType: "BOXCAR",           ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 85, loadStatus: "EMPTY",   grossWeightTons: 31,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "WARNING",  lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55284", wheelDefectAxle: "A2-Right", wheelDefectType: "WILD", wheelDefectSeverity: "WARNING", notes: "WILD WARNING — Axle A2-Right 91 kips at MP 40.5. Approaching Rule 41 threshold. Monitor closely." },
  { carId: "CN 334424",    reportingMark: "CN",   carNumber: "334424", carType: "BOXCAR",           ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 86, loadStatus: "EMPTY",   grossWeightTons: 30,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55285" },
  { carId: "CN 521060",    reportingMark: "CN",   carNumber: "521060", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 87, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 140, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55286" },
  { carId: "CN 521061",    reportingMark: "CN",   carNumber: "521061", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 88, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 138, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55287" },
  { carId: "CN 521062",    reportingMark: "CN",   carNumber: "521062", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 89, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 141, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55288" },
  { carId: "CN 521063",    reportingMark: "CN",   carNumber: "521063", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 90, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 139, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55289" },
  { carId: "CN 521064",    reportingMark: "CN",   carNumber: "521064", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 91, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 142, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55290" },
  { carId: "CN 521065",    reportingMark: "CN",   carNumber: "521065", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 92, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 137, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55291" },
  { carId: "CN 521066",    reportingMark: "CN",   carNumber: "521066", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 93, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 143, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55292" },
  { carId: "CN 521067",    reportingMark: "CN",   carNumber: "521067", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 94, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 140, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55293" },
  { carId: "CN 521068",    reportingMark: "CN",   carNumber: "521068", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 95, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 138, hazmat: false, lastABTResult: "FAIL", lastDetectorResult: "ALARM",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55294", wheelDefectAxle: "B1-Left",  wheelDefectType: "HBD",  wheelDefectSeverity: "ALARM",   notes: "HBD ALARM — Axle B1-Left bearing temp 101°C (Kt 4.8 / Ke 3.1) at MP 40.5. WM51 §4.1.1 mandatory set-out. Do not advance past Walker Yard." },
  { carId: "CN 521069",    reportingMark: "CN",   carNumber: "521069", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 96, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 141, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55295" },
  { carId: "CN 521070",    reportingMark: "CN",   carNumber: "521070", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 97, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 139, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55296" },
  { carId: "CN 521071",    reportingMark: "CN",   carNumber: "521071", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 98, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 144, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55297" },
  { carId: "CN 521072",    reportingMark: "CN",   carNumber: "521072", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 99, loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 136, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55298" },
  { carId: "CN 521073",    reportingMark: "CN",   carNumber: "521073", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 100,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 140, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55299" },
  { carId: "CN 521074",    reportingMark: "CN",   carNumber: "521074", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 101,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 142, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55300" },
  { carId: "CN 521075",    reportingMark: "CN",   carNumber: "521075", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 102,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 138, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55301" },
  { carId: "CN 521076",    reportingMark: "CN",   carNumber: "521076", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 103,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 141, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55302" },
  { carId: "CN 521077",    reportingMark: "CN",   carNumber: "521077", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 104,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 139, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55303" },
  { carId: "CN 521078",    reportingMark: "CN",   carNumber: "521078", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 105,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 143, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "WARNING",  lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55304", wheelDefectAxle: "A1-Left",  wheelDefectType: "DED",  wheelDefectSeverity: "WARNING", notes: "DED WARNING — Axle A1-Left dragging equipment 2.8 kN at MP 40.5. Inspect brake rigging at Walker Yard." },
  { carId: "CN 521079",    reportingMark: "CN",   carNumber: "521079", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 106,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 137, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55305" },
  { carId: "CN 521080",    reportingMark: "CN",   carNumber: "521080", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 107,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 140, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55306" },
  { carId: "CN 521081",    reportingMark: "CN",   carNumber: "521081", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 108,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 142, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55307" },
  { carId: "CN 521082",    reportingMark: "CN",   carNumber: "521082", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 109,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 138, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55308" },
  { carId: "CN 521083",    reportingMark: "CN",   carNumber: "521083", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 110,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 141, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55309" },
  { carId: "CN 521084",    reportingMark: "CN",   carNumber: "521084", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 111,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 139, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55310" },
  { carId: "CN 521085",    reportingMark: "CN",   carNumber: "521085", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 112,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 144, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55311" },
  { carId: "CN 521086",    reportingMark: "CN",   carNumber: "521086", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 113,loadStatus: "LOADED",  commodity: "Fertilizer",          grossWeightTons: 136, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR",   lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55312" },
  // Train CN-U55451-05 — stopped, detector alarm
  { carId: "CN 881045",    reportingMark: "CN",   carNumber: "881045", carType: "FLATCAR",          ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-U55451-05", positionInConsist: 8,  loadStatus: "LOADED",  commodity: "Lumber",    grossWeightTons: 88,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "ALARM",   lastDetectorMp: 144.8, lastDetectorTime: "2026-05-05 09:08:00", destinationYard: "MacMillan",  waybillNumber: "WB-2026-66301", notes: "DED ALARM — dragging equipment suspected. Under inspection." },
  { carId: "CN 881046",    reportingMark: "CN",   carNumber: "881046", carType: "FLATCAR",          ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-U55451-05", positionInConsist: 9,  loadStatus: "LOADED",  commodity: "Lumber",    grossWeightTons: 86,  hazmat: false, lastABTResult: "PASS", lastDetectorResult: "WARNING", lastDetectorMp: 144.8, lastDetectorTime: "2026-05-05 09:08:00", destinationYard: "MacMillan",  waybillNumber: "WB-2026-66302", notes: "DED WARNING — adjacent to flagged car. Under inspection." },
  // Bad order cars in yard
  { carId: "TTGX 8841",    reportingMark: "TTGX", carNumber: "8841",   carType: "INTERMODAL_FLAT",  ownerRailroad: "TTX Company",    status: "BAD_ORDER",  trainId: null, positionInConsist: null, loadStatus: "EMPTY",   grossWeightTons: 28,  hazmat: false, lastABTResult: "FAIL", lastDetectorResult: "N/A", destinationYard: "Taschereau", waybillNumber: "WB-2026-44088", setOutReason: "ABT FAIL — brake cylinder not releasing. Set out at Taschereau T-22.", notes: "Awaiting mechanical inspection." },
  { carId: "CSXT 4412",    reportingMark: "CSXT", carNumber: "4412",   carType: "BOXCAR",           ownerRailroad: "CSX Transportation", status: "BAD_ORDER", trainId: null, positionInConsist: null, loadStatus: "EMPTY",  grossWeightTons: 30,  hazmat: false, lastABTResult: "FAIL", lastDetectorResult: "N/A", destinationYard: "Taschereau", waybillNumber: "WB-2026-44089", setOutReason: "ABT FAIL — angle cock partially closed. Set out at Taschereau T-22.", notes: "Awaiting mechanical inspection." },
  // In yard cars
  { carId: "CN 441290",    reportingMark: "CN",   carNumber: "441290", carType: "TANK_CAR",         ownerRailroad: "CN",             status: "IN_YARD",    trainId: null, positionInConsist: null, loadStatus: "EMPTY",   grossWeightTons: 28,  hazmat: false, lastABTResult: "N/A", lastDetectorResult: "N/A", destinationYard: "MacMillan",  waybillNumber: "WB-2026-77001" },
  { carId: "CN 334402",    reportingMark: "CN",   carNumber: "334402", carType: "BOXCAR",           ownerRailroad: "CN",             status: "IN_YARD",    trainId: null, positionInConsist: null, loadStatus: "LOADED",  commodity: "General merchandise", grossWeightTons: 72, hazmat: false, lastABTResult: "N/A", lastDetectorResult: "N/A", destinationYard: "MacMillan", waybillNumber: "WB-2026-77002" },
];

// ─── Helper: get locos for a train ───────────────────────────────────────────

export function getLocosForTrain(trainId: string): LocomotiveDetail[] {
  return LOCOMOTIVE_DETAILS.filter(l => l.trainId === trainId)
    .sort((a, b) => a.positionInConsist - b.positionInConsist);
}

export function getCarsForTrain(trainId: string): CarRecord[] {
  return CAR_RECORDS.filter(c => c.trainId === trainId)
    .sort((a, b) => (a.positionInConsist ?? 999) - (b.positionInConsist ?? 999));
}

export function getLeadLoco(trainId: string): LocomotiveDetail | undefined {
  return LOCOMOTIVE_DETAILS.find(l => l.trainId === trainId && l.position === "LEAD");
}

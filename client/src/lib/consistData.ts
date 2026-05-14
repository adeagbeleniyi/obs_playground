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
  // Train CN-M30151-05 — 113 cars (representative sample)
  { carId: "BNSF 112848",  reportingMark: "BNSF", carNumber: "112848", carType: "GONDOLA",          ownerRailroad: "BNSF",           status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 45, loadStatus: "LOADED",  commodity: "Coal",      grossWeightTons: 136, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker",     waybillNumber: "WB-2026-55201" },
  { carId: "CN 521045",    reportingMark: "CN",   carNumber: "521045", carType: "COVERED_HOPPER",   ownerRailroad: "CN",             status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 46, loadStatus: "LOADED",  commodity: "Wheat",     grossWeightTons: 142, hazmat: false, lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker",     waybillNumber: "WB-2026-55202" },
  { carId: "CP 624411",    reportingMark: "CP",   carNumber: "624411", carType: "TANK_CAR",         ownerRailroad: "CP Rail",        status: "IN_CONSIST", trainId: "CN-M30151-05", positionInConsist: 12, loadStatus: "LOADED",  commodity: "Sodium hydroxide", grossWeightTons: 110, hazmat: true, hazmatClass: "Class 8 — Corrosive", lastABTResult: "PASS", lastDetectorResult: "CLEAR", lastDetectorMp: 40.5, lastDetectorTime: "2026-05-05 07:45:00", destinationYard: "Walker", waybillNumber: "WB-2026-55203" },
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

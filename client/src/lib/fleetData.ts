
// CN Rail OT Observability — Fleet Ecosystem Data
// Full train lifecycle: yards, en-route, stopped, consist ops, air brake tests
// ─────────────────────────────────────────────────────────────────────────────

export type TrainState =
  | "IN_YARD_PRE_DEPARTURE"
  | "DEPARTING"
  | "EN_ROUTE_MOVING"
  | "EN_ROUTE_STOPPED"
  | "ARRIVING"
  | "IN_YARD_POST_ARRIVAL"
  | "IN_YARD_CLASSIFYING";

export type StopReason =
  | "SIGNAL_HOLD"
  | "MEET_PASS"
  | "CREW_CHANGE"
  | "MECHANICAL_INSPECTION"
  | "SLOW_ORDER"
  | "PTC_ENFORCEMENT"
  | "EMERGENCY_BRAKE"
  | "DETECTOR_FLAG"
  | "FUEL";

export type AirBrakeTestType = "ITABT" | "RABT" | "CONTINUITY";
export type AirBrakeTestResult = "PASS" | "FAIL" | "IN_PROGRESS" | "PENDING";

export type ConsistEventType =
  | "CAR_ADDED"
  | "CAR_REMOVED"
  | "LOCO_ADDED"
  | "LOCO_REMOVED"
  | "LOCO_REPOSITIONED"
  | "DPU_CONNECTED"
  | "DPU_DISCONNECTED"
  | "INTERCHANGE_IN"
  | "INTERCHANGE_OUT";

export type DetectorAlarmType =
  | "HBD" | "HWD" | "WILD" | "ABD" | "CRD" | "DED" | "TPD" | "DPU";

// ─── Yards ────────────────────────────────────────────────────────────────────

export interface Yard {
  id: string;
  name: string;
  city: string;
  province: string;
  subdivision: string;
  type: "CLASSIFICATION" | "INTERMODAL" | "LOCOMOTIVE" | "MIXED";
  tracks: number;
  capacity: number;
  currentCars: number;
  currentLocos: number;
  trainsInYard: number;
  trainsArriving: number;
  trainsDeparting: number;
  lat: number;
  lon: number;
}

export const YARDS: Yard[] = [
  { id: "TASCHEREAU", name: "Taschereau Yard", city: "Montréal", province: "QC", subdivision: "Montréal", type: "CLASSIFICATION", tracks: 48, capacity: 3200, currentCars: 2140, currentLocos: 38, trainsInYard: 12, trainsArriving: 3, trainsDeparting: 2, lat: 45.53, lon: -73.62 },
  { id: "MACMILLAN", name: "MacMillan Yard", city: "Toronto", province: "ON", subdivision: "Kingston", type: "CLASSIFICATION", tracks: 52, capacity: 3800, currentCars: 2890, currentLocos: 44, trainsInYard: 15, trainsArriving: 4, trainsDeparting: 3, lat: 43.78, lon: -79.47 },
  { id: "WALKER", name: "Walker Yard", city: "Edmonton", province: "AB", subdivision: "Edson", type: "CLASSIFICATION", tracks: 36, capacity: 2400, currentCars: 1680, currentLocos: 29, trainsInYard: 9, trainsArriving: 2, trainsDeparting: 2, lat: 53.54, lon: -113.38 },
  { id: "SYMINGTON", name: "Symington Yard", city: "Winnipeg", province: "MB", subdivision: "Rivers", type: "CLASSIFICATION", tracks: 40, capacity: 2800, currentCars: 1920, currentLocos: 32, trainsInYard: 11, trainsArriving: 3, trainsDeparting: 1, lat: 49.88, lon: -97.07 },
  { id: "GORDON", name: "Gordon Yard", city: "Moncton", province: "NB", subdivision: "Moncton", type: "MIXED", tracks: 22, capacity: 1400, currentCars: 880, currentLocos: 16, trainsInYard: 5, trainsArriving: 1, trainsDeparting: 1, lat: 46.09, lon: -64.78 },
  { id: "TRANSCONA", name: "Transcona Shops", city: "Winnipeg", province: "MB", subdivision: "Rivers", type: "LOCOMOTIVE", tracks: 18, capacity: 0, currentCars: 0, currentLocos: 24, trainsInYard: 0, trainsArriving: 0, trainsDeparting: 0, lat: 49.89, lon: -97.01 },
  { id: "PRINCE_GEORGE", name: "Prince George Yard", city: "Prince George", province: "BC", subdivision: "Prince George", type: "MIXED", tracks: 20, capacity: 1200, currentCars: 740, currentLocos: 14, trainsInYard: 4, trainsArriving: 1, trainsDeparting: 1, lat: 53.91, lon: -122.77 },
  { id: "HARVEY", name: "Harvey Yard", city: "New Orleans", province: "LA", subdivision: "Baton Rouge", type: "INTERMODAL", tracks: 28, capacity: 1800, currentCars: 1340, currentLocos: 22, trainsInYard: 7, trainsArriving: 2, trainsDeparting: 2, lat: 29.90, lon: -90.07 },
  { id: "CAPREOL", name: "Capreol Yard", city: "Capreol", province: "ON", subdivision: "MacMillan", type: "MIXED", tracks: 16, capacity: 900, currentCars: 620, currentLocos: 10, trainsInYard: 3, trainsArriving: 1, trainsDeparting: 1, lat: 46.71, lon: -80.93 },
  { id: "JASPER", name: "Jasper Yard", city: "Jasper", province: "AB", subdivision: "Edson", type: "LOCOMOTIVE", tracks: 12, capacity: 400, currentCars: 180, currentLocos: 18, trainsInYard: 2, trainsArriving: 1, trainsDeparting: 1, lat: 52.88, lon: -118.08 },
  { id: "BIGGAR", name: "Biggar Yard", city: "Biggar", province: "SK", subdivision: "Wainwright", type: "MIXED", tracks: 14, capacity: 800, currentCars: 490, currentLocos: 8, trainsInYard: 2, trainsArriving: 1, trainsDeparting: 0, lat: 52.05, lon: -107.98 },
  { id: "BROCKVILLE", name: "Brockville Siding", city: "Brockville", province: "ON", subdivision: "Kingston", type: "MIXED", tracks: 8, capacity: 300, currentCars: 140, currentLocos: 4, trainsInYard: 1, trainsArriving: 1, trainsDeparting: 0, lat: 44.59, lon: -75.69 },
];

// ─── Air Brake Tests ──────────────────────────────────────────────────────────

export interface AirBrakeTest {
  id: string;
  trainId: string;
  type: AirBrakeTestType;
  yard: string;
  track: string;
  startTime: string;
  endTime: string | null;
  result: AirBrakeTestResult;
  conductedBy: string;
  brakePipePressure: number;
  leakageRate: number;
  leakageLimit: number;
  brakesApplied: number;
  brakesTotal: number;
  defects: string[];
  notes: string;
  triggeredBy: "INITIAL_TERMINAL" | "CONSIST_CHANGE" | "ENROUTE_INSPECTION" | "REGULATORY";
}

export const AIR_BRAKE_TESTS: AirBrakeTest[] = [
  { id: "ABT-2026-001", trainId: "CN-Q11451-05", type: "ITABT", yard: "MACMILLAN", track: "T-14", startTime: "2026-05-14 05:30:00", endTime: "2026-05-14 06:12:00", result: "PASS", conductedBy: "Crew 4412", brakePipePressure: 90, leakageRate: 2.1, leakageLimit: 5.0, brakesApplied: 84, brakesTotal: 84, defects: [], notes: "All brakes applied and released. Continuity confirmed end-to-end.", triggeredBy: "INITIAL_TERMINAL" },
  { id: "ABT-2026-002", trainId: "CN-M30151-05", type: "RABT", yard: "SYMINGTON", track: "T-08", startTime: "2026-05-14 07:15:00", endTime: "2026-05-14 07:28:00", result: "PASS", conductedBy: "Crew 5501", brakePipePressure: 90, leakageRate: 1.8, leakageLimit: 5.0, brakesApplied: 22, brakesTotal: 22, defects: [], notes: "Running air brake test after 22-car pick-up at Symington.", triggeredBy: "CONSIST_CHANGE" },
  { id: "ABT-2026-003", trainId: "CN-A41451-05", type: "ITABT", yard: "TASCHEREAU", track: "T-22", startTime: "2026-05-14 06:00:00", endTime: "2026-05-14 06:55:00", result: "FAIL", conductedBy: "Crew 7788", brakePipePressure: 88, leakageRate: 6.4, leakageLimit: 5.0, brakesApplied: 91, brakesTotal: 96, defects: ["TTGX 8841 — brake cylinder not releasing", "CSXT 4412 — angle cock partially closed"], notes: "Test failed: leakage rate exceeded limit. 5 brakes not applied. Cars TTGX 8841 and CSXT 4412 flagged.", triggeredBy: "INITIAL_TERMINAL" },
  { id: "ABT-2026-004", trainId: "CN-A41451-05", type: "ITABT", yard: "TASCHEREAU", track: "T-22", startTime: "2026-05-14 08:10:00", endTime: null, result: "IN_PROGRESS", conductedBy: "Crew 7788", brakePipePressure: 90, leakageRate: 0, leakageLimit: 5.0, brakesApplied: 0, brakesTotal: 94, defects: [], notes: "Re-test after TTGX 8841 and CSXT 4412 removed from consist.", triggeredBy: "INITIAL_TERMINAL" },
  { id: "ABT-2026-005", trainId: "CN-K88151-05", type: "ITABT", yard: "MACMILLAN", track: "T-07", startTime: "2026-05-14 10:00:00", endTime: "2026-05-14 10:52:00", result: "PASS", conductedBy: "Crew 8812", brakePipePressure: 90, leakageRate: 2.8, leakageLimit: 5.0, brakesApplied: 122, brakesTotal: 122, defects: [], notes: "All brakes applied and released. 122-car consist cleared for departure.", triggeredBy: "INITIAL_TERMINAL" },
  { id: "ABT-2026-006", trainId: "CN-H22351-05", type: "RABT", yard: "WALKER", track: "T-11", startTime: "2026-05-14 05:00:00", endTime: "2026-05-14 05:14:00", result: "PASS", conductedBy: "Crew 5577", brakePipePressure: 90, leakageRate: 1.4, leakageLimit: 5.0, brakesApplied: 88, brakesTotal: 88, defects: [], notes: "RABT PASS. Train cleared for departure on Wainwright Sub.", triggeredBy: "INITIAL_TERMINAL" },
  { id: "ABT-2026-007", trainId: "CN-B44251-05", type: "ITABT", yard: "TASCHEREAU", track: "T-22", startTime: "2026-05-14 09:30:00", endTime: null, result: "PENDING", conductedBy: "Crew 1144", brakePipePressure: 0, leakageRate: 0, leakageLimit: 5.0, brakesApplied: 0, brakesTotal: 94, defects: [], notes: "ITABT scheduled for 10:00. Crew called at 10:00.", triggeredBy: "INITIAL_TERMINAL" },
  { id: "ABT-2026-008", trainId: "CN-L50251-05", type: "CONTINUITY", yard: "JASPER", track: "T-04", startTime: "2026-05-14 11:00:00", endTime: "2026-05-14 11:08:00", result: "PASS", conductedBy: "Crew 6612", brakePipePressure: 90, leakageRate: 2.2, leakageLimit: 5.0, brakesApplied: 148, brakesTotal: 148, defects: [], notes: "Continuity test after crew change at Jasper. All 148 cars confirmed.", triggeredBy: "CONSIST_CHANGE" },
  { id: "ABT-2026-009", trainId: "CN-R33451-05", type: "ITABT", yard: "GORDON", track: "T-03", startTime: "2026-05-14 04:00:00", endTime: "2026-05-14 04:44:00", result: "PASS", conductedBy: "Crew 4488", brakePipePressure: 90, leakageRate: 3.1, leakageLimit: 5.0, brakesApplied: 66, brakesTotal: 66, defects: [], notes: "ITABT PASS. Train cleared for departure on Moncton Sub.", triggeredBy: "INITIAL_TERMINAL" },
  { id: "ABT-2026-010", trainId: "CN-V22451-05", type: "RABT", yard: "PRINCE_GEORGE", track: "T-06", startTime: "2026-05-14 06:30:00", endTime: "2026-05-14 06:41:00", result: "FAIL", conductedBy: "Crew 7712", brakePipePressure: 87, leakageRate: 5.8, leakageLimit: 5.0, brakesApplied: 44, brakesTotal: 48, defects: ["CN 441022 — brake shoe worn, not applying", "UP 334521 — retainer valve stuck open"], notes: "RABT FAIL — 4 brakes not applied, leakage 5.8 psi/min. Cars flagged. Re-test pending.", triggeredBy: "CONSIST_CHANGE" },
];

// ─── Consist Change Events ────────────────────────────────────────────────────

export interface ConsistEvent {
  id: string;
  trainId: string;
  timestamp: string;
  yard: string;
  type: ConsistEventType;
  carOrLocoId: string;
  carType?: string;
  fromTrain?: string;
  toTrain?: string;
  foreignRailroad?: string;
  position?: number;
  newConsistLength?: number;
  newConsistWeight?: number;
  triggeredAirBrakeTest: boolean;
  airBrakeTestId?: string;
}

export const CONSIST_EVENTS: ConsistEvent[] = [
  { id: "CE-001", trainId: "CN-M30151-05", timestamp: "2026-05-14 06:45:00", yard: "SYMINGTON", type: "CAR_ADDED", carOrLocoId: "BNSF 112847", carType: "Gondola", foreignRailroad: "BNSF", position: 45, newConsistLength: 112, newConsistWeight: 14200, triggeredAirBrakeTest: false },
  { id: "CE-002", trainId: "CN-M30151-05", timestamp: "2026-05-14 06:52:00", yard: "SYMINGTON", type: "CAR_ADDED", carOrLocoId: "CN 521044", carType: "Covered Hopper", position: 46, newConsistLength: 113, newConsistWeight: 14380, triggeredAirBrakeTest: false },
  { id: "CE-003", trainId: "CN-M30151-05", timestamp: "2026-05-14 07:10:00", yard: "SYMINGTON", type: "CAR_REMOVED", carOrLocoId: "TTGX 9012", carType: "Intermodal Flat", position: 12, newConsistLength: 112, newConsistWeight: 14100, triggeredAirBrakeTest: false },
  { id: "CE-004", trainId: "CN-M30151-05", timestamp: "2026-05-14 07:14:00", yard: "SYMINGTON", type: "CAR_ADDED", carOrLocoId: "CP 624411", carType: "Tank Car", foreignRailroad: "CP Rail", position: 12, newConsistLength: 113, newConsistWeight: 14290, triggeredAirBrakeTest: true, airBrakeTestId: "ABT-2026-002" },
  { id: "CE-005", trainId: "CN-A41451-05", timestamp: "2026-05-14 07:55:00", yard: "TASCHEREAU", type: "CAR_REMOVED", carOrLocoId: "TTGX 8841", carType: "Intermodal Flat", position: 22, newConsistLength: 95, newConsistWeight: 11200, triggeredAirBrakeTest: true, airBrakeTestId: "ABT-2026-004" },
  { id: "CE-006", trainId: "CN-A41451-05", timestamp: "2026-05-14 07:56:00", yard: "TASCHEREAU", type: "CAR_REMOVED", carOrLocoId: "CSXT 4412", carType: "Boxcar", foreignRailroad: "CSX", position: 31, newConsistLength: 94, newConsistWeight: 11080, triggeredAirBrakeTest: false },
  { id: "CE-007", trainId: "CN-Q11451-05", timestamp: "2026-05-14 04:10:00", yard: "MACMILLAN", type: "DPU_CONNECTED", carOrLocoId: "CN 2644 (DPU)", position: 84, newConsistLength: 84, newConsistWeight: 18400, triggeredAirBrakeTest: false },
  { id: "CE-008", trainId: "CN-Q11451-05", timestamp: "2026-05-14 04:22:00", yard: "MACMILLAN", type: "INTERCHANGE_IN", carOrLocoId: "NS 74412", carType: "Autorack", foreignRailroad: "Norfolk Southern", position: 1, newConsistLength: 85, newConsistWeight: 18650, triggeredAirBrakeTest: false },
  { id: "CE-009", trainId: "CN-K88151-05", timestamp: "2026-05-14 09:30:00", yard: "MACMILLAN", type: "LOCO_ADDED", carOrLocoId: "CN 3888", position: 3, newConsistLength: 122, newConsistWeight: 21400, triggeredAirBrakeTest: false },
  { id: "CE-010", trainId: "CN-K88151-05", timestamp: "2026-05-14 09:45:00", yard: "MACMILLAN", type: "DPU_CONNECTED", carOrLocoId: "CN 3901 (DPU)", position: 122, newConsistLength: 122, newConsistWeight: 21400, triggeredAirBrakeTest: false },
  { id: "CE-011", trainId: "CN-H22351-05", timestamp: "2026-05-14 04:30:00", yard: "WALKER", type: "INTERCHANGE_IN", carOrLocoId: "UP 334521", carType: "Gondola", foreignRailroad: "Union Pacific", position: 33, newConsistLength: 88, newConsistWeight: 17600, triggeredAirBrakeTest: false },
  { id: "CE-012", trainId: "CN-L50251-05", timestamp: "2026-05-14 11:15:00", yard: "JASPER", type: "CAR_REMOVED", carOrLocoId: "CN 881044", carType: "Tank Car", position: 12, newConsistLength: 147, newConsistWeight: 23800, triggeredAirBrakeTest: true, airBrakeTestId: "ABT-2026-008" },
  { id: "CE-013", trainId: "CN-R33451-05", timestamp: "2026-05-14 03:30:00", yard: "GORDON", type: "INTERCHANGE_IN", carOrLocoId: "CN 620044", carType: "Intermodal", foreignRailroad: "CN", position: 11, newConsistLength: 66, newConsistWeight: 13200, triggeredAirBrakeTest: false },
  { id: "CE-014", trainId: "CN-V22451-05", timestamp: "2026-05-14 06:00:00", yard: "PRINCE_GEORGE", type: "CAR_REMOVED", carOrLocoId: "CN 441022", carType: "Gondola", position: 22, newConsistLength: 48, newConsistWeight: 9600, triggeredAirBrakeTest: true, airBrakeTestId: "ABT-2026-010" },
];

// ─── Fleet State Snapshot ─────────────────────────────────────────────────────

export interface TrainSnapshot {
  id: string;
  symbol: string;
  state: TrainState;
  subdivision: string;
  milepost: number;
  direction: "EAST" | "WEST" | "NORTH" | "SOUTH";
  speed: number;
  speedLimit: number;
  yardId?: string;
  yardTrack?: string;
  stopReason?: StopReason;
  stopDuration?: number;
  locos: string[];
  cars: number;
  weight: number;
  length: number;
  hasDPU: boolean;
  ptcState: "ACTIVE" | "SUPPRESSED" | "BYPASS" | "INITIALIZING" | "NOT_EQUIPPED";
  tripOptimizerActive: boolean;
  fuelSavedGallons: number;
  milesThisTrip: number;
  milesToday: number;
  crew: string;
  hosRemainingMin: number;
  lastDetectorMp: number;
  lastDetectorResult: "CLEAR" | "ALARM" | "WARNING";
  activeAlarms: number;
  lat: number;
  lon: number;
  departureTime?: string;
  estimatedArrival?: string;
  origin: string;
  destination: string;
  foreignCars: number;
  interchangeRailroad?: string;
}

export const FLEET_SNAPSHOT: TrainSnapshot[] = [
  // ── EN ROUTE MOVING ──────────────────────────────────────────────────────
  { id: "CN-Q11451-05", symbol: "Q11451-05", state: "EN_ROUTE_MOVING", subdivision: "Kingston", milepost: 188.4, direction: "EAST", speed: 52, speedLimit: 60, locos: ["CN 3864", "CN 3901"], cars: 85, weight: 18650, length: 5420, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 142, milesThisTrip: 188, milesToday: 188, crew: "CRW-3301", hosRemainingMin: 195, lastDetectorMp: 180.2, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.12, lon: -76.88, departureTime: "2026-05-14 06:22:00", estimatedArrival: "2026-05-14 16:30:00", origin: "MacMillan Yard", destination: "Taschereau Yard", foreignCars: 8, interchangeRailroad: "NS" },
  { id: "CN-M30151-05", symbol: "M30151-05", state: "EN_ROUTE_MOVING", subdivision: "Rivers", milepost: 44.1, direction: "WEST", speed: 48, speedLimit: 50, locos: ["CN 5501", "CN 5488"], cars: 113, weight: 14290, length: 7100, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 88, milesThisTrip: 44, milesToday: 44, crew: "CRW-2233", hosRemainingMin: 405, lastDetectorMp: 40.5, lastDetectorResult: "WARNING", activeAlarms: 1, lat: 49.92, lon: -97.88, departureTime: "2026-05-14 09:15:00", estimatedArrival: "2026-05-14 19:00:00", origin: "Symington Yard", destination: "Walker Yard", foreignCars: 14, interchangeRailroad: "CP/BNSF" },
  { id: "CN-L50251-05", symbol: "L50251-05", state: "EN_ROUTE_MOVING", subdivision: "Edson", milepost: 112.8, direction: "EAST", speed: 44, speedLimit: 50, locos: ["CN 4102", "CN 4088", "CN 4099"], cars: 148, weight: 24100, length: 9200, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 112, milesToday: 112, crew: "CRW-1122", hosRemainingMin: 330, lastDetectorMp: 108.4, lastDetectorResult: "ALARM", activeAlarms: 2, lat: 53.22, lon: -116.44, departureTime: "2026-05-14 08:00:00", estimatedArrival: "2026-05-14 20:00:00", origin: "Walker Yard", destination: "MacMillan Yard", foreignCars: 0 },
  { id: "CN-G87351-05", symbol: "G87351-05", state: "EN_ROUTE_MOVING", subdivision: "Bala", milepost: 88.2, direction: "NORTH", speed: 55, speedLimit: 60, locos: ["CN 7788"], cars: 42, weight: 5800, length: 2900, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 31, milesThisTrip: 88, milesToday: 88, crew: "CRW-4455", hosRemainingMin: 450, lastDetectorMp: 82.1, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.88, lon: -79.22, departureTime: "2026-05-14 10:00:00", estimatedArrival: "2026-05-14 16:45:00", origin: "MacMillan Yard", destination: "Capreol", foreignCars: 2, interchangeRailroad: "CP" },
  { id: "CN-A41451-05", symbol: "A41451-05", state: "EN_ROUTE_MOVING", subdivision: "Montréal", milepost: 22.4, direction: "EAST", speed: 60, speedLimit: 60, locos: ["CN 2201", "CN 2188"], cars: 94, weight: 11080, length: 6100, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 18, milesThisTrip: 22, milesToday: 22, crew: "CRW-5566", hosRemainingMin: 390, lastDetectorMp: 18.8, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.61, lon: -73.22, departureTime: "2026-05-14 08:55:00", estimatedArrival: "2026-05-14 16:00:00", origin: "Taschereau Yard", destination: "Gordon Yard", foreignCars: 0 },
  { id: "CN-H22351-05", symbol: "H22351-05", state: "EN_ROUTE_MOVING", subdivision: "Wainwright", milepost: 122.4, direction: "EAST", speed: 58, speedLimit: 60, locos: ["CN 8812", "CN 8801"], cars: 88, weight: 17600, length: 5800, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 112, milesThisTrip: 122, milesToday: 122, crew: "CRW-5577", hosRemainingMin: 210, lastDetectorMp: 118.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 52.84, lon: -111.22, departureTime: "2026-05-14 06:00:00", estimatedArrival: "2026-05-14 17:00:00", origin: "Walker Yard", destination: "Biggar, SK", foreignCars: 4, interchangeRailroad: "UP" },
  { id: "CN-R33451-05", symbol: "R33451-05", state: "EN_ROUTE_MOVING", subdivision: "Moncton", milepost: 44.2, direction: "WEST", speed: 55, speedLimit: 60, locos: ["CN 2201", "CN 2188"], cars: 66, weight: 13200, length: 4400, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 44, milesThisTrip: 44, milesToday: 44, crew: "CRW-4488", hosRemainingMin: 300, lastDetectorMp: 40.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.92, lon: -64.44, departureTime: "2026-05-14 07:30:00", estimatedArrival: "2026-05-14 16:10:00", origin: "Gordon Yard", destination: "Taschereau Yard", foreignCars: 8, interchangeRailroad: "CN" },
  { id: "CN-W44251-05", symbol: "W44251-05", state: "EN_ROUTE_MOVING", subdivision: "MacMillan", milepost: 44.8, direction: "NORTH", speed: 50, speedLimit: 55, locos: ["CN 7712", "CN 7699"], cars: 76, weight: 15200, length: 4900, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 38, milesThisTrip: 44, milesToday: 44, crew: "CRW-9900", hosRemainingMin: 510, lastDetectorMp: 40.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.88, lon: -79.88, departureTime: "2026-05-14 11:00:00", estimatedArrival: "2026-05-14 17:30:00", origin: "MacMillan Yard", destination: "Capreol Yard", foreignCars: 0 },
  { id: "CN-D55151-05", symbol: "D55151-05", state: "EN_ROUTE_MOVING", subdivision: "Kingston", milepost: 88.4, direction: "EAST", speed: 56, speedLimit: 60, locos: ["CN 3412", "CN 3398"], cars: 92, weight: 18400, length: 5900, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 88, milesThisTrip: 88, milesToday: 88, crew: "CRW-1144", hosRemainingMin: 480, lastDetectorMp: 82.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.22, lon: -77.44, departureTime: "2026-05-14 07:00:00", estimatedArrival: "2026-05-14 14:00:00", origin: "MacMillan Yard", destination: "Taschereau Yard", foreignCars: 12, interchangeRailroad: "CSX" },
  { id: "CN-E66251-05", symbol: "E66251-05", state: "EN_ROUTE_MOVING", subdivision: "Edson", milepost: 80.2, direction: "WEST", speed: 44, speedLimit: 50, locos: ["CN 4412", "CN 4388", "CN 4401"], cars: 152, weight: 26400, length: 9800, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 80, milesToday: 80, crew: "CRW-6612", hosRemainingMin: 90, lastDetectorMp: 76.0, lastDetectorResult: "WARNING", activeAlarms: 1, lat: 53.40, lon: -117.60, departureTime: "2026-05-14 04:00:00", estimatedArrival: "2026-05-14 16:00:00", origin: "MacMillan Yard", destination: "Walker Yard", foreignCars: 0 },
  // ── EN ROUTE STOPPED ─────────────────────────────────────────────────────
  { id: "CN-T22151-05", symbol: "T22151-05", state: "EN_ROUTE_STOPPED", subdivision: "Ruel", milepost: 201.4, direction: "EAST", speed: 0, speedLimit: 40, stopReason: "MEET_PASS", stopDuration: 18, locos: ["CN 3412", "CN 3398"], cars: 78, weight: 12400, length: 5100, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 204, milesThisTrip: 201, milesToday: 201, crew: "CRW-7788", hosRemainingMin: 30, lastDetectorMp: 198.2, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 47.44, lon: -82.11, departureTime: "2026-05-14 07:00:00", estimatedArrival: "2026-05-14 15:20:00", origin: "Gordon Yard", destination: "Symington Yard", foreignCars: 4 },
  { id: "CN-U55451-05", symbol: "U55451-05", state: "EN_ROUTE_STOPPED", subdivision: "Kingston", milepost: 144.8, direction: "EAST", speed: 0, speedLimit: 60, stopReason: "DETECTOR_FLAG", stopDuration: 34, locos: ["CN 8812"], cars: 55, weight: 7200, length: 3800, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 55, milesThisTrip: 144, milesToday: 144, crew: "CRW-8899", hosRemainingMin: 180, lastDetectorMp: 144.8, lastDetectorResult: "ALARM", activeAlarms: 3, lat: 44.44, lon: -76.11, departureTime: "2026-05-14 05:00:00", estimatedArrival: "2026-05-14 16:00:00", origin: "Taschereau Yard", destination: "MacMillan Yard", foreignCars: 0 },
  { id: "CN-V22451-05", symbol: "V22451-05", state: "EN_ROUTE_STOPPED", subdivision: "Prince George", milepost: 88.4, direction: "SOUTH", speed: 0, speedLimit: 45, stopReason: "MECHANICAL_INSPECTION", stopDuration: 55, locos: ["CN 4812", "CN 4799"], cars: 48, weight: 9600, length: 3200, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 22, milesThisTrip: 88, milesToday: 88, crew: "CRW-3388", hosRemainingMin: 0, lastDetectorMp: 84.0, lastDetectorResult: "WARNING", activeAlarms: 1, lat: 53.44, lon: -122.44, departureTime: "2026-05-14 02:00:00", estimatedArrival: "2026-05-14 14:00:00", origin: "Prince George Yard", destination: "Walker Yard", foreignCars: 0 },
  // ── IN YARD PRE-DEPARTURE ─────────────────────────────────────────────────
  { id: "CN-B44251-05", symbol: "B44251-05", state: "IN_YARD_PRE_DEPARTURE", subdivision: "Montréal", milepost: 0, direction: "EAST", speed: 0, speedLimit: 10, yardId: "TASCHEREAU", yardTrack: "T-22", locos: ["CN 2201", "CN 2188"], cars: 94, weight: 11080, length: 6100, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 0, milesToday: 0, crew: "CRW-1144", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.53, lon: -73.62, origin: "Taschereau Yard", destination: "Gordon Yard", foreignCars: 0 },
  { id: "CN-K88151-05", symbol: "K88151-05", state: "IN_YARD_PRE_DEPARTURE", subdivision: "Kingston", milepost: 0, direction: "WEST", speed: 0, speedLimit: 10, yardId: "MACMILLAN", yardTrack: "T-07", locos: ["CN 3864", "CN 3901", "CN 3888"], cars: 122, weight: 21400, length: 7800, hasDPU: true, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 0, milesToday: 0, crew: "CRW-9900", hosRemainingMin: 510, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 43.78, lon: -79.47, origin: "MacMillan Yard", destination: "Walker Yard", foreignCars: 22 },
  { id: "CN-N11451-05", symbol: "N11451-05", state: "IN_YARD_PRE_DEPARTURE", subdivision: "Edson", milepost: 0, direction: "EAST", speed: 0, speedLimit: 10, yardId: "WALKER", yardTrack: "T-12", locos: ["CN 4102", "CN 4088"], cars: 104, weight: 20800, length: 6800, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 0, milesToday: 0, crew: "CRW-3388", hosRemainingMin: 0, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 53.54, lon: -113.38, origin: "Walker Yard", destination: "MacMillan Yard", foreignCars: 0 },
  // ── IN YARD POST ARRIVAL ──────────────────────────────────────────────────
  { id: "CN-P11151-05", symbol: "P11151-05", state: "IN_YARD_POST_ARRIVAL", subdivision: "Edson", milepost: 0, direction: "WEST", speed: 0, speedLimit: 10, yardId: "WALKER", yardTrack: "T-18", locos: ["CN 4412", "CN 4388"], cars: 88, weight: 13200, length: 5800, hasDPU: false, ptcState: "NOT_EQUIPPED", tripOptimizerActive: false, fuelSavedGallons: 318, milesThisTrip: 412, milesToday: 412, crew: "CRW-3388", hosRemainingMin: 0, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 1, lat: 53.54, lon: -113.38, origin: "MacMillan Yard", destination: "Walker Yard", foreignCars: 8 },
  // ── ARRIVING ──────────────────────────────────────────────────────────────
  { id: "CN-F77251-05", symbol: "F77251-05", state: "ARRIVING", subdivision: "Rivers", milepost: 2.1, direction: "EAST", speed: 12, speedLimit: 15, yardId: "SYMINGTON", locos: ["CN 6612", "CN 6588"], cars: 96, weight: 15800, length: 6400, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 188, milesThisTrip: 398, milesToday: 398, crew: "CRW-6644", hosRemainingMin: 22, lastDetectorMp: 1.8, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 49.88, lon: -97.09, origin: "Walker Yard", destination: "Symington Yard", foreignCars: 12 },
  { id: "CN-J88451-05", symbol: "J88451-05", state: "ARRIVING", subdivision: "MacMillan", milepost: 1.2, direction: "SOUTH", speed: 10, speedLimit: 15, yardId: "CAPREOL", locos: ["CN 7788", "CN 7801"], cars: 58, weight: 9800, length: 3900, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 144, milesThisTrip: 148, milesToday: 148, crew: "CRW-4455", hosRemainingMin: 450, lastDetectorMp: 0.8, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 46.72, lon: -80.94, origin: "MacMillan Yard", destination: "Capreol Yard", foreignCars: 0 },
];

// ─── Network Metrics (time-series for time-travel) ────────────────────────────

export interface NetworkSnapshot {
  time: string;
  trainsMoving: number;
  trainsStopped: number;
  trainsInYard: number;
  trainsArriving: number;
  trainsDeparting: number;
  totalMilesNetwork: number;
  activeAlarms: number;
  ptcCompliance: number;
  tripOptimizerActive: number;
  fuelSavedGallons: number;
}

export const NETWORK_TIMELINE: NetworkSnapshot[] = [
  { time: "00:00", trainsMoving: 88, trainsStopped: 12, trainsInYard: 52, trainsArriving: 8, trainsDeparting: 6, totalMilesNetwork: 0, activeAlarms: 4, ptcCompliance: 99.1, tripOptimizerActive: 71, fuelSavedGallons: 0 },
  { time: "01:00", trainsMoving: 84, trainsStopped: 14, trainsInYard: 54, trainsArriving: 7, trainsDeparting: 5, totalMilesNetwork: 4800, activeAlarms: 3, ptcCompliance: 99.2, tripOptimizerActive: 69, fuelSavedGallons: 1200 },
  { time: "02:00", trainsMoving: 82, trainsStopped: 15, trainsInYard: 55, trainsArriving: 6, trainsDeparting: 4, totalMilesNetwork: 9400, activeAlarms: 5, ptcCompliance: 99.0, tripOptimizerActive: 67, fuelSavedGallons: 2600 },
  { time: "03:00", trainsMoving: 80, trainsStopped: 16, trainsInYard: 56, trainsArriving: 5, trainsDeparting: 5, totalMilesNetwork: 13800, activeAlarms: 6, ptcCompliance: 98.9, tripOptimizerActive: 65, fuelSavedGallons: 4100 },
  { time: "04:00", trainsMoving: 86, trainsStopped: 11, trainsInYard: 55, trainsArriving: 9, trainsDeparting: 8, totalMilesNetwork: 18600, activeAlarms: 4, ptcCompliance: 99.1, tripOptimizerActive: 70, fuelSavedGallons: 5800 },
  { time: "05:00", trainsMoving: 92, trainsStopped: 10, trainsInYard: 50, trainsArriving: 11, trainsDeparting: 10, totalMilesNetwork: 24100, activeAlarms: 3, ptcCompliance: 99.3, tripOptimizerActive: 75, fuelSavedGallons: 7800 },
  { time: "06:00", trainsMoving: 98, trainsStopped: 9, trainsInYard: 45, trainsArriving: 13, trainsDeparting: 12, totalMilesNetwork: 30200, activeAlarms: 2, ptcCompliance: 99.4, tripOptimizerActive: 80, fuelSavedGallons: 10200 },
  { time: "07:00", trainsMoving: 104, trainsStopped: 8, trainsInYard: 40, trainsArriving: 14, trainsDeparting: 14, totalMilesNetwork: 36800, activeAlarms: 4, ptcCompliance: 99.2, tripOptimizerActive: 84, fuelSavedGallons: 12900 },
  { time: "08:00", trainsMoving: 108, trainsStopped: 10, trainsInYard: 44, trainsArriving: 12, trainsDeparting: 11, totalMilesNetwork: 43800, activeAlarms: 7, ptcCompliance: 99.0, tripOptimizerActive: 87, fuelSavedGallons: 15800 },
  { time: "09:00", trainsMoving: 112, trainsStopped: 11, trainsInYard: 46, trainsArriving: 10, trainsDeparting: 9, totalMilesNetwork: 51200, activeAlarms: 5, ptcCompliance: 99.1, tripOptimizerActive: 89, fuelSavedGallons: 18900 },
  { time: "10:00", trainsMoving: 110, trainsStopped: 12, trainsInYard: 48, trainsArriving: 9, trainsDeparting: 8, totalMilesNetwork: 58400, activeAlarms: 4, ptcCompliance: 99.2, tripOptimizerActive: 88, fuelSavedGallons: 21800 },
  { time: "11:00", trainsMoving: 114, trainsStopped: 10, trainsInYard: 44, trainsArriving: 11, trainsDeparting: 10, totalMilesNetwork: 66200, activeAlarms: 6, ptcCompliance: 99.0, tripOptimizerActive: 91, fuelSavedGallons: 25100 },
  { time: "12:00", trainsMoving: 116, trainsStopped: 9, trainsInYard: 42, trainsArriving: 12, trainsDeparting: 11, totalMilesNetwork: 74400, activeAlarms: 5, ptcCompliance: 99.1, tripOptimizerActive: 92, fuelSavedGallons: 28600 },
  { time: "13:00", trainsMoving: 118, trainsStopped: 8, trainsInYard: 40, trainsArriving: 13, trainsDeparting: 12, totalMilesNetwork: 82800, activeAlarms: 4, ptcCompliance: 99.3, tripOptimizerActive: 94, fuelSavedGallons: 32200 },
  { time: "14:00", trainsMoving: 120, trainsStopped: 10, trainsInYard: 38, trainsArriving: 14, trainsDeparting: 13, totalMilesNetwork: 91400, activeAlarms: 7, ptcCompliance: 99.0, tripOptimizerActive: 96, fuelSavedGallons: 36100 },
];

// ─── Lifecycle Events (unified event log) ────────────────────────────────────

export type LifecycleEventType =
  | "DEPARTURE"
  | "ARRIVAL"
  | "CONSIST_CHANGE"
  | "AIR_BRAKE_TEST"
  | "CREW_CHANGE"
  | "DETECTOR_PASSAGE"
  | "DETECTOR_ALARM"
  | "PTC_ENFORCEMENT"
  | "LOBS_EVENT"
  | "SIGNAL_HOLD"
  | "MEET_PASS"
  | "SLOW_ORDER"
  | "FUEL_STOP"
  | "MECHANICAL_INSPECTION"
  | "INTERCHANGE"
  | "DPU_EVENT"
  | "COMMUNICATION_LOSS"
  | "HOS_WARNING";

export interface LifecycleEvent {
  id: string;
  trainId: string;
  timestamp: string;
  type: LifecycleEventType;
  subdivision: string;
  milepost: number;
  description: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  resolved: boolean;
  linkedEventId?: string;
}

export const LIFECYCLE_EVENTS: LifecycleEvent[] = [
  { id: "LE-001", trainId: "CN-Q11451-05", timestamp: "2026-05-14 06:22:00", type: "DEPARTURE", subdivision: "Kingston", milepost: 0, description: "Train departed MacMillan Yard on Track T-14. Consist: 85 cars, 18,650 tons, 5,420 ft. ITABT PASS. PTC initialized.", severity: "INFO", resolved: true },
  { id: "LE-002", trainId: "CN-Q11451-05", timestamp: "2026-05-14 07:14:00", type: "DETECTOR_PASSAGE", subdivision: "Kingston", milepost: 44.2, description: "HBD passage at MP 44.2 — all axles CLEAR. Max reading: 28°F above ambient.", severity: "INFO", resolved: true },
  { id: "LE-003", trainId: "CN-Q11451-05", timestamp: "2026-05-14 08:55:00", type: "DETECTOR_PASSAGE", subdivision: "Kingston", milepost: 88.4, description: "WILD passage at MP 88.4 — all axles CLEAR. Max impact: 57 kips (NS 881204, Axle B2).", severity: "INFO", resolved: true },
  { id: "LE-004", trainId: "CN-Q11451-05", timestamp: "2026-05-14 10:22:00", type: "DETECTOR_PASSAGE", subdivision: "Kingston", milepost: 144.8, description: "HBD passage at MP 144.8 — all axles CLEAR.", severity: "INFO", resolved: true },
  { id: "LE-005", trainId: "CN-Q11451-05", timestamp: "2026-05-14 11:44:00", type: "DETECTOR_PASSAGE", subdivision: "Kingston", milepost: 180.2, description: "ABD passage at MP 180.2 — all axles CLEAR.", severity: "INFO", resolved: true },
  { id: "LE-006", trainId: "CN-L50251-05", timestamp: "2026-05-14 13:10:00", type: "DETECTOR_ALARM", subdivision: "Edson", milepost: 80.2, description: "WILD ALARM — Car NS 74412 Axle B2: 88 kips (ALERT). Car CN 558801 Axle A1: 79 kips (ALERT). Train continuing — below set-out threshold.", severity: "WARNING", resolved: false },
  { id: "LE-007", trainId: "CN-L50251-05", timestamp: "2026-05-14 14:05:00", type: "DETECTOR_PASSAGE", subdivision: "Edson", milepost: 112.8, description: "HBD passage at MP 112.8 — all axles CLEAR. Max reading: 31°F above ambient.", severity: "INFO", resolved: true },
  { id: "LE-008", trainId: "CN-M30151-05", timestamp: "2026-05-14 06:45:00", type: "CONSIST_CHANGE", subdivision: "Rivers", milepost: 0, description: "22-car pick-up at Symington Yard. 2 BNSF cars, 1 CP car added. RABT triggered.", severity: "INFO", resolved: true },
  { id: "LE-009", trainId: "CN-M30151-05", timestamp: "2026-05-14 07:28:00", type: "AIR_BRAKE_TEST", subdivision: "Rivers", milepost: 0, description: "RABT PASS — 22 brakes applied/released. Leakage: 1.8 psi/min (limit: 5.0). Departure authorized.", severity: "INFO", resolved: true },
  { id: "LE-010", trainId: "CN-M30151-05", timestamp: "2026-05-14 14:08:00", type: "DETECTOR_ALARM", subdivision: "Rivers", milepost: 44.1, description: "HBD ALERT — Car BNSF 584291 R-Bearing: 58°F above ambient at Brandon. Approaching alarm threshold (60°F). Monitoring required.", severity: "WARNING", resolved: false },
  { id: "LE-011", trainId: "CN-U55451-05", timestamp: "2026-05-14 13:30:00", type: "DETECTOR_ALARM", subdivision: "Kingston", milepost: 150.2, description: "WILD reading — Car CN 634812 Axle A1: 63 kips (elevated, below alert threshold). Logged for monitoring.", severity: "INFO", resolved: true },
  { id: "LE-012", trainId: "CN-A41451-05", timestamp: "2026-05-14 06:55:00", type: "AIR_BRAKE_TEST", subdivision: "Montréal", milepost: 0, description: "ITABT FAIL — leakage 6.4 psi/min (limit 5.0). 5 brakes not applied. Cars TTGX 8841 and CSXT 4412 flagged.", severity: "CRITICAL", resolved: true, linkedEventId: "LE-013" },
  { id: "LE-013", trainId: "CN-A41451-05", timestamp: "2026-05-14 07:55:00", type: "CONSIST_CHANGE", subdivision: "Montréal", milepost: 0, description: "Cars TTGX 8841 and CSXT 4412 removed from consist. Re-test (ITABT) initiated.", severity: "WARNING", resolved: true, linkedEventId: "LE-014" },
  { id: "LE-014", trainId: "CN-A41451-05", timestamp: "2026-05-14 08:10:00", type: "AIR_BRAKE_TEST", subdivision: "Montréal", milepost: 0, description: "ITABT IN PROGRESS — 94-car consist. Awaiting completion.", severity: "INFO", resolved: false },
  { id: "LE-015", trainId: "CN-T22151-05", timestamp: "2026-05-14 07:00:00", type: "DEPARTURE", subdivision: "Sprague", milepost: 0, description: "Train departed Symington Yard. Consist: 78 cars, 12,400 tons. ITABT PASS. PTC initialized.", severity: "INFO", resolved: true },
  { id: "LE-016", trainId: "CN-T22151-05", timestamp: "2026-05-14 14:30:00", type: "HOS_WARNING", subdivision: "Ruel", milepost: 201.4, description: "Crew CRW-7788 HOS: 30 minutes remaining. Train stopped for meet. Relief crew dispatched from Sprague.", severity: "CRITICAL", resolved: false },
  { id: "LE-017", trainId: "CN-F77251-05", timestamp: "2026-05-14 14:20:00", type: "ARRIVAL", subdivision: "Rivers", milepost: 2.1, description: "Train entering Symington Yard limits at MP 2.1. Speed 12 mph. Crew HOS: 22 min remaining.", severity: "WARNING", resolved: false },
  { id: "LE-018", trainId: "CN-U55451-05", timestamp: "2026-05-14 13:30:00", type: "DETECTOR_ALARM", subdivision: "Kingston", milepost: 144.8, description: "WILD ALARM — Car TTX 891204 Axle A2: 112 kips. Train stopped at MP 144.8 for mechanical inspection. 3 additional cars flagged.", severity: "CRITICAL", resolved: false },
  { id: "LE-019", trainId: "CN-H22351-05", timestamp: "2026-05-14 06:00:00", type: "DEPARTURE", subdivision: "Wainwright", milepost: 0, description: "Train departed Walker Yard. Consist: 88 cars, 17,600 tons. ITABT PASS. PTC initialized.", severity: "INFO", resolved: true },
  { id: "LE-020", trainId: "CN-H22351-05", timestamp: "2026-05-14 12:44:00", type: "DETECTOR_PASSAGE", subdivision: "Wainwright", milepost: 88.0, description: "WILD passage at MP 88.0 — Car UP 334521 Axle B1: 54 kips (slightly elevated, within limits). All HBD readings CLEAR.", severity: "INFO", resolved: true },
  { id: "LE-021", trainId: "CN-R33451-05", timestamp: "2026-05-14 07:30:00", type: "DEPARTURE", subdivision: "Moncton", milepost: 0, description: "Train departed Gordon Yard. Consist: 66 cars, 13,200 tons. ITABT PASS.", severity: "INFO", resolved: true },
  { id: "LE-022", trainId: "CN-V22451-05", timestamp: "2026-05-14 02:00:00", type: "DEPARTURE", subdivision: "Prince George", milepost: 0, description: "Train departed Prince George Yard. Consist: 48 cars, 9,600 tons. RABT FAIL — re-test pending.", severity: "WARNING", resolved: false, linkedEventId: "LE-023" },
  { id: "LE-023", trainId: "CN-V22451-05", timestamp: "2026-05-14 09:30:00", type: "MECHANICAL_INSPECTION", subdivision: "Prince George", milepost: 88.4, description: "Train stopped at MP 88.4 for brake inspection. Cars CN 441022 and UP 334521 flagged. HOS expired for Crew CRW-3388.", severity: "CRITICAL", resolved: false },
  { id: "LE-024", trainId: "CN-K88151-05", timestamp: "2026-05-14 10:52:00", type: "AIR_BRAKE_TEST", subdivision: "Kingston", milepost: 0, description: "ITABT PASS — 122 brakes applied/released. Leakage: 2.8 psi/min (limit: 5.0). Departure authorized.", severity: "INFO", resolved: true },
  { id: "LE-025", trainId: "CN-E66251-05", timestamp: "2026-05-14 04:00:00", type: "DEPARTURE", subdivision: "Edson", milepost: 0, description: "Train departed MacMillan Yard. Consist: 152 cars, 26,400 tons, 9,800 ft. DPU connected. ITABT PASS.", severity: "INFO", resolved: true },
  { id: "LE-026", trainId: "CN-E66251-05", timestamp: "2026-05-14 12:00:00", type: "DETECTOR_ALARM", subdivision: "Edson", milepost: 76.0, description: "HBD ALERT — Car CN 881204 L-Bearing: 52°F above ambient. Below alarm threshold (60°F). Monitoring active.", severity: "WARNING", resolved: false },
  { id: "LE-027", trainId: "CN-P11151-05", timestamp: "2026-05-14 14:00:00", type: "ARRIVAL", subdivision: "Edson", milepost: 0, description: "Train arrived Walker Yard. Crew CRW-3388 HOS expired on arrival. Relief crew en route.", severity: "WARNING", resolved: false },
  { id: "LE-028", trainId: "CN-D55151-05", timestamp: "2026-05-14 07:00:00", type: "DEPARTURE", subdivision: "Kingston", milepost: 0, description: "Train departed MacMillan Yard. Consist: 92 cars, 18,400 tons. ITABT PASS. PTC initialized.", severity: "INFO", resolved: true },
  { id: "LE-029", trainId: "CN-J88451-05", timestamp: "2026-05-14 14:30:00", type: "ARRIVAL", subdivision: "MacMillan", milepost: 1.2, description: "Train entering Capreol Yard limits. All detector passages CLEAR. Crew HOS 7h 30m remaining.", severity: "INFO", resolved: false },
  { id: "LE-030", trainId: "CN-W44251-05", timestamp: "2026-05-14 11:00:00", type: "DEPARTURE", subdivision: "MacMillan", milepost: 0, description: "Train departed MacMillan Yard. Consist: 76 cars, 15,200 tons. ITABT PASS. PTC initialized.", severity: "INFO", resolved: true },
];

// ─── Daily Network Summary ────────────────────────────────────────────────────

export const DAILY_SUMMARY = {
  date: "2026-05-14",
  totalTrains: 184,
  trainsCompleted: 52,
  trainsActive: 132,
  totalMilesCovered: 91400,
  totalCarsMoved: 18400,
  totalTonsMoved: 2280000,
  airBrakeTestsTotal: 48,
  airBrakeTestsPassed: 44,
  airBrakeTestsFailed: 4,
  consistChanges: 112,
  crewChanges: 28,
  detectorPassages: 588,
  detectorAlarms: 7,
  ptcEnforcements: 2,
  lobsEvents: 1,
  fuelSavedGallons: 36100,
  tripOptimizerUtilization: 80.4,
  avgMTTR: 22,
  foreignCarsHandled: 412,
  interchangeRailroads: ["CP Rail", "BNSF", "CSX", "NS", "UP", "CN (interchange)"],
};

// ─── Historical Fleet Snapshots (time-travel) ────────────────────────────────
// Each key is "HH:MM" matching NETWORK_TIMELINE. Trains are shown at their
// interpolated positions based on departure time and average speed.

export interface HistoricalTrainSnapshot {
  id: string;
  symbol: string;
  state: TrainState;
  subdivision: string;
  milepost: number;
  direction: "EAST" | "WEST" | "NORTH" | "SOUTH";
  speed: number;
  speedLimit: number;
  yardId?: string;
  yardTrack?: string;
  stopReason?: StopReason;
  stopDuration?: number;
  locos: string[];
  cars: number;
  weight: number;
  length: number;
  hasDPU: boolean;
  ptcState: "ACTIVE" | "SUPPRESSED" | "BYPASS" | "INITIALIZING" | "NOT_EQUIPPED";
  tripOptimizerActive: boolean;
  fuelSavedGallons: number;
  milesThisTrip: number;
  milesToday: number;
  crew: string;
  hosRemainingMin: number;
  lastDetectorMp: number;
  lastDetectorResult: "CLEAR" | "ALARM" | "WARNING";
  activeAlarms: number;
  lat: number;
  lon: number;
  origin: string;
  destination: string;
  foreignCars: number;
  interchangeRailroad?: string;
  departureTime?: string;
  estimatedArrival?: string;
}

// Snapshots at key hours. Trains that haven't departed yet are in PRE_DEPARTURE.
// Trains that have arrived are in POST_ARRIVAL. En-route trains show interpolated position.
export const HISTORICAL_FLEET_SNAPSHOTS: Record<string, HistoricalTrainSnapshot[]> = {
  "06:00": [
    // Q11451 just departed MacMillan
    { id: "CN-Q11451-05", symbol: "Q11451-05", state: "DEPARTING", subdivision: "Kingston", milepost: 4.2, direction: "EAST", speed: 30, speedLimit: 60, locos: ["CN 3864", "CN 3901"], cars: 85, weight: 18650, length: 5420, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 4, milesToday: 4, crew: "CRW-3301", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 43.82, lon: -79.38, origin: "MacMillan Yard", destination: "Taschereau Yard", foreignCars: 8, interchangeRailroad: "NS", departureTime: "2026-05-14 06:22:00" },
    // M30151 in yard pre-departure
    { id: "CN-M30151-05", symbol: "M30151-05", state: "IN_YARD_PRE_DEPARTURE", subdivision: "Rivers", milepost: 0, direction: "WEST", speed: 0, speedLimit: 10, yardId: "SYMINGTON", yardTrack: "T-08", locos: ["CN 5501", "CN 5488"], cars: 113, weight: 14290, length: 7100, hasDPU: true, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 0, milesToday: 0, crew: "CRW-2233", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 49.88, lon: -97.07, origin: "Symington Yard", destination: "Walker Yard", foreignCars: 14 },
    // L50251 just departed Walker
    { id: "CN-L50251-05", symbol: "L50251-05", state: "DEPARTING", subdivision: "Edson", milepost: 8.0, direction: "EAST", speed: 35, speedLimit: 50, locos: ["CN 4102", "CN 4088", "CN 4099"], cars: 148, weight: 24100, length: 9200, hasDPU: true, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 8, milesToday: 8, crew: "CRW-1122", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 53.52, lon: -113.28, origin: "Walker Yard", destination: "MacMillan Yard", foreignCars: 0, departureTime: "2026-05-14 08:00:00" },
    // H22351 just departed Walker
    { id: "CN-H22351-05", symbol: "H22351-05", state: "DEPARTING", subdivision: "Wainwright", milepost: 4.8, direction: "EAST", speed: 40, speedLimit: 60, locos: ["CN 8812", "CN 8801"], cars: 88, weight: 17600, length: 5800, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 4, milesToday: 4, crew: "CRW-5577", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 53.52, lon: -113.30, origin: "Walker Yard", destination: "Biggar, SK", foreignCars: 4, departureTime: "2026-05-14 06:00:00" },
    // E66251 just departed MacMillan (04:00 departure, 2h en route)
    { id: "CN-E66251-05", symbol: "E66251-05", state: "EN_ROUTE_MOVING", subdivision: "Edson", milepost: 22.0, direction: "WEST", speed: 44, speedLimit: 50, locos: ["CN 4412", "CN 4388", "CN 4401"], cars: 152, weight: 26400, length: 9800, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 22, milesToday: 22, crew: "CRW-6612", hosRemainingMin: 360, lastDetectorMp: 18.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 53.54, lon: -114.80, origin: "MacMillan Yard", destination: "Walker Yard", foreignCars: 0, departureTime: "2026-05-14 04:00:00" },
    // T22151 just departed Symington
    { id: "CN-T22151-05", symbol: "T22151-05", state: "DEPARTING", subdivision: "Ruel", milepost: 5.0, direction: "EAST", speed: 35, speedLimit: 40, locos: ["CN 3412", "CN 3398"], cars: 78, weight: 12400, length: 5100, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 5, milesToday: 5, crew: "CRW-7788", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 49.90, lon: -96.98, origin: "Gordon Yard", destination: "Symington Yard", foreignCars: 4, departureTime: "2026-05-14 07:00:00" },
    // D55151 just departed MacMillan
    { id: "CN-D55151-05", symbol: "D55151-05", state: "DEPARTING", subdivision: "Kingston", milepost: 6.0, direction: "EAST", speed: 40, speedLimit: 60, locos: ["CN 3412", "CN 3398"], cars: 92, weight: 18400, length: 5900, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 6, milesToday: 6, crew: "CRW-1144", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 43.80, lon: -79.36, origin: "MacMillan Yard", destination: "Taschereau Yard", foreignCars: 12, departureTime: "2026-05-14 07:00:00" },
    // R33451 just departed Gordon
    { id: "CN-R33451-05", symbol: "R33451-05", state: "DEPARTING", subdivision: "Moncton", milepost: 4.2, direction: "WEST", speed: 40, speedLimit: 60, locos: ["CN 2201", "CN 2188"], cars: 66, weight: 13200, length: 4400, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 4, milesToday: 4, crew: "CRW-4488", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 46.10, lon: -64.84, origin: "Gordon Yard", destination: "Taschereau Yard", foreignCars: 8, departureTime: "2026-05-14 07:30:00" },
    // F77251 en route (departed Walker ~10h ago)
    { id: "CN-F77251-05", symbol: "F77251-05", state: "EN_ROUTE_MOVING", subdivision: "Rivers", milepost: 280.0, direction: "EAST", speed: 48, speedLimit: 55, locos: ["CN 6612", "CN 6588"], cars: 96, weight: 15800, length: 6400, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 88, milesThisTrip: 280, milesToday: 280, crew: "CRW-6644", hosRemainingMin: 200, lastDetectorMp: 276.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 50.10, lon: -100.80, origin: "Walker Yard", destination: "Symington Yard", foreignCars: 12, departureTime: "2026-05-13 20:00:00" },
    // G87351 in yard pre-departure
    { id: "CN-G87351-05", symbol: "G87351-05", state: "IN_YARD_PRE_DEPARTURE", subdivision: "Bala", milepost: 0, direction: "NORTH", speed: 0, speedLimit: 10, yardId: "MACMILLAN", yardTrack: "T-03", locos: ["CN 7788"], cars: 42, weight: 5800, length: 2900, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 0, milesToday: 0, crew: "CRW-4455", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 43.78, lon: -79.47, origin: "MacMillan Yard", destination: "Capreol", foreignCars: 2, departureTime: "2026-05-14 10:00:00" },
    // V22451 en route (departed 02:00, 4h in)
    { id: "CN-V22451-05", symbol: "V22451-05", state: "EN_ROUTE_MOVING", subdivision: "Prince George", milepost: 44.0, direction: "SOUTH", speed: 42, speedLimit: 45, locos: ["CN 4812", "CN 4799"], cars: 48, weight: 9600, length: 3200, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 8, milesThisTrip: 44, milesToday: 44, crew: "CRW-3388", hosRemainingMin: 240, lastDetectorMp: 40.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 53.62, lon: -122.55, origin: "Prince George Yard", destination: "Walker Yard", foreignCars: 0, departureTime: "2026-05-14 02:00:00" },
  ],
  "08:00": [
    { id: "CN-Q11451-05", symbol: "Q11451-05", state: "EN_ROUTE_MOVING", subdivision: "Kingston", milepost: 88.4, direction: "EAST", speed: 55, speedLimit: 60, locos: ["CN 3864", "CN 3901"], cars: 85, weight: 18650, length: 5420, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 44, milesThisTrip: 88, milesToday: 88, crew: "CRW-3301", hosRemainingMin: 360, lastDetectorMp: 88.4, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.22, lon: -77.44, origin: "MacMillan Yard", destination: "Taschereau Yard", foreignCars: 8, departureTime: "2026-05-14 06:22:00" },
    { id: "CN-M30151-05", symbol: "M30151-05", state: "DEPARTING", subdivision: "Rivers", milepost: 8.0, direction: "WEST", speed: 38, speedLimit: 50, locos: ["CN 5501", "CN 5488"], cars: 113, weight: 14290, length: 7100, hasDPU: true, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 8, milesToday: 8, crew: "CRW-2233", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 49.88, lon: -97.18, origin: "Symington Yard", destination: "Walker Yard", foreignCars: 14, departureTime: "2026-05-14 09:15:00" },
    { id: "CN-L50251-05", symbol: "L50251-05", state: "EN_ROUTE_MOVING", subdivision: "Edson", milepost: 44.0, direction: "EAST", speed: 44, speedLimit: 50, locos: ["CN 4102", "CN 4088", "CN 4099"], cars: 148, weight: 24100, length: 9200, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 44, milesToday: 44, crew: "CRW-1122", hosRemainingMin: 420, lastDetectorMp: 40.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 53.38, lon: -114.88, origin: "Walker Yard", destination: "MacMillan Yard", foreignCars: 0, departureTime: "2026-05-14 08:00:00" },
    { id: "CN-H22351-05", symbol: "H22351-05", state: "EN_ROUTE_MOVING", subdivision: "Wainwright", milepost: 44.0, direction: "EAST", speed: 58, speedLimit: 60, locos: ["CN 8812", "CN 8801"], cars: 88, weight: 17600, length: 5800, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 44, milesThisTrip: 44, milesToday: 44, crew: "CRW-5577", hosRemainingMin: 360, lastDetectorMp: 40.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 53.40, lon: -112.22, origin: "Walker Yard", destination: "Biggar, SK", foreignCars: 4, departureTime: "2026-05-14 06:00:00" },
    { id: "CN-E66251-05", symbol: "E66251-05", state: "EN_ROUTE_MOVING", subdivision: "Edson", milepost: 44.0, direction: "WEST", speed: 44, speedLimit: 50, locos: ["CN 4412", "CN 4388", "CN 4401"], cars: 152, weight: 26400, length: 9800, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 44, milesToday: 44, crew: "CRW-6612", hosRemainingMin: 240, lastDetectorMp: 40.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 53.50, lon: -115.80, origin: "MacMillan Yard", destination: "Walker Yard", foreignCars: 0, departureTime: "2026-05-14 04:00:00" },
    { id: "CN-T22151-05", symbol: "T22151-05", state: "EN_ROUTE_MOVING", subdivision: "Ruel", milepost: 44.0, direction: "EAST", speed: 38, speedLimit: 40, locos: ["CN 3412", "CN 3398"], cars: 78, weight: 12400, length: 5100, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 44, milesThisTrip: 44, milesToday: 44, crew: "CRW-7788", hosRemainingMin: 360, lastDetectorMp: 40.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 47.10, lon: -81.44, origin: "Gordon Yard", destination: "Symington Yard", foreignCars: 4, departureTime: "2026-05-14 07:00:00" },
    { id: "CN-D55151-05", symbol: "D55151-05", state: "EN_ROUTE_MOVING", subdivision: "Kingston", milepost: 44.0, direction: "EAST", speed: 56, speedLimit: 60, locos: ["CN 3412", "CN 3398"], cars: 92, weight: 18400, length: 5900, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 44, milesThisTrip: 44, milesToday: 44, crew: "CRW-1144", hosRemainingMin: 420, lastDetectorMp: 40.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.00, lon: -78.22, origin: "MacMillan Yard", destination: "Taschereau Yard", foreignCars: 12, departureTime: "2026-05-14 07:00:00" },
    { id: "CN-A41451-05", symbol: "A41451-05", state: "IN_YARD_PRE_DEPARTURE", subdivision: "Montréal", milepost: 0, direction: "EAST", speed: 0, speedLimit: 10, yardId: "TASCHEREAU", yardTrack: "T-22", locos: ["CN 2201", "CN 2188"], cars: 94, weight: 11080, length: 6100, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 0, milesToday: 0, crew: "CRW-5566", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 1, lat: 45.53, lon: -73.62, origin: "Taschereau Yard", destination: "Gordon Yard", foreignCars: 0, departureTime: "2026-05-14 08:55:00" },
    { id: "CN-R33451-05", symbol: "R33451-05", state: "EN_ROUTE_MOVING", subdivision: "Moncton", milepost: 22.0, direction: "WEST", speed: 52, speedLimit: 60, locos: ["CN 2201", "CN 2188"], cars: 66, weight: 13200, length: 4400, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 18, milesThisTrip: 22, milesToday: 22, crew: "CRW-4488", hosRemainingMin: 420, lastDetectorMp: 18.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 46.00, lon: -65.12, origin: "Gordon Yard", destination: "Taschereau Yard", foreignCars: 8, departureTime: "2026-05-14 07:30:00" },
    { id: "CN-F77251-05", symbol: "F77251-05", state: "EN_ROUTE_MOVING", subdivision: "Rivers", milepost: 340.0, direction: "EAST", speed: 48, speedLimit: 55, locos: ["CN 6612", "CN 6588"], cars: 96, weight: 15800, length: 6400, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 122, milesThisTrip: 340, milesToday: 340, crew: "CRW-6644", hosRemainingMin: 120, lastDetectorMp: 336.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 50.02, lon: -99.22, origin: "Walker Yard", destination: "Symington Yard", foreignCars: 12, departureTime: "2026-05-13 20:00:00" },
    { id: "CN-G87351-05", symbol: "G87351-05", state: "IN_YARD_PRE_DEPARTURE", subdivision: "Bala", milepost: 0, direction: "NORTH", speed: 0, speedLimit: 10, yardId: "MACMILLAN", yardTrack: "T-03", locos: ["CN 7788"], cars: 42, weight: 5800, length: 2900, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 0, milesToday: 0, crew: "CRW-4455", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 43.78, lon: -79.47, origin: "MacMillan Yard", destination: "Capreol", foreignCars: 2, departureTime: "2026-05-14 10:00:00" },
    { id: "CN-V22451-05", symbol: "V22451-05", state: "EN_ROUTE_STOPPED", subdivision: "Prince George", milepost: 66.0, direction: "SOUTH", speed: 0, speedLimit: 45, stopReason: "MECHANICAL_INSPECTION", stopDuration: 12, locos: ["CN 4812", "CN 4799"], cars: 48, weight: 9600, length: 3200, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 12, milesThisTrip: 66, milesToday: 66, crew: "CRW-3388", hosRemainingMin: 120, lastDetectorMp: 62.0, lastDetectorResult: "WARNING", activeAlarms: 1, lat: 53.50, lon: -122.50, origin: "Prince George Yard", destination: "Walker Yard", foreignCars: 0, departureTime: "2026-05-14 02:00:00" },
  ],
  "10:00": [
    { id: "CN-Q11451-05", symbol: "Q11451-05", state: "EN_ROUTE_MOVING", subdivision: "Kingston", milepost: 144.8, direction: "EAST", speed: 54, speedLimit: 60, locos: ["CN 3864", "CN 3901"], cars: 85, weight: 18650, length: 5420, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 88, milesThisTrip: 144, milesToday: 144, crew: "CRW-3301", hosRemainingMin: 255, lastDetectorMp: 144.8, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.44, lon: -76.11, origin: "MacMillan Yard", destination: "Taschereau Yard", foreignCars: 8, departureTime: "2026-05-14 06:22:00" },
    { id: "CN-M30151-05", symbol: "M30151-05", state: "EN_ROUTE_MOVING", subdivision: "Rivers", milepost: 22.0, direction: "WEST", speed: 46, speedLimit: 50, locos: ["CN 5501", "CN 5488"], cars: 113, weight: 14290, length: 7100, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 28, milesThisTrip: 22, milesToday: 22, crew: "CRW-2233", hosRemainingMin: 450, lastDetectorMp: 18.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 49.90, lon: -97.44, origin: "Symington Yard", destination: "Walker Yard", foreignCars: 14, departureTime: "2026-05-14 09:15:00" },
    { id: "CN-L50251-05", symbol: "L50251-05", state: "EN_ROUTE_MOVING", subdivision: "Edson", milepost: 88.0, direction: "EAST", speed: 44, speedLimit: 50, locos: ["CN 4102", "CN 4088", "CN 4099"], cars: 148, weight: 24100, length: 9200, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 88, milesToday: 88, crew: "CRW-1122", hosRemainingMin: 360, lastDetectorMp: 84.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 53.30, lon: -116.22, origin: "Walker Yard", destination: "MacMillan Yard", foreignCars: 0, departureTime: "2026-05-14 08:00:00" },
    { id: "CN-H22351-05", symbol: "H22351-05", state: "EN_ROUTE_MOVING", subdivision: "Wainwright", milepost: 88.0, direction: "EAST", speed: 58, speedLimit: 60, locos: ["CN 8812", "CN 8801"], cars: 88, weight: 17600, length: 5800, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 88, milesThisTrip: 88, milesToday: 88, crew: "CRW-5577", hosRemainingMin: 270, lastDetectorMp: 84.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 52.98, lon: -111.80, origin: "Walker Yard", destination: "Biggar, SK", foreignCars: 4, departureTime: "2026-05-14 06:00:00" },
    { id: "CN-E66251-05", symbol: "E66251-05", state: "EN_ROUTE_MOVING", subdivision: "Edson", milepost: 66.0, direction: "WEST", speed: 44, speedLimit: 50, locos: ["CN 4412", "CN 4388", "CN 4401"], cars: 152, weight: 26400, length: 9800, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 66, milesToday: 66, crew: "CRW-6612", hosRemainingMin: 150, lastDetectorMp: 62.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 53.44, lon: -116.88, origin: "MacMillan Yard", destination: "Walker Yard", foreignCars: 0, departureTime: "2026-05-14 04:00:00" },
    { id: "CN-T22151-05", symbol: "T22151-05", state: "EN_ROUTE_MOVING", subdivision: "Ruel", milepost: 122.0, direction: "EAST", speed: 38, speedLimit: 40, locos: ["CN 3412", "CN 3398"], cars: 78, weight: 12400, length: 5100, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 122, milesThisTrip: 122, milesToday: 122, crew: "CRW-7788", hosRemainingMin: 180, lastDetectorMp: 118.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 47.30, lon: -82.44, origin: "Gordon Yard", destination: "Symington Yard", foreignCars: 4, departureTime: "2026-05-14 07:00:00" },
    { id: "CN-D55151-05", symbol: "D55151-05", state: "EN_ROUTE_MOVING", subdivision: "Kingston", milepost: 88.0, direction: "EAST", speed: 56, speedLimit: 60, locos: ["CN 3412", "CN 3398"], cars: 92, weight: 18400, length: 5900, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 88, milesThisTrip: 88, milesToday: 88, crew: "CRW-1144", hosRemainingMin: 360, lastDetectorMp: 84.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.22, lon: -77.44, origin: "MacMillan Yard", destination: "Taschereau Yard", foreignCars: 12, departureTime: "2026-05-14 07:00:00" },
    { id: "CN-A41451-05", symbol: "A41451-05", state: "EN_ROUTE_MOVING", subdivision: "Montréal", milepost: 8.0, direction: "EAST", speed: 44, speedLimit: 60, locos: ["CN 2201", "CN 2188"], cars: 94, weight: 11080, length: 6100, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 4, milesThisTrip: 8, milesToday: 8, crew: "CRW-5566", hosRemainingMin: 450, lastDetectorMp: 4.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.58, lon: -73.12, origin: "Taschereau Yard", destination: "Gordon Yard", foreignCars: 0, departureTime: "2026-05-14 08:55:00" },
    { id: "CN-R33451-05", symbol: "R33451-05", state: "EN_ROUTE_MOVING", subdivision: "Moncton", milepost: 44.0, direction: "WEST", speed: 55, speedLimit: 60, locos: ["CN 2201", "CN 2188"], cars: 66, weight: 13200, length: 4400, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 44, milesThisTrip: 44, milesToday: 44, crew: "CRW-4488", hosRemainingMin: 360, lastDetectorMp: 40.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.88, lon: -65.44, origin: "Gordon Yard", destination: "Taschereau Yard", foreignCars: 8, departureTime: "2026-05-14 07:30:00" },
    { id: "CN-G87351-05", symbol: "G87351-05", state: "DEPARTING", subdivision: "Bala", milepost: 8.0, direction: "NORTH", speed: 40, speedLimit: 60, locos: ["CN 7788"], cars: 42, weight: 5800, length: 2900, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 8, milesToday: 8, crew: "CRW-4455", hosRemainingMin: 480, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.08, lon: -79.38, origin: "MacMillan Yard", destination: "Capreol", foreignCars: 2, departureTime: "2026-05-14 10:00:00" },
    { id: "CN-F77251-05", symbol: "F77251-05", state: "EN_ROUTE_MOVING", subdivision: "Rivers", milepost: 382.0, direction: "EAST", speed: 44, speedLimit: 55, locos: ["CN 6612", "CN 6588"], cars: 96, weight: 15800, length: 6400, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 155, milesThisTrip: 382, milesToday: 382, crew: "CRW-6644", hosRemainingMin: 50, lastDetectorMp: 378.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 49.92, lon: -97.98, origin: "Walker Yard", destination: "Symington Yard", foreignCars: 12, departureTime: "2026-05-13 20:00:00" },
    { id: "CN-V22451-05", symbol: "V22451-05", state: "EN_ROUTE_STOPPED", subdivision: "Prince George", milepost: 88.4, direction: "SOUTH", speed: 0, speedLimit: 45, stopReason: "MECHANICAL_INSPECTION", stopDuration: 40, locos: ["CN 4812", "CN 4799"], cars: 48, weight: 9600, length: 3200, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 22, milesThisTrip: 88, milesToday: 88, crew: "CRW-3388", hosRemainingMin: 0, lastDetectorMp: 84.0, lastDetectorResult: "WARNING", activeAlarms: 1, lat: 53.44, lon: -122.44, origin: "Prince George Yard", destination: "Walker Yard", foreignCars: 0, departureTime: "2026-05-14 02:00:00" },
    { id: "CN-K88151-05", symbol: "K88151-05", state: "IN_YARD_PRE_DEPARTURE", subdivision: "Kingston", milepost: 0, direction: "WEST", speed: 0, speedLimit: 10, yardId: "MACMILLAN", yardTrack: "T-07", locos: ["CN 3864", "CN 3901", "CN 3888"], cars: 122, weight: 21400, length: 7800, hasDPU: true, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 0, milesToday: 0, crew: "CRW-9900", hosRemainingMin: 510, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 43.78, lon: -79.47, origin: "MacMillan Yard", destination: "Walker Yard", foreignCars: 22, departureTime: "2026-05-14 10:52:00" },
    { id: "CN-W44251-05", symbol: "W44251-05", state: "IN_YARD_PRE_DEPARTURE", subdivision: "MacMillan", milepost: 0, direction: "NORTH", speed: 0, speedLimit: 10, yardId: "MACMILLAN", yardTrack: "T-09", locos: ["CN 7712", "CN 7699"], cars: 76, weight: 15200, length: 4900, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 0, milesToday: 0, crew: "CRW-9900", hosRemainingMin: 510, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 43.78, lon: -79.47, origin: "MacMillan Yard", destination: "Capreol Yard", foreignCars: 0, departureTime: "2026-05-14 11:00:00" },
  ],
  "12:00": [
    { id: "CN-Q11451-05", symbol: "Q11451-05", state: "EN_ROUTE_MOVING", subdivision: "Kingston", milepost: 180.2, direction: "EAST", speed: 52, speedLimit: 60, locos: ["CN 3864", "CN 3901"], cars: 85, weight: 18650, length: 5420, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 122, milesThisTrip: 180, milesToday: 180, crew: "CRW-3301", hosRemainingMin: 225, lastDetectorMp: 180.2, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.10, lon: -76.92, origin: "MacMillan Yard", destination: "Taschereau Yard", foreignCars: 8, departureTime: "2026-05-14 06:22:00" },
    { id: "CN-M30151-05", symbol: "M30151-05", state: "EN_ROUTE_MOVING", subdivision: "Rivers", milepost: 44.1, direction: "WEST", speed: 48, speedLimit: 50, locos: ["CN 5501", "CN 5488"], cars: 113, weight: 14290, length: 7100, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 66, milesThisTrip: 44, milesToday: 44, crew: "CRW-2233", hosRemainingMin: 405, lastDetectorMp: 40.5, lastDetectorResult: "WARNING", activeAlarms: 1, lat: 49.92, lon: -97.88, origin: "Symington Yard", destination: "Walker Yard", foreignCars: 14, departureTime: "2026-05-14 09:15:00" },
    { id: "CN-L50251-05", symbol: "L50251-05", state: "EN_ROUTE_MOVING", subdivision: "Edson", milepost: 112.8, direction: "EAST", speed: 44, speedLimit: 50, locos: ["CN 4102", "CN 4088", "CN 4099"], cars: 148, weight: 24100, length: 9200, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 112, milesToday: 112, crew: "CRW-1122", hosRemainingMin: 330, lastDetectorMp: 108.4, lastDetectorResult: "ALARM", activeAlarms: 2, lat: 53.22, lon: -116.44, origin: "Walker Yard", destination: "MacMillan Yard", foreignCars: 0, departureTime: "2026-05-14 08:00:00" },
    { id: "CN-H22351-05", symbol: "H22351-05", state: "EN_ROUTE_MOVING", subdivision: "Wainwright", milepost: 122.4, direction: "EAST", speed: 58, speedLimit: 60, locos: ["CN 8812", "CN 8801"], cars: 88, weight: 17600, length: 5800, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 112, milesThisTrip: 122, milesToday: 122, crew: "CRW-5577", hosRemainingMin: 210, lastDetectorMp: 118.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 52.84, lon: -111.22, origin: "Walker Yard", destination: "Biggar, SK", foreignCars: 4, departureTime: "2026-05-14 06:00:00" },
    { id: "CN-E66251-05", symbol: "E66251-05", state: "EN_ROUTE_MOVING", subdivision: "Edson", milepost: 80.2, direction: "WEST", speed: 44, speedLimit: 50, locos: ["CN 4412", "CN 4388", "CN 4401"], cars: 152, weight: 26400, length: 9800, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 80, milesToday: 80, crew: "CRW-6612", hosRemainingMin: 90, lastDetectorMp: 76.0, lastDetectorResult: "WARNING", activeAlarms: 1, lat: 53.40, lon: -117.60, origin: "MacMillan Yard", destination: "Walker Yard", foreignCars: 0, departureTime: "2026-05-14 04:00:00" },
    { id: "CN-T22151-05", symbol: "T22151-05", state: "EN_ROUTE_MOVING", subdivision: "Ruel", milepost: 178.0, direction: "EAST", speed: 38, speedLimit: 40, locos: ["CN 3412", "CN 3398"], cars: 78, weight: 12400, length: 5100, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 178, milesThisTrip: 178, milesToday: 178, crew: "CRW-7788", hosRemainingMin: 90, lastDetectorMp: 174.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 47.40, lon: -82.04, origin: "Gordon Yard", destination: "Symington Yard", foreignCars: 4, departureTime: "2026-05-14 07:00:00" },
    { id: "CN-D55151-05", symbol: "D55151-05", state: "EN_ROUTE_MOVING", subdivision: "Kingston", milepost: 144.0, direction: "EAST", speed: 56, speedLimit: 60, locos: ["CN 3412", "CN 3398"], cars: 92, weight: 18400, length: 5900, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 133, milesThisTrip: 144, milesToday: 144, crew: "CRW-1144", hosRemainingMin: 300, lastDetectorMp: 140.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.44, lon: -76.22, origin: "MacMillan Yard", destination: "Taschereau Yard", foreignCars: 12, departureTime: "2026-05-14 07:00:00" },
    { id: "CN-A41451-05", symbol: "A41451-05", state: "EN_ROUTE_MOVING", subdivision: "Montréal", milepost: 22.4, direction: "EAST", speed: 60, speedLimit: 60, locos: ["CN 2201", "CN 2188"], cars: 94, weight: 11080, length: 6100, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 18, milesThisTrip: 22, milesToday: 22, crew: "CRW-5566", hosRemainingMin: 390, lastDetectorMp: 18.8, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.61, lon: -73.22, origin: "Taschereau Yard", destination: "Gordon Yard", foreignCars: 0, departureTime: "2026-05-14 08:55:00" },
    { id: "CN-R33451-05", symbol: "R33451-05", state: "EN_ROUTE_MOVING", subdivision: "Moncton", milepost: 44.2, direction: "WEST", speed: 55, speedLimit: 60, locos: ["CN 2201", "CN 2188"], cars: 66, weight: 13200, length: 4400, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 44, milesThisTrip: 44, milesToday: 44, crew: "CRW-4488", hosRemainingMin: 300, lastDetectorMp: 40.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.92, lon: -64.44, origin: "Gordon Yard", destination: "Taschereau Yard", foreignCars: 8, departureTime: "2026-05-14 07:30:00" },
    { id: "CN-G87351-05", symbol: "G87351-05", state: "EN_ROUTE_MOVING", subdivision: "Bala", milepost: 44.0, direction: "NORTH", speed: 55, speedLimit: 60, locos: ["CN 7788"], cars: 42, weight: 5800, length: 2900, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 18, milesThisTrip: 44, milesToday: 44, crew: "CRW-4455", hosRemainingMin: 450, lastDetectorMp: 40.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.22, lon: -79.44, origin: "MacMillan Yard", destination: "Capreol", foreignCars: 2, departureTime: "2026-05-14 10:00:00" },
    { id: "CN-F77251-05", symbol: "F77251-05", state: "ARRIVING", subdivision: "Rivers", milepost: 2.1, direction: "EAST", speed: 12, speedLimit: 15, yardId: "SYMINGTON", locos: ["CN 6612", "CN 6588"], cars: 96, weight: 15800, length: 6400, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 188, milesThisTrip: 398, milesToday: 398, crew: "CRW-6644", hosRemainingMin: 22, lastDetectorMp: 1.8, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 49.88, lon: -97.09, origin: "Walker Yard", destination: "Symington Yard", foreignCars: 12, departureTime: "2026-05-13 20:00:00" },
    { id: "CN-V22451-05", symbol: "V22451-05", state: "EN_ROUTE_STOPPED", subdivision: "Prince George", milepost: 88.4, direction: "SOUTH", speed: 0, speedLimit: 45, stopReason: "MECHANICAL_INSPECTION", stopDuration: 55, locos: ["CN 4812", "CN 4799"], cars: 48, weight: 9600, length: 3200, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 22, milesThisTrip: 88, milesToday: 88, crew: "CRW-3388", hosRemainingMin: 0, lastDetectorMp: 84.0, lastDetectorResult: "WARNING", activeAlarms: 1, lat: 53.44, lon: -122.44, origin: "Prince George Yard", destination: "Walker Yard", foreignCars: 0, departureTime: "2026-05-14 02:00:00" },
    { id: "CN-K88151-05", symbol: "K88151-05", state: "EN_ROUTE_MOVING", subdivision: "Kingston", milepost: 22.0, direction: "WEST", speed: 44, speedLimit: 60, locos: ["CN 3864", "CN 3901", "CN 3888"], cars: 122, weight: 21400, length: 7800, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 18, milesThisTrip: 22, milesToday: 22, crew: "CRW-9900", hosRemainingMin: 480, lastDetectorMp: 18.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 43.84, lon: -79.66, origin: "MacMillan Yard", destination: "Walker Yard", foreignCars: 22, departureTime: "2026-05-14 10:52:00" },
    { id: "CN-W44251-05", symbol: "W44251-05", state: "EN_ROUTE_MOVING", subdivision: "MacMillan", milepost: 22.0, direction: "NORTH", speed: 50, speedLimit: 55, locos: ["CN 7712", "CN 7699"], cars: 76, weight: 15200, length: 4900, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 18, milesThisTrip: 22, milesToday: 22, crew: "CRW-9900", hosRemainingMin: 480, lastDetectorMp: 18.0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.22, lon: -79.66, origin: "MacMillan Yard", destination: "Capreol Yard", foreignCars: 0, departureTime: "2026-05-14 11:00:00" },
  ],
};

// Helper: get the fleet snapshot closest to a given hour (0-23)
export function getFleetAtTime(hour: number): HistoricalTrainSnapshot[] {
  const keys = Object.keys(HISTORICAL_FLEET_SNAPSHOTS).sort();
  // Find the closest key
  const target = `${String(hour).padStart(2, "0")}:00`;
  // Return exact match or the most recent past snapshot
  const match = keys.filter(k => k <= target).pop() ?? keys[0];
  return HISTORICAL_FLEET_SNAPSHOTS[match] ?? [];
}

// The available historical time points (for the scrubber)
export const HISTORICAL_TIME_POINTS = ["06:00", "08:00", "10:00", "12:00", "14:00 (LIVE)"] as const;

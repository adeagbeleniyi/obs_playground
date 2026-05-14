// ─────────────────────────────────────────────────────────────────────────────
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
  capacity: number; // cars
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
  brakePipePressure: number; // psi
  leakageRate: number; // psi/min
  leakageLimit: number;
  brakesApplied: number;
  brakesTotal: number;
  defects: string[];
  notes: string;
  triggeredBy: "INITIAL_TERMINAL" | "CONSIST_CHANGE" | "ENROUTE_INSPECTION" | "REGULATORY";
}

export const AIR_BRAKE_TESTS: AirBrakeTest[] = [
  {
    id: "ABT-2026-001",
    trainId: "CN-Q11451-05",
    type: "ITABT",
    yard: "MACMILLAN",
    track: "T-14",
    startTime: "2026-05-05 05:30:00",
    endTime: "2026-05-05 06:12:00",
    result: "PASS",
    conductedBy: "Crew 4412",
    brakePipePressure: 90,
    leakageRate: 2.1,
    leakageLimit: 5.0,
    brakesApplied: 84,
    brakesTotal: 84,
    defects: [],
    notes: "All brakes applied and released. Continuity confirmed end-to-end.",
    triggeredBy: "INITIAL_TERMINAL",
  },
  {
    id: "ABT-2026-002",
    trainId: "CN-M30151-05",
    type: "RABT",
    yard: "SYMINGTON",
    track: "T-08",
    startTime: "2026-05-05 07:15:00",
    endTime: "2026-05-05 07:28:00",
    result: "PASS",
    conductedBy: "Crew 5501",
    brakePipePressure: 90,
    leakageRate: 1.8,
    leakageLimit: 5.0,
    brakesApplied: 22,
    brakesTotal: 22,
    defects: [],
    notes: "Running air brake test after 22-car pick-up at Symington.",
    triggeredBy: "CONSIST_CHANGE",
  },
  {
    id: "ABT-2026-003",
    trainId: "CN-A41451-05",
    type: "ITABT",
    yard: "TASCHEREAU",
    track: "T-22",
    startTime: "2026-05-05 06:00:00",
    endTime: "2026-05-05 06:55:00",
    result: "FAIL",
    conductedBy: "Crew 7788",
    brakePipePressure: 88,
    leakageRate: 6.4,
    leakageLimit: 5.0,
    brakesApplied: 91,
    brakesTotal: 96,
    defects: ["TTGX 8841 — brake cylinder not releasing", "CSXT 4412 — angle cock partially closed"],
    notes: "Test failed: leakage rate exceeded limit. 5 brakes not applied. Cars TTGX 8841 and CSXT 4412 flagged for mechanical inspection.",
    triggeredBy: "INITIAL_TERMINAL",
  },
  {
    id: "ABT-2026-004",
    trainId: "CN-A41451-05",
    type: "ITABT",
    yard: "TASCHEREAU",
    track: "T-22",
    startTime: "2026-05-05 08:10:00",
    endTime: null,
    result: "IN_PROGRESS",
    conductedBy: "Crew 7788",
    brakePipePressure: 90,
    leakageRate: 0,
    leakageLimit: 5.0,
    brakesApplied: 0,
    brakesTotal: 94,
    defects: [],
    notes: "Re-test after TTGX 8841 and CSXT 4412 removed from consist.",
    triggeredBy: "INITIAL_TERMINAL",
  },
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
  { id: "CE-001", trainId: "CN-M30151-05", timestamp: "2026-05-05 06:45:00", yard: "SYMINGTON", type: "CAR_ADDED", carOrLocoId: "BNSF 112847", carType: "Gondola", foreignRailroad: "BNSF", position: 45, newConsistLength: 112, newConsistWeight: 14200, triggeredAirBrakeTest: false },
  { id: "CE-002", trainId: "CN-M30151-05", timestamp: "2026-05-05 06:52:00", yard: "SYMINGTON", type: "CAR_ADDED", carOrLocoId: "CN 521044", carType: "Covered Hopper", position: 46, newConsistLength: 113, newConsistWeight: 14380, triggeredAirBrakeTest: false },
  { id: "CE-003", trainId: "CN-M30151-05", timestamp: "2026-05-05 07:10:00", yard: "SYMINGTON", type: "CAR_REMOVED", carOrLocoId: "TTGX 9012", carType: "Intermodal Flat", position: 12, newConsistLength: 112, newConsistWeight: 14100, triggeredAirBrakeTest: false },
  { id: "CE-004", trainId: "CN-M30151-05", timestamp: "2026-05-05 07:14:00", yard: "SYMINGTON", type: "CAR_ADDED", carOrLocoId: "CP 624411", carType: "Tank Car", foreignRailroad: "CP Rail", position: 12, newConsistLength: 113, newConsistWeight: 14290, triggeredAirBrakeTest: true, airBrakeTestId: "ABT-2026-002" },
  { id: "CE-005", trainId: "CN-A41451-05", timestamp: "2026-05-05 07:55:00", yard: "TASCHEREAU", type: "CAR_REMOVED", carOrLocoId: "TTGX 8841", carType: "Intermodal Flat", position: 22, newConsistLength: 95, newConsistWeight: 11200, triggeredAirBrakeTest: true, airBrakeTestId: "ABT-2026-004" },
  { id: "CE-006", trainId: "CN-A41451-05", timestamp: "2026-05-05 07:56:00", yard: "TASCHEREAU", type: "CAR_REMOVED", carOrLocoId: "CSXT 4412", carType: "Boxcar", foreignRailroad: "CSX", position: 31, newConsistLength: 94, newConsistWeight: 11080, triggeredAirBrakeTest: false },
  { id: "CE-007", trainId: "CN-Q11451-05", timestamp: "2026-05-05 04:10:00", yard: "MACMILLAN", type: "DPU_CONNECTED", carOrLocoId: "CN 2644 (DPU)", position: 84, newConsistLength: 84, newConsistWeight: 18400, triggeredAirBrakeTest: false },
  { id: "CE-008", trainId: "CN-Q11451-05", timestamp: "2026-05-05 04:22:00", yard: "MACMILLAN", type: "INTERCHANGE_IN", carOrLocoId: "NS 74412", carType: "Autorack", foreignRailroad: "Norfolk Southern", position: 1, newConsistLength: 85, newConsistWeight: 18650, triggeredAirBrakeTest: false },
];

// ─── Fleet State Snapshot ─────────────────────────────────────────────────────

export interface TrainSnapshot {
  id: string;
  symbol: string;
  state: TrainState;
  subdivision: string;
  milepost: number;
  direction: "EAST" | "WEST" | "NORTH" | "SOUTH";
  speed: number; // mph
  speedLimit: number;
  yardId?: string;
  yardTrack?: string;
  stopReason?: StopReason;
  stopDuration?: number; // minutes
  locos: string[];
  cars: number;
  weight: number; // tons
  length: number; // feet
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
  // EN ROUTE MOVING
  { id: "CN-Q11451-05", symbol: "Q11451-05", state: "EN_ROUTE_MOVING", subdivision: "Kingston", milepost: 188.4, direction: "WEST", speed: 52, speedLimit: 60, locos: ["CN 3864", "CN 3901"], cars: 85, weight: 18650, length: 5420, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 142, milesThisTrip: 188, milesToday: 188, crew: "Crew 4412", hosRemainingMin: 312, lastDetectorMp: 180.2, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 44.12, lon: -76.88, departureTime: "2026-05-05 06:22:00", estimatedArrival: "2026-05-05 14:30:00", origin: "MacMillan Yard", destination: "Taschereau Yard", foreignCars: 8, interchangeRailroad: "NS" },
  { id: "CN-M30151-05", symbol: "M30151-05", state: "EN_ROUTE_MOVING", subdivision: "Rivers", milepost: 44.1, direction: "WEST", speed: 48, speedLimit: 50, locos: ["CN 5501", "CN 5488"], cars: 113, weight: 14290, length: 7100, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 88, milesThisTrip: 44, milesToday: 44, crew: "Crew 5501", hosRemainingMin: 480, lastDetectorMp: 40.5, lastDetectorResult: "WARNING", activeAlarms: 1, lat: 49.92, lon: -97.88, departureTime: "2026-05-05 07:45:00", estimatedArrival: "2026-05-05 19:00:00", origin: "Symington Yard", destination: "Walker Yard", foreignCars: 14, interchangeRailroad: "CP/BNSF" },
  { id: "CN-L50251-05", symbol: "L50251-05", state: "EN_ROUTE_MOVING", subdivision: "Edson", milepost: 112.8, direction: "EAST", speed: 44, speedLimit: 50, locos: ["CN 4102", "CN 4088", "CN 4099"], cars: 148, weight: 24100, length: 9200, hasDPU: true, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 112, milesToday: 112, crew: "Crew 6612", hosRemainingMin: 198, lastDetectorMp: 108.4, lastDetectorResult: "ALARM", activeAlarms: 2, lat: 53.22, lon: -116.44, departureTime: "2026-05-05 04:00:00", estimatedArrival: "2026-05-05 18:00:00", origin: "Walker Yard", destination: "MacMillan Yard", foreignCars: 0, },
  { id: "CN-G87351-05", symbol: "G87351-05", state: "EN_ROUTE_MOVING", subdivision: "Bala", milepost: 88.2, direction: "NORTH", speed: 55, speedLimit: 60, locos: ["CN 7788"], cars: 42, weight: 5800, length: 2900, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 31, milesThisTrip: 88, milesToday: 88, crew: "Crew 9901", hosRemainingMin: 390, lastDetectorMp: 82.1, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.88, lon: -79.22, departureTime: "2026-05-05 05:10:00", estimatedArrival: "2026-05-05 12:00:00", origin: "MacMillan Yard", destination: "Capreol", foreignCars: 2, interchangeRailroad: "CP" },
  { id: "CN-A41451-05", symbol: "A41451-05", state: "EN_ROUTE_MOVING", subdivision: "Montréal", milepost: 22.4, direction: "EAST", speed: 60, speedLimit: 60, locos: ["CN 2201", "CN 2188"], cars: 94, weight: 11080, length: 6100, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: true, fuelSavedGallons: 18, milesThisTrip: 22, milesToday: 22, crew: "Crew 7788", hosRemainingMin: 510, lastDetectorMp: 18.8, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.61, lon: -73.22, departureTime: "2026-05-05 08:55:00", estimatedArrival: "2026-05-05 16:00:00", origin: "Taschereau Yard", destination: "Gordon Yard", foreignCars: 0 },
  // EN ROUTE STOPPED
  { id: "CN-T22151-05", symbol: "T22151-05", state: "EN_ROUTE_STOPPED", subdivision: "Ruel", milepost: 201.4, direction: "EAST", speed: 0, speedLimit: 40, stopReason: "MEET_PASS", stopDuration: 18, locos: ["CN 3412", "CN 3398"], cars: 78, weight: 12400, length: 5100, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 204, milesThisTrip: 201, milesToday: 201, crew: "Crew 3301", hosRemainingMin: 88, lastDetectorMp: 198.2, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 47.44, lon: -82.11, departureTime: "2026-05-04 22:00:00", estimatedArrival: "2026-05-05 10:30:00", origin: "Gordon Yard", destination: "Symington Yard", foreignCars: 4 },
  { id: "CN-U55451-05", symbol: "U55451-05", state: "EN_ROUTE_STOPPED", subdivision: "Kingston", milepost: 144.8, direction: "EAST", speed: 0, speedLimit: 60, stopReason: "DETECTOR_FLAG", stopDuration: 34, locos: ["CN 8812"], cars: 55, weight: 7200, length: 3800, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 55, milesThisTrip: 144, milesToday: 144, crew: "Crew 2211", hosRemainingMin: 244, lastDetectorMp: 144.8, lastDetectorResult: "ALARM", activeAlarms: 3, lat: 44.44, lon: -76.11, departureTime: "2026-05-05 03:00:00", estimatedArrival: "2026-05-05 11:00:00", origin: "Taschereau Yard", destination: "MacMillan Yard", foreignCars: 0 },
  // IN YARD PRE-DEPARTURE
  { id: "CN-B44251-05", symbol: "B44251-05", state: "IN_YARD_PRE_DEPARTURE", subdivision: "Montréal", milepost: 0, direction: "EAST", speed: 0, speedLimit: 10, yardId: "TASCHEREAU", yardTrack: "T-22", locos: ["CN 2201", "CN 2188"], cars: 94, weight: 11080, length: 6100, hasDPU: false, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 0, milesToday: 0, crew: "Crew 1144", hosRemainingMin: 600, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 45.53, lon: -73.62, origin: "Taschereau Yard", destination: "Gordon Yard", foreignCars: 0 },
  { id: "CN-K88151-05", symbol: "K88151-05", state: "IN_YARD_PRE_DEPARTURE", subdivision: "Kingston", milepost: 0, direction: "WEST", speed: 0, speedLimit: 10, yardId: "MACMILLAN", yardTrack: "T-07", locos: ["CN 3864", "CN 3901", "CN 3888"], cars: 122, weight: 21400, length: 7800, hasDPU: true, ptcState: "INITIALIZING", tripOptimizerActive: false, fuelSavedGallons: 0, milesThisTrip: 0, milesToday: 0, crew: "Crew 8812", hosRemainingMin: 600, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 43.78, lon: -79.47, origin: "MacMillan Yard", destination: "Walker Yard", foreignCars: 22 },
  // IN YARD POST ARRIVAL
  { id: "CN-P11151-05", symbol: "P11151-05", state: "IN_YARD_POST_ARRIVAL", subdivision: "Edson", milepost: 0, direction: "WEST", speed: 0, speedLimit: 10, yardId: "WALKER", yardTrack: "T-18", locos: ["CN 4412", "CN 4388"], cars: 88, weight: 13200, length: 5800, hasDPU: false, ptcState: "NOT_EQUIPPED", tripOptimizerActive: false, fuelSavedGallons: 318, milesThisTrip: 412, milesToday: 412, crew: "Crew 4488", hosRemainingMin: 0, lastDetectorMp: 0, lastDetectorResult: "CLEAR", activeAlarms: 1, lat: 53.54, lon: -113.38, origin: "MacMillan Yard", destination: "Walker Yard", foreignCars: 8 },
  // ARRIVING
  { id: "CN-F77251-05", symbol: "F77251-05", state: "ARRIVING", subdivision: "Rivers", milepost: 2.1, direction: "EAST", speed: 12, speedLimit: 15, yardId: "SYMINGTON", locos: ["CN 6612", "CN 6588"], cars: 96, weight: 15800, length: 6400, hasDPU: false, ptcState: "ACTIVE", tripOptimizerActive: false, fuelSavedGallons: 188, milesThisTrip: 398, milesToday: 398, crew: "Crew 6644", hosRemainingMin: 22, lastDetectorMp: 1.8, lastDetectorResult: "CLEAR", activeAlarms: 0, lat: 49.88, lon: -97.09, origin: "Walker Yard", destination: "Symington Yard", foreignCars: 12 },
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
  { id: "LE-001", trainId: "CN-Q11451-05", timestamp: "2026-05-05 06:22:00", type: "DEPARTURE", subdivision: "Kingston", milepost: 0, description: "Train departed MacMillan Yard on Track T-14. Consist: 85 cars, 18,650 tons, 5,420 ft. ITABT PASS. PTC initialized.", severity: "INFO", resolved: true },
  { id: "LE-002", trainId: "CN-Q11451-05", timestamp: "2026-05-05 07:14:00", type: "DETECTOR_PASSAGE", subdivision: "Kingston", milepost: 44.2, description: "HBD passage at MP 44.2 — all axles CLEAR. Max reading: 48°C (limit: 105°C).", severity: "INFO", resolved: true },
  { id: "LE-003", trainId: "CN-Q11451-05", timestamp: "2026-05-05 08:55:00", type: "DETECTOR_PASSAGE", subdivision: "Kingston", milepost: 88.4, description: "WILD passage at MP 88.4 — all axles CLEAR. Max impact: 142 kips (limit: 250 kips).", severity: "INFO", resolved: true },
  { id: "LE-004", trainId: "CN-Q11451-05", timestamp: "2026-05-05 10:22:00", type: "DETECTOR_PASSAGE", subdivision: "Kingston", milepost: 144.8, description: "HBD passage at MP 144.8 — all axles CLEAR.", severity: "INFO", resolved: true },
  { id: "LE-005", trainId: "CN-Q11451-05", timestamp: "2026-05-05 11:44:00", type: "DETECTOR_PASSAGE", subdivision: "Kingston", milepost: 180.2, description: "ABD passage at MP 180.2 — all axles CLEAR.", severity: "INFO", resolved: true },
  { id: "LE-006", trainId: "CN-L50251-05", timestamp: "2026-05-05 09:12:00", type: "DETECTOR_ALARM", subdivision: "Edson", milepost: 108.4, description: "HBD ALARM — Car CN 881044 Axle A2-Right: 112°C (limit: 105°C). Train stopped at MP 108.4 for inspection.", severity: "CRITICAL", resolved: false },
  { id: "LE-007", trainId: "CN-L50251-05", timestamp: "2026-05-05 09:44:00", type: "MECHANICAL_INSPECTION", subdivision: "Edson", milepost: 108.4, description: "Field inspection of Car CN 881044. Bearing confirmed hot. Car set out at Edson siding. Replacement car ordered.", severity: "WARNING", resolved: false },
  { id: "LE-008", trainId: "CN-M30151-05", timestamp: "2026-05-05 06:45:00", type: "CONSIST_CHANGE", subdivision: "Rivers", milepost: 0, description: "22-car pick-up at Symington Yard. 2 BNSF cars, 1 CP car added. RABT triggered.", severity: "INFO", resolved: true },
  { id: "LE-009", trainId: "CN-M30151-05", timestamp: "2026-05-05 07:28:00", type: "AIR_BRAKE_TEST", subdivision: "Rivers", milepost: 0, description: "RABT PASS — 22 brakes applied/released. Leakage: 1.8 psi/min (limit: 5.0). Departure authorized.", severity: "INFO", resolved: true },
  { id: "LE-010", trainId: "CN-T22151-05", timestamp: "2026-05-05 09:44:00", type: "MEET_PASS", subdivision: "Ruel", milepost: 201.4, description: "Train held at MP 201.4 siding for meet with CN-M30151-05 (opposing). Estimated hold: 22 minutes.", severity: "INFO", resolved: false },
  { id: "LE-011", trainId: "CN-U55451-05", timestamp: "2026-05-05 09:08:00", type: "DETECTOR_ALARM", subdivision: "Kingston", milepost: 144.8, description: "DED ALARM at MP 144.8 — dragging equipment detected. Train stopped. 3 cars flagged for inspection.", severity: "CRITICAL", resolved: false },
  { id: "LE-012", trainId: "CN-A41451-05", timestamp: "2026-05-05 06:55:00", type: "AIR_BRAKE_TEST", subdivision: "Montréal", milepost: 0, description: "ITABT FAIL — leakage 6.4 psi/min (limit 5.0). 5 brakes not applied. Cars TTGX 8841 and CSXT 4412 flagged.", severity: "CRITICAL", resolved: true, linkedEventId: "LE-013" },
  { id: "LE-013", trainId: "CN-A41451-05", timestamp: "2026-05-05 07:55:00", type: "CONSIST_CHANGE", subdivision: "Montréal", milepost: 0, description: "Cars TTGX 8841 and CSXT 4412 removed from consist. Re-test (ITABT) initiated.", severity: "WARNING", resolved: true, linkedEventId: "LE-014" },
  { id: "LE-014", trainId: "CN-A41451-05", timestamp: "2026-05-05 08:10:00", type: "AIR_BRAKE_TEST", subdivision: "Montréal", milepost: 0, description: "ITABT IN PROGRESS — 94-car consist. Awaiting completion.", severity: "INFO", resolved: false },
  { id: "LE-015", trainId: "CN-T22151-05", timestamp: "2026-05-04 22:00:00", type: "DEPARTURE", subdivision: "Moncton", milepost: 0, description: "Train departed Gordon Yard. Consist: 78 cars, 12,400 tons. ITABT PASS. PTC initialized.", severity: "INFO", resolved: true },
  { id: "LE-016", trainId: "CN-T22151-05", timestamp: "2026-05-05 06:12:00", type: "CREW_CHANGE", subdivision: "Ruel", milepost: 188.4, description: "Crew change at Capreol. Outgoing crew: Crew 2211 (HOS expired). Incoming crew: Crew 3301.", severity: "INFO", resolved: true },
  { id: "LE-017", trainId: "CN-F77251-05", timestamp: "2026-05-05 09:44:00", type: "ARRIVAL", subdivision: "Rivers", milepost: 2.1, description: "Train entering Symington Yard limits at MP 2.1. Speed 12 mph. Crew HOS: 22 min remaining.", severity: "WARNING", resolved: false },
  { id: "LE-018", trainId: "CN-T22151-05", timestamp: "2026-05-05 09:22:00", type: "HOS_WARNING", subdivision: "Ruel", milepost: 201.4, description: "Crew 3301 HOS: 88 minutes remaining. Train currently stopped for meet. Dispatcher notified.", severity: "WARNING", resolved: false },
];

// ─── Daily Network Summary ────────────────────────────────────────────────────

export const DAILY_SUMMARY = {
  date: "2026-05-05",
  totalTrains: 156,
  trainsCompleted: 44,
  trainsActive: 112,
  totalMilesCovered: 58400,
  totalCarsMoved: 14200,
  totalTonsMoved: 1840000,
  airBrakeTestsTotal: 38,
  airBrakeTestsPassed: 36,
  airBrakeTestsFailed: 2,
  consistChanges: 84,
  crewChanges: 22,
  detectorPassages: 412,
  detectorAlarms: 4,
  ptcEnforcements: 1,
  lobsEvents: 0,
  fuelSavedGallons: 21800,
  tripOptimizerUtilization: 77.1,
  avgMTTR: 18,
  foreignCarsHandled: 284,
  interchangeRailroads: ["CP Rail", "BNSF", "CSX", "NS", "UP"],
};

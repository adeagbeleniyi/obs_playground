// ─────────────────────────────────────────────────────────────────────────────
// CN Rail OT Observability — Dispatch, Track Authority & Switch List Data
// Covers: Switch Lists, Track Warrants, Slow Orders, Work Limits, Flagging,
//         Train Conflicts, and KES/BOS PTC Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

// ─── Switch Lists ─────────────────────────────────────────────────────────────

export type SwitchMoveType =
  | "PULL"         // pull cars from track to lead
  | "SHOVE"        // shove cars from lead to destination track
  | "CLASSIFY"     // sort cars to classification tracks
  | "SPOT"         // spot car at industry/loading position
  | "COUPLE"       // couple to car/cut
  | "UNCOUPLE"     // cut from car
  | "INSPECT"      // mechanical inspection hold
  | "SET_OUT"      // set out defective/foreign car
  | "PICK_UP";     // pick up car from industry

export type SwitchMoveStatus = "PENDING" | "IN_PROGRESS" | "COMPLETE" | "SKIPPED" | "HOLD";

export interface SwitchMove {
  seq: number;
  type: SwitchMoveType;
  cars: string[];
  fromTrack: string;
  toTrack: string;
  status: SwitchMoveStatus;
  startTime?: string;
  endTime?: string;
  notes?: string;
  carCount: number;
  holdReason?: string;
}

export interface SwitchList {
  id: string;
  yardId: string;
  yardName: string;
  switchEngine: string;
  crew: string;
  shift: "DAY" | "AFTERNOON" | "NIGHT";
  startTime: string;
  estimatedCompletion: string;
  status: "ACTIVE" | "COMPLETE" | "PENDING" | "DELAYED";
  movesTotal: number;
  movesComplete: number;
  carsClassified: number;
  carsTotal: number;
  buildingTrain?: string;
  moves: SwitchMove[];
  notes: string;
}

export const SWITCH_LISTS: SwitchList[] = [
  {
    id: "SL-TASC-001",
    yardId: "TASCHEREAU",
    yardName: "Taschereau Yard",
    switchEngine: "CN 7201",
    crew: "Switch Crew T-04",
    shift: "DAY",
    startTime: "2026-05-05 06:00:00",
    estimatedCompletion: "2026-05-05 10:30:00",
    status: "ACTIVE",
    movesTotal: 8,
    movesComplete: 4,
    carsClassified: 38,
    carsTotal: 94,
    buildingTrain: "CN-A41451-05",
    notes: "Building A41451 for Gordon. ABT failed — TTGX 8841 and CSXT 4412 set out. Re-test in progress on T-22.",
    moves: [
      { seq: 1, type: "PULL", cars: ["CN 521044", "CN 521045", "CN 521046", "CN 521047"], fromTrack: "T-08", toTrack: "LEAD-A", status: "COMPLETE", startTime: "06:05", endTime: "06:18", carCount: 4 },
      { seq: 2, type: "CLASSIFY", cars: ["CN 521044", "CN 521045"], fromTrack: "LEAD-A", toTrack: "T-22", status: "COMPLETE", startTime: "06:20", endTime: "06:35", carCount: 2, notes: "Covered hoppers — grain service" },
      { seq: 3, type: "SHOVE", cars: ["CN 521046", "CN 521047"], fromTrack: "LEAD-A", toTrack: "T-22", status: "COMPLETE", startTime: "06:36", endTime: "06:44", carCount: 2 },
      { seq: 4, type: "SET_OUT", cars: ["TTGX 8841", "CSXT 4412"], fromTrack: "T-22", toTrack: "T-31 (MECH)", status: "COMPLETE", startTime: "07:55", endTime: "08:08", carCount: 2, notes: "ABT defects — brake cylinder fault (TTGX 8841), angle cock partially closed (CSXT 4412). Flagged for mechanical." },
      { seq: 5, type: "PULL", cars: ["BNSF 441201", "BNSF 441202", "BNSF 441203"], fromTrack: "T-14", toTrack: "LEAD-A", status: "IN_PROGRESS", startTime: "08:30", carCount: 3, notes: "BNSF interchange cars — grain hoppers" },
      { seq: 6, type: "SHOVE", cars: ["BNSF 441201", "BNSF 441202", "BNSF 441203"], fromTrack: "LEAD-A", toTrack: "T-22", status: "PENDING", carCount: 3 },
      { seq: 7, type: "COUPLE", cars: ["CN 2201 (LEAD)", "CN 2188"], fromTrack: "LOCO TRACK", toTrack: "T-22 (HEAD)", status: "PENDING", carCount: 0, notes: "Attach road power after ABT complete" },
      { seq: 8, type: "INSPECT", cars: [], fromTrack: "T-22", toTrack: "T-22", status: "PENDING", carCount: 0, notes: "Final walk-around inspection before departure authorization" },
    ],
  },
  {
    id: "SL-TASC-002",
    yardId: "TASCHEREAU",
    yardName: "Taschereau Yard",
    switchEngine: "CN 7204",
    crew: "Switch Crew T-07",
    shift: "DAY",
    startTime: "2026-05-05 07:00:00",
    estimatedCompletion: "2026-05-05 14:00:00",
    status: "ACTIVE",
    movesTotal: 12,
    movesComplete: 3,
    carsClassified: 22,
    carsTotal: 88,
    notes: "Classification work on inbound cars from CN-P11151-05 arrival at Walker. Sorting for next eastbound.",
    moves: [
      { seq: 1, type: "PULL", cars: ["CN 881044", "CN 881045", "CN 881046"], fromTrack: "T-04", toTrack: "LEAD-B", status: "COMPLETE", startTime: "07:05", endTime: "07:22", carCount: 3 },
      { seq: 2, type: "CLASSIFY", cars: ["CN 881044"], fromTrack: "LEAD-B", toTrack: "T-18 (MECH)", status: "COMPLETE", startTime: "07:24", endTime: "07:31", carCount: 1, notes: "HBD alarm from Edson — hot bearing. Mechanical hold." },
      { seq: 3, type: "CLASSIFY", cars: ["CN 881045", "CN 881046"], fromTrack: "LEAD-B", toTrack: "T-09", status: "COMPLETE", startTime: "07:32", endTime: "07:44", carCount: 2 },
      { seq: 4, type: "PULL", cars: ["CP 624411", "NS 74412", "BNSF 112847"], fromTrack: "T-06", toTrack: "LEAD-B", status: "IN_PROGRESS", startTime: "08:00", carCount: 3, notes: "Foreign railroad cars — sorting for interchange" },
      { seq: 5, type: "SET_OUT", cars: ["CP 624411"], fromTrack: "LEAD-B", toTrack: "T-33 (CP INTERCHANGE)", status: "PENDING", carCount: 1 },
      { seq: 6, type: "SET_OUT", cars: ["NS 74412"], fromTrack: "LEAD-B", toTrack: "T-34 (NS INTERCHANGE)", status: "PENDING", carCount: 1 },
      { seq: 7, type: "SET_OUT", cars: ["BNSF 112847"], fromTrack: "LEAD-B", toTrack: "T-35 (BNSF INTERCHANGE)", status: "PENDING", carCount: 1 },
      { seq: 8, type: "PULL", cars: ["CN 441201–441215 (15 cars)"], fromTrack: "T-11", toTrack: "LEAD-B", status: "PENDING", carCount: 15 },
      { seq: 9, type: "CLASSIFY", cars: ["CN 441201–441215"], fromTrack: "LEAD-B", toTrack: "T-22", status: "PENDING", carCount: 15, notes: "Intermodal flats for A41451 consist" },
      { seq: 10, type: "PULL", cars: ["CN 552001–552020 (20 cars)"], fromTrack: "T-12", toTrack: "LEAD-B", status: "PENDING", carCount: 20 },
      { seq: 11, type: "CLASSIFY", cars: ["CN 552001–552020"], fromTrack: "LEAD-B", toTrack: "T-22", status: "PENDING", carCount: 20, notes: "Tank cars — hazmat check required" },
      { seq: 12, type: "INSPECT", cars: [], fromTrack: "T-22", toTrack: "T-22", status: "PENDING", carCount: 0, notes: "Hazmat placard verification before coupling" },
    ],
  },
  {
    id: "SL-MACM-001",
    yardId: "MACMILLAN",
    yardName: "MacMillan Yard",
    switchEngine: "CN 7312",
    crew: "Switch Crew M-02",
    shift: "DAY",
    startTime: "2026-05-05 04:00:00",
    estimatedCompletion: "2026-05-05 06:30:00",
    status: "COMPLETE",
    movesTotal: 6,
    movesComplete: 6,
    carsClassified: 85,
    carsTotal: 85,
    buildingTrain: "CN-Q11451-05",
    notes: "Q11451 built and departed 06:22. DPU connected at position 84. ITABT PASS.",
    moves: [
      { seq: 1, type: "PULL", cars: ["CN 3864", "CN 3901"], fromTrack: "LOCO TRACK", toTrack: "T-14 (HEAD)", status: "COMPLETE", startTime: "04:05", endTime: "04:12", carCount: 0, notes: "Road power attached" },
      { seq: 2, type: "PULL", cars: ["NS 74412 + 84 cars"], fromTrack: "T-07", toTrack: "T-14", status: "COMPLETE", startTime: "04:15", endTime: "04:55", carCount: 85 },
      { seq: 3, type: "COUPLE", cars: ["CN 2644 (DPU)"], fromTrack: "LOCO TRACK", toTrack: "T-14 (TAIL)", status: "COMPLETE", startTime: "04:10", endTime: "04:22", carCount: 0, notes: "DPU connected at position 84. Radio link confirmed." },
      { seq: 4, type: "PICK_UP", cars: ["NS 74412"], fromTrack: "T-34 (NS INTERCHANGE)", toTrack: "T-14 (POS 1)", status: "COMPLETE", startTime: "04:22", endTime: "04:35", carCount: 1, notes: "NS interchange — autorack" },
      { seq: 5, type: "INSPECT", cars: [], fromTrack: "T-14", toTrack: "T-14", status: "COMPLETE", startTime: "05:30", endTime: "06:12", carCount: 0, notes: "ITABT — PASS. 84/84 brakes applied. Leakage 2.1 psi/min." },
      { seq: 6, type: "COUPLE", cars: ["CN 3864 (LEAD)"], fromTrack: "T-14", toTrack: "T-14 (DEPARTURE)", status: "COMPLETE", startTime: "06:15", endTime: "06:22", carCount: 0, notes: "Departure authorized by RTC. PTC initialized. Trip Optimizer loaded." },
    ],
  },
  {
    id: "SL-SYMT-001",
    yardId: "SYMINGTON",
    yardName: "Symington Yard",
    switchEngine: "CN 7488",
    crew: "Switch Crew S-05",
    shift: "DAY",
    startTime: "2026-05-05 05:30:00",
    estimatedCompletion: "2026-05-05 09:00:00",
    status: "ACTIVE",
    movesTotal: 10,
    movesComplete: 5,
    carsClassified: 56,
    carsTotal: 113,
    buildingTrain: "CN-M30151-05",
    notes: "M30151 departed 07:45 after RABT PASS. 22-car pick-up triggered running test.",
    moves: [
      { seq: 1, type: "CLASSIFY", cars: ["22 cars (T-08 block)"], fromTrack: "T-08", toTrack: "LEAD-A", status: "COMPLETE", startTime: "05:35", endTime: "06:10", carCount: 22 },
      { seq: 2, type: "SHOVE", cars: ["BNSF 112847", "CN 521044"], fromTrack: "LEAD-A", toTrack: "T-08 (TAIL)", status: "COMPLETE", startTime: "06:45", endTime: "06:55", carCount: 2, notes: "BNSF/CN interchange cars added" },
      { seq: 3, type: "SET_OUT", cars: ["TTGX 9012"], fromTrack: "T-08", toTrack: "T-22 (MECH)", status: "COMPLETE", startTime: "07:10", endTime: "07:14", carCount: 1, notes: "Intermodal flat — wheel defect flagged by WILD" },
      { seq: 4, type: "PICK_UP", cars: ["CP 624411"], fromTrack: "T-33 (CP INTERCHANGE)", toTrack: "T-08", status: "COMPLETE", startTime: "07:12", endTime: "07:14", carCount: 1, notes: "CP tank car — RABT triggered" },
      { seq: 5, type: "INSPECT", cars: [], fromTrack: "T-08", toTrack: "T-08", status: "COMPLETE", startTime: "07:15", endTime: "07:28", carCount: 0, notes: "RABT — PASS. 22/22 brakes. Leakage 1.8 psi/min." },
      { seq: 6, type: "PULL", cars: ["CN 552101–552120 (20 cars)"], fromTrack: "T-11", toTrack: "LEAD-A", status: "IN_PROGRESS", startTime: "08:00", carCount: 20 },
      { seq: 7, type: "CLASSIFY", cars: ["CN 552101–552120"], fromTrack: "LEAD-A", toTrack: "T-09", status: "PENDING", carCount: 20 },
      { seq: 8, type: "PULL", cars: ["Inbound F77251 cars (96 cars)"], fromTrack: "ARRIVAL TRACK", toTrack: "CLASSIFICATION LEADS", status: "PENDING", carCount: 96, notes: "F77251 arriving — classification to begin after arrival" },
      { seq: 9, type: "CLASSIFY", cars: ["F77251 block (96 cars)"], fromTrack: "CLASSIFICATION LEADS", toTrack: "T-04 through T-12", status: "PENDING", carCount: 96 },
      { seq: 10, type: "UNCOUPLE", cars: ["CN 6612", "CN 6588"], fromTrack: "ARRIVAL TRACK", toTrack: "LOCO TRACK", status: "PENDING", carCount: 0, notes: "Road power released to shop for inspection" },
    ],
  },
];

// ─── Track Events (Slow Orders, Work Limits, Flagging) ────────────────────────

export type TrackEventType =
  | "SLOW_ORDER"          // speed restriction from track geometry/maintenance
  | "WORK_LIMIT"          // track out of service for maintenance
  | "FLAGGING_LIMIT"      // flagman protecting a work limit
  | "TRACK_WARRANT"       // Form B / Track Warrant issued to maintenance crew
  | "FORM_B"              // Form B protecting a work limit
  | "BULLETIN_ORDER"      // general order affecting operations
  | "EMERGENCY_RESTRICTION" // unplanned speed restriction
  | "BRIDGE_RESTRICTION"; // weight/speed restriction on bridge

export type TrackEventStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";

export interface TrackEvent {
  id: string;
  type: TrackEventType;
  subdivision: string;
  fromMp: number;
  toMp: number;
  direction: "BOTH" | "EAST" | "WEST" | "NORTH" | "SOUTH";
  speedLimit?: number;    // mph (for slow orders)
  normalSpeed?: number;   // mph (what it normally is)
  status: TrackEventStatus;
  issuedBy: string;       // RTC name/ID
  issuedAt: string;
  expiresAt?: string;
  protectedBy?: string;   // flagman name or Form B number
  workType?: string;
  contractor?: string;
  description: string;
  affectedTrains: string[];  // train symbols currently in or approaching the limit
  severity: "INFO" | "WARNING" | "CRITICAL";
  formBNumber?: string;
  flagmanRadioChannel?: string;
  flagmanPosition?: number; // milepost
}

export const TRACK_EVENTS: TrackEvent[] = [
  {
    id: "TE-001",
    type: "SLOW_ORDER",
    subdivision: "Kingston",
    fromMp: 142.0,
    toMp: 146.5,
    direction: "BOTH",
    speedLimit: 25,
    normalSpeed: 60,
    status: "ACTIVE",
    issuedBy: "RTC Montréal — Dispatcher J. Tremblay",
    issuedAt: "2026-05-04 22:00:00",
    expiresAt: "2026-05-06 06:00:00",
    description: "Track geometry defect — surface irregularity at MP 143.8. Engineering inspection ordered. Speed restricted to 25 mph both directions.",
    affectedTrains: ["CN-U55451-05", "CN-Q11451-05"],
    severity: "WARNING",
  },
  {
    id: "TE-002",
    type: "WORK_LIMIT",
    subdivision: "Kingston",
    fromMp: 144.0,
    toMp: 145.2,
    direction: "BOTH",
    status: "ACTIVE",
    issuedBy: "RTC Montréal — Dispatcher J. Tremblay",
    issuedAt: "2026-05-05 07:00:00",
    expiresAt: "2026-05-05 16:00:00",
    protectedBy: "Form B #FB-2026-0512",
    workType: "Track Surfacing",
    contractor: "CN Engineering — Tamping Gang 4",
    description: "Track surfacing and tamping operation. Track out of service MP 144.0–145.2. Tamping machine on track.",
    affectedTrains: ["CN-U55451-05"],
    severity: "CRITICAL",
    formBNumber: "FB-2026-0512",
  },
  {
    id: "TE-003",
    type: "FLAGGING_LIMIT",
    subdivision: "Kingston",
    fromMp: 143.8,
    toMp: 145.2,
    direction: "BOTH",
    status: "ACTIVE",
    issuedBy: "RTC Montréal — Dispatcher J. Tremblay",
    issuedAt: "2026-05-05 07:00:00",
    expiresAt: "2026-05-05 16:00:00",
    protectedBy: "Flagman R. Bouchard",
    description: "Flagman protecting tamping gang work limit. Flagman positioned at MP 143.8 (east approach). All trains must stop and receive verbal permission before entering limit.",
    affectedTrains: ["CN-U55451-05"],
    severity: "CRITICAL",
    flagmanRadioChannel: "Ch. 14 (Kingston Sub)",
    flagmanPosition: 143.8,
  },
  {
    id: "TE-004",
    type: "FORM_B",
    subdivision: "Kingston",
    fromMp: 144.0,
    toMp: 145.2,
    direction: "BOTH",
    status: "ACTIVE",
    issuedBy: "RTC Montréal — Dispatcher J. Tremblay",
    issuedAt: "2026-05-05 07:00:00",
    expiresAt: "2026-05-05 16:00:00",
    protectedBy: "Tamping Gang Foreman M. Gagnon",
    description: "Form B issued to CN Engineering Tamping Gang 4 protecting MP 144.0–145.2 Kingston Sub. No train movement permitted within limits without foreman's release.",
    affectedTrains: [],
    severity: "WARNING",
    formBNumber: "FB-2026-0512",
  },
  {
    id: "TE-005",
    type: "SLOW_ORDER",
    subdivision: "Edson",
    fromMp: 108.0,
    toMp: 109.5,
    direction: "BOTH",
    speedLimit: 10,
    normalSpeed: 50,
    status: "ACTIVE",
    issuedBy: "RTC Edmonton — Dispatcher K. Singh",
    issuedAt: "2026-05-05 09:12:00",
    description: "Emergency slow order — HBD alarm on CN-L50251-05 at MP 108.4. Train stopped for inspection. Opposing movements restricted to 10 mph through area.",
    affectedTrains: ["CN-L50251-05"],
    severity: "CRITICAL",
  },
  {
    id: "TE-006",
    type: "TRACK_WARRANT",
    subdivision: "Edson",
    fromMp: 108.0,
    toMp: 110.0,
    direction: "BOTH",
    status: "ACTIVE",
    issuedBy: "RTC Edmonton — Dispatcher K. Singh",
    issuedAt: "2026-05-05 09:15:00",
    expiresAt: "2026-05-05 12:00:00",
    protectedBy: "CN Mechanical — Road Foreman B. Kowalski",
    workType: "Mechanical Inspection",
    description: "Track warrant issued to CN Mechanical road foreman to protect stopped train CN-L50251-05 at MP 108.4 during hot bearing inspection and car set-out.",
    affectedTrains: ["CN-L50251-05"],
    severity: "WARNING",
  },
  {
    id: "TE-007",
    type: "SLOW_ORDER",
    subdivision: "Ruel",
    fromMp: 198.0,
    toMp: 204.0,
    direction: "BOTH",
    speedLimit: 40,
    normalSpeed: 50,
    status: "ACTIVE",
    issuedBy: "RTC Capreol — Dispatcher P. Lavoie",
    issuedAt: "2026-05-04 18:00:00",
    expiresAt: "2026-05-07 18:00:00",
    description: "Bridge inspection slow order — Groundhog River bridge MP 201.4. Weight restriction and speed reduction pending structural assessment.",
    affectedTrains: ["CN-T22151-05"],
    severity: "WARNING",
  },
  {
    id: "TE-008",
    type: "BULLETIN_ORDER",
    subdivision: "Rivers",
    fromMp: 0,
    toMp: 999,
    direction: "BOTH",
    speedLimit: 50,
    normalSpeed: 60,
    status: "ACTIVE",
    issuedBy: "CN Train Operations — General Manager",
    issuedAt: "2026-05-05 00:00:00",
    expiresAt: "2026-05-05 23:59:00",
    description: "General bulletin — Rivers Subdivision max authorized speed reduced to 50 mph all movements due to spring thaw track conditions. Effective 00:01 May 5.",
    affectedTrains: ["CN-M30151-05", "CN-F77251-05"],
    severity: "INFO",
  },
  {
    id: "TE-009",
    type: "WORK_LIMIT",
    subdivision: "Montréal",
    fromMp: 8.2,
    toMp: 9.8,
    direction: "BOTH",
    status: "ACTIVE",
    issuedBy: "RTC Montréal — Dispatcher A. Côté",
    issuedAt: "2026-05-05 08:00:00",
    expiresAt: "2026-05-05 12:00:00",
    protectedBy: "Form B #FB-2026-0514",
    workType: "Switch Maintenance",
    contractor: "CN Track — Switch Gang 2",
    description: "Switch machine replacement at MP 9.1 crossover. Track out of service. Affects westbound main track.",
    affectedTrains: ["CN-A41451-05"],
    severity: "WARNING",
    formBNumber: "FB-2026-0514",
  },
  {
    id: "TE-010",
    type: "BRIDGE_RESTRICTION",
    subdivision: "Bala",
    fromMp: 84.4,
    toMp: 84.6,
    direction: "BOTH",
    speedLimit: 15,
    normalSpeed: 60,
    status: "ACTIVE",
    issuedBy: "RTC Toronto — Dispatcher M. Patel",
    issuedAt: "2026-05-01 00:00:00",
    expiresAt: "2026-05-31 23:59:00",
    description: "Muskoka River bridge — temporary weight restriction pending deck rehabilitation. Max speed 15 mph, max axle load 286,000 lbs.",
    affectedTrains: ["CN-G87351-05"],
    severity: "WARNING",
  },
];

// ─── Dispatched Trains (RTC View) ─────────────────────────────────────────────

export type DispatchStatus =
  | "AUTHORIZED"    // departure authorized, not yet departed
  | "EN_ROUTE"      // on the road
  | "HOLDING"       // holding for meet/pass/order
  | "DELAYED"       // behind schedule
  | "ANNULLED"      // train cancelled
  | "COMPLETED";    // arrived at destination

export interface DispatchedTrain {
  trainId: string;
  symbol: string;
  dispatchStatus: DispatchStatus;
  rtcName: string;
  rtcCenter: string;
  subdivision: string;
  origin: string;
  destination: string;
  scheduledDeparture: string;
  actualDeparture?: string;
  scheduledArrival: string;
  estimatedArrival?: string;
  currentMp: number;
  nextMeetMp?: number;
  nextMeetTrain?: string;
  holdingAt?: string;
  holdReason?: string;
  trackWarrants: string[];
  activeRestrictions: string[];
  priority: "PRIORITY" | "INTERMODAL" | "MANIFEST" | "GRAIN" | "AUTOMOTIVE" | "UNIT";
  delayMinutes: number;
  delayReason?: string;
}

export const DISPATCHED_TRAINS: DispatchedTrain[] = [
  {
    trainId: "CN-Q11451-05",
    symbol: "Q11451-05",
    dispatchStatus: "EN_ROUTE",
    rtcName: "J. Tremblay",
    rtcCenter: "RTC Montréal",
    subdivision: "Kingston",
    origin: "MacMillan Yard",
    destination: "Taschereau Yard",
    scheduledDeparture: "2026-05-05 06:00:00",
    actualDeparture: "2026-05-05 06:22:00",
    scheduledArrival: "2026-05-05 14:00:00",
    estimatedArrival: "2026-05-05 14:52:00",
    currentMp: 188.4,
    nextMeetMp: 210.0,
    nextMeetTrain: "CN-A41451-05",
    trackWarrants: [],
    activeRestrictions: ["TE-001"],
    priority: "INTERMODAL",
    delayMinutes: 22,
    delayReason: "Departure delayed — ABT re-test at MacMillan",
  },
  {
    trainId: "CN-M30151-05",
    symbol: "M30151-05",
    dispatchStatus: "EN_ROUTE",
    rtcName: "K. Singh",
    rtcCenter: "RTC Edmonton",
    subdivision: "Rivers",
    origin: "Symington Yard",
    destination: "Walker Yard",
    scheduledDeparture: "2026-05-05 07:30:00",
    actualDeparture: "2026-05-05 07:45:00",
    scheduledArrival: "2026-05-05 19:00:00",
    estimatedArrival: "2026-05-05 19:15:00",
    currentMp: 44.1,
    trackWarrants: [],
    activeRestrictions: ["TE-008"],
    priority: "MANIFEST",
    delayMinutes: 15,
    delayReason: "Consist change and RABT at Symington",
  },
  {
    trainId: "CN-L50251-05",
    symbol: "L50251-05",
    dispatchStatus: "HOLDING",
    rtcName: "K. Singh",
    rtcCenter: "RTC Edmonton",
    subdivision: "Edson",
    origin: "Walker Yard",
    destination: "MacMillan Yard",
    scheduledDeparture: "2026-05-05 04:00:00",
    actualDeparture: "2026-05-05 04:00:00",
    scheduledArrival: "2026-05-05 16:00:00",
    estimatedArrival: "2026-05-05 19:30:00",
    currentMp: 108.4,
    holdingAt: "MP 108.4 — Edson Siding",
    holdReason: "HBD alarm — hot bearing on CN 881044. Mechanical inspection in progress. Car set-out required.",
    trackWarrants: ["TE-006"],
    activeRestrictions: ["TE-005", "TE-006"],
    priority: "UNIT",
    delayMinutes: 210,
    delayReason: "HBD alarm — mechanical hold for car inspection and set-out",
  },
  {
    trainId: "CN-T22151-05",
    symbol: "T22151-05",
    dispatchStatus: "HOLDING",
    rtcName: "P. Lavoie",
    rtcCenter: "RTC Capreol",
    subdivision: "Ruel",
    origin: "Gordon Yard",
    destination: "Symington Yard",
    scheduledDeparture: "2026-05-04 22:00:00",
    actualDeparture: "2026-05-04 22:00:00",
    scheduledArrival: "2026-05-05 10:00:00",
    estimatedArrival: "2026-05-05 10:50:00",
    currentMp: 201.4,
    holdingAt: "MP 201.4 — Ruel Siding",
    holdReason: "Meet with opposing CN-M30151-05. Estimated hold 22 min. Crew HOS: 88 min remaining — dispatcher monitoring.",
    trackWarrants: [],
    activeRestrictions: ["TE-007"],
    priority: "MANIFEST",
    delayMinutes: 50,
    delayReason: "Meet/pass delay + bridge slow order MP 201.4",
  },
  {
    trainId: "CN-A41451-05",
    symbol: "A41451-05",
    dispatchStatus: "DELAYED",
    rtcName: "A. Côté",
    rtcCenter: "RTC Montréal",
    subdivision: "Montréal",
    origin: "Taschereau Yard",
    destination: "Gordon Yard",
    scheduledDeparture: "2026-05-05 07:00:00",
    actualDeparture: "2026-05-05 08:55:00",
    scheduledArrival: "2026-05-05 15:00:00",
    estimatedArrival: "2026-05-05 17:00:00",
    currentMp: 22.4,
    trackWarrants: [],
    activeRestrictions: ["TE-009"],
    priority: "MANIFEST",
    delayMinutes: 115,
    delayReason: "ABT FAIL — TTGX 8841 and CSXT 4412 set out. Re-test required. Switch maintenance slow order MP 8.2–9.8.",
  },
  {
    trainId: "CN-G87351-05",
    symbol: "G87351-05",
    dispatchStatus: "EN_ROUTE",
    rtcName: "M. Patel",
    rtcCenter: "RTC Toronto",
    subdivision: "Bala",
    origin: "MacMillan Yard",
    destination: "Capreol",
    scheduledDeparture: "2026-05-05 05:00:00",
    actualDeparture: "2026-05-05 05:10:00",
    scheduledArrival: "2026-05-05 12:00:00",
    estimatedArrival: "2026-05-05 12:10:00",
    currentMp: 88.2,
    nextMeetMp: 102.0,
    nextMeetTrain: "CN-K88151-05",
    trackWarrants: [],
    activeRestrictions: ["TE-010"],
    priority: "MANIFEST",
    delayMinutes: 10,
    delayReason: "Departure delay — crew late",
  },
  {
    trainId: "CN-B44251-05",
    symbol: "B44251-05",
    dispatchStatus: "AUTHORIZED",
    rtcName: "A. Côté",
    rtcCenter: "RTC Montréal",
    subdivision: "Montréal",
    origin: "Taschereau Yard",
    destination: "Gordon Yard",
    scheduledDeparture: "2026-05-05 09:30:00",
    scheduledArrival: "2026-05-05 17:30:00",
    currentMp: 0,
    trackWarrants: [],
    activeRestrictions: ["TE-009"],
    priority: "GRAIN",
    delayMinutes: 0,
  },
];

// ─── KES / BOS PTC Lifecycle ──────────────────────────────────────────────────

export type PTCLifecycleStepStatus = "COMPLETE" | "IN_PROGRESS" | "PENDING" | "FAILED" | "SKIPPED";

export interface PTCLifecycleStep {
  seq: number;
  system: "I-ETMS" | "BOS" | "KES" | "PDS" | "ITCM" | "GCP" | "CARMA";
  stepName: string;
  description: string;
  status: PTCLifecycleStepStatus;
  timestamp?: string;
  latencyMs?: number;
  latencyBaselineMs?: number;
  detail?: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount?: number;
}

export interface TrainPTCLifecycle {
  trainId: string;
  symbol: string;
  overallStatus: "NOMINAL" | "DEGRADED" | "FAILED" | "INITIALIZING";
  lastUpdated: string;
  bosInstance: string;
  bosRegion: string;
  kesStatus: "VALID" | "EXPIRING" | "EXPIRED" | "REVOKED";
  keysExpiresAt: string;
  keysIssuedAt: string;
  movementAuthority?: {
    maId: string;
    fromMp: number;
    toMp: number;
    issuedAt: string;
    expiresAt: string;
    issuedBy: string;
    status: "ACTIVE" | "CONSUMED" | "EXPIRED";
  };
  steps: PTCLifecycleStep[];
}

export const PTC_LIFECYCLES: TrainPTCLifecycle[] = [
  {
    trainId: "CN-Q11451-05",
    symbol: "Q11451-05",
    overallStatus: "NOMINAL",
    lastUpdated: "2026-05-05 10:22:00",
    bosInstance: "CI BOS — Primary",
    bosRegion: "Eastern Canada",
    kesStatus: "VALID",
    keysIssuedAt: "2026-05-05 05:44:00",
    keysExpiresAt: "2026-05-06 05:44:00",
    movementAuthority: {
      maId: "MA-Q11451-0188",
      fromMp: 188.4,
      toMp: 222.0,
      issuedAt: "2026-05-05 10:18:00",
      expiresAt: "2026-05-05 11:18:00",
      issuedBy: "PDS — CN Dispatch",
      status: "ACTIVE",
    },
    steps: [
      { seq: 1, system: "I-ETMS", stepName: "I-ETMS Boot", description: "Onboard I-ETMS system initialization", status: "COMPLETE", timestamp: "2026-05-05 05:30:00", latencyMs: 8200, latencyBaselineMs: 7500, detail: "I-ETMS v4.2.1 loaded. GPS lock acquired (8 satellites). Track database: Kingston Sub current." },
      { seq: 2, system: "KES", stepName: "Key Exchange Request", description: "I-ETMS requests cryptographic keys from Key Exchange Server", status: "COMPLETE", timestamp: "2026-05-05 05:38:00", latencyMs: 340, latencyBaselineMs: 280, detail: "KES request sent via ITCM. Key set #KS-2026-0512 issued. Valid 24h. Certificate chain verified." },
      { seq: 3, system: "KES", stepName: "Key Validation", description: "Locomotive validates received keys against KES certificate", status: "COMPLETE", timestamp: "2026-05-05 05:38:00", latencyMs: 120, latencyBaselineMs: 100, detail: "Key fingerprint verified. Encryption handshake complete. Secure channel established." },
      { seq: 4, system: "BOS", stepName: "BOS Registration", description: "I-ETMS registers train with Back Office Server", status: "COMPLETE", timestamp: "2026-05-05 05:40:00", latencyMs: 1840, latencyBaselineMs: 1200, detail: "Registered with CI BOS (Eastern). Train profile loaded: 85 cars, 18,650 tons, 5,420 ft. Consist hash verified.", retryCount: 0 },
      { seq: 5, system: "BOS", stepName: "Track Data Download", description: "BOS pushes subdivision track database to locomotive", status: "COMPLETE", timestamp: "2026-05-05 05:42:00", latencyMs: 12400, latencyBaselineMs: 9800, detail: "Kingston Sub track data downloaded: 284 miles, 1,842 records. Signal locations, grade profiles, speed restrictions, civil speed table loaded." },
      { seq: 6, system: "PDS", stepName: "Movement Authority Request", description: "I-ETMS requests initial movement authority from PDS via BOS", status: "COMPLETE", timestamp: "2026-05-05 06:18:00", latencyMs: 2100, latencyBaselineMs: 1800, detail: "MA requested for departure from MacMillan Yard. PDS issued MA-Q11451-0001: MP 0.0 → MP 44.2 (Belleville). Authorized speed: 60 mph." },
      { seq: 7, system: "I-ETMS", stepName: "PTC Enforcement Active", description: "I-ETMS begins enforcing movement authority and speed limits", status: "COMPLETE", timestamp: "2026-05-05 06:22:00", latencyMs: 0, detail: "PTC ACTIVE. Departure authorized. Trip Optimizer loaded with route profile. DPU radio link confirmed." },
      { seq: 8, system: "BOS", stepName: "Continuous Position Reports", description: "I-ETMS sends position updates to BOS every 30 seconds", status: "IN_PROGRESS", timestamp: "2026-05-05 10:22:00", latencyMs: 420, latencyBaselineMs: 380, detail: "Position: MP 188.4 Kingston Sub. Speed: 52 mph. Last report: 10:22:14. Next expected: 10:22:44." },
      { seq: 9, system: "PDS", stepName: "Movement Authority Renewal", description: "I-ETMS requests MA renewal as train approaches end of current authority", status: "IN_PROGRESS", timestamp: "2026-05-05 10:18:00", latencyMs: 2100, detail: "Current MA: MP 188.4 → 222.0. Renewal requested at MP 188.4 (34 miles remaining). PDS processing." },
      { seq: 10, system: "KES", stepName: "Key Renewal (Scheduled)", description: "Keys expire in 19h 22m — renewal scheduled", status: "PENDING", detail: "Key set #KS-2026-0512 expires 2026-05-06 05:44. Auto-renewal will trigger at 18h remaining." },
    ],
  },
  {
    trainId: "CN-L50251-05",
    symbol: "L50251-05",
    overallStatus: "DEGRADED",
    lastUpdated: "2026-05-05 09:44:00",
    bosInstance: "CI BOS — Primary",
    bosRegion: "Western Canada",
    kesStatus: "VALID",
    keysIssuedAt: "2026-05-05 03:44:00",
    keysExpiresAt: "2026-05-06 03:44:00",
    movementAuthority: {
      maId: "MA-L50251-0112",
      fromMp: 108.4,
      toMp: 108.4,
      issuedAt: "2026-05-05 09:12:00",
      expiresAt: "2026-05-05 10:12:00",
      issuedBy: "PDS — CN Dispatch",
      status: "ACTIVE",
    },
    steps: [
      { seq: 1, system: "I-ETMS", stepName: "I-ETMS Boot", description: "Onboard I-ETMS system initialization", status: "COMPLETE", timestamp: "2026-05-05 03:44:00", latencyMs: 7800, latencyBaselineMs: 7500, detail: "I-ETMS v4.2.1 loaded. GPS lock acquired. Track database: Edson Sub current." },
      { seq: 2, system: "KES", stepName: "Key Exchange Request", description: "I-ETMS requests cryptographic keys from Key Exchange Server", status: "COMPLETE", timestamp: "2026-05-05 03:50:00", latencyMs: 290, latencyBaselineMs: 280, detail: "Key set #KS-2026-0508 issued. Valid 24h." },
      { seq: 3, system: "KES", stepName: "Key Validation", description: "Locomotive validates received keys against KES certificate", status: "COMPLETE", timestamp: "2026-05-05 03:50:00", latencyMs: 105, latencyBaselineMs: 100, detail: "Key fingerprint verified. Secure channel established." },
      { seq: 4, system: "BOS", stepName: "BOS Registration", description: "I-ETMS registers train with Back Office Server", status: "COMPLETE", timestamp: "2026-05-05 03:52:00", latencyMs: 1180, latencyBaselineMs: 1200, detail: "Registered with CI BOS (Western). 148 cars, 24,100 tons, 9,200 ft. DPU registered as secondary unit.", retryCount: 0 },
      { seq: 5, system: "BOS", stepName: "Track Data Download", description: "BOS pushes subdivision track database to locomotive", status: "COMPLETE", timestamp: "2026-05-05 03:55:00", latencyMs: 10200, latencyBaselineMs: 9800, detail: "Edson Sub track data downloaded: 312 miles. Grade profiles loaded — heavy mountain territory." },
      { seq: 6, system: "PDS", stepName: "Movement Authority Request", description: "I-ETMS requests initial movement authority from PDS via BOS", status: "COMPLETE", timestamp: "2026-05-05 03:58:00", latencyMs: 1900, latencyBaselineMs: 1800, detail: "Initial MA issued: MP 0.0 → MP 44.2." },
      { seq: 7, system: "I-ETMS", stepName: "PTC Enforcement Active", description: "I-ETMS begins enforcing movement authority and speed limits", status: "COMPLETE", timestamp: "2026-05-05 04:00:00", latencyMs: 0, detail: "PTC ACTIVE. Departure authorized." },
      { seq: 8, system: "BOS", stepName: "Continuous Position Reports", description: "I-ETMS sends position updates to BOS every 30 seconds", status: "FAILED", timestamp: "2026-05-05 09:14:00", latencyMs: 8400, latencyBaselineMs: 380, errorCode: "BOS-4012", errorMessage: "Position report timeout — no acknowledgement from BOS within 8s. Train stopped at MP 108.4. Cellular signal degraded in Edson mountain territory.", retryCount: 3, detail: "Last confirmed position report: 09:11:44. 3 retries attempted. BOS reconnect in progress via backup cellular channel." },
      { seq: 9, system: "PDS", stepName: "Emergency Stop Authority", description: "PDS issued restricted MA due to HBD alarm and communication degradation", status: "COMPLETE", timestamp: "2026-05-05 09:12:00", latencyMs: 1200, detail: "MA restricted to MP 108.4 (current position). Train must not move until mechanical inspection complete and BOS communication restored." },
      { seq: 10, system: "CARMA", stepName: "CARMA Alarm Generated", description: "CARMA Wayside module generated HBD alarm event", status: "COMPLETE", timestamp: "2026-05-05 09:12:00", latencyMs: 0, detail: "HBD alarm: Car CN 881044, Axle A2-Right, 112°C. Alarm forwarded to RTC Edmonton and CN Mechanical. ServiceNow incident INC-2026-8841 created." },
    ],
  },
  {
    trainId: "CN-A41451-05",
    symbol: "A41451-05",
    overallStatus: "NOMINAL",
    lastUpdated: "2026-05-05 09:22:00",
    bosInstance: "CI BOS — Primary",
    bosRegion: "Eastern Canada",
    kesStatus: "VALID",
    keysIssuedAt: "2026-05-05 08:44:00",
    keysExpiresAt: "2026-05-06 08:44:00",
    movementAuthority: {
      maId: "MA-A41451-0004",
      fromMp: 22.4,
      toMp: 44.0,
      issuedAt: "2026-05-05 09:18:00",
      expiresAt: "2026-05-05 10:18:00",
      issuedBy: "PDS — CN Dispatch",
      status: "ACTIVE",
    },
    steps: [
      { seq: 1, system: "I-ETMS", stepName: "I-ETMS Boot", description: "Onboard I-ETMS system initialization", status: "COMPLETE", timestamp: "2026-05-05 08:00:00", latencyMs: 7600, latencyBaselineMs: 7500, detail: "I-ETMS v4.2.1 loaded. GPS lock acquired. Track database: Montréal Sub current." },
      { seq: 2, system: "KES", stepName: "Key Exchange Request", description: "I-ETMS requests cryptographic keys from Key Exchange Server", status: "COMPLETE", timestamp: "2026-05-05 08:08:00", latencyMs: 285, latencyBaselineMs: 280, detail: "Key set #KS-2026-0515 issued. Valid 24h." },
      { seq: 3, system: "KES", stepName: "Key Validation", description: "Locomotive validates received keys against KES certificate", status: "COMPLETE", timestamp: "2026-05-05 08:08:00", latencyMs: 98, latencyBaselineMs: 100, detail: "Key fingerprint verified. Secure channel established." },
      { seq: 4, system: "BOS", stepName: "BOS Registration", description: "I-ETMS registers train with Back Office Server", status: "COMPLETE", timestamp: "2026-05-05 08:10:00", latencyMs: 1320, latencyBaselineMs: 1200, detail: "Registered with CI BOS (Eastern). 94 cars, 11,080 tons, 6,100 ft. Consist updated after TTGX 8841 and CSXT 4412 removed.", retryCount: 0 },
      { seq: 5, system: "BOS", stepName: "Track Data Download", description: "BOS pushes subdivision track database to locomotive", status: "COMPLETE", timestamp: "2026-05-05 08:12:00", latencyMs: 9400, latencyBaselineMs: 9800, detail: "Montréal Sub track data downloaded. Work limit TE-009 (MP 8.2–9.8) included in track database." },
      { seq: 6, system: "PDS", stepName: "Movement Authority Request", description: "I-ETMS requests initial movement authority from PDS via BOS", status: "COMPLETE", timestamp: "2026-05-05 08:50:00", latencyMs: 1750, latencyBaselineMs: 1800, detail: "Initial MA issued after ABT re-test PASS. MA: MP 0.0 → MP 22.4. Work limit at MP 8.2–9.8 enforced — speed restricted to 25 mph through switch maintenance zone." },
      { seq: 7, system: "I-ETMS", stepName: "PTC Enforcement Active", description: "I-ETMS begins enforcing movement authority and speed limits", status: "COMPLETE", timestamp: "2026-05-05 08:55:00", latencyMs: 0, detail: "PTC ACTIVE. Departure authorized. Speed restriction at MP 8.2–9.8 pre-loaded." },
      { seq: 8, system: "BOS", stepName: "Continuous Position Reports", description: "I-ETMS sends position updates to BOS every 30 seconds", status: "IN_PROGRESS", timestamp: "2026-05-05 09:22:00", latencyMs: 395, latencyBaselineMs: 380, detail: "Position: MP 22.4 Montréal Sub. Speed: 60 mph. Last report: 09:22:08." },
      { seq: 9, system: "PDS", stepName: "Movement Authority Renewal", description: "I-ETMS requests MA renewal as train approaches end of current authority", status: "IN_PROGRESS", timestamp: "2026-05-05 09:18:00", latencyMs: 1750, detail: "Current MA: MP 22.4 → 44.0. Renewal requested." },
      { seq: 10, system: "KES", stepName: "Key Renewal (Scheduled)", description: "Keys expire in 23h 22m — renewal scheduled", status: "PENDING", detail: "Key set #KS-2026-0515 expires 2026-05-06 08:44. Auto-renewal will trigger at 18h remaining." },
    ],
  },
];

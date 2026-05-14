// CN Rail OT SPOG — Journey & Wayside Data
// Covers multiple trains, subdivisions, all detector types, wheel readings, and wayside traffic

export type Health = "healthy" | "warning" | "critical" | "offline";

// ─── Subdivisions ─────────────────────────────────────────────────────────────
export const SUBDIVISIONS = [
  "Bala", "Ruel", "Capreol", "MacTier", "Kingston",
  "Halton", "Oakville", "Strathroy", "Dundas", "Wainwright",
];

// ─── Wheel Reading (per axle/side from HBD) ───────────────────────────────────
export interface WheelReading {
  position: string; // e.g. "A1-L" (axle 1, left)
  tempF: number;
  status: Health;
  note?: string;
}

// ─── Detector Reading Types ───────────────────────────────────────────────────
// Each detector type produces a different reading per car
export type DetectorType =
  | "HBD"   // Hot Box Detector — bearing temperature
  | "HWD"   // Hot Wheel Detector — wheel surface temperature
  | "WILD"  // Wheel Impact Load Detector — impact force (kips)
  | "ABD"   // Acoustic Bearing Detector — noise signature score
  | "CRD"   // Cracked Rim Detector — acoustic crack signature
  | "DED"   // Dragging Equipment Detector — clearance violation
  | "TPD";  // Truck Performance Detector — hunting/instability

export interface DetectorReading {
  detectorType: DetectorType;
  detectorName: string;
  milepost: number;
  subdivision: string;
  time: string;
  status: Health;
  readings: WheelReading[]; // per-axle readings where applicable
  summary: string;          // human-readable summary
  threshold?: string;       // e.g. "200°F alarm"
  value?: string;           // aggregate value e.g. "Max 184°F"
}

export interface CarDetail {
  id: string;
  number: string;
  type: "lead" | "dpu" | "car";
  health: Health;
  detail: string;
  loadedLbs?: number;
  wheels: WheelReading[];           // latest HBD readings
  detectorReadings: DetectorReading[]; // all detector types for this car
}

// ─── Onboard Component ────────────────────────────────────────────────────────
export interface OnboardComponent {
  id: string;
  name: string;
  abbr: string;
  health: Health;
  detail: string;
  metric?: string;
}

// ─── Wayside Event ────────────────────────────────────────────────────────────
export type WaysideType = "wiu" | "detector" | "signal" | "crossing" | "base_station";

export interface WaysideEvent {
  milepost: number;
  subdivision: string;
  time: string;
  type: WaysideType;
  name: string;
  status: Health;
  detail: string;
  backOfficeAck?: boolean;
  latencyMs?: number;
}

// ─── Back-Office Event ────────────────────────────────────────────────────────
export interface BackOfficeEvent {
  time: string;
  system: string;
  event: string;
  status: Health;
  latencyMs?: number;
}

// ─── Train Record ─────────────────────────────────────────────────────────────
export interface TrainRecord {
  trainId: string;
  leadLoco: string;
  subdivision: string;
  date: string;
  startTime: string;
  currentMp: number;
  speedMph: number;
  ptcState: string;
  onboard: OnboardComponent[];
  consist: CarDetail[];
  waysideEvents: WaysideEvent[];
  backOfficeEvents: BackOfficeEvent[];
}

// ─── Wayside Infrastructure ───────────────────────────────────────────────────
export interface WaysideInfraPoint {
  id: string;
  subdivision: string;
  milepost: number;
  type: WaysideType;
  name: string;
  status: Health;
  lastChecked: string;
  trafficLog: TrafficEntry[];
}

export interface TrafficEntry {
  trainId: string;
  leadLoco: string;
  time: string;
  date: string;
  direction: "East" | "West" | "North" | "South";
  status: Health;
  latencyMs?: number;
  detail: string;
}

// ─── TNU Connectivity (ETC Feature 1) ─────────────────────────────────────────
export interface TnuConnectivityEvent {
  trainId: string;
  leadLoco: string;
  subdivision: string;
  milepost: number;
  time: string;
  date: string;
  radioLost: boolean;
  cellLost: boolean;
  durationSec: number;
  status: Health;
  detail: string;
}

// ─── Dynamic Subscription Trend (ETC Feature 2) ───────────────────────────────
export interface DynSubDataPoint {
  month: string;
  radioRelease: string;
  ietmsRelease: string;
  avgDynSubs: number;
  failedSubs: number;
}

// ─── WSRS Transport Stats (ETC Feature 3) ─────────────────────────────────────
export interface WsrsTransportStat {
  subdivision: string;
  site: string;
  milepost: number;
  radioMsgsPerHour: number;
  cellMsgsPerHour: number;
  missedMsgsPerHour: number;
  missedPct: number;
  status: Health;
  alert?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeWheels(baseTemp: number, anomalyAxle?: number): WheelReading[] {
  const axles = ["A1", "A2", "A3", "A4"];
  const sides = ["L", "R"] as const;
  return axles.flatMap((axle, ai) =>
    sides.map((side) => {
      const isAnomaly = anomalyAxle !== undefined && ai === anomalyAxle;
      const temp = isAnomaly
        ? baseTemp + 80 + Math.round(Math.random() * 40)
        : baseTemp + Math.round((Math.random() - 0.5) * 12);
      const status: Health = temp > 200 ? "critical" : temp > 160 ? "warning" : "healthy";
      return {
        position: `${axle}-${side}`,
        tempF: temp,
        status,
        note: isAnomaly ? "Elevated — flagged by HBD MP 18.7" : undefined,
      };
    })
  );
}

function makeHealthyWheels(baseTemp: number): WheelReading[] {
  return makeWheels(baseTemp);
}

// Build a full set of detector readings for a car
function makeDetectorReadings(
  milepost: number,
  subdivision: string,
  time: string,
  opts: {
    hbdAnomalyAxle?: number;
    hbdBase?: number;
    wildHigh?: boolean;
    abdAnomaly?: boolean;
    crdAnomaly?: boolean;
    dedAnomaly?: boolean;
    hwdAnomaly?: boolean;
    tpdAnomaly?: boolean;
  } = {}
): DetectorReading[] {
  const readings: DetectorReading[] = [];

  // HBD — Hot Box Detector
  const hbdBase = opts.hbdBase ?? 100;
  const hbdWheels = makeWheels(hbdBase, opts.hbdAnomalyAxle);
  const maxHbd = Math.max(...hbdWheels.map((w) => w.tempF));
  readings.push({
    detectorType: "HBD",
    detectorName: `Hot Bearing Detector MP ${milepost}`,
    milepost, subdivision, time,
    status: opts.hbdAnomalyAxle !== undefined ? (maxHbd > 200 ? "critical" : "warning") : "healthy",
    readings: hbdWheels,
    summary: opts.hbdAnomalyAxle !== undefined
      ? `Axle A${opts.hbdAnomalyAxle + 1} elevated — ${maxHbd}°F`
      : `All axles normal · Max ${maxHbd}°F`,
    threshold: "200°F alarm / 160°F warning",
    value: `Max ${maxHbd}°F`,
  });

  // HWD — Hot Wheel Detector
  const hwdBase = opts.hwdAnomaly ? 195 : 95;
  readings.push({
    detectorType: "HWD",
    detectorName: `Hot Wheel Detector MP ${milepost}`,
    milepost, subdivision, time,
    status: opts.hwdAnomaly ? "warning" : "healthy",
    readings: makeWheels(hwdBase),
    summary: opts.hwdAnomaly ? "Wheel surface temp elevated — 195°F" : "All wheel surfaces normal",
    threshold: "220°F alarm / 180°F warning",
    value: opts.hwdAnomaly ? "195°F" : `${hwdBase + 5}°F`,
  });

  // WILD — Wheel Impact Load Detector
  const wildKips = opts.wildHigh ? 142 : 38 + Math.round(Math.random() * 20);
  readings.push({
    detectorType: "WILD",
    detectorName: `Wheel Impact Load Detector MP ${milepost}`,
    milepost, subdivision, time,
    status: opts.wildHigh ? "critical" : "healthy",
    readings: [], // WILD produces per-wheel force, not temperature
    summary: opts.wildHigh
      ? `High impact load detected — ${wildKips} kips (threshold: 90 kips)`
      : `All wheels within limits · Max ${wildKips} kips`,
    threshold: "90 kips warning / 130 kips alarm",
    value: `${wildKips} kips`,
  });

  // ABD — Acoustic Bearing Detector
  const abdScore = opts.abdAnomaly ? 78 : 12 + Math.round(Math.random() * 10);
  readings.push({
    detectorType: "ABD",
    detectorName: `Acoustic Bearing Detector MP ${milepost}`,
    milepost, subdivision, time,
    status: opts.abdAnomaly ? "warning" : "healthy",
    readings: [],
    summary: opts.abdAnomaly
      ? `Bearing noise signature elevated — score ${abdScore}/100`
      : `Acoustic signatures normal · Score ${abdScore}/100`,
    threshold: "Score >60 warning / >80 alarm",
    value: `Score ${abdScore}`,
  });

  // CRD — Cracked Rim Detector
  readings.push({
    detectorType: "CRD",
    detectorName: `Cracked Rim Detector MP ${milepost}`,
    milepost, subdivision, time,
    status: opts.crdAnomaly ? "critical" : "healthy",
    readings: [],
    summary: opts.crdAnomaly
      ? "Crack signature detected on Axle A2-R — immediate inspection required"
      : "No crack signatures detected",
    threshold: "Any positive detection = alarm",
    value: opts.crdAnomaly ? "CRACK DETECTED" : "Clear",
  });

  // DED — Dragging Equipment Detector
  readings.push({
    detectorType: "DED",
    detectorName: `Dragging Equipment Detector MP ${milepost}`,
    milepost, subdivision, time,
    status: opts.dedAnomaly ? "critical" : "healthy",
    readings: [],
    summary: opts.dedAnomaly
      ? "Clearance violation detected — dragging equipment below rail level"
      : "No dragging equipment detected",
    threshold: "Any contact = alarm",
    value: opts.dedAnomaly ? "CONTACT" : "Clear",
  });

  // TPD — Truck Performance Detector
  const tpdScore = opts.tpdAnomaly ? 72 : 8 + Math.round(Math.random() * 8);
  readings.push({
    detectorType: "TPD",
    detectorName: `Truck Performance Detector MP ${milepost}`,
    milepost, subdivision, time,
    status: opts.tpdAnomaly ? "warning" : "healthy",
    readings: [],
    summary: opts.tpdAnomaly
      ? `Hunting/instability detected — stability score ${tpdScore}/100`
      : `Truck performance normal · Stability score ${tpdScore}/100`,
    threshold: "Score >50 warning / >75 alarm",
    value: `Score ${tpdScore}`,
  });

  return readings;
}

// ─── TRAIN DATA ───────────────────────────────────────────────────────────────
export const TRAINS: TrainRecord[] = [
  // ── Train 1: CN 3864 / Bala Sub ──────────────────────────────────────────
  {
    trainId: "CN 3864",
    leadLoco: "CN 2743",
    subdivision: "Bala",
    date: "2025-05-04",
    startTime: "13:44",
    currentMp: 44.5,
    speedMph: 48,
    ptcState: "ACTIVE",
    onboard: [
      { id: "ietms", name: "I-ETMS / Onboard PTC", abbr: "I-ETMS", health: "healthy", detail: "PTC Active · Authority valid · Speed 48 mph", metric: "ACTIVE" },
      { id: "tmc", name: "Train Management Computer", abbr: "TMC", health: "healthy", detail: "Last telemetry 2h 14m ago · Next expected in 1h 46m", metric: "4h cycle" },
      { id: "lig", name: "Locomotive Interface Gateway", abbr: "LIG", health: "warning", detail: "Socket open · Throughput reduced (12 msg/min vs 24 avg)", metric: "12 msg/min" },
      { id: "acc", name: "Advanced Communications Controller", abbr: "ACC", health: "healthy", detail: "220MHz RSSI -78 dBm · Cellular 4G LTE connected", metric: "-78 dBm" },
      { id: "gps", name: "GNSS Positioning", abbr: "GPS", health: "healthy", detail: "Satellites: 9 · HDOP: 1.2 · Fix: 3D", metric: "9 sats" },
      { id: "cdu", name: "Crew Display Unit", abbr: "CDU", health: "healthy", detail: "Display active · Crew acknowledged last bulletin", metric: "OK" },
      { id: "to", name: "Trip Optimizer", abbr: "TO", health: "healthy", detail: "B2B initialized · Eco mode active · Fuel saving 4.2%", metric: "ECO" },
      { id: "bpp", name: "Brake Pipe Pressure", abbr: "BPP", health: "healthy", detail: "90 PSI · Within normal operating range", metric: "90 PSI" },
    ],
    consist: [
      {
        id: "l1", number: "CN 2743", type: "lead", health: "warning",
        detail: "LIG throughput reduced", loadedLbs: 0,
        wheels: makeWheels(98),
        detectorReadings: makeDetectorReadings(18.7, "Bala", "14:11", {}),
      },
      {
        id: "l2", number: "CN 2891", type: "lead", health: "healthy",
        detail: "All systems nominal", loadedLbs: 0,
        wheels: makeWheels(95),
        detectorReadings: makeDetectorReadings(18.7, "Bala", "14:11", {}),
      },
      {
        id: "d1", number: "CN 3012 (DPU)", type: "dpu", health: "healthy",
        detail: "Remote control active", loadedLbs: 0,
        wheels: makeWheels(97),
        detectorReadings: makeDetectorReadings(18.7, "Bala", "14:11", {}),
      },
      {
        id: "c1", number: "BCOL 4421", type: "car", health: "healthy",
        detail: "Loaded · 286K lbs", loadedLbs: 286000,
        wheels: makeWheels(102),
        detectorReadings: makeDetectorReadings(18.7, "Bala", "14:11", {}),
      },
      {
        id: "c2", number: "BCOL 4422", type: "car", health: "healthy",
        detail: "Loaded · 286K lbs", loadedLbs: 286000,
        wheels: makeWheels(105),
        detectorReadings: makeDetectorReadings(18.7, "Bala", "14:11", {}),
      },
      {
        id: "c3", number: "CN 8831", type: "car", health: "warning",
        detail: "Axle A3-R elevated temp · HBD flagged", loadedLbs: 286000,
        wheels: makeWheels(104, 2),
        detectorReadings: makeDetectorReadings(18.7, "Bala", "14:11", { hbdAnomalyAxle: 2, hbdBase: 104, abdAnomaly: true }),
      },
      {
        id: "c4", number: "CN 8832", type: "car", health: "healthy",
        detail: "Loaded · 286K lbs", loadedLbs: 286000,
        wheels: makeWheels(101),
        detectorReadings: makeDetectorReadings(18.7, "Bala", "14:11", {}),
      },
      {
        id: "c5", number: "TTGX 9901", type: "car", health: "healthy",
        detail: "Loaded · 286K lbs", loadedLbs: 286000,
        wheels: makeWheels(99),
        detectorReadings: makeDetectorReadings(18.7, "Bala", "14:11", { wildHigh: false }),
      },
    ],
    waysideEvents: [
      { milepost: 12.4, subdivision: "Bala", time: "14:02:11", type: "wiu", name: "WIU MP 12.4", status: "healthy", detail: "PTC message received · HMAC valid · Aspect: Clear", backOfficeAck: true, latencyMs: 340 },
      { milepost: 18.7, subdivision: "Bala", time: "14:11:44", type: "detector", name: "Multi-Detector Array MP 18.7", status: "warning", detail: "Car CN 8831 Axle A3-R: 184°F (HBD) · ABD score elevated · All other detectors clear", backOfficeAck: true, latencyMs: 210 },
      { milepost: 23.1, subdivision: "Bala", time: "14:18:05", type: "signal", name: "Signal MP 23.1", status: "healthy", detail: "Aspect: Approach · WASP monitoring active", backOfficeAck: true, latencyMs: 290 },
      { milepost: 27.6, subdivision: "Bala", time: "14:24:33", type: "crossing", name: "Crossing MP 27.6 (Hwy 400)", status: "warning", detail: "Gate activation delayed 4.2s vs 2.0s threshold · CARMA alert raised", backOfficeAck: true, latencyMs: 4200 },
      { milepost: 31.9, subdivision: "Bala", time: "14:31:17", type: "wiu", name: "WIU MP 31.9", status: "healthy", detail: "PTC message received · HMAC valid · Aspect: Clear", backOfficeAck: true, latencyMs: 380 },
      { milepost: 38.2, subdivision: "Bala", time: "14:41:02", type: "detector", name: "Multi-Detector Array MP 38.2", status: "healthy", detail: "HBD · HWD · WILD · ABD · CRD · DED · TPD — all clear", backOfficeAck: true, latencyMs: 180 },
      { milepost: 44.5, subdivision: "Bala", time: "14:51:38", type: "wiu", name: "WIU MP 44.5", status: "critical", detail: "HMAC validation failed · BOS OPK mismatch · KES re-key triggered", backOfficeAck: false, latencyMs: 12400 },
      { milepost: 49.1, subdivision: "Bala", time: "15:01:14", type: "signal", name: "Signal MP 49.1", status: "healthy", detail: "Aspect: Clear · WASP nominal", backOfficeAck: true, latencyMs: 260 },
    ],
    backOfficeEvents: [
      { time: "13:44:00", system: "KES", event: "OPK distributed to CN 2743 and WIU MP 44.5", status: "healthy", latencyMs: 120 },
      { time: "13:45:12", system: "CI BOS", event: "Crew identity verified · Engineer ID 4821 confirmed", status: "healthy", latencyMs: 340 },
      { time: "13:46:30", system: "G BOS", event: "Consist data delivered · 8 units · Subdivision list updated", status: "healthy", latencyMs: 890 },
      { time: "13:47:01", system: "PDS", event: "Movement authority issued · Bala Sub MP 0.0 → MP 62.4", status: "healthy", latencyMs: 210 },
      { time: "13:47:45", system: "ITCM", event: "Authority delivered to I-ETMS onboard via AMQP", status: "healthy", latencyMs: 42000 },
      { time: "14:11:46", system: "CARMA", event: "HBD MP 18.7 — Car CN 8831 Axle A3-R: 184°F · ABD elevated · Monitoring flag set", status: "warning" },
      { time: "14:24:37", system: "CARMA", event: "Crossing MP 27.6 gate delay alert raised · Priority 3", status: "warning" },
      { time: "14:51:42", system: "BOS", event: "HMAC validation failure at WIU MP 44.5 · OPK mismatch", status: "critical", latencyMs: 12400 },
      { time: "14:51:44", system: "KES", event: "Emergency re-key initiated for WIU MP 44.5", status: "warning", latencyMs: 800 },
      { time: "14:52:31", system: "BOS", event: "New OPK distributed and validated · WIU MP 44.5 restored", status: "healthy", latencyMs: 340 },
    ],
  },

  // ── Train 2: CN 5501 / Ruel Sub ──────────────────────────────────────────
  {
    trainId: "CN 5501",
    leadLoco: "CN 3301",
    subdivision: "Ruel",
    date: "2025-05-04",
    startTime: "11:20",
    currentMp: 88.2,
    speedMph: 55,
    ptcState: "ACTIVE",
    onboard: [
      { id: "ietms", name: "I-ETMS / Onboard PTC", abbr: "I-ETMS", health: "healthy", detail: "PTC Active · Authority valid · Speed 55 mph", metric: "ACTIVE" },
      { id: "tmc", name: "Train Management Computer", abbr: "TMC", health: "healthy", detail: "Last telemetry 1h 02m ago · Next expected in 2h 58m", metric: "4h cycle" },
      { id: "lig", name: "Locomotive Interface Gateway", abbr: "LIG", health: "healthy", detail: "Socket open · Throughput normal (24 msg/min)", metric: "24 msg/min" },
      { id: "acc", name: "Advanced Communications Controller", abbr: "ACC", health: "critical", detail: "220MHz RSSI -104 dBm · Below threshold -100 dBm · Cellular fallback active", metric: "-104 dBm" },
      { id: "gps", name: "GNSS Positioning", abbr: "GPS", health: "warning", detail: "Satellites: 4 · HDOP: 3.8 · Degraded fix — tunnel zone", metric: "4 sats" },
      { id: "cdu", name: "Crew Display Unit", abbr: "CDU", health: "healthy", detail: "Display active · Crew acknowledged last bulletin", metric: "OK" },
      { id: "to", name: "Trip Optimizer", abbr: "TO", health: "warning", detail: "B2B sync delayed 8 min · Retrying over cellular", metric: "SYNC" },
      { id: "bpp", name: "Brake Pipe Pressure", abbr: "BPP", health: "healthy", detail: "89 PSI · Within normal operating range", metric: "89 PSI" },
    ],
    consist: [
      {
        id: "l1", number: "CN 3301", type: "lead", health: "critical",
        detail: "220MHz RSSI critical", loadedLbs: 0,
        wheels: makeWheels(96),
        detectorReadings: makeDetectorReadings(31.5, "Ruel", "12:08", {}),
      },
      {
        id: "l2", number: "CN 3455", type: "lead", health: "healthy",
        detail: "All systems nominal", loadedLbs: 0,
        wheels: makeWheels(94),
        detectorReadings: makeDetectorReadings(31.5, "Ruel", "12:08", {}),
      },
      {
        id: "c1", number: "CN 7701", type: "car", health: "healthy",
        detail: "Loaded · 263K lbs", loadedLbs: 263000,
        wheels: makeWheels(108),
        detectorReadings: makeDetectorReadings(79.9, "Ruel", "13:31", {}),
      },
      {
        id: "c2", number: "CN 7702", type: "car", health: "healthy",
        detail: "Loaded · 263K lbs", loadedLbs: 263000,
        wheels: makeWheels(106),
        detectorReadings: makeDetectorReadings(79.9, "Ruel", "13:31", {}),
      },
      {
        id: "c3", number: "CSXT 4411", type: "car", health: "healthy",
        detail: "Loaded · 286K lbs", loadedLbs: 286000,
        wheels: makeWheels(103),
        detectorReadings: makeDetectorReadings(79.9, "Ruel", "13:31", { wildHigh: true }),
      },
      {
        id: "c4", number: "CSXT 4412", type: "car", health: "critical",
        detail: "Axle A2-L critical temp · HBD 231°F · Crew notified", loadedLbs: 286000,
        wheels: makeWheels(107, 1),
        detectorReadings: makeDetectorReadings(79.9, "Ruel", "13:31", { hbdAnomalyAxle: 1, hbdBase: 107, abdAnomaly: true, crdAnomaly: false }),
      },
      {
        id: "c5", number: "UP 8821", type: "car", health: "healthy",
        detail: "Loaded · 263K lbs", loadedLbs: 263000,
        wheels: makeWheels(100),
        detectorReadings: makeDetectorReadings(79.9, "Ruel", "13:31", {}),
      },
    ],
    waysideEvents: [
      { milepost: 14.2, subdivision: "Ruel", time: "11:38:00", type: "base_station", name: "Base Station MP 14.2", status: "healthy", detail: "RSSI -72 dBm · All messages routed · COBRA nominal", backOfficeAck: true, latencyMs: 290 },
      { milepost: 22.8, subdivision: "Ruel", time: "11:52:14", type: "wiu", name: "WIU MP 22.8", status: "healthy", detail: "PTC message received · HMAC valid · Aspect: Clear", backOfficeAck: true, latencyMs: 310 },
      { milepost: 31.5, subdivision: "Ruel", time: "12:08:44", type: "detector", name: "Multi-Detector Array MP 31.5", status: "healthy", detail: "HBD · HWD · WILD · ABD · CRD · DED · TPD — all clear", backOfficeAck: true, latencyMs: 195 },
      { milepost: 44.1, subdivision: "Ruel", time: "12:28:02", type: "signal", name: "Signal MP 44.1", status: "healthy", detail: "Aspect: Clear · WASP nominal", backOfficeAck: true, latencyMs: 270 },
      { milepost: 58.7, subdivision: "Ruel", time: "12:51:30", type: "crossing", name: "Crossing MP 58.7 (CR 19)", status: "healthy", detail: "Gate activated on time · 1.8s activation · Normal", backOfficeAck: true, latencyMs: 1800 },
      { milepost: 71.3, subdivision: "Ruel", time: "13:14:11", type: "base_station", name: "Base Station MP 71.3", status: "critical", detail: "RSSI -104 dBm · Below threshold · Cellular fallback engaged · COBRA alert raised", backOfficeAck: true, latencyMs: 8900 },
      { milepost: 79.9, subdivision: "Ruel", time: "13:31:55", type: "detector", name: "Multi-Detector Array MP 79.9", status: "critical", detail: "HBD: CSXT 4412 Axle A2-L 231°F CRITICAL · WILD: CSXT 4411 142 kips HIGH · ABD elevated · Crew notified", backOfficeAck: true, latencyMs: 210 },
      { milepost: 88.2, subdivision: "Ruel", time: "13:48:22", type: "wiu", name: "WIU MP 88.2", status: "warning", detail: "PTC message delayed 3.2s · Cellular fallback in use · HMAC valid", backOfficeAck: true, latencyMs: 3200 },
    ],
    backOfficeEvents: [
      { time: "11:20:00", system: "KES", event: "OPK distributed to CN 3301 and all Ruel Sub WIUs", status: "healthy", latencyMs: 130 },
      { time: "11:21:10", system: "CI BOS", event: "Crew identity verified · Engineer ID 5512 confirmed", status: "healthy", latencyMs: 290 },
      { time: "11:22:05", system: "G BOS", event: "Consist data delivered · 7 units · Subdivision list updated", status: "healthy", latencyMs: 760 },
      { time: "11:22:44", system: "PDS", event: "Movement authority issued · Ruel Sub MP 0.0 → MP 102.6", status: "healthy", latencyMs: 190 },
      { time: "13:14:15", system: "COBRA", event: "Base Station MP 71.3 — RSSI critical · Cellular fallback triggered", status: "critical" },
      { time: "13:31:57", system: "CARMA", event: "HBD MP 79.9 — CSXT 4412 Axle A2-L: 231°F · CRITICAL · Crew notified", status: "critical" },
      { time: "13:31:58", system: "CARMA", event: "WILD MP 79.9 — CSXT 4411: 142 kips · HIGH IMPACT · Flagged for inspection", status: "critical" },
      { time: "13:32:10", system: "ServiceNow", event: "INC-20250504-019 created · Priority 2 · Assigned to PTC-LOCOMOTIVE-IETMS-SUPPORT", status: "warning" },
      { time: "13:48:25", system: "BOS", event: "PTC message delay at WIU MP 88.2 · Cellular fallback · 3.2s latency", status: "warning", latencyMs: 3200 },
    ],
  },

  // ── Train 3: CN 4102 / Kingston Sub ──────────────────────────────────────
  {
    trainId: "CN 4102",
    leadLoco: "CN 2201",
    subdivision: "Kingston",
    date: "2025-05-04",
    startTime: "09:05",
    currentMp: 156.8,
    speedMph: 60,
    ptcState: "ACTIVE",
    onboard: [
      { id: "ietms", name: "I-ETMS / Onboard PTC", abbr: "I-ETMS", health: "healthy", detail: "PTC Active · Authority valid · Speed 60 mph", metric: "ACTIVE" },
      { id: "tmc", name: "Train Management Computer", abbr: "TMC", health: "healthy", detail: "Last telemetry 3h 41m ago · Next expected in 19m", metric: "4h cycle" },
      { id: "lig", name: "Locomotive Interface Gateway", abbr: "LIG", health: "healthy", detail: "Socket open · Throughput normal (26 msg/min)", metric: "26 msg/min" },
      { id: "acc", name: "Advanced Communications Controller", abbr: "ACC", health: "healthy", detail: "220MHz RSSI -71 dBm · Cellular 4G LTE connected", metric: "-71 dBm" },
      { id: "gps", name: "GNSS Positioning", abbr: "GPS", health: "healthy", detail: "Satellites: 11 · HDOP: 0.9 · Fix: 3D", metric: "11 sats" },
      { id: "cdu", name: "Crew Display Unit", abbr: "CDU", health: "healthy", detail: "Display active · All bulletins acknowledged", metric: "OK" },
      { id: "to", name: "Trip Optimizer", abbr: "TO", health: "healthy", detail: "B2B initialized · Eco mode · Fuel saving 6.1%", metric: "ECO" },
      { id: "bpp", name: "Brake Pipe Pressure", abbr: "BPP", health: "healthy", detail: "91 PSI · Within normal operating range", metric: "91 PSI" },
    ],
    consist: [
      { id: "l1", number: "CN 2201", type: "lead", health: "healthy", detail: "All systems nominal", loadedLbs: 0, wheels: makeWheels(93), detectorReadings: makeDetectorReadings(38.4, "Kingston", "09:51", {}) },
      { id: "l2", number: "CN 2344", type: "lead", health: "healthy", detail: "All systems nominal", loadedLbs: 0, wheels: makeWheels(91), detectorReadings: makeDetectorReadings(38.4, "Kingston", "09:51", {}) },
      { id: "c1", number: "CN 9901", type: "car", health: "healthy", detail: "Loaded · 263K lbs", loadedLbs: 263000, wheels: makeWheels(100), detectorReadings: makeDetectorReadings(128.3, "Kingston", "12:09", {}) },
      { id: "c2", number: "CN 9902", type: "car", health: "healthy", detail: "Loaded · 263K lbs", loadedLbs: 263000, wheels: makeWheels(103), detectorReadings: makeDetectorReadings(128.3, "Kingston", "12:09", {}) },
      { id: "c3", number: "CN 9903", type: "car", health: "healthy", detail: "Loaded · 263K lbs", loadedLbs: 263000, wheels: makeWheels(98), detectorReadings: makeDetectorReadings(128.3, "Kingston", "12:09", { dedAnomaly: true }) },
      { id: "c4", number: "CN 9904", type: "car", health: "warning", detail: "DED contact detected at MP 128.3", loadedLbs: 263000, wheels: makeWheels(101), detectorReadings: makeDetectorReadings(128.3, "Kingston", "12:09", { dedAnomaly: true }) },
    ],
    waysideEvents: [
      { milepost: 22.1, subdivision: "Kingston", time: "09:28:00", type: "wiu", name: "WIU MP 22.1", status: "healthy", detail: "PTC message received · HMAC valid · Aspect: Clear", backOfficeAck: true, latencyMs: 320 },
      { milepost: 38.4, subdivision: "Kingston", time: "09:51:14", type: "detector", name: "Multi-Detector Array MP 38.4", status: "healthy", detail: "HBD · HWD · WILD · ABD · CRD · DED · TPD — all clear", backOfficeAck: true, latencyMs: 180 },
      { milepost: 55.9, subdivision: "Kingston", time: "10:18:44", type: "crossing", name: "Crossing MP 55.9 (Hwy 15)", status: "healthy", detail: "Gate activated on time · 1.6s activation", backOfficeAck: true, latencyMs: 1600 },
      { milepost: 78.2, subdivision: "Kingston", time: "10:50:02", type: "base_station", name: "Base Station MP 78.2", status: "healthy", detail: "RSSI -68 dBm · All messages routed · COBRA nominal", backOfficeAck: true, latencyMs: 260 },
      { milepost: 102.7, subdivision: "Kingston", time: "11:28:30", type: "wiu", name: "WIU MP 102.7", status: "healthy", detail: "PTC message received · HMAC valid · Aspect: Approach", backOfficeAck: true, latencyMs: 350 },
      { milepost: 128.3, subdivision: "Kingston", time: "12:09:11", type: "detector", name: "Multi-Detector Array MP 128.3", status: "warning", detail: "DED: CN 9903/9904 — dragging equipment contact detected · Crew notified · Inspection at next terminal", backOfficeAck: true, latencyMs: 190 },
      { milepost: 156.8, subdivision: "Kingston", time: "12:58:22", type: "wiu", name: "WIU MP 156.8", status: "healthy", detail: "PTC message received · HMAC valid · Aspect: Clear", backOfficeAck: true, latencyMs: 310 },
    ],
    backOfficeEvents: [
      { time: "09:05:00", system: "KES", event: "OPK distributed to CN 2201 and all Kingston Sub WIUs", status: "healthy", latencyMs: 115 },
      { time: "09:06:10", system: "CI BOS", event: "Crew identity verified · Engineer ID 3301 confirmed", status: "healthy", latencyMs: 310 },
      { time: "09:07:05", system: "G BOS", event: "Consist data delivered · 6 units · Subdivision list updated", status: "healthy", latencyMs: 820 },
      { time: "09:07:44", system: "PDS", event: "Movement authority issued · Kingston Sub MP 0.0 → MP 180.0", status: "healthy", latencyMs: 200 },
      { time: "09:08:10", system: "ITCM", event: "Authority delivered to I-ETMS onboard via AMQP", status: "healthy", latencyMs: 38000 },
      { time: "12:09:13", system: "CARMA", event: "DED MP 128.3 — CN 9903/9904 dragging equipment · Crew notified · Priority 2", status: "warning" },
      { time: "12:09:15", system: "ServiceNow", event: "INC-20250504-044 created · DED contact · Priority 2 · Inspection at Kingston Yard", status: "warning" },
    ],
  },

  // ── Train 4: CN 7788 / Capreol Sub ───────────────────────────────────────
  {
    trainId: "CN 7788",
    leadLoco: "CN 4401",
    subdivision: "Capreol",
    date: "2025-05-04",
    startTime: "07:30",
    currentMp: 212.4,
    speedMph: 0,
    ptcState: "STOPPED",
    onboard: [
      { id: "ietms", name: "I-ETMS / Onboard PTC", abbr: "I-ETMS", health: "warning", detail: "PTC Stopped · Train held at MP 212.4 · Awaiting authority update", metric: "STOPPED" },
      { id: "tmc", name: "Train Management Computer", abbr: "TMC", health: "healthy", detail: "Last telemetry 0h 44m ago · Next expected in 3h 16m", metric: "4h cycle" },
      { id: "lig", name: "Locomotive Interface Gateway", abbr: "LIG", health: "healthy", detail: "Socket open · Throughput normal (22 msg/min)", metric: "22 msg/min" },
      { id: "acc", name: "Advanced Communications Controller", abbr: "ACC", health: "healthy", detail: "220MHz RSSI -76 dBm · Cellular 4G LTE connected", metric: "-76 dBm" },
      { id: "gps", name: "GNSS Positioning", abbr: "GPS", health: "healthy", detail: "Satellites: 10 · HDOP: 1.0 · Fix: 3D", metric: "10 sats" },
      { id: "cdu", name: "Crew Display Unit", abbr: "CDU", health: "warning", detail: "Authority expiry warning displayed · Crew awaiting update", metric: "WARN" },
      { id: "to", name: "Trip Optimizer", abbr: "TO", health: "offline", detail: "Disengaged — train stopped", metric: "OFF" },
      { id: "bpp", name: "Brake Pipe Pressure", abbr: "BPP", health: "healthy", detail: "90 PSI · Brakes applied · Normal for stopped state", metric: "90 PSI" },
    ],
    consist: [
      { id: "l1", number: "CN 4401", type: "lead", health: "warning", detail: "Authority expiry warning", loadedLbs: 0, wheels: makeWheels(88), detectorReadings: makeDetectorReadings(44.2, "Capreol", "08:28", {}) },
      { id: "l2", number: "CN 4502", type: "lead", health: "healthy", detail: "All systems nominal", loadedLbs: 0, wheels: makeWheels(86), detectorReadings: makeDetectorReadings(44.2, "Capreol", "08:28", {}) },
      { id: "d1", number: "CN 4601 (DPU)", type: "dpu", health: "healthy", detail: "Remote control standby", loadedLbs: 0, wheels: makeWheels(89), detectorReadings: makeDetectorReadings(44.2, "Capreol", "08:28", {}) },
      { id: "c1", number: "CN 6601", type: "car", health: "healthy", detail: "Loaded · 286K lbs", loadedLbs: 286000, wheels: makeWheels(95), detectorReadings: makeDetectorReadings(44.2, "Capreol", "08:28", {}) },
      { id: "c2", number: "CN 6602", type: "car", health: "healthy", detail: "Loaded · 286K lbs", loadedLbs: 286000, wheels: makeWheels(97), detectorReadings: makeDetectorReadings(44.2, "Capreol", "08:28", {}) },
      { id: "c3", number: "CN 6603", type: "car", health: "healthy", detail: "Loaded · 286K lbs", loadedLbs: 286000, wheels: makeWheels(94), detectorReadings: makeDetectorReadings(44.2, "Capreol", "08:28", { tpdAnomaly: true }) },
      { id: "c4", number: "CN 6604", type: "car", health: "healthy", detail: "Loaded · 286K lbs", loadedLbs: 286000, wheels: makeWheels(96), detectorReadings: makeDetectorReadings(44.2, "Capreol", "08:28", {}) },
      { id: "c5", number: "CN 6605", type: "car", health: "healthy", detail: "Loaded · 286K lbs", loadedLbs: 286000, wheels: makeWheels(93), detectorReadings: makeDetectorReadings(44.2, "Capreol", "08:28", {}) },
      { id: "c6", number: "CN 6606", type: "car", health: "healthy", detail: "Loaded · 286K lbs", loadedLbs: 286000, wheels: makeWheels(98), detectorReadings: makeDetectorReadings(44.2, "Capreol", "08:28", {}) },
    ],
    waysideEvents: [
      { milepost: 18.8, subdivision: "Capreol", time: "07:52:00", type: "wiu", name: "WIU MP 18.8", status: "healthy", detail: "PTC message received · HMAC valid", backOfficeAck: true, latencyMs: 300 },
      { milepost: 44.2, subdivision: "Capreol", time: "08:28:14", type: "detector", name: "Multi-Detector Array MP 44.2", status: "warning", detail: "TPD: CN 6603 truck instability score 72 · HBD/HWD/WILD/ABD/CRD/DED all clear", backOfficeAck: true, latencyMs: 175 },
      { milepost: 88.6, subdivision: "Capreol", time: "09:22:44", type: "base_station", name: "Base Station MP 88.6", status: "healthy", detail: "RSSI -74 dBm · All messages routed", backOfficeAck: true, latencyMs: 280 },
      { milepost: 133.1, subdivision: "Capreol", time: "10:18:02", type: "crossing", name: "Crossing MP 133.1 (Hwy 17)", status: "healthy", detail: "Gate activated on time · 1.9s activation", backOfficeAck: true, latencyMs: 1900 },
      { milepost: 178.4, subdivision: "Capreol", time: "11:14:30", type: "wiu", name: "WIU MP 178.4", status: "healthy", detail: "PTC message received · HMAC valid", backOfficeAck: true, latencyMs: 330 },
      { milepost: 212.4, subdivision: "Capreol", time: "12:01:11", type: "signal", name: "Signal MP 212.4", status: "warning", detail: "Aspect: Stop · Train held · Authority update pending from PDS", backOfficeAck: true, latencyMs: 290 },
    ],
    backOfficeEvents: [
      { time: "07:30:00", system: "KES", event: "OPK distributed to CN 4401 and all Capreol Sub WIUs", status: "healthy", latencyMs: 125 },
      { time: "07:31:10", system: "CI BOS", event: "Crew identity verified · Engineer ID 7712 confirmed", status: "healthy", latencyMs: 320 },
      { time: "07:32:05", system: "G BOS", event: "Consist data delivered · 9 units · Subdivision list updated", status: "healthy", latencyMs: 910 },
      { time: "07:32:44", system: "PDS", event: "Movement authority issued · Capreol Sub MP 0.0 → MP 220.0", status: "healthy", latencyMs: 210 },
      { time: "08:28:16", system: "CARMA", event: "TPD MP 44.2 — CN 6603 truck instability score 72 · Monitoring flag set", status: "warning" },
      { time: "12:01:15", system: "PDS", event: "Authority update delayed — dispatcher queue congested", status: "warning" },
      { time: "12:01:20", system: "CDU", event: "Authority expiry warning displayed to crew at MP 212.4", status: "warning" },
      { time: "12:01:22", system: "ServiceNow", event: "INC-20250504-031 created · Priority 3 · Train held at MP 212.4", status: "warning" },
    ],
  },
];

// ─── WAYSIDE INFRASTRUCTURE DATA ─────────────────────────────────────────────
export const WAYSIDE_INFRA: WaysideInfraPoint[] = [
  // ── Bala Subdivision ─────────────────────────────────────────────────────
  { id: "bala-wiu-12", subdivision: "Bala", milepost: 12.4, type: "wiu", name: "WIU MP 12.4", status: "healthy", lastChecked: "15:02", trafficLog: [
    { trainId: "CN 3864", leadLoco: "CN 2743", time: "14:02", date: "2025-05-04", direction: "North", status: "healthy", latencyMs: 340, detail: "HMAC valid · Aspect: Clear" },
    { trainId: "CN 1122", leadLoco: "CN 2101", time: "11:44", date: "2025-05-04", direction: "South", status: "healthy", latencyMs: 310, detail: "HMAC valid · Aspect: Approach" },
    { trainId: "CN 9934", leadLoco: "CN 3801", time: "08:22", date: "2025-05-04", direction: "North", status: "healthy", latencyMs: 290, detail: "HMAC valid · Aspect: Clear" },
    { trainId: "CN 3864", leadLoco: "CN 2743", time: "14:02", date: "2025-05-03", direction: "North", status: "healthy", latencyMs: 355, detail: "HMAC valid · Aspect: Clear" },
    { trainId: "CN 5512", leadLoco: "CN 2901", time: "09:15", date: "2025-05-03", direction: "South", status: "healthy", latencyMs: 320, detail: "HMAC valid · Aspect: Clear" },
  ]},
  { id: "bala-det-18", subdivision: "Bala", milepost: 18.7, type: "detector", name: "Multi-Detector Array MP 18.7", status: "warning", lastChecked: "14:12", trafficLog: [
    { trainId: "CN 3864", leadLoco: "CN 2743", time: "14:11", date: "2025-05-04", direction: "North", status: "warning", latencyMs: 210, detail: "HBD: CN 8831 Axle A3-R 184°F · ABD elevated · HWD/WILD/CRD/DED/TPD clear" },
    { trainId: "CN 1122", leadLoco: "CN 2101", time: "11:52", date: "2025-05-04", direction: "South", status: "healthy", latencyMs: 195, detail: "All detectors clear · Max HBD 112°F" },
    { trainId: "CN 9934", leadLoco: "CN 3801", time: "08:31", date: "2025-05-04", direction: "North", status: "healthy", latencyMs: 200, detail: "All detectors clear · Max HBD 108°F" },
    { trainId: "CN 5512", leadLoco: "CN 2901", time: "09:22", date: "2025-05-03", direction: "South", status: "healthy", latencyMs: 188, detail: "All detectors clear · Max HBD 115°F" },
  ]},
  { id: "bala-cross-27", subdivision: "Bala", milepost: 27.6, type: "crossing", name: "Crossing MP 27.6 (Hwy 400)", status: "warning", lastChecked: "14:25", trafficLog: [
    { trainId: "CN 3864", leadLoco: "CN 2743", time: "14:24", date: "2025-05-04", direction: "North", status: "warning", latencyMs: 4200, detail: "Gate delay 4.2s · Threshold 2.0s" },
    { trainId: "CN 1122", leadLoco: "CN 2101", time: "12:08", date: "2025-05-04", direction: "South", status: "healthy", latencyMs: 1800, detail: "Gate on time · 1.8s activation" },
    { trainId: "CN 9934", leadLoco: "CN 3801", time: "08:44", date: "2025-05-04", direction: "North", status: "healthy", latencyMs: 1900, detail: "Gate on time · 1.9s activation" },
    { trainId: "CN 3864", leadLoco: "CN 2743", time: "14:24", date: "2025-05-03", direction: "North", status: "warning", latencyMs: 3800, detail: "Gate delay 3.8s · Recurring issue" },
    { trainId: "CN 5512", leadLoco: "CN 2901", time: "09:38", date: "2025-05-03", direction: "South", status: "healthy", latencyMs: 1700, detail: "Gate on time · 1.7s activation" },
  ]},
  { id: "bala-wiu-44", subdivision: "Bala", milepost: 44.5, type: "wiu", name: "WIU MP 44.5", status: "critical", lastChecked: "14:52", trafficLog: [
    { trainId: "CN 3864", leadLoco: "CN 2743", time: "14:51", date: "2025-05-04", direction: "North", status: "critical", latencyMs: 12400, detail: "HMAC failure · OPK mismatch · Re-key triggered" },
    { trainId: "CN 1122", leadLoco: "CN 2101", time: "12:21", date: "2025-05-04", direction: "South", status: "healthy", latencyMs: 340, detail: "HMAC valid · Aspect: Clear" },
    { trainId: "CN 9934", leadLoco: "CN 3801", time: "08:58", date: "2025-05-04", direction: "North", status: "healthy", latencyMs: 360, detail: "HMAC valid · Aspect: Clear" },
  ]},

  // ── Ruel Subdivision ─────────────────────────────────────────────────────
  { id: "ruel-bs-71", subdivision: "Ruel", milepost: 71.3, type: "base_station", name: "Base Station MP 71.3", status: "critical", lastChecked: "13:14", trafficLog: [
    { trainId: "CN 5501", leadLoco: "CN 3301", time: "13:14", date: "2025-05-04", direction: "East", status: "critical", latencyMs: 8900, detail: "RSSI -104 dBm · Cellular fallback" },
    { trainId: "CN 4421", leadLoco: "CN 3101", time: "10:44", date: "2025-05-04", direction: "West", status: "critical", latencyMs: 9200, detail: "RSSI -106 dBm · Cellular fallback" },
    { trainId: "CN 2211", leadLoco: "CN 2801", time: "07:22", date: "2025-05-04", direction: "East", status: "warning", latencyMs: 5100, detail: "RSSI -98 dBm · Degraded signal" },
    { trainId: "CN 5501", leadLoco: "CN 3301", time: "13:14", date: "2025-05-03", direction: "East", status: "warning", latencyMs: 4800, detail: "RSSI -96 dBm · Degraded signal" },
  ]},
  { id: "ruel-det-79", subdivision: "Ruel", milepost: 79.9, type: "detector", name: "Multi-Detector Array MP 79.9", status: "critical", lastChecked: "13:32", trafficLog: [
    { trainId: "CN 5501", leadLoco: "CN 3301", time: "13:31", date: "2025-05-04", direction: "East", status: "critical", latencyMs: 210, detail: "HBD: CSXT 4412 Axle A2-L 231°F CRITICAL · WILD: CSXT 4411 142 kips HIGH · ABD elevated" },
    { trainId: "CN 4421", leadLoco: "CN 3101", time: "10:52", date: "2025-05-04", direction: "West", status: "healthy", latencyMs: 195, detail: "All detectors clear · Max HBD 118°F" },
    { trainId: "CN 2211", leadLoco: "CN 2801", time: "07:31", date: "2025-05-04", direction: "East", status: "healthy", latencyMs: 188, detail: "All detectors clear · Max HBD 109°F" },
  ]},
  { id: "ruel-cross-58", subdivision: "Ruel", milepost: 58.7, type: "crossing", name: "Crossing MP 58.7 (CR 19)", status: "healthy", lastChecked: "12:52", trafficLog: [
    { trainId: "CN 5501", leadLoco: "CN 3301", time: "12:51", date: "2025-05-04", direction: "East", status: "healthy", latencyMs: 1800, detail: "Gate on time · 1.8s activation" },
    { trainId: "CN 4421", leadLoco: "CN 3101", time: "10:18", date: "2025-05-04", direction: "West", status: "healthy", latencyMs: 1750, detail: "Gate on time · 1.75s activation" },
    { trainId: "CN 2211", leadLoco: "CN 2801", time: "07:02", date: "2025-05-04", direction: "East", status: "healthy", latencyMs: 1820, detail: "Gate on time · 1.82s activation" },
    { trainId: "CN 5501", leadLoco: "CN 3301", time: "12:51", date: "2025-05-03", direction: "East", status: "healthy", latencyMs: 1790, detail: "Gate on time · 1.79s activation" },
  ]},

  // ── Kingston Subdivision ─────────────────────────────────────────────────
  { id: "king-wiu-22", subdivision: "Kingston", milepost: 22.1, type: "wiu", name: "WIU MP 22.1", status: "healthy", lastChecked: "09:28", trafficLog: [
    { trainId: "CN 4102", leadLoco: "CN 2201", time: "09:28", date: "2025-05-04", direction: "East", status: "healthy", latencyMs: 320, detail: "HMAC valid · Aspect: Clear" },
    { trainId: "CN 3311", leadLoco: "CN 2501", time: "06:44", date: "2025-05-04", direction: "West", status: "healthy", latencyMs: 305, detail: "HMAC valid · Aspect: Clear" },
    { trainId: "CN 4102", leadLoco: "CN 2201", time: "09:28", date: "2025-05-03", direction: "East", status: "healthy", latencyMs: 315, detail: "HMAC valid · Aspect: Clear" },
  ]},
  { id: "king-det-128", subdivision: "Kingston", milepost: 128.3, type: "detector", name: "Multi-Detector Array MP 128.3", status: "warning", lastChecked: "12:09", trafficLog: [
    { trainId: "CN 4102", leadLoco: "CN 2201", time: "12:09", date: "2025-05-04", direction: "East", status: "warning", latencyMs: 190, detail: "DED: CN 9903/9904 dragging equipment contact · HBD/HWD/WILD/ABD/CRD/TPD clear" },
    { trainId: "CN 3311", leadLoco: "CN 2501", time: "09:44", date: "2025-05-04", direction: "West", status: "healthy", latencyMs: 185, detail: "All detectors clear · Max HBD 110°F" },
    { trainId: "CN 4102", leadLoco: "CN 2201", time: "12:09", date: "2025-05-03", direction: "East", status: "healthy", latencyMs: 192, detail: "All detectors clear · Max HBD 106°F" },
  ]},
  { id: "king-cross-55", subdivision: "Kingston", milepost: 55.9, type: "crossing", name: "Crossing MP 55.9 (Hwy 15)", status: "healthy", lastChecked: "10:18", trafficLog: [
    { trainId: "CN 4102", leadLoco: "CN 2201", time: "10:18", date: "2025-05-04", direction: "East", status: "healthy", latencyMs: 1600, detail: "Gate on time · 1.6s activation" },
    { trainId: "CN 3311", leadLoco: "CN 2501", time: "07:44", date: "2025-05-04", direction: "West", status: "healthy", latencyMs: 1720, detail: "Gate on time · 1.72s activation" },
    { trainId: "CN 4102", leadLoco: "CN 2201", time: "10:18", date: "2025-05-03", direction: "East", status: "healthy", latencyMs: 1650, detail: "Gate on time · 1.65s activation" },
    { trainId: "CN 8812", leadLoco: "CN 3001", time: "13:55", date: "2025-05-03", direction: "West", status: "healthy", latencyMs: 1580, detail: "Gate on time · 1.58s activation" },
  ]},

  // ── Capreol Subdivision ──────────────────────────────────────────────────
  { id: "cap-sig-212", subdivision: "Capreol", milepost: 212.4, type: "signal", name: "Signal MP 212.4", status: "warning", lastChecked: "12:01", trafficLog: [
    { trainId: "CN 7788", leadLoco: "CN 4401", time: "12:01", date: "2025-05-04", direction: "North", status: "warning", latencyMs: 290, detail: "Aspect: Stop · Train held · Authority pending" },
    { trainId: "CN 6612", leadLoco: "CN 4201", time: "09:44", date: "2025-05-04", direction: "South", status: "healthy", latencyMs: 275, detail: "Aspect: Clear · Normal passage" },
    { trainId: "CN 7788", leadLoco: "CN 4401", time: "12:01", date: "2025-05-03", direction: "North", status: "healthy", latencyMs: 280, detail: "Aspect: Clear · Normal passage" },
  ]},
  { id: "cap-det-44", subdivision: "Capreol", milepost: 44.2, type: "detector", name: "Multi-Detector Array MP 44.2", status: "warning", lastChecked: "08:28", trafficLog: [
    { trainId: "CN 7788", leadLoco: "CN 4401", time: "08:28", date: "2025-05-04", direction: "North", status: "warning", latencyMs: 175, detail: "TPD: CN 6603 truck instability score 72 · HBD/HWD/WILD/ABD/CRD/DED clear" },
    { trainId: "CN 6612", leadLoco: "CN 4201", time: "06:11", date: "2025-05-04", direction: "South", status: "healthy", latencyMs: 182, detail: "All detectors clear · Max HBD 111°F" },
    { trainId: "CN 7788", leadLoco: "CN 4401", time: "08:28", date: "2025-05-03", direction: "North", status: "healthy", latencyMs: 179, detail: "All detectors clear · Max HBD 107°F" },
    { trainId: "CN 3322", leadLoco: "CN 2401", time: "14:55", date: "2025-05-03", direction: "South", status: "warning", latencyMs: 188, detail: "HBD: CN 6601 Axle A1-R 172°F · Monitored" },
  ]},
];

// ─── TNU CONNECTIVITY DATA (ETC Feature 1) ────────────────────────────────────
export const TNU_EVENTS: TnuConnectivityEvent[] = [
  { trainId: "CN 5501", leadLoco: "CN 3301", subdivision: "Ruel", milepost: 71.3, time: "13:14", date: "2025-05-04", radioLost: true, cellLost: false, durationSec: 142, status: "critical", detail: "220MHz lost · Cellular maintained · Base Station MP 71.3 degraded" },
  { trainId: "CN 3864", leadLoco: "CN 2743", subdivision: "Bala", milepost: 44.5, time: "14:51", date: "2025-05-04", radioLost: false, cellLost: false, durationSec: 47, status: "warning", detail: "HMAC failure caused 47s PTC message gap · Both channels maintained" },
  { trainId: "CN 4421", leadLoco: "CN 3101", subdivision: "Ruel", milepost: 71.3, time: "10:44", date: "2025-05-04", radioLost: true, cellLost: false, durationSec: 198, status: "critical", detail: "220MHz lost · Cellular maintained · Same dead zone as CN 5501" },
  { trainId: "CN 2211", leadLoco: "CN 2801", subdivision: "Ruel", milepost: 68.1, time: "07:18", date: "2025-05-04", radioLost: true, cellLost: true, durationSec: 31, status: "critical", detail: "BOTH channels lost simultaneously · 31s full blackout · Tunnel zone MP 68-69" },
  { trainId: "CN 7788", leadLoco: "CN 4401", subdivision: "Capreol", milepost: 155.2, time: "10:44", date: "2025-05-04", radioLost: false, cellLost: true, durationSec: 88, status: "warning", detail: "Cellular lost · 220MHz maintained · Coverage gap MP 155-157" },
  { trainId: "CN 4102", leadLoco: "CN 2201", subdivision: "Kingston", milepost: 92.4, time: "11:02", date: "2025-05-04", radioLost: false, cellLost: true, durationSec: 54, status: "warning", detail: "Cellular lost · 220MHz maintained · Rural coverage gap" },
  { trainId: "CN 5501", leadLoco: "CN 3301", subdivision: "Ruel", milepost: 71.3, time: "13:14", date: "2025-05-03", radioLost: true, cellLost: false, durationSec: 165, status: "critical", detail: "220MHz lost · Same location as 2025-05-04 · Persistent dead zone" },
  { trainId: "CN 2211", leadLoco: "CN 2801", subdivision: "Ruel", milepost: 68.1, time: "07:22", date: "2025-05-03", radioLost: true, cellLost: true, durationSec: 44, status: "critical", detail: "BOTH channels lost · Tunnel zone MP 68-69 · Recurring pattern" },
];

// ─── DYNAMIC SUBSCRIPTION TREND DATA (ETC Feature 2) ─────────────────────────
export const DYN_SUB_TREND: DynSubDataPoint[] = [
  { month: "Jan 2024", radioRelease: "R4.2", ietmsRelease: "v7.1", avgDynSubs: 1240, failedSubs: 88 },
  { month: "Feb 2024", radioRelease: "R4.2", ietmsRelease: "v7.1", avgDynSubs: 1255, failedSubs: 91 },
  { month: "Mar 2024", radioRelease: "R4.3", ietmsRelease: "v7.1", avgDynSubs: 1261, failedSubs: 74 },
  { month: "Apr 2024", radioRelease: "R4.3", ietmsRelease: "v7.2", avgDynSubs: 1278, failedSubs: 62 },
  { month: "May 2024", radioRelease: "R4.3", ietmsRelease: "v7.2", avgDynSubs: 1290, failedSubs: 58 },
  { month: "Jun 2024", radioRelease: "R4.4", ietmsRelease: "v7.2", avgDynSubs: 1302, failedSubs: 44 },
  { month: "Jul 2024", radioRelease: "R4.4", ietmsRelease: "v7.3", avgDynSubs: 1315, failedSubs: 39 },
  { month: "Aug 2024", radioRelease: "R4.4", ietmsRelease: "v7.3", avgDynSubs: 1328, failedSubs: 41 },
  { month: "Sep 2024", radioRelease: "R4.5", ietmsRelease: "v7.3", avgDynSubs: 1341, failedSubs: 35 },
  { month: "Oct 2024", radioRelease: "R4.5", ietmsRelease: "v7.4", avgDynSubs: 1358, failedSubs: 28 },
  { month: "Nov 2024", radioRelease: "R4.5", ietmsRelease: "v7.4", avgDynSubs: 1371, failedSubs: 31 },
  { month: "Dec 2024", radioRelease: "R5.0", ietmsRelease: "v7.4", avgDynSubs: 1389, failedSubs: 52 },
  { month: "Jan 2025", radioRelease: "R5.0", ietmsRelease: "v8.0", avgDynSubs: 1401, failedSubs: 67 },
  { month: "Feb 2025", radioRelease: "R5.1", ietmsRelease: "v8.0", avgDynSubs: 1412, failedSubs: 38 },
  { month: "Mar 2025", radioRelease: "R5.1", ietmsRelease: "v8.1", avgDynSubs: 1421, failedSubs: 29 },
  { month: "Apr 2025", radioRelease: "R5.1", ietmsRelease: "v8.1", avgDynSubs: 1432, failedSubs: 24 },
];

// ─── WSRS TRANSPORT STATS (ETC Feature 3) ────────────────────────────────────
export const WSRS_STATS: WsrsTransportStat[] = [
  { subdivision: "Bala", site: "Base Station MP 14.2", milepost: 14.2, radioMsgsPerHour: 1840, cellMsgsPerHour: 220, missedMsgsPerHour: 12, missedPct: 0.6, status: "healthy" },
  { subdivision: "Bala", site: "Base Station MP 31.9", milepost: 31.9, radioMsgsPerHour: 1790, cellMsgsPerHour: 195, missedMsgsPerHour: 18, missedPct: 0.9, status: "healthy" },
  { subdivision: "Ruel", site: "Base Station MP 14.2", milepost: 14.2, radioMsgsPerHour: 1620, cellMsgsPerHour: 180, missedMsgsPerHour: 22, missedPct: 1.2, status: "healthy" },
  { subdivision: "Ruel", site: "Base Station MP 71.3", milepost: 71.3, radioMsgsPerHour: 480, cellMsgsPerHour: 1540, missedMsgsPerHour: 312, missedPct: 15.4, status: "critical", alert: "Radio degraded — cellular carrying 76% of traffic · Threshold: 5% missed" },
  { subdivision: "Ruel", site: "Base Station MP 88.6", milepost: 88.6, radioMsgsPerHour: 1410, cellMsgsPerHour: 620, missedMsgsPerHour: 88, missedPct: 4.1, status: "warning", alert: "Missed message rate approaching threshold (4.1% vs 5% limit)" },
  { subdivision: "Kingston", site: "Base Station MP 78.2", milepost: 78.2, radioMsgsPerHour: 1880, cellMsgsPerHour: 210, missedMsgsPerHour: 9, missedPct: 0.4, status: "healthy" },
  { subdivision: "Capreol", site: "Base Station MP 88.6", milepost: 88.6, radioMsgsPerHour: 1650, cellMsgsPerHour: 240, missedMsgsPerHour: 14, missedPct: 0.7, status: "healthy" },
  { subdivision: "Capreol", site: "Base Station MP 155.2", milepost: 155.2, radioMsgsPerHour: 1220, cellMsgsPerHour: 880, missedMsgsPerHour: 145, missedPct: 6.8, status: "warning", alert: "Cellular gap zone — missed rate 6.8% · Coverage improvement required" },
];

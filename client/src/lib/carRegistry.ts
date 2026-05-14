// CN Rail OT SPOG — Car Registry & Cross-Consist Identity
// Tracks individual cars across multiple consists, with full detector history
// and foreign railroad detector readings

import type { Health, DetectorType } from "./journeyData";

// ─── Car Detector History Entry ───────────────────────────────────────────────
export interface CarDetectorEvent {
  id: string;
  date: string;
  time: string;
  trainId: string;
  subdivision: string;
  milepost: number;
  detectorName: string;
  detectorType: DetectorType;
  railroad: "CN" | "CP" | "BNSF" | "CSX" | "UP" | "NS";  // CN or foreign
  status: Health;
  value: string;
  summary: string;
  flagged: boolean;
}

// ─── Car Consist History Entry ────────────────────────────────────────────────
export interface CarConsistHistory {
  trainId: string;
  leadLoco: string;
  subdivision: string;
  date: string;
  position: number;       // position in consist (1 = lead)
  loadedLbs: number;
  role: "lead" | "dpu" | "car";
}

// ─── Car Registry Record ──────────────────────────────────────────────────────
export interface CarRecord {
  carNumber: string;
  reportingMark: string;  // e.g. "CN", "CSXT", "UP"
  carType: string;        // e.g. "Covered Hopper", "Gondola", "Tank Car"
  builtYear: number;
  currentTrainId: string | null;
  currentSubdivision: string | null;
  consistHistory: CarConsistHistory[];
  detectorHistory: CarDetectorEvent[];
}

// ─── Car Registry ─────────────────────────────────────────────────────────────
export const CAR_REGISTRY: CarRecord[] = [
  // ── CN 7701 — Covered Hopper (appears in CN 5501 / Ruel) ─────────────────
  {
    carNumber: "CN 7701",
    reportingMark: "CN",
    carType: "Covered Hopper",
    builtYear: 2011,
    currentTrainId: "CN 5501",
    currentSubdivision: "Ruel",
    consistHistory: [
      { trainId: "CN 5501", leadLoco: "CN 3301", subdivision: "Ruel",   date: "2025-05-04", position: 3, loadedLbs: 263000, role: "car" },
      { trainId: "CN 4102", leadLoco: "CN 2201", subdivision: "Kingston", date: "2025-04-28", position: 4, loadedLbs: 263000, role: "car" },
      { trainId: "CN 3864", leadLoco: "CN 2743", subdivision: "Bala",   date: "2025-04-15", position: 5, loadedLbs: 258000, role: "car" },
      { trainId: "CN 8812", leadLoco: "CN 3001", subdivision: "Ruel",   date: "2025-03-31", position: 2, loadedLbs: 263000, role: "car" },
    ],
    detectorHistory: [
      { id: "dh-7701-1", date: "2025-05-04", time: "13:31", trainId: "CN 5501", subdivision: "Ruel",    milepost: 79.9, detectorName: "Multi-Detector Array MP 79.9", detectorType: "HBD", railroad: "CN", status: "healthy", value: "Max 118°F", summary: "All axles normal", flagged: false },
      { id: "dh-7701-2", date: "2025-05-04", time: "12:08", trainId: "CN 5501", subdivision: "Ruel",    milepost: 31.5, detectorName: "Multi-Detector Array MP 31.5", detectorType: "HBD", railroad: "CN", status: "healthy", value: "Max 112°F", summary: "All axles normal", flagged: false },
      { id: "dh-7701-3", date: "2025-04-28", time: "12:09", trainId: "CN 4102", subdivision: "Kingston", milepost: 128.3, detectorName: "Multi-Detector Array MP 128.3", detectorType: "HBD", railroad: "CN", status: "healthy", value: "Max 108°F", summary: "All axles normal", flagged: false },
      { id: "dh-7701-4", date: "2025-04-28", time: "09:28", trainId: "CN 4102", subdivision: "Kingston", milepost: 22.1, detectorName: "WIU MP 22.1", detectorType: "HBD", railroad: "CN", status: "healthy", value: "Max 104°F", summary: "All axles normal", flagged: false },
      // Foreign detector — BNSF territory
      { id: "dh-7701-5", date: "2025-04-15", time: "16:22", trainId: "CN 3864", subdivision: "Bala",    milepost: 88.0, detectorName: "BNSF HBD MP 88.0 (Bala Jct)", detectorType: "HBD", railroad: "BNSF", status: "healthy", value: "Max 121°F", summary: "Foreign detector — BNSF Bala Jct · All axles normal", flagged: false },
      { id: "dh-7701-6", date: "2025-03-31", time: "14:44", trainId: "CN 8812", subdivision: "Ruel",    milepost: 79.9, detectorName: "Multi-Detector Array MP 79.9", detectorType: "WILD", railroad: "CN", status: "healthy", value: "Max 41 kips", summary: "All wheels within limits", flagged: false },
    ],
  },

  // ── CSXT 4412 — Gondola (critical car — appears in CN 5501 / Ruel) ────────
  {
    carNumber: "CSXT 4412",
    reportingMark: "CSXT",
    carType: "Gondola",
    builtYear: 2008,
    currentTrainId: "CN 5501",
    currentSubdivision: "Ruel",
    consistHistory: [
      { trainId: "CN 5501", leadLoco: "CN 3301", subdivision: "Ruel",   date: "2025-05-04", position: 6, loadedLbs: 286000, role: "car" },
      { trainId: "CN 2211", leadLoco: "CN 2801", subdivision: "Ruel",   date: "2025-04-20", position: 4, loadedLbs: 286000, role: "car" },
      { trainId: "CN 4102", leadLoco: "CN 2201", subdivision: "Kingston", date: "2025-04-10", position: 7, loadedLbs: 280000, role: "car" },
    ],
    detectorHistory: [
      // CRITICAL event today
      { id: "dh-4412-1", date: "2025-05-04", time: "13:31", trainId: "CN 5501", subdivision: "Ruel",    milepost: 79.9, detectorName: "Multi-Detector Array MP 79.9", detectorType: "HBD", railroad: "CN", status: "critical", value: "Axle A2-L 231°F", summary: "CRITICAL — Axle A2-L 231°F exceeds 200°F alarm threshold · Crew notified", flagged: true },
      { id: "dh-4412-2", date: "2025-05-04", time: "13:31", trainId: "CN 5501", subdivision: "Ruel",    milepost: 79.9, detectorName: "Multi-Detector Array MP 79.9", detectorType: "ABD", railroad: "CN", status: "warning", value: "Score 78/100", summary: "Acoustic bearing signature elevated on Axle A2 — corroborates HBD reading", flagged: true },
      { id: "dh-4412-3", date: "2025-05-04", time: "12:08", trainId: "CN 5501", subdivision: "Ruel",    milepost: 31.5, detectorName: "Multi-Detector Array MP 31.5", detectorType: "HBD", railroad: "CN", status: "warning", value: "Axle A2-L 162°F", summary: "WARNING — Axle A2-L 162°F · Trending upward (was 141°F at MP 14.2)", flagged: true },
      { id: "dh-4412-4", date: "2025-05-04", time: "11:38", trainId: "CN 5501", subdivision: "Ruel",    milepost: 14.2, detectorName: "Multi-Detector Array MP 14.2", detectorType: "HBD", railroad: "CN", status: "healthy", value: "Axle A2-L 141°F", summary: "Axle A2-L slightly elevated but within limits · First reading this trip", flagged: false },
      // Previous consist — CSX territory (foreign detector)
      { id: "dh-4412-5", date: "2025-04-20", time: "09:14", trainId: "CN 2211", subdivision: "Ruel",    milepost: 31.5, detectorName: "Multi-Detector Array MP 31.5", detectorType: "HBD", railroad: "CN", status: "healthy", value: "Max 128°F", summary: "All axles normal in previous consist", flagged: false },
      { id: "dh-4412-6", date: "2025-04-10", time: "14:22", trainId: "CN 4102", subdivision: "Kingston", milepost: 128.3, detectorName: "CSX HBD MP 128.3 (Kingston Jct)", detectorType: "HBD", railroad: "CSX", status: "healthy", value: "Max 119°F", summary: "Foreign detector — CSX Kingston Jct · All axles normal", flagged: false },
    ],
  },

  // ── CSXT 4411 — Gondola (WILD anomaly — appears in CN 5501 / Ruel) ────────
  {
    carNumber: "CSXT 4411",
    reportingMark: "CSXT",
    carType: "Gondola",
    builtYear: 2008,
    currentTrainId: "CN 5501",
    currentSubdivision: "Ruel",
    consistHistory: [
      { trainId: "CN 5501", leadLoco: "CN 3301", subdivision: "Ruel",   date: "2025-05-04", position: 5, loadedLbs: 286000, role: "car" },
      { trainId: "CN 2211", leadLoco: "CN 2801", subdivision: "Ruel",   date: "2025-04-20", position: 3, loadedLbs: 286000, role: "car" },
    ],
    detectorHistory: [
      { id: "dh-4411-1", date: "2025-05-04", time: "13:31", trainId: "CN 5501", subdivision: "Ruel", milepost: 79.9, detectorName: "Multi-Detector Array MP 79.9", detectorType: "WILD", railroad: "CN", status: "critical", value: "142 kips", summary: "HIGH IMPACT — 142 kips exceeds 130 kips alarm threshold · Flagged for inspection at next yard", flagged: true },
      { id: "dh-4411-2", date: "2025-05-04", time: "12:08", trainId: "CN 5501", subdivision: "Ruel", milepost: 31.5, detectorName: "Multi-Detector Array MP 31.5", detectorType: "WILD", railroad: "CN", status: "healthy", value: "52 kips", summary: "Within limits at MP 31.5 · Impact load increased significantly by MP 79.9", flagged: false },
      { id: "dh-4411-3", date: "2025-04-20", time: "09:14", trainId: "CN 2211", subdivision: "Ruel", milepost: 31.5, detectorName: "Multi-Detector Array MP 31.5", detectorType: "WILD", railroad: "CN", status: "warning", value: "98 kips", summary: "WARNING — 98 kips in previous consist · Pattern of elevated impact loads", flagged: true },
    ],
  },

  // ── UP 8821 — Box Car (appears in CN 5501 / Ruel) ─────────────────────────
  {
    carNumber: "UP 8821",
    reportingMark: "UP",
    carType: "Box Car",
    builtYear: 2015,
    currentTrainId: "CN 5501",
    currentSubdivision: "Ruel",
    consistHistory: [
      { trainId: "CN 5501", leadLoco: "CN 3301", subdivision: "Ruel",   date: "2025-05-04", position: 7, loadedLbs: 263000, role: "car" },
      { trainId: "CN 7788", leadLoco: "CN 4401", subdivision: "Capreol", date: "2025-04-22", position: 5, loadedLbs: 255000, role: "car" },
    ],
    detectorHistory: [
      { id: "dh-8821-1", date: "2025-05-04", time: "13:31", trainId: "CN 5501", subdivision: "Ruel",    milepost: 79.9, detectorName: "Multi-Detector Array MP 79.9", detectorType: "HBD", railroad: "CN", status: "healthy", value: "Max 109°F", summary: "All axles normal", flagged: false },
      // Foreign detector — UP territory
      { id: "dh-8821-2", date: "2025-04-22", time: "11:08", trainId: "CN 7788", subdivision: "Capreol", milepost: 44.2, detectorName: "UP HBD MP 44.2 (Capreol Jct)", detectorType: "HBD", railroad: "UP", status: "healthy", value: "Max 115°F", summary: "Foreign detector — UP Capreol Jct · All axles normal", flagged: false },
    ],
  },

  // ── CN 9903 — Flat Car (DED anomaly — appears in CN 4102 / Kingston) ──────
  {
    carNumber: "CN 9903",
    reportingMark: "CN",
    carType: "Flat Car",
    builtYear: 2006,
    currentTrainId: "CN 4102",
    currentSubdivision: "Kingston",
    consistHistory: [
      { trainId: "CN 4102", leadLoco: "CN 2201", subdivision: "Kingston", date: "2025-05-04", position: 5, loadedLbs: 220000, role: "car" },
      { trainId: "CN 3864", leadLoco: "CN 2743", subdivision: "Bala",    date: "2025-04-30", position: 3, loadedLbs: 218000, role: "car" },
      { trainId: "CN 5501", leadLoco: "CN 3301", subdivision: "Ruel",    date: "2025-04-18", position: 6, loadedLbs: 222000, role: "car" },
    ],
    detectorHistory: [
      { id: "dh-9903-1", date: "2025-05-04", time: "12:09", trainId: "CN 4102", subdivision: "Kingston", milepost: 128.3, detectorName: "Multi-Detector Array MP 128.3", detectorType: "DED", railroad: "CN", status: "warning", value: "CONTACT", summary: "Dragging equipment contact detected · Crew notified · Inspection at next stop", flagged: true },
      { id: "dh-9903-2", date: "2025-04-30", time: "09:55", trainId: "CN 3864", subdivision: "Bala",    milepost: 44.5, detectorName: "Multi-Detector Array MP 44.5", detectorType: "DED", railroad: "CN", status: "healthy", value: "Clear", summary: "No dragging equipment detected", flagged: false },
      // Foreign detector — CP territory
      { id: "dh-9903-3", date: "2025-04-18", time: "15:30", trainId: "CN 5501", subdivision: "Ruel",    milepost: 50.0, detectorName: "CP DED MP 50.0 (Ruel Jct)", detectorType: "DED", railroad: "CP", status: "healthy", value: "Clear", summary: "Foreign detector — CP Ruel Jct · No dragging equipment", flagged: false },
    ],
  },

  // ── CN 6603 — Gondola (TPD anomaly — appears in CN 7788 / Capreol) ────────
  {
    carNumber: "CN 6603",
    reportingMark: "CN",
    carType: "Gondola",
    builtYear: 2013,
    currentTrainId: "CN 7788",
    currentSubdivision: "Capreol",
    consistHistory: [
      { trainId: "CN 7788", leadLoco: "CN 4401", subdivision: "Capreol", date: "2025-05-04", position: 4, loadedLbs: 275000, role: "car" },
      { trainId: "CN 6612", leadLoco: "CN 4201", subdivision: "Capreol", date: "2025-04-25", position: 6, loadedLbs: 271000, role: "car" },
      { trainId: "CN 3322", leadLoco: "CN 2401", subdivision: "Capreol", date: "2025-04-12", position: 3, loadedLbs: 278000, role: "car" },
    ],
    detectorHistory: [
      { id: "dh-6603-1", date: "2025-05-04", time: "08:28", trainId: "CN 7788", subdivision: "Capreol", milepost: 44.2, detectorName: "Multi-Detector Array MP 44.2", detectorType: "TPD", railroad: "CN", status: "warning", value: "Score 72/100", summary: "Truck instability score 72 — hunting detected · Monitor at next detector", flagged: true },
      { id: "dh-6603-2", date: "2025-04-25", time: "07:14", trainId: "CN 6612", subdivision: "Capreol", milepost: 44.2, detectorName: "Multi-Detector Array MP 44.2", detectorType: "TPD", railroad: "CN", status: "healthy", value: "Score 18/100", summary: "Truck performance normal", flagged: false },
      { id: "dh-6603-3", date: "2025-04-12", time: "14:55", trainId: "CN 3322", subdivision: "Capreol", milepost: 44.2, detectorName: "Multi-Detector Array MP 44.2", detectorType: "HBD", railroad: "CN", status: "warning", value: "Axle A1-R 172°F", summary: "WARNING — Axle A1-R 172°F · Monitored", flagged: true },
      // Foreign detector — NS territory
      { id: "dh-6603-4", date: "2025-04-12", time: "16:40", trainId: "CN 3322", subdivision: "Capreol", milepost: 200.0, detectorName: "NS HBD MP 200.0 (Capreol Jct)", detectorType: "HBD", railroad: "NS", status: "healthy", value: "Max 132°F", summary: "Foreign detector — NS Capreol Jct · All axles normal", flagged: false },
    ],
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────
export function getCarRecord(carNumber: string): CarRecord | undefined {
  return CAR_REGISTRY.find((c) => c.carNumber === carNumber);
}

export function getCarsByTrain(trainId: string): CarRecord[] {
  return CAR_REGISTRY.filter((c) => c.currentTrainId === trainId);
}

// Railroad label helpers
export const RAILROAD_LABELS: Record<string, string> = {
  CN: "CN Rail",
  CP: "Canadian Pacific",
  BNSF: "BNSF Railway",
  CSX: "CSX Transportation",
  UP: "Union Pacific",
  NS: "Norfolk Southern",
};

export const RAILROAD_COLORS: Record<string, string> = {
  CN: "#D22630",
  CP: "#C8102E",
  BNSF: "#F7941D",
  CSX: "#003087",
  UP: "#FFC72C",
  NS: "#003087",
};

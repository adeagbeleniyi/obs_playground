import { useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/components/Layout";
import {
  Bot, Trash2, Loader2, Plus, MessageSquare, Clock,
  Train, AlertTriangle, Activity, MapPin, ChevronRight, X, Send,
  Thermometer, Radio, Zap, Users, Package, BarChart2, Shield, Gauge,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { carDatabase, activeCrew } from "@/lib/crewCarData";
import { FLEET_SNAPSHOT, YARDS } from "@/lib/fleetData";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "user" | "assistant";
interface Message { role: Role; content: string; }
interface Session { key: string; messages: Message[]; updatedAt: Date; }

// ─── Forge API config ─────────────────────────────────────────────────────────
const FORGE_BASE_URL =
  (import.meta.env.VITE_FRONTEND_FORGE_API_URL as string | undefined) ||
  "https://forge.manus.im";
const FORGE_API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY as string | undefined;

// ─── Build system prompt from live fleet data ─────────────────────────────────
function buildSystemPrompt(): string {
  const now = new Date();

  // ── Car records ──
  const carLines = carDatabase.map(c => {
    const alarms = c.waysideReadings.filter(r => r.status !== "NORMAL");
    const alarmStr = alarms.length > 0
      ? alarms.map(r => `${r.detectorType} ${r.status} at ${r.location} (${r.reading})`).join("; ")
      : "all readings normal";
    const defects = c.defectFlags.filter(d => !d.resolved);
    const defectStr = defects.length > 0
      ? defects.map(d => `${d.severity}: ${d.description}`).join("; ")
      : "no open defects";
    const wildReadings = c.waysideReadings.filter(r => r.detectorType === "WILD").map(r => {
      const kips = parseInt(r.reading.match(/(\d+)\s*kips/i)?.[1] ?? "0");
      return `${kips}kips@${r.location}(${r.status})`;
    }).join(", ");
    const hbdReadings = c.waysideReadings.filter(r => r.detectorType === "HBD").map(r => `${r.reading}@${r.location}(${r.status})`).join(", ");
    return `${c.carNumber} | ${c.carType} | ${c.currentStatus} | ${c.currentLocation} | Train:${c.currentTrainId ?? "none"} | ${c.hazmat ? "HAZMAT " + c.hazmatClass : "no hazmat"} | WILD:[${wildReadings || "no readings"}] | HBD:[${hbdReadings || "no readings"}] | Defects:[${defectStr}]`;
  }).join("\n");

  // ── Active trains ──
  const trainLines = FLEET_SNAPSHOT.map(t => {
    const hosH = Math.floor(t.hosRemainingMin / 60);
    const hosM = t.hosRemainingMin % 60;
    const hosStr = t.hosRemainingMin <= 0 ? "HOS EXPIRED" : t.hosRemainingMin <= 60 ? `HOS CRITICAL ${hosH}h${hosM}m` : `HOS ${hosH}h${hosM}m`;
    return `${t.symbol} | ${t.state} | ${t.subdivision} Sub MP ${t.milepost} | ${t.speed}mph | ${t.cars}cars ${t.weight}t | PTC:${t.ptcState} | Alarms:${t.activeAlarms} | ${hosStr} | ${t.origin}→${t.destination} | Loco:${t.locos?.[0] ?? 'N/A'}`;
  }).join("\n");

  // ── Crew HOS ──
  const crewLines = activeCrew.map(c => {
    const hosH = Math.floor(c.hosRemainingMinutes / 60);
    const hosM = c.hosRemainingMinutes % 60;
    return `Train ${c.trainId} | ${c.subdivision} Sub MP ${c.currentMilepost} | ${c.hosStatus} | ${hosH}h${hosM}m remaining | Limit:${c.hosLimitHours}h | Crew:${c.members.map(m => m.name + "(" + m.role + ")").join(",")} | NextChange:${c.nextCrewChange.location} in ${c.nextCrewChange.distanceRemaining}mi`;
  }).join("\n");

  // ── Yards ──
  const yardLines = YARDS.map(y =>
    `${y.name} (${y.city}, ${y.subdivision} Sub) | ${y.currentCars}/${y.capacity} cars (${Math.round(y.currentCars / y.capacity * 100)}%) | ${y.currentLocos} locos | ${y.trainsInYard} trains | ${y.trainsArriving} arriving | ${y.trainsDeparting} departing`
  ).join("\n");

  // ── WILD summary (all cars above 50 kips) ──
  const wildAbove50 = carDatabase.flatMap(c =>
    c.waysideReadings
      .filter(r => r.detectorType === "WILD")
      .map(r => {
        const kips = parseInt(r.reading.match(/(\d+)\s*kips/i)?.[1] ?? "0");
        return kips >= 50 ? `${c.carNumber} | ${kips} kips | ${r.status} | ${r.location} (${r.subdivision} Sub) | ${r.timestamp}` : null;
      })
      .filter(Boolean)
  ).join("\n") || "No WILD readings above 50 kips in the dataset.";

  // ── HBD summary ──
  const hbdAlerts = carDatabase.flatMap(c =>
    c.waysideReadings
      .filter(r => r.detectorType === "HBD" && r.status !== "NORMAL")
      .map(r => `${c.carNumber} | ${r.status} | ${r.reading} | ${r.location} (${r.subdivision} Sub) | ${r.timestamp}`)
  ).join("\n") || "No HBD alerts in the dataset.";

  // ── HAZMAT cars ──
  const hazmatCars = carDatabase.filter(c => c.hazmat).map(c =>
    `${c.carNumber} | ${c.hazmatClass} | ${c.currentStatus} | ${c.currentLocation} | Train: ${c.currentTrainId ?? "not in consist"}`
  ).join("\n") || "No HAZMAT cars in the dataset.";

  // ── Cars with open defects ──
  const defectCars = carDatabase.filter(c => c.defectFlags.some(d => !d.resolved)).map(c => {
    const openDefects = c.defectFlags.filter(d => !d.resolved);
    return `${c.carNumber} | ${openDefects.map(d => `${d.severity}:${d.description}`).join("; ")}`;
  }).join("\n") || "No cars with open defects.";

  return `You are the CN Rail OT SPOG AI Assistant — an expert railway operations analyst embedded in CN Rail's Operational Technology Single Pane of Glass (SPOG) platform.

You have deep knowledge of CN Rail's OT systems: I-ETMS (Integrated Electronic Train Management System), PTC (Positive Train Control), wayside detectors (HBD, WILD, DED, AEI, TADS, WIM), COBRA radio system, KES (Key Event System), BOS (Back Office Server), OWL (Operations Workload Layer), CARMA (Car Management), yard operations, crew HOS (Hours of Service), and fleet management.

Current date/time: ${now.toISOString()} (Eastern Time)

═══════════════════════════════════════════════════════════════
DETECTOR THRESHOLDS (reference)
═══════════════════════════════════════════════════════════════
WILD (Wheel Impact Load Detector):
  ALARM  >100 kips — mandatory set-out, train must stop
  ALERT  70–100 kips — investigate at next terminal
  ELEVATED 50–70 kips — monitor, no mandatory action
  NORMAL <50 kips — routine

HBD (Hot Box Detector):
  ALARM  >60°C above ambient — mandatory set-out
  ALERT  40–60°C above ambient — investigate
  WATCH  20–40°C above ambient — monitor
  NORMAL <20°C above ambient

DED (Dragging Equipment Detector): Binary PASS/FAIL
AEI (Automatic Equipment Identification): RFID tag read confirmation
TADS (Truck Angle Detection System): Truck hunting / lateral instability
WIM (Weigh-in-Motion): Gross weight per axle in tons

PTC States: ACTIVE (normal), DEGRADED (partial), FAILED (no PTC protection)
HOS Limit: 12h for engineers/conductors, 10h for other crew

═══════════════════════════════════════════════════════════════
CAR DATABASE (${carDatabase.length} cars tracked)
═══════════════════════════════════════════════════════════════
${carLines}

═══════════════════════════════════════════════════════════════
WILD READINGS ≥50 KIPS (sub-threshold included)
═══════════════════════════════════════════════════════════════
${wildAbove50}

═══════════════════════════════════════════════════════════════
HBD ALERTS (non-normal readings only)
═══════════════════════════════════════════════════════════════
${hbdAlerts}

═══════════════════════════════════════════════════════════════
HAZMAT CARS IN FLEET
═══════════════════════════════════════════════════════════════
${hazmatCars}

═══════════════════════════════════════════════════════════════
CARS WITH OPEN DEFECTS
═══════════════════════════════════════════════════════════════
${defectCars}

═══════════════════════════════════════════════════════════════
ACTIVE TRAINS (${FLEET_SNAPSHOT.length} trains)
═══════════════════════════════════════════════════════════════
${trainLines}

═══════════════════════════════════════════════════════════════
CREW HOS STATUS (${activeCrew.length} active crews)
═══════════════════════════════════════════════════════════════
${crewLines}

═══════════════════════════════════════════════════════════════
YARDS (${YARDS.length} yards)
═══════════════════════════════════════════════════════════════
${yardLines}

═══════════════════════════════════════════════════════════════
SUBDIVISION CAR PASSAGE COUNTS — LAST 7 DAYS (AEI data)
═══════════════════════════════════════════════════════════════
Kingston Sub      | 847 cars | 312 unique | 18 trains | 4 defects detected (1 ALARM, 3 ELEVATED) | avg speed 52 mph
Edson Sub         | 623 cars | 241 unique | 14 trains | 2 defects detected | avg speed 48 mph
Montréal Sub      | 591 cars | 228 unique | 13 trains | 0 defects | avg speed 44 mph
Rivers Sub        | 412 cars | 187 unique | 9 trains  | 2 defects detected | avg speed 51 mph
Bala Sub          | 384 cars | 156 unique | 8 trains  | 2 defects detected | avg speed 47 mph
Ruel Sub          | 298 cars | 134 unique | 7 trains  | 1 defect detected | avg speed 43 mph
Oakville Sub      | 276 cars | 118 unique | 6 trains  | 0 defects | avg speed 55 mph
MacTier Sub       | 201 cars | 94 unique  | 5 trains  | 0 defects | avg speed 49 mph
Wainwright Sub    | 188 cars | 82 unique  | 4 trains  | 0 defects | avg speed 46 mph
Strathroy Sub     | 144 cars | 71 unique  | 3 trains  | 0 defects | avg speed 53 mph
Parry Sound Sub   | 132 cars | 58 unique  | 3 trains  | 1 defect detected | avg speed 41 mph
Walker Sub        | 119 cars | 52 unique  | 2 trains  | 0 defects | avg speed 50 mph
TOTAL: 4,215 car passages | 1,733 unique cars | 92 trains (last 7 days)

═══════════════════════════════════════════════════════════════
SYSTEM HEALTH STATUS
═══════════════════════════════════════════════════════════════
OWL (Operations Workload Layer): OPERATIONAL — last sync 2 min ago
CARMA (Car Management): OPERATIONAL — 1,412 locos online
COBRA (Radio System): WARNING — 2 repeater sites degraded (Jasper MP 112, Edson MP 88)
I-ETMS (Train Management): WARNING — 3 trains in degraded PTC mode
BOS (Back Office Server): OPERATIONAL — 99.2% uptime last 30 days
KES (Key Event System): OPERATIONAL
GCP (Grade Crossing Predictor): OPERATIONAL — 847 crossings monitored

═══════════════════════════════════════════════════════════════
RECENT SIGNIFICANT EVENTS (last 24h)
═══════════════════════════════════════════════════════════════
2026-05-14 09:41 | WILD ALARM | TTX 891204 Axle B1 | 118 kips | Kingston Sub MP 188 | Train Q11451-05 stopped for set-out
2026-05-14 08:23 | HBD ALERT  | BNSF 584291 | 47°C above ambient | Edson Sub MP 88 | Train M30151-05 continuing to MacMillan
2026-05-14 07:15 | PTC DEGRADED | Train L50251-05 | I-ETMS comm loss | Edson Sub MP 44 | Crew notified
2026-05-14 06:02 | COBRA DEGRADED | Jasper repeater site | Signal strength -87 dBm | Edson Sub MP 112
2026-05-14 05:30 | HOS WARNING | Train G87351-05 crew | 2h 15m remaining | Rivers Sub MP 71
2026-05-14 04:18 | WILD ELEVATED | CN 714823 Axle A2 | 63 kips | Bala Sub MP 34 | Below alert threshold, monitoring
2026-05-14 03:45 | DED FAIL | CN 412847 | Kingston Sub MP 155 | Train Q11451-05 — equipment inspected, cleared
2026-05-14 02:10 | YARD CAPACITY | MacMillan Yard | 89% capacity | 3 trains queued for classification
2026-05-13 23:55 | CREW CHANGE | Train M30151-05 | Symington Yard | New crew: J. Tremblay (Eng), M. Singh (Cond)
2026-05-13 22:30 | WILD ELEVATED | TTGX 298441 Axle C2 | 58 kips | Kingston Sub MP 201 | Monitoring

═══════════════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════════════
You can answer ANY operational question — fleet-wide, subdivision-level, per-car, per-train, or per-crew.

Always:
- Be specific and cite exact data points (car numbers, kips values, subdivision, milepost, timestamp)
- Distinguish between official alert thresholds and sub-threshold elevated readings
- Provide actionable insights and flag safety-critical items
- Respond in a professional railway operations tone
- Cross-reference data: e.g. if a car has a WILD alarm, check if it's in an active consist
- If asked about data not in the context, explain what data would normally be available and how to obtain it
- For trend questions, extrapolate from available data and note assumptions clearly`;
}

// ─── Suggested prompts (20+ detailed questions) ───────────────────────────────
const SUGGESTED_PROMPTS = [
  {
    category: "Wayside Detectors",
    icon: <Activity size={13} className="text-amber-400" />,
    label: "WILD above 50 kips",
    prompt: "List all cars with WILD readings above 50 kips in the last 7 days, including those below the 70-kip alert threshold. For each car, show the reading, location, subdivision, and whether it triggered a mandatory set-out.",
  },
  {
    category: "Wayside Detectors",
    icon: <Thermometer size={13} className="text-red-400" />,
    label: "HBD trending to alarm",
    prompt: "Are there any cars with HBD readings that are trending upward and approaching the 60°C alarm threshold? Which ones should I monitor closely?",
  },
  {
    category: "Wayside Detectors",
    icon: <AlertTriangle size={13} className="text-red-400" />,
    label: "All active alarms",
    prompt: "What are all the active ALARM and ALERT conditions across the network right now? Include car number, detector type, reading value, location, and which train the car is in.",
  },
  {
    category: "Wayside Detectors",
    icon: <Gauge size={13} className="text-orange-400" />,
    label: "Detector comparison by sub",
    prompt: "Compare the number of WILD and HBD detections across all subdivisions in the last 7 days. Which subdivision has the highest rate of elevated readings per car passage?",
  },
  {
    category: "Fleet & Cars",
    icon: <Train size={13} className="text-emerald-400" />,
    label: "Train status summary",
    prompt: "Give me a full status summary of all active trains on the network right now. Include train symbol, location, speed, car count, PTC state, active alarms, and HOS remaining.",
  },
  {
    category: "Fleet & Cars",
    icon: <Package size={13} className="text-yellow-400" />,
    label: "HAZMAT cars in consists",
    prompt: "Are there any HAZMAT cars currently in active train consists? For each one, tell me the car number, hazmat class, current train, location, and any open defects or wayside readings.",
  },
  {
    category: "Fleet & Cars",
    icon: <AlertTriangle size={13} className="text-amber-400" />,
    label: "Cars with open defects",
    prompt: "Which cars currently have open (unresolved) defects? List them by severity, describe the defect, and tell me if the car is currently in an active consist or set out.",
  },
  {
    category: "Fleet & Cars",
    icon: <BarChart2 size={13} className="text-blue-400" />,
    label: "Car CN 412847 full history",
    prompt: "Give me a complete operational profile for car CN 412847: current status, all wayside detector readings in the last 7 days, any open defects, which train it's in, and any incidents associated with it.",
  },
  {
    category: "Subdivisions",
    icon: <MapPin size={13} className="text-blue-400" />,
    label: "Kingston Sub traffic",
    prompt: "How many cars passed through Kingston Sub in the last week? Break it down by unique cars vs total passages, number of trains, and any defects detected. How does this compare to other subdivisions?",
  },
  {
    category: "Subdivisions",
    icon: <MapPin size={13} className="text-purple-400" />,
    label: "Busiest subdivision",
    prompt: "Which subdivision had the most car passages in the last 7 days? Which had the most defects detected? Is there a correlation between traffic volume and defect rate?",
  },
  {
    category: "Subdivisions",
    icon: <MapPin size={13} className="text-cyan-400" />,
    label: "Edson Sub health check",
    prompt: "Give me a full health check for Edson Sub: active trains, car passages this week, any WILD or HBD detections, COBRA radio status, and any PTC degradation events.",
  },
  {
    category: "Crew & HOS",
    icon: <Users size={13} className="text-orange-400" />,
    label: "Crews near HOS limit",
    prompt: "Which train crews are within 3 hours of their Hours of Service limit right now? For each, tell me the train symbol, current location, subdivision, time remaining, and where the next crew change is scheduled.",
  },
  {
    category: "Crew & HOS",
    icon: <Users size={13} className="text-red-400" />,
    label: "HOS expired or critical",
    prompt: "Are there any crews with expired or critically low HOS (less than 1 hour remaining)? What is the operational impact and what actions should be taken?",
  },
  {
    category: "Crew & HOS",
    icon: <Users size={13} className="text-emerald-400" />,
    label: "Crew change locations",
    prompt: "List all upcoming crew changes across the network in the next 4 hours. Include train symbol, current location, crew change location, distance remaining, and incoming crew details.",
  },
  {
    category: "Yards",
    icon: <MapPin size={13} className="text-indigo-400" />,
    label: "Yard capacity status",
    prompt: "What is the current capacity utilization across all yards? Which yards are approaching capacity (>80%)? How many trains are arriving vs departing at each yard right now?",
  },
  {
    category: "Yards",
    icon: <Train size={13} className="text-violet-400" />,
    label: "MacMillan Yard congestion",
    prompt: "Is MacMillan Yard experiencing congestion? How many trains are currently in yard, arriving, and departing? What is the car and locomotive count vs capacity?",
  },
  {
    category: "Systems",
    icon: <Radio size={13} className="text-amber-400" />,
    label: "COBRA radio degradation",
    prompt: "Tell me about the current COBRA radio system degradation. Which repeater sites are affected, what is the signal strength, and which trains or subdivisions are impacted by the coverage gap?",
  },
  {
    category: "Systems",
    icon: <Shield size={13} className="text-red-400" />,
    label: "PTC degraded trains",
    prompt: "Which trains are currently operating in degraded PTC mode? What caused the degradation, what are the operational restrictions, and what is the risk level?",
  },
  {
    category: "Systems",
    icon: <Zap size={13} className="text-emerald-400" />,
    label: "System health overview",
    prompt: "Give me a full system health overview: OWL, CARMA, COBRA, I-ETMS, BOS, KES, and GCP. For any degraded systems, explain the impact on operations.",
  },
  {
    category: "Analytics",
    icon: <BarChart2 size={13} className="text-blue-400" />,
    label: "Network risk assessment",
    prompt: "Based on all current data — active alarms, PTC degradation, HOS status, yard capacity, and COBRA coverage — what are the top 5 operational risks on the network right now? Rank them by severity.",
  },
  {
    category: "Analytics",
    icon: <Activity size={13} className="text-purple-400" />,
    label: "Cars needing attention",
    prompt: "Which cars in the fleet need immediate attention or monitoring? Consider WILD readings above 50 kips, HBD alerts, open defects, and any recent incidents. Prioritize by risk level.",
  },
  {
    category: "Analytics",
    icon: <Train size={13} className="text-cyan-400" />,
    label: "Trains with multiple issues",
    prompt: "Are there any trains currently carrying cars with multiple issues (e.g., both a WILD reading above 50 kips AND an open defect, or a HAZMAT car AND a wayside alert)? List them with full details.",
  },
];

// Group prompts by category
const PROMPT_CATEGORIES = Array.from(new Set(SUGGESTED_PROMPTS.map(p => p.category)));

// ─── LLM call (direct from browser) ──────────────────────────────────────────
async function callLLM(messages: { role: string; content: string }[]): Promise<string> {
  const endpoint = `${FORGE_BASE_URL}/v1/chat/completions`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (FORGE_API_KEY) headers["Authorization"] = `Bearer ${FORGE_API_KEY}`;

  const resp = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages,
      max_tokens: 4096,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`LLM API error (${resp.status}). Please check that VITE_FRONTEND_FORGE_API_KEY is set in your Vercel environment variables.`);
  }

  const data = await resp.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "No response received. Please try again.";
}

// ─── Session sidebar item ─────────────────────────────────────────────────────
function SessionItem({
  sessionKey, preview, updatedAt, isActive, onClick,
}: {
  sessionKey: string; preview: string; updatedAt: Date; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded transition-colors group ${
        isActive ? "bg-[#D22630]/10 border border-[#D22630]/30" : "hover:bg-accent border border-transparent"
      }`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <MessageSquare size={11} className={isActive ? "text-[#D22630]" : "text-muted-foreground"} />
        <span className={`text-xs font-medium truncate ${isActive ? "text-[#D22630]" : "text-foreground"}`}>
          {sessionKey === "general" ? "General" : sessionKey}
        </span>
      </div>
      {preview && (
        <div className="text-[11px] text-muted-foreground truncate pl-4">{preview}</div>
      )}
      <div className="flex items-center gap-1 pl-4 mt-0.5">
        <Clock size={9} className="text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">
          {new Date(updatedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
        </span>
      </div>
    </button>
  );
}

// ─── Fleet context panel ──────────────────────────────────────────────────────
function FleetContextPanel() {
  const alarmCars = carDatabase.filter(c => c.waysideReadings.some(r => r.status !== "NORMAL"));
  const wildAbove50 = carDatabase.flatMap(c =>
    c.waysideReadings
      .filter(r => r.detectorType === "WILD")
      .map(r => {
        const kips = parseInt(r.reading.match(/(\d+)\s*kips/i)?.[1] ?? "0");
        return kips >= 50 ? { car: c.carNumber, kips, status: r.status, sub: r.subdivision } : null;
      })
      .filter(Boolean)
  ) as { car: string; kips: number; status: string; sub: string }[];
  wildAbove50.sort((a, b) => b.kips - a.kips);

  const criticalCrew = activeCrew.filter(c => c.hosStatus === "CRITICAL" || c.hosStatus === "WARNING");
  const movingTrains = FLEET_SNAPSHOT.filter(t => t.state === "EN_ROUTE_MOVING");
  const hazmatCars = carDatabase.filter(c => c.hazmat);
  const openDefectCars = carDatabase.filter(c => c.defectFlags.some(d => !d.resolved));

  return (
    <div className="space-y-5 p-4 text-sm">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Active Trains", value: FLEET_SNAPSHOT.length, color: "text-emerald-400" },
          { label: "Active Alarms", value: alarmCars.length, color: alarmCars.length > 0 ? "text-red-400" : "text-emerald-400" },
          { label: "WILD ≥50kips", value: wildAbove50.length, color: wildAbove50.length > 0 ? "text-amber-400" : "text-emerald-400" },
          { label: "HOS Alerts", value: criticalCrew.length, color: criticalCrew.length > 0 ? "text-orange-400" : "text-emerald-400" },
          { label: "HAZMAT Cars", value: hazmatCars.length, color: "text-yellow-400" },
          { label: "Open Defects", value: openDefectCars.length, color: openDefectCars.length > 0 ? "text-amber-400" : "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="bg-muted/30 rounded p-2 text-center">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active Alarms */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Active Alarms</div>
        <div className="space-y-1.5">
          {alarmCars.slice(0, 5).map(c => {
            const alarm = c.waysideReadings.find(r => r.status !== "NORMAL")!;
            return (
              <div key={c.carNumber} className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-foreground">{c.carNumber}</div>
                  <div className="text-[11px] text-muted-foreground">{alarm.detectorType} · {alarm.subdivision} Sub</div>
                </div>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 border-0 flex-shrink-0 ${
                  alarm.status === "ALARM" ? "bg-red-500/15 text-red-400" :
                  alarm.status === "ALERT" ? "bg-amber-500/15 text-amber-400" :
                  "bg-blue-500/15 text-blue-400"
                }`}>{alarm.status}</Badge>
              </div>
            );
          })}
          {alarmCars.length === 0 && <div className="text-[11px] text-emerald-400">All clear</div>}
          {alarmCars.length > 5 && <div className="text-[11px] text-muted-foreground">+{alarmCars.length - 5} more</div>}
        </div>
      </div>

      {/* WILD above 50 kips */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">WILD ≥50 kips</div>
        <div className="space-y-1">
          {wildAbove50.slice(0, 6).map(r => (
            <div key={r.car} className="flex items-center justify-between">
              <span className="font-mono text-xs text-foreground">{r.car}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{r.kips}k</span>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 border-0 ${
                  r.status === "ALARM" ? "bg-red-500/15 text-red-400" :
                  r.status === "ALERT" ? "bg-amber-500/15 text-amber-400" :
                  "bg-blue-500/15 text-blue-400"
                }`}>{r.status}</Badge>
              </div>
            </div>
          ))}
          {wildAbove50.length === 0 && <div className="text-[11px] text-muted-foreground">None</div>}
          {wildAbove50.length > 6 && <div className="text-[11px] text-muted-foreground">+{wildAbove50.length - 6} more</div>}
        </div>
      </div>

      {/* Active Trains */}
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Active Trains</div>
        <div className="space-y-1">
          {movingTrains.slice(0, 5).map(t => {
            const hosH = Math.floor(t.hosRemainingMin / 60);
            const hosM = t.hosRemainingMin % 60;
            const hosColor = t.hosRemainingMin <= 60 ? "text-red-400" : t.hosRemainingMin <= 120 ? "text-amber-400" : "text-muted-foreground";
            return (
              <div key={t.symbol} className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-foreground">{t.symbol}</div>
                  <div className="text-[10px] text-muted-foreground">{t.subdivision} · {t.speed} mph</div>
                </div>
                <div className="text-right">
                  {t.activeAlarms > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 border-0 bg-red-500/15 text-red-400">{t.activeAlarms} ALM</Badge>}
                  <div className={`text-[10px] ${hosColor}`}>{hosH}h{hosM}m</div>
                </div>
              </div>
            );
          })}
          {movingTrains.length > 5 && <div className="text-[11px] text-muted-foreground">+{movingTrains.length - 5} more</div>}
        </div>
      </div>

      {/* HOS Alerts */}
      {criticalCrew.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">HOS Alerts</div>
          <div className="space-y-1">
            {criticalCrew.map(c => {
              const hosH = Math.floor(c.hosRemainingMinutes / 60);
              const hosM = c.hosRemainingMinutes % 60;
              return (
                <div key={c.crewId} className="flex items-center justify-between">
                  <span className="font-mono text-xs text-foreground">{c.trainId}</span>
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 border-0 ${
                    c.hosStatus === "CRITICAL" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                  }`}>{hosH}h{hosM}m</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HAZMAT */}
      {hazmatCars.length > 0 && (
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">HAZMAT Cars</div>
          <div className="space-y-1">
            {hazmatCars.slice(0, 4).map(c => (
              <div key={c.carNumber} className="flex items-center justify-between">
                <span className="font-mono text-xs text-foreground">{c.carNumber}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-0 bg-yellow-500/15 text-yellow-400">{c.hazmatClass}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Chat message bubble ──────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center ${
        isUser ? "bg-[#D22630]/10" : "bg-muted"
      }`}>
        {isUser ? <span className="text-[10px] text-[#D22630] font-bold">YOU</span> : <Bot size={14} className="text-muted-foreground" />}
      </div>
      <div className={`max-w-[75%] px-3.5 py-2.5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? "bg-[#D22630]/10 text-foreground rounded-tr-none"
          : "bg-muted text-foreground rounded-tl-none"
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [sessions, setSessions] = useState<Session[]>([
    { key: "general", messages: [], updatedAt: new Date() },
  ]);
  const [activeKey, setActiveKey] = useState("general");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newSessionInput, setNewSessionInput] = useState("");
  const [showNewSession, setShowNewSession] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(PROMPT_CATEGORIES[0]);
  const newSessionRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const systemPrompt = useMemo(() => buildSystemPrompt(), []);
  const activeSession = sessions.find(s => s.key === activeKey) ?? sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession.messages, isLoading]);

  useEffect(() => {
    if (showNewSession) newSessionRef.current?.focus();
  }, [showNewSession]);

  function handleSwitchSession(key: string) {
    setActiveKey(key);
  }

  function handleNewSession() {
    const key = newSessionInput.trim() || "general";
    if (!sessions.find(s => s.key === key)) {
      setSessions(prev => [...prev, { key, messages: [], updatedAt: new Date() }]);
    }
    setActiveKey(key);
    setNewSessionInput("");
    setShowNewSession(false);
  }

  async function handleSendMessage(content: string) {
    if (!content.trim() || isLoading) return;
    setInput("");

    const userMsg: Message = { role: "user", content };

    setSessions(prev => prev.map(s =>
      s.key === activeKey
        ? { ...s, messages: [...s.messages, userMsg], updatedAt: new Date() }
        : s
    ));

    setIsLoading(true);
    try {
      const history = [...activeSession.messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const llmMessages = [
        { role: "system", content: systemPrompt },
        ...history,
      ];

      const reply = await callLLM(llmMessages);
      const assistantMsg: Message = { role: "assistant", content: reply };

      setSessions(prev => prev.map(s =>
        s.key === activeKey
          ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: new Date() }
          : s
      ));
    } catch (err) {
      const errMsg: Message = {
        role: "assistant",
        content: `⚠️ ${err instanceof Error ? err.message : "Unknown error. Please try again."}`,
      };
      setSessions(prev => prev.map(s =>
        s.key === activeKey ? { ...s, messages: [...s.messages, errMsg] } : s
      ));
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setSessions(prev => prev.map(s =>
      s.key === activeKey ? { ...s, messages: [], updatedAt: new Date() } : s
    ));
  }

  const filteredPrompts = SUGGESTED_PROMPTS.filter(p => p.category === activeCategory);

  return (
    <Layout>
      <div className="flex h-full overflow-hidden">

        {/* ── Left: Session Sidebar ─────────────────────────────────────────── */}
        <div className="w-52 flex-shrink-0 border-r border-border flex flex-col bg-card/30">
          <div className="px-3 pt-4 pb-2 border-b border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Conversations</span>
            <button
              onClick={() => setShowNewSession(v => !v)}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="New conversation"
            >
              {showNewSession ? <X size={13} /> : <Plus size={13} />}
            </button>
          </div>

          {showNewSession && (
            <div className="px-3 py-2 border-b border-border">
              <input
                ref={newSessionRef}
                type="text"
                value={newSessionInput}
                onChange={e => setNewSessionInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleNewSession(); if (e.key === "Escape") setShowNewSession(false); }}
                placeholder="Topic or car # (optional)"
                className="w-full h-7 px-2 text-xs rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#D22630]/50"
              />
              <button
                onClick={handleNewSession}
                className="mt-1.5 w-full text-xs text-center py-1 rounded bg-[#D22630]/10 hover:bg-[#D22630]/20 text-[#D22630] transition-colors"
              >
                Start conversation
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(s => (
              <SessionItem
                key={s.key}
                sessionKey={s.key}
                preview={s.messages.filter(m => m.role === "user").slice(-1)[0]?.content.slice(0, 60) ?? "Ask anything about the network"}
                updatedAt={s.updatedAt}
                isActive={activeKey === s.key}
                onClick={() => handleSwitchSession(s.key)}
              />
            ))}
          </div>
        </div>

        {/* ── Center: Chat ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Chat header */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#D22630]/10 rounded flex items-center justify-center">
                <Bot size={15} className="text-[#D22630]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  OT Intelligence Assistant
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {activeKey === "general" ? "General operational queries" : `Session: ${activeKey}`} · {carDatabase.length} cars · {FLEET_SNAPSHOT.length} trains · {YARDS.length} yards
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeKey !== "general" && (
                <Badge variant="outline" className="font-mono text-xs border-[#D22630]/40 text-[#D22630]">
                  {activeKey}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5 text-xs h-7"
                onClick={handleClear}
                disabled={activeSession.messages.length === 0}
              >
                <Trash2 size={12} />
                Clear
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
            {activeSession.messages.length === 0 && (
              <div className="flex flex-col items-start gap-4 h-full">
                <div className="w-full text-center pt-6">
                  <div className="w-12 h-12 bg-[#D22630]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bot size={22} className="text-[#D22630]" />
                  </div>
                  <div className="text-sm font-medium text-foreground mb-1">Ask me anything about the CN Rail OT network</div>
                  <div className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Fleet alarms, subdivision traffic, car readings, crew HOS, train status, HAZMAT cars, system health, and more.
                  </div>
                </div>

                {/* Category tabs */}
                <div className="w-full">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {PROMPT_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                          activeCategory === cat
                            ? "bg-[#D22630]/15 text-[#D22630] border border-[#D22630]/30"
                            : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Prompt chips for active category */}
                  <div className="flex flex-col gap-2">
                    {filteredPrompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(p.prompt)}
                        className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-border hover:bg-accent hover:border-[#D22630]/30 text-left transition-colors group"
                      >
                        <div className="flex-shrink-0 mt-0.5">{p.icon}</div>
                        <div>
                          <div className="text-xs font-medium text-foreground group-hover:text-[#D22630] transition-colors">{p.label}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.prompt}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSession.messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded bg-muted flex items-center justify-center">
                  <Bot size={14} className="text-muted-foreground" />
                </div>
                <div className="bg-muted rounded-lg rounded-tl-none px-3.5 py-2.5 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Analyzing fleet data…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-border">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(input);
                  }
                }}
                placeholder="Ask anything — car readings, subdivision traffic, fleet alarms, crew status, system health…"
                rows={1}
                className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#D22630]/50 min-h-[38px] max-h-32"
                style={{ lineHeight: "1.5" }}
              />
              <Button
                size="sm"
                className="h-[38px] w-[38px] p-0 bg-[#D22630] hover:bg-[#B01E28] flex-shrink-0"
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </Button>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Press Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>

        {/* ── Right: Fleet Context Panel ────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-l border-border overflow-y-auto bg-card/30">
          <div className="px-4 pt-4 pb-2 border-b border-border flex items-center justify-between">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Live Context</div>
            <ChevronRight size={12} className="text-muted-foreground" />
          </div>
          <FleetContextPanel />
        </div>
      </div>
    </Layout>
  );
}

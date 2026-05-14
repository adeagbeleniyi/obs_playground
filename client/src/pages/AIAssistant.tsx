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
interface RcaLayer {
  what: string;
  where: string;
  why: string;
  blastRadius: string;
  actions: string;
}
interface Message { role: Role; content: string; rca?: RcaLayer; }
interface Session { key: string; messages: Message[]; updatedAt: Date; label?: string; }

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
AAR WAYSIDE DETECTOR RULES (AAR Manual of Standards & Field Manual)
═══════════════════════════════════════════════════════════════

── AAR FIELD MANUAL RULE 41 — WILD (Wheel Impact Load Detector) ──
WILD measures dynamic wheel-rail impact force in kips (1 kip = 1,000 lbf).
  ELEVATED  50–64 kips  — No mandatory action. Car owner notified. Monitor at next detector.
  ALERT     65–89 kips  — Car MUST be set out at next yard stop for wheel inspection.
  ALARM     ≥90 kips    — MANDATORY IMMEDIATE SET-OUT. Train must stop. Car removed from consist.
Note: A car progressing 58→72→96 kips across consecutive detectors indicates a developing flat spot.

── AAR S-6001 — HBD (Hot Box Detector) K-VALUE RULES ──
K-values are statistical outlier indicators. Two K-values are computed:
  Kt (Train-side K-value): Kt = (Tb − Q3_t) / (Q3_t − Q1_t)
    where Tb = bearing temperature, Q3_t/Q1_t = 3rd/1st quartile of ALL bearings on that train side.
    Denominator minimum = 12.5°F.
  Ke (Equipment K-value): Ke = (Kt − Q3_e) / (Q3_e − Q1_e)
    using all bearings on that equipment (car) as a basis.

WM51 — Mandatory Set-Out (any ONE of three conditions):
  §4.1.1: Kt > 3.5 AND Ke > 2 AND bearing is ≥50°F hotter than any other bearing on the car.
  §4.1.2: Kt > 3.5 AND second hottest bearing Kt < 45% of this bearing's Kt.
  §4.1.3: 3 HBD passings within a rolling 240-hour window where:
          — Pass A: Kt ≥ 4.0, temp ≥95°F above ambient, Ke ≥ 2 (primary condition)
          — Pass B & C: Kt ≥ 1.5, Ke ≥ 2 (can occur in any order relative to Pass A)

WM52 — Alert / Monitor Closely:
  §4.2.1: Kt > 1.7 AND (Ke > 2 OR second hottest bearing Kt < 45%) AND TADS defect rank ≥ 2.

Absolute temperature thresholds (above ambient):
  NORMAL    <40°F above ambient
  ELEVATED  40–59°F above ambient — monitor, notify owner
  ALERT     60–94°F above ambient — set out at next yard
  ALARM     ≥95°F above ambient   — mandatory immediate set-out
  CRITICAL  ≥200°F above ambient  — train must stop immediately

── AAR S-6000 — ABD/TADS (Acoustic Bearing Detector / Truck Angle Detection System) ──
TADS Defect Ranks:
  Rank 0: No defect
  Rank 1: Minor anomaly — monitor
  Rank 2: Moderate defect — flag for WM52 evaluation
  Rank 3: Significant defect — mandatory set-out at next yard
  Rank 4: Critical defect — immediate set-out required

S-6000 Level-1 Indications (mandatory removal):
  — Total spalled/water-etched area ≥1.5 in² on any one cup or cone running surface
  — Total spalled/water-etched area ≥1.0 in² on one surface AND any spalled area on another
  — Any area of orange peel surface
  — Loose component: cone backface wear >0.010 in, turning on journal, oversize cone bore

── DED (Dragging Equipment Detector) ──
  Level 1 (Warning): Object detected above rail head clearance — proceed at restricted speed to next inspection point.
  Level 2 (Alarm):   Object at or below rail head level — train must STOP immediately. Full inspection required.
  Level 3 (Emergency): Multiple sensors triggered — emergency stop, emergency response protocol.
Common causes: broken brake rigging, loose chains, bent grab irons, dragging brake shoes.

── WDD (Wheel Defect Detector) — Flat Wheel ──
  <1/16 in: Normal
  1/16–1/8 in: Monitor (notify owner)
  >1/8 in: Set out at next yard for wheel shop
  >1/4 in (compound flat): Mandatory immediate set-out

── WIM (Weigh-in-Motion) ──
  Single axle load limit: 33 tons (66,000 lbs)
  Gross car weight limit: 263,000 lbs (loaded) — varies by car type and track class
  Overweight cars must be weighed and adjusted at next yard.

── AEI (Automatic Equipment Identification) ──
  RFID tag read confirmation. Tracks car identity, position, and consist membership.
  Failed reads indicate damaged/missing AEI tag — car must be visually identified.

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
2026-05-14 10:55 | DED LEVEL 2 ALARM | UP 448812 (HAZMAT Class 3 Ethanol) | Edson Sub MP 112.8 | Dragging brake rigging at rail head level. Train L50251-05 stopped. Emergency response activated. Car set out.
2026-05-14 10:30 | HBD WM51 ALARM §4.1.1 | CN 448821 | Kingston Sub MP 100.4 | Kt=4.8, Ke=3.2, bearing 118°F above ambient (62°F hotter than next hottest). Mandatory set-out. Car pulled from Q11451-05.
2026-05-14 09:15 | HBD WM51 ALARM §4.1.3 | CSXT 8812 | Rivers Sub MP 44.1 | 3-pass rolling window triggered. Kt=4.2, Ke=2.1, temp 98°F above ambient. Mandatory set-out at Symington.
2026-05-14 08:55 | TADS/ABD RANK 4 ALARM | TTX 228841 | Edson Sub MP 80.2 | S-6000 Level-1: orange peel surface + 2.1 in² spalling. Immediate set-out. Car pulled from L50150-04 at Walker.
2026-05-14 08:23 | HBD WM52 ALERT §4.2.1 | CP 884412 | Wainwright Sub MP 88.0 | Kt=2.2, Ke=2.6, TADS rank 2. Car flagged for set-out at Biggar, SK. Owner notified.
2026-05-14 07:15 | PTC DEGRADED | Train L50251-05 | I-ETMS comm loss | Edson Sub MP 44 | Crew notified
2026-05-14 06:02 | COBRA DEGRADED | Jasper repeater site | Signal strength -87 dBm | Edson Sub MP 112
2026-05-14 05:30 | HOS WARNING | Train G87351-05 crew | 2h 15m remaining | Rivers Sub MP 71
2026-05-13 21:44 | WILD RULE 41 ALARM | BNSF 771204 Axle B2-Left | 96 kips | Capreol Sub MP 178.4 | Exceeds 90 kip immediate set-out threshold. Train P33151-05 stopped. Progressive: 58→72→96 kips.
2026-05-14 13:55 | WILD RULE 41 ALERT | NS 441204 Axle A1-Left | 74 kips | Bala Sub MP 60.0 | 65–89 kip range. Set-out at Capreol ordered. Car continuing under monitoring.
2026-05-14 12:55 | HBD WM51 ALARM §4.1.2 | CN 882341 | Ruel Sub MP 200.0 | Kt=4.1, second hottest bearing Kt=1.7 (41%, below 45% threshold). Mandatory set-out at Chapleau.
2026-05-14 12:10 | WIM ALERT | CN 334812 | Kingston Sub MP 50.1 | Axle 3 load 36.8 tons (exceeds 33-ton limit). Owner notified. Proceed to Taschereau for weight verification.
2026-05-14 04:18 | WILD ELEVATED | CN 558412 Axle B1-Right | 62 kips | Edson Sub MP 80.2 | Rule 41 ELEVATED (50–64 kips). No mandatory action. Owner notified. Monitoring.

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

// ─── Pre-seeded chat sessions ────────────────────────────────────────────────
const SEEDED_SESSIONS: Session[] = [
  {
    key: "BNSF-771204-WILD",
    label: "BNSF 771204 — WILD 96 kips",
    updatedAt: new Date("2026-05-13T21:50:00"),
    messages: [
      { role: "user", content: "BNSF 771204 just triggered a Rule 41 ALARM at Capreol Sub MP 178.4 — 96 kips. What are the mandatory actions?" },
      {
        role: "assistant",
        content: `BNSF 771204 has triggered a **Rule 41 ALARM** (≥90 kips) — mandatory immediate set-out required.

**Reading:** Axle B2-Left, 96 kips at Capreol Sub MP 178.4 (2026-05-13 21:44)
**Progressive pattern:** 58 kips → 72 kips → 96 kips — developing flat spot or wheel defect.

**Mandatory Actions (AAR Field Manual Rule 41):**
1. Train P33151-05 must STOP immediately.
2. Car BNSF 771204 must be removed from the consist.
3. Notify car owner (BNSF) via AEI/CARMA.
4. Wheel shop inspection required — suspected compound flat spot.
5. Document all three WILD readings in KES for AAR reporting.`,
        rca: {
          what: "WILD Rule 41 ALARM: Axle B2-Left recorded 96 kips at Capreol Sub MP 178.4. Exceeds the 90-kip mandatory immediate set-out threshold.",
          where: "Capreol Sub MP 178.4 — WILD detector site. Train P33151-05 en route. Nearest set-out: Capreol yard (MP 181).",
          why: "Progressive flat spot development: 58 kips → 72 kips → 96 kips. Each wheel rotation over the flat spot generates increasing impact force. Root cause: likely brake lock-up or wheel slide event during prior operation.",
          blastRadius: "Train P33151-05 stopped on main line. 4 trains behind on Capreol Sub affected. Capreol yard notified for emergency set-out. BNSF car owner notified. KES event created.",
          actions: "1. Stop train immediately. 2. Set out BNSF 771204 at Capreol yard. 3. Wheel shop inspection — measure flat depth (>1/4 in = compound flat, immediate condemn). 4. File AAR Rule 41 report. 5. Resume P33151-05 after car removal.",
        },
      },
      { role: "user", content: "Is this car carrying any HAZMAT? And what is the wheel shop procedure for a compound flat?" },
      {
        role: "assistant",
        content: `**HAZMAT Status:** BNSF 771204 is a standard boxcar — no HAZMAT designation. This simplifies the set-out procedure.

**Wheel Shop Procedure for Compound Flat (>1/4 in depth):**
1. Measure flat depth using a wheel flat gauge at the set-out track.
2. If depth ≥1/4 in: Condemn wheel — car must not move under its own weight.
3. If depth 1/8–1/4 in: Set out at next wheel shop, max 30 mph transit speed.
4. Wheel shop: Turn wheel on wheel lathe to remove flat. Verify diameter within AAR condemning limits.
5. Re-inspection: After truing, re-measure tread depth and flange thickness before returning to service.

Given the 96-kip reading and progressive pattern, expect the flat depth to be in the compound range (>1/4 in). The car should be condemned pending wheel shop measurement.`,
      },
    ],
  },
  {
    key: "UP-448812-DED",
    label: "UP 448812 — DED Level 2 HAZMAT",
    updatedAt: new Date("2026-05-14T11:05:00"),
    messages: [
      { role: "user", content: "UP 448812 triggered a DED Level 2 alarm on Edson Sub. It is a HAZMAT Class 3 Ethanol car. What is the emergency protocol?" },
      {
        role: "assistant",
        content: `This is a critical event — DED Level 2 with HAZMAT Class 3 (Flammable Liquid — Ethanol) requires full emergency response.

**Event Details:**
Car UP 448812 | Class 3 Ethanol | Edson Sub MP 112.8 | Train L50251-05
DED Level 2: Object detected at or below rail head level — dragging brake rigging confirmed.

**Mandatory Actions:**
1. STOP TRAIN IMMEDIATELY — do not move until full inspection complete.
2. Notify RTC and dispatcher — flag Edson Sub MP 112.8 as emergency restriction.
3. Contact emergency response — Class 3 Ethanol requires HAZMAT team standby (spark/ignition risk).
4. Full under-car inspection of UP 448812 — identify and secure dragging component.
5. Inspect adjacent cars for secondary damage.
6. Do not move car until dragging equipment is secured or removed.
7. File KES event, notify CN HAZMAT coordinator, notify UP (car owner).`,
        rca: {
          what: "DED Level 2 ALARM: Dragging equipment detected at rail head level on UP 448812 (HAZMAT Class 3 Ethanol). Train L50251-05 stopped at Edson Sub MP 112.8.",
          where: "Edson Sub MP 112.8 — DED sensor site. Train L50251-05 (64 cars, mixed manifest). Nearest yard: Edson (MP 118).",
          why: "Dragging brake rigging — likely a broken brake rod or disconnected brake beam. Root cause: mechanical failure of brake rigging assembly, possibly from prior hard braking event or fatigue fracture.",
          blastRadius: "Train L50251-05 stopped on main line. Edson Sub blocked. 2 following trains held. HAZMAT Class 3 Ethanol car — emergency response team activated. PTC already in degraded mode on this train.",
          actions: "1. Stop train, set handbrakes. 2. Full under-car inspection of UP 448812. 3. HAZMAT team standby. 4. Secure/remove dragging equipment. 5. Inspect adjacent 3 cars. 6. Set out UP 448812 at Edson yard. 7. File KES + AAR DED report. 8. Resume L50251-05 after clearance.",
        },
      },
      { role: "user", content: "The inspection found a broken brake beam. Can the train continue after removing the car?" },
      {
        role: "assistant",
        content: `Yes, the train can continue after UP 448812 is set out — provided the following conditions are met:

**Post-Removal Checklist:**
1. UP 448812 successfully set out at Edson yard — car secured, handbrakes applied.
2. Adjacent cars inspected — no secondary damage to brake rigging.
3. Brake test performed on L50251-05 consist after car removal (required after any consist change).
4. HAZMAT coordinator confirms no spill/leak — Ethanol tank integrity verified.
5. DED sensor site cleared — no debris on rail from the broken brake beam.

**Broken Brake Beam Disposition:**
The car must be shopped for: full brake rigging inspection, brake beam replacement, wheel inspection, and return-to-service certification.

**Note on PTC:** L50251-05 is in degraded PTC mode. After resuming, crew must operate under PTC degraded procedures until PTC is restored.

**Estimated delay:** ~3.5 hours total (set-out, inspection, brake test, clearance).`,
      },
    ],
  },
  {
    key: "CN-448821-HBD",
    label: "CN 448821 — HBD WM51 §4.1.1",
    updatedAt: new Date("2026-05-14T10:45:00"),
    messages: [
      { role: "user", content: "Explain the WM51 §4.1.1 alarm on CN 448821. What do the K-values mean and why is this a mandatory set-out?" },
      {
        role: "assistant",
        content: `CN 448821 — HBD WM51 §4.1.1 Qualifying Indication

Reading: Kingston Sub MP 100.4 | 2026-05-14 10:30 | Train Q11451-05
Kt = 4.8, Ke = 3.2, bearing temperature 118°F above ambient

**What the K-values mean:**

Kt (Train-side K-value) = 4.8
Kt measures how far this bearing's temperature is from the statistical center of all bearings on the same side of the train. A Kt of 4.8 means this bearing is 4.8 interquartile ranges above the 3rd quartile — an extreme statistical outlier. Anything above 3.5 is a WM51 threshold.

Ke (Equipment K-value) = 3.2
Ke applies the same calculation using only the bearings on this specific car. Ke > 2.0 confirms the outlier is car-specific, not a train-wide temperature elevation.

§4.1.1 Trigger Conditions (ALL three must be met):
- Kt > 3.5 → Kt = 4.8 (exceeded)
- Ke > 2.0 → Ke = 3.2 (exceeded)
- Bearing ≥50°F hotter than any other bearing on the car → 118°F above ambient, next hottest is 56°F (62°F differential — exceeds 50°F threshold)

Why mandatory set-out? All three §4.1.1 conditions are simultaneously satisfied. This pattern is highly predictive of imminent bearing failure (hot box → journal fire → derailment).`,
        rca: {
          what: "HBD WM51 §4.1.1 qualifying indication: Kt=4.8, Ke=3.2, bearing 118°F above ambient (62°F hotter than next hottest bearing on car). All three §4.1.1 conditions satisfied simultaneously.",
          where: "Kingston Sub MP 100.4 HBD detector. Car in Train Q11451-05. Nearest set-out: Kingston yard (MP 103).",
          why: "Bearing lubrication failure or contamination. The Kt/Ke combination with large temperature differential vs. car peers indicates a single bearing running dry or with degraded lubricant. Progressive heat buildup — if not set out, journal fire risk within 50–200 miles.",
          blastRadius: "Train Q11451-05 delayed ~2h for set-out at Kingston. Kingston Sub traffic flow impacted. Car owner (CN) notified. WM51 report filed with AAR.",
          actions: "1. Set out CN 448821 at Kingston yard. 2. Allow bearing to cool before inspection. 3. Inspect bearing assembly — check lubricant level, contamination, roller condition. 4. If journal fire evidence: condemn bearing, replace assembly. 5. Return to service after shop certification.",
        },
      },
      { role: "user", content: "How does §4.1.1 differ from §4.1.2 and §4.1.3? When would each trigger?" },
      {
        role: "assistant",
        content: `The three WM51 sections target different failure signatures:

**§4.1.1 — Single Hot Bearing (Absolute Outlier)**
Triggers when ONE bearing is simultaneously:
- A statistical outlier vs. the train (Kt > 3.5)
- A statistical outlier vs. its own car (Ke > 2.0)
- At least 50°F hotter than any other bearing on the same car
Best at detecting: Acute bearing failure — lubricant loss, contamination, or mechanical damage.

**§4.1.2 — Dominant Hot Bearing (Relative Isolation)**
Triggers when Kt > 3.5 and the second-hottest bearing on the same car has a Kt less than 45% of this bearing's Kt.
Best at detecting: A bearing that is disproportionately dominant — the next hottest is less than half as hot.
CN 882341 case: Kt=4.1, second hottest Kt=1.7 (41% of 4.1, below 45% threshold) → §4.1.2 triggered.

**§4.1.3 — Rolling 3-Pass Window (Chronic Degradation)**
Triggers when, within a rolling 240-hour window:
- Pass A: Kt ≥ 4.0, temp ≥95°F above ambient, Ke ≥ 2
- Pass B & C: Kt ≥ 1.5, Ke ≥ 2
Best at detecting: Slow-developing bearing degradation that never reaches acute alarm levels in a single pass.
CSXT 8812 case: Three passes over 240 hours → §4.1.3 triggered at Rivers Sub.

Summary:
- §4.1.1: Acute single-bearing failure
- §4.1.2: Isolated dominant bearing
- §4.1.3: Chronic slow degradation`,
      },
    ],
  },
  {
    key: "Edson-Sub-Health",
    label: "Edson Sub — Multi-System Alert",
    updatedAt: new Date("2026-05-14T13:00:00"),
    messages: [
      { role: "user", content: "Edson Sub seems to have multiple issues right now. Give me a full health check." },
      {
        role: "assistant",
        content: `Edson Sub — Full Health Check (2026-05-14 13:00)

Edson Sub is experiencing a multi-system degradation event — three concurrent issues:

**1. COBRA Radio Degradation (Critical)**
Jasper repeater site (MP 112) degraded — signal -87 dBm (threshold: -80 dBm). ~15-mile radio shadow MP 105–120. Edson Sub MP 88 repeater also degraded (-84 dBm).

**2. PTC Degraded — Train L50251-05 (Warning)**
I-ETMS communication loss at Edson Sub MP 44. L50251-05 operating in degraded PTC mode. Max 49 mph in degraded zones. This train is also involved in the DED Level 2 HAZMAT event.

**3. DED Level 2 HAZMAT Event (Critical)**
UP 448812 (Class 3 Ethanol) on L50251-05 triggered DED Level 2 at MP 112.8. Train stopped. Emergency response activated. Car being set out at Edson yard.

**4. WILD ELEVATED — CN 558412 (Elevated)**
CN 558412 recorded 62 kips at Edson Sub MP 80.2 (Rule 41 ELEVATED, 50–64 kip range). Owner notified, monitoring.

**Traffic Summary (last 7 days):**
623 car passages | 241 unique cars | 14 trains | 2 defects detected | avg speed 48 mph

**Overall Assessment:** Edson Sub is at elevated operational risk due to concurrent COBRA degradation, PTC degradation, and active DED HAZMAT event. Priority attention from RTC required.`,
        rca: {
          what: "Edson Sub experiencing concurrent: (1) COBRA radio degradation at 2 repeater sites, (2) PTC degraded on L50251-05, (3) DED Level 2 HAZMAT event at MP 112.8, (4) WILD ELEVATED on CN 558412 at MP 80.2.",
          where: "Edson Sub — primarily MP 44–120 corridor. COBRA shadow: MP 105–120. DED event: MP 112.8. PTC degradation: MP 44+. WILD reading: MP 80.2.",
          why: "Three independent failure modes coinciding: (1) COBRA repeater hardware degradation, (2) I-ETMS comm loss likely caused by COBRA degradation in the same corridor, (3) Mechanical brake rigging failure on UP 448812. The radio and PTC issues may share a common cause (Jasper repeater at MP 112).",
          blastRadius: "L50251-05 stopped on main line. 2 following trains held. Edson yard receiving HAZMAT set-out. COBRA shadow affecting 3 trains in MP 105–120 zone. PTC degraded operations requiring crew speed enforcement.",
          actions: "1. Priority: Clear DED HAZMAT event (L50251-05 set-out). 2. Dispatch COBRA maintenance to Jasper repeater (MP 112) — likely root cause of both radio and PTC issues. 3. Monitor CN 558412 WILD at next detector. 4. Issue slow order for PTC degraded zone. 5. RTC to maintain manual oversight until all systems restored.",
        },
      },
      { role: "user", content: "Could the COBRA degradation be causing the PTC issue on L50251-05?" },
      {
        role: "assistant",
        content: `Yes — this is the most likely root cause. Here is the technical explanation:

**How COBRA and I-ETMS interact on CN:**
I-ETMS relies on continuous communication between the locomotive's on-board computer and the Back Office Server (BOS) to maintain PTC authority. This communication travels over the COBRA radio network as the primary transport layer.

**The failure chain:**
1. Jasper repeater site (MP 112) degrades to -87 dBm signal strength
2. L50251-05 enters the COBRA shadow zone (MP 105–120) while en route
3. I-ETMS loses its BOS uplink — cannot receive updated movement authorities
4. I-ETMS transitions to degraded mode — retains last known authority but cannot receive new ones
5. Logged as "I-ETMS comm loss at Edson Sub MP 44"

**Why this matters:**
In degraded PTC mode, the system cannot enforce speed restrictions dynamically. The crew must manually comply with all speed limits. The risk is human error — the system is no longer a backstop.

**Recommendation:** Treat the Jasper repeater repair as the highest-priority action on Edson Sub — it likely resolves both the COBRA degradation and the PTC issue simultaneously.`,
      },
    ],
  },
];

// ─── Suggested prompts (20+ detailed questions) ───────────────────────────────
const SUGGESTED_PROMPTS = [
  {
    category: "Wayside Detectors",
    icon: <Activity size={13} className="text-amber-400" />,
    label: "WILD Rule 41 summary",
    prompt: "Summarize all cars with WILD readings in the last 7 days by Rule 41 category: ELEVATED (50–64 kips), ALERT (65–89 kips), and ALARM (≥90 kips). For each car, show the reading, axle, location, subdivision, and the mandatory action taken (if any).",
  },
  {
    category: "Wayside Detectors",
    icon: <Thermometer size={13} className="text-red-400" />,
    label: "HBD K-value alarms",
    prompt: "Which cars have triggered HBD WM51 or WM52 K-value qualifying indications? For each, explain which S-6001 section was triggered (§4.1.1, §4.1.2, or §4.1.3 rolling window), the Kt and Ke values, temperature above ambient, and whether a mandatory set-out was executed.",
  },
  {
    category: "Wayside Detectors",
    icon: <AlertTriangle size={13} className="text-red-400" />,
    label: "All active alarms",
    prompt: "What are all the active ALARM and ALERT conditions across the network right now? Include car number, detector type, reading value, location, and which train the car is in. Classify each by AAR rule (Rule 41, WM51, WM52, S-6000 Level-1, DED Level 2, etc.).",
  },
  {
    category: "Wayside Detectors",
    icon: <Gauge size={13} className="text-orange-400" />,
    label: "DED & dragging equipment",
    prompt: "Are there any active DED (Dragging Equipment Detector) alarms or recent events? For each, explain the DED level (1=warning, 2=alarm, 3=emergency), what was detected, the required action, and whether any HAZMAT cars were involved.",
  },
  {
    category: "Wayside Detectors",
    icon: <Activity size={13} className="text-purple-400" />,
    label: "ABD/TADS bearing defects",
    prompt: "Which cars have ABD or TADS acoustic bearing defect indications? For each, give the TADS defect rank (0–4), the S-6000 Level-1 criteria met (if any), the affected axle, and whether immediate set-out was required.",
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

// ─── LLM call (via /api/chat proxy to avoid CORS) ───────────────────────────
async function callLLM(messages: { role: string; content: string }[]): Promise<string> {
  // Try the /api/chat serverless proxy first (works on Vercel static deployments)
  // Fall back to direct Forge call (works on Manus-hosted deployments)
  const useProxy = !FORGE_API_KEY || window.location.hostname.includes('vercel.app');
  const endpoint = useProxy ? "/api/chat" : `${FORGE_BASE_URL}/v1/chat/completions`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!useProxy && FORGE_API_KEY) headers["Authorization"] = `Bearer ${FORGE_API_KEY}`;

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
    throw new Error(`LLM API error (${resp.status}): ${txt.slice(0, 200)}`);
  }

  const data = await resp.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "No response received. Please try again.";
}

// ─── Session sidebar item ─────────────────────────────────────────────────────
function SessionItem({
  sessionKey, label, preview, updatedAt, isActive, onClick,
}: {
  sessionKey: string; label?: string; preview: string; updatedAt: Date; isActive: boolean; onClick: () => void;
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
          {label || (sessionKey === "general" ? "General" : sessionKey)}
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
      <div className={`max-w-[80%]`}>
        <div className={`px-3.5 py-2.5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[#D22630]/10 text-foreground rounded-tr-none"
            : "bg-muted text-foreground rounded-tl-none"
        }`}>
          {msg.content}
        </div>
        {!isUser && msg.rca && <RcaDrillDown rca={msg.rca} />}
      </div>
    </div>
  );
}

// ─── RCA Drill-Down Panel ─────────────────────────────────────────────────────
function RcaDrillDown({ rca }: { rca: RcaLayer }) {
  const [open, setOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<keyof RcaLayer>("what");

  const layers: { key: keyof RcaLayer; label: string; color: string }[] = [
    { key: "what",        label: "What Happened", color: "text-red-400" },
    { key: "where",       label: "Where",         color: "text-blue-400" },
    { key: "why",         label: "Why / RCA",     color: "text-amber-400" },
    { key: "blastRadius", label: "Blast Radius",  color: "text-orange-400" },
    { key: "actions",     label: "Actions",       color: "text-emerald-400" },
  ];

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#D22630]/30 bg-[#D22630]/5 hover:bg-[#D22630]/10 transition-colors text-[11px] text-[#D22630] font-medium"
      >
        <Activity size={11}/>
        Root Cause Analysis
        <ChevronRight size={10} className={`transition-transform ${open ? "rotate-90" : ""}`}/>
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-[#D22630]/20 bg-background overflow-hidden">
          <div className="flex border-b border-border overflow-x-auto">
            {layers.map(l => (
              <button
                key={l.key}
                onClick={() => setActiveLayer(l.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium transition-colors flex-shrink-0 ${
                  activeLayer === l.key
                    ? "bg-[#D22630]/10 text-[#D22630] border-b-2 border-[#D22630]"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <span className={l.color}>●</span>
                {l.label}
              </button>
            ))}
          </div>
          <div className="p-3 text-[11px] text-foreground leading-relaxed whitespace-pre-wrap">
            {rca[activeLayer]}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [sessions, setSessions] = useState<Session[]>([
    { key: "general", messages: [], updatedAt: new Date() },
    ...SEEDED_SESSIONS,
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
                label={s.label}
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

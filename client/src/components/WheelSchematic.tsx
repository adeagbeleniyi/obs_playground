/**
 * WheelSchematic — 2D top-down SVG diagram of a freight car underframe.
 *
 * Shows all 8 wheel positions (A1-Left, A1-Right, A2-Left, A2-Right,
 * B1-Left, B1-Right, B2-Left, B2-Right) and highlights any defective
 * positions based on the car's defect flags and wayside readings.
 */

import type { DefectFlag, WaysideReading } from "@/lib/crewCarData";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AxleId = "A1" | "A2" | "B1" | "B2";
export type WheelSide = "Left" | "Right";
export type WheelPosition = `${AxleId}-${WheelSide}`;

export type DefectSeverity = "ALARM" | "ALERT" | "WARNING" | "INFO";

export interface WheelDefect {
  position: WheelPosition;
  severity: DefectSeverity;
  label: string;       // short label e.g. "WILD 96 kips"
  detail: string;      // full description for tooltip
  defectType: "WILD" | "HBD" | "TADS" | "DED" | "OTHER";
}

// ─── Position Parser ──────────────────────────────────────────────────────────

// Pattern 1: strict — "Axle B2-Left", "Axle A1-Right"
const AXLE_PATTERN = /Axle\s+(A1|A2|B1|B2)[- ](Left|Right)/gi;

// Pattern 2: numbered — "axle 1", "axle 2", "axle 3", "axle 4"  (maps to A1,A2,B1,B2)
const AXLE_NUM_PATTERN = /axle\s+([1-4])/gi;

// Pattern 3: side-only — "left-side bearing", "right-side bearing", "Left wheel", "Right wheel"
const SIDE_ONLY_PATTERN = /(left|right)[- ](?:side\s+)?(?:bearing|wheel)/gi;

/** Map numbered axle (1–4) to axle ID */
function numToAxle(n: string): AxleId {
  return (["A1", "A2", "B1", "B2"] as AxleId[])[parseInt(n, 10) - 1] ?? "A1";
}

/** Normalise raw side string to Left | Right */
function normSide(raw: string): WheelSide {
  return raw.toLowerCase().startsWith("l") ? "Left" : "Right";
}

/**
 * Try all patterns in priority order and return the first matched position.
 * Returns null if no position can be inferred.
 */
function inferPosition(text: string): WheelPosition | null {
  // Priority 1: strict Axle XX-Side
  const strict = Array.from(text.matchAll(AXLE_PATTERN));
  if (strict.length > 0) {
    const m = strict[0];
    return `${m[1].toUpperCase() as AxleId}-${normSide(m[2])}`;
  }

  // Priority 2: numbered axle + explicit side
  const numMatch = Array.from(text.matchAll(AXLE_NUM_PATTERN));
  if (numMatch.length > 0) {
    const axle = numToAxle(numMatch[0][1]);
    // look for a side word anywhere in the text
    const sideMatch = text.match(/\b(left|right)\b/i);
    const side: WheelSide = sideMatch ? normSide(sideMatch[1]) : "Left";
    return `${axle}-${side}`;
  }

  // Priority 3: side-only (no axle number) — default to A1 or B1 depending on context
  const sideOnly = Array.from(text.matchAll(SIDE_ONLY_PATTERN));
  if (sideOnly.length > 0) {
    const side = normSide(sideOnly[0][1]);
    // Heuristic: if description mentions "rear" or "B-end" use B1, else A1
    const isBEnd = /\b(rear|b[- ]?end|trailing)\b/i.test(text);
    const axle: AxleId = isBEnd ? "B1" : "A1";
    return `${axle}-${side}`;
  }

  return null;
}

/**
 * Extract wheel positions from free-text descriptions in defect flags
 * and wayside readings. Returns a map of position → defect info.
 */
export function extractWheelDefects(
  defectFlags: DefectFlag[],
  waysideReadings: WaysideReading[]
): WheelDefect[] {
  const defects: Map<WheelPosition, WheelDefect> = new Map();

  // Parse defect flags (highest priority)
  for (const flag of defectFlags) {
    if (flag.resolved) continue;
    const text = `${flag.description} ${flag.type}`;

    // Try all strict matches first (one flag can have multiple axle positions)
    const strictMatches = Array.from(text.matchAll(AXLE_PATTERN));
    const positions: WheelPosition[] = strictMatches.length > 0
      ? strictMatches.map(m => `${m[1].toUpperCase() as AxleId}-${normSide(m[2])}` as WheelPosition)
      : [inferPosition(text)].filter(Boolean) as WheelPosition[];

    for (const pos of positions) {
      const severity: DefectSeverity =
        flag.severity === "CRITICAL" ? "ALARM" :
        flag.severity === "WARNING"  ? "ALERT" : "INFO";

      const defectType = flag.type.includes("WILD") ? "WILD" :
                         flag.type.includes("Hot Bearing") || flag.type.includes("HBD") ? "HBD" :
                         flag.type.includes("TADS") ? "TADS" :
                         flag.type.includes("DED") ? "DED" : "OTHER";

      const kipsMatch = flag.description.match(/(\d+)\s*kips/i);
      const tempMatch = flag.description.match(/(\d+)°[CF]/i);
      const ktMatch   = flag.description.match(/Kt[=:]\s*([\d.]+)/i);

      const label =
        defectType === "WILD" && kipsMatch ? `WILD ${kipsMatch[1]} kips` :
        defectType === "HBD"  && ktMatch   ? `HBD Kt=${ktMatch[1]}` :
        defectType === "HBD"  && tempMatch ? `HBD ${tempMatch[1]}°` :
        flag.type.split("—")[0].trim().slice(0, 18);

      if (!defects.has(pos) || severity === "ALARM") {
        defects.set(pos, { position: pos, severity, label, detail: flag.description, defectType });
      }
    }
  }

  // Parse wayside readings (lower priority — only add if not already from defect flag)
  for (const r of waysideReadings) {
    if (r.status === "NORMAL") continue;
    const strictMatches = Array.from(r.reading.matchAll(AXLE_PATTERN));
    const positions: WheelPosition[] = strictMatches.length > 0
      ? strictMatches.map(m => `${m[1].toUpperCase() as AxleId}-${normSide(m[2])}` as WheelPosition)
      : [inferPosition(r.reading)].filter(Boolean) as WheelPosition[];

    for (const pos of positions) {
      if (defects.has(pos)) continue;

      const severity: DefectSeverity = r.status === "ALARM" ? "ALARM" : "ALERT";
      const defectType = r.detectorType === "WILD" ? "WILD" :
                         r.detectorType === "HBD"  ? "HBD"  :
                         r.detectorType === "TADS" ? "TADS" :
                         r.detectorType === "DED"  ? "DED"  : "OTHER";

      const kipsMatch = r.reading.match(/(\d+)\s*kips/i);
      const ktMatch   = r.reading.match(/Kt[=:]\s*([\d.]+)/i);
      const label =
        defectType === "WILD" && kipsMatch ? `WILD ${kipsMatch[1]} kips` :
        defectType === "HBD"  && ktMatch   ? `HBD Kt=${ktMatch[1]}` :
        `${r.detectorType} ${r.status}`;

      defects.set(pos, { position: pos, severity, label, detail: r.reading, defectType });
    }
  }

  return Array.from(defects.values());
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

function wheelColor(severity: DefectSeverity | null) {
  switch (severity) {
    case "ALARM":   return { fill: "#EF4444", stroke: "#FCA5A5", glow: "#EF444466", text: "#FCA5A5" };
    case "ALERT":   return { fill: "#F59E0B", stroke: "#FCD34D", glow: "#F59E0B55", text: "#FCD34D" };
    case "WARNING": return { fill: "#F97316", stroke: "#FDBA74", glow: "#F9731655", text: "#FDBA74" };
    case "INFO":    return { fill: "#3B82F6", stroke: "#93C5FD", glow: "#3B82F655", text: "#93C5FD" };
    default:        return { fill: "#374151", stroke: "#6B7280", glow: "none",      text: "#9CA3AF" };
  }
}

function defectIcon(type: WheelDefect["defectType"]) {
  switch (type) {
    case "WILD": return "⚡";
    case "HBD":  return "🌡";
    case "TADS": return "🔊";
    case "DED":  return "⚠";
    default:     return "●";
  }
}

// ─── Registry-format extractor (for carRegistry.ts CarRecord) ───────────────
// carRegistry uses "Axle A2-L", "Axle B1-Right" etc. in summary/value fields
const REGISTRY_AXLE_PATTERN = /Axle\s+(A1|A2|B1|B2)[- ](L(?:eft)?|R(?:ight)?)/gi;

export function extractWheelDefectsFromRegistry(
  detectorHistory: Array<{
    id: string;
    detectorType: string;
    status: string;
    value: string;
    summary: string;
    flagged: boolean;
    date: string;
    time: string;
  }>
): WheelDefect[] {
  const defects: Map<WheelPosition, WheelDefect> = new Map();

  for (const ev of detectorHistory) {
    if (!ev.flagged && ev.status === "healthy") continue;
    const text = `${ev.summary} ${ev.value}`;
    const matches = Array.from(text.matchAll(REGISTRY_AXLE_PATTERN));
    for (const m of matches) {
      const axle = m[1].toUpperCase() as AxleId;
      const rawSide = m[2].toUpperCase();
      const side: WheelSide = rawSide === "L" || rawSide === "LEFT" ? "Left" : "Right";
      const pos: WheelPosition = `${axle}-${side}`;

      const severity: DefectSeverity =
        ev.status === "critical" ? "ALARM" :
        ev.status === "warning"  ? "ALERT" : "INFO";

      const defectType =
        ev.detectorType === "WILD" ? "WILD" :
        ev.detectorType === "HBD" || ev.detectorType === "ABD" ? "HBD" :
        ev.detectorType === "TADS" ? "TADS" :
        ev.detectorType === "DED" ? "DED" : "OTHER";

      const kipsMatch = ev.value.match(/(\d+)\s*kips/i);
      const tempMatch = ev.value.match(/(\d+)°F/i);
      const label =
        defectType === "WILD" && kipsMatch ? `WILD ${kipsMatch[1]} kips` :
        defectType === "HBD"  && tempMatch ? `HBD ${tempMatch[1]}°F` :
        `${ev.detectorType} ${ev.status.toUpperCase()}`;

      if (!defects.has(pos) || severity === "ALARM") {
        defects.set(pos, {
          position: pos,
          severity,
          label,
          detail: ev.summary,
          defectType,
        });
      }
    }
  }

  return Array.from(defects.values());
}

// ─── SVG Component ────────────────────────────────────────────────────────────

interface WheelSchematicProps {
  defects: WheelDefect[];
  /** Optional: show a tooltip/callout for this position */
  highlightPosition?: WheelPosition | null;
  className?: string;
}

// SVG coordinate layout (viewBox 0 0 700 260)
// Car body: x=160 to x=540, y=90 to y=170
// A-end truck: x=60 to x=155, centred at y=130
// B-end truck: x=545 to x=640, centred at y=130
// Axle A1: x=90,  Axle A2: x=130
// Axle B1: x=570, Axle B2: x=610
// Left wheels: y=80,  Right wheels: y=180

const WHEEL_R = 14;

const WHEEL_POSITIONS: Record<WheelPosition, { cx: number; cy: number; axleLabel: string }> = {
  "A1-Left":  { cx: 90,  cy: 75,  axleLabel: "A1" },
  "A1-Right": { cx: 90,  cy: 185, axleLabel: "A1" },
  "A2-Left":  { cx: 130, cy: 75,  axleLabel: "A2" },
  "A2-Right": { cx: 130, cy: 185, axleLabel: "A2" },
  "B1-Left":  { cx: 570, cy: 75,  axleLabel: "B1" },
  "B1-Right": { cx: 570, cy: 185, axleLabel: "B1" },
  "B2-Left":  { cx: 610, cy: 75,  axleLabel: "B2" },
  "B2-Right": { cx: 610, cy: 185, axleLabel: "B2" },
};

export default function WheelSchematic({ defects, className = "" }: WheelSchematicProps) {
  const defectMap = new Map(defects.map(d => [d.position, d]));

  // Active callout: first ALARM, else first ALERT, else null
  const calloutDefect =
    defects.find(d => d.severity === "ALARM") ??
    defects.find(d => d.severity === "ALERT") ??
    defects[0] ?? null;

  const calloutPos = calloutDefect ? WHEEL_POSITIONS[calloutDefect.position] : null;

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 700 290"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        style={{ fontFamily: "'Space Grotesk', 'Courier New', monospace" }}
      >
        {/* ── Defs: glow filters ── */}
        <defs>
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Background grid ── */}
        <rect width="700" height="290" fill="#0D1117" rx="6" />
        {Array.from({ length: 14 }, (_, i) => (
          <line key={`vg${i}`} x1={i * 50} y1={0} x2={i * 50} y2={290} stroke="#1F2937" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`hg${i}`} x1={0} y1={i * 50} x2={700} y2={i * 50} stroke="#1F2937" strokeWidth="0.5" />
        ))}

        {/* ── LEFT / RIGHT labels ── */}
        <text x="350" y="18" textAnchor="middle" fill="#4B5563" fontSize="10" fontWeight="600" letterSpacing="3">LEFT</text>
        <text x="350" y="283" textAnchor="middle" fill="#4B5563" fontSize="10" fontWeight="600" letterSpacing="3">RIGHT</text>

        {/* ── A-END / B-END labels ── */}
        <text x="22" y="134" textAnchor="middle" fill="#6B7280" fontSize="9" fontWeight="700" letterSpacing="2">A-END</text>
        <text x="678" y="134" textAnchor="middle" fill="#6B7280" fontSize="9" fontWeight="700" letterSpacing="2">B-END</text>

        {/* ── Rail lines ── */}
        <line x1="30" y1="75"  x2="670" y2="75"  stroke="#374151" strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="185" x2="670" y2="185" stroke="#374151" strokeWidth="3" strokeLinecap="round" />

        {/* ── Car body ── */}
        <rect x="158" y="95" width="384" height="70" rx="3" fill="#111827" stroke="#374151" strokeWidth="1.5" />
        {/* Cross-bracing */}
        <line x1="158" y1="95"  x2="542" y2="165" stroke="#1F2937" strokeWidth="1" />
        <line x1="542" y1="95"  x2="158" y2="165" stroke="#1F2937" strokeWidth="1" />
        <line x1="350" y1="95"  x2="350" y2="165" stroke="#1F2937" strokeWidth="1" />

        {/* ── A-end truck frame ── */}
        <rect x="62" y="100" width="90" height="60" rx="4" fill="#111827" stroke="#374151" strokeWidth="1.5" />
        <line x1="62" y1="130" x2="152" y2="130" stroke="#374151" strokeWidth="1" />

        {/* ── B-end truck frame ── */}
        <rect x="548" y="100" width="90" height="60" rx="4" fill="#111827" stroke="#374151" strokeWidth="1.5" />
        <line x1="548" y1="130" x2="638" y2="130" stroke="#374151" strokeWidth="1" />

        {/* ── Axle lines ── */}
        {(["A1","A2","B1","B2"] as AxleId[]).map(axle => {
          const leftPos  = WHEEL_POSITIONS[`${axle}-Left`];
          const rightPos = WHEEL_POSITIONS[`${axle}-Right`];
          return (
            <g key={axle}>
              <line
                x1={leftPos.cx} y1={leftPos.cy}
                x2={rightPos.cx} y2={rightPos.cy}
                stroke="#4B5563" strokeWidth="3" strokeLinecap="round"
              />
              {/* Axle label */}
              <text
                x={leftPos.cx}
                y={130}
                textAnchor="middle"
                fill="#6B7280"
                fontSize="9"
                fontWeight="700"
                letterSpacing="1"
              >
                {axle}
              </text>
            </g>
          );
        })}

        {/* ── Wheels ── */}
        {(Object.entries(WHEEL_POSITIONS) as [WheelPosition, { cx: number; cy: number }][]).map(([pos, { cx, cy }]) => {
          const defect = defectMap.get(pos) ?? null;
          const c = wheelColor(defect?.severity ?? null);
          const hasDefect = !!defect;
          const isAlarm = defect?.severity === "ALARM";

          return (
            <g key={pos}>
              {/* Glow ring for defective wheels */}
              {hasDefect && (
                <circle
                  cx={cx} cy={cy} r={WHEEL_R + 6}
                  fill={c.glow}
                  filter={isAlarm ? "url(#glow-red)" : "url(#glow-amber)"}
                />
              )}
              {/* Outer ring */}
              <circle
                cx={cx} cy={cy} r={WHEEL_R}
                fill={c.fill}
                stroke={c.stroke}
                strokeWidth={hasDefect ? 2 : 1}
              />
              {/* Inner hub */}
              <circle cx={cx} cy={cy} r={5} fill={hasDefect ? c.stroke : "#1F2937"} />
              {/* Spoke lines */}
              {[0, 60, 120].map(angle => {
                const rad = (angle * Math.PI) / 180;
                return (
                  <line
                    key={angle}
                    x1={cx + Math.cos(rad) * 5} y1={cy + Math.sin(rad) * 5}
                    x2={cx + Math.cos(rad) * (WHEEL_R - 2)} y2={cy + Math.sin(rad) * (WHEEL_R - 2)}
                    stroke={hasDefect ? c.stroke : "#374151"}
                    strokeWidth="1.5"
                  />
                );
              })}
              {[0, 60, 120].map(angle => {
                const rad = ((angle + 180) * Math.PI) / 180;
                return (
                  <line
                    key={`r${angle}`}
                    x1={cx + Math.cos(rad) * 5} y1={cy + Math.sin(rad) * 5}
                    x2={cx + Math.cos(rad) * (WHEEL_R - 2)} y2={cy + Math.sin(rad) * (WHEEL_R - 2)}
                    stroke={hasDefect ? c.stroke : "#374151"}
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Position label */}
              <text
                x={cx}
                y={cy > 130 ? cy + WHEEL_R + 12 : cy - WHEEL_R - 5}
                textAnchor="middle"
                fill={hasDefect ? c.text : "#6B7280"}
                fontSize="8"
                fontWeight={hasDefect ? "700" : "400"}
              >
                {pos}
              </text>

              {/* Defect badge */}
              {hasDefect && defect && (
                <text
                  x={cx}
                  y={cy > 130 ? cy + WHEEL_R + 22 : cy - WHEEL_R - 15}
                  textAnchor="middle"
                  fill={c.text}
                  fontSize="7"
                  fontWeight="700"
                >
                  {defect.label}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Callout box for primary defect ── */}
        {calloutDefect && calloutPos && (() => {
          const c = wheelColor(calloutDefect.severity);
          // Position callout: if wheel is on right side (cy=185), put box below; else above
          const isRight = calloutPos.cy > 130;
          // If wheel is on A-end (cx < 350), put box to the right; else to the left
          const isAEnd = calloutPos.cx < 350;

          const boxW = 200;
          const boxH = 52;
          const boxX = isAEnd ? calloutPos.cx + 20 : calloutPos.cx - boxW - 20;
          const boxY = isRight ? 210 : 25;

          // Clamp to SVG bounds
          const clampedX = Math.max(5, Math.min(boxX, 700 - boxW - 5));
          const clampedY = Math.max(5, Math.min(boxY, 290 - boxH - 5));

          const lineEndX = calloutPos.cx + (isAEnd ? 18 : -18);
          const lineEndY = isRight ? calloutPos.cy + WHEEL_R + 2 : calloutPos.cy - WHEEL_R - 2;

          return (
            <g>
              {/* Dashed leader line */}
              <line
                x1={lineEndX} y1={lineEndY}
                x2={clampedX + (isAEnd ? 0 : boxW)} y2={clampedY + boxH / 2}
                stroke={c.stroke}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              {/* Box */}
              <rect
                x={clampedX} y={clampedY}
                width={boxW} height={boxH}
                rx="4"
                fill="#111827"
                stroke={c.stroke}
                strokeWidth="1.5"
              />
              {/* Severity badge */}
              <rect x={clampedX + 6} y={clampedY + 6} width={calloutDefect.severity.length * 6 + 8} height={13} rx="2" fill={c.fill} />
              <text x={clampedX + 10} y={clampedY + 16} fill="white" fontSize="8" fontWeight="800" letterSpacing="0.5">
                {calloutDefect.severity}
              </text>
              {/* Position */}
              <text x={clampedX + calloutDefect.severity.length * 6 + 20} y={clampedY + 16} fill={c.text} fontSize="8" fontWeight="700">
                {calloutDefect.position}
              </text>
              {/* Label */}
              <text x={clampedX + 8} y={clampedY + 30} fill={c.text} fontSize="8" fontWeight="700">
                {defectIcon(calloutDefect.defectType)} {calloutDefect.label}
              </text>
              {/* Detail (truncated) */}
              <text x={clampedX + 8} y={clampedY + 43} fill="#9CA3AF" fontSize="7">
                {calloutDefect.detail.slice(0, 38)}{calloutDefect.detail.length > 38 ? "…" : ""}
              </text>
            </g>
          );
        })()}

        {/* ── Legend ── */}
        {[
          { label: "ALARM",   color: "#EF4444" },
          { label: "ALERT",   color: "#F59E0B" },
          { label: "WARNING", color: "#F97316" },
          { label: "CLEAR",   color: "#374151" },
        ].map((item, i) => (
          <g key={item.label} transform={`translate(${10 + i * 80}, 268)`}>
            <circle cx={6} cy={0} r={5} fill={item.color} />
            <text x={14} y={4} fill="#6B7280" fontSize="8" fontWeight="600">{item.label}</text>
          </g>
        ))}
      </svg>

      {/* ── All defects list (below SVG) ── */}
      {defects.length > 0 && (
        <div className="mt-2 space-y-1">
          {defects.map(d => {
            const c = wheelColor(d.severity);
            return (
              <div
                key={d.position}
                className="flex items-start gap-2 px-3 py-2 rounded border text-[10px]"
                style={{ borderColor: c.stroke + "40", backgroundColor: c.fill + "10" }}
              >
                <span className="font-bold shrink-0 mt-0.5" style={{ color: c.text }}>
                  {d.severity}
                </span>
                <span className="font-mono font-bold shrink-0" style={{ color: c.text }}>
                  {d.position}
                </span>
                <span className="text-muted-foreground leading-relaxed">{d.detail}</span>
              </div>
            );
          })}
        </div>
      )}

      {defects.length === 0 && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded border border-emerald-500/20 bg-emerald-500/5 text-[10px] text-emerald-400">
          <span className="font-bold">ALL CLEAR</span>
          <span className="text-muted-foreground">No wheel or bearing defects detected on this car.</span>
        </div>
      )}
    </div>
  );
}

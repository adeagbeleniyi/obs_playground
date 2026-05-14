import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { TRAINS, SUBDIVISIONS, type TrainRecord, type CarDetail, type WheelReading, type DetectorReading, type Health } from "@/lib/journeyData";
import { getCarRecord, RAILROAD_LABELS, RAILROAD_COLORS, type CarRecord } from "@/lib/carRegistry";
import {
  Search, ChevronDown, ChevronRight, Train, Radio, Cpu, MapPin,
  AlertTriangle, CheckCircle, XCircle, Clock, Zap, Activity,
  Thermometer, RotateCcw, Shield, Navigation, Server, GitBranch,
  Waves, Gauge, Scan, Ear, Wrench, TrendingUp, Key, Database, Lock, RefreshCw
} from "lucide-react";
import { PTC_LIFECYCLES, type PTCLifecycleStep } from "@/lib/dispatchData";
import { getLocosForTrain, getCarsForTrain, type LocomotiveDetail, type ComponentStatus } from "@/lib/consistData";
import { FLEET_SNAPSHOT } from "@/lib/fleetData";

// ─── Health helpers ────────────────────────────────────────────────────────────
const healthColor: Record<Health, string> = {
  healthy: "text-emerald-400",
  warning: "text-amber-400",
  critical: "text-red-400",
  offline: "text-slate-500",
};
const healthBg: Record<Health, string> = {
  healthy: "bg-emerald-500/15 border-emerald-500/30",
  warning: "bg-amber-500/15 border-amber-500/30",
  critical: "bg-red-500/15 border-red-500/30",
  offline: "bg-slate-500/15 border-slate-500/30",
};
const healthDot: Record<Health, string> = {
  healthy: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-400",
  offline: "bg-slate-500",
};
const HealthIcon = ({ h, size = 14 }: { h: Health; size?: number }) => {
  if (h === "healthy") return <CheckCircle size={size} className="text-emerald-400" />;
  if (h === "warning") return <AlertTriangle size={size} className="text-amber-400" />;
  if (h === "critical") return <XCircle size={size} className="text-red-400" />;
  return <Clock size={size} className="text-slate-500" />;
};

const waysideIcon: Record<string, React.ReactNode> = {
  wiu: <Radio size={13} />,
  detector: <Thermometer size={13} />,
  signal: <Zap size={13} />,
  crossing: <Navigation size={13} />,
  base_station: <Server size={13} />,
};

// ─── Wheel Grid ───────────────────────────────────────────────────────────────
function WheelGrid({ wheels }: { wheels: WheelReading[] }) {
  const axles = ["A1", "A2", "A3", "A4"];
  return (
    <div className="mt-3">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Wheel Bearing Temperatures (°F)</div>
      <div className="grid grid-cols-4 gap-2">
        {axles.map((axle) => {
          const left = wheels.find((w) => w.position === `${axle}-L`);
          const right = wheels.find((w) => w.position === `${axle}-R`);
          return (
            <div key={axle} className="bg-slate-800/60 rounded p-2 border border-slate-700/50">
              <div className="text-[10px] text-slate-500 text-center mb-1.5 font-mono">{axle}</div>
              {[left, right].map((w, i) => w && (
                <div key={i} className={`flex items-center justify-between px-1.5 py-0.5 rounded mb-1 ${healthBg[w.status]} border`}>
                  <span className="text-[10px] text-slate-400 font-mono">{i === 0 ? "L" : "R"}</span>
                  <span className={`text-xs font-bold font-mono ${healthColor[w.status]}`}>{w.tempF}°</span>
                </div>
              ))}
              {left?.note && (
                <div className="text-[9px] text-amber-400 mt-1 leading-tight">{left.note}</div>
              )}
              {right?.note && (
                <div className="text-[9px] text-amber-400 mt-1 leading-tight">{right.note}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detector Type Meta ──────────────────────────────────────────────────────
const DETECTOR_META: Record<string, { label: string; icon: React.ReactNode; unit: string; color: string }> = {
  HBD:  { label: "Hot Box",           icon: <Thermometer size={11} />, unit: "°F",   color: "text-orange-400" },
  HWD:  { label: "Hot Wheel",         icon: <Zap size={11} />,         unit: "°F",   color: "text-yellow-400" },
  WILD: { label: "Wheel Impact Load", icon: <Gauge size={11} />,       unit: "kips", color: "text-purple-400" },
  ABD:  { label: "Acoustic Bearing",  icon: <Ear size={11} />,         unit: "score",color: "text-blue-400" },
  CRD:  { label: "Cracked Rim",       icon: <Scan size={11} />,        unit: "",     color: "text-red-400" },
  DED:  { label: "Dragging Equip.",   icon: <Wrench size={11} />,      unit: "",     color: "text-red-400" },
  TPD:  { label: "Truck Performance", icon: <TrendingUp size={11} />,  unit: "score",color: "text-cyan-400" },
};

// ─── Detector Panel ───────────────────────────────────────────────────────────
function DetectorPanel({ readings }: { readings: DetectorReading[] }) {
  const [activeType, setActiveType] = useState<string>("HBD");
  const active = readings.find((r) => r.detectorType === activeType);
  return (
    <div className="mt-3">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Detector Readings</div>
      {/* Detector type tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {readings.map((r) => {
          const meta = DETECTOR_META[r.detectorType];
          const isActive = r.detectorType === activeType;
          return (
            <button
              key={r.detectorType}
              onClick={() => setActiveType(r.detectorType)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border transition-colors ${
                isActive
                  ? `bg-slate-700 border-slate-500 ${meta?.color ?? "text-foreground"}`
                  : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-slate-600"
              }`}
            >
              {meta?.icon}
              <span className="font-mono">{r.detectorType}</span>
              {r.status !== "healthy" && (
                <span className={`w-1.5 h-1.5 rounded-full ml-0.5 ${healthDot[r.status]}`} />
              )}
            </button>
          );
        })}
      </div>
      {/* Active detector detail */}
      {active && (
        <div className={`rounded border p-3 ${healthBg[active.status]}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className={DETECTOR_META[active.detectorType]?.color ?? "text-foreground"}>
                {DETECTOR_META[active.detectorType]?.icon}
              </span>
              <span className="text-xs font-medium text-foreground">{DETECTOR_META[active.detectorType]?.label} Detector</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HealthIcon h={active.status} size={12} />
              <span className={`text-xs font-mono font-bold ${healthColor[active.status]}`}>{active.value}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-300 mb-1">{active.summary}</div>
          {active.threshold && (
            <div className="text-[10px] text-slate-500">Threshold: {active.threshold}</div>
          )}
          <div className="text-[10px] text-slate-600 mt-1">{active.detectorName} · {active.time}</div>
          {/* Per-axle readings for HBD */}
          {active.readings.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {["A1","A2","A3","A4"].map((axle) => {
                const left = active.readings.find((w) => w.position === `${axle}-L`);
                const right = active.readings.find((w) => w.position === `${axle}-R`);
                return (
                  <div key={axle} className="bg-slate-800/60 rounded p-1.5 border border-slate-700/50">
                    <div className="text-[9px] text-slate-500 text-center mb-1 font-mono">{axle}</div>
                    {[left, right].map((w, i) => w && (
                      <div key={i} className={`flex items-center justify-between px-1 py-0.5 rounded mb-0.5 ${healthBg[w.status]} border`}>
                        <span className="text-[9px] text-slate-400 font-mono">{i === 0 ? "L" : "R"}</span>
                        <span className={`text-[10px] font-bold font-mono ${healthColor[w.status]}`}>{w.tempF}°</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Car Card ─────────────────────────────────────────────────────────────────
function CarCard({ car }: { car: CarDetail }) {
  const [open, setOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"wheels" | "detectors" | "history" | "consist_history">("wheels");
  const typeLabel = car.type === "lead" ? "Lead Loco" : car.type === "dpu" ? "DPU" : "Car";
  const typeColor = car.type === "lead" ? "text-blue-400" : car.type === "dpu" ? "text-purple-400" : "text-slate-400";
  const carRecord: CarRecord | undefined = getCarRecord(car.number);
  const hasForeignDetector = carRecord?.detectorHistory.some(ev => ev.railroad !== "CN");
  return (
    <div className={`rounded border ${healthBg[car.health]} mb-2`}>
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <HealthIcon h={car.health} size={14} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-foreground font-medium">{car.number}</span>
            <span className={`text-[10px] uppercase tracking-wide ${typeColor}`}>{typeLabel}</span>
            {hasForeignDetector && (
              <span className="text-[9px] px-1 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300">Foreign Detector</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{car.detail}</div>
        </div>
        {(car.loadedLbs ?? 0) > 0 && (
          <span className="text-[10px] text-slate-500 font-mono mr-2">{((car.loadedLbs ?? 0) / 1000).toFixed(0)}K lbs</span>
        )}
        {open ? <ChevronDown size={13} className="text-slate-500 flex-shrink-0" /> : <ChevronRight size={13} className="text-slate-500 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-slate-700/40">
          {/* Sub-tabs */}
          <div className="flex gap-1 mt-3 mb-1 flex-wrap">
            {(["wheels", "detectors", "history", "consist_history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDetailTab(t)}
                className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-wide border transition-colors ${
                  detailTab === t
                    ? "bg-[#D22630]/20 border-[#D22630]/40 text-[#D22630]"
                    : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-slate-600"
                }`}
              >
                {t === "wheels" ? "Wheel Temps" : t === "detectors" ? "All Detectors" : t === "history" ? "Detector History" : "Consist History"}
              </button>
            ))}
          </div>

          {detailTab === "wheels" && <WheelGrid wheels={car.wheels} />}
          {detailTab === "detectors" && car.detectorReadings && car.detectorReadings.length > 0 && (
            <DetectorPanel readings={car.detectorReadings} />
          )}

          {/* Detector History across all trains & detectors, including foreign */}
          {detailTab === "history" && (
            <div className="mt-3">
              {!carRecord ? (
                <p className="text-[11px] text-muted-foreground italic">No detector history found for {car.number}.</p>
              ) : (
                <>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Full Detector History — {car.number}</div>
                  <div className="space-y-1.5">
                    {carRecord.detectorHistory.map((ev) => {
                      const isForeign = ev.railroad !== "CN";
                      const railColor = RAILROAD_COLORS[ev.railroad] ?? "#888";
                      return (
                        <div key={ev.id} className={`flex items-start gap-2 px-2 py-1.5 rounded border text-[11px] ${
                          ev.status === "critical" ? "bg-red-500/10 border-red-500/25" :
                          ev.status === "warning" ? "bg-amber-500/10 border-amber-500/25" :
                          "bg-background/30 border-border/30"
                        }`}>
                          <HealthIcon h={ev.status} size={12} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground font-mono">{ev.detectorType}</span>
                              <span className="text-muted-foreground text-[10px] truncate max-w-[160px]">{ev.detectorName}</span>
                              {isForeign && (
                                <span className="px-1.5 py-0.5 rounded border text-[9px] font-bold flex-shrink-0" style={{ borderColor: railColor + "60", backgroundColor: railColor + "20", color: railColor }}>
                                  {RAILROAD_LABELS[ev.railroad] ?? ev.railroad}
                                </span>
                              )}
                              <span className="text-muted-foreground ml-auto text-[10px]">{ev.date} {ev.time}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-muted-foreground text-[10px]">{ev.summary}</span>
                              <span className="text-[10px] font-mono text-slate-400">{ev.value}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              Train <span className="font-mono text-foreground">{ev.trainId}</span> · {ev.subdivision} Sub · MP {ev.milepost}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Consist History — which trains this car has been part of */}
          {detailTab === "consist_history" && (
            <div className="mt-3">
              {!carRecord ? (
                <p className="text-[11px] text-muted-foreground italic">No consist history found for {car.number}.</p>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Consist History — {car.number}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-background/40 text-muted-foreground">{carRecord.carType} · Built {carRecord.builtYear}</span>
                  </div>
                  <div className="space-y-1.5">
                    {carRecord.consistHistory.map((ch, i) => (
                      <div key={i} className="flex items-center gap-3 px-2 py-1.5 rounded border text-[11px] bg-background/30 border-border/30">
                        <Train size={11} className="text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-semibold text-foreground">{ch.trainId}</span>
                            <span className="text-muted-foreground text-[10px]">{ch.leadLoco}</span>
                            <span className="text-muted-foreground text-[10px]">Pos #{ch.position}</span>
                            <span className="text-muted-foreground ml-auto text-[10px]">{ch.date}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {ch.subdivision} Sub · {ch.loadedLbs > 0 ? `${(ch.loadedLbs/1000).toFixed(0)}K lbs loaded` : "Empty"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Component status helpers (for consist tab) ─────────────────────────────
const csColor: Record<ComponentStatus, string> = { OK: "text-emerald-400", WARNING: "text-amber-400", FAULT: "text-red-400", UNKNOWN: "text-slate-500" };
const csBg: Record<ComponentStatus, string> = { OK: "bg-emerald-500/10 border-emerald-500/25", WARNING: "bg-amber-500/10 border-amber-500/25", FAULT: "bg-red-500/10 border-red-500/25", UNKNOWN: "bg-slate-800/40 border-slate-700/30" };
const CsIcon = ({ s }: { s: ComponentStatus }) => {
  if (s === "OK") return <CheckCircle size={11} className="text-emerald-400" />;
  if (s === "WARNING") return <AlertTriangle size={11} className="text-amber-400" />;
  if (s === "FAULT") return <XCircle size={11} className="text-red-400" />;
  return <Clock size={11} className="text-slate-500" />;
};

// ─── Loco Detail Expander ─────────────────────────────────────────────────────
function LocoDetailCard({ loco }: { loco: LocomotiveDetail }) {
  const [open, setOpen] = useState(false);
  const c = loco.components;
  const posLabel = loco.position === "LEAD" ? "Lead" : loco.position === "TRAIL" ? "Trail" : loco.position === "DPU_REAR" ? "DPU Rear" : loco.position === "DPU_MID" ? "DPU Mid" : "Helper";
  const posColor = loco.position === "LEAD" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" : loco.position.startsWith("DPU") ? "text-purple-400 border-purple-500/30 bg-purple-500/10" : "text-slate-400 border-slate-500/30 bg-slate-800/40";
  const overallStatus: ComponentStatus = loco.activeAlarms.length > 0 ? "FAULT" : c.tractionMotors.some(m => m.status === "WARNING") || c.wheelReadings.some(w => w.status === "WARNING") ? "WARNING" : "OK";
  const fuelColor = c.fuelLevelPct < 25 ? "text-red-400" : c.fuelLevelPct < 40 ? "text-amber-400" : "text-emerald-400";
  return (
    <div className={`rounded border mb-2 ${csBg[overallStatus]}`}>
      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left" onClick={() => setOpen(v => !v)}>
        <CsIcon s={overallStatus} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-bold text-foreground">{loco.roadNumber}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${posColor}`}>{posLabel}</span>
            <span className="text-[10px] text-muted-foreground">#{loco.positionInConsist}</span>
            <span className="text-[10px] text-muted-foreground">{loco.model} · {loco.horsepower.toLocaleString()} HP</span>
            {loco.activeAlarms.length > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400 ml-auto">{loco.activeAlarms.length} ALARM{loco.activeAlarms.length > 1 ? "S" : ""}</span>}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{loco.series} · Built {loco.builtYear} · {loco.milesSinceShop.toLocaleString()} mi since shop · Next shop: {loco.nextShopDueMiles.toLocaleString()} mi</div>
        </div>
        <div className={`text-xs font-mono font-bold mr-2 ${fuelColor}`}>{c.fuelLevelPct}% fuel</div>
        {open ? <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={13} className="text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-border/40 space-y-4 pt-3">
          {loco.activeAlarms.length > 0 && (
            <div className="space-y-1">
              {loco.activeAlarms.map((a, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-red-500/30 bg-red-500/10 text-[11px] text-red-300">
                  <AlertTriangle size={11} className="text-red-400 mt-0.5 flex-shrink-0" />{a}
                </div>
              ))}
            </div>
          )}
          {/* Component health */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Component Health</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Engine", status: c.engineStatus, detail: `${c.engineRPM} RPM · ${c.engineTempC}°C` },
                { label: "Alternator", status: c.alternatorStatus, detail: "" },
                { label: "Air Brakes", status: c.airBrakeStatus, detail: `BP ${c.brakePipePressurePsi} psi` },
                { label: "Dynamic Brake", status: c.dynamicBrakeStatus, detail: "" },
                { label: "Compressor", status: c.compressorStatus, detail: `MR ${c.mainReservoirPressurePsi} psi` },
                { label: "HVAC / Cab", status: c.hvacStatus, detail: `Cab ${c.cabTempC}°C` },
                { label: "I-ETMS", status: c.etmsStatus, detail: "" },
                { label: "GPS", status: c.gpsStatus, detail: "" },
                { label: "Radio", status: c.radioStatus, detail: "" },
                { label: "Event Recorder", status: c.eventRecorderStatus, detail: "" },
              ].map(item => (
                <div key={item.label} className={`flex items-center justify-between px-2 py-1.5 rounded border text-[11px] ${csBg[item.status]}`}>
                  <div className="flex items-center gap-1.5"><CsIcon s={item.status} /><span className="text-foreground">{item.label}</span></div>
                  <div className="flex items-center gap-2">
                    {item.detail && <span className="text-muted-foreground text-[10px] font-mono">{item.detail}</span>}
                    <span className={`text-[10px] font-bold font-mono ${csColor[item.status]}`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Traction motors */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Traction Motors</div>
            <div className="grid grid-cols-4 gap-1.5">
              {c.tractionMotors.map(tm => (
                <div key={tm.id} className={`rounded border p-2 text-center ${csBg[tm.status]}`}>
                  <div className="text-[9px] text-muted-foreground font-mono mb-1">{tm.id}</div>
                  <CsIcon s={tm.status} />
                  <div className={`text-xs font-bold font-mono mt-1 ${csColor[tm.status]}`}>{tm.tempC}°C</div>
                  <div className="text-[9px] text-muted-foreground">{tm.currentAmps}A</div>
                  {tm.faultCode && <div className="text-[8px] text-red-400 mt-0.5">{tm.faultCode}</div>}
                </div>
              ))}
            </div>
          </div>
          {/* Wheel readings */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Wheel Profile &amp; Bearing Temps</div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1,2,3,4].map(axle => {
                const left = c.wheelReadings.find(w => w.axle === axle && w.side === "LEFT");
                const right = c.wheelReadings.find(w => w.axle === axle && w.side === "RIGHT");
                return (
                  <div key={axle} className="bg-muted/30 rounded border border-border p-2">
                    <div className="text-[9px] text-muted-foreground text-center mb-1.5 font-mono">Axle {axle}</div>
                    {[left, right].map((w, i) => w && (
                      <div key={i} className={`flex items-center justify-between px-1.5 py-0.5 rounded mb-1 border ${csBg[w.status]}`}>
                        <span className="text-[9px] text-muted-foreground font-mono">{i === 0 ? "L" : "R"}</span>
                        <span className={`text-[10px] font-bold font-mono ${csColor[w.status]}`}>{w.tempC}°C</span>
                      </div>
                    ))}
                    {left && <div className="text-[8px] text-muted-foreground mt-1"><div>Wear: {left.wornMm}mm</div><div>Rim: {left.rimThicknessMm}mm</div></div>}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Fluids */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Fluids &amp; Consumables</div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "Fuel", value: `${c.fuelLevelPct}%`, sub: `${c.fuelLevelGallons.toLocaleString()} gal`, status: (c.fuelLevelPct < 25 ? "FAULT" : c.fuelLevelPct < 40 ? "WARNING" : "OK") as ComponentStatus },
                { label: "Oil", value: c.oilLevelStatus, sub: `${c.oilPressureKPa} kPa`, status: c.oilLevelStatus },
                { label: "Coolant", value: c.coolantLevelStatus, sub: `${c.coolantTempC}°C`, status: c.coolantLevelStatus },
                { label: "Sand", value: `${c.sandLevelPct}%`, sub: "Sanding", status: (c.sandLevelPct < 20 ? "WARNING" : "OK") as ComponentStatus },
              ].map(item => (
                <div key={item.label} className={`rounded border p-2 text-center ${csBg[item.status]}`}>
                  <div className="text-[9px] text-muted-foreground mb-1">{item.label}</div>
                  <div className={`text-xs font-bold font-mono ${csColor[item.status]}`}>{item.value}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Consist Tab ──────────────────────────────────────────────────────────────
function ConsistTab({ trainJourneyId, legacyConsist }: { trainJourneyId: string; legacyConsist: CarDetail[] }) {
  const [carTab, setCarTab] = useState<"locos" | "cars">("locos");
  // Map journeyData train IDs (e.g. "CN 3864") to fleet IDs (e.g. "CN-Q11451-05")
  const fleetTrain = FLEET_SNAPSHOT.find(t =>
    t.locos.some(l => l === trainJourneyId) ||
    t.id === trainJourneyId ||
    t.symbol === trainJourneyId
  );
  const locos = fleetTrain ? getLocosForTrain(fleetTrain.id) : [];
  const cars = fleetTrain ? getCarsForTrain(fleetTrain.id) : [];

  // Consist visual strip
  const allUnits = [
    ...locos.filter(l => l.position === "LEAD" || l.position === "TRAIL").sort((a,b) => a.positionInConsist - b.positionInConsist),
    ...Array.from({ length: Math.min(fleetTrain?.cars ?? legacyConsist.filter(c => c.type === "car").length, 20) }, (_, i) => ({ type: "car" as const, num: i + 1 })),
    ...locos.filter(l => l.position.startsWith("DPU")),
  ];

  return (
    <div>
      {/* Consist summary header */}
      <div className="flex items-center gap-4 mb-4 px-3 py-2.5 rounded border border-border bg-muted/20">
        <Train size={14} className="text-muted-foreground" />
        <div className="flex-1">
          <div className="text-xs font-bold text-foreground">
            {fleetTrain ? fleetTrain.symbol : trainJourneyId}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {locos.length > 0 ? `${locos.length} locomotive${locos.length > 1 ? "s" : ""} · ` : ""}
            {fleetTrain ? `${fleetTrain.cars} cars · ${(fleetTrain.weight/1000).toFixed(0)}K tons · ${fleetTrain.length.toLocaleString()} ft` : `${legacyConsist.filter(c=>c.type==="car").length} cars`}
          </div>
        </div>
        {locos.length > 0 && (
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Road Numbers</div>
            <div className="text-[10px] font-mono text-foreground">{locos.map(l => l.roadNumber).join(" · ")}</div>
          </div>
        )}
      </div>

      {/* Visual consist strip */}
      <div className="flex items-center gap-0.5 mb-5 overflow-x-auto pb-2 px-1">
        {locos.filter(l => l.position !== "DPU_REAR" && l.position !== "DPU_MID").map(l => (
          <div key={l.roadNumber} className="flex flex-col items-center flex-shrink-0">
            <div className={`w-16 h-9 rounded border-2 flex flex-col items-center justify-center text-[8px] font-mono ${
              l.position === "LEAD" ? "border-blue-500/70 bg-blue-500/15" : "border-slate-500/50 bg-slate-800/60"
            }`}>
              <span className={l.position === "LEAD" ? "text-blue-300" : "text-slate-400"}>{l.position === "LEAD" ? "LEAD" : "TRAIL"}</span>
              <span className="text-slate-500 text-[7px]">{l.roadNumber.split(" ")[1]}</span>
            </div>
          </div>
        ))}
        {/* Car blocks (show up to 30 representative blocks) */}
        {Array.from({ length: Math.min(fleetTrain?.cars ?? 10, 30) }).map((_, i) => (
          <div key={`car-${i}`} className="w-5 h-9 rounded border border-slate-700/40 bg-slate-800/40 flex-shrink-0" />
        ))}
        {(fleetTrain?.cars ?? 0) > 30 && (
          <div className="flex-shrink-0 text-[8px] text-muted-foreground px-1">+{(fleetTrain?.cars ?? 0) - 30} more</div>
        )}
        {locos.filter(l => l.position.startsWith("DPU")).map(l => (
          <div key={l.roadNumber} className="flex flex-col items-center flex-shrink-0">
            <div className="w-16 h-9 rounded border-2 border-purple-500/60 bg-purple-500/10 flex flex-col items-center justify-center text-[8px] font-mono">
              <span className="text-purple-300">DPU</span>
              <span className="text-slate-500 text-[7px]">{l.roadNumber.split(" ")[1]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tabs: Locomotives / Cars */}
      <div className="flex gap-1 mb-4">
        {(["locos", "cars"] as const).map(t => (
          <button key={t} onClick={() => setCarTab(t)}
            className={`px-3 py-1.5 rounded text-xs border transition-colors ${
              carTab === t ? "bg-[#D22630]/20 border-[#D22630]/40 text-foreground" : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
            }`}>
            {t === "locos" ? `Locomotives (${locos.length > 0 ? locos.length : legacyConsist.filter(c=>c.type!=="car").length})` : `Cars (${fleetTrain?.cars ?? legacyConsist.filter(c=>c.type==="car").length})`}
          </button>
        ))}
      </div>

      {/* Locomotives panel */}
      {carTab === "locos" && (
        <div>
          {locos.length > 0 ? (
            locos.map(l => <LocoDetailCard key={l.roadNumber + l.positionInConsist} loco={l} />)
          ) : (
            // Fallback to legacy consist for locos
            <div>
              <div className="text-[10px] text-muted-foreground mb-2">Showing legacy consist data — detailed component telemetry not available for this train.</div>
              {legacyConsist.filter(c => c.type !== "car").map(car => <CarCard key={car.id} car={car} />)}
            </div>
          )}
        </div>
      )}

      {/* Cars panel */}
      {carTab === "cars" && (
        <div>
          {cars.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">Showing {cars.length} of {fleetTrain?.cars ?? cars.length} cars with detailed records</div>
              {cars.map(car => (
                <div key={car.carId} className={`rounded border px-3 py-2 text-[11px] ${
                  car.lastDetectorResult === "ALARM" ? "border-red-500/30 bg-red-500/8" :
                  car.lastDetectorResult === "WARNING" ? "border-amber-500/30 bg-amber-500/8" :
                  car.lastABTResult === "FAIL" ? "border-red-500/20 bg-red-500/5" :
                  "border-border bg-muted/20"
                }`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-bold text-foreground">{car.carId}</span>
                    <span className="text-[10px] text-muted-foreground">{car.carType.replace(/_/g, " ")}</span>
                    {car.hazmat && <span className="text-[9px] px-1.5 py-0.5 rounded border border-orange-500/40 bg-orange-500/10 text-orange-400">HAZMAT {car.hazmatClass}</span>}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                      car.loadStatus === "LOADED" ? "border-sky-500/30 bg-sky-500/10 text-sky-400" : "border-slate-600/30 bg-slate-800/40 text-slate-500"
                    }`}>{car.loadStatus}{car.commodity ? ` — ${car.commodity}` : ""}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Pos #{car.positionInConsist}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                    <span>Owner: <span className="text-foreground font-mono">{car.reportingMark}</span> ({car.ownerRailroad})</span>
                    <span>Weight: <span className="text-foreground font-mono">{car.grossWeightTons}T</span></span>
                    <span>ABT: <span className={car.lastABTResult === "PASS" ? "text-emerald-400" : car.lastABTResult === "FAIL" ? "text-red-400" : "text-muted-foreground"}>{car.lastABTResult}</span></span>
                    <span>Detector: <span className={car.lastDetectorResult === "ALARM" ? "text-red-400" : car.lastDetectorResult === "WARNING" ? "text-amber-400" : car.lastDetectorResult === "CLEAR" ? "text-emerald-400" : "text-muted-foreground"}>{car.lastDetectorResult}</span></span>
                    {car.lastDetectorMp && <span>MP {car.lastDetectorMp}</span>}
                    <span>→ {car.destinationYard}</span>
                  </div>
                  {car.notes && (
                    <div className="mt-1.5 text-[10px] text-amber-300 flex items-start gap-1">
                      <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />{car.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Fallback to legacy consist cars
            <div>
              <div className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">Showing legacy consist data</div>
              {legacyConsist.filter(c => c.type === "car").map(car => <CarCard key={car.id} car={car} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TrainJourney() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubdiv, setSelectedSubdiv] = useState("All");
  const [selectedDate, setSelectedDate] = useState("2025-05-04");
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>("CN 3864");
  const [activeTab, setActiveTab] = useState<"onboard" | "consist" | "wayside" | "backoffice" | "ptc">("onboard");

  // Filter trains by search, subdivision, date
  const filteredTrains = useMemo(() => {
    return TRAINS.filter((t) => {
      const matchSearch =
        !searchTerm ||
        t.trainId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.leadLoco.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSubdiv = selectedSubdiv === "All" || t.subdivision === selectedSubdiv;
      const matchDate = !selectedDate || t.date === selectedDate;
      return matchSearch && matchSubdiv && matchDate;
    });
  }, [searchTerm, selectedSubdiv, selectedDate]);

  const train: TrainRecord | undefined = useMemo(
    () => filteredTrains.find((t) => t.trainId === selectedTrainId) ?? filteredTrains[0],
    [filteredTrains, selectedTrainId]
  );

  const ptcColor = train?.ptcState === "ACTIVE" ? "text-emerald-400" : train?.ptcState === "STOPPED" ? "text-amber-400" : "text-slate-400";

  const tabs = [
    { id: "onboard",    label: "Onboard Systems",  icon: <Cpu size={13} /> },
    { id: "consist",    label: "Consist & Wheels",  icon: <Train size={13} /> },
    { id: "wayside",    label: "Wayside Events",    icon: <MapPin size={13} /> },
    { id: "backoffice", label: "Back-Office Log",   icon: <GitBranch size={13} /> },
    { id: "ptc",        label: "KES / BOS / PTC",   icon: <Key size={13} /> },
  ] as const;

  return (
    <Layout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Train Journey View
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            End-to-end movement observability — Onboard · Wayside · Back-Office · Consist
          </p>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left Panel: Train Selector ── */}
          <div className="w-72 flex-shrink-0 border-r border-border flex flex-col overflow-hidden">
            {/* Search & Filters */}
            <div className="p-3 border-b border-border space-y-2 flex-shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search train or loco…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#D22630]/50"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedSubdiv}
                  onChange={(e) => setSelectedSubdiv(e.target.value)}
                  className="flex-1 bg-muted/50 border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#D22630]/50"
                >
                  <option value="All">All Subdivisions</option>
                  {SUBDIVISIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 bg-muted/50 border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#D22630]/50"
                />
              </div>
              <div className="text-[10px] text-muted-foreground">{filteredTrains.length} train{filteredTrains.length !== 1 ? "s" : ""} found</div>
            </div>

            {/* Train List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredTrains.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-8">No trains match your filters</div>
              )}
              {filteredTrains.map((t) => {
                const isSelected = train?.trainId === t.trainId;
                const hasIssue = t.onboard.some((c) => c.health === "critical" || c.health === "warning");
                const hasCritical = t.onboard.some((c) => c.health === "critical");
                const dotColor = hasCritical ? "bg-red-400" : hasIssue ? "bg-amber-400" : "bg-emerald-400";
                return (
                  <button
                    key={t.trainId}
                    onClick={() => setSelectedTrainId(t.trainId)}
                    className={`w-full text-left rounded p-2.5 border transition-colors ${
                      isSelected
                        ? "bg-[#D22630]/15 border-[#D22630]/40"
                        : "bg-muted/30 border-border hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                      <span className="text-sm font-bold text-foreground font-mono">{t.trainId}</span>
                      <span className={`text-[10px] ml-auto font-mono ${t.ptcState === "ACTIVE" ? "text-emerald-400" : "text-amber-400"}`}>
                        {t.ptcState}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground pl-4">
                      <div>{t.subdivision} Sub · MP {t.currentMp}</div>
                      <div className="mt-0.5">{t.leadLoco} · {t.speedMph} mph · {t.startTime}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right Panel: Train Detail ── */}
          {train ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Train Header */}
              <div className="px-5 py-3 border-b border-border flex-shrink-0 bg-muted/20">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-foreground font-mono" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                        {train.trainId}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${healthBg[train.ptcState === "ACTIVE" ? "healthy" : "warning"]} ${ptcColor}`}>
                        PTC {train.ptcState}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Lead: {train.leadLoco} · {train.subdivision} Sub · MP {train.currentMp} · {train.speedMph} mph · Departed {train.startTime}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="text-center">
                      <div className="text-foreground font-bold font-mono">{train.consist.length}</div>
                      <div>Units</div>
                    </div>
                    <div className="text-center">
                      <div className="text-foreground font-bold font-mono">{train.waysideEvents.length}</div>
                      <div>Wayside</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-bold font-mono ${train.onboard.some(c => c.health === "critical") ? "text-red-400" : train.onboard.some(c => c.health === "warning") ? "text-amber-400" : "text-emerald-400"}`}>
                        {train.onboard.filter(c => c.health !== "healthy").length > 0
                          ? `${train.onboard.filter(c => c.health !== "healthy").length} Alert${train.onboard.filter(c => c.health !== "healthy").length > 1 ? "s" : ""}`
                          : "All Clear"}
                      </div>
                      <div>Status</div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-3">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
                        activeTab === tab.id
                          ? "bg-[#D22630]/20 text-foreground border border-[#D22630]/40"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-5">

                {/* ── Onboard Systems ── */}
                {activeTab === "onboard" && (
                  <div className="grid grid-cols-2 gap-3">
                    {train.onboard.map((comp) => (
                      <div key={comp.id} className={`rounded border p-3 ${healthBg[comp.health]}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <HealthIcon h={comp.health} size={14} />
                          <span className="text-xs font-bold text-foreground">{comp.name}</span>
                          <span className={`ml-auto text-[10px] font-mono font-bold ${healthColor[comp.health]}`}>{comp.metric}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 leading-relaxed">{comp.detail}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Consist & Wheels ── */}
                {activeTab === "consist" && (
                  <ConsistTab trainJourneyId={train.trainId} legacyConsist={train.consist} />
                )}

                {/* ── Wayside Events ── */}
                {activeTab === "wayside" && (
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                      {train.waysideEvents.length} infrastructure interactions · {train.subdivision} Subdivision
                    </div>
                    <div className="relative">
                      <div className="absolute left-[22px] top-0 bottom-0 w-px bg-slate-700/60" />
                      {train.waysideEvents.map((ev, i) => (
                        <div key={i} className="flex gap-4 mb-4 relative">
                          <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${
                            ev.status === "critical" ? "border-red-500/60 bg-red-500/10 text-red-400" :
                            ev.status === "warning" ? "border-amber-500/60 bg-amber-500/10 text-amber-400" :
                            "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {waysideIcon[ev.type]}
                          </div>
                          <div className={`flex-1 rounded border p-3 ${healthBg[ev.status]}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-xs font-bold text-foreground">{ev.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  MP {ev.milepost} · {ev.subdivision} · {ev.time}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {ev.latencyMs && (
                                  <span className={`text-[10px] font-mono ${ev.latencyMs > 3000 ? "text-red-400" : ev.latencyMs > 1000 ? "text-amber-400" : "text-emerald-400"}`}>
                                    {ev.latencyMs >= 1000 ? `${(ev.latencyMs / 1000).toFixed(1)}s` : `${ev.latencyMs}ms`}
                                  </span>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${healthBg[ev.backOfficeAck ? "healthy" : "critical"]} ${healthColor[ev.backOfficeAck ? "healthy" : "critical"]}`}>
                                  {ev.backOfficeAck ? "BOS ACK" : "NO ACK"}
                                </span>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{ev.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Back-Office Log ── */}
                {activeTab === "backoffice" && (
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                      Chronological system interaction log · KES → CI BOS → G BOS → PDS → ITCM → BOS → CARMA
                    </div>
                    <div className="space-y-2">
                      {train.backOfficeEvents.map((ev, i) => (
                        <div key={i} className={`flex gap-3 items-start rounded border p-3 ${healthBg[ev.status]}`}>
                          <div className="flex-shrink-0 mt-0.5">
                            <HealthIcon h={ev.status} size={13} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-700/60 px-1.5 py-0.5 rounded">{ev.system}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{ev.time}</span>
                              {ev.latencyMs && (
                                <span className={`text-[10px] font-mono ${ev.latencyMs > 10000 ? "text-red-400" : ev.latencyMs > 3000 ? "text-amber-400" : "text-slate-500"}`}>
                                  {ev.latencyMs >= 1000 ? `${(ev.latencyMs / 1000).toFixed(1)}s` : `${ev.latencyMs}ms`}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-300 mt-1">{ev.event}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── KES / BOS / PTC Lifecycle ── */}
                {activeTab === "ptc" && (() => {
                  // Find lifecycle data for this train — match by symbol fragment
                  const ptcData = PTC_LIFECYCLES.find(p =>
                    train.trainId.includes(p.symbol.split('-')[0]) ||
                    p.trainId.includes(train.trainId.replace('CN ','').replace(' ','')) ||
                    p.symbol.replace('-05','').toLowerCase().includes(train.trainId.toLowerCase().replace('cn ','').replace(' ','').slice(0,4))
                  ) ?? PTC_LIFECYCLES[0];

                  const stepStatusIcon = (s: PTCLifecycleStep['status']) => {
                    if (s === 'COMPLETE')    return <CheckCircle size={13} className="text-emerald-400"/>;
                    if (s === 'IN_PROGRESS') return <RefreshCw size={13} className="text-sky-400 animate-spin" style={{animationDuration:'3s'}}/>;
                    if (s === 'FAILED')      return <XCircle size={13} className="text-red-400"/>;
                    if (s === 'PENDING')     return <Clock size={13} className="text-muted-foreground"/>;
                    return <Clock size={13} className="text-muted-foreground"/>;
                  };

                  const systemColor: Record<string, string> = {
                    'I-ETMS': 'text-sky-400 bg-sky-500/10',
                    'KES':    'text-violet-400 bg-violet-500/10',
                    'BOS':    'text-emerald-400 bg-emerald-500/10',
                    'PDS':    'text-blue-400 bg-blue-500/10',
                    'ITCM':   'text-amber-400 bg-amber-500/10',
                    'GCP':    'text-orange-400 bg-orange-500/10',
                    'CARMA':  'text-red-400 bg-red-500/10',
                  };

                  const kesStatusCfg: Record<string, { color: string; bg: string }> = {
                    VALID:    { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                    EXPIRING: { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
                    EXPIRED:  { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30' },
                    REVOKED:  { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30' },
                  };
                  const kesCfg = kesStatusCfg[ptcData.kesStatus] ?? kesStatusCfg.VALID;
                  const overallCfg: Record<string, string> = {
                    NOMINAL:      'text-emerald-400',
                    DEGRADED:     'text-amber-400',
                    FAILED:       'text-red-400',
                    INITIALIZING: 'text-sky-400',
                  };

                  return (
                    <div className="space-y-4">
                      {/* Context banner */}
                      <div className="rounded border border-sky-500/20 bg-sky-500/5 p-3 flex items-start gap-2">
                        <Key size={12} className="text-sky-400 mt-0.5 flex-shrink-0"/>
                        <div className="text-[10px] text-muted-foreground leading-relaxed">
                          <span className="text-sky-400 font-semibold">KES / BOS / PTC context: </span>
                          The PTC lifecycle begins with the I-ETMS onboard computer requesting cryptographic keys from the <strong className="text-foreground">Key Exchange Server (KES)</strong>. Once keys are validated, the locomotive registers with the <strong className="text-foreground">Back Office Server (BOS)</strong>, downloads the subdivision track database, and requests a Movement Authority (MA) from the <strong className="text-foreground">Positive Train Control Dispatch Server (PDS)</strong>. The BOS continuously receives position reports every 30 seconds. Any communication failure triggers a restricted MA and may result in a mandatory stop.
                        </div>
                      </div>

                      {/* Status summary row */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="rounded border border-border bg-card p-3">
                          <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">PTC Overall</div>
                          <div className={`text-sm font-bold ${overallCfg[ptcData.overallStatus]}`}>{ptcData.overallStatus}</div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">Updated {ptcData.lastUpdated.split(' ')[1]}</div>
                        </div>
                        <div className={`rounded border p-3 ${kesCfg.bg}`}>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">KES Keys</div>
                          <div className={`text-sm font-bold ${kesCfg.color}`}>{ptcData.kesStatus}</div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">Expires {ptcData.keysExpiresAt.split(' ')[1]}</div>
                        </div>
                        <div className="rounded border border-border bg-card p-3">
                          <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">BOS Instance</div>
                          <div className="text-xs font-bold text-foreground truncate">{ptcData.bosInstance}</div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">{ptcData.bosRegion}</div>
                        </div>
                        {ptcData.movementAuthority ? (
                          <div className={`rounded border p-3 ${
                            ptcData.movementAuthority.status === 'ACTIVE' ? 'border-emerald-500/30 bg-emerald-500/10' :
                            ptcData.movementAuthority.status === 'EXPIRED' ? 'border-red-500/30 bg-red-500/10' :
                            'border-border bg-card'
                          }`}>
                            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Movement Authority</div>
                            <div className="text-xs font-bold text-foreground mono">{ptcData.movementAuthority.maId}</div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">MP {ptcData.movementAuthority.fromMp} → {ptcData.movementAuthority.toMp}</div>
                          </div>
                        ) : (
                          <div className="rounded border border-border bg-card p-3">
                            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Movement Authority</div>
                            <div className="text-xs text-muted-foreground">No active MA</div>
                          </div>
                        )}
                      </div>

                      {/* MA detail */}
                      {ptcData.movementAuthority && (
                        <div className="rounded border border-border bg-card p-3">
                          <div className="text-[10px] font-semibold text-foreground mb-2 flex items-center gap-2">
                            <Navigation size={11} className="text-sky-400"/>
                            Movement Authority Detail
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-[10px]">
                            <div><span className="text-muted-foreground">MA ID: </span><span className="mono text-foreground">{ptcData.movementAuthority.maId}</span></div>
                            <div><span className="text-muted-foreground">From MP: </span><span className="mono text-foreground">{ptcData.movementAuthority.fromMp}</span></div>
                            <div><span className="text-muted-foreground">To MP: </span><span className="mono text-foreground">{ptcData.movementAuthority.toMp}</span></div>
                            <div><span className="text-muted-foreground">Issued: </span><span className="mono text-foreground">{ptcData.movementAuthority.issuedAt.split(' ')[1]}</span></div>
                            <div><span className="text-muted-foreground">Expires: </span><span className="mono text-foreground">{ptcData.movementAuthority.expiresAt.split(' ')[1]}</span></div>
                            <div><span className="text-muted-foreground">Issued by: </span><span className="text-foreground">{ptcData.movementAuthority.issuedBy}</span></div>
                          </div>
                        </div>
                      )}

                      {/* Lifecycle steps */}
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">PTC Initialization & Runtime Lifecycle</div>
                        <div className="relative">
                          <div className="absolute left-[22px] top-0 bottom-0 w-px bg-slate-700/40"/>
                          <div className="space-y-2">
                            {ptcData.steps.map((step) => {
                              const sysClasses = systemColor[step.system] ?? 'text-muted-foreground bg-zinc-500/10';
                              const latencyDelta = step.latencyMs && step.latencyBaselineMs
                                ? step.latencyMs - step.latencyBaselineMs
                                : null;
                              const latencyColor = latencyDelta === null ? '' :
                                latencyDelta > 2000 ? 'text-red-400' :
                                latencyDelta > 500  ? 'text-amber-400' : 'text-emerald-400';

                              return (
                                <div key={step.seq} className={`flex gap-3 items-start relative ${
                                  step.status === 'FAILED' ? 'bg-red-500/5 border border-red-500/20 rounded p-2' :
                                  step.status === 'IN_PROGRESS' ? 'bg-sky-500/5 border border-sky-500/20 rounded p-2' : 'p-1'
                                }`}>
                                  <div className="w-11 h-11 rounded-full border flex items-center justify-center flex-shrink-0 z-10 bg-background border-border">
                                    {stepStatusIcon(step.status)}
                                  </div>
                                  <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sysClasses}`}>{step.system}</span>
                                      <span className="text-[10px] font-semibold text-foreground">{step.stepName}</span>
                                      {step.timestamp && <span className="text-[9px] mono text-muted-foreground">{step.timestamp.split(' ')[1]}</span>}
                                      {step.latencyMs !== undefined && (
                                        <span className={`text-[9px] mono ${latencyColor}`}>
                                          {step.latencyMs >= 1000 ? `${(step.latencyMs/1000).toFixed(1)}s` : `${step.latencyMs}ms`}
                                          {latencyDelta !== null && latencyDelta !== 0 && (
                                            <span className="ml-0.5">({latencyDelta > 0 ? '+' : ''}{latencyDelta}ms vs baseline)</span>
                                          )}
                                        </span>
                                      )}
                                      {step.retryCount !== undefined && step.retryCount > 0 && (
                                        <span className="text-[9px] text-amber-400">{step.retryCount} retries</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground leading-relaxed">{step.description}</div>
                                    {step.detail && (
                                      <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{step.detail}</div>
                                    )}
                                    {step.errorCode && (
                                      <div className="mt-1 p-1.5 rounded bg-red-500/10 border border-red-500/20">
                                        <span className="text-[9px] font-bold mono text-red-400">{step.errorCode}</span>
                                        <span className="text-[9px] text-red-300 ml-2">{step.errorMessage}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* KES key detail */}
                      <div className="rounded border border-border bg-card p-3">
                        <div className="text-[10px] font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Lock size={11} className="text-violet-400"/>
                          KES Key Details
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[10px]">
                          <div><span className="text-muted-foreground">Issued at: </span><span className="mono text-foreground">{ptcData.keysIssuedAt}</span></div>
                          <div><span className="text-muted-foreground">Expires at: </span><span className={`mono font-bold ${kesCfg.color}`}>{ptcData.keysExpiresAt}</span></div>
                          <div><span className="text-muted-foreground">Status: </span><span className={`font-bold ${kesCfg.color}`}>{ptcData.kesStatus}</span></div>
                          <div><span className="text-muted-foreground">BOS Region: </span><span className="text-foreground">{ptcData.bosRegion}</span></div>
                        </div>
                        <div className="mt-2 p-2 rounded bg-border/20 text-[10px] text-muted-foreground leading-relaxed">
                          Keys are issued by the KES to the I-ETMS onboard computer at the start of each trip. They are valid for 24 hours and are used to encrypt all communications between the locomotive and the BOS. If keys expire or are revoked, the locomotive must stop and request new keys before movement can resume under PTC enforcement.
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              No trains match your current filters
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

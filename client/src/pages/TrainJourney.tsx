import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { TRAINS, SUBDIVISIONS, type TrainRecord, type CarDetail, type WheelReading, type DetectorReading, type Health } from "@/lib/journeyData";
import { getCarRecord, RAILROAD_LABELS, RAILROAD_COLORS, type CarRecord } from "@/lib/carRegistry";
import {
  Search, ChevronDown, ChevronRight, Train, Radio, Cpu, MapPin,
  AlertTriangle, CheckCircle, XCircle, Clock, Zap, Activity,
  Thermometer, RotateCcw, Shield, Navigation, Server, GitBranch,
  Waves, Gauge, Scan, Ear, Wrench, TrendingUp
} from "lucide-react";

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
                  ? `bg-slate-700 border-slate-500 ${meta?.color ?? "text-white"}`
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
              <span className={DETECTOR_META[active.detectorType]?.color ?? "text-white"}>
                {DETECTOR_META[active.detectorType]?.icon}
              </span>
              <span className="text-xs font-medium text-white">{DETECTOR_META[active.detectorType]?.label} Detector</span>
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
            <span className="text-sm font-mono text-white font-medium">{car.number}</span>
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
                              <span className="font-semibold text-white font-mono">{ev.detectorType}</span>
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
                              Train <span className="font-mono text-white">{ev.trainId}</span> · {ev.subdivision} Sub · MP {ev.milepost}
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
                            <span className="font-mono font-semibold text-white">{ch.trainId}</span>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TrainJourney() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubdiv, setSelectedSubdiv] = useState("All");
  const [selectedDate, setSelectedDate] = useState("2025-05-04");
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>("CN 3864");
  const [activeTab, setActiveTab] = useState<"onboard" | "consist" | "wayside" | "backoffice">("onboard");

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
    { id: "onboard", label: "Onboard Systems", icon: <Cpu size={13} /> },
    { id: "consist", label: "Consist & Wheels", icon: <Train size={13} /> },
    { id: "wayside", label: "Wayside Events", icon: <MapPin size={13} /> },
    { id: "backoffice", label: "Back-Office Log", icon: <GitBranch size={13} /> },
  ] as const;

  return (
    <Layout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
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
                      <span className="text-sm font-bold text-white font-mono">{t.trainId}</span>
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
                      <span className="text-lg font-bold text-white font-mono" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
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
                      <div className="text-white font-bold font-mono">{train.consist.length}</div>
                      <div>Units</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-bold font-mono">{train.waysideEvents.length}</div>
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
                          ? "bg-[#D22630]/20 text-white border border-[#D22630]/40"
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
                          <span className="text-xs font-bold text-white">{comp.name}</span>
                          <span className={`ml-auto text-[10px] font-mono font-bold ${healthColor[comp.health]}`}>{comp.metric}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 leading-relaxed">{comp.detail}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Consist & Wheels ── */}
                {activeTab === "consist" && (
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
                      {train.consist.length} units · Click any unit to expand wheel bearing readings
                    </div>
                    {/* Visual consist strip */}
                    <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-2">
                      {train.consist.map((car, i) => (
                        <div key={car.id} className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-14 h-8 rounded border-2 flex items-center justify-center text-[9px] font-mono ${
                            car.type === "lead" ? "border-blue-500/60 bg-blue-500/10" :
                            car.type === "dpu" ? "border-purple-500/60 bg-purple-500/10" :
                            `border-${car.health === "critical" ? "red" : car.health === "warning" ? "amber" : "slate"}-500/40 bg-slate-800/60`
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${healthDot[car.health]}`} />
                            <span className="text-slate-300">{car.type === "lead" ? "LOCO" : car.type === "dpu" ? "DPU" : `C${i - train.consist.filter(c => c.type !== "car").length + 1}`}</span>
                          </div>
                          <div className="text-[8px] text-slate-600 mt-0.5 text-center w-14 truncate">{car.number.split(" ")[1]}</div>
                          {i < train.consist.length - 1 && (
                            <div className="absolute" />
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Car detail cards */}
                    {train.consist.map((car) => (
                      <CarCard key={car.id} car={car} />
                    ))}
                  </div>
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
                                <div className="text-xs font-bold text-white">{ev.name}</div>
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

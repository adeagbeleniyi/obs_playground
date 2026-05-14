import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { assets } from "@/lib/mockData";
import { LOCOMOTIVE_DETAILS, CAR_RECORDS, getLocosForTrain, type LocomotiveDetail, type ComponentStatus } from "@/lib/consistData";
import { FLEET_SNAPSHOT } from "@/lib/fleetData";
import { Train, Radio, MapPin, Clock, Cpu, Satellite, Search, Filter, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle, Thermometer, Zap, Gauge, Fuel, Wind, Wrench } from "lucide-react";

// ─── Status helpers ────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
  warning: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  info: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  operational: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};
const statusDot: Record<string, string> = {
  critical: "bg-red-500 shadow-[0_0_6px_#ef4444]",
  warning: "bg-amber-500",
  info: "bg-sky-400",
  operational: "bg-emerald-500 shadow-[0_0_6px_#10b981]",
};
const typeIcon: Record<string, React.ReactNode> = {
  locomotive: <Train size={14} />,
  wayside: <MapPin size={14} />,
  crossing: <MapPin size={14} />,
  atip: <Satellite size={14} />,
  radio: <Radio size={14} />,
  server: <Cpu size={14} />,
};

// ─── Component status helpers ──────────────────────────────────────────────────
const compStatusColor: Record<ComponentStatus, string> = {
  OK:      "text-emerald-400",
  WARNING: "text-amber-400",
  FAULT:   "text-red-400",
  UNKNOWN: "text-slate-500",
};
const compStatusBg: Record<ComponentStatus, string> = {
  OK:      "bg-emerald-500/10 border-emerald-500/25",
  WARNING: "bg-amber-500/10 border-amber-500/25",
  FAULT:   "bg-red-500/10 border-red-500/25",
  UNKNOWN: "bg-slate-800/40 border-slate-700/30",
};
const CompIcon = ({ s }: { s: ComponentStatus }) => {
  if (s === "OK")      return <CheckCircle size={11} className="text-emerald-400" />;
  if (s === "WARNING") return <AlertTriangle size={11} className="text-amber-400" />;
  if (s === "FAULT")   return <XCircle size={11} className="text-red-400" />;
  return <Clock size={11} className="text-slate-500" />;
};

// ─── Locomotive Consist Card ───────────────────────────────────────────────────
function LocoConsistCard({ loco }: { loco: LocomotiveDetail }) {
  const [open, setOpen] = useState(false);
  const c = loco.components;

  const posLabel = loco.position === "LEAD" ? "Lead" : loco.position === "TRAIL" ? "Trail" : loco.position === "DPU_REAR" ? "DPU Rear" : loco.position === "DPU_MID" ? "DPU Mid" : "Helper";
  const posColor = loco.position === "LEAD" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" : loco.position.startsWith("DPU") ? "text-purple-400 border-purple-500/30 bg-purple-500/10" : "text-slate-400 border-slate-500/30 bg-slate-800/40";

  const overallStatus: ComponentStatus =
    loco.activeAlarms.length > 0 ? "FAULT" :
    c.tractionMotors.some(m => m.status === "WARNING") || c.wheelReadings.some(w => w.status === "WARNING") ? "WARNING" : "OK";

  const fuelColor = c.fuelLevelPct < 25 ? "text-red-400" : c.fuelLevelPct < 40 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className={`rounded border mb-2 ${compStatusBg[overallStatus]}`}>
      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left" onClick={() => setOpen(v => !v)}>
        <CompIcon s={overallStatus} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-bold text-foreground">{loco.roadNumber}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${posColor}`}>{posLabel}</span>
            <span className="text-[10px] text-muted-foreground">#{loco.positionInConsist}</span>
            <span className="text-[10px] text-muted-foreground">{loco.model}</span>
            {loco.activeAlarms.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400 ml-auto">{loco.activeAlarms.length} ALARM{loco.activeAlarms.length > 1 ? "S" : ""}</span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {loco.horsepower.toLocaleString()} HP · {loco.axles} axles · Built {loco.builtYear} · {loco.milesSinceShop.toLocaleString()} mi since shop
          </div>
        </div>
        <div className={`text-xs font-mono font-bold mr-2 ${fuelColor}`}>{c.fuelLevelPct}% fuel</div>
        {open ? <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={13} className="text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-border/40 space-y-4 pt-3">
          {/* Active alarms */}
          {loco.activeAlarms.length > 0 && (
            <div className="space-y-1">
              {loco.activeAlarms.map((a, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded border border-red-500/30 bg-red-500/10 text-[11px] text-red-300">
                  <AlertTriangle size={11} className="text-red-400 mt-0.5 flex-shrink-0" />
                  {a}
                </div>
              ))}
            </div>
          )}

          {/* Component health grid */}
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
                { label: "Headlights", status: c.headlightStatus, detail: "" },
                { label: "Horn / Bell", status: c.hornStatus === "OK" && c.bellStatus === "OK" ? "OK" as ComponentStatus : "WARNING" as ComponentStatus, detail: "" },
              ].map(item => (
                <div key={item.label} className={`flex items-center justify-between px-2 py-1.5 rounded border text-[11px] ${compStatusBg[item.status]}`}>
                  <div className="flex items-center gap-1.5">
                    <CompIcon s={item.status} />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.detail && <span className="text-muted-foreground text-[10px] font-mono">{item.detail}</span>}
                    <span className={`text-[10px] font-bold font-mono ${compStatusColor[item.status]}`}>{item.status}</span>
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
                <div key={tm.id} className={`rounded border p-2 text-center ${compStatusBg[tm.status]}`}>
                  <div className="text-[9px] text-muted-foreground font-mono mb-1">{tm.id}</div>
                  <CompIcon s={tm.status} />
                  <div className={`text-xs font-bold font-mono mt-1 ${compStatusColor[tm.status]}`}>{tm.tempC}°C</div>
                  <div className="text-[9px] text-muted-foreground">{tm.currentAmps}A</div>
                  {tm.faultCode && <div className="text-[8px] text-red-400 mt-0.5">{tm.faultCode}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Wheel readings */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Wheel Readings — Profile &amp; Bearing Temp</div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map(axle => {
                const left  = c.wheelReadings.find(w => w.axle === axle && w.side === "LEFT");
                const right = c.wheelReadings.find(w => w.axle === axle && w.side === "RIGHT");
                return (
                  <div key={axle} className="bg-muted/30 rounded border border-border p-2">
                    <div className="text-[9px] text-muted-foreground text-center mb-1.5 font-mono">Axle {axle}</div>
                    {[left, right].map((w, i) => w && (
                      <div key={i} className={`flex items-center justify-between px-1.5 py-0.5 rounded mb-1 border ${compStatusBg[w.status]}`}>
                        <span className="text-[9px] text-muted-foreground font-mono">{i === 0 ? "L" : "R"}</span>
                        <span className={`text-[10px] font-bold font-mono ${compStatusColor[w.status]}`}>{w.tempC}°C</span>
                      </div>
                    ))}
                    {left && (
                      <div className="text-[8px] text-muted-foreground mt-1 space-y-0.5">
                        <div>Wear: {left.wornMm}mm</div>
                        <div>Rim: {left.rimThicknessMm}mm</div>
                      </div>
                    )}
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
                { label: "Fuel", value: `${c.fuelLevelPct}%`, sub: `${c.fuelLevelGallons.toLocaleString()} gal`, status: c.fuelLevelPct < 25 ? "FAULT" : c.fuelLevelPct < 40 ? "WARNING" : "OK" as ComponentStatus },
                { label: "Oil", value: c.oilLevelStatus, sub: `${c.oilPressureKPa} kPa`, status: c.oilLevelStatus },
                { label: "Coolant", value: c.coolantLevelStatus, sub: `${c.coolantTempC}°C`, status: c.coolantLevelStatus },
                { label: "Sand", value: `${c.sandLevelPct}%`, sub: "Sanding system", status: c.sandLevelPct < 20 ? "WARNING" as ComponentStatus : "OK" as ComponentStatus },
              ].map(item => (
                <div key={item.label} className={`rounded border p-2 text-center ${compStatusBg[item.status as ComponentStatus]}`}>
                  <div className="text-[9px] text-muted-foreground mb-1">{item.label}</div>
                  <div className={`text-xs font-bold font-mono ${compStatusColor[item.status as ComponentStatus]}`}>{item.value}</div>
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

// ─── Locomotive Asset Card ─────────────────────────────────────────────────────
function LocoAssetCard({ asset }: { asset: typeof assets[0] }) {
  const [open, setOpen] = useState(false);
  // Find fleet snapshot for this loco to get train assignment
  const fleetTrain = FLEET_SNAPSHOT.find(t => t.locos.includes(asset.name));
  const locoDetails = LOCOMOTIVE_DETAILS.filter(l => l.roadNumber === asset.name);
  const trainLocos = fleetTrain ? getLocosForTrain(fleetTrain.id) : [];
  const carCount = fleetTrain?.cars ?? 0;

  return (
    <div className={`bg-card border rounded p-4 ${asset.status === "critical" ? "border-red-500/30" : asset.status === "warning" ? "border-amber-500/30" : "border-border"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[asset.status]}`} />
          <div className={`flex items-center gap-1.5 ${asset.status === "critical" ? "text-red-400" : asset.status === "warning" ? "text-amber-400" : "text-muted-foreground"}`}>
            <Train size={14} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{asset.name}</div>
            <div className="text-[10px] text-muted-foreground font-mono">{asset.id}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-border text-muted-foreground font-mono">{asset.system}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${statusColor[asset.status]}`}>{asset.status.toUpperCase()}</span>
        </div>
      </div>

      {/* Train assignment */}
      {fleetTrain ? (
        <div className="flex items-center gap-3 mb-3 px-2 py-1.5 rounded border border-blue-500/20 bg-blue-500/5">
          <Train size={11} className="text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold text-blue-300">{fleetTrain.symbol}</span>
              <span className="text-[10px] text-muted-foreground">{fleetTrain.origin} → {fleetTrain.destination}</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {fleetTrain.subdivision} Sub · MP {fleetTrain.milepost} · {fleetTrain.speed} mph · {carCount} cars · {(fleetTrain.weight / 1000).toFixed(0)}K tons
            </div>
          </div>
          {trainLocos.length > 1 && (
            <div className="text-right flex-shrink-0">
              <div className="text-[10px] text-muted-foreground">Consist</div>
              <div className="text-[10px] font-mono text-foreground">{trainLocos.map(l => l.roadNumber).join(" · ")}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded border border-border bg-muted/20">
          <MapPin size={11} className="text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{asset.subdivision}{asset.milepost ? ` · MP ${asset.milepost}` : ""} · Not assigned to active train</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1"><Clock size={10} /><span>{asset.lastSeen}</span></div>
      </div>

      {/* Standard detail grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {Object.entries(asset.details).map(([key, val]) => (
          <div key={key} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1">
            <span className="text-[10px] text-muted-foreground">{key}</span>
            <span className={`text-[10px] font-mono font-medium ${
              val === "Disconnected" || val === "Offline" || val === "Failed Init" ? "text-red-400" :
              val === "Active" || val === "Connected" || val === "Nominal" ? "text-emerald-400" :
              val === "Enforcement" ? "text-amber-400" : "text-foreground"
            }`}>{val}</span>
          </div>
        ))}
      </div>

      {/* Expand for component health */}
      {locoDetails.length > 0 && (
        <>
          <button
            onClick={() => setOpen(v => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            {open ? "Hide" : "Show"} Component Health
          </button>
          {open && (
            <div className="mt-3 space-y-2">
              {locoDetails.map(ld => (
                <LocoConsistCard key={ld.roadNumber + ld.trainId} loco={ld} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Assets() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subdivFilter, setSubdivFilter] = useState("all");
  const [systemFilter, setSystemFilter] = useState("all");

  const subdivisions = useMemo(() => Array.from(new Set(assets.map(a => a.subdivision))).sort(), []);
  const systems = useMemo(() => Array.from(new Set(assets.map(a => a.system))).sort(), []);

  const filtered = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()) || a.subdivision.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || a.type === typeFilter;
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchSubdiv = subdivFilter === "all" || a.subdivision === subdivFilter;
      const matchSystem = systemFilter === "all" || a.system === systemFilter;
      return matchSearch && matchType && matchStatus && matchSubdiv && matchSystem;
    });
  }, [search, typeFilter, statusFilter, subdivFilter, systemFilter]);

  const counts = useMemo(() => ({
    locomotives: assets.filter(a => a.type === "locomotive").length,
    wayside: assets.filter(a => a.type === "wayside").length,
    radio: assets.filter(a => a.type === "radio").length,
    atip: assets.filter(a => a.type === "atip").length,
    critical: assets.filter(a => a.status === "critical").length,
    warning: assets.filter(a => a.status === "warning").length,
  }), []);

  return (
    <Layout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Asset Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Locomotives, wayside devices, radio sites, and ATIP cars — monitored via OWL, CARMA, COBRA, and WASP
          </p>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: "Locomotives", count: counts.locomotives, icon: <Train size={16} />, color: "text-sky-400", filter: () => setTypeFilter("locomotive") },
            { label: "Wayside", count: counts.wayside, icon: <MapPin size={16} />, color: "text-amber-400", filter: () => setTypeFilter("wayside") },
            { label: "Radio Sites", count: counts.radio, icon: <Radio size={16} />, color: "text-emerald-400", filter: () => setTypeFilter("radio") },
            { label: "ATIP Cars", count: counts.atip, icon: <Satellite size={16} />, color: "text-purple-400", filter: () => setTypeFilter("atip") },
            { label: "Critical", count: counts.critical, icon: <XCircle size={16} />, color: "text-red-400", filter: () => setStatusFilter("critical") },
            { label: "Warning", count: counts.warning, icon: <AlertTriangle size={16} />, color: "text-amber-400", filter: () => setStatusFilter("warning") },
          ].map(s => (
            <button key={s.label} onClick={s.filter} className="bg-card border border-border rounded p-3 text-left hover:border-[#D22630]/40 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className={s.color}>{s.icon}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</span>
              </div>
              <div className={`text-3xl font-bold ${s.color}`} style={{ fontFamily: "Space Grotesk, sans-serif" }}>{s.count}</div>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 items-center bg-card border border-border rounded p-3">
          <Filter size={13} className="text-muted-foreground flex-shrink-0" />
          <div className="relative flex-1 min-w-[180px]">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, ID, or subdivision…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#D22630]/50"
            />
          </div>
          {[
            { label: "Type", value: typeFilter, setter: setTypeFilter, options: [["all","All Types"],["locomotive","Locomotive"],["wayside","Wayside"],["radio","Radio"],["atip","ATIP"],["crossing","Crossing"],["server","Server"]] },
            { label: "Status", value: statusFilter, setter: setStatusFilter, options: [["all","All Status"],["operational","Operational"],["warning","Warning"],["critical","Critical"],["info","Info"]] },
            { label: "System", value: systemFilter, setter: setSystemFilter, options: [["all","All Systems"], ...systems.map(s => [s, s])] },
            { label: "Subdivision", value: subdivFilter, setter: setSubdivFilter, options: [["all","All Subdivisions"], ...subdivisions.map(s => [s, s])] },
          ].map(f => (
            <select
              key={f.label}
              value={f.value}
              onChange={e => f.setter(e.target.value)}
              className="bg-muted/50 border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#D22630]/50"
            >
              {f.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          ))}
          {(search || typeFilter !== "all" || statusFilter !== "all" || subdivFilter !== "all" || systemFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setSubdivFilter("all"); setSystemFilter("all"); }}
              className="text-[10px] text-[#D22630] hover:text-red-400 px-2 py-1.5 rounded border border-[#D22630]/30 hover:border-red-400/40 transition-colors"
            >
              Clear filters
            </button>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} of {assets.length} assets</span>
        </div>

        {/* Asset cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No assets match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {filtered.map(asset => (
              asset.type === "locomotive"
                ? <LocoAssetCard key={asset.id} asset={asset} />
                : (
                  <div key={asset.id} className={`bg-card border rounded p-4 ${asset.status === "critical" ? "border-red-500/30" : asset.status === "warning" ? "border-amber-500/30" : "border-border"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[asset.status]}`} />
                        <div className={`flex items-center gap-1.5 ${asset.status === "critical" ? "text-red-400" : asset.status === "warning" ? "text-amber-400" : "text-muted-foreground"}`}>
                          {typeIcon[asset.type]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{asset.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{asset.id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-border text-muted-foreground font-mono">{asset.system}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${statusColor[asset.status]}`}>{asset.status.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1"><MapPin size={10} /><span>{asset.subdivision}{asset.milepost ? ` · MP ${asset.milepost}` : ""}</span></div>
                      <div className="flex items-center gap-1"><Clock size={10} /><span>{asset.lastSeen}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(asset.details).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1">
                          <span className="text-[10px] text-muted-foreground">{key}</span>
                          <span className={`text-[10px] font-mono font-medium ${
                            val === "Disconnected" || val === "Offline" || val === "Failed Init" ? "text-red-400" :
                            val === "Active" || val === "Connected" || val === "Nominal" ? "text-emerald-400" :
                            val === "Enforcement" ? "text-amber-400" : "text-foreground"
                          }`}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

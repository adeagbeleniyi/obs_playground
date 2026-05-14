import Layout from "@/components/Layout";
import {
  FLEET_SNAPSHOT, YARDS, AIR_BRAKE_TESTS, CONSIST_EVENTS, LIFECYCLE_EVENTS, DAILY_SUMMARY,
  type TrainSnapshot, type TrainState, type AirBrakeTestResult, type LifecycleEventType,
} from "@/lib/fleetData";
import { SWITCH_LISTS, type SwitchMoveStatus } from "@/lib/dispatchData";
import { useState, useMemo } from "react";
import {
  Train, MapPin, CheckCircle, XCircle, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Activity, Package, ArrowRight,
  Gauge, Fuel, Navigation, Users, RefreshCw, Filter,
  Zap, Radio, Wrench, Info, Link2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid
} from "recharts";

// ─── Styling helpers ──────────────────────────────────────────────────────────

const stateConfig: Record<TrainState, { label: string; color: string; bg: string; dot: string }> = {
  EN_ROUTE_MOVING:       { label: "Moving",        color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-400" },
  EN_ROUTE_STOPPED:      { label: "Stopped",       color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30",   dot: "bg-amber-400"   },
  IN_YARD_PRE_DEPARTURE: { label: "Pre-Departure", color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/30",       dot: "bg-sky-400"     },
  IN_YARD_POST_ARRIVAL:  { label: "Post-Arrival",  color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/30", dot: "bg-violet-400"  },
  IN_YARD_CLASSIFYING:   { label: "Classifying",   color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/30",     dot: "bg-blue-400"    },
  ARRIVING:              { label: "Arriving",      color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/30",     dot: "bg-cyan-400"    },
  DEPARTING:             { label: "Departing",     color: "text-lime-400",    bg: "bg-lime-500/10 border-lime-500/30",     dot: "bg-lime-400"    },
};

const ptcColor: Record<string, string> = {
  ACTIVE: "text-emerald-400", SUPPRESSED: "text-amber-400",
  BYPASS: "text-red-400", INITIALIZING: "text-sky-400", NOT_EQUIPPED: "text-muted-foreground",
};

const abtResultConfig: Record<AirBrakeTestResult, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PASS:        { label: "PASS",        color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: <CheckCircle size={12}/> },
  FAIL:        { label: "FAIL",        color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30",         icon: <XCircle size={12}/> },
  IN_PROGRESS: { label: "IN PROGRESS", color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/30",         icon: <RefreshCw size={12}/> },
  PENDING:     { label: "PENDING",     color: "text-muted-foreground",    bg: "bg-zinc-500/10 border-zinc-500/30",       icon: <Clock size={12}/> },
};

const lifecycleEventConfig: Partial<Record<LifecycleEventType, { icon: React.ReactNode; color: string }>> = {
  DEPARTURE:           { icon: <Navigation size={11}/>,   color: "text-emerald-400" },
  ARRIVAL:             { icon: <ArrowRight size={11}/>,   color: "text-cyan-400"    },
  CONSIST_CHANGE:      { icon: <Package size={11}/>,      color: "text-sky-400"     },
  AIR_BRAKE_TEST:      { icon: <Gauge size={11}/>,        color: "text-violet-400"  },
  CREW_CHANGE:         { icon: <Users size={11}/>,        color: "text-blue-400"    },
  DETECTOR_PASSAGE:    { icon: <Radio size={11}/>,        color: "text-muted-foreground"    },
  DETECTOR_ALARM:      { icon: <AlertTriangle size={11}/>,color: "text-red-400"     },
  PTC_ENFORCEMENT:     { icon: <Zap size={11}/>,          color: "text-red-400"     },
  LOBS_EVENT:          { icon: <XCircle size={11}/>,      color: "text-red-400"     },
  SIGNAL_HOLD:         { icon: <Clock size={11}/>,        color: "text-amber-400"   },
  MEET_PASS:           { icon: <Activity size={11}/>,     color: "text-amber-400"   },
  SLOW_ORDER:          { icon: <Clock size={11}/>,        color: "text-amber-400"   },
  FUEL_STOP:           { icon: <Fuel size={11}/>,         color: "text-lime-400"    },
  MECHANICAL_INSPECTION:{ icon: <Wrench size={11}/>,      color: "text-orange-400"  },
  INTERCHANGE:         { icon: <Link2 size={11}/>,        color: "text-sky-400"     },
  DPU_EVENT:           { icon: <Train size={11}/>,        color: "text-sky-400"     },
  COMMUNICATION_LOSS:  { icon: <Radio size={11}/>,        color: "text-red-400"     },
  HOS_WARNING:         { icon: <Users size={11}/>,        color: "text-amber-400"   },
};

const severityBg: Record<string, string> = {
  INFO:     "bg-zinc-500/5 border-zinc-500/20",
  WARNING:  "bg-amber-500/10 border-amber-500/30",
  CRITICAL: "bg-red-500/10 border-red-500/30",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StateBadge({ state }: { state: TrainState }) {
  const cfg = stateConfig[state];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
      {cfg.label}
    </span>
  );
}

function TrainCard({ t }: { t: TrainSnapshot }) {
  const [open, setOpen] = useState(false);
  const hasAlarms = t.activeAlarms > 0;

  return (
    <div className={`rounded border p-3 ${hasAlarms ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card'}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Train size={14} className={`mt-0.5 flex-shrink-0 ${hasAlarms ? 'text-red-400' : 'text-[#D22630]'}`}/>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold mono text-foreground">{t.symbol}</span>
              <StateBadge state={t.state} />
              {hasAlarms && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 font-bold">{t.activeAlarms} ALARM{t.activeAlarms>1?'S':''}</span>}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{t.origin} → {t.destination}</div>
          </div>
        </div>
        <button onClick={() => setOpen(!open)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 flex-shrink-0">
          {open ? <><ChevronUp size={10}/>Less</> : <><ChevronDown size={10}/>Details</>}
        </button>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-6 gap-2 mt-2.5">
        <div>
          <div className="text-[9px] text-muted-foreground">Subdivision</div>
          <div className="text-[11px] font-medium text-foreground">{t.subdivision}</div>
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground">Milepost</div>
          <div className="text-[11px] mono text-foreground">{t.milepost}</div>
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground">Speed</div>
          <div className="text-[11px] mono text-foreground">{t.speed} <span className="text-[9px]">/ {t.speedLimit} mph</span></div>
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground">Consist</div>
          <div className="text-[11px] mono text-foreground">{t.cars} cars · {(t.weight/1000).toFixed(1)}kt</div>
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground">PTC State</div>
          <div className={`text-[11px] font-medium ${ptcColor[t.ptcState]}`}>{t.ptcState}</div>
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground">HOS Remaining</div>
          <div className={`text-[11px] mono ${t.hosRemainingMin < 120 ? 'text-amber-400' : 'text-foreground'}`}>
            {Math.floor(t.hosRemainingMin/60)}h {t.hosRemainingMin%60}m
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-foreground">Traction</div>
            <div className="text-[10px] text-muted-foreground">Locos: {t.locos.join(', ')}</div>
            <div className="text-[10px] text-muted-foreground">DPU: {t.hasDPU ? <span className="text-sky-400">Connected</span> : 'None'}</div>
            <div className="text-[10px] text-muted-foreground">Length: {t.length.toLocaleString()} ft</div>
            <div className="text-[10px] text-muted-foreground">Direction: {t.direction}</div>
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-foreground">Trip Optimizer</div>
            <div className={`text-[10px] ${t.tripOptimizerActive ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {t.tripOptimizerActive ? 'Active' : 'Inactive'}
            </div>
            <div className="text-[10px] text-muted-foreground">Fuel saved: {t.fuelSavedGallons} gal</div>
            <div className="text-[10px] text-muted-foreground">Miles today: {t.milesToday}</div>
            <div className="text-[10px] text-muted-foreground">Trip miles: {t.milesThisTrip}</div>
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-foreground">Wayside</div>
            <div className="text-[10px] text-muted-foreground">Last detector: MP {t.lastDetectorMp}</div>
            <div className={`text-[10px] font-medium ${t.lastDetectorResult === 'ALARM' ? 'text-red-400' : t.lastDetectorResult === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {t.lastDetectorResult}
            </div>
            {t.foreignCars > 0 && <div className="text-[10px] text-muted-foreground">Foreign cars: {t.foreignCars} ({t.interchangeRailroad})</div>}
            <div className="text-[10px] text-muted-foreground">Crew: {t.crew}</div>
          </div>
          {t.departureTime && (
            <div className="col-span-3 pt-2 border-t border-border flex items-center gap-6">
              <div><span className="text-[9px] text-muted-foreground">Departed: </span><span className="text-[10px] mono text-foreground">{t.departureTime}</span></div>
              {t.estimatedArrival && <div><span className="text-[9px] text-muted-foreground">Est. Arrival: </span><span className="text-[10px] mono text-foreground">{t.estimatedArrival}</span></div>}
              {t.stopReason && <div><span className="text-[9px] text-muted-foreground">Stop reason: </span><span className="text-[10px] text-amber-400">{t.stopReason.replace(/_/g,' ')}</span></div>}
              {t.stopDuration && <div><span className="text-[9px] text-muted-foreground">Stopped: </span><span className="text-[10px] mono text-amber-400">{t.stopDuration} min</span></div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Air Brake Test Card ──────────────────────────────────────────────────────

function AirBrakeTestCard({ test }: { test: typeof AIR_BRAKE_TESTS[0] }) {
  const [open, setOpen] = useState(false);
  const cfg = abtResultConfig[test.result];
  const leakageOk = test.leakageRate < test.leakageLimit;
  const brakePct = test.brakesTotal > 0 ? Math.round((test.brakesApplied / test.brakesTotal) * 100) : 0;

  return (
    <div className={`rounded border p-3 ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className={`mt-0.5 flex-shrink-0 ${cfg.color}`}>{cfg.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-border text-muted-foreground">{test.type}</span>
              <span className="text-[9px] text-muted-foreground">{test.yard} · {test.track}</span>
            </div>
            <div className="text-[11px] font-semibold text-foreground">{test.trainId}</div>
            <div className="text-[10px] text-muted-foreground">{test.triggeredBy.replace(/_/g,' ')} · {test.conductedBy}</div>
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <div className="text-[10px] mono text-muted-foreground">{test.startTime.split(' ')[1]}</div>
          <button onClick={() => setOpen(!open)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
            {open ? <><ChevronUp size={10}/>Less</> : <><ChevronDown size={10}/>Details</>}
          </button>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-4 gap-2 mt-2.5">
        <div className="text-center p-1.5 rounded bg-border/30">
          <div className="text-[9px] text-muted-foreground">Pipe Pressure</div>
          <div className="text-sm font-bold mono text-foreground">{test.brakePipePressure}<span className="text-[9px] font-normal"> psi</span></div>
        </div>
        <div className={`text-center p-1.5 rounded ${leakageOk ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          <div className="text-[9px] text-muted-foreground">Leakage Rate</div>
          <div className={`text-sm font-bold mono ${leakageOk ? 'text-emerald-400' : 'text-red-400'}`}>{test.leakageRate}<span className="text-[9px] font-normal"> psi/min</span></div>
        </div>
        <div className={`text-center p-1.5 rounded ${brakePct === 100 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
          <div className="text-[9px] text-muted-foreground">Brakes Applied</div>
          <div className={`text-sm font-bold mono ${brakePct === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{test.brakesApplied}/{test.brakesTotal}</div>
        </div>
        <div className="text-center p-1.5 rounded bg-border/30">
          <div className="text-[9px] text-muted-foreground">Limit</div>
          <div className="text-sm font-bold mono text-muted-foreground">{test.leakageLimit}<span className="text-[9px] font-normal"> psi/min</span></div>
        </div>
      </div>

      {test.defects.length > 0 && (
        <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
          <div className="text-[10px] font-semibold text-red-400 mb-1">Defects Found ({test.defects.length})</div>
          {test.defects.map((d, i) => (
            <div key={i} className="text-[10px] text-red-300 flex items-start gap-1.5">
              <span className="text-red-500 mt-0.5">•</span>{d}
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <div className="text-[10px] text-muted-foreground leading-relaxed">{test.notes}</div>
          <div className="flex items-center gap-4">
            <div><span className="text-[9px] text-muted-foreground">Start: </span><span className="text-[10px] mono text-foreground">{test.startTime}</span></div>
            {test.endTime && <div><span className="text-[9px] text-muted-foreground">End: </span><span className="text-[10px] mono text-foreground">{test.endTime}</span></div>}
            {test.endTime && <div><span className="text-[9px] text-muted-foreground">Duration: </span><span className="text-[10px] mono text-foreground">
              {Math.round((new Date(test.endTime).getTime() - new Date(test.startTime).getTime()) / 60000)} min
            </span></div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Consist Event Row ────────────────────────────────────────────────────────

function ConsistEventRow({ ev }: { ev: typeof CONSIST_EVENTS[0] }) {
  const typeColors: Record<string, string> = {
    CAR_ADDED: "text-emerald-400", CAR_REMOVED: "text-amber-400",
    LOCO_ADDED: "text-sky-400", LOCO_REMOVED: "text-amber-400",
    LOCO_REPOSITIONED: "text-blue-400", DPU_CONNECTED: "text-violet-400",
    DPU_DISCONNECTED: "text-amber-400", INTERCHANGE_IN: "text-cyan-400",
    INTERCHANGE_OUT: "text-orange-400",
  };
  const typeBg: Record<string, string> = {
    CAR_ADDED: "bg-emerald-500/10 border-emerald-500/20", CAR_REMOVED: "bg-amber-500/10 border-amber-500/20",
    LOCO_ADDED: "bg-sky-500/10 border-sky-500/20", LOCO_REMOVED: "bg-amber-500/10 border-amber-500/20",
    LOCO_REPOSITIONED: "bg-blue-500/10 border-blue-500/20", DPU_CONNECTED: "bg-violet-500/10 border-violet-500/20",
    DPU_DISCONNECTED: "bg-amber-500/10 border-amber-500/20", INTERCHANGE_IN: "bg-cyan-500/10 border-cyan-500/20",
    INTERCHANGE_OUT: "bg-orange-500/10 border-orange-500/20",
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="text-[10px] mono text-muted-foreground w-16 flex-shrink-0">{ev.timestamp.split(' ')[1]}</div>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${typeBg[ev.type] || 'bg-border text-muted-foreground'} ${typeColors[ev.type] || 'text-muted-foreground'}`}>
        {ev.type.replace(/_/g,' ')}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-foreground">{ev.carOrLocoId}</div>
        <div className="text-[9px] text-muted-foreground">
          {ev.carType && <span>{ev.carType} · </span>}
          {ev.foreignRailroad && <span className="text-sky-400">{ev.foreignRailroad} interchange · </span>}
          Train {ev.trainId} · {ev.yard}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {ev.newConsistLength && <div className="text-[10px] mono text-foreground">{ev.newConsistLength} cars</div>}
        {ev.newConsistWeight && <div className="text-[9px] text-muted-foreground">{(ev.newConsistWeight/1000).toFixed(1)}kt</div>}
      </div>
      {ev.triggeredAirBrakeTest && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 flex-shrink-0">ABT →</span>
      )}
    </div>
  );
}

// ─── Lifecycle Event Row ──────────────────────────────────────────────────────

function LifecycleEventRow({ ev }: { ev: typeof LIFECYCLE_EVENTS[0] }) {
  const cfg = lifecycleEventConfig[ev.type] || { icon: <Info size={11}/>, color: "text-muted-foreground" };
  return (
    <div className={`flex items-start gap-3 p-2.5 rounded border mb-1.5 ${severityBg[ev.severity]}`}>
      <div className={`mt-0.5 flex-shrink-0 ${cfg.color}`}>{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-[9px] font-bold text-muted-foreground mono">{ev.trainId.replace('CN-','')}</span>
          <span className={`text-[9px] font-semibold ${cfg.color}`}>{ev.type.replace(/_/g,' ')}</span>
          <span className="text-[9px] text-muted-foreground">{ev.subdivision} · MP {ev.milepost}</span>
          {!ev.resolved && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400">OPEN</span>}
        </div>
        <div className="text-[10px] text-foreground leading-relaxed">{ev.description}</div>
      </div>
      <div className="text-[10px] mono text-muted-foreground flex-shrink-0 text-right">
        {ev.timestamp.split(' ')[1]}
        <div className="text-[9px]">{ev.timestamp.split(' ')[0]}</div>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "fleet",      label: "Live Fleet",          icon: <Train size={13}/> },
  { id: "yards",      label: "Yard Operations",     icon: <MapPin size={13}/> },
  { id: "switchlist", label: "Switch Lists",        icon: <RefreshCw size={13}/> },
  { id: "abt",        label: "Air Brake Tests",     icon: <Gauge size={13}/> },
  { id: "consist",    label: "Consist Changes",     icon: <Package size={13}/> },
  { id: "lifecycle",  label: "Lifecycle Event Log", icon: <Activity size={13}/> },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FleetOps() {
  const [activeTab, setActiveTab] = useState("fleet");
  const [fleetFilter, setFleetFilter] = useState<string>("ALL");
  const [lifecycleFilter, setLifecycleFilter] = useState<string>("ALL");
  const [lifecycleSeverity, setLifecycleSeverity] = useState<string>("ALL");

  const filteredFleet = useMemo(() => {
    if (fleetFilter === "ALL") return FLEET_SNAPSHOT;
    return FLEET_SNAPSHOT.filter(t => t.state === fleetFilter);
  }, [fleetFilter]);

  const filteredLifecycle = useMemo(() => {
    return LIFECYCLE_EVENTS.filter(ev => {
      const trainOk = lifecycleFilter === "ALL" || ev.trainId === lifecycleFilter;
      const sevOk   = lifecycleSeverity === "ALL" || ev.severity === lifecycleSeverity;
      return trainOk && sevOk;
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [lifecycleFilter, lifecycleSeverity]);

  const trainIds = Array.from(new Set(LIFECYCLE_EVENTS.map(e => e.trainId)));

  // State counts
  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of FLEET_SNAPSHOT) {
      counts[t.state] = (counts[t.state] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <Layout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fleet Operations</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Train lifecycle · Yard operations · Air brake tests · Consist changes · Event log</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[11px] text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-7 gap-2">
          {[
            { label: "Total Active Trains",   value: DAILY_SUMMARY.trainsActive,                      color: "text-foreground",   bg: "bg-card border-border" },
            { label: "Trains Moving",          value: stateCounts["EN_ROUTE_MOVING"] || 0,             color: "text-emerald-400",  bg: "bg-emerald-500/10 border-emerald-500/30" },
            { label: "Trains Stopped",         value: stateCounts["EN_ROUTE_STOPPED"] || 0,            color: "text-amber-400",    bg: "bg-amber-500/10 border-amber-500/30" },
            { label: "In Yards",               value: (stateCounts["IN_YARD_PRE_DEPARTURE"]||0)+(stateCounts["IN_YARD_POST_ARRIVAL"]||0), color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30" },
            { label: "Arriving",               value: stateCounts["ARRIVING"] || 0,                    color: "text-cyan-400",     bg: "bg-cyan-500/10 border-cyan-500/30" },
            { label: "Brake Tests Today",      value: `${DAILY_SUMMARY.airBrakeTestsPassed}/${DAILY_SUMMARY.airBrakeTestsTotal}`, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
            { label: "Consist Changes Today",  value: DAILY_SUMMARY.consistChanges,                    color: "text-blue-400",     bg: "bg-blue-500/10 border-blue-500/30" },
          ].map(k => (
            <div key={k.label} className={`rounded border p-3 ${k.bg}`}>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">{k.label}</div>
              <div className={`text-xl font-bold mono ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Fleet Analytics Charts */}
        {(() => {
          const stateChartData = Object.entries(stateCounts).map(([state, count]) => ({
            name: stateConfig[state as TrainState]?.label || state,
            value: count,
            color: state === 'EN_ROUTE_MOVING' ? '#10B981' : state === 'EN_ROUTE_STOPPED' ? '#F59E0B' : state === 'IN_YARD_PRE_DEPARTURE' ? '#38BDF8' : state === 'IN_YARD_POST_ARRIVAL' ? '#A78BFA' : state === 'IN_YARD_CLASSIFYING' ? '#3B82F6' : state === 'ARRIVING' ? '#22D3EE' : '#84CC16',
          }));

          const ptcCounts: Record<string, number> = {};
          FLEET_SNAPSHOT.forEach(t => { ptcCounts[t.ptcState] = (ptcCounts[t.ptcState] || 0) + 1; });
          const ptcData = Object.entries(ptcCounts).map(([status, count]) => ({ status, count }));
          const ptcColors: Record<string, string> = { ACTIVE: '#10B981', SUPPRESSED: '#F59E0B', BYPASS: '#EF4444', INITIALIZING: '#38BDF8', NOT_EQUIPPED: '#64748b' };

          const subCounts: Record<string, number> = {};
          FLEET_SNAPSHOT.forEach(t => { subCounts[t.subdivision] = (subCounts[t.subdivision] || 0) + 1; });
          const subData = Object.entries(subCounts).map(([sub, count]) => ({ sub, count })).sort((a, b) => b.count - a.count).slice(0, 8);

          const tooltipStyle = {
            contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 },
            labelStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 10 },
          };

          return (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Train State Distribution</p>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={stateChartData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={2} dataKey="value">
                      {stateChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">PTC Status Distribution</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={ptcData} margin={{ left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="status" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" name="Trains" radius={[3, 3, 0, 0]}>
                      {ptcData.map(entry => <Cell key={entry.status} fill={ptcColors[entry.status] || '#64748b'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Active Trains by Subdivision</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={subData} layout="vertical" margin={{ left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="sub" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} width={60} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill="#38BDF8" name="Trains" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#D22630] text-[#D22630]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB: LIVE FLEET ═══ */}
        {activeTab === "fleet" && (
          <div className="space-y-3">
            {/* State filter */}
            <div className="flex items-center gap-2">
              <Filter size={12} className="text-muted-foreground"/>
              <span className="text-[11px] text-muted-foreground">Filter by state:</span>
              {[
                { id: "ALL", label: "All" },
                { id: "EN_ROUTE_MOVING", label: "Moving" },
                { id: "EN_ROUTE_STOPPED", label: "Stopped" },
                { id: "IN_YARD_PRE_DEPARTURE", label: "Pre-Departure" },
                { id: "IN_YARD_POST_ARRIVAL", label: "Post-Arrival" },
                { id: "ARRIVING", label: "Arriving" },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFleetFilter(f.id)}
                  className={`text-[10px] px-2.5 py-1 rounded border transition-colors ${
                    fleetFilter === f.id
                      ? 'border-[#D22630] text-[#D22630] bg-[#D22630]/10'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}{f.id !== "ALL" && stateCounts[f.id] ? ` (${stateCounts[f.id]})` : ''}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredFleet.map(t => <TrainCard key={t.id} t={t}/>)}
            </div>
          </div>
        )}

        {/* ═══ TAB: YARD OPERATIONS ═══ */}
        {activeTab === "yards" && (
          <div className="grid grid-cols-2 gap-4">
            {YARDS.map(yard => {
              const yardTrains = FLEET_SNAPSHOT.filter(t => t.yardId === yard.id);
              const utilPct = yard.capacity > 0 ? Math.round((yard.currentCars / yard.capacity) * 100) : 0;
              const yardConsistEvents = CONSIST_EVENTS.filter(e => e.yard === yard.id);
              const yardABTs = AIR_BRAKE_TESTS.filter(a => a.yard === yard.id);

              return (
                <div key={yard.id} className="bg-card border border-border rounded p-4">
                  {/* Yard header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-[#D22630]"/>
                        <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{yard.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-border text-muted-foreground">{yard.type}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{yard.city}, {yard.province} · {yard.subdivision} Sub · {yard.tracks} tracks</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold mono text-foreground">{yard.trainsInYard}</div>
                      <div className="text-[9px] text-muted-foreground">trains in yard</div>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  {yard.capacity > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">Car capacity: {yard.currentCars.toLocaleString()} / {yard.capacity.toLocaleString()}</span>
                        <span className={`text-[10px] font-bold ${utilPct > 85 ? 'text-amber-400' : 'text-emerald-400'}`}>{utilPct}%</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${utilPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${utilPct}%` }}/>
                      </div>
                    </div>
                  )}

                  {/* Loco / activity counts */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="text-center p-1.5 rounded bg-border/30">
                      <div className="text-sm font-bold mono text-foreground">{yard.currentLocos}</div>
                      <div className="text-[9px] text-muted-foreground">Locos</div>
                    </div>
                    <div className="text-center p-1.5 rounded bg-cyan-500/10">
                      <div className="text-sm font-bold mono text-cyan-400">{yard.trainsArriving}</div>
                      <div className="text-[9px] text-muted-foreground">Arriving</div>
                    </div>
                    <div className="text-center p-1.5 rounded bg-lime-500/10">
                      <div className="text-sm font-bold mono text-lime-400">{yard.trainsDeparting}</div>
                      <div className="text-[9px] text-muted-foreground">Departing</div>
                    </div>
                    <div className="text-center p-1.5 rounded bg-violet-500/10">
                      <div className="text-sm font-bold mono text-violet-400">{yardABTs.length}</div>
                      <div className="text-[9px] text-muted-foreground">ABTs</div>
                    </div>
                  </div>

                  {/* Trains currently in this yard */}
                  {yardTrains.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] font-semibold text-foreground mb-1.5">Trains on Property</div>
                      {yardTrains.map(t => (
                        <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                          <span className="text-[10px] mono font-bold text-foreground">{t.symbol}</span>
                          <StateBadge state={t.state} />
                          {t.yardTrack && <span className="text-[9px] text-muted-foreground">Track {t.yardTrack}</span>}
                          <span className="text-[9px] text-muted-foreground ml-auto">{t.cars} cars</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent consist events */}
                  {yardConsistEvents.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-foreground mb-1.5">Recent Consist Activity</div>
                      {yardConsistEvents.slice(0, 3).map(ev => (
                        <div key={ev.id} className="text-[10px] text-muted-foreground py-1 border-b border-border last:border-0 flex items-center gap-2">
                          <span className="text-[9px] mono">{ev.timestamp.split(' ')[1]}</span>
                          <span className={`font-medium ${ev.type.includes('ADDED') || ev.type.includes('IN') ? 'text-emerald-400' : 'text-amber-400'}`}>{ev.type.replace(/_/g,' ')}</span>
                          <span className="truncate">{ev.carOrLocoId}</span>
                          {ev.foreignRailroad && <span className="text-sky-400 flex-shrink-0">{ev.foreignRailroad}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {yardTrains.length === 0 && yardConsistEvents.length === 0 && (
                    <div className="text-[10px] text-muted-foreground italic">No trains currently on property</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ TAB: SWITCH LISTS ═══ */}
        {activeTab === "switchlist" && (
          <div className="space-y-4">
            {/* Header context */}
            <div className="rounded border border-sky-500/20 bg-sky-500/5 p-3">
              <div className="flex items-start gap-2">
                <Info size={12} className="text-sky-400 mt-0.5 flex-shrink-0"/>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  <span className="text-sky-400 font-semibold">Switch list context: </span>
                  A switch list is the ordered sequence of car movements assigned to a yard switch engine and crew for a given shift. Each move (PULL, SHOVE, CLASSIFY, SPOT, SET OUT, PICK UP) is executed in sequence to build outbound trains, sort inbound cars, and handle foreign railroad interchanges. The switch list is the primary work order for yard operations.
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Active Switch Lists",   value: SWITCH_LISTS.filter(s => s.status === 'ACTIVE').length,   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
                { label: "Completed Today",        value: SWITCH_LISTS.filter(s => s.status === 'COMPLETE').length, color: "text-muted-foreground",    bg: "bg-card border-border" },
                { label: "Cars Classified Today",  value: SWITCH_LISTS.reduce((s, sl) => s + sl.carsClassified, 0), color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/30" },
                { label: "Active Switch Engines",  value: SWITCH_LISTS.filter(s => s.status === 'ACTIVE').length,   color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
              ].map(k => (
                <div key={k.label} className={`rounded border p-3 ${k.bg}`}>
                  <div className="text-[10px] text-muted-foreground mb-1">{k.label}</div>
                  <div className={`text-2xl font-bold mono ${k.color}`}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Switch list cards */}
            {SWITCH_LISTS.map(sl => {
              const statusCfg: Record<string, { color: string; bg: string }> = {
                ACTIVE:   { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                COMPLETE: { color: 'text-muted-foreground',    bg: 'bg-zinc-500/10 border-zinc-500/30' },
                PENDING:  { color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30' },
                DELAYED:  { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
              };
              const moveStatusCfg: Record<SwitchMoveStatus, { dot: string; text: string }> = {
                COMPLETE:    { dot: 'bg-emerald-400', text: 'text-emerald-400' },
                IN_PROGRESS: { dot: 'bg-sky-400 animate-pulse', text: 'text-sky-400' },
                PENDING:     { dot: 'bg-zinc-600', text: 'text-muted-foreground' },
                SKIPPED:     { dot: 'bg-zinc-600', text: 'text-muted-foreground' },
                HOLD:        { dot: 'bg-amber-400', text: 'text-amber-400' },
              };
              const cfg = statusCfg[sl.status];
              const progressPct = sl.movesTotal > 0 ? Math.round((sl.movesComplete / sl.movesTotal) * 100) : 0;

              return (
                <div key={sl.id} className="bg-card border border-border rounded p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <MapPin size={13} className="text-[#D22630]"/>
                        <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{sl.yardName}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>{sl.status}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-border text-muted-foreground">{sl.shift} SHIFT</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {sl.switchEngine} · {sl.crew}
                        {sl.buildingTrain && <span className="text-sky-400"> · Building: {sl.buildingTrain}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] mono text-foreground">{sl.startTime.split(' ')[1]} → {sl.estimatedCompletion.split(' ')[1]}</div>
                      <div className="text-[9px] text-muted-foreground">{sl.movesComplete}/{sl.movesTotal} moves · {sl.carsClassified}/{sl.carsTotal} cars</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-muted-foreground">Progress</span>
                      <span className={`text-[9px] font-bold ${progressPct === 100 ? 'text-emerald-400' : progressPct > 50 ? 'text-sky-400' : 'text-amber-400'}`}>{progressPct}%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${progressPct === 100 ? 'bg-emerald-500' : 'bg-sky-500'}`} style={{ width: `${progressPct}%` }}/>
                    </div>
                  </div>

                  {/* Notes */}
                  {sl.notes && (
                    <div className="mb-3 p-2 rounded bg-border/20 text-[10px] text-muted-foreground leading-relaxed">{sl.notes}</div>
                  )}

                  {/* Move sequence */}
                  <div className="text-[10px] font-semibold text-foreground mb-2">Move Sequence</div>
                  <div className="space-y-1">
                    {sl.moves.map(move => {
                      const mCfg = moveStatusCfg[move.status];
                      const moveTypeBg: Record<string, string> = {
                        PULL: 'bg-sky-500/10 text-sky-400', SHOVE: 'bg-violet-500/10 text-violet-400',
                        CLASSIFY: 'bg-blue-500/10 text-blue-400', SPOT: 'bg-lime-500/10 text-lime-400',
                        COUPLE: 'bg-emerald-500/10 text-emerald-400', UNCOUPLE: 'bg-amber-500/10 text-amber-400',
                        INSPECT: 'bg-orange-500/10 text-orange-400', SET_OUT: 'bg-red-500/10 text-red-400',
                        PICK_UP: 'bg-cyan-500/10 text-cyan-400',
                      };
                      return (
                        <div key={move.seq} className={`flex items-start gap-2.5 p-2 rounded ${
                          move.status === 'IN_PROGRESS' ? 'bg-sky-500/5 border border-sky-500/20' :
                          move.status === 'COMPLETE' ? 'bg-border/10' : 'bg-transparent'
                        }`}>
                          <div className="flex items-center gap-1.5 flex-shrink-0 w-6">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${mCfg.dot}`}/>
                            <span className={`text-[9px] mono ${mCfg.text}`}>{move.seq}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${moveTypeBg[move.type] || 'bg-border text-muted-foreground'}`}>
                            {move.type.replace(/_/g,' ')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[10px] ${move.status === 'COMPLETE' ? 'text-muted-foreground line-through' : move.status === 'IN_PROGRESS' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {move.fromTrack} → {move.toTrack}
                              {move.carCount > 0 && <span className="ml-1 text-[9px]">({move.carCount} cars)</span>}
                            </div>
                            {move.cars.length > 0 && move.cars[0] !== '' && (
                              <div className="text-[9px] text-muted-foreground truncate">{move.cars.slice(0,3).join(', ')}{move.cars.length > 3 ? ` +${move.cars.length-3} more` : ''}</div>
                            )}
                            {move.notes && <div className="text-[9px] text-amber-400 mt-0.5">{move.notes}</div>}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            {move.startTime && <div className="text-[9px] mono text-muted-foreground">{move.startTime}{move.endTime ? ` → ${move.endTime}` : ''}</div>}
                            <div className={`text-[9px] font-medium ${mCfg.text}`}>{move.status}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ TAB: AIR BRAKE TESTS ═══ */}
        {activeTab === "abt" && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Tests Today",      value: DAILY_SUMMARY.airBrakeTestsTotal, color: "text-foreground",   bg: "bg-card border-border" },
                { label: "Passed",           value: DAILY_SUMMARY.airBrakeTestsPassed, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
                { label: "Failed",           value: DAILY_SUMMARY.airBrakeTestsFailed, color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30" },
                { label: "In Progress",      value: AIR_BRAKE_TESTS.filter(t => t.result === 'IN_PROGRESS').length, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30" },
              ].map(k => (
                <div key={k.label} className={`rounded border p-3 ${k.bg}`}>
                  <div className="text-[10px] text-muted-foreground mb-1">{k.label}</div>
                  <div className={`text-2xl font-bold mono ${k.color}`}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Regulatory context */}
            <div className="rounded border border-sky-500/20 bg-sky-500/5 p-3">
              <div className="flex items-start gap-2">
                <Info size={12} className="text-sky-400 mt-0.5 flex-shrink-0"/>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  <span className="text-sky-400 font-semibold">Regulatory context: </span>
                  Transport Canada requires an Initial Terminal Air Brake Test (ITABT) before every departure. A Running Air Brake Test (RABT) is required after any consist change en route or in a yard. Leakage must not exceed 5.0 psi/min. All brakes must apply and release. Defective cars must be set out before departure is authorized.
                </div>
              </div>
            </div>

            {/* Test cards */}
            <div className="space-y-3">
              {AIR_BRAKE_TESTS.map(test => <AirBrakeTestCard key={test.id} test={test}/>)}
            </div>
          </div>
        )}

        {/* ═══ TAB: CONSIST CHANGES ═══ */}
        {activeTab === "consist" && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "Changes Today",    value: DAILY_SUMMARY.consistChanges,                                                                      color: "text-foreground",  bg: "bg-card border-border" },
                { label: "Cars Added",       value: CONSIST_EVENTS.filter(e => e.type === 'CAR_ADDED').length,                                         color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
                { label: "Cars Removed",     value: CONSIST_EVENTS.filter(e => e.type === 'CAR_REMOVED').length,                                       color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
                { label: "Foreign Interchanges", value: CONSIST_EVENTS.filter(e => e.foreignRailroad).length,                                          color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/30" },
                { label: "ABTs Triggered",   value: CONSIST_EVENTS.filter(e => e.triggeredAirBrakeTest).length,                                        color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/30" },
              ].map(k => (
                <div key={k.label} className={`rounded border p-3 ${k.bg}`}>
                  <div className="text-[10px] text-muted-foreground mb-1">{k.label}</div>
                  <div className={`text-2xl font-bold mono ${k.color}`}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Foreign railroad legend */}
            <div className="rounded border border-border bg-card p-3">
              <div className="text-[10px] font-semibold text-foreground mb-2">Foreign Railroad Interchanges Today</div>
              <div className="flex items-center gap-4">
                {DAILY_SUMMARY.interchangeRailroads.map(rr => (
                  <span key={rr} className="text-[10px] px-2 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400">{rr}</span>
                ))}
              </div>
            </div>

            {/* Event log */}
            <div className="bg-card border border-border rounded p-4">
              <div className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Consist Event Log</div>
              <div>
                {CONSIST_EVENTS.map(ev => <ConsistEventRow key={ev.id} ev={ev}/>)}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: LIFECYCLE EVENT LOG ═══ */}
        {activeTab === "lifecycle" && (
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter size={12} className="text-muted-foreground"/>
                <span className="text-[11px] text-muted-foreground">Train:</span>
                <select
                  value={lifecycleFilter}
                  onChange={e => setLifecycleFilter(e.target.value)}
                  className="text-[11px] bg-card border border-border rounded px-2 py-1 text-foreground"
                >
                  <option value="ALL">All Trains</option>
                  {trainIds.map(id => <option key={id} value={id}>{id.replace('CN-','')}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Severity:</span>
                {["ALL","INFO","WARNING","CRITICAL"].map(s => (
                  <button
                    key={s}
                    onClick={() => setLifecycleSeverity(s)}
                    className={`text-[10px] px-2.5 py-1 rounded border transition-colors ${
                      lifecycleSeverity === s
                        ? s === "CRITICAL" ? 'border-red-500/50 text-red-400 bg-red-500/10'
                        : s === "WARNING"  ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                        : 'border-[#D22630] text-[#D22630] bg-[#D22630]/10'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground ml-auto">{filteredLifecycle.length} events</span>
            </div>

            {/* Event list */}
            <div>
              {filteredLifecycle.map(ev => <LifecycleEventRow key={ev.id} ev={ev}/>)}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

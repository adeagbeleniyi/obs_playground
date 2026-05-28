import Layout from "@/components/Layout";
import { kpiMetrics, incidents, incidentTrendData } from "@/lib/mockData";
import { predictiveAlerts, type PredictiveAlert } from "@/lib/observabilityData";
import {
  FLEET_SNAPSHOT, YARDS, NETWORK_TIMELINE, DAILY_SUMMARY,
  type TrainSnapshot, type TrainState,
} from "@/lib/fleetData";
import { useState, useMemo } from "react";
import {
  AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Minus,
  Bot, Zap, Activity, Eye, ChevronDown, ChevronUp,
  Radio, Thermometer, Clock, Train, MapPin, Gauge,
  Package, RotateCcw, Fuel, Navigation, ArrowRight,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ─── Styling helpers ──────────────────────────────────────────────────────────

const severityColor = { critical: "text-red-400", warning: "text-amber-400", info: "text-sky-400", operational: "text-emerald-400" };
const severityBg   = { critical: "bg-red-500/10 border-red-500/30", warning: "bg-amber-500/10 border-amber-500/30", info: "bg-sky-500/10 border-sky-500/30", operational: "bg-emerald-500/10 border-emerald-500/30" };
const trendIcon    = { up: <TrendingUp size={12}/>, down: <TrendingDown size={12}/>, flat: <Minus size={12}/> };

const urgencyConfig = {
  imminent: { bg: 'bg-red-500/10 border-red-500/40',   badge: 'bg-red-500 text-foreground',   icon: 'text-red-400',   label: 'IMMINENT' },
  warning:  { bg: 'bg-amber-500/10 border-amber-500/40', badge: 'bg-amber-500 text-foreground', icon: 'text-amber-400', label: 'WARNING'  },
  watch:    { bg: 'bg-sky-500/10 border-sky-500/30',    badge: 'bg-sky-600 text-foreground',   icon: 'text-sky-400',   label: 'WATCH'    },
};
const typeIcon  = { 'threshold-drift': <Thermometer size={12}/>, 'correlated-signals': <Activity size={12}/>, 'trace-latency': <Radio size={12}/> };
const typeLabel = { 'threshold-drift': 'Threshold Drift', 'correlated-signals': 'Correlated Signals', 'trace-latency': 'Trace Latency' };

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

// ─── Predictive Alert Card ────────────────────────────────────────────────────

function PredictiveAlertCard({ alert }: { alert: PredictiveAlert }) {
  const [open, setOpen] = useState(false);
  const cfg = urgencyConfig[alert.urgency];
  return (
    <div className={`rounded border ${cfg.bg} p-3 mb-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className={`mt-0.5 flex-shrink-0 ${cfg.icon}`}>{typeIcon[alert.type]}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-border text-muted-foreground">{typeLabel[alert.type]}</span>
              <span className="text-[9px] text-muted-foreground">{alert.subdivision}</span>
            </div>
            <div className="text-[11px] font-semibold text-foreground leading-tight">{alert.title}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{alert.summary}</div>
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <div className="text-[10px] font-semibold mono text-foreground">{alert.confidence}% conf.</div>
          <button onClick={() => setOpen(!open)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
            {open ? <><ChevronUp size={10}/>Less</> : <><ChevronDown size={10}/>Details</>}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 border-t border-border pt-3 space-y-3">
          <p className="text-[10px] text-muted-foreground leading-relaxed">{alert.detail}</p>

          {alert.type === 'threshold-drift' && alert.driftHistory && (
            <div>
              <div className="text-[10px] font-semibold text-foreground mb-1.5">Reading History vs Threshold ({alert.threshold}{alert.unit})</div>
              <div className="flex items-end gap-2">
                {alert.driftHistory.map((pt, i) => {
                  const pct = Math.min((pt.value / (alert.threshold! * 1.1)) * 100, 100);
                  const hot = pt.value > alert.threshold! * 0.75;
                  return (
                    <div key={i} className="flex-1 text-center">
                      <div className="text-[9px] text-muted-foreground mb-1 truncate">{pt.location.replace(/HBD |WILD /,'')}</div>
                      <div className="relative h-14 bg-border/40 rounded-sm overflow-hidden">
                        <div className={`absolute bottom-0 left-0 right-0 ${hot ? 'bg-amber-500/70' : 'bg-sky-500/50'}`} style={{ height: `${pct}%` }}/>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-[10px] font-bold ${hot ? 'text-amber-300' : 'text-sky-300'}`}>{pt.value}{alert.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex-1 text-center opacity-50">
                  <div className="text-[9px] text-muted-foreground mb-1">Projected</div>
                  <div className="relative h-14 bg-red-500/20 border border-red-500/40 rounded-sm flex items-center justify-center">
                    <span className="text-[10px] font-bold text-red-400">?</span>
                  </div>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <div className="h-0 flex-1" style={{ borderTop: '1px dashed rgba(239,68,68,0.5)' }}/>
                <span className="text-[9px] text-red-400">Alarm: {alert.threshold}{alert.unit}</span>
              </div>
            </div>
          )}

          {alert.type === 'correlated-signals' && alert.correlatedSignals && (
            <div>
              <div className="text-[10px] font-semibold text-foreground mb-1.5">{alert.historicalMatches} historical matches for this pattern</div>
              <div className="space-y-1.5">
                {alert.correlatedSignals.map((s, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 p-2 rounded bg-border/30">
                    <div>
                      <div className="text-[9px] font-semibold text-foreground">{s.system}</div>
                      <div className="text-[9px] text-muted-foreground">{s.metric}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-amber-400">{s.currentValue}</div>
                      <div className="text-[9px] text-muted-foreground">{s.deviation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alert.type === 'trace-latency' && alert.currentLatencyMs && (
            <div className="flex items-center gap-3">
              <div className="flex-1 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-[9px] text-muted-foreground">Baseline</div>
                <div className="text-sm font-bold text-emerald-400">{(alert.baselineLatencyMs!/1000).toFixed(1)}s</div>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="flex-1 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-[9px] text-muted-foreground">Current</div>
                <div className="text-sm font-bold text-amber-400">{(alert.currentLatencyMs/1000).toFixed(1)}s</div>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="flex-1 p-2 rounded bg-red-500/10 border border-red-500/20 text-center">
                <div className="text-[9px] text-muted-foreground">Bottleneck</div>
                <div className="text-[10px] font-bold text-red-400">{alert.affectedHop}</div>
              </div>
            </div>
          )}

          {alert.estimatedTimeToFailure && (
            <div className="flex items-start gap-2 p-2 rounded bg-border/30">
              <Clock size={11} className="text-amber-400 mt-0.5 flex-shrink-0"/>
              <div>
                <div className="text-[10px] font-semibold text-amber-400">Est. time to failure: {alert.estimatedTimeToFailure}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{alert.nextAction}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Train State Badge ────────────────────────────────────────────────────────

function StateBadge({ state }: { state: TrainState }) {
  const cfg = stateConfig[state];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
      {cfg.label}
    </span>
  );
}

// ─── Fleet Train Row ──────────────────────────────────────────────────────────

function TrainRow({ t }: { t: TrainSnapshot }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <div className="w-28 flex-shrink-0">
        <div className="text-[11px] font-bold mono text-foreground">{t.symbol}</div>
        <div className="text-[9px] text-muted-foreground truncate">{t.origin.replace(' Yard','')} → {t.destination.replace(' Yard','')}</div>
      </div>
      <StateBadge state={t.state} />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-muted-foreground truncate">{t.subdivision} · MP {t.milepost}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[11px] mono text-foreground">{t.speed} mph</div>
        <div className={`text-[9px] ${ptcColor[t.ptcState]}`}>PTC: {t.ptcState}</div>
      </div>
      <div className="text-right flex-shrink-0 w-16">
        <div className="text-[10px] mono text-foreground">{t.cars} cars</div>
        <div className="text-[9px] text-muted-foreground">{(t.weight/1000).toFixed(0)}kt</div>
      </div>
      {t.activeAlarms > 0 ? (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 font-bold flex-shrink-0">{t.activeAlarms} ALM</span>
      ) : (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">CLR</span>
      )}
    </div>
  );
}

// ─── Incident categories ──────────────────────────────────────────────────────

const incidentCategories = [
  { tag: 'Non-Technical / NSR', count: 1596, color: '#64748b' },
  { tag: 'Communication Failures', count: 377, color: '#D22630' },
  { tag: 'Hardware Faults', count: 512, color: '#f59e0b' },
  { tag: 'Positioning / GPS', count: 288, color: '#38bdf8' },
  { tag: 'Software / Config', count: 120, color: '#a78bfa' },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [timeIndex, setTimeIndex] = useState(NETWORK_TIMELINE.length - 1);
  const currentNetworkSnap = NETWORK_TIMELINE[timeIndex];
  const isLive = timeIndex === NETWORK_TIMELINE.length - 1;

  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating');
  const aiResolved   = incidents.filter(i => i.aiResolved);
  const imminent = predictiveAlerts.filter(a => a.urgency === 'imminent');
  const warning  = predictiveAlerts.filter(a => a.urgency === 'warning');
  const watch    = predictiveAlerts.filter(a => a.urgency === 'watch');

  // Fleet breakdown from snapshot
  const moving    = FLEET_SNAPSHOT.filter(t => t.state === 'EN_ROUTE_MOVING');
  const stopped   = FLEET_SNAPSHOT.filter(t => t.state === 'EN_ROUTE_STOPPED');
  const inYard    = FLEET_SNAPSHOT.filter(t => t.state === 'IN_YARD_PRE_DEPARTURE' || t.state === 'IN_YARD_POST_ARRIVAL' || t.state === 'IN_YARD_CLASSIFYING');
  const arriving  = FLEET_SNAPSHOT.filter(t => t.state === 'ARRIVING');
  const totalFuelSaved = FLEET_SNAPSHOT.reduce((s, t) => s + t.fuelSavedGallons, 0);
  const totalMilesActive = FLEET_SNAPSHOT.reduce((s, t) => s + t.milesToday, 0);

  // Fleet KPIs using time-travel snapshot
  const fleetKpis = [
    { label: "Trains Moving",    value: isLive ? moving.length    : currentNetworkSnap.trainsMoving,    unit: "",    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: <Navigation size={13} className="text-emerald-400"/> },
    { label: "Trains Stopped",   value: isLive ? stopped.length   : currentNetworkSnap.trainsStopped,   unit: "",    color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30",   icon: <Clock size={13} className="text-amber-400"/> },
    { label: "In Yards",         value: isLive ? inYard.length    : currentNetworkSnap.trainsInYard,    unit: "",    color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/30",       icon: <Package size={13} className="text-sky-400"/> },
    { label: "Arriving",         value: isLive ? arriving.length  : currentNetworkSnap.trainsArriving,  unit: "",    color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/30",     icon: <ArrowRight size={13} className="text-cyan-400"/> },
    { label: "Miles Covered",    value: isLive ? DAILY_SUMMARY.totalMilesCovered.toLocaleString() : currentNetworkSnap.totalMilesNetwork.toLocaleString(), unit: "mi", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30", icon: <Gauge size={13} className="text-violet-400"/> },
    { label: "Fuel Saved Today", value: isLive ? DAILY_SUMMARY.fuelSavedGallons.toLocaleString() : currentNetworkSnap.fuelSavedGallons.toLocaleString(), unit: "gal", color: "text-lime-400", bg: "bg-lime-500/10 border-lime-500/30", icon: <Fuel size={13} className="text-lime-400"/> },
    { label: "Active Alarms",    value: isLive ? FLEET_SNAPSHOT.reduce((s,t) => s+t.activeAlarms,0) : currentNetworkSnap.activeAlarms, unit: "", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: <AlertTriangle size={13} className="text-red-400"/>, link: "/incidents" },
    { label: "Safety Compliance", value: isLive ? "99.2" : currentNetworkSnap.ptcCompliance.toFixed(1), unit: "%", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: <CheckCircle size={13} className="text-emerald-400"/>, link: "/assets" },
    { label: "LVVR Faults",      value: 3, unit: "", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: <Eye size={13} className="text-red-400"/>, link: "/assets" },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Network Overview</h1>
            <p className="text-xs text-muted-foreground mt-0.5">CN Rail OT · Single Pane of Glass · OWL · CARMA · Dynatrace · ServiceNow</p>
          </div>
          <div className="flex items-center gap-3">
            {!isLive && (
              <span className="text-[11px] px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
                Time Travel: {currentNetworkSnap.time}
              </span>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}/>
              <span className={`text-[11px] font-medium ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>{isLive ? 'Live' : 'Historical'}</span>
            </div>
          </div>
        </div>

        {/* ═══ TIME-TRAVEL SLIDER ═══ */}
        <div className="rounded border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RotateCcw size={13} className="text-muted-foreground"/>
              <span className="text-xs font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Network Time-Travel</span>
              <span className="text-[10px] text-muted-foreground">— Scrub back to see how the fleet evolved throughout the day</span>
            </div>
            <button
              onClick={() => setTimeIndex(NETWORK_TIMELINE.length - 1)}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${isLive ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              Jump to Live
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] mono text-muted-foreground w-10">00:00</span>
            <input
              type="range"
              min={0}
              max={NETWORK_TIMELINE.length - 1}
              value={timeIndex}
              onChange={e => setTimeIndex(Number(e.target.value))}
              className="flex-1 accent-[#D22630] h-1.5 cursor-pointer"
            />
            <span className="text-[10px] mono text-muted-foreground w-10 text-right">10:00</span>
          </div>
          {/* Timeline tick labels */}
          <div className="flex justify-between mt-1 px-10">
            {NETWORK_TIMELINE.map((snap, i) => (
              <button
                key={snap.time}
                onClick={() => setTimeIndex(i)}
                className={`text-[9px] mono transition-colors ${i === timeIndex ? 'text-[#D22630] font-bold' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {snap.time}
              </button>
            ))}
          </div>
          {/* Mini sparkline of trains moving */}
          <div className="mt-2 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={NETWORK_TIMELINE} margin={{ top:2, right:0, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="movGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide/>
                <YAxis hide domain={['auto','auto']}/>
                <Tooltip
                  contentStyle={{ background:'#1f2937', border:'1px solid #374151', borderRadius:4, fontSize:10 }}
                  labelStyle={{ color:'#f9fafb' }}
                  formatter={(v: number) => [v, 'Trains Moving']}
                />
                <Area type="monotone" dataKey="trainsMoving" stroke="#10B981" strokeWidth={1.5} fill="url(#movGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═══ FLEET KPI TILES (9 tiles) ═══ */}
        <div className="grid grid-cols-9 gap-2">
          {fleetKpis.map((kpi: any) => (
            <a key={kpi.label} href={kpi.link || '#'} className={`rounded border p-3 ${kpi.bg} block hover:opacity-90 transition-opacity`}>
              <div className="flex items-center gap-1.5 mb-1">
                {kpi.icon}
                <div className="text-[9px] text-muted-foreground uppercase tracking-wide leading-tight">{kpi.label}</div>
              </div>
              <div className={`text-lg font-bold mono ${kpi.color}`}>
                {kpi.value}{kpi.unit && <span className="text-[10px] font-normal ml-0.5">{kpi.unit}</span>}
              </div>
            </a>
          ))}
        </div>

        {/* ═══ DAILY SUMMARY STRIP ═══ */}
        <div className="rounded border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Train size={13} className="text-[#D22630]"/>
            <span className="text-xs font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Today's Network Summary</span>
            <span className="text-[10px] text-muted-foreground">— {DAILY_SUMMARY.date} · All subdivisions</span>
          </div>
          <div className="grid grid-cols-10 gap-3">
            {[
              { label: "Trains Active",     value: DAILY_SUMMARY.trainsActive,                       unit: "" },
              { label: "Trains Completed",  value: DAILY_SUMMARY.trainsCompleted,                    unit: "" },
              { label: "Cars Moved",        value: DAILY_SUMMARY.totalCarsMoved.toLocaleString(),     unit: "" },
              { label: "Tons Moved",        value: (DAILY_SUMMARY.totalTonsMoved/1000).toFixed(0)+"k", unit: "t" },
              { label: "Brake Tests",       value: `${DAILY_SUMMARY.airBrakeTestsPassed}/${DAILY_SUMMARY.airBrakeTestsTotal}`, unit: "pass" },
              { label: "Consist Changes",   value: DAILY_SUMMARY.consistChanges,                     unit: "" },
              { label: "Crew Changes",      value: DAILY_SUMMARY.crewChanges,                        unit: "" },
              { label: "Detector Passages", value: DAILY_SUMMARY.detectorPassages,                   unit: "" },
              { label: "Detector Alarms",   value: DAILY_SUMMARY.detectorAlarms,                     unit: "" },
              { label: "Foreign Cars",      value: DAILY_SUMMARY.foreignCarsHandled,                 unit: "" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-base font-bold mono text-foreground">{s.value}<span className="text-[9px] font-normal text-muted-foreground ml-0.5">{s.unit}</span></div>
                <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ FLEET STATE + YARD STATUS ROW ═══ */}
        <div className="grid grid-cols-12 gap-4">

          {/* Active Fleet State */}
          <div className="col-span-7 bg-card border border-border rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Train size={13} className="text-[#D22630]"/>
                <span className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Active Fleet State</span>
                <span className="text-[10px] text-muted-foreground">— {FLEET_SNAPSHOT.length} trains tracked</span>
              </div>
              <a href="/fleet" className="text-[11px] text-[#D22630] hover:underline">Fleet Operations →</a>
            </div>
            <div className="space-y-0">
              {FLEET_SNAPSHOT.map(t => <TrainRow key={t.id} t={t}/>)}
            </div>
          </div>

          {/* Yard Status */}
          <div className="col-span-5 bg-card border border-border rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={13} className="text-[#D22630]"/>
              <span className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Yard Status</span>
              <span className="text-[10px] text-muted-foreground">— {YARDS.length} yards</span>
            </div>
            <div className="space-y-2">
              {YARDS.map(yard => {
                const utilPct = Math.round((yard.currentCars / yard.capacity) * 100) || 0;
                return (
                  <div key={yard.id} className="p-2.5 rounded bg-border/20 border border-border">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="text-[11px] font-semibold text-foreground">{yard.name}</div>
                        <div className="text-[9px] text-muted-foreground">{yard.city}, {yard.province} · {yard.subdivision} Sub</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] mono text-foreground">{yard.trainsInYard} trains</div>
                        <div className="text-[9px] text-muted-foreground">{yard.currentLocos} locos</div>
                      </div>
                    </div>
                    {yard.capacity > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] text-muted-foreground">{yard.currentCars.toLocaleString()} / {yard.capacity.toLocaleString()} cars</span>
                          <span className={`text-[9px] font-bold ${utilPct > 85 ? 'text-amber-400' : 'text-emerald-400'}`}>{utilPct}%</span>
                        </div>
                        <div className="h-1 bg-border rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${utilPct > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${utilPct}%` }}/>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {yard.trainsArriving > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">{yard.trainsArriving} arriving</span>}
                      {yard.trainsDeparting > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime-500/10 border border-lime-500/20 text-lime-400">{yard.trainsDeparting} departing</span>}
                      <span className="text-[9px] text-muted-foreground">{yard.type}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ PREDICTIVE ALERTS PANEL ═══ */}
        <div className="rounded border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-amber-400"/>
              <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Predictive Alerts</span>
              <span className="text-[10px] text-muted-foreground">— Issues detected before failure occurs</span>
            </div>
            <div className="flex items-center gap-2">
              {imminent.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-foreground font-bold">{imminent.length} IMMINENT</span>}
              {warning.length  > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-foreground font-bold">{warning.length} WARNING</span>}
              {watch.length    > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-sky-600 text-foreground font-bold">{watch.length} WATCH</span>}
            </div>
          </div>

          {/* Signal type explainers */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { icon: <Thermometer size={11} className="text-red-400"/>, title: 'Threshold Drift', desc: 'A sensor reading is trending toward its alarm threshold. The platform projects when it will be breached based on the rate of change — before any alarm fires.' },
              { icon: <Activity size={11} className="text-amber-400"/>, title: 'Correlated Weak Signals', desc: 'No single metric is alarming, but 2–3 weak signals from different systems on the same asset match a known pre-failure pattern from historical incidents.' },
              { icon: <Radio size={11} className="text-sky-400"/>, title: 'Trace Latency Anomaly', desc: 'Synthetic PTC message traces show end-to-end latency climbing. The bottleneck hop is identified before any locomotive experiences a communication failure.' },
            ].map(s => (
              <div key={s.title} className="p-2.5 rounded bg-card border border-border">
                <div className="flex items-center gap-1.5 mb-1">{s.icon}<span className="text-[10px] font-semibold text-foreground">{s.title}</span></div>
                <div className="text-[9.5px] text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Alert cards — two columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>{predictiveAlerts.slice(0,3).map(a => <PredictiveAlertCard key={a.id} alert={a}/>)}</div>
            <div>{predictiveAlerts.slice(3).map(a => <PredictiveAlertCard key={a.id} alert={a}/>)}</div>
          </div>
        </div>

        {/* ═══ CHARTS + INCIDENTS ROW ═══ */}
        <div className="grid grid-cols-12 gap-4">

          {/* Incident trend */}
          <div className="col-span-5 bg-card border border-border rounded p-4">
            <div className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Incident Volume Trend</div>
            <div className="text-xs text-muted-foreground mb-3">Jan 2024 – May 2025 · 2,893 total</div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={incidentTrendData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                <defs>
                  <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#38BDF8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize:9, fill:'#6b7280' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:9, fill:'#6b7280' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background:'#1f2937', border:'1px solid #374151', borderRadius:4, fontSize:11 }} labelStyle={{ color:'#f9fafb' }}/>
                <Area type="monotone" dataKey="total"      stroke="#38BDF8" strokeWidth={2} fill="url(#tGrad)"/>
                <Area type="monotone" dataKey="aiResolved" stroke="#10B981" strokeWidth={2} fill="url(#aiGrad)"/>
                <Area type="monotone" dataKey="critical"   stroke="#D22630" strokeWidth={1.5} fill="none" strokeDasharray="4 2"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Incident categories */}
          <div className="col-span-3 bg-card border border-border rounded p-4">
            <div className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Incident Categories</div>
            <div className="text-xs text-muted-foreground mb-3">By category, 2024–2025</div>
            <div className="space-y-2">
              {incidentCategories.map(c => (
                <div key={c.tag} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-foreground truncate">{c.tag}</span>
                      <span className="text-[11px] mono text-muted-foreground ml-2">{c.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1 bg-border rounded-full mt-0.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${(c.count/1596)*100}%`, backgroundColor:c.color }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active incidents */}
          <div className="col-span-4 bg-card border border-border rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Active Incidents</div>
              <a href="/incidents" className="text-[11px] text-[#D22630] hover:underline">View all →</a>
            </div>
            <div className="space-y-2">
              {openIncidents.map(inc => (
                <div key={inc.id} className={`rounded p-2.5 border ${inc.severity==='critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertTriangle size={13} className={`mt-0.5 flex-shrink-0 ${inc.severity==='critical' ? 'text-red-400' : 'text-amber-400'}`}/>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{inc.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="mono text-[10px] text-muted-foreground">{inc.id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-border text-muted-foreground">{inc.system}</span>
                          {inc.subdivision && <span className="text-[10px] text-muted-foreground">{inc.subdivision}</span>}
                        </div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-medium flex-shrink-0 ${inc.severity==='critical' ? 'text-red-400' : 'text-amber-400'}`}>
                      {inc.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ SUBDIVISION TRAFFIC + PTC STATE ═══ */}
        <div className="grid grid-cols-12 gap-4">
          {/* Subdivision traffic bar */}
          <div className="col-span-7 bg-card border border-border rounded p-4">
            <div className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Subdivision Traffic — Last 7 Days</div>
            <div className="text-xs text-muted-foreground mb-3">Car passages per subdivision</div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={[
                { sub: 'Kingston', passages: 1842, alarms: 12 },
                { sub: 'Edson',    passages: 1623, alarms: 18 },
                { sub: 'Rivers',   passages: 1411, alarms: 9  },
                { sub: 'Capreol',  passages: 1288, alarms: 14 },
                { sub: 'Bala',     passages: 984,  alarms: 6  },
                { sub: 'Ruel',     passages: 712,  alarms: 4  },
                { sub: 'Walker',   passages: 623,  alarms: 7  },
                { sub: 'Biggar',   passages: 541,  alarms: 3  },
              ]} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                <XAxis dataKey="sub" tick={{ fontSize:9, fill:'#6b7280' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:9, fill:'#6b7280' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background:'#1f2937', border:'1px solid #374151', borderRadius:4, fontSize:11 }} labelStyle={{ color:'#f9fafb' }}/>
                <Bar dataKey="passages" fill="#38BDF8" radius={[2,2,0,0]} name="Passages"/>
                <Bar dataKey="alarms"   fill="#D22630" radius={[2,2,0,0]} name="Alarms"/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Safety System State */}
          <div className="col-span-5 bg-card border border-border rounded p-4">
            <div className="text-sm font-semibold text-foreground mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Safety System State</div>
            <div className="text-xs text-muted-foreground mb-3">ETC-ATP · ETC-DAS · PTC · Active trains</div>
            {/* System family breakdown */}
            <div className="space-y-2 mb-3">
              {[
                { label: '🇨🇦 ETC-ATP', desc: 'Auto brake · WIU corridors', count: 8,  pct: 42, color: 'bg-cyan-500',    text: 'text-cyan-400' },
                { label: '🇨🇦 ETC-DAS', desc: 'Advisory only · No WIUs',   count: 6,  pct: 32, color: 'bg-teal-500',    text: 'text-teal-400' },
                { label: '🇺🇸 PTC',     desc: 'CSXT interop · US corridors', count: 5, pct: 26, color: 'bg-amber-500',   text: 'text-amber-400' },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-medium text-foreground">{r.label}</span>
                    <span className={`text-[10px] font-bold mono ${r.text}`}>{r.count} trains</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground mb-0.5">{r.desc}</div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.pct}%` }}/>
                  </div>
                </div>
              ))}
            </div>
            {/* Operational state summary */}
            <div className="border-t border-border pt-2">
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Operational State</div>
              <div className="grid grid-cols-2 gap-1">
                {[{ label: 'Active',       val: 14, color: 'text-emerald-400' },
                  { label: 'Initializing', val: 2,  color: 'text-sky-400' },
                  { label: 'Suppressed',   val: 2,  color: 'text-amber-400' },
                  { label: 'Bypass',       val: 1,  color: 'text-red-400' }].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{r.label}</span>
                    <span className={`text-[10px] font-bold mono ${r.color}`}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SUBDIVISION ALARM HEATMAP ═══ */}
        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={13} className="text-[#D22630]"/>
            <span className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Subdivision Alarm Density</span>
            <span className="text-[10px] text-muted-foreground">— Active alarms per subdivision · Last 24h</span>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {[
              { sub: 'Kingston',  alarms: 14, wius: 188, safetySystem: 'ETC-ATP', trains: 4 },
              { sub: 'Edson',     alarms: 18, wius: 0,   safetySystem: 'ETC-DAS', trains: 3 },
              { sub: 'Rivers',    alarms: 9,  wius: 0,   safetySystem: 'ETC-DAS', trains: 2 },
              { sub: 'Capreol',   alarms: 12, wius: 142, safetySystem: 'ETC-ATP', trains: 2 },
              { sub: 'Bala',      alarms: 6,  wius: 97,  safetySystem: 'ETC-ATP', trains: 2 },
              { sub: 'Ruel',      alarms: 4,  wius: 63,  safetySystem: 'ETC-ATP', trains: 1 },
              { sub: 'Wainwright',alarms: 7,  wius: 0,   safetySystem: 'ETC-DAS', trains: 2 },
              { sub: 'CSXT',      alarms: 3,  wius: 211, safetySystem: 'PTC',     trains: 3 },
            ].map(s => {
              const intensity = s.alarms > 15 ? 'bg-red-500/30 border-red-500/40' : s.alarms > 8 ? 'bg-amber-500/20 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/20';
              const textColor = s.alarms > 15 ? 'text-red-400' : s.alarms > 8 ? 'text-amber-400' : 'text-emerald-400';
              return (
                <a key={s.sub} href="/wayside" className={`rounded border p-2.5 text-center hover:opacity-90 transition-opacity ${intensity}`}>
                  <div className={`text-lg font-bold mono ${textColor}`}>{s.alarms}</div>
                  <div className="text-[10px] font-medium text-foreground mt-0.5">{s.sub}</div>
                  <div className="text-[9px] text-muted-foreground">{s.trains} trains</div>
                  <div className={`text-[8px] mt-1 px-1 py-0.5 rounded ${
                    s.safetySystem === 'ETC-ATP' ? 'bg-cyan-500/10 text-cyan-400' :
                    s.safetySystem === 'ETC-DAS' ? 'bg-teal-500/10 text-teal-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>{s.safetySystem}</div>
                </a>
              );
            })}
          </div>
        </div>

        {/* ═══ AI AGENT ACTIVITY ═══ */}
        <div className="bg-card border border-border rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={14} className="text-sky-400"/>
            <span className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI Agent Activity</span>
            <span className="text-[10px] text-muted-foreground">— Automated resolution log</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {aiResolved.map(inc => (
              <div key={inc.id} className="rounded p-2.5 border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-start gap-2">
                  <CheckCircle size={12} className="text-emerald-400 mt-0.5 flex-shrink-0"/>
                  <div className="min-w-0">
                    <div className="text-[11px] text-foreground truncate">{inc.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-emerald-400">Auto-resolved</span>
                      {inc.mttr && <span className="mono text-[10px] text-muted-foreground">MTTR: {inc.mttr}m</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded p-2.5 border border-sky-500/20 bg-sky-500/5">
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-sky-400"/>
                <div className="text-[11px] text-sky-400 font-medium">41 incidents auto-resolved today</div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">AI Agents handled NSR triage, GPS transient events, and GCP infrastructure alerts without human intervention.</div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

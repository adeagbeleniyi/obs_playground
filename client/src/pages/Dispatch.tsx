import Layout from "@/components/Layout";
import {
  TRACK_EVENTS, DISPATCHED_TRAINS,
  type TrackEvent, type TrackEventType, type DispatchedTrain, type DispatchStatus,
} from "@/lib/dispatchData";
import { useState, useMemo } from "react";
import {
  AlertTriangle, Clock, MapPin, Train, Radio, Wrench,
  ChevronRight, Info, Activity, Shield, Flag, FileText,
  ArrowRight, CheckCircle, XCircle, Zap, Navigation,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

// ─── Config helpers ───────────────────────────────────────────────────────────

const eventTypeConfig: Record<TrackEventType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  SLOW_ORDER:            { label: "Slow Order",          icon: <Clock size={11}/>,         color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
  WORK_LIMIT:            { label: "Work Limit",          icon: <Wrench size={11}/>,        color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30" },
  FLAGGING_LIMIT:        { label: "Flagging Limit",      icon: <Flag size={11}/>,          color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30" },
  TRACK_WARRANT:         { label: "Track Warrant",       icon: <FileText size={11}/>,      color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/30" },
  FORM_B:                { label: "Form B",              icon: <Shield size={11}/>,        color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/30" },
  BULLETIN_ORDER:        { label: "Bulletin Order",      icon: <Info size={11}/>,          color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/30" },
  EMERGENCY_RESTRICTION: { label: "Emergency",           icon: <AlertTriangle size={11}/>, color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30" },
  BRIDGE_RESTRICTION:    { label: "Bridge Restriction",  icon: <AlertTriangle size={11}/>, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
};

const dispatchStatusConfig: Record<DispatchStatus, { label: string; color: string; bg: string; dot: string }> = {
  AUTHORIZED: { label: "Authorized",  color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/30",     dot: "bg-sky-400" },
  EN_ROUTE:   { label: "En Route",    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-400" },
  HOLDING:    { label: "Holding",     color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30", dot: "bg-amber-400 animate-pulse" },
  DELAYED:    { label: "Delayed",     color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30",     dot: "bg-red-400" },
  ANNULLED:   { label: "Annulled",    color: "text-muted-foreground",    bg: "bg-zinc-500/10 border-zinc-500/30",   dot: "bg-zinc-500" },
  COMPLETED:  { label: "Completed",   color: "text-muted-foreground",    bg: "bg-zinc-500/10 border-zinc-500/30",   dot: "bg-zinc-400" },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  PRIORITY:     { color: "text-red-400",     bg: "bg-red-500/10" },
  INTERMODAL:   { color: "text-sky-400",     bg: "bg-sky-500/10" },
  MANIFEST:     { color: "text-muted-foreground",    bg: "bg-zinc-500/10" },
  GRAIN:        { color: "text-amber-400",   bg: "bg-amber-500/10" },
  AUTOMOTIVE:   { color: "text-violet-400",  bg: "bg-violet-500/10" },
  UNIT:         { color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

const severityBg: Record<string, string> = {
  INFO:     "border-sky-500/20 bg-sky-500/5",
  WARNING:  "border-amber-500/20 bg-amber-500/5",
  CRITICAL: "border-red-500/30 bg-red-500/8",
};

// ─── Track Event Card ─────────────────────────────────────────────────────────

function TrackEventCard({ ev }: { ev: TrackEvent }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = eventTypeConfig[ev.type];

  return (
    <div className={`rounded border p-3 ${severityBg[ev.severity]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className={`mt-0.5 flex-shrink-0 ${cfg.color}`}>{cfg.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
              <span className="text-[10px] font-semibold text-foreground">{ev.subdivision} Sub</span>
              <span className="text-[10px] mono text-muted-foreground">MP {ev.fromMp} – {ev.toMp}</span>
              <span className="text-[9px] text-muted-foreground">({ev.direction})</span>
              {ev.speedLimit !== undefined && (
                <span className="text-[9px] font-bold text-amber-400">
                  {ev.speedLimit} mph <span className="text-muted-foreground font-normal">(was {ev.normalSpeed})</span>
                </span>
              )}
              {ev.formBNumber && (
                <span className="text-[9px] mono text-orange-400">{ev.formBNumber}</span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground leading-relaxed">{ev.description}</div>
            {ev.protectedBy && (
              <div className="mt-1 flex items-center gap-1.5">
                <Flag size={9} className="text-red-400 flex-shrink-0"/>
                <span className="text-[9px] text-red-400 font-medium">{ev.protectedBy}</span>
                {ev.flagmanRadioChannel && <span className="text-[9px] text-muted-foreground">· {ev.flagmanRadioChannel}</span>}
                {ev.flagmanPosition !== undefined && <span className="text-[9px] mono text-muted-foreground">· MP {ev.flagmanPosition}</span>}
              </div>
            )}
            {ev.workType && (
              <div className="mt-1 flex items-center gap-1.5">
                <Wrench size={9} className="text-muted-foreground flex-shrink-0"/>
                <span className="text-[9px] text-muted-foreground">{ev.workType}</span>
                {ev.contractor && <span className="text-[9px] text-muted-foreground">· {ev.contractor}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-[9px] mono text-muted-foreground">{ev.issuedAt.split(' ')[1]}</div>
          {ev.expiresAt && <div className="text-[9px] mono text-muted-foreground">exp {ev.expiresAt.split(' ')[1]}</div>}
          <div className="text-[9px] text-muted-foreground mt-0.5">{ev.issuedBy.split('—')[0].trim()}</div>
        </div>
      </div>

      {/* Affected trains */}
      {ev.affectedTrains.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] text-muted-foreground">Affected:</span>
          {ev.affectedTrains.map(t => (
            <span key={t} className="text-[9px] mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10">{t.replace('CN-','')}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dispatched Train Row ─────────────────────────────────────────────────────

function DispatchRow({ train }: { train: DispatchedTrain }) {
  const [expanded, setExpanded] = useState(false);
  const dCfg = dispatchStatusConfig[train.dispatchStatus];
  const pCfg = priorityConfig[train.priority] || { color: "text-muted-foreground", bg: "bg-zinc-500/10" };

  // Get active restrictions for this train
  const restrictions = TRACK_EVENTS.filter(e => train.activeRestrictions.includes(e.id));

  return (
    <div className="bg-card border border-border rounded overflow-hidden">
      {/* Main row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dCfg.dot}`}/>

        {/* Train ID */}
        <div className="w-28 flex-shrink-0">
          <div className="text-xs font-bold mono text-foreground">{train.symbol}</div>
          <div className="text-[9px] text-muted-foreground">{train.subdivision} Sub</div>
        </div>

        {/* Status badge */}
        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${dCfg.bg} ${dCfg.color}`}>
          {dCfg.label}
        </div>

        {/* Priority */}
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${pCfg.bg} ${pCfg.color}`}>
          {train.priority}
        </span>

        {/* Route */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-[10px] text-muted-foreground truncate">{train.origin}</span>
          <ArrowRight size={10} className="text-zinc-600 flex-shrink-0"/>
          <span className="text-[10px] text-muted-foreground truncate">{train.destination}</span>
        </div>

        {/* MP */}
        <div className="text-[10px] mono text-muted-foreground flex-shrink-0 w-16 text-right">
          MP {train.currentMp}
        </div>

        {/* RTC */}
        <div className="text-[9px] text-muted-foreground flex-shrink-0 w-28 text-right truncate">
          {train.rtcName}
        </div>

        {/* Delay */}
        {train.delayMinutes > 0 ? (
          <div className="text-[10px] font-bold text-red-400 flex-shrink-0 w-14 text-right">
            +{train.delayMinutes}m
          </div>
        ) : (
          <div className="text-[10px] text-emerald-400 flex-shrink-0 w-14 text-right">On time</div>
        )}

        {/* Restrictions indicator */}
        {restrictions.length > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <AlertTriangle size={11} className="text-amber-400"/>
            <span className="text-[9px] text-amber-400">{restrictions.length}</span>
          </div>
        )}

        {/* Expand */}
        <ChevronRight size={12} className={`text-zinc-600 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}/>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border bg-background/40 p-3 space-y-3">
          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Schedule</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground w-24">Sched. Departure</span>
                  <span className="text-[10px] mono text-foreground">{train.scheduledDeparture.split(' ')[1]}</span>
                  {train.actualDeparture && train.actualDeparture !== train.scheduledDeparture && (
                    <span className="text-[9px] text-amber-400">actual: {train.actualDeparture.split(' ')[1]}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground w-24">Sched. Arrival</span>
                  <span className="text-[10px] mono text-foreground">{train.scheduledArrival.split(' ')[1]}</span>
                  {train.estimatedArrival && train.estimatedArrival !== train.scheduledArrival && (
                    <span className="text-[9px] text-red-400">est: {train.estimatedArrival.split(' ')[1]}</span>
                  )}
                </div>
                {train.delayMinutes > 0 && train.delayReason && (
                  <div className="flex items-start gap-2 mt-1">
                    <span className="text-[9px] text-muted-foreground w-24 flex-shrink-0">Delay reason</span>
                    <span className="text-[9px] text-red-400">{train.delayReason}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Dispatch</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground w-20">RTC</span>
                  <span className="text-[10px] text-foreground">{train.rtcName} · {train.rtcCenter}</span>
                </div>
                {train.holdingAt && (
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] text-muted-foreground w-20 flex-shrink-0">Holding at</span>
                    <span className="text-[9px] text-amber-400">{train.holdingAt}</span>
                  </div>
                )}
                {train.holdReason && (
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] text-muted-foreground w-20 flex-shrink-0">Hold reason</span>
                    <span className="text-[9px] text-amber-400">{train.holdReason}</span>
                  </div>
                )}
                {train.nextMeetTrain && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground w-20">Next meet</span>
                    <span className="text-[9px] mono text-sky-400">{train.nextMeetTrain.replace('CN-','')} @ MP {train.nextMeetMp}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active restrictions */}
          {restrictions.length > 0 && (
            <div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Active Track Restrictions</div>
              <div className="space-y-1.5">
                {restrictions.map(r => {
                  const rCfg = eventTypeConfig[r.type];
                  return (
                    <div key={r.id} className={`flex items-start gap-2 p-2 rounded border text-[10px] ${severityBg[r.severity]}`}>
                      <span className={`flex-shrink-0 mt-0.5 ${rCfg.color}`}>{rCfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`font-semibold ${rCfg.color}`}>{rCfg.label}</span>
                        <span className="text-muted-foreground"> · {r.subdivision} Sub MP {r.fromMp}–{r.toMp}</span>
                        {r.speedLimit !== undefined && <span className="text-amber-400"> · {r.speedLimit} mph</span>}
                        {r.protectedBy && <span className="text-red-400"> · {r.protectedBy}</span>}
                        <div className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">{r.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "trains",   label: "Dispatched Trains",    icon: <Train size={13}/> },
  { id: "events",   label: "Track Events & Orders", icon: <AlertTriangle size={13}/> },
  { id: "flagging", label: "Flagging & Form B",     icon: <Flag size={13}/> },
  { id: "warrants", label: "Track Warrants",        icon: <FileText size={13}/> },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Dispatch() {
  const [activeTab, setActiveTab] = useState("trains");
  const [subFilter, setSubFilter] = useState("ALL");

  const subdivisions = useMemo(() => {
    const subs = Array.from(new Set(TRACK_EVENTS.map(e => e.subdivision)));
    return ["ALL", ...subs.sort()];
  }, []);

  const filteredEvents = useMemo(() => {
    return TRACK_EVENTS.filter(e => subFilter === "ALL" || e.subdivision === subFilter);
  }, [subFilter]);

  const flaggingEvents = TRACK_EVENTS.filter(e => e.type === "FLAGGING_LIMIT" || e.type === "FORM_B");
  const warrantEvents  = TRACK_EVENTS.filter(e => e.type === "TRACK_WARRANT" || e.type === "FORM_B");

  // KPIs
  const activeRestrictions = TRACK_EVENTS.filter(e => e.status === "ACTIVE").length;
  const criticalEvents      = TRACK_EVENTS.filter(e => e.severity === "CRITICAL" && e.status === "ACTIVE").length;
  const holdingTrains       = DISPATCHED_TRAINS.filter(t => t.dispatchStatus === "HOLDING").length;
  const delayedTrains       = DISPATCHED_TRAINS.filter(t => t.dispatchStatus === "DELAYED").length;
  const totalDelayMins      = DISPATCHED_TRAINS.reduce((s, t) => s + t.delayMinutes, 0);

  return (
    <Layout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Dispatch & Track Authority</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dispatched trains · Slow orders · Work limits · Flagging protection · Form B · Track warrants
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              <span className="text-[11px] text-emerald-400 font-medium">RTC Live</span>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Dispatched Trains",      value: DISPATCHED_TRAINS.length,                    color: "text-foreground",   bg: "bg-card border-border" },
            { label: "Holding",                value: holdingTrains,                                color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
            { label: "Delayed",                value: delayedTrains,                                color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30" },
            { label: "Active Restrictions",    value: activeRestrictions,                           color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
            { label: "Critical Events",        value: criticalEvents,                               color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30" },
          ].map(k => (
            <div key={k.label} className={`rounded border p-3 ${k.bg}`}>
              <div className="text-[10px] text-muted-foreground mb-1">{k.label}</div>
              <div className={`text-2xl font-bold mono ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Dispatch Analytics Charts */}
        {(() => {
          // Event type distribution
          const typeCounts: Record<string, number> = {};
          TRACK_EVENTS.forEach(e => { typeCounts[eventTypeConfig[e.type]?.label || e.type] = (typeCounts[eventTypeConfig[e.type]?.label || e.type] || 0) + 1; });
          const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
          const TYPE_COLORS = ['#EF4444', '#F59E0B', '#EF4444', '#A78BFA', '#FB923C', '#38BDF8', '#EF4444', '#F59E0B'];

          // Dispatch status distribution
          const statusCounts: Record<string, number> = {};
          DISPATCHED_TRAINS.forEach(t => { statusCounts[dispatchStatusConfig[t.dispatchStatus]?.label || t.dispatchStatus] = (statusCounts[dispatchStatusConfig[t.dispatchStatus]?.label || t.dispatchStatus] || 0) + 1; });
          const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
          const STATUS_COLORS: Record<string, string> = { 'Authorized': '#38BDF8', 'En Route': '#10B981', 'Holding': '#F59E0B', 'Delayed': '#EF4444', 'Annulled': '#64748b', 'Completed': '#94a3b8' };

          // Delay by train
          const delayData = DISPATCHED_TRAINS.filter(t => t.delayMinutes > 0).map(t => ({ train: t.trainId.replace('CN-',''), delay: t.delayMinutes })).sort((a, b) => b.delay - a.delay).slice(0, 6);

          const tooltipStyle = {
            contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 },
            labelStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 10 },
          };

          return (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Track Events by Type</p>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={typeData} margin={{ left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 7, fill: 'hsl(var(--muted-foreground))' }} angle={-30} textAnchor="end" height={36} />
                    <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="value" name="Events" radius={[3, 3, 0, 0]}>
                      {typeData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Train Dispatch Status</p>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={2} dataKey="value">
                      {statusData.map(entry => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Delay by Train (min)</p>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={delayData} margin={{ left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="train" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="delay" fill="#EF4444" name="Delay (min)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* Total delay banner */}
        {totalDelayMins > 0 && (
          <div className="rounded border border-amber-500/20 bg-amber-500/5 p-3 flex items-center gap-3">
            <Clock size={14} className="text-amber-400 flex-shrink-0"/>
            <div className="text-[11px] text-amber-400">
              <span className="font-bold">{totalDelayMins} minutes</span> of cumulative delay across {DISPATCHED_TRAINS.filter(t => t.delayMinutes > 0).length} trains today.
              Primary causes: HBD mechanical hold (L50251, 210 min), ABT failure and re-test (A41451, 115 min), meet/pass delay (T22151, 50 min).
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-[#D22630] text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB: DISPATCHED TRAINS ═══ */}
        {activeTab === "trains" && (
          <div className="space-y-3">
            {/* Context note */}
            <div className="rounded border border-sky-500/20 bg-sky-500/5 p-3 flex items-start gap-2">
              <Info size={12} className="text-sky-400 mt-0.5 flex-shrink-0"/>
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="text-sky-400 font-semibold">Dispatch context: </span>
                All trains shown are under active RTC (Rail Traffic Controller) authority. Each train operates under a Movement Authority (MA) issued by the PDS via BOS. Trains in HOLDING status are waiting for a meet/pass clearance, crew change, or mechanical resolution. Click any row to expand dispatch detail and active track restrictions.
              </div>
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-3 px-3 py-1.5 text-[9px] text-muted-foreground uppercase tracking-widest border-b border-border">
              <div className="w-2 flex-shrink-0"/>
              <div className="w-28 flex-shrink-0">Train</div>
              <div className="w-20 flex-shrink-0">Status</div>
              <div className="w-20 flex-shrink-0">Priority</div>
              <div className="flex-1">Route</div>
              <div className="w-16 text-right flex-shrink-0">Position</div>
              <div className="w-28 text-right flex-shrink-0">RTC</div>
              <div className="w-14 text-right flex-shrink-0">Delay</div>
              <div className="w-8 flex-shrink-0"/>
              <div className="w-4 flex-shrink-0"/>
            </div>

            <div className="space-y-1.5">
              {DISPATCHED_TRAINS.map(t => <DispatchRow key={t.trainId} train={t}/>)}
            </div>
          </div>
        )}

        {/* ═══ TAB: TRACK EVENTS ═══ */}
        {activeTab === "events" && (
          <div className="space-y-3">
            {/* Subdivision filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground">Subdivision:</span>
              {subdivisions.map(s => (
                <button
                  key={s}
                  onClick={() => setSubFilter(s)}
                  className={`text-[9px] px-2 py-1 rounded border transition-colors ${
                    subFilter === s ? 'border-[#D22630] text-[#D22630] bg-[#D22630]/10' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Event type legend */}
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(eventTypeConfig).map(([type, cfg]) => (
                <div key={type} className="flex items-center gap-1">
                  <span className={cfg.color}>{cfg.icon}</span>
                  <span className="text-[9px] text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {filteredEvents.map(ev => <TrackEventCard key={ev.id} ev={ev}/>)}
              {filteredEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No track events for selected subdivision</div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB: FLAGGING & FORM B ═══ */}
        {activeTab === "flagging" && (
          <div className="space-y-3">
            {/* Context */}
            <div className="rounded border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
              <Flag size={12} className="text-red-400 mt-0.5 flex-shrink-0"/>
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="text-red-400 font-semibold">Flagging & Form B context: </span>
                A flagman is assigned to physically protect a work limit when maintenance crews are on track. The flagman is positioned at the approach end of the limit and must give verbal permission to any train before it enters the protected zone. A Form B is a written authority issued by the RTC to the maintenance foreman, granting exclusive occupancy of a defined track segment. All trains must stop at the flagman's position and receive a clearance before proceeding.
              </div>
            </div>

            {flaggingEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No active flagging limits or Form B authorities</div>
            ) : (
              <div className="space-y-2">
                {flaggingEvents.map(ev => <TrackEventCard key={ev.id} ev={ev}/>)}
              </div>
            )}

            {/* Flagman positions summary */}
            {flaggingEvents.filter(e => e.type === "FLAGGING_LIMIT").length > 0 && (
              <div className="bg-card border border-border rounded p-4">
                <div className="text-[10px] font-semibold text-foreground mb-3">Active Flagman Positions</div>
                <div className="space-y-2">
                  {flaggingEvents.filter(e => e.type === "FLAGGING_LIMIT").map(ev => (
                    <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <Flag size={12} className="text-red-400 flex-shrink-0"/>
                      <div className="flex-1">
                        <div className="text-[10px] font-medium text-foreground">{ev.protectedBy}</div>
                        <div className="text-[9px] text-muted-foreground">{ev.subdivision} Sub · MP {ev.flagmanPosition}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-red-400 font-medium">ACTIVE</div>
                        {ev.flagmanRadioChannel && <div className="text-[9px] mono text-muted-foreground">{ev.flagmanRadioChannel}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-muted-foreground">Expires</div>
                        <div className="text-[9px] mono text-foreground">{ev.expiresAt?.split(' ')[1]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: TRACK WARRANTS ═══ */}
        {activeTab === "warrants" && (
          <div className="space-y-3">
            {/* Context */}
            <div className="rounded border border-violet-500/20 bg-violet-500/5 p-3 flex items-start gap-2">
              <FileText size={12} className="text-violet-400 mt-0.5 flex-shrink-0"/>
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="text-violet-400 font-semibold">Track warrant context: </span>
                A Track Warrant (also called a Form B in CN operations) is a written authority issued by the RTC to a maintenance crew or road foreman, granting exclusive occupancy of a defined track segment for a specified time window. Unlike a train movement authority, a track warrant is issued to a person (the foreman), not to a locomotive. All train movements within the warranted limits are prohibited until the foreman releases the authority back to the RTC.
              </div>
            </div>

            {warrantEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No active track warrants</div>
            ) : (
              <div className="space-y-2">
                {warrantEvents.map(ev => <TrackEventCard key={ev.id} ev={ev}/>)}
              </div>
            )}

            {/* Warrant summary table */}
            <div className="bg-card border border-border rounded overflow-hidden">
              <div className="px-4 py-2 border-b border-border">
                <span className="text-[10px] font-semibold text-foreground">Active Warrant Summary</span>
              </div>
              <div className="divide-y divide-border">
                {warrantEvents.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-28 flex-shrink-0">
                      <div className="text-[10px] mono font-bold text-violet-400">{ev.formBNumber || ev.id}</div>
                      <div className="text-[9px] text-muted-foreground">{ev.type.replace(/_/g,' ')}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-foreground">{ev.subdivision} Sub · MP {ev.fromMp}–{ev.toMp}</div>
                      <div className="text-[9px] text-muted-foreground">{ev.protectedBy}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[9px] mono text-muted-foreground">{ev.issuedAt.split(' ')[1]} → {ev.expiresAt?.split(' ')[1]}</div>
                      <div className="text-[9px] text-emerald-400 font-medium">{ev.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

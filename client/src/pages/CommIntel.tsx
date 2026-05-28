import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import {
  TNU_EVENTS, DYN_SUB_TREND, WSRS_STATS, SUBDIVISIONS,
  type TnuConnectivityEvent, type DynSubDataPoint, type WsrsTransportStat, type Health
} from "@/lib/journeyData";
import {
  Radio, Wifi, WifiOff, AlertTriangle, CheckCircle, XCircle,
  Clock, TrendingUp, TrendingDown, BarChart2, Activity, MapPin
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ─── Health helpers ────────────────────────────────────────────────────────────
const healthColor: Record<Health, string> = {
  healthy: "text-emerald-400",
  warning: "text-amber-400",
  critical: "text-red-400",
  offline: "text-muted-foreground",
};
const healthBg: Record<Health, string> = {
  healthy: "bg-emerald-500/10 border-emerald-500/30",
  warning: "bg-amber-500/10 border-amber-500/30",
  critical: "bg-red-500/10 border-red-500/30",
  offline: "bg-slate-500/10 border-slate-500/30",
};
const HealthIcon = ({ h, size = 14 }: { h: Health; size?: number }) => {
  if (h === "healthy") return <CheckCircle size={size} className="text-emerald-400" />;
  if (h === "warning") return <AlertTriangle size={size} className="text-amber-400" />;
  if (h === "critical") return <XCircle size={size} className="text-red-400" />;
  return <Clock size={size} className="text-muted-foreground" />;
};

// ─── Section 1: TNU Connectivity Loss Tracker ─────────────────────────────────
function TnuTracker() {
  const [filterSubdiv, setFilterSubdiv] = useState("All");
  const [filterType, setFilterType] = useState<"all" | "both" | "radio" | "cell">("all");

  const filtered = useMemo(() => {
    return TNU_EVENTS.filter((e) => {
      const matchSubdiv = filterSubdiv === "All" || e.subdivision === filterSubdiv;
      const matchType =
        filterType === "all" ||
        (filterType === "both" && e.radioLost && e.cellLost) ||
        (filterType === "radio" && e.radioLost && !e.cellLost) ||
        (filterType === "cell" && !e.radioLost && e.cellLost);
      return matchSubdiv && matchType;
    });
  }, [filterSubdiv, filterType]);

  const bothLostCount = TNU_EVENTS.filter((e) => e.radioLost && e.cellLost).length;
  const radioOnlyCount = TNU_EVENTS.filter((e) => e.radioLost && !e.cellLost).length;
  const cellOnlyCount = TNU_EVENTS.filter((e) => !e.radioLost && e.cellLost).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Radio size={16} className="text-[#D22630]" />
        <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          TNU Connectivity Loss Tracker
        </h2>
        <span className="text-xs text-muted-foreground ml-1">— Simultaneous radio & cellular disconnection events</span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total Events", value: TNU_EVENTS.length, color: "text-foreground" },
          { label: "Both Channels Lost", value: bothLostCount, color: "text-red-400" },
          { label: "Radio Only Lost", value: radioOnlyCount, color: "text-amber-400" },
          { label: "Cellular Only Lost", value: cellOnlyCount, color: "text-blue-400" },
        ].map((k) => (
          <div key={k.label} className="bg-card/50 border border-border/50 rounded p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{k.label}</div>
            <div className={`text-2xl font-bold font-mono ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <select
          value={filterSubdiv}
          onChange={(e) => setFilterSubdiv(e.target.value)}
          className="bg-muted/50 border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#D22630]/50"
        >
          <option value="All">All Subdivisions</option>
          {SUBDIVISIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(["all", "both", "radio", "cell"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded text-xs border transition-colors ${
              filterType === t
                ? "bg-[#D22630]/20 border-[#D22630]/40 text-[#D22630]"
                : "bg-muted/40 border-border text-muted-foreground hover:border-slate-500"
            }`}
          >
            {t === "all" ? "All Types" : t === "both" ? "Both Lost" : t === "radio" ? "Radio Only" : "Cellular Only"}
          </button>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-1">{filtered.length} events</span>
      </div>

      {/* Event table */}
      <div className="rounded border border-border/50 overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_80px_80px_80px_2fr] text-[10px] text-muted-foreground uppercase tracking-wide bg-card/60 px-3 py-2 gap-3">
          <span>Train</span><span>Subdivision</span><span>Location</span>
          <span>220MHz</span><span>Cellular</span><span>Duration</span><span>Detail</span>
        </div>
        <div className="divide-y divide-slate-700/30">
          {filtered.map((e, i) => (
            <div key={i} className={`grid grid-cols-[1fr_1fr_1fr_80px_80px_80px_2fr] px-3 py-2.5 gap-3 items-center hover:bg-card/30 transition-colors`}>
              <div>
                <div className="text-xs font-mono text-foreground font-medium">{e.trainId}</div>
                <div className="text-[10px] text-muted-foreground">{e.leadLoco}</div>
              </div>
              <div className="text-xs text-foreground">{e.subdivision}</div>
              <div className="text-xs font-mono text-foreground">MP {e.milepost}</div>
              <div className="flex items-center gap-1">
                {e.radioLost
                  ? <WifiOff size={12} className="text-red-400" />
                  : <Wifi size={12} className="text-emerald-400" />}
                <span className={`text-[10px] font-mono ${e.radioLost ? "text-red-400" : "text-emerald-400"}`}>
                  {e.radioLost ? "LOST" : "OK"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {e.cellLost
                  ? <WifiOff size={12} className="text-red-400" />
                  : <Wifi size={12} className="text-emerald-400" />}
                <span className={`text-[10px] font-mono ${e.cellLost ? "text-red-400" : "text-emerald-400"}`}>
                  {e.cellLost ? "LOST" : "OK"}
                </span>
              </div>
              <div className={`text-xs font-mono font-bold ${e.durationSec > 120 ? "text-red-400" : e.durationSec > 60 ? "text-amber-400" : "text-foreground"}`}>
                {e.durationSec}s
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">{e.detail}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-xs text-muted-foreground text-center">No events match your filters</div>
          )}
        </div>
      </div>

      {/* Observability insight */}
      <div className="mt-3 bg-blue-500/5 border border-blue-500/20 rounded p-3">
        <div className="text-[10px] text-blue-400 uppercase tracking-wide mb-1 font-medium">Observability Insight</div>
        <div className="text-xs text-foreground">
          Base Station MP 71.3 (Ruel Sub) shows a persistent 220MHz dead zone affecting every eastbound train.
          This is a <span className="text-amber-400 font-medium">geographic infrastructure gap</span>, not a hardware failure.
          Correlating TNU events by milepost across multiple trains reveals this pattern — something a per-train monitoring
          view cannot show.
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: Dynamic Subscription Trend ────────────────────────────────────
function DynSubTrend() {
  const chartData = DYN_SUB_TREND.map((d) => ({
    month: d.month.replace(" 20", " '"),
    avgDynSubs: d.avgDynSubs,
    failedSubs: d.failedSubs,
    failRate: parseFloat(((d.failedSubs / d.avgDynSubs) * 100).toFixed(2)),
    radioRelease: d.radioRelease,
    ietmsRelease: d.ietmsRelease,
  }));

  // Find months where release changed
  const releaseChanges = DYN_SUB_TREND.reduce<string[]>((acc, d, i) => {
    if (i > 0) {
      const prev = DYN_SUB_TREND[i - 1];
      if (d.radioRelease !== prev.radioRelease || d.ietmsRelease !== prev.ietmsRelease) {
        acc.push(d.month.replace(" 20", " '"));
      }
    }
    return acc;
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-[#D22630]" />
        <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Dynamic Subscription Trend
        </h2>
        <span className="text-xs text-muted-foreground ml-1">— TNU subscriptions by software release version</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card/50 border border-border/50 rounded p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Current Radio Release</div>
          <div className="text-lg font-bold font-mono text-blue-400">{DYN_SUB_TREND[DYN_SUB_TREND.length - 1].radioRelease}</div>
        </div>
        <div className="bg-card/50 border border-border/50 rounded p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Current I-ETMS Release</div>
          <div className="text-lg font-bold font-mono text-purple-400">{DYN_SUB_TREND[DYN_SUB_TREND.length - 1].ietmsRelease}</div>
        </div>
        <div className="bg-card/50 border border-border/50 rounded p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Current Fail Rate</div>
          <div className="text-lg font-bold font-mono text-emerald-400">
            {((DYN_SUB_TREND[DYN_SUB_TREND.length - 1].failedSubs / DYN_SUB_TREND[DYN_SUB_TREND.length - 1].avgDynSubs) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="bg-card/30 border border-border/40 rounded p-4">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Failed Subscriptions per Month (with release annotations)</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748b" }} interval={2} />
              <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: number, name: string) => [
                  value,
                  name === "failedSubs" ? "Failed Subs" : "Avg Dyn Subs"
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              <Line type="monotone" dataKey="failedSubs" stroke="#ef4444" strokeWidth={2} dot={false} name="Failed Subs" />
              <Line type="monotone" dataKey="avgDynSubs" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Total Subs" yAxisId={0} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground">
          Release changes: {releaseChanges.join(" · ")} — spikes in failed subscriptions often correlate with new radio or I-ETMS releases.
        </div>
      </div>

      <div className="mt-3 bg-blue-500/5 border border-blue-500/20 rounded p-3">
        <div className="text-[10px] text-blue-400 uppercase tracking-wide mb-1 font-medium">Observability Insight</div>
        <div className="text-xs text-foreground">
          The spike in Dec 2024 / Jan 2025 correlates with the R5.0 radio release and v8.0 I-ETMS upgrade.
          Without version-tagged telemetry, this pattern would be invisible — operators would see increased failed subscriptions
          but have no way to correlate them to a software change. This is the difference between monitoring and observability.
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: WSRS Message Threshold Monitor ────────────────────────────────
function WsrsMonitor() {
  const [filterSubdiv, setFilterSubdiv] = useState("All");

  const filtered = useMemo(() => {
    return WSRS_STATS.filter((s) => filterSubdiv === "All" || s.subdivision === filterSubdiv);
  }, [filterSubdiv]);

  const chartData = filtered.map((s) => ({
    site: s.site.replace("Base Station ", "BS "),
    radio: s.radioMsgsPerHour,
    cell: s.cellMsgsPerHour,
    missed: s.missedMsgsPerHour,
    missedPct: s.missedPct,
  }));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={16} className="text-[#D22630]" />
        <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          WSRS Message Threshold Monitor
        </h2>
        <span className="text-xs text-muted-foreground ml-1">— Status messages by transport type per base station</span>
      </div>

      <div className="flex gap-2 mb-4">
        <select
          value={filterSubdiv}
          onChange={(e) => setFilterSubdiv(e.target.value)}
          className="bg-muted/50 border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#D22630]/50"
        >
          <option value="All">All Subdivisions</option>
          {SUBDIVISIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-3 ml-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-blue-500 inline-block" /> 220MHz Radio</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-purple-500 inline-block" /> Cellular</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-500 inline-block" /> Missed</span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card/30 border border-border/40 rounded p-4 mb-4">
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="site" tick={{ fontSize: 8, fill: "#64748b" }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 9, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
              <Bar dataKey="radio" fill="#3b82f6" name="220MHz msgs/hr" radius={[2, 2, 0, 0]} />
              <Bar dataKey="cell" fill="#a855f7" name="Cellular msgs/hr" radius={[2, 2, 0, 0]} />
              <Bar dataKey="missed" fill="#ef4444" name="Missed msgs/hr" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail table */}
      <div className="rounded border border-border/50 overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_100px_100px_100px_80px_2fr] text-[10px] text-muted-foreground uppercase tracking-wide bg-card/60 px-3 py-2 gap-3">
          <span>Subdivision</span><span>Site</span>
          <span>Radio msg/hr</span><span>Cell msg/hr</span><span>Missed msg/hr</span>
          <span>Missed %</span><span>Alert</span>
        </div>
        <div className="divide-y divide-slate-700/30">
          {filtered.map((s, i) => (
            <div key={i} className={`grid grid-cols-[1fr_1fr_100px_100px_100px_80px_2fr] px-3 py-2.5 gap-3 items-center hover:bg-card/30 transition-colors`}>
              <div className="text-xs text-foreground">{s.subdivision}</div>
              <div className="text-xs font-mono text-foreground">{s.site}</div>
              <div className="text-xs font-mono text-blue-400">{s.radioMsgsPerHour.toLocaleString()}</div>
              <div className="text-xs font-mono text-purple-400">{s.cellMsgsPerHour.toLocaleString()}</div>
              <div className={`text-xs font-mono font-bold ${s.missedMsgsPerHour > 200 ? "text-red-400" : s.missedMsgsPerHour > 50 ? "text-amber-400" : "text-foreground"}`}>
                {s.missedMsgsPerHour}
              </div>
              <div className="flex items-center gap-1.5">
                <HealthIcon h={s.status} size={11} />
                <span className={`text-xs font-mono font-bold ${healthColor[s.status]}`}>{s.missedPct}%</span>
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                {s.alert ?? <span className="text-emerald-500/70">Within threshold</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 bg-blue-500/5 border border-blue-500/20 rounded p-3">
        <div className="text-[10px] text-blue-400 uppercase tracking-wide mb-1 font-medium">Observability Insight</div>
        <div className="text-xs text-foreground">
          Ruel Sub Base Station MP 71.3 is carrying <span className="text-amber-400 font-medium">76% of its traffic on cellular</span> because
          the 220MHz radio is degraded. This is not visible in CARMA today — CARMA only shows the per-train alert when a train
          passes through. WSRS message-level monitoring reveals the infrastructure is degraded <span className="text-foreground font-medium">24/7</span>,
          not just when a train happens to be in range.
        </div>
      </div>
    </div>
  );
}

// ─── EMP Volume Section ────────────────────────────────────────────────────────────────────
// ─── EMP Message Catalog (S-9361.V3.1) ──────────────────────────────────────
const CI_EMP_CATALOG = [
  { id: '02000', name: 'Verify Employee Info Request', dir: 'Loco→BOS', phase: 'Crew Auth', color: '#60a5fa', baseRate: 4, variance: 2 },
  { id: '01000', name: 'Verify Employee Info Response', dir: 'BOS→Loco', phase: 'Crew Auth', color: '#93c5fd', baseRate: 4, variance: 2 },
  { id: '02001', name: 'Request Train ID List', dir: 'Loco→BOS', phase: 'Train ID', color: '#a78bfa', baseRate: 3, variance: 1 },
  { id: '01001', name: 'Train ID List', dir: 'BOS→Loco', phase: 'Train ID', color: '#c4b5fd', baseRate: 3, variance: 1 },
  { id: '02003', name: 'Selected Train ID', dir: 'Loco→BOS', phase: 'Train ID', color: '#8b5cf6', baseRate: 3, variance: 1 },
  { id: '01004', name: 'Confirm Selected Train ID', dir: 'BOS→Loco', phase: 'Train ID', color: '#7c3aed', baseRate: 3, variance: 1 },
  { id: '02005', name: 'Config Version List Request', dir: 'Loco→BOS', phase: 'Configuration', color: '#facc15', baseRate: 5, variance: 3 },
  { id: '01005', name: 'Config Version List', dir: 'BOS→Loco', phase: 'Configuration', color: '#fde047', baseRate: 5, variance: 3 },
  { id: '02007', name: 'Request Subdivision/District List', dir: 'Loco→BOS', phase: 'Configuration', color: '#f59e0b', baseRate: 3, variance: 1 },
  { id: '01007', name: 'Train Subdivision/District List', dir: 'BOS→Loco', phase: 'Configuration', color: '#fbbf24', baseRate: 3, variance: 1 },
  { id: '02010', name: 'Locomotive System State', dir: 'Loco→BOS', phase: 'System State', color: '#fb923c', baseRate: 4, variance: 2 },
  { id: '01010', name: 'Command/Confirm Loco State', dir: 'BOS→Loco', phase: 'System State', color: '#fdba74', baseRate: 4, variance: 2 },
  { id: '02011', name: 'Departure Test Report', dir: 'Loco→BOS', phase: 'Departure Test', color: '#f97316', baseRate: 3, variance: 1 },
  { id: '01011', name: 'Confirm Departure Test', dir: 'BOS→Loco', phase: 'Departure Test', color: '#ea580c', baseRate: 3, variance: 1 },
  { id: '02020', name: 'Poll Registration', dir: 'Loco→BOS', phase: 'Poll Reg.', color: '#34d399', baseRate: 4, variance: 2 },
  { id: '01020', name: 'Confirm Poll Registration', dir: 'BOS→Loco', phase: 'Poll Reg.', color: '#6ee7b7', baseRate: 4, variance: 2 },
  { id: '02030', name: 'Request Train Consist', dir: 'Loco→BOS', phase: 'Consist', color: '#f472b6', baseRate: 5, variance: 2 },
  { id: '01030', name: 'Train Consist', dir: 'BOS→Loco', phase: 'Consist', color: '#f9a8d4', baseRate: 5, variance: 2 },
  { id: '02032', name: 'Onboard Train Consist', dir: 'Loco→BOS', phase: 'Consist', color: '#ec4899', baseRate: 5, variance: 2 },
  { id: '01033', name: 'Confirm Onboard Consist', dir: 'BOS→Loco', phase: 'Consist', color: '#db2777', baseRate: 5, variance: 2 },
  { id: '01041', name: 'Bulletin Dataset', dir: 'BOS→Loco', phase: 'Bulletins', color: '#e879f9', baseRate: 6, variance: 4 },
  { id: '02042', name: 'Confirm Bulletin Dataset', dir: 'Loco→BOS', phase: 'Bulletins', color: '#d946ef', baseRate: 6, variance: 4 },
  { id: '02050', name: 'Crew Authority Request', dir: 'Loco→BOS', phase: 'Authority', color: '#34d399', baseRate: 35, variance: 12 },
  { id: '01051', name: 'Movement Authority Dataset', dir: 'BOS→Loco', phase: 'Authority', color: '#10b981', baseRate: 35, variance: 12 },
  { id: '02052', name: 'Confirm Movement Authority', dir: 'Loco→BOS', phase: 'Authority', color: '#059669', baseRate: 34, variance: 11 },
  { id: '01053', name: 'Movement Authority Void', dir: 'BOS→Loco', phase: 'Authority', color: '#ef4444', baseRate: 2, variance: 2 },
  { id: '01021', name: 'Office Segment Poll', dir: 'BOS→Loco', phase: 'Polling', color: '#38bdf8', baseRate: 40, variance: 5 },
  { id: '02021', name: 'Poll Response', dir: 'Loco→BOS', phase: 'Polling', color: '#0ea5e9', baseRate: 38, variance: 6 },
  { id: '02080', name: 'Locomotive Position Report', dir: 'Loco→BOS', phase: 'Position', color: '#22d3ee', baseRate: 50, variance: 8 },
  { id: '02082', name: 'PTC Interaction', dir: 'Loco→BOS', phase: 'Safety', color: '#f87171', baseRate: 2, variance: 2 },
  { id: '02083', name: 'Enforcement Warning/Braking', dir: 'Loco→BOS', phase: 'Safety', color: '#dc2626', baseRate: 1, variance: 1 },
  { id: '02084', name: 'Emergency Brake Application', dir: 'Loco→BOS', phase: 'Safety', color: '#b91c1c', baseRate: 0, variance: 1 },
  { id: '02085', name: 'Train Handling Exception', dir: 'Loco→BOS', phase: 'Safety', color: '#fca5a5', baseRate: 1, variance: 1 },
  { id: '02070', name: 'Onboard Violation Report', dir: 'Loco→BOS', phase: 'Violations', color: '#fb923c', baseRate: 1, variance: 1 },
  { id: '02072', name: 'Onboard Violation Cleared', dir: 'Loco→BOS', phase: 'Violations', color: '#fdba74', baseRate: 1, variance: 1 },
  { id: '02081', name: 'Loco Fault Summary Report', dir: 'Loco→BOS', phase: 'Faults', color: '#a3a3a3', baseRate: 2, variance: 2 },
  { id: '02087', name: 'Locomotive Fault Report', dir: 'Loco→BOS', phase: 'Faults', color: '#737373', baseRate: 1, variance: 1 },
  { id: '02100', name: 'Client Fileset List', dir: 'Loco→BOS', phase: 'File Transfer', color: '#818cf8', baseRate: 3, variance: 2 },
  { id: '01100', name: 'Fileset List', dir: 'BOS→Loco', phase: 'File Transfer', color: '#6366f1', baseRate: 3, variance: 2 },
  { id: '101', name: 'BL-OPK Key Exchange Request', dir: 'Loco→KES', phase: 'KES', color: '#c084fc', baseRate: 2, variance: 1 },
  { id: '102', name: 'BL-OPK Key Exchange Response', dir: 'KES→Loco', phase: 'KES', color: '#a855f7', baseRate: 2, variance: 1 },
];

const CI_DATE_PRESETS = [
  { id: 'last4h',    label: 'Last 4h',  hours: 4 },
  { id: 'last12h',   label: 'Last 12h', hours: 12 },
  { id: 'today',     label: 'Today',    hours: 24 },
  { id: 'yesterday', label: 'Yesterday',hours: 24 },
  { id: 'last7d',    label: 'Last 7d',  hours: 168 },
];

const ciGenerateSeries = (startDate: Date, hours: number, msgIds: string[]) => {
  const buckets = Math.min(hours * 12, 288);
  const labels: string[] = [];
  const series: Record<string, number[]> = {};
  msgIds.forEach(id => { series[id] = []; });
  for (let i = 0; i < buckets; i++) {
    const t = new Date(startDate.getTime() + i * 5 * 60 * 1000);
    labels.push(t.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false }));
    msgIds.forEach(id => {
      const e = CI_EMP_CATALOG.find(x => x.id === id);
      if (!e) { series[id].push(0); return; }
      const spike = Math.random() < 0.12 ? Math.floor(Math.random() * e.variance * 2) + e.variance : 0;
      const nightDip = (t.getHours() >= 1 && t.getHours() <= 5) ? 0.4 : 1;
      const rushBoost = (t.getHours() >= 6 && t.getHours() <= 9) || (t.getHours() >= 15 && t.getHours() <= 18) ? 1.3 : 1;
      series[id].push(Math.max(0, Math.floor((e.baseRate * nightDip * rushBoost) + (Math.random() * e.variance - e.variance / 2) + spike)));
    });
  }
  return { labels, series };
};

function EMPVolumeSection() {
  const [selectedMsgs, setSelectedMsgs] = useState<string[]>(['02050', '01051', '02080']);
  const [datePreset, setDatePreset] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [compareMsg, setCompareMsg] = useState('01021');
  const [showCompare, setShowCompare] = useState(false);

  const chartData = useMemo(() => {
    const preset = CI_DATE_PRESETS.find(p => p.id === datePreset) ?? CI_DATE_PRESETS[2];
    let startDate: Date;
    if (datePreset === 'yesterday') {
      startDate = new Date(); startDate.setDate(startDate.getDate() - 1); startDate.setHours(0,0,0,0);
    } else if (datePreset === 'last7d') {
      startDate = new Date(); startDate.setDate(startDate.getDate() - 7); startDate.setHours(0,0,0,0);
    } else if (customDate) {
      startDate = new Date(customDate + 'T00:00:00');
    } else {
      startDate = new Date(Date.now() - preset.hours * 3600 * 1000);
    }
    const allIds = Array.from(new Set([...selectedMsgs, ...(showCompare ? [compareMsg] : [])]));
    return ciGenerateSeries(startDate, preset.hours, allIds);
  }, [selectedMsgs, datePreset, customDate, compareMsg, showCompare]);

  useEffect(() => {
    let chart: any = null;
    const buildChart = () => {
      const Chart = (window as any).Chart;
      if (!Chart) return;
      const canvas = document.getElementById('ciEmpChart') as HTMLCanvasElement | null;
      if (!canvas) return;
      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();
      const allIds = Array.from(new Set([...selectedMsgs, ...(showCompare ? [compareMsg] : [])]));
      const datasets = allIds.map((id, idx) => {
        const e = CI_EMP_CATALOG.find(x => x.id === id);
        const color = e?.color ?? ['#34d399','#facc15','#60a5fa','#f472b6','#fb923c'][idx % 5];
        return {
          label: `${id} — ${e?.name ?? id}`,
          data: chartData.series[id] ?? [],
          borderColor: color,
          backgroundColor: color + '18',
          borderWidth: id === compareMsg && showCompare ? 2 : 1.5,
          borderDash: id === compareMsg && showCompare ? [4, 3] : [],
          pointRadius: 0, tension: 0.3, fill: false,
        };
      });
      chart = new Chart(canvas, {
        type: 'line',
        data: { labels: chartData.labels, datasets },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          plugins: {
            legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { size: 9 }, boxWidth: 12, padding: 8 } },
            tooltip: { mode: 'index', intersect: false, backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1 },
          },
          scales: {
            x: { ticks: { color: '#64748b', font: { size: 9 }, maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { min: 0, ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          },
        },
      });
    };
    if (!(window as any).Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = buildChart;
      document.head.appendChild(script);
    } else { buildChart(); }
    return () => { if (chart) chart.destroy(); };
  }, [chartData, selectedMsgs, compareMsg, showCompare]);

  const phases = useMemo(() => {
    const map = new Map<string, typeof CI_EMP_CATALOG[number][]>();
    CI_EMP_CATALOG.forEach(e => {
      if (!map.has(e.phase)) map.set(e.phase, []);
      map.get(e.phase)!.push(e);
    });
    return map;
  }, []);

  const toggleMsg = (id: string) =>
    setSelectedMsgs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">EMP Message Volume</h2>
        <p className="text-xs text-muted-foreground mt-0.5">5-minute rolling windows · Full S-9361.V3.1 message catalog · Select any combination of messages to compare</p>
      </div>

      {/* Date Range Controls */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded border border-border bg-card">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex-shrink-0">Date Range</span>
        {CI_DATE_PRESETS.map(p => (
          <button key={p.id} onClick={() => { setDatePreset(p.id); setCustomDate(''); }}
            className={`text-[10px] px-2 py-1 rounded border transition-colors ${
              datePreset === p.id && !customDate
                ? 'bg-[#D22630]/20 border-[#D22630]/40 text-foreground'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            }`}>{p.label}</button>
        ))}
        <input type="date" value={customDate}
          onChange={e => { setCustomDate(e.target.value); setDatePreset(''); }}
          className="text-[10px] px-2 py-1 rounded border border-border bg-muted text-foreground focus:outline-none" />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Compare overlay:</span>
          <button onClick={() => setShowCompare(v => !v)}
            className={`text-[10px] px-2 py-1 rounded border transition-colors ${
              showCompare ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'border-border text-muted-foreground'
            }`}>{showCompare ? 'On' : 'Off'}</button>
          {showCompare && (
            <select value={compareMsg} onChange={e => setCompareMsg(e.target.value)}
              className="text-[10px] px-2 py-1 rounded border border-border bg-muted text-foreground focus:outline-none">
              {CI_EMP_CATALOG.map(e => (
                <option key={e.id} value={e.id}>{e.id} — {e.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Message Selector */}
      <div className="p-3 rounded border border-border bg-card space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Message Selector — S-9361.V3.1</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedMsgs(CI_EMP_CATALOG.map(e => e.id))}
              className="text-[9px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground">All</button>
            <button onClick={() => setSelectedMsgs([])}
              className="text-[9px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground">None</button>
            <span className="text-[10px] text-muted-foreground">{selectedMsgs.length} selected</span>
          </div>
        </div>
        <div className="space-y-2">
          {Array.from(phases.entries()).map(([phase, msgs]) => (
            <div key={phase}>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{phase}</div>
              <div className="flex flex-wrap gap-1">
                {msgs.map(e => (
                  <button key={e.id} onClick={() => toggleMsg(e.id)}
                    className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                      selectedMsgs.includes(e.id)
                        ? 'border-transparent text-slate-900 font-semibold'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                    style={selectedMsgs.includes(e.id) ? { backgroundColor: e.color, borderColor: e.color } : {}}
                    title={`${e.id} — ${e.name} (${e.dir})`}>
                    {e.id}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] font-semibold text-foreground">EMP Message Volume — {CI_DATE_PRESETS.find(p => p.id === datePreset)?.label ?? 'Custom'}</div>
            <div className="text-[10px] text-muted-foreground">{selectedMsgs.length} message type{selectedMsgs.length !== 1 ? 's' : ''} · 5-min windows</div>
          </div>
          <div className="text-[9px] text-muted-foreground font-mono">S-9361.V3.1</div>
        </div>
        {selectedMsgs.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: 200 }}>
            <span className="text-xs text-muted-foreground">Select at least one message type above</span>
          </div>
        ) : (
          <div style={{ height: 220 }}><canvas id="ciEmpChart"></canvas></div>
        )}
      </div>

      {/* Safety System context */}
      <div className="rounded border border-slate-700/50 bg-slate-800/30 p-4">
        <div className="text-[11px] font-semibold text-slate-300 mb-2">Safety System Context</div>
        <div className="grid grid-cols-3 gap-3 text-[10px]">
          <div className="space-y-1">
            <div className="font-semibold text-cyan-400">🇨🇦 ETC-ATP (Enhanced Train Control — ATP)</div>
            <div className="text-muted-foreground">High-risk CN Canada corridors with WIU wayside interfaces. Automatic brake enforcement of speed restrictions, authority limits, signal aspects, switch positions and work zones.</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-teal-400">🇨🇦 ETC-DAS (Enhanced Train Control — DAS)</div>
            <div className="text-muted-foreground">Lower-risk CN Canada corridors without WIU wayside interfaces. Real-time driver notifications for traction, braking, signaling and timetable. Advisory only — no automatic brake enforcement.</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-amber-400">🇺🇸 PTC (Positive Train Control)</div>
            <div className="text-muted-foreground">US federal mandate on CSXT interop subdivisions. Automatic brake enforcement. Uses the same EMP message protocol as ETC-ATP.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────────
export default function CommIntel() {
  const [activeSection, setActiveSection] = useState<"tnu" | "dynsub" | "wsrs" | "emp">("tnu");

  const sections = [
    { id: "tnu" as const, label: "TNU Connectivity", icon: <Radio size={13} />, desc: "Dual-channel loss events" },
    { id: "dynsub" as const, label: "Dynamic Subscriptions", icon: <Activity size={13} />, desc: "Sub trends by release" },
    { id: "wsrs" as const, label: "WSRS Transport", icon: <BarChart2 size={13} />, desc: "Message threshold monitor" },
    { id: "emp" as const, label: "EMP Message Volume", icon: <Activity size={13} />, desc: "EMP-1005/2005/2080 rates" },
  ];

  return (
    <Layout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Radio & Comms Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            220MHz Radio · CTC over ITCM · Cellular — cross-channel observability from the ETC monitoring framework
          </p>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left nav */}
          <div className="w-56 flex-shrink-0 border-r border-border p-3 space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded text-left transition-colors ${
                  activeSection === s.id
                    ? "bg-[#D22630]/15 border border-[#D22630]/30 text-foreground"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground border border-transparent"
                }`}
              >
                <span className={`mt-0.5 flex-shrink-0 ${activeSection === s.id ? "text-[#D22630]" : ""}`}>{s.icon}</span>
                <div>
                  <div className="text-xs font-medium">{s.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</div>
                </div>
              </button>
            ))}

            {/* Channel legend */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Channels</div>
              {[
                { label: "220MHz Radio", sub: "Primary PTC transport", color: "bg-blue-500" },
                { label: "CTC / ITCM", sub: "Back-office AMQP", color: "bg-purple-500" },
                { label: "Cellular 4G LTE", sub: "Fallback / redundancy", color: "bg-green-500" },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${c.color}`} />
                  <div>
                    <div className="text-[10px] text-foreground">{c.label}</div>
                    <div className="text-[9px] text-slate-600">{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === "tnu" && <TnuTracker />}
            {activeSection === "dynsub" && <DynSubTrend />}
            {activeSection === "wsrs" && <WsrsMonitor />}
            {activeSection === "emp" && <EMPVolumeSection />}
          </div>
        </div>
      </div>
    </Layout>
  );
}

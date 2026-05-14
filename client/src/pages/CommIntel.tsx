import { useState, useMemo } from "react";
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommIntel() {
  const [activeSection, setActiveSection] = useState<"tnu" | "dynsub" | "wsrs">("tnu");

  const sections = [
    { id: "tnu" as const, label: "TNU Connectivity", icon: <Radio size={13} />, desc: "Dual-channel loss events" },
    { id: "dynsub" as const, label: "Dynamic Subscriptions", icon: <Activity size={13} />, desc: "Sub trends by release" },
    { id: "wsrs" as const, label: "WSRS Transport", icon: <BarChart2 size={13} />, desc: "Message threshold monitor" },
  ];

  return (
    <Layout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Communications Intelligence
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
          </div>
        </div>
      </div>
    </Layout>
  );
}

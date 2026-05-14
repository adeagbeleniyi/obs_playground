import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { WAYSIDE_INFRA, type WaysideInfraPoint, type Health } from "@/lib/journeyData";
import {
  Radio, Thermometer, Zap, Navigation, Server,
  AlertTriangle, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronRight, Train, Search, Filter,
  Calendar, TrendingUp, Users
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

const healthBg: Record<Health, string> = {
  healthy: "bg-emerald-500/10 border-emerald-500/25",
  warning: "bg-amber-500/10 border-amber-500/25",
  critical: "bg-red-500/10 border-red-500/25",
  offline: "bg-slate-500/10 border-slate-500/25",
};
const healthDot: Record<Health, string> = {
  healthy: "bg-emerald-400", warning: "bg-amber-400",
  critical: "bg-red-400", offline: "bg-slate-500",
};
const healthColor: Record<Health, string> = {
  healthy: "text-emerald-400", warning: "text-amber-400",
  critical: "text-red-400", offline: "text-muted-foreground",
};
const HealthIcon = ({ h, size = 13 }: { h: Health; size?: number }) => {
  if (h === "healthy") return <CheckCircle size={size} className="text-emerald-400" />;
  if (h === "warning") return <AlertTriangle size={size} className="text-amber-400" />;
  if (h === "critical") return <XCircle size={size} className="text-red-400" />;
  return <Clock size={size} className="text-muted-foreground" />;
};
const typeLabel: Record<string, string> = {
  wiu: "WIU", detector: "Detector", signal: "Signal",
  crossing: "Crossing", base_station: "Base Station",
};
const typeIcon: Record<string, React.ReactNode> = {
  wiu: <Radio size={13} />, detector: <Thermometer size={13} />,
  signal: <Zap size={13} />, crossing: <Navigation size={13} />,
  base_station: <Server size={13} />,
};
const typeColor: Record<string, string> = {
  wiu: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  detector: "text-orange-400 border-orange-500/40 bg-orange-500/10",
  signal: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  crossing: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  base_station: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
};

const TIME_WINDOWS = [
  { label: "Last 6 hours",  value: "6h",  hours: 6 },
  { label: "Last 12 hours", value: "12h", hours: 12 },
  { label: "Last 24 hours", value: "24h", hours: 24 },
  { label: "Last 48 hours", value: "48h", hours: 48 },
  { label: "Last 7 days",   value: "7d",  hours: 168 },
  { label: "All time",      value: "all", hours: Infinity },
];

function isWithinWindow(entry: { date: string; time: string }, hours: number): boolean {
  if (hours === Infinity) return true;
  const [eYear, eMon, eDay] = entry.date.split("-").map(Number);
  const [eHour] = entry.time.split(":").map(Number);
  const entryMs = new Date(eYear, eMon - 1, eDay, eHour).getTime();
  const nowMs = new Date(2025, 4, 4, 17).getTime();
  return nowMs - entryMs <= hours * 3600 * 1000;
}

function InfraCard({ point, timeWindowHours }: { point: WaysideInfraPoint; timeWindowHours: number }) {
  const [open, setOpen] = useState(false);
  const filteredLog = useMemo(
    () => point.trafficLog.filter((t) => isWithinWindow(t, timeWindowHours)),
    [point.trafficLog, timeWindowHours]
  );
  const uniqueTrains = useMemo(() => new Set(filteredLog.map((t) => t.trainId)).size, [filteredLog]);
  const anomalies = filteredLog.filter((t) => t.status !== "healthy").length;
  const hasCritical = filteredLog.some((t) => t.status === "critical");
  const hasWarning = filteredLog.some((t) => t.status === "warning");
  const worstStatus: Health = hasCritical ? "critical" : hasWarning ? "warning" : "healthy";

  return (
    <div className={`rounded border mb-2 ${healthBg[worstStatus]}`}>
      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left" onClick={() => setOpen(v => !v)}>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium flex-shrink-0 ${typeColor[point.type]}`}>
          {typeIcon[point.type]}<span>{typeLabel[point.type]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground truncate">{point.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">MP {point.milepost}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><TrendingUp size={10}/>{filteredLog.length} passages</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Users size={10}/>{uniqueTrains} unique trains</span>
            {anomalies > 0 && <span className={`flex items-center gap-1 text-[10px] ${hasCritical ? "text-red-400" : "text-amber-400"}`}><AlertTriangle size={10}/>{anomalies} anomalies</span>}
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${healthDot[point.status]}`} />
        {open ? <ChevronDown size={14} className="text-muted-foreground flex-shrink-0"/> : <ChevronRight size={14} className="text-muted-foreground flex-shrink-0"/>}
      </button>

      {open && (
        <div className="border-t border-border/40 px-3 pt-2 pb-3">
          {filteredLog.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic py-2">No passages in selected time window.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-background/40 rounded px-2 py-1.5 text-center">
                  <div className="text-lg font-bold text-foreground" style={{fontFamily:"Space Grotesk,sans-serif"}}>{filteredLog.length}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Passages</div>
                </div>
                <div className="bg-background/40 rounded px-2 py-1.5 text-center">
                  <div className="text-lg font-bold text-cyan-400" style={{fontFamily:"Space Grotesk,sans-serif"}}>{uniqueTrains}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Unique Trains</div>
                </div>
                <div className="bg-background/40 rounded px-2 py-1.5 text-center">
                  <div className={`text-lg font-bold ${anomalies > 0 ? (hasCritical ? "text-red-400" : "text-amber-400") : "text-emerald-400"}`} style={{fontFamily:"Space Grotesk,sans-serif"}}>{anomalies}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Anomalies</div>
                </div>
              </div>
              <div className="mb-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Unique Trains in Window</div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(filteredLog.map(t => t.trainId))).map(tid => {
                    const hasA = filteredLog.some(t => t.trainId === tid && t.status !== "healthy");
                    return (
                      <span key={tid} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono ${hasA ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-border bg-background/40 text-muted-foreground"}`}>
                        <Train size={9}/>{tid}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Passage Log</div>
              <div className="space-y-1.5">
                {filteredLog.map((entry, i) => (
                  <div key={i} className={`flex items-start gap-2 px-2 py-1.5 rounded border text-[11px] ${entry.status === "critical" ? "bg-red-500/10 border-red-500/25" : entry.status === "warning" ? "bg-amber-500/10 border-amber-500/25" : "bg-background/30 border-border/30"}`}>
                    <HealthIcon h={entry.status} size={12}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground font-mono">{entry.trainId}</span>
                        <span className="text-muted-foreground">{entry.leadLoco}</span>
                        <span className={`text-[9px] px-1 py-0.5 rounded border ${entry.direction === "East" || entry.direction === "North" ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-purple-500/40 bg-purple-500/10 text-purple-300"}`}>{entry.direction}</span>
                        <span className="text-muted-foreground ml-auto text-[10px]">{entry.date} {entry.time}</span>
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-[10px]">{entry.detail}</div>
                      {entry.latencyMs !== undefined && (
                        <div className={`text-[10px] mt-0.5 ${entry.latencyMs > 2000 ? "text-amber-400" : "text-emerald-400"}`}>
                          Latency: {entry.latencyMs >= 1000 ? `${(entry.latencyMs/1000).toFixed(1)}s` : `${entry.latencyMs}ms`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SubdivisionSection({ subdiv, points, timeWindowHours }: { subdiv: string; points: WaysideInfraPoint[]; timeWindowHours: number }) {
  const [open, setOpen] = useState(true);
  const totalPassages = useMemo(() => points.reduce((acc, p) => acc + p.trafficLog.filter(t => isWithinWindow(t, timeWindowHours)).length, 0), [points, timeWindowHours]);
  const uniqueTrains = useMemo(() => { const ids = new Set<string>(); points.forEach(p => p.trafficLog.filter(t => isWithinWindow(t, timeWindowHours)).forEach(t => ids.add(t.trainId))); return ids.size; }, [points, timeWindowHours]);
  const anomalies = useMemo(() => points.reduce((acc, p) => acc + p.trafficLog.filter(t => isWithinWindow(t, timeWindowHours) && t.status !== "healthy").length, 0), [points, timeWindowHours]);
  const hasCritical = points.some(p => p.status === "critical");
  const hasWarning = points.some(p => p.status === "warning");

  return (
    <div className="mb-6">
      <button className="w-full flex items-center gap-3 mb-2" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2 flex-1">
          {open ? <ChevronDown size={15} className="text-muted-foreground"/> : <ChevronRight size={15} className="text-muted-foreground"/>}
          <span className="text-sm font-bold text-foreground" style={{fontFamily:"Space Grotesk,sans-serif"}}>{subdiv} Subdivision</span>
          {hasCritical && <span className="w-2 h-2 rounded-full bg-red-400"/>}
          {!hasCritical && hasWarning && <span className="w-2 h-2 rounded-full bg-amber-400"/>}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><TrendingUp size={10}/>{totalPassages} passages</span>
          <span className="flex items-center gap-1"><Users size={10}/>{uniqueTrains} trains</span>
          <span className="flex items-center gap-1"><Server size={10}/>{points.length} sites</span>
          {anomalies > 0 && <span className={`flex items-center gap-1 ${hasCritical ? "text-red-400" : "text-amber-400"}`}><AlertTriangle size={10}/>{anomalies} anomalies</span>}
        </div>
      </button>
      {open && (
        <div className="pl-4 border-l border-border/40">
          {points.map(p => <InfraCard key={p.id} point={p} timeWindowHours={timeWindowHours}/>)}
        </div>
      )}
    </div>
  );
}

export default function WaysideIntel() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [subdivFilter, setSubdivFilter] = useState("all");
  const [timeWindow, setTimeWindow] = useState("48h");

  const timeWindowHours = useMemo(() => TIME_WINDOWS.find(w => w.value === timeWindow)?.hours ?? 48, [timeWindow]);

  const filteredInfra = useMemo(() => WAYSIDE_INFRA.filter(p => {
    if (subdivFilter !== "all" && p.subdivision !== subdivFilter) return false;
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.subdivision.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [search, typeFilter, subdivFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, WaysideInfraPoint[]>();
    filteredInfra.forEach(p => { if (!map.has(p.subdivision)) map.set(p.subdivision, []); map.get(p.subdivision)!.push(p); });
    return map;
  }, [filteredInfra]);

  const networkStats = useMemo(() => {
    let totalPassages = 0; const ids = new Set<string>(); let anomalies = 0;
    WAYSIDE_INFRA.forEach(p => p.trafficLog.filter(t => isWithinWindow(t, timeWindowHours)).forEach(t => { totalPassages++; ids.add(t.trainId); if (t.status !== "healthy") anomalies++; }));
    return { totalPassages, uniqueTrains: ids.size, anomalies };
  }, [timeWindowHours]);

  const activeSubs = useMemo(() => Array.from(new Set(WAYSIDE_INFRA.map(p => p.subdivision))), []);

  return (
    <Layout>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold text-foreground" style={{fontFamily:"Space Grotesk,sans-serif"}}>Wayside Intelligence</h1>
            <div className="flex items-center gap-2 text-[10px] text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>Live · Dynatrace Grail
            </div>
          </div>
          <p className="text-xs text-muted-foreground">All trackside infrastructure grouped by subdivision — WIUs, detectors, signals, crossings, base stations</p>
        </div>

        {/* Network KPIs */}
        <div className="flex-shrink-0 grid grid-cols-3 gap-3 px-6 py-3 border-b border-border bg-background/30">
          <div className="bg-background/60 rounded border border-border px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Passages</div>
            <div className="text-2xl font-bold text-foreground" style={{fontFamily:"Space Grotesk,sans-serif"}}>{networkStats.totalPassages}</div>
            <div className="text-[10px] text-muted-foreground">{TIME_WINDOWS.find(w => w.value === timeWindow)?.label}</div>
          </div>
          <div className="bg-background/60 rounded border border-border px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Unique Trains</div>
            <div className="text-2xl font-bold text-cyan-400" style={{fontFamily:"Space Grotesk,sans-serif"}}>{networkStats.uniqueTrains}</div>
            <div className="text-[10px] text-muted-foreground">Distinct train IDs in window</div>
          </div>
          <div className="bg-background/60 rounded border border-border px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Anomalies</div>
            <div className={`text-2xl font-bold ${networkStats.anomalies > 0 ? "text-amber-400" : "text-emerald-400"}`} style={{fontFamily:"Space Grotesk,sans-serif"}}>{networkStats.anomalies}</div>
            <div className="text-[10px] text-muted-foreground">Warnings + criticals</div>
          </div>
        </div>

        {/* Analytics Charts */}
        {(() => {
          // Detector type distribution
          const typeCounts: Record<string, number> = {};
          WAYSIDE_INFRA.forEach(p => { typeCounts[typeLabel[p.type] || p.type] = (typeCounts[typeLabel[p.type] || p.type] || 0) + 1; });
          const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
          const TYPE_COLORS = ['#38BDF8', '#F59E0B', '#A78BFA', '#10B981', '#FB923C'];

          // Health status distribution
          const healthCounts = { Healthy: 0, Warning: 0, Critical: 0, Offline: 0 };
          WAYSIDE_INFRA.forEach(p => {
            if (p.status === 'healthy') healthCounts.Healthy++;
            else if (p.status === 'warning') healthCounts.Warning++;
            else if (p.status === 'critical') healthCounts.Critical++;
            else healthCounts.Offline++;
          });
          const healthData = Object.entries(healthCounts).map(([name, value]) => ({ name, value }));
          const HEALTH_COLORS = { Healthy: '#10B981', Warning: '#F59E0B', Critical: '#EF4444', Offline: '#64748b' };

          // Passages by subdivision
          const subPassages: Record<string, number> = {};
          WAYSIDE_INFRA.forEach(p => {
            const count = p.trafficLog.filter(t => isWithinWindow(t, timeWindowHours)).length;
            subPassages[p.subdivision] = (subPassages[p.subdivision] || 0) + count;
          });
          const subData = Object.entries(subPassages).map(([sub, count]) => ({ sub, count })).sort((a, b) => b.count - a.count).slice(0, 8);

          const tooltipStyle = {
            contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 },
            labelStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 10 },
          };

          return (
            <div className="flex-shrink-0 grid grid-cols-3 gap-3 px-6 py-3 border-b border-border bg-background/20">
              <div className="bg-background/60 rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Infrastructure by Type</p>
                <ResponsiveContainer width="100%" height={110}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" outerRadius={42} dataKey="value" paddingAngle={2}>
                      {typeData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-background/60 rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Health Status</p>
                <ResponsiveContainer width="100%" height={110}>
                  <PieChart>
                    <Pie data={healthData} cx="50%" cy="50%" outerRadius={42} dataKey="value" paddingAngle={2}>
                      {healthData.map((entry) => <Cell key={entry.name} fill={HEALTH_COLORS[entry.name as keyof typeof HEALTH_COLORS]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-background/60 rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Passages by Subdivision</p>
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={subData} margin={{ left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="sub" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="count" fill="#38BDF8" name="Passages" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* Filters */}
        <div className="flex-shrink-0 flex items-center gap-2 px-6 py-2.5 border-b border-border bg-background/20 flex-wrap">
          <div className="flex items-center gap-1.5 bg-background/60 border border-border rounded px-2 py-1">
            <Calendar size={12} className="text-muted-foreground"/>
            <select value={timeWindow} onChange={e => setTimeWindow(e.target.value)} className="bg-transparent text-[11px] text-foreground outline-none cursor-pointer">
              {TIME_WINDOWS.map(w => <option key={w.value} value={w.value} className="bg-card">{w.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-background/60 border border-border rounded px-2 py-1">
            <Filter size={12} className="text-muted-foreground"/>
            <select value={subdivFilter} onChange={e => setSubdivFilter(e.target.value)} className="bg-transparent text-[11px] text-foreground outline-none cursor-pointer">
              <option value="all" className="bg-card">All Subdivisions</option>
              {activeSubs.map(s => <option key={s} value={s} className="bg-card">{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-background/60 border border-border rounded px-2 py-1">
            <Server size={12} className="text-muted-foreground"/>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-transparent text-[11px] text-foreground outline-none cursor-pointer">
              <option value="all" className="bg-card">All Types</option>
              <option value="wiu" className="bg-card">WIU</option>
              <option value="detector" className="bg-card">Detector</option>
              <option value="signal" className="bg-card">Signal</option>
              <option value="crossing" className="bg-card">Crossing</option>
              <option value="base_station" className="bg-card">Base Station</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-background/60 border border-border rounded px-2 py-1 flex-1 max-w-xs">
            <Search size={12} className="text-muted-foreground"/>
            <input type="text" placeholder="Search infrastructure..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground outline-none w-full"/>
          </div>
          <span className="text-[10px] text-muted-foreground ml-auto">{filteredInfra.length} sites</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {grouped.size === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Search size={28} className="mb-2 opacity-40"/>
              <p className="text-sm">No infrastructure matches your filters.</p>
            </div>
          ) : (
            Array.from(grouped.entries()).map(([subdiv, points]) => (
              <SubdivisionSection key={subdiv} subdiv={subdiv} points={points} timeWindowHours={timeWindowHours}/>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

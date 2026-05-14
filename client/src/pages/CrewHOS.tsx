import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import {
  activeCrew, getHOSSummary, formatHOSRemaining,
  hosStatusColor, hosStatusBg, type ActiveCrew, type HOSStatus
} from '@/lib/crewCarData';
import {
  Users, Clock, AlertTriangle, CheckCircle, MapPin,
  Train, ChevronDown, ChevronUp, Timer, Zap, Navigation
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

// ─── HOS Countdown Ring ────────────────────────────────────────────────────
function HOSRing({ remaining, limit, status }: { remaining: number; limit: number; status: HOSStatus }) {
  const limitMins = limit * 60;
  const pct = Math.max(0, Math.min(1, remaining / limitMins));
  const r = 28; const circ = 2 * Math.PI * r;
  const stroke = status === 'CRITICAL' ? '#EF4444' : status === 'WARNING' ? '#F59E0B' : '#10B981';
  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1E293B" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={stroke} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-xs font-bold" style={{ color: stroke }}>{formatHOSRemaining(remaining)}</div>
        <div className="text-[9px] text-slate-500">left</div>
      </div>
    </div>
  );
}

// ─── Crew Card ─────────────────────────────────────────────────────────────
function CrewCard({ crew }: { crew: ActiveCrew }) {
  const [expanded, setExpanded] = useState(false);
  const usedPct = Math.round((crew.hoursOnDuty / crew.hosLimitHours) * 100);

  return (
    <div className={`rounded-lg border ${hosStatusBg(crew.hosStatus)} p-4 transition-all`}>
      {/* Header row */}
      <div className="flex items-start gap-4">
        <HOSRing remaining={crew.hosRemainingMinutes} limit={crew.hosLimitHours} status={crew.hosStatus} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-foreground">{crew.crewId}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${hosStatusBg(crew.hosStatus)} ${hosStatusColor(crew.hosStatus)}`}>
              {crew.hosStatus}
            </span>
            <span className="text-xs text-muted-foreground">{crew.releaseType.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center gap-1 mt-1">
            <Train className="w-3 h-3 text-cn-red flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground">{crew.trainId}</span>
            <span className="text-xs text-muted-foreground mx-1">·</span>
            <span className="text-xs text-muted-foreground">{crew.subdivision} Sub</span>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">{crew.currentLocation} · MP {crew.currentMilepost}</span>
            <span className="text-xs text-muted-foreground mx-1">·</span>
            <span className="text-xs text-muted-foreground">{crew.speed} mph</span>
          </div>

          {/* HOS bar */}
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>On duty {crew.hoursOnDuty.toFixed(1)}h of {crew.hosLimitHours}h</span>
              <span>{usedPct}% used</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${usedPct}%`,
                  background: crew.hosStatus === 'CRITICAL' ? '#EF4444' : crew.hosStatus === 'WARNING' ? '#F59E0B' : '#10B981'
                }}
              />
            </div>
          </div>
        </div>

        {/* Next crew change */}
        <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Next Change</div>
          <div className="text-sm font-semibold text-foreground">{crew.nextCrewChange.location}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Navigation className="w-3 h-3" />
            <span>{crew.nextCrewChange.distanceRemaining} mi</span>
            <span>·</span>
            <span>ETA {crew.nextCrewChange.estimatedArrival}</span>
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Crew members */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Crew Members</div>
            <div className="space-y-2">
              {crew.members.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Users className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{m.name}</div>
                    <div className="text-[10px] text-muted-foreground">{m.role} · #{m.employeeId}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duty info */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Duty Details</div>
            <div className="space-y-1.5">
              {[
                ['Called', crew.calledAt],
                ['Duty Start', crew.dutyStartTime],
                ['Last Rest', `${crew.lastRestHours}h`],
                ['Distance', `${crew.distanceTravelled} mi`],
                ['Origin', crew.origin],
                ['Destination', crew.destination],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Crew change detail */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Crew Change Point</div>
            <div className="space-y-1.5">
              {[
                ['Location', crew.nextCrewChange.location],
                ['Milepost', `MP ${crew.nextCrewChange.milepost}`],
                ['Subdivision', crew.nextCrewChange.subdivision],
                ['Distance', `${crew.nextCrewChange.distanceRemaining} mi`],
                ['ETA', crew.nextCrewChange.estimatedArrival],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
            {crew.notes && (
              <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] text-amber-400">{crew.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function CrewHOS() {
  const summary = getHOSSummary();
  const [filter, setFilter] = useState<HOSStatus | 'ALL'>('ALL');
  const [tick, setTick] = useState(0);

  // Live clock tick every 30s to simulate countdown
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...activeCrew].sort((a, b) => a.hosRemainingMinutes - b.hosRemainingMinutes);
  const filtered = filter === 'ALL' ? sorted : sorted.filter(c => c.hosStatus === filter);

  return (
    <Layout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Crew & HOS Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hours of Service monitoring · Active crew assignments · Crew change planning
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Trains', value: summary.totalTrains, icon: Train, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Crew Members On Duty', value: summary.totalCrewMembers, icon: Users, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20' },
          { label: 'HOS Critical', value: summary.critical, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'HOS Warning', value: summary.warning, icon: Timer, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-lg border p-4 ${bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Crew HOS Analytics Charts */}
      {(() => {
        // HOS status distribution
        const hosStatusData = [
          { name: 'Critical', value: summary.critical, color: '#EF4444' },
          { name: 'Warning', value: summary.warning, color: '#F59E0B' },
          { name: 'OK', value: summary.ok, color: '#10B981' },
        ].filter(d => d.value > 0);

        // Hours on duty distribution
        const dutyBuckets = [0, 0, 0, 0]; // <4h, 4-8h, 8-10h, >10h
        activeCrew.forEach(c => {
          if (c.hoursOnDuty < 4) dutyBuckets[0]++;
          else if (c.hoursOnDuty < 8) dutyBuckets[1]++;
          else if (c.hoursOnDuty < 10) dutyBuckets[2]++;
          else dutyBuckets[3]++;
        });
        const dutyData = [
          { range: '<4h', count: dutyBuckets[0] },
          { range: '4–8h', count: dutyBuckets[1] },
          { range: '8–10h', count: dutyBuckets[2] },
          { range: '>10h', count: dutyBuckets[3] },
        ];
        const dutyColors = ['#10B981', '#38BDF8', '#F59E0B', '#EF4444'];

        // Crew by subdivision
        const subCounts: Record<string, number> = {};
        activeCrew.forEach(c => { subCounts[c.subdivision] = (subCounts[c.subdivision] || 0) + 1; });
        const subData = Object.entries(subCounts).map(([sub, count]) => ({ sub, count })).sort((a, b) => b.count - a.count);

        const tooltipStyle = {
          contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 },
          labelStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 10 },
        };

        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-lg border border-border p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">HOS Status Distribution</p>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={hosStatusData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                    {hosStatusData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-lg border border-border p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Hours on Duty Buckets</p>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={dutyData} margin={{ left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" name="Crews" radius={[3, 3, 0, 0]}>
                    {dutyData.map((_, i) => <Cell key={i} fill={dutyColors[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-lg border border-border p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Active Crews by Subdivision</p>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={subData} layout="vertical" margin={{ left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="sub" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} width={55} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill="#38BDF8" name="Crews" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'CRITICAL', 'WARNING', 'OK'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              filter === f
                ? f === 'CRITICAL' ? 'bg-red-500 text-white'
                  : f === 'WARNING' ? 'bg-amber-500 text-black'
                  : f === 'OK' ? 'bg-emerald-500 text-white'
                  : 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'ALL' ? `All (${summary.totalTrains})` : f === 'CRITICAL' ? `Critical (${summary.critical})` : f === 'WARNING' ? `Warning (${summary.warning})` : `OK (${summary.ok})`}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>Sorted by HOS remaining (most urgent first)</span>
        </div>
      </div>

      {/* Crew cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <p>No crews in {filter} status</p>
          </div>
        ) : (
          filtered.map(crew => <CrewCard key={crew.crewId} crew={crew} />)
        )}
      </div>

      {/* HOS Rules reference */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">HOS Rules Reference — Canada Rail Safety Act</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {[
            { rule: '12-Hour Limit', desc: 'Maximum 12 consecutive hours on duty for freight crews on main track.' },
            { rule: '10-Hour Limit', desc: 'Maximum 10 hours where passenger trains operate on the same track.' },
            { rule: 'Mandatory Rest', desc: 'Minimum 8 hours rest at away-from-home terminal; 12 hours at home terminal before next call.' },
          ].map(({ rule, desc }) => (
            <div key={rule}>
              <div className="font-semibold text-foreground mb-0.5">{rule}</div>
              <div className="text-muted-foreground leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </Layout>
  );
}

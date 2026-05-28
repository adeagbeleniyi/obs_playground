import Layout from "@/components/Layout";
import { systemHealth } from "@/lib/mockData";
import { Server, CheckCircle, AlertTriangle, XCircle, Info, KeyRound, ShieldCheck, ShieldAlert, ShieldOff, Clock } from "lucide-react";
import { assets } from "@/lib/mockData";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from "recharts";

const statusIcon: Record<string, React.ReactNode> = {
  operational: <CheckCircle size={14} className="text-emerald-400" />,
  warning: <AlertTriangle size={14} className="text-amber-400" />,
  critical: <XCircle size={14} className="text-red-400" />,
  info: <Info size={14} className="text-sky-400" />,
};

const statusColor: Record<string, string> = {
  operational: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  warning: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
  info: "text-sky-400 border-sky-500/30 bg-sky-500/10",
};

const layerColor: Record<string, string> = {
  edge: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  "back-office": "text-sky-400 bg-sky-500/10 border-sky-500/30",
  cloud: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  transport: "text-amber-400 bg-amber-500/10 border-amber-500/30",
};

const layerDescription: Record<string, string> = {
  edge: "On-device / field hardware",
  "back-office": "Back-office servers (GCP VMs)",
  cloud: "GCP managed services",
  transport: "Communications network",
};

export default function Systems() {
  const layers = ['edge', 'back-office', 'cloud', 'transport'] as const;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>System Health</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            OWL · CARMA · I-ETMS · KES · GCP · BOS — organized by architecture layer from edge to cloud
          </p>
        </div>

        {/* Service Dependency Topology */}
        <div className="bg-card/40 border border-border/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Server size={14} className="text-[#D22630]" />
            <span className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Service Dependency Topology</span>
            <span className="text-xs text-muted-foreground ml-1">— Data flow from edge to cloud</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] text-purple-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">● Edge</div>
              {['I-ETMS (Loco)', 'OWL Agent', 'LVVR Agent', 'WIU / COBRA', 'GPS / CDU'].map(n => (
                <div key={n} className="bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1 text-[10px] text-purple-300 font-mono flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-purple-400 flex-shrink-0" />{n}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] text-sky-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">● Back-Office</div>
              {['BOS Server', 'CARMA', 'KES Server', 'PDS Server', 'ITCM Gateway'].map(n => (
                <div key={n} className="bg-sky-500/10 border border-sky-500/20 rounded px-2 py-1 text-[10px] text-sky-300 font-mono flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-sky-400 flex-shrink-0" />{n}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">● Cloud (GCP)</div>
              {['GCP Pub/Sub', 'BigQuery', 'Cloud Storage', 'Dynatrace SaaS', 'ServiceNow'].map(n => (
                <div key={n} className="bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1 text-[10px] text-emerald-300 font-mono flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />{n}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] text-amber-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">● Transport</div>
              {['220MHz Radio', 'ITCM Cell', 'Satellite Backup', 'Wayside LAN', 'VPN Tunnel'].map(n => (
                <div key={n} className="bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 text-[10px] text-amber-300 font-mono flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />{n}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
            <span><span className="text-purple-400">Edge</span> → <span className="text-sky-400">Back-Office</span>: EMP messages over 220MHz/ITCM</span>
            <span>·</span>
            <span><span className="text-sky-400">Back-Office</span> → <span className="text-emerald-400">Cloud</span>: telemetry, audit, ML pipelines</span>
            <span>·</span>
            <span><span className="text-emerald-400">Cloud</span> → NOC: dashboards, alerts, reports via SPOG</span>
          </div>
        </div>

        {/* Architecture Layer Legend */}
        <div className="grid grid-cols-4 gap-3">
          {layers.map(layer => {
            const systems = systemHealth.filter(s => s.layer === layer);
            const hasIssues = systems.some(s => s.status !== 'operational');
            return (
              <div key={layer} className={`rounded border p-3 ${layerColor[layer]}`}>
                <div className="text-[10px] uppercase tracking-widest font-medium mb-1">{layer.replace('-', ' ')}</div>
                <div className="text-[10px] opacity-70 mb-2">{layerDescription[layer]}</div>
                <div className="text-2xl font-bold kpi-number">{systems.length}</div>
                <div className="text-[10px] mt-1 opacity-80">{hasIssues ? `${systems.filter(s => s.status !== 'operational').length} with alerts` : 'All nominal'}</div>
              </div>
            );
          })}
        </div>

        {/* System Health Analytics */}
        {(() => {
          const statusCounts = { operational: 0, warning: 0, critical: 0, info: 0 };
          systemHealth.forEach(s => { if (s.status in statusCounts) statusCounts[s.status as keyof typeof statusCounts]++; });
          const statusData = Object.entries(statusCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
          const STATUS_COLORS: Record<string, string> = { Operational: '#10B981', Warning: '#F59E0B', Critical: '#EF4444', Info: '#38BDF8' };

          const alertData = systemHealth.filter(s => s.activeAlerts > 0).map(s => ({ name: s.name, alerts: s.activeAlerts })).sort((a, b) => b.alerts - a.alerts).slice(0, 8);

          const uptimeData = systemHealth.map(s => ({ name: s.name, uptime: parseFloat(s.uptime) })).sort((a, b) => a.uptime - b.uptime).slice(0, 8);

          const tooltipStyle = {
            contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 },
            labelStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 10 },
          };

          return (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">System Status Distribution</p>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                      {statusData.map(entry => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Active Alerts by System</p>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={alertData} layout="vertical" margin={{ left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} width={42} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="alerts" fill="#F59E0B" name="Alerts" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Uptime % (Lowest First)</p>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={uptimeData} layout="vertical" margin={{ left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[99, 100]} tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} width={42} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, 'Uptime']} />
                    <Bar dataKey="uptime" name="Uptime %" radius={[0, 3, 3, 0]}>
                      {uptimeData.map(entry => <Cell key={entry.name} fill={entry.uptime >= 99.9 ? '#10B981' : entry.uptime >= 99 ? '#F59E0B' : '#EF4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* KES / Key Management Service Panel */}
        {(() => {
          const locos = assets.filter(a => a.type === 'locomotive');
          const wius  = assets.filter(a => a.type === 'wayside');
          const blOpkExpiring = locos.filter(a => a.blOpkStatus === 'EXPIRING' || a.blOpkStatus === 'EXPIRED').length;
          const blOpkValid    = locos.filter(a => a.blOpkStatus === 'VALID').length;
          const pollingOverdue = assets.filter(a => a.pollingStatus === 'OVERDUE').length;
          const pollingMismatch = assets.filter(a => a.pollingStatus === 'MISMATCH').length;
          const wOpkDeactivated = wius.filter(a => a.wOpkState === 'DEACTIVATED').length;
          const wOpkPreActivation = wius.filter(a => a.wOpkState === 'PRE_ACTIVATION').length;

          return (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xs px-2 py-0.5 rounded border font-medium uppercase tracking-widest text-rose-400 bg-rose-500/10 border-rose-500/30 flex items-center gap-1">
                  <KeyRound size={10} /> KES — Key Management Service
                </div>
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-muted-foreground">ITC S-9420 — OPK lifecycle monitoring</span>
              </div>

              {/* KES KPI row */}
              <div className="grid grid-cols-6 gap-3 mb-3">
                {[
                  { label: 'BL-OPK Valid',      value: blOpkValid,        color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20',  icon: <ShieldCheck size={13} className="text-emerald-400" />, note: 'Locos with valid daily key' },
                  { label: 'BL-OPK Expiring',   value: blOpkExpiring,     color: blOpkExpiring > 0 ? 'text-amber-400' : 'text-emerald-400', bg: blOpkExpiring > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-card border-border', icon: <ShieldAlert size={13} className={blOpkExpiring > 0 ? 'text-amber-400' : 'text-muted-foreground'} />, note: 'Renews every 24h via EMP 101/102' },
                  { label: 'Polling Overdue',   value: pollingOverdue,    color: pollingOverdue > 0 ? 'text-amber-400' : 'text-emerald-400', bg: pollingOverdue > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-card border-border', icon: <Clock size={13} className={pollingOverdue > 0 ? 'text-amber-400' : 'text-muted-foreground'} />, note: 'EMP 02100/02110 overdue' },
                  { label: 'Polling Mismatch',  value: pollingMismatch,   color: pollingMismatch > 0 ? 'text-red-400' : 'text-emerald-400', bg: pollingMismatch > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-card border-border', icon: <XCircle size={13} className={pollingMismatch > 0 ? 'text-red-400' : 'text-muted-foreground'} />, note: 'BOS state mismatch — NSR risk' },
                  { label: 'W-OPK Pre-Active',  value: wOpkPreActivation, color: wOpkPreActivation > 0 ? 'text-amber-400' : 'text-emerald-400', bg: wOpkPreActivation > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-card border-border', icon: <ShieldAlert size={13} className={wOpkPreActivation > 0 ? 'text-amber-400' : 'text-muted-foreground'} />, note: 'WIU re-key in progress' },
                  { label: 'W-OPK Deactivated', value: wOpkDeactivated,   color: wOpkDeactivated > 0 ? 'text-red-400' : 'text-emerald-400', bg: wOpkDeactivated > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-card border-border', icon: <ShieldOff size={13} className={wOpkDeactivated > 0 ? 'text-red-400' : 'text-muted-foreground'} />, note: 'WIU cannot reboot safely' },
                ].map(k => (
                  <div key={k.label} className={`rounded border p-3 ${k.bg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[9px] text-muted-foreground uppercase tracking-widest leading-tight">{k.label}</div>
                      {k.icon}
                    </div>
                    <div className={`text-2xl font-bold font-mono ${k.color}`}>{k.value}</div>
                    <div className="text-[9px] text-muted-foreground mt-1 leading-tight">{k.note}</div>
                  </div>
                ))}
              </div>

              {/* OPK Type Reference */}
              <div className="bg-card border border-border rounded p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">OPK Type Reference (ITC S-9420)</div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { type: 'BL-OPK', full: 'Baseline OPK', validity: '1 day', protects: 'Loco ↔ BOS session setup', priority: 'CRITICAL', note: 'Must renew daily via EMP 101/102 or loco cannot authenticate at next subdivision boundary' },
                    { type: 'L-OPK',  full: 'Loco OPK',     validity: '5 years', protects: 'Loco ↔ BOS data channel', priority: 'STANDARD', note: 'Long-lived key; revocation is rare but immediate action required if compromised' },
                    { type: 'W-OPK',  full: 'Wayside OPK',  validity: '5 years', protects: 'WIU config file encryption', priority: 'STANDARD', note: 'DEACTIVATED state means WIU cannot decrypt config on next reboot — latent fault' },
                    { type: 'ED-OPK', full: 'Encryption/Decryption OPK', validity: '10 years', protects: 'Encrypts W-OPK file for BOS', priority: 'LOW', note: 'Longest-lived key; managed entirely by BOS back-office, no field action required' },
                  ].map(opk => (
                    <div key={opk.type} className={`rounded border p-2.5 ${
                      opk.priority === 'CRITICAL' ? 'border-rose-500/30 bg-rose-500/5' :
                      opk.priority === 'STANDARD' ? 'border-sky-500/20 bg-sky-500/5' :
                      'border-border bg-muted/10'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono font-bold text-foreground">{opk.type}</span>
                        <span className={`text-[9px] px-1 py-0.5 rounded ${
                          opk.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                          opk.priority === 'STANDARD' ? 'bg-sky-500/20 text-sky-400' :
                          'bg-muted/30 text-muted-foreground'
                        }`}>{opk.priority}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1">{opk.full}</div>
                      <div className="text-[9px] text-foreground/70 mb-1">Validity: <span className="font-mono">{opk.validity}</span></div>
                      <div className="text-[9px] text-foreground/70 mb-1.5">Protects: {opk.protects}</div>
                      <div className="text-[9px] text-muted-foreground leading-relaxed">{opk.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Systems by Layer */}
        {layers.map(layer => {
          const layerSystems = systemHealth.filter(s => s.layer === layer);
          if (layerSystems.length === 0) return null;
          return (
            <div key={layer}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`text-xs px-2 py-0.5 rounded border font-medium uppercase tracking-widest ${layerColor[layer]}`}>
                  {layer.replace('-', ' ')} Layer
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {layerSystems.map((sys) => (
                  <div key={sys.name} className={`bg-card border rounded p-4 ${sys.status === 'critical' ? 'border-red-500/30' : sys.status === 'warning' ? 'border-amber-500/30' : 'border-border'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {statusIcon[sys.status]}
                        <div>
                          <div className="text-sm font-bold text-foreground mono">{sys.name}</div>
                          <div className="text-[11px] text-muted-foreground">{sys.fullName}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${statusColor[sys.status]}`}>
                        {sys.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/30 rounded px-2 py-1.5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Uptime</div>
                        <div className={`text-sm font-bold mono ${parseFloat(sys.uptime) >= 99.9 ? 'text-emerald-400' : parseFloat(sys.uptime) >= 99 ? 'text-amber-400' : 'text-red-400'}`}>
                          {sys.uptime}
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded px-2 py-1.5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Active Alerts</div>
                        <div className={`text-sm font-bold mono ${sys.activeAlerts === 0 ? 'text-emerald-400' : sys.activeAlerts < 5 ? 'text-amber-400' : 'text-red-400'}`}>
                          {sys.activeAlerts}
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded px-2 py-1.5">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Last Event</div>
                        <div className="text-sm font-bold mono text-foreground">{sys.lastEvent}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}

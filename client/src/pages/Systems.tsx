import Layout from "@/components/Layout";
import { systemHealth } from "@/lib/mockData";
import { Server, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
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
            All OT systems organized by architecture layer — from edge hardware to cloud infrastructure
          </p>
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

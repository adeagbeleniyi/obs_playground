import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import {
  Activity, AlertTriangle, CheckCircle, Clock, RefreshCw,
  Wrench, ChevronDown, ChevronUp, ExternalLink, XCircle,
  Search, Radio, Cpu, HardDrive, Zap, MapPin,
  ToggleLeft, ToggleRight, FileText, Settings, Bell,
  Wifi, WifiOff, Thermometer, MemoryStick
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, AreaChart, Area
} from "recharts";
import {
  crossingAssets, getCrossingSummary, getAllAlarms, getAllEvents,
  getAlarmFrequencyBySubdivision, getStatusDistribution, getVoltageHistory, getHeartbeatTimeline,
  type CrossingAsset, type CrossingAlarm, type CrossingStatus, type AlarmSeverity
} from "@/lib/crossingData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBg(s: CrossingStatus | 'MAINTENANCE') {
  return s === 'ONLINE' ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400' :
    s === 'DEGRADED' ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' :
    s === 'OFFLINE' ? 'bg-red-400/10 border-red-400/30 text-red-400' :
    'bg-blue-400/10 border-blue-400/30 text-blue-400';
}
function severityBg(s: AlarmSeverity) {
  return s === 'CRITICAL' ? 'bg-red-400/10 border-red-400/30 text-red-400' :
    s === 'WARNING' ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' :
    'bg-sky-400/10 border-sky-400/30 text-sky-400';
}
function eventTypeIcon(t: string) {
  if (t.includes('HEARTBEAT')) return <Radio size={12} className="text-sky-400" />;
  if (t.includes('ALARM')) return <Bell size={12} className="text-amber-400" />;
  if (t.includes('MAINTENANCE')) return <Wrench size={12} className="text-blue-400" />;
  if (t.includes('VOLTAGE') || t.includes('POWER')) return <Zap size={12} className="text-yellow-400" />;
  if (t.includes('TEMPERATURE')) return <Thermometer size={12} className="text-orange-400" />;
  if (t.includes('DIGITAL')) return <Activity size={12} className="text-emerald-400" />;
  if (t.includes('SOFTWARE')) return <Cpu size={12} className="text-purple-400" />;
  if (t.includes('DISK')) return <HardDrive size={12} className="text-red-400" />;
  if (t.includes('MEMORY')) return <MemoryStick size={12} className="text-orange-400" />;
  return <Clock size={12} className="text-muted-foreground" />;
}

const CHART_COLORS = {
  online: '#10B981', degraded: '#F59E0B', offline: '#EF4444', maintenance: '#3B82F6',
  critical: '#EF4444', warning: '#F59E0B', info: '#38BDF8',
};

// ─── Tooltip styles — use CSS variables so they follow the active theme ─────
const tooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 },
  labelStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 10 },
  itemStyle: { color: 'hsl(var(--foreground))' },
};

// ─── RCA Drill-Down Panel ─────────────────────────────────────────────────────
function RCAPanel({ alarm }: { alarm: CrossingAlarm }) {
  const [open, setOpen] = useState(false);
  if (!alarm.rootCause) return null;
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        Root Cause Analysis
      </button>
      {open && (
        <div className="mt-2 space-y-2 pl-3 border-l border-amber-400/30">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Root Cause</p>
            <p className="text-xs text-foreground leading-relaxed">{alarm.rootCause}</p>
          </div>
          {alarm.impactAssessment && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Impact Assessment</p>
              <p className="text-xs text-foreground leading-relaxed">{alarm.impactAssessment}</p>
            </div>
          )}
          {alarm.recommendedAction && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Recommended Action</p>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{alarm.recommendedAction}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Asset Detail Slide-over ──────────────────────────────────────────────────
function AssetDetailPanel({ asset, onClose }: { asset: CrossingAsset; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'dau' | 'wsdmm' | 'alarms' | 'events'>('overview');
  const [maintenanceNote, setMaintenanceNote] = useState('');
  const [showMaintenanceInput, setShowMaintenanceInput] = useState(false);
  const voltageHistory = getVoltageHistory();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-[600px] bg-background border-l border-border/50 overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/50 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBg(asset.maintenanceMode ? 'MAINTENANCE' : asset.status)}`}>
                  {asset.maintenanceMode ? 'MAINTENANCE' : asset.status}
                </span>
                {asset.maintenanceMode && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-400/10 border-blue-400/30 text-blue-400">
                    ALARM SUPPRESSED
                  </span>
                )}
              </div>
              <h2 className="text-sm font-bold text-foreground">{asset.streetName}</h2>
              <p className="text-xs text-muted-foreground">{asset.city}, {asset.province} · {asset.subdivision} Sub MP {asset.milepost} · DOT# {asset.dotNum}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-1"><XCircle size={18} /></button>
          </div>
          <div className="flex gap-1 mt-3">
            {(['overview', 'dau', 'wsdmm', 'alarms', 'events'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 text-[11px] font-medium rounded transition-colors ${tab === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t === 'dau' ? 'DAU' : t === 'wsdmm' ? 'WSDMM' : t.charAt(0).toUpperCase() + t.slice(1)}
                {t === 'alarms' && asset.activeAlarms.length > 0 && (
                  <span className="ml-1 bg-red-500 text-red-50 text-[9px] rounded-full px-1 leading-none py-0.5">{asset.activeAlarms.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              <div className="bg-card/40 rounded-lg p-3 border border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">SNOW Integration</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Asset ID:</span> <span className="text-foreground font-mono">{asset.snowAssetId}</span></div>
                  <div><span className="text-muted-foreground">Last Sync:</span> <span className="text-foreground">{asset.snowLastSync}</span></div>
                  <div><span className="text-muted-foreground">Last Inspection:</span> <span className="text-foreground">{asset.lastInspection}</span></div>
                  <div><span className="text-muted-foreground">Next Due:</span> <span className="text-foreground">{asset.nextInspectionDue}</span></div>
                </div>
              </div>
              <div className="bg-card/40 rounded-lg p-3 border border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Maintenance Mode</p>
                  <button
                    onClick={() => setShowMaintenanceInput(v => !v)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border transition-colors ${asset.maintenanceMode ? 'bg-blue-400/10 border-blue-400/30 text-blue-400 hover:bg-blue-400/20' : 'bg-muted/50 border-border/50 text-foreground/80 hover:bg-muted'}`}
                  >
                    {asset.maintenanceMode ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    {asset.maintenanceMode ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
                {asset.maintenanceMode ? (
                  <div className="space-y-1 text-xs">
                    <div><span className="text-muted-foreground">Set by:</span> <span className="text-foreground">{asset.maintenanceModeSetBy}</span></div>
                    <div><span className="text-muted-foreground">Since:</span> <span className="text-foreground">{asset.maintenanceModeSetAt}</span></div>
                    <div><span className="text-muted-foreground">Reason:</span> <span className="text-foreground">{asset.maintenanceModeReason}</span></div>
                    <div className="mt-1 text-[10px] text-blue-400 bg-blue-400/10 rounded px-2 py-1 border border-blue-400/20">Alarms and SNOW tickets are suppressed while in maintenance mode.</div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Not in maintenance mode. Alarms and SNOW tickets are active.</p>
                )}
                {showMaintenanceInput && !asset.maintenanceMode && (
                  <div className="mt-2 space-y-2">
                    <textarea value={maintenanceNote} onChange={e => setMaintenanceNote(e.target.value)} placeholder="Enter reason for maintenance mode..." className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground resize-none h-16" />
                    <button className="text-xs bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1 rounded hover:bg-blue-500/30 transition-colors">Confirm Maintenance Mode</button>
                  </div>
                )}
              </div>
              {/* Voltage trend chart */}
              {asset.crossingId === 'CX-002' && (
                <div className="bg-card/40 rounded-lg p-3 border border-border/40">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">24h Voltage Trend (V1 Battery · V3 Gate East)</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={voltageHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} interval={5} />
                      <YAxis domain={[10, 14]} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip {...tooltipStyle} />
                      <Line type="monotone" dataKey="v1" stroke="#10B981" strokeWidth={1.5} dot={false} name="V1 Battery" />
                      <Line type="monotone" dataKey="v3" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="V3 Gate E" />
                      <Line type="monotone" dataKey="nominal" stroke="#EF4444" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Min Nominal" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {asset.activeAlarms.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Alarms ({asset.activeAlarms.length})</p>
                  {asset.activeAlarms.map(alarm => (
                    <div key={alarm.alarmId} className={`rounded-lg p-3 border mb-2 ${alarm.severity === 'CRITICAL' ? 'bg-red-400/5 border-red-400/20' : 'bg-amber-400/5 border-amber-400/20'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${severityBg(alarm.severity)}`}>{alarm.severity}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{alarm.alarmCode}</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{alarm.description}</p>
                      {alarm.snowTicketId && (
                        <a href={alarm.snowTicketUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 mt-1">
                          <ExternalLink size={10} /> SNOW {alarm.snowTicketId}
                        </a>
                      )}
                      <RCAPanel alarm={alarm} />
                      <p className="text-[10px] text-muted-foreground mt-2">{alarm.timestamp}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* DAU TAB */}
          {tab === 'dau' && (
            <div className="space-y-3">
              <div className="bg-card/40 rounded-lg p-3 border border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">DAU Identity</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {[['Serial #', asset.dau.serialNumber], ['IP Address', asset.dau.ipAddress], ['MAC Address', asset.dau.macAddress], ['Part #', asset.dau.partNumber], ['SW Version', asset.dau.softwareVersion], ['HW Version', asset.dau.hardwareVersion], ['OS', asset.dau.osVersion], ['Uptime', asset.dau.uptime]].map(([k, v]) => (
                    <div key={k}><span className="text-muted-foreground">{k}:</span> <span className="text-foreground font-mono text-[11px]">{v}</span></div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card/40 rounded-lg p-3 border border-border/40">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Voltages</p>
                  {[['Battery (V1)', asset.dau.v1, 11.5, 13.5], ['AC Input (V2)', asset.dau.v2, 110, 130], ['Gate E (V3)', asset.dau.v3, 10.5, 13.5], ['Gate W (V4)', asset.dau.v4, 10.5, 13.5], ['Signal (V5)', asset.dau.v5, 10.5, 13.5], ['Standby (V6)', asset.dau.v6, 11.0, 13.5]].map(([label, val, min, max]) => {
                    const v = val as number; const ok = v >= (min as number) && v <= (max as number);
                    return (
                      <div key={label as string} className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-muted-foreground text-[11px]">{label as string}</span>
                        <span className={`font-mono font-medium ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{v}V</span>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-card/40 rounded-lg p-3 border border-border/40">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">System Resources</p>
                  {[['CPU', asset.dau.cpuUsage, null], ['Memory', `${asset.dau.memoryUsagePercent}%`, asset.dau.memoryUsagePercent], ['Disk', `${asset.dau.diskUsagePercent}%`, asset.dau.diskUsagePercent], ['Temp', `${asset.dau.temp}°C`, null]].map(([label, display, pct]) => {
                    const p = pct as number | null; const warn = p !== null && p > 80;
                    return (
                      <div key={label as string} className="mb-1.5">
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="text-muted-foreground">{label as string}</span>
                          <span className={warn ? 'text-amber-400 font-medium' : 'text-foreground'}>{display as string}</span>
                        </div>
                        {p !== null && <div className="h-1 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${warn ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${p}%` }} /></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-card/40 rounded-lg p-3 border border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Digital Inputs (Circuit States)</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[['DI1 Island', asset.dau.di1], ['DI2 Approach E', asset.dau.di2], ['DI3 Approach W', asset.dau.di3], ['DI4 Gate Down E', asset.dau.di4], ['DI5 Gate Down W', asset.dau.di5], ['DI6 Bell', asset.dau.di6], ['DI7 Flash', asset.dau.di7], ['DI8 Power Fail', asset.dau.di8], ['DI9 Standby Pwr', asset.dau.di9], ['DI10 Maint SW', asset.dau.di10], ['DI11 Reserved', asset.dau.di11], ['DI12 Reserved', asset.dau.di12]].map(([label, val]) => (
                    <div key={label as string} className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border ${val ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' : 'bg-card border-border text-muted-foreground'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-emerald-400' : 'bg-muted'}`} />
                      {label as string}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* WSDMM TAB */}
          {tab === 'wsdmm' && (
            <div className="space-y-3">
              <div className="bg-card/40 rounded-lg p-3 border border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">WSDMM Identity</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {[['Serial #', asset.wsdmm.serialNumber], ['IP Address', asset.wsdmm.ipAddress], ['Hostname', asset.wsdmm.hostname], ['OS', asset.wsdmm.osVersion], ['Docker', asset.wsdmm.dockerVersion], ['WSDMM Image', asset.wsdmm.wsdmmImageVersion], ['Kernel', asset.wsdmm.kernelVersion], ['Uptime', asset.wsdmm.uptime]].map(([k, v]) => (
                    <div key={k}><span className="text-muted-foreground">{k}:</span> <span className="text-foreground font-mono text-[11px]">{v}</span></div>
                  ))}
                </div>
              </div>
              <div className="bg-card/40 rounded-lg p-3 border border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">System Resources</p>
                {[['CPU', asset.wsdmm.cpuUsage, null], ['Memory', `${asset.wsdmm.memoryUsagePercent}%`, asset.wsdmm.memoryUsagePercent], ['Disk', `${asset.wsdmm.diskUsagePercent}%`, asset.wsdmm.diskUsagePercent]].map(([label, display, pct]) => {
                  const p = pct as number | null; const warn = p !== null && p > 80;
                  return (
                    <div key={label as string} className="mb-1.5">
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-muted-foreground">{label as string}</span>
                        <span className={warn ? 'text-amber-400 font-medium' : 'text-foreground'}>{display as string}</span>
                      </div>
                      {p !== null && <div className="h-1 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${warn ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${p}%` }} /></div>}
                    </div>
                  );
                })}
              </div>
              <div className="bg-card/40 rounded-lg p-3 border border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Docker Images</p>
                <p className="text-xs font-mono text-foreground">{asset.wsdmm.dockerImages}</p>
              </div>
              <div className="bg-card/40 rounded-lg p-3 border border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Remote Configuration</p>
                <div className="flex gap-2">
                  <button className="text-xs bg-muted/50 border border-border/50 text-foreground/80 px-3 py-1.5 rounded hover:bg-muted transition-colors flex items-center gap-1.5"><FileText size={12} /> Download Config</button>
                  <button className="text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5"><Settings size={12} /> Upload Config</button>
                </div>
              </div>
            </div>
          )}

          {/* ALARMS TAB */}
          {tab === 'alarms' && (
            <div className="space-y-2">
              {asset.activeAlarms.length === 0 ? (
                <div className="text-center py-8"><CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No active alarms</p></div>
              ) : asset.activeAlarms.map(alarm => (
                <div key={alarm.alarmId} className={`rounded-lg p-3 border ${alarm.severity === 'CRITICAL' ? 'bg-red-400/5 border-red-400/20' : 'bg-amber-400/5 border-amber-400/20'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${severityBg(alarm.severity)}`}>{alarm.severity}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{alarm.alarmCode}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{alarm.timestamp}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed mb-1">{alarm.description}</p>
                  {alarm.snowTicketId && <a href={alarm.snowTicketUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 mb-1"><ExternalLink size={10} /> SNOW {alarm.snowTicketId}</a>}
                  <RCAPanel alarm={alarm} />
                  <div className="flex gap-2 mt-2">
                    <button className="text-[10px] bg-muted/50 border border-border/50 text-foreground/80 px-2 py-1 rounded hover:bg-muted transition-colors">Manually Clear</button>
                    {!asset.maintenanceMode && <button className="text-[10px] bg-blue-400/10 border border-blue-400/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-400/20 transition-colors">Suppress (Maintenance)</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EVENTS TAB */}
          {tab === 'events' && (
            <div className="space-y-2">
              {asset.recentEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No recent events</p>
              ) : asset.recentEvents.map(evt => (
                <div key={evt.eventId} className="bg-card/40 rounded-lg p-3 border border-border/40">
                  <div className="flex items-center gap-2 mb-1">
                    {eventTypeIcon(evt.eventType)}
                    <span className="text-[10px] font-mono text-muted-foreground">{evt.eventType}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{evt.timestamp}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{evt.description}</p>
                  {evt.details && Object.keys(evt.details).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(evt.details).map(([k, v]) => (
                        <span key={k} className="text-[10px] font-mono bg-background border border-border px-1.5 py-0.5 rounded text-foreground/80">{k}: {String(v)}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CrossingMonitoring() {
  const [view, setView] = useState<'assets' | 'events' | 'alarms' | 'analytics'>('assets');
  const [selectedAsset, setSelectedAsset] = useState<CrossingAsset | null>(null);
  const [search, setSearch] = useState('');
  const [subFilter, setSubFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [lastRefresh] = useState(new Date().toLocaleTimeString());

  const summary = getCrossingSummary();
  const allAlarms = getAllAlarms();
  const allEvents = getAllEvents();
  const alarmFreq = getAlarmFrequencyBySubdivision();
  const statusDist = getStatusDistribution();
  const heartbeatTimeline = getHeartbeatTimeline();

  const subdivisions = useMemo(() => ['All', ...Array.from(new Set(crossingAssets.map(c => c.subdivision))).sort()], []);

  const filteredAssets = useMemo(() => crossingAssets.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.streetName.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.dotNum.toLowerCase().includes(q) || c.subdivision.toLowerCase().includes(q);
    const matchSub = subFilter === 'All' || c.subdivision === subFilter;
    const matchStatus = statusFilter === 'All' || (statusFilter === 'MAINTENANCE' ? c.maintenanceMode : c.status === statusFilter);
    return matchSearch && matchSub && matchStatus;
  }), [search, subFilter, statusFilter]);

  const filteredAlarms = useMemo(() => allAlarms.filter(a => {
    const matchSev = severityFilter === 'All' || a.severity === severityFilter;
    const matchSub = subFilter === 'All' || crossingAssets.find(c => c.crossingId === a.crossingId)?.subdivision === subFilter;
    return matchSev && matchSub;
  }), [allAlarms, severityFilter, subFilter]);

  const filteredEvents = useMemo(() => allEvents.filter(e => {
    const matchSub = subFilter === 'All' || e.subdivision === subFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || e.description.toLowerCase().includes(q) || e.site.toLowerCase().includes(q);
    return matchSub && matchSearch;
  }), [allEvents, subFilter, search]);

  return (
    <Layout>
      <div className="min-h-screen bg-background text-foreground">
        {selectedAsset && <AssetDetailPanel asset={selectedAsset} onClose={() => setSelectedAsset(null)} />}

        {/* Page Header */}
        <div className="border-b border-border/60 bg-card px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-bold text-foreground flex items-center gap-2">
                <Radio size={16} className="text-cyan-400" />
                Crossing Monitoring
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">DAU · WSDMM · OWL Agent · SNOW Integration — Last refresh: {lastRefresh}</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-card transition-colors">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-7 gap-3 mb-4">
            {[
              { label: 'Total', value: summary.total, color: 'text-foreground', icon: <Radio size={13} /> },
              { label: 'Online', value: summary.online, color: 'text-emerald-400', icon: <Wifi size={13} /> },
              { label: 'Degraded', value: summary.degraded, color: 'text-amber-400', icon: <AlertTriangle size={13} /> },
              { label: 'Offline', value: summary.offline, color: 'text-red-400', icon: <WifiOff size={13} /> },
              { label: 'Maintenance', value: summary.maintenance, color: 'text-blue-400', icon: <Wrench size={13} /> },
              { label: 'Critical', value: summary.critical, color: 'text-red-400', icon: <AlertTriangle size={13} /> },
              { label: 'Warnings', value: summary.warning, color: 'text-amber-400', icon: <Activity size={13} /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="bg-card/40 rounded-lg p-3 border border-border/40">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">{icon}{label}</div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* View Tabs */}
          <div className="flex gap-1">
            {(['assets', 'alarms', 'events', 'analytics'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${view === v ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-card'}`}
              >
                {v === 'assets' ? `Asset Viewer (${summary.total})` : v === 'alarms' ? `Alarm Viewer (${summary.totalAlarms})` : v === 'events' ? `Event Viewer (${summary.totalEvents})` : 'Analytics'}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-border/40 flex items-center gap-3 flex-wrap bg-card">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search crossings..." className="bg-card border border-border rounded-lg pl-7 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground w-48 focus:outline-none focus:border-cyan-500/50" />
          </div>
          <select value={subFilter} onChange={e => setSubFilter(e.target.value)} className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none">
            {subdivisions.map(s => <option key={s}>{s}</option>)}
          </select>
          {view === 'assets' && (
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none">
              {['All', 'ONLINE', 'DEGRADED', 'OFFLINE', 'MAINTENANCE'].map(s => <option key={s}>{s}</option>)}
            </select>
          )}
          {view === 'alarms' && (
            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none">
              {['All', 'CRITICAL', 'WARNING', 'INFO'].map(s => <option key={s}>{s}</option>)}
            </select>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {view === 'assets' ? `${filteredAssets.length} crossings` : view === 'alarms' ? `${filteredAlarms.length} alarms` : view === 'events' ? `${filteredEvents.length} events` : ''}
          </span>
        </div>

        {/* Content */}
        <div className="px-6 py-4">

          {/* ── ASSET VIEWER ── */}
          {view === 'assets' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/60">
                    {['Crossing', 'Subdivision', 'MP', 'DOT #', 'Status', 'Alarms', 'DAU SW', 'WSDMM', 'Last Heartbeat'].map(h => (
                      <th key={h} className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(asset => {
                    const alarmCount = asset.activeAlarms.length;
                    const critical = asset.activeAlarms.filter(a => a.severity === 'CRITICAL').length;
                    return (
                      <tr key={asset.crossingId} className="border-b border-border/60 hover:bg-card/30 cursor-pointer transition-colors" onClick={() => setSelectedAsset(asset)}>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${asset.status === 'ONLINE' && !asset.maintenanceMode ? 'bg-emerald-400' : asset.status === 'DEGRADED' ? 'bg-amber-400' : asset.status === 'OFFLINE' ? 'bg-red-400' : 'bg-blue-400'}`} />
                            <div>
                              <p className="text-xs font-medium text-foreground">{asset.streetName}</p>
                              <p className="text-[10px] text-muted-foreground">{asset.city}, {asset.province}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-foreground/80">{asset.subdivision}</td>
                        <td className="py-2.5 px-3 text-xs font-mono text-muted-foreground">{asset.milepost}</td>
                        <td className="py-2.5 px-3 text-xs font-mono text-muted-foreground">{asset.dotNum}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBg(asset.maintenanceMode ? 'MAINTENANCE' : asset.status)}`}>
                            {asset.maintenanceMode ? 'MAINT' : asset.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {alarmCount > 0 ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${critical > 0 ? 'bg-red-400/10 border-red-400/30 text-red-400' : 'bg-amber-400/10 border-amber-400/30 text-amber-400'}`}>
                              {alarmCount} {critical > 0 ? 'CRIT' : 'WARN'}
                            </span>
                          ) : <span className="text-[10px] text-emerald-400">Clear</span>}
                        </td>
                        <td className="py-2.5 px-3 text-[10px] text-muted-foreground">{asset.dau.softwareVersion}</td>
                        <td className="py-2.5 px-3 text-[10px] text-muted-foreground">{asset.wsdmm.wsdmmImageVersion}</td>
                        <td className="py-2.5 px-3 text-[10px] text-muted-foreground">{asset.dau.lastHeartbeat}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── ALARM VIEWER ── */}
          {view === 'alarms' && (
            <div className="space-y-2">
              {filteredAlarms.length === 0 ? (
                <div className="text-center py-12"><CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No active alarms matching filters</p></div>
              ) : filteredAlarms.map(alarm => {
                const asset = crossingAssets.find(c => c.crossingId === alarm.crossingId);
                return (
                  <div key={alarm.alarmId} className={`rounded-lg p-4 border ${alarm.severity === 'CRITICAL' ? 'bg-red-400/5 border-red-400/20' : alarm.severity === 'WARNING' ? 'bg-amber-400/5 border-amber-400/20' : 'bg-sky-400/5 border-sky-400/20'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityBg(alarm.severity)}`}>{alarm.severity}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{alarm.alarmCode}</span>
                          <span className="text-[10px] text-muted-foreground">{alarm.deviceType}</span>
                          {alarm.snowTicketId && <a href={alarm.snowTicketUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300"><ExternalLink size={10} /> {alarm.snowTicketId}</a>}
                        </div>
                        {asset && (
                          <button onClick={() => setSelectedAsset(asset)} className="text-xs font-medium text-cyan-400 hover:text-cyan-300 mb-1 flex items-center gap-1">
                            <MapPin size={11} /> {asset.streetName}, {asset.city} · {asset.subdivision} Sub MP {asset.milepost}
                          </button>
                        )}
                        <p className="text-xs text-foreground leading-relaxed">{alarm.description}</p>
                        <RCAPanel alarm={alarm} />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">{alarm.timestamp}</p>
                        <div className="flex gap-1.5 mt-2 justify-end">
                          <button className="text-[10px] bg-muted/50 border border-border/50 text-foreground/80 px-2 py-1 rounded hover:bg-muted transition-colors">Clear</button>
                          <button className="text-[10px] bg-blue-400/10 border border-blue-400/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-400/20 transition-colors">Suppress</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── EVENT VIEWER ── */}
          {view === 'events' && (
            <div className="space-y-1.5">
              {filteredEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-12">No events matching filters</p>
              ) : filteredEvents.map(evt => (
                <div key={evt.eventId} className="bg-card/30 rounded-lg px-4 py-3 border border-border/30 flex items-start gap-3 hover:bg-card/50 transition-colors">
                  <div className="mt-0.5">{eventTypeIcon(evt.eventType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[10px] font-mono text-muted-foreground">{evt.eventType}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <button onClick={() => { const asset = crossingAssets.find(c => c.crossingId === evt.crossingId); if (asset) setSelectedAsset(asset); }} className="text-[10px] text-cyan-400 hover:text-cyan-300">{evt.site}</button>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{evt.subdivision} Sub MP {evt.milepost}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] font-medium text-muted-foreground">{evt.deviceType}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{evt.description}</p>
                    {evt.details && Object.keys(evt.details).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(evt.details).map(([k, v]) => (
                          <span key={k} className="text-[10px] font-mono bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground">{k}: {String(v)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground shrink-0">{evt.timestamp}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {view === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {/* Status Distribution Donut */}
                <div className="bg-card/40 rounded-xl p-4 border border-border/40">
                  <p className="text-xs font-semibold text-foreground/80 mb-3">Crossing Status Distribution</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {statusDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Alarm Frequency by Subdivision */}
                <div className="col-span-2 bg-card/40 rounded-xl p-4 border border-border/40">
                  <p className="text-xs font-semibold text-foreground/80 mb-3">Active Alarms by Subdivision</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={alarmFreq} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="subdivision" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="critical" stackId="a" fill={CHART_COLORS.critical} name="Critical" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="warning" stackId="a" fill={CHART_COLORS.warning} name="Warning" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Heartbeat Timeline */}
              <div className="bg-card/40 rounded-xl p-4 border border-border/40">
                <p className="text-xs font-semibold text-foreground/80 mb-3">Crossing Availability — Last 12 Hours</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={heartbeatTimeline} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Area type="monotone" dataKey="online" stackId="1" stroke={CHART_COLORS.online} fill={CHART_COLORS.online} fillOpacity={0.3} name="Online" />
                    <Area type="monotone" dataKey="degraded" stackId="1" stroke={CHART_COLORS.degraded} fill={CHART_COLORS.degraded} fillOpacity={0.3} name="Degraded" />
                    <Area type="monotone" dataKey="offline" stackId="1" stroke={CHART_COLORS.offline} fill={CHART_COLORS.offline} fillOpacity={0.3} name="Offline" />
                    <Area type="monotone" dataKey="maintenance" stackId="1" stroke={CHART_COLORS.maintenance} fill={CHART_COLORS.maintenance} fillOpacity={0.3} name="Maintenance" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* DAU Software Version Distribution */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card/40 rounded-xl p-4 border border-border/40">
                  <p className="text-xs font-semibold text-foreground/80 mb-3">DAU Software Versions</p>
                  {(() => {
                    const versionCounts: Record<string, number> = {};
                    crossingAssets.forEach(c => { versionCounts[c.dau.softwareVersion] = (versionCounts[c.dau.softwareVersion] || 0) + 1; });
                    const data = Object.entries(versionCounts).map(([v, count]) => ({ version: v, count })).sort((a, b) => b.count - a.count);
                    return (
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                          <YAxis type="category" dataKey="version" tick={{ fontSize: 9, fill: '#64748b' }} width={55} />
                          <Tooltip {...tooltipStyle} />
                          <Bar dataKey="count" fill="#38BDF8" name="Crossings" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
                <div className="bg-card/40 rounded-xl p-4 border border-border/40">
                  <p className="text-xs font-semibold text-foreground/80 mb-3">WSDMM Image Versions</p>
                  {(() => {
                    const versionCounts: Record<string, number> = {};
                    crossingAssets.forEach(c => { versionCounts[c.wsdmm.wsdmmImageVersion] = (versionCounts[c.wsdmm.wsdmmImageVersion] || 0) + 1; });
                    const data = Object.entries(versionCounts).map(([v, count]) => ({ version: v, count })).sort((a, b) => b.count - a.count);
                    return (
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                          <YAxis type="category" dataKey="version" tick={{ fontSize: 9, fill: '#64748b' }} width={55} />
                          <Tooltip {...tooltipStyle} />
                          <Bar dataKey="count" fill="#A78BFA" name="Crossings" radius={[0, 3, 3, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

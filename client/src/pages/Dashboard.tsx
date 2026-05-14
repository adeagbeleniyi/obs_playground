import Layout from "@/components/Layout";
import { kpiMetrics, incidents, incidentTrendData, tagDistribution } from "@/lib/mockData";
import { predictiveAlerts, type PredictiveAlert } from "@/lib/observabilityData";
import { useState } from "react";
import {
  AlertTriangle, CheckCircle, TrendingDown, TrendingUp, Minus,
  Bot, Zap, Activity, Eye, ChevronDown, ChevronUp,
  Radio, Thermometer, Clock
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const severityColor = { critical: "text-red-400", warning: "text-amber-400", info: "text-sky-400", operational: "text-emerald-400" };
const severityBg   = { critical: "bg-red-500/10 border-red-500/30", warning: "bg-amber-500/10 border-amber-500/30", info: "bg-sky-500/10 border-sky-500/30", operational: "bg-emerald-500/10 border-emerald-500/30" };
const trendIcon    = { up: <TrendingUp size={12}/>, down: <TrendingDown size={12}/>, flat: <Minus size={12}/> };

const urgencyConfig = {
  imminent: { bg: 'bg-red-500/10 border-red-500/40',   badge: 'bg-red-500 text-white',   icon: 'text-red-400',   label: 'IMMINENT' },
  warning:  { bg: 'bg-amber-500/10 border-amber-500/40', badge: 'bg-amber-500 text-white', icon: 'text-amber-400', label: 'WARNING'  },
  watch:    { bg: 'bg-sky-500/10 border-sky-500/30',    badge: 'bg-sky-600 text-white',   icon: 'text-sky-400',   label: 'WATCH'    },
};
const typeIcon  = { 'threshold-drift': <Thermometer size={12}/>, 'correlated-signals': <Activity size={12}/>, 'trace-latency': <Radio size={12}/> };
const typeLabel = { 'threshold-drift': 'Threshold Drift', 'correlated-signals': 'Correlated Signals', 'trace-latency': 'Trace Latency' };

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

          {/* Threshold drift bars */}
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

          {/* Correlated signals */}
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

          {/* Trace latency */}
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

// Updated incident categories (no raw tags)
const incidentCategories = [
  { tag: 'Non-Technical / NSR', count: 1596, color: '#64748b' },
  { tag: 'Communication Failures', count: 377, color: '#D22630' },
  { tag: 'Hardware Faults', count: 512, color: '#f59e0b' },
  { tag: 'Positioning / GPS', count: 288, color: '#38bdf8' },
  { tag: 'Software / Config', count: 120, color: '#a78bfa' },
];

export default function Dashboard() {
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating');
  const aiResolved   = incidents.filter(i => i.aiResolved);
  const imminent = predictiveAlerts.filter(a => a.urgency === 'imminent');
  const warning  = predictiveAlerts.filter(a => a.urgency === 'warning');
  const watch    = predictiveAlerts.filter(a => a.urgency === 'watch');

  return (
    <Layout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Network Overview</h1>
            <p className="text-xs text-muted-foreground mt-0.5">CN Rail OT · Single Pane of Glass · OWL · CARMA · Dynatrace · ServiceNow</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[11px] text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        {/* KPI Tiles */}
        <div className="grid grid-cols-6 gap-3">
          {kpiMetrics.map(kpi => (
            <div key={kpi.label} className={`rounded border p-3 ${severityBg[kpi.severity]}`}>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{kpi.label}</div>
              <div className={`text-xl font-bold mono ${severityColor[kpi.severity]}`}>
                {kpi.value}{kpi.unit && <span className="text-xs font-normal ml-0.5">{kpi.unit}</span>}
              </div>
              <div className={`flex items-center gap-1 text-[10px] mt-1 ${severityColor[kpi.severity]}`}>
                {trendIcon[kpi.trend]}<span>{kpi.trendValue}</span>
              </div>
            </div>
          ))}
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
              {imminent.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-red-500 text-white font-bold">{imminent.length} IMMINENT</span>}
              {warning.length  > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-white font-bold">{warning.length} WARNING</span>}
              {watch.length    > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-sky-600 text-white font-bold">{watch.length} WATCH</span>}
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

        {/* Charts + Incidents row */}
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

          {/* Incident categories (no raw tags) */}
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

        {/* AI Agent Activity */}
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

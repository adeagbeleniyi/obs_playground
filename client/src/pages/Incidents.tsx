import Layout from "@/components/Layout";
import { incidents } from "@/lib/mockData";
import { rootCauseExplanations, type RootCauseExplanation } from "@/lib/observabilityData";
import { useState } from "react";
import {
  Bot, X, ChevronRight, Layers, GitBranch, Lightbulb,
  Zap, Users, FileText, ExternalLink, Clock
} from "lucide-react";

const statusBadge: Record<string, string> = {
  open:            "bg-red-500/20 text-red-400 border-red-500/30",
  investigating:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  resolved:        "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "auto-resolved": "bg-sky-500/20 text-sky-400 border-sky-500/30",
};
const severityDot: Record<string, string> = {
  critical:    "bg-red-500",
  warning:     "bg-amber-500",
  info:        "bg-sky-400",
  operational: "bg-emerald-500",
};
const hopStatusColor: Record<string, string> = {
  ok:      "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  slow:    "text-amber-400 border-amber-500/40 bg-amber-500/10",
  failed:  "text-red-400 border-red-500/40 bg-red-500/10",
  unknown: "text-muted-foreground border-border bg-border/30",
};
const relevanceColor: Record<string, string> = {
  direct:       "text-red-400",
  contributing: "text-amber-400",
  context:      "text-muted-foreground",
};

function RcaModal({ rca, incidentTitle, onClose }: { rca: RootCauseExplanation; incidentTitle: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'what'|'where'|'why'|'blast'|'action'>('what');
  const tabs = [
    { id: 'what',   label: '1. What Happened',       icon: <Layers size={12}/> },
    { id: 'where',  label: '2. Where in the Chain',  icon: <GitBranch size={12}/> },
    { id: 'why',    label: '3. Why It Happened',     icon: <Lightbulb size={12}/> },
    { id: 'blast',  label: '4. Blast Radius',        icon: <Users size={12}/> },
    { id: 'action', label: '5. Recommended Actions', icon: <Zap size={12}/> },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb size={14} className="text-amber-400"/>
              <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Root Cause Explanation</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">AI-Generated · {rca.confidence}% confidence</span>
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-lg">{incidentTitle}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded"><X size={16}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id ? 'border-[#D22630] text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>{t.icon}{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Layer 1 — What Happened */}
          {activeTab === 'what' && (
            <div className="space-y-4">
              <div className="p-4 rounded border border-red-500/20 bg-red-500/5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Event Summary</div>
                <p className="text-sm text-foreground leading-relaxed">{rca.whatHappened}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Clock size={11} className="text-muted-foreground"/>
                  <span className="text-[11px] mono text-muted-foreground">{rca.eventTimestamp}</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground mb-3">Correlated Event Timeline</div>
                <div className="relative pl-4">
                  <div className="absolute left-1.5 top-0 bottom-0 w-px bg-border"/>
                  {rca.correlatedTimeline.map((ev, i) => (
                    <div key={i} className="relative mb-3 pl-4">
                      <div className={`absolute left-[-7px] top-1 w-2 h-2 rounded-full border-2 border-card ${
                        ev.relevance === 'direct' ? 'bg-red-500' : ev.relevance === 'contributing' ? 'bg-amber-500' : 'bg-border'
                      }`}/>
                      <div className="flex items-start gap-3">
                        <span className="mono text-[10px] text-muted-foreground flex-shrink-0 w-16">{ev.timestamp}</span>
                        <div>
                          <span className="text-[10px] font-semibold text-foreground">{ev.system}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{ev.event}</span>
                        </div>
                        <span className={`text-[9px] flex-shrink-0 font-medium ${relevanceColor[ev.relevance]}`}>{ev.relevance}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-2 text-[9px] text-muted-foreground">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"/>Direct cause</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"/>Contributing factor</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-border"/>Context</div>
                </div>
              </div>
            </div>
          )}

          {/* Layer 2 — Where in the Chain */}
          {activeTab === 'where' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-foreground mb-1">Synthetic Trace — Hop-by-Hop Analysis</div>
              <div className="text-[10px] text-muted-foreground mb-3">
                Each hop represents a system boundary that a PTC message must cross. The platform uses existing PTC sequence numbers as correlation keys to reconstruct the full message journey without modifying any hardware or firmware.
              </div>
              <div className="space-y-2">
                {rca.traceHops.map((hop, i) => (
                  <div key={i} className={`rounded border p-3 ${hopStatusColor[hop.status]}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0 flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                            hop.status === 'failed' ? 'border-red-500 text-red-400 bg-red-500/20' :
                            hop.status === 'slow'   ? 'border-amber-500 text-amber-400 bg-amber-500/20' :
                                                      'border-emerald-500 text-emerald-400 bg-emerald-500/20'
                          }`}>{i+1}</div>
                          {i < rca.traceHops.length - 1 && <div className="w-px h-4 bg-border mt-1"/>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-foreground">{hop.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-border/50 text-muted-foreground">{hop.system}</span>
                            {hop.status === 'failed' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">FAILURE POINT</span>}
                            {hop.status === 'slow'   && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">DEGRADED</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">{hop.detail}</div>
                          {hop.sequenceNum && hop.sequenceNum !== 'N/A' && (
                            <div className="text-[9px] mono text-muted-foreground mt-0.5">Seq: {hop.sequenceNum}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {hop.latencyMs > 0 && <div className="text-[11px] mono font-semibold text-foreground">{hop.latencyMs}ms</div>}
                        <div className={`text-[10px] font-medium mt-0.5 ${
                          hop.status === 'failed' ? 'text-red-400' : hop.status === 'slow' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>{hop.status.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded border border-border bg-border/20 text-[10px] text-muted-foreground">
                <strong className="text-foreground">Why this matters:</strong> Without synthetic tracing, a support engineer must manually check each system in sequence — typically taking 45–90 minutes. This trace was reconstructed automatically in under 3 seconds using PTC sequence number correlation across OWL, ITCM, and BOS logs.
              </div>
            </div>
          )}

          {/* Layer 3 — Why It Happened */}
          {activeTab === 'why' && (
            <div className="space-y-4">
              <div className="p-4 rounded border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={13} className="text-amber-400"/>
                  <span className="text-xs font-semibold text-foreground">Root Cause — {rca.rootCauseSystem}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">{rca.confidence}% confidence</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{rca.rootCause}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground mb-2">Supporting Evidence ({rca.supportingEvidence.length} data points)</div>
                <div className="space-y-2">
                  {rca.supportingEvidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded border border-border bg-border/20">
                      <ChevronRight size={11} className="text-amber-400 mt-0.5 flex-shrink-0"/>
                      <span className="text-[11px] text-muted-foreground">{ev}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded border border-sky-500/20 bg-sky-500/5 text-[10px] text-muted-foreground">
                <strong className="text-sky-400">Observability vs Monitoring:</strong> A monitoring tool would have fired an alert when the communication link dropped. This root cause was derived by correlating data from 4 separate systems — something that previously required a senior engineer and 90 minutes of manual investigation.
              </div>
            </div>
          )}

          {/* Layer 4 — Blast Radius */}
          {activeTab === 'blast' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-foreground mb-1">Assets Impacted by the Same Root Cause</div>
              <div className="text-[10px] text-muted-foreground mb-3">
                The platform automatically identifies all other assets that share the same failure condition — not just the asset that triggered the alert.
              </div>
              {rca.blastRadius.length === 0 ? (
                <div className="p-4 rounded border border-emerald-500/20 bg-emerald-500/5 text-center">
                  <div className="text-sm text-emerald-400 font-medium mt-2">No blast radius</div>
                  <div className="text-[11px] text-muted-foreground mt-1">This incident was isolated to a single asset.</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {rca.blastRadius.map((item, i) => (
                    <div key={i} className={`rounded border p-3 ${
                      item.impact.includes('stopped') || item.impact.includes('offline') ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-foreground">{item.assetName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-border text-muted-foreground">{item.assetType}</span>
                        <span className="text-[9px] text-muted-foreground">{item.subdivision}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{item.impact}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Layer 5 — Recommended Actions */}
          {activeTab === 'action' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-foreground mb-1">Recommended Actions</div>
              <div className="text-[10px] text-muted-foreground mb-3">
                Actions are ranked by estimated resolution time. Safety-gated actions require human approval — the AI Agent will never autonomously act on safety-critical systems.
              </div>
              {rca.recommendedActions.map((action, i) => (
                <div key={i} className={`rounded border p-3.5 ${
                  action.type === 'auto'   ? 'bg-sky-500/10 border-sky-500/30' :
                  action.type === 'ticket' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                             'bg-border/30 border-border'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                        action.type === 'auto'   ? 'bg-sky-500/20 text-sky-400' :
                        action.type === 'ticket' ? 'bg-emerald-500/20 text-emerald-400' :
                                                   'bg-border text-muted-foreground'
                      }`}>{i+1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[11px] font-semibold text-foreground">{action.label}</span>
                          {action.safetyGated && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">SAFETY GATED</span>
                          )}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                            action.type === 'auto'   ? 'bg-sky-500/20 text-sky-400' :
                            action.type === 'ticket' ? 'bg-emerald-500/20 text-emerald-400' :
                                                       'bg-border text-muted-foreground'
                          }`}>{action.type === 'auto' ? 'AI Agent' : action.type === 'ticket' ? 'ServiceNow' : 'Manual'}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{action.description}</p>
                        {action.estimatedResolutionMin > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Clock size={10} className="text-muted-foreground"/>
                            <span className="text-[10px] text-muted-foreground">Est. resolution: {action.estimatedResolutionMin} min</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-1.5">
                      {action.type === 'auto'   && <button className="px-3 py-1.5 rounded text-[10px] font-medium bg-sky-600 text-white hover:bg-sky-500 flex items-center gap-1"><Zap size={10}/>Execute</button>}
                      {action.type === 'ticket' && <button className="px-3 py-1.5 rounded text-[10px] font-medium bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1"><FileText size={10}/>Create Ticket</button>}
                      {action.type === 'manual' && <button className="px-3 py-1.5 rounded text-[10px] font-medium border border-border text-muted-foreground hover:text-foreground flex items-center gap-1"><ExternalLink size={10}/>Assign</button>}
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 p-3 rounded border border-border bg-border/20 text-[10px] text-muted-foreground">
                <strong className="text-foreground">Safety Principle:</strong> AI Agents may only execute actions on monitoring and telemetry systems. Any action that could affect train movement, PTC enforcement, or safety-critical hardware requires explicit human approval, regardless of confidence level.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function Incidents() {
  const [selectedRca, setSelectedRca] = useState<{ rca: RootCauseExplanation; title: string } | null>(null);

  const openRca = (incId: string, title: string) => {
    const rca = rootCauseExplanations[incId];
    if (rca) setSelectedRca({ rca, title });
  };

  return (
    <Layout>
      {selectedRca && (
        <RcaModal rca={selectedRca.rca} incidentTitle={selectedRca.title} onClose={() => setSelectedRca(null)}/>
      )}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Incidents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">All OT incidents — Dynatrace Davis AI · ServiceNow · Click <span className="text-amber-400">Root Cause</span> for the 5-layer explanation</p>
          </div>
          <div className="text-xs text-muted-foreground">Showing {incidents.length} incidents</div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Open',            count: incidents.filter(i => i.status === 'open').length,           color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30' },
            { label: 'Investigating',   count: incidents.filter(i => i.status === 'investigating').length,  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
            { label: 'Resolved',        count: incidents.filter(i => i.status === 'resolved').length,       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
            { label: 'AI Auto-Resolved',count: incidents.filter(i => i.aiResolved).length,                  color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30' },
          ].map(s => (
            <div key={s.label} className={`rounded border p-3 ${s.bg}`}>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</div>
              <div className={`text-3xl font-bold mono mt-1 ${s.color}`}>{s.count}</div>
            </div>
          ))}
        </div>

        {/* Explanation banner */}
        <div className="flex items-start gap-3 p-3 rounded border border-amber-500/20 bg-amber-500/5">
          <Lightbulb size={13} className="text-amber-400 mt-0.5 flex-shrink-0"/>
          <div className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">Root Cause Explanation</strong> — Incidents with a <span className="text-amber-400 font-medium">Root Cause</span> button have been analyzed by the AI correlation engine. Clicking it opens a 5-layer explanation: <em>What happened → Where in the chain → Why it happened → Blast radius → Recommended actions.</em> This replaces the 45–90 minute manual investigation previously required.
          </div>
        </div>

        {/* Incident Table */}
        <div className="bg-card border border-border rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium w-6"/>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Incident</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">System</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Category</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Location</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Assigned</th>
                <th className="text-right px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">MTTR</th>
                <th className="text-center px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Root Cause</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc, idx) => {
                const hasRca = !!rootCauseExplanations[inc.id];
                return (
                  <tr key={inc.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3"><div className={`w-2 h-2 rounded-full ${severityDot[inc.severity] || 'bg-border'}`}/></td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{inc.title}</div>
                      <div className="mono text-[10px] text-muted-foreground mt-0.5">{inc.id}</div>
                    </td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded bg-border text-muted-foreground text-[10px]">{inc.system}</span></td>
                    <td className="px-4 py-3 text-muted-foreground text-[11px]">{inc.tag}</td>
                    <td className="px-4 py-3 text-muted-foreground text-[11px]">
                      {inc.subdivision || '—'}{inc.milepost ? ` · MP ${inc.milepost}` : ''}
                      {inc.loco && <div className="text-[10px] mono">{inc.loco}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {inc.aiResolved && <Bot size={10} className="text-sky-400"/>}
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${statusBadge[inc.status] || ''}`}>
                          {inc.status.replace('-', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-[11px] max-w-[120px] truncate">{inc.assignedTo}</td>
                    <td className="px-4 py-3 text-right mono">
                      {inc.mttr ? (
                        <span className={`text-[11px] ${inc.mttr < 10 ? 'text-emerald-400' : inc.mttr < 30 ? 'text-amber-400' : 'text-red-400'}`}>{inc.mttr}m</span>
                      ) : <span className="text-muted-foreground text-[11px]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hasRca ? (
                        <button onClick={() => openRca(inc.id, inc.title)}
                          className="px-2.5 py-1 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 flex items-center gap-1 mx-auto">
                          <Lightbulb size={10}/>Root Cause
                        </button>
                      ) : <span className="text-[10px] text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

import Layout from "@/components/Layout";
import { incidents } from "@/lib/mockData";
import { rootCauseExplanations, type RootCauseExplanation } from "@/lib/observabilityData";
import { waysideIncidents, type WaysideIncident } from "@/lib/waysideIncidents";
import { carDatabase } from "@/lib/crewCarData";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Bot, X, ChevronRight, Layers, GitBranch, Lightbulb,
  Zap, Users, FileText, ExternalLink, Clock, Radio, AlertTriangle, Train,
  Gauge, ShieldAlert, Wrench, ClipboardList
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

// ─── AAR Rule lookup helpers ─────────────────────────────────────────────────
function getAARRule(inc: WaysideIncident): { rule: string; threshold: string; violated: string; authority: string } {
  const r = inc.reading.toLowerCase();
  if (inc.detectorType === 'WILD') {
    const kips = parseFloat(r.match(/(\d+\.?\d*)\s*kip/i)?.[1] || '0');
    if (kips >= 90) return { rule: 'Rule 41 — ALARM', threshold: '≥ 90 kips', violated: `${kips} kips detected — immediate stop required`, authority: 'AAR S-4200 / Rule 41' };
    if (kips >= 65) return { rule: 'Rule 41 — ALERT', threshold: '65–89 kips', violated: `${kips} kips detected — set out at next yard`, authority: 'AAR S-4200 / Rule 41' };
    return { rule: 'Rule 41 — ELEVATED', threshold: '50–64 kips', violated: `${kips} kips detected — owner notification required`, authority: 'AAR S-4200 / Rule 41' };
  }
  if (inc.detectorType === 'HBD') {
    if (r.includes('wm51') || r.includes('§4.1')) return { rule: 'S-6001 WM51 Mandatory Set-Out', threshold: 'Kt/Ke ratio or 3-pass rolling window', violated: inc.reading, authority: 'AAR S-6001 §4.1' };
    if (r.includes('wm52') || r.includes('§4.2')) return { rule: 'S-6001 WM52 Alert', threshold: 'Kt ≥ 2.0 with Ke < Kt', violated: inc.reading, authority: 'AAR S-6001 §4.2' };
    return { rule: 'S-6001 HBD Temperature Alarm', threshold: 'Bearing temp > ambient threshold', violated: inc.reading, authority: 'AAR S-6001' };
  }
  if (inc.detectorType === 'DED') {
    if (r.includes('level 2') || r.includes('lvl 2')) return { rule: 'DED Level 2 — Immediate Stop', threshold: 'Severe dragging contact', violated: inc.reading, authority: 'AAR S-4200 DED §3.2' };
    return { rule: 'DED Level 1 — Speed Restriction', threshold: 'Dragging equipment contact', violated: inc.reading, authority: 'AAR S-4200 DED §3.1' };
  }
  if (inc.detectorType === 'TADS') return { rule: 'S-6000 ABD/TADS Defect Rank', threshold: 'Rank ≥ 3 (S-6000 Level-1 criteria)', violated: inc.reading, authority: 'AAR S-6000 §5' };
  if (inc.detectorType === 'WIM') return { rule: 'WIM Overweight', threshold: '33-ton single axle / 263,000 lb gross', violated: inc.reading, authority: 'AAR S-4200 WIM §2' };
  return { rule: 'Wayside Detector Alarm', threshold: 'Detector threshold exceeded', violated: inc.reading, authority: 'AAR S-4200' };
}

function getMandatoryAction(inc: WaysideIncident): { action: string; urgency: string; color: string } {
  if (inc.status === 'ALARM') {
    if (inc.detectorType === 'WILD') return { action: 'IMMEDIATE STOP — Do not move car. Contact Mechanical immediately. Bad-order and set out.', urgency: 'Immediate', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (inc.detectorType === 'HBD') return { action: 'MANDATORY SET-OUT — Remove car from service at next available point. Do not continue movement without mechanical inspection.', urgency: 'Immediate', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (inc.detectorType === 'DED') return { action: 'EMERGENCY STOP — Stop train immediately. Inspect for dragging equipment before any movement.', urgency: 'Immediate', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (inc.detectorType === 'TADS') return { action: 'MANDATORY SET-OUT — S-6000 Level-1 criteria met. Remove bearing from service immediately.', urgency: 'Immediate', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    return { action: 'SET OUT CAR — Remove from service and inspect before returning to revenue service.', urgency: 'Immediate', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
  }
  if (inc.detectorType === 'WILD') return { action: 'SET OUT AT NEXT YARD — Car must be removed from train at next yard or terminal. Notify car owner.', urgency: 'Next yard', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  if (inc.detectorType === 'HBD') return { action: 'MONITOR AND SET OUT — WM52 alert flagged. Monitor for repeat readings. Set out if reading recurs within 240-hour window.', urgency: 'Next opportunity', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  return { action: 'NOTIFY OWNER — Alert car owner. Schedule inspection at next maintenance window.', urgency: 'Scheduled', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
}

function getNextSteps(inc: WaysideIncident): Array<{ step: string; owner: string; priority: 'high' | 'medium' | 'low' }> {
  const steps: Array<{ step: string; owner: string; priority: 'high' | 'medium' | 'low' }> = [];
  steps.push({ step: `Create bad-order card on car ${inc.carNumber} referencing defect flag ${inc.defectFlagId || 'TBD'}`, owner: 'Car Dept / Conductor', priority: 'high' });
  if (inc.workOrderId) steps.push({ step: `Work order ${inc.workOrderId} already raised — assign to mechanical crew at set-out point`, owner: 'Mechanical Supervisor', priority: 'high' });
  else steps.push({ step: 'Raise work order in COTS/SAP for mechanical inspection', owner: 'Mechanical Supervisor', priority: 'high' });
  if (inc.detectorType === 'HBD') {
    steps.push({ step: 'Inspect bearing for heat discolouration, grease leakage, and seal damage', owner: 'Car Mechanic', priority: 'high' });
    steps.push({ step: 'If bearing temp > 200°F above ambient, replace bearing before returning to service', owner: 'Car Mechanic', priority: 'high' });
    steps.push({ step: 'Pull car history from UMLER — check prior HBD readings for progressive trend', owner: 'Car Dept Analyst', priority: 'medium' });
  }
  if (inc.detectorType === 'WILD') {
    steps.push({ step: 'Inspect wheel tread for flat spots, shelling, or thermal cracking', owner: 'Car Mechanic', priority: 'high' });
    steps.push({ step: 'Measure wheel diameter and flange — condemn if below AAR minimum', owner: 'Car Mechanic', priority: 'high' });
    steps.push({ step: 'Notify car owner (reporting mark: ' + inc.reportingMark + ') within 24 hours per interchange rules', owner: 'Car Dept', priority: 'medium' });
  }
  if (inc.detectorType === 'DED') {
    steps.push({ step: 'Walk entire train length — inspect for dragging brake rigging, hoses, or equipment', owner: 'Conductor / Trainmaster', priority: 'high' });
    steps.push({ step: 'Secure or remove dragging component before any further movement', owner: 'Conductor', priority: 'high' });
  }
  if (inc.detectorType === 'TADS') {
    steps.push({ step: 'Perform acoustic bearing inspection — listen for grinding, clicking, or irregular noise', owner: 'Car Mechanic', priority: 'high' });
    steps.push({ step: 'Check bearing for spalling, pitting, or surface defects per S-6000 Level-1 criteria', owner: 'Car Mechanic', priority: 'high' });
  }
  steps.push({ step: `Notify ${inc.subdivision} Sub Dispatcher of car set-out at ${inc.location}`, owner: 'Trainmaster / RTC', priority: 'medium' });
  steps.push({ step: 'Update car status in UMLER/TRAIN II to bad-order', owner: 'Car Dept', priority: 'medium' });
  steps.push({ step: 'Close incident in ServiceNow once car is set out and WO is raised', owner: inc.assignedTo, priority: 'low' });
  return steps;
}

// ─── Defect RCA Modal ─────────────────────────────────────────────────────────
function DefectRcaModal({ inc, onClose }: { inc: WaysideIncident; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'detected'|'rule'|'action'|'steps'>('detected');
  const car = carDatabase.find(c => c.carNumber === inc.carNumber);
  const aarRule = getAARRule(inc);
  const mandatoryAction = getMandatoryAction(inc);
  const nextSteps = getNextSteps(inc);
  const tabs = [
    { id: 'detected', label: '1. What Was Detected',  icon: <Gauge size={12}/> },
    { id: 'rule',     label: '2. Rule Violated',       icon: <ShieldAlert size={12}/> },
    { id: 'action',   label: '3. Mandatory Action',    icon: <AlertTriangle size={12}/> },
    { id: 'steps',    label: '4. Next Steps',          icon: <ClipboardList size={12}/> },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gauge size={14} className="text-orange-400"/>
              <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Defect Analysis</span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                inc.status === 'ALARM' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>{inc.status}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">{inc.detectorType}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-lg">{inc.title}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded"><X size={16}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id ? 'border-orange-400 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>{t.icon}{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Layer 1 — What Was Detected */}
          {activeTab === 'detected' && (
            <div className="space-y-4">
              <div className="p-4 rounded border border-orange-500/20 bg-orange-500/5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Detector Reading</div>
                <p className="text-sm font-semibold text-foreground">{inc.reading}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock size={11} className="text-muted-foreground"/>
                  <span className="text-[11px] font-mono text-muted-foreground">{inc.timestamp}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded border border-border bg-muted/20">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Car Identity</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Car Number</span><span className="font-mono text-foreground font-semibold">{inc.carNumber}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Reporting Mark</span><span className="font-mono text-foreground">{inc.reportingMark}</span></div>
                    {car && <>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Car Type</span><span className="text-foreground">{car.carType}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Owner</span><span className="text-foreground">{car.owner}</span></div>
                    </>}
                  </div>
                </div>
                <div className="p-3 rounded border border-border bg-muted/20">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Detection Location</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Detector</span><span className="font-mono text-foreground">{inc.detectorId}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Location</span><span className="text-foreground">{inc.location}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subdivision</span><span className="text-foreground">{inc.subdivision}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Milepost</span><span className="font-mono text-foreground">{inc.milepost}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Train</span><span className="font-mono text-foreground">{inc.trainId}</span></div>
                  </div>
                </div>
              </div>
              {inc.defectFlagId && (
                <div className="flex items-center gap-2 p-3 rounded border border-amber-500/20 bg-amber-500/5 text-xs">
                  <FileText size={12} className="text-amber-400 flex-shrink-0"/>
                  <span className="text-muted-foreground">Defect flag raised:</span>
                  <span className="font-mono text-foreground font-semibold">{inc.defectFlagId}</span>
                  {inc.workOrderId && <><span className="text-muted-foreground ml-2">Work order:</span><span className="font-mono text-foreground font-semibold">{inc.workOrderId}</span></>}
                </div>
              )}
            </div>
          )}

          {/* Layer 2 — Rule Violated */}
          {activeTab === 'rule' && (
            <div className="space-y-4">
              <div className="p-4 rounded border border-red-500/20 bg-red-500/5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">AAR Rule Triggered</div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert size={14} className="text-red-400"/>
                  <span className="text-sm font-bold text-foreground">{aarRule.rule}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">Authority: <span className="text-foreground font-medium">{aarRule.authority}</span></div>
                <div className="text-xs text-muted-foreground">Threshold: <span className="text-foreground font-medium">{aarRule.threshold}</span></div>
              </div>
              <div className="p-4 rounded border border-border bg-muted/20">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Violation Detail</div>
                <p className="text-sm text-foreground leading-relaxed">{aarRule.violated}</p>
              </div>
              <div className="p-3 rounded border border-border bg-border/10 text-[10px] text-muted-foreground">
                <strong className="text-foreground">Why this rule exists:</strong>{' '}
                {inc.detectorType === 'WILD' && 'High wheel impact loads cause progressive rail damage, broken rails, and derailments. AAR Rule 41 thresholds are set based on statistical analysis of wheel-rail interaction forces that exceed safe limits.'}
                {inc.detectorType === 'HBD' && 'Hot bearings are a leading cause of train derailments. AAR S-6001 K-value methodology uses ambient-normalized temperature ratios to identify bearings trending toward failure, not just absolute temperature.'}
                {inc.detectorType === 'DED' && 'Dragging equipment can foul switches, strike grade crossing equipment, and cause derailments. DED Level 2 requires immediate stop because the equipment is in active contact with the rail or roadbed.'}
                {inc.detectorType === 'TADS' && 'Acoustic bearing defects (spalling, pitting, cracking) detected by TADS/ABD indicate bearing failure is imminent. S-6000 Level-1 criteria are set at the point where failure within the next 500 miles is statistically likely.'}
                {inc.detectorType === 'WIM' && 'Overweight cars cause accelerated track degradation, broken rails, and bridge damage. The 33-ton axle load limit is set by AAR interchange rules based on track structure capacity.'}
                {!['WILD','HBD','DED','TADS','WIM'].includes(inc.detectorType) && 'Wayside detector thresholds are set by AAR standards to identify equipment defects before they progress to failure in service.'}
              </div>
            </div>
          )}

          {/* Layer 3 — Mandatory Action */}
          {activeTab === 'action' && (
            <div className="space-y-4">
              <div className={`p-4 rounded border ${mandatoryAction.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14}/>
                  <span className="text-xs font-bold uppercase tracking-wide">Urgency: {mandatoryAction.urgency}</span>
                </div>
                <p className="text-sm font-semibold leading-relaxed">{mandatoryAction.action}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Detector Type', value: inc.detectorType },
                  { label: 'Status', value: inc.status },
                  { label: 'Incident Status', value: inc.incidentStatus },
                  { label: 'Assigned To', value: inc.assignedTo },
                  { label: 'Defect Flag', value: inc.defectFlagId || 'Not yet raised' },
                  { label: 'Work Order', value: inc.workOrderId || 'Not yet raised' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded border border-border bg-muted/20">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
                    <div className="text-xs font-mono text-foreground font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Layer 4 — Next Steps */}
          {activeTab === 'steps' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-foreground mb-1">Prioritized Action Items</div>
              {nextSteps.map((s, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded border ${
                  s.priority === 'high' ? 'border-red-500/20 bg-red-500/5' :
                  s.priority === 'medium' ? 'border-amber-500/20 bg-amber-500/5' :
                  'border-border bg-muted/10'
                }`}>
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    s.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    s.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-border text-muted-foreground'
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{s.step}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users size={10} className="text-muted-foreground"/>
                      <span className="text-[10px] text-muted-foreground">{s.owner}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        s.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        s.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-border text-muted-foreground'
                      }`}>{s.priority}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

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

// ─── Wayside Incident Row ────────────────────────────────────────────────
function WaysideIncidentRow({ inc, idx, onOpenRca }: { inc: WaysideIncident; idx: number; onOpenRca: (inc: WaysideIncident) => void }) {
  const [, navigate] = useLocation();;
  const detectorColors: Record<string, string> = {
    HBD:  'bg-orange-500/10 text-orange-400 border-orange-500/30',
    WILD: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    DED:  'bg-red-500/10 text-red-400 border-red-500/30',
    AEI:  'bg-blue-500/10 text-blue-400 border-blue-500/30',
    TADS: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    WIM:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };
  return (
    <tr className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
      <td className="px-4 py-3">
        <div className={`w-2 h-2 rounded-full ${inc.status === 'ALARM' ? 'bg-red-500' : 'bg-amber-500'}`}/>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{inc.title}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="mono text-[10px] text-muted-foreground">{inc.id}</span>
          {inc.workOrderId && (
            <span className="text-[10px] text-muted-foreground">· WO: <span className="font-mono text-foreground">{inc.workOrderId}</span></span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 max-w-xs truncate">{inc.reading}</p>
      </td>
      <td className="px-4 py-3">
        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${detectorColors[inc.detectorType] || 'bg-border text-muted-foreground'}`}>
          {inc.detectorType}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-[11px]">Car Defect</td>
      <td className="px-4 py-3 text-muted-foreground text-[11px]">
        {inc.subdivision} · MP {inc.milepost}
        <div className="flex items-center gap-1 mt-0.5">
          <Train size={10} className="text-cn-red"/>
          <span className="mono text-[10px]">{inc.trainId}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${
          inc.incidentStatus === 'investigating' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
        }`}>{inc.incidentStatus}</span>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-[11px] max-w-[120px] truncate">{inc.assignedTo}</td>
      <td className="px-4 py-3 text-right mono">
        {inc.status === 'ALARM'
          ? <span className="text-[11px] text-red-400 font-semibold">Immediate</span>
          : <span className="text-[11px] text-amber-400">Next yard</span>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 justify-center flex-wrap">
          <button
            onClick={() => onOpenRca(inc)}
            className="px-2.5 py-1 rounded text-[10px] font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 flex items-center gap-1 whitespace-nowrap"
          >
            <Gauge size={10}/>Defect Analysis
          </button>
          <button
            onClick={() => navigate(`/cars?car=${encodeURIComponent(inc.carNumber)}`)}
            className="px-2.5 py-1 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 flex items-center gap-1 whitespace-nowrap"
          >
            <Radio size={10}/>View Car
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Incidents() {
  const [selectedRca, setSelectedRca] = useState<{ rca: RootCauseExplanation; title: string } | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<WaysideIncident | null>(null);
  const [activeTab, setActiveTab] = useState<'ot' | 'car'>('ot');

  const openRca = (incId: string, title: string) => {
    const rca = rootCauseExplanations[incId];
    if (rca) setSelectedRca({ rca, title });
  };

  const openCarDefects = waysideIncidents.filter(i => i.incidentStatus !== 'resolved');
  const alarmCount = openCarDefects.filter(i => i.status === 'ALARM').length;
  const alertCount = openCarDefects.filter(i => i.status === 'ALERT').length;

  return (
    <Layout>
      {selectedRca && (
        <RcaModal rca={selectedRca.rca} incidentTitle={selectedRca.title} onClose={() => setSelectedRca(null)}/>
      )}
      {selectedDefect && (
        <DefectRcaModal inc={selectedDefect} onClose={() => setSelectedDefect(null)}/>
      )}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Incidents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">All OT incidents — Dynatrace Davis AI · ServiceNow · Click <span className="text-amber-400">Root Cause</span> for the 5-layer explanation</p>
          </div>
          <div className="text-xs text-muted-foreground">Showing {incidents.length + openCarDefects.length} incidents</div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Open',            count: incidents.filter(i => i.status === 'open').length,           color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30' },
            { label: 'Investigating',   count: incidents.filter(i => i.status === 'investigating').length,  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
            { label: 'Resolved',        count: incidents.filter(i => i.status === 'resolved').length,       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
            { label: 'AI Auto-Resolved',count: incidents.filter(i => i.aiResolved).length,                  color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30' },
            { label: 'Car Defects',     count: openCarDefects.length,                                       color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30' },
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

        {/* Car Defect Alert Banner */}
        {alarmCount > 0 && (
          <div className="flex items-start gap-3 p-3 rounded border border-red-500/30 bg-red-500/5">
            <AlertTriangle size={13} className="text-red-400 mt-0.5 flex-shrink-0"/>
            <div className="text-[11px] text-muted-foreground flex-1">
              <strong className="text-red-400">{alarmCount} Wayside ALARM{alarmCount > 1 ? 's' : ''} Active</strong> — {alertCount > 0 ? `${alertCount} additional ALERT reading${alertCount > 1 ? 's' : ''} also require attention. ` : ''}Detector readings have been automatically converted to incidents. Click <span className="text-blue-400 font-medium">View Car</span> to open the full car history in Car Search.
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('ot')}
            className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
              activeTab === 'ot' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            OT System Incidents ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab('car')}
            className={`px-4 py-2 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'car' ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Car Defect Incidents ({openCarDefects.length})
            {alarmCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{alarmCount}</span>
            )}
          </button>
        </div>

        {/* Incident Table */}
        <div className="bg-card border border-border rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium w-6"/>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Incident</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">System / Detector</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Category</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Location</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Assigned</th>
                <th className="text-right px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">MTTR</th>
                <th className="text-center px-4 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{activeTab === 'ot' ? 'Root Cause' : 'Car Detail'}</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'ot' && incidents.map((inc, idx) => {
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
              {activeTab === 'car' && openCarDefects.map((inc, idx) => (
                <WaysideIncidentRow key={inc.id} inc={inc} idx={idx} onOpenRca={setSelectedDefect} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

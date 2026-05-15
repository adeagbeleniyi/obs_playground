import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import {
  FileText, Download, Search, Calendar, Filter,
  AlertTriangle, Train, Users, Radio, Gauge, TrafficCone,
  ChevronDown, ChevronRight, RefreshCw, X
} from 'lucide-react';
import { incidents as otIncidents } from '@/lib/mockData';
import { waysideIncidents } from '@/lib/waysideIncidents';
import { getAllAlarms } from '@/lib/crossingData';
import { CONSIST_EVENTS } from '@/lib/fleetData';
import { activeCrew } from '@/lib/crewCarData';
import { TRACK_EVENTS } from '@/lib/dispatchData';

// ── Types ──────────────────────────────────────────────────────────────────
type Preset = 'all' | 'today' | 'last7' | 'last30' | 'thisMonth' | 'custom';

interface ModuleConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const MODULES: ModuleConfig[] = [
  { id: 'ot',       label: 'OT System Incidents',  icon: <AlertTriangle size={13}/>, color: 'text-amber-400',  description: 'Dynatrace Davis AI incidents' },
  { id: 'cardef',   label: 'Car Defect Incidents',  icon: <Gauge size={13}/>,        color: 'text-orange-400', description: 'Wayside detector alarms' },
  { id: 'crossing', label: 'Crossing Alarms',       icon: <TrafficCone size={13}/>,  color: 'text-red-400',    description: 'DAU / WSDMM crossing events' },
  { id: 'fleet',    label: 'Fleet Events',           icon: <Train size={13}/>,        color: 'text-sky-400',    description: 'Consist & lifecycle events' },
  { id: 'crew',     label: 'Crew & HOS',             icon: <Users size={13}/>,        color: 'text-violet-400', description: 'Active crew HOS status' },
  { id: 'wayside',  label: 'Wayside Detections',    icon: <Radio size={13}/>,        color: 'text-emerald-400',description: 'Raw detector readings' },
  { id: 'dispatch', label: 'Dispatch Track Events', icon: <TrafficCone size={13}/>,  color: 'text-cyan-400',   description: 'Track authorities & restrictions' },
];

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'all',       label: 'All Time' },
  { key: 'today',     label: 'Today' },
  { key: 'last7',     label: 'Last 7 days' },
  { key: 'last30',    label: 'Last 30 days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'custom',    label: 'Custom' },
];

// ── Date helpers ────────────────────────────────────────────────────────────
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23,59,59,999); return x; }

function getPresetRange(preset: Preset, customStart: string, customEnd: string): [Date|null, Date|null] {
  const now = new Date();
  if (preset === 'today')     return [startOfDay(now), endOfDay(now)];
  if (preset === 'last7')     { const s = new Date(now); s.setDate(s.getDate()-6); return [startOfDay(s), endOfDay(now)]; }
  if (preset === 'last30')    { const s = new Date(now); s.setDate(s.getDate()-29); return [startOfDay(s), endOfDay(now)]; }
  if (preset === 'thisMonth') { const s = new Date(now.getFullYear(), now.getMonth(), 1); return [startOfDay(s), endOfDay(now)]; }
  if (preset === 'custom')    {
    const s = customStart ? startOfDay(new Date(customStart)) : null;
    const e = customEnd   ? endOfDay(new Date(customEnd))     : null;
    return [s, e];
  }
  return [null, null]; // 'all'
}

function inRange(ts: string | undefined, start: Date|null, end: Date|null): boolean {
  if (!start && !end) return true;
  if (!ts) return true;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return true;
  if (start && d < start) return false;
  if (end   && d > end)   return false;
  return true;
}

// ── CSV helpers ─────────────────────────────────────────────────────────────
function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Reports() {
  // Date range
  const [preset, setPreset]           = useState<Preset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');

  // Module selection
  const [selectedModules, setSelectedModules] = useState<Set<string>>(
    new Set(MODULES.map(m => m.id))
  );

  // Keyword search
  const [keyword, setKeyword] = useState('');

  // Expanded module in results
  const [expandedModule, setExpandedModule] = useState<string | null>('ot');

  const [rangeStart, rangeEnd] = useMemo(
    () => getPresetRange(preset, customStart, customEnd),
    [preset, customStart, customEnd]
  );

  const kw = keyword.trim().toLowerCase();

  // ── Filtered datasets ────────────────────────────────────────────────────
  const filteredOT = useMemo(() =>
    otIncidents.filter(i =>
      inRange(i.timestamp, rangeStart, rangeEnd) &&
      (!kw || [i.title, i.system, i.status, i.severity, i.subdivision || ''].join(' ').toLowerCase().includes(kw))
    ), [rangeStart, rangeEnd, kw]);

  // WaysideIncident: carNumber, reportingMark, detectorType, location, subdivision, status, title, description, trainId
  const filteredCarDef = useMemo(() =>
    waysideIncidents.filter(i =>
      inRange(i.timestamp, rangeStart, rangeEnd) &&
      (!kw || [i.carNumber, i.detectorType, i.location, i.subdivision, i.status, i.title, i.description, i.trainId].join(' ').toLowerCase().includes(kw))
    ), [rangeStart, rangeEnd, kw]);

  // CrossingAlarm: alarmId, crossingId, alarmCode, severity, deviceType, description, snowTicketId
  const filteredCrossing = useMemo(() => {
    const alarms = getAllAlarms();
    return alarms.filter(a =>
      inRange(a.timestamp, rangeStart, rangeEnd) &&
      (!kw || [a.alarmId, a.crossingId, a.alarmCode, a.severity, a.deviceType, a.description, a.snowTicketId ?? ''].join(' ').toLowerCase().includes(kw))
    );
  }, [rangeStart, rangeEnd, kw]);

  // ConsistEvent: id, trainId, yard, type, carOrLocoId, carType, foreignRailroad
  const filteredFleet = useMemo(() =>
    CONSIST_EVENTS.filter(e =>
      inRange(e.timestamp, rangeStart, rangeEnd) &&
      (!kw || [e.id, e.trainId, e.yard, e.type, e.carOrLocoId, e.carType ?? '', e.foreignRailroad ?? ''].join(' ').toLowerCase().includes(kw))
    ), [rangeStart, rangeEnd, kw]);

  // ActiveCrew: crewId, trainId, subdivision, hosStatus, members[].name
  const filteredCrew = useMemo(() =>
    activeCrew.filter(c =>
      (!kw || [c.crewId, c.trainId, c.subdivision, c.hosStatus, ...c.members.map(m => m.name)].join(' ').toLowerCase().includes(kw))
    ), [kw]);

  const filteredWayside = useMemo(() =>
    waysideIncidents.filter(i =>
      inRange(i.timestamp, rangeStart, rangeEnd) &&
      (!kw || [i.carNumber, i.detectorType, i.location, i.subdivision, i.status, i.title].join(' ').toLowerCase().includes(kw))
    ), [rangeStart, rangeEnd, kw]);

  // TrackEvent: id, type, subdivision, status, description, issuedAt, expiresAt, affectedTrains, severity
  const filteredDispatch = useMemo(() =>
    TRACK_EVENTS.filter(e =>
      inRange(e.issuedAt, rangeStart, rangeEnd) &&
      (!kw || [e.id, e.type, e.subdivision, e.status, e.description, e.severity, e.affectedTrains.join(' ')].join(' ').toLowerCase().includes(kw))
    ), [rangeStart, rangeEnd, kw]);

  // ── Module result map ────────────────────────────────────────────────────
  const moduleResults: Record<string, { count: number; rows: string[][]; headers: string[] }> = {
    ot: {
      count: filteredOT.length,
      headers: ['ID','Title','System','Severity','Status','Timestamp','AI Resolved','MTTR (min)'],
      rows: filteredOT.map(i => [i.id, i.title, i.system, i.severity, i.status, i.timestamp, i.aiResolved ? 'Yes' : 'No', String(i.mttr ?? '')]),
    },
    cardef: {
      count: filteredCarDef.length,
      headers: ['Car Number','Reporting Mark','Detector','Location','Subdivision','Status','Reading','Title','Train ID','Timestamp'],
      rows: filteredCarDef.map(i => [i.carNumber, i.reportingMark, i.detectorType, i.location, i.subdivision, i.status, i.reading, i.title, i.trainId, i.timestamp]),
    },
    crossing: {
      count: filteredCrossing.length,
      headers: ['Alarm ID','Crossing ID','Alarm Code','Severity','Device','Description','SNOW Ticket','Timestamp'],
      rows: filteredCrossing.map(a => [a.alarmId, a.crossingId, a.alarmCode, a.severity, a.deviceType, a.description, a.snowTicketId ?? '', a.timestamp]),
    },
    fleet: {
      count: filteredFleet.length,
      headers: ['Event ID','Train ID','Yard','Event Type','Car/Loco ID','Car Type','Foreign RR','Air Brake Test','Timestamp'],
      rows: filteredFleet.map(e => [e.id, e.trainId, e.yard, e.type, e.carOrLocoId, e.carType ?? '', e.foreignRailroad ?? '', e.triggeredAirBrakeTest ? 'Yes' : 'No', e.timestamp]),
    },
    crew: {
      count: filteredCrew.length,
      headers: ['Crew ID','Train ID','Subdivision','HOS Status','HOS Remaining (min)','Members','Origin','Destination'],
      rows: filteredCrew.map(c => [c.crewId, c.trainId, c.subdivision, c.hosStatus, String(c.hosRemainingMinutes), c.members.map(m => m.name).join('; '), c.origin, c.destination]),
    },
    wayside: {
      count: filteredWayside.length,
      headers: ['Car Number','Detector Type','Location','Subdivision','Status','Reading','Severity','Timestamp'],
      rows: filteredWayside.map(i => [i.carNumber, i.detectorType, i.location, i.subdivision, i.status, i.reading, i.severity, i.timestamp]),
    },
    dispatch: {
      count: filteredDispatch.length,
      headers: ['Event ID','Type','Subdivision','From MP','To MP','Status','Severity','Description','Issued At','Expires At','Affected Trains'],
      rows: filteredDispatch.map(e => [e.id, e.type, e.subdivision, String(e.fromMp), String(e.toMp), e.status, e.severity, e.description, e.issuedAt, e.expiresAt ?? '', e.affectedTrains.join('; ')]),
    },
  };

  const totalRecords = Object.entries(moduleResults)
    .filter(([id]) => selectedModules.has(id))
    .reduce((s, [, v]) => s + v.count, 0);

  // ── Export helpers ───────────────────────────────────────────────────────
  function exportModule(id: string) {
    const r = moduleResults[id];
    if (!r || r.count === 0) return;
    downloadCsv(`cn-spog-${id}-${new Date().toISOString().slice(0,10)}.csv`, toCsv(r.headers, r.rows));
  }

  function exportAllHTML() {
    const sections = MODULES.filter(m => selectedModules.has(m.id)).map(m => {
      const r = moduleResults[m.id];
      if (r.count === 0) return '';
      const thead = `<tr>${r.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
      const tbody = r.rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
      return `<h2>${m.label} (${r.count} records)</h2><table border="1" cellpadding="4" cellspacing="0">${thead}${tbody}</table><br/>`;
    }).join('');

    const rangeLabel = preset === 'all' ? 'All Time' :
      preset === 'custom' ? `${customStart || '?'} → ${customEnd || 'now'}` :
      PRESETS.find(p => p.key === preset)?.label ?? preset;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>CN Rail OT SPOG Report</title>
<style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}h1{color:#c8102e}h2{color:#333;margin-top:24px}
table{border-collapse:collapse;width:100%;margin-bottom:16px}th{background:#c8102e;color:#fff;padding:6px}
td{padding:4px 6px}tr:nth-child(even){background:#f5f5f5}.meta{color:#666;font-size:11px;margin-bottom:20px}</style>
</head><body>
<h1>CN Rail OT SPOG — Incident Report</h1>
<div class="meta">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Date Range: ${rangeLabel} &nbsp;|&nbsp; Keyword: ${kw || '(none)'} &nbsp;|&nbsp; Total Records: ${totalRecords}</div>
${sections}
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `cn-spog-report-${new Date().toISOString().slice(0,10)}.html`; a.click();
    URL.revokeObjectURL(url);
  }

  function toggleModule(id: string) {
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <Layout>
      <div className="flex h-full min-h-screen bg-background">

        {/* ── Left Panel: Controls ─────────────────────────────────────── */}
        <div className="w-72 shrink-0 border-r border-border bg-card flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-cn-red"/>
              <span className="text-sm font-bold text-foreground">Reports</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Search and export data across all modules</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

            {/* Keyword search */}
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Keyword Search</label>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="Car ID, train, subdivision…"
                  className="w-full pl-7 pr-7 py-1.5 rounded border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-cn-red/50"
                />
                {keyword && (
                  <button onClick={() => setKeyword('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X size={11}/>
                  </button>
                )}
              </div>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                <Calendar size={10} className="inline mr-1"/>Date Range
              </label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PRESETS.map(p => (
                  <button key={p.key} onClick={() => setPreset(p.key)}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium border transition-colors ${
                      preset === p.key
                        ? 'bg-cn-red/20 text-cn-red border-cn-red/40'
                        : 'bg-muted/20 text-muted-foreground border-border hover:bg-muted/40'
                    }`}>{p.label}</button>
                ))}
              </div>
              {preset === 'custom' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Start Date</label>
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-cn-red/50"/>
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">End Date</label>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-cn-red/50"/>
                  </div>
                </div>
              )}
              {rangeStart && (
                <div className="mt-2 p-2 rounded bg-muted/20 border border-border text-[10px] text-muted-foreground font-mono">
                  {rangeStart.toLocaleDateString()} → {rangeEnd ? rangeEnd.toLocaleDateString() : 'now'}
                </div>
              )}
            </div>

            {/* Module selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <Filter size={10} className="inline mr-1"/>Modules
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedModules(new Set(MODULES.map(m => m.id)))}
                    className="text-[9px] text-cn-red hover:underline">All</button>
                  <button onClick={() => setSelectedModules(new Set())}
                    className="text-[9px] text-muted-foreground hover:underline">None</button>
                </div>
              </div>
              <div className="space-y-1">
                {MODULES.map(m => {
                  const r = moduleResults[m.id];
                  const active = selectedModules.has(m.id);
                  return (
                    <button key={m.id} onClick={() => toggleModule(m.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded border text-left transition-colors ${
                        active ? 'bg-muted/20 border-border' : 'bg-transparent border-transparent opacity-50'
                      }`}>
                      <div className={`shrink-0 ${m.color}`}>{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium text-foreground truncate">{m.label}</div>
                        <div className="text-[9px] text-muted-foreground truncate">{m.description}</div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold shrink-0 ${r.count > 0 ? m.color : 'text-muted-foreground'}`}>
                        {r.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom: total + export all */}
          <div className="px-4 py-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Total records in range</span>
              <span className="font-bold font-mono text-foreground">{totalRecords}</span>
            </div>
            <button
              onClick={exportAllHTML}
              disabled={totalRecords === 0}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-semibold bg-cn-red text-white hover:bg-cn-red/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FileText size={12}/>Export Full Report (HTML)
            </button>
          </div>
        </div>

        {/* ── Right Panel: Results ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Summary bar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-foreground">Report Results</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totalRecords} records across {selectedModules.size} module{selectedModules.size !== 1 ? 's' : ''}
                {kw && <> matching <span className="font-mono text-foreground">"{kw}"</span></>}
                {rangeStart && <> · {rangeStart.toLocaleDateString()} → {rangeEnd ? rangeEnd.toLocaleDateString() : 'now'}</>}
              </p>
            </div>
            <button onClick={() => { setKeyword(''); setPreset('all'); setCustomStart(''); setCustomEnd(''); setSelectedModules(new Set(MODULES.map(m => m.id))); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors">
              <RefreshCw size={11}/>Reset
            </button>
          </div>

          {/* Module result cards */}
          {MODULES.filter(m => selectedModules.has(m.id)).map(m => {
            const r = moduleResults[m.id];
            const isOpen = expandedModule === m.id;
            return (
              <div key={m.id} className="bg-card border border-border rounded overflow-hidden">
                {/* Module header */}
                <button
                  onClick={() => setExpandedModule(isOpen ? null : m.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors"
                >
                  <div className={m.color}>{m.icon}</div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold text-foreground">{m.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{m.description}</span>
                  </div>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    r.count > 0 ? 'bg-cn-red/10 text-cn-red' : 'bg-muted/20 text-muted-foreground'
                  }`}>{r.count} records</span>
                  <button
                    onClick={e => { e.stopPropagation(); exportModule(m.id); }}
                    disabled={r.count === 0}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download size={10}/>CSV
                  </button>
                  {isOpen ? <ChevronDown size={14} className="text-muted-foreground shrink-0"/> : <ChevronRight size={14} className="text-muted-foreground shrink-0"/>}
                </button>

                {/* Expanded table */}
                {isOpen && r.count > 0 && (
                  <div className="border-t border-border overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-muted/20">
                          {r.headers.map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap border-b border-border">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {r.rows.slice(0, 50).map((row, ri) => (
                          <tr key={ri} className="border-b border-border/50 hover:bg-muted/10">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3 py-1.5 text-foreground whitespace-nowrap max-w-[200px] truncate">{cell}</td>
                            ))}
                          </tr>
                        ))}
                        {r.rows.length > 50 && (
                          <tr>
                            <td colSpan={r.headers.length} className="px-3 py-2 text-[10px] text-muted-foreground text-center">
                              Showing first 50 of {r.rows.length} records. Export CSV for full dataset.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {isOpen && r.count === 0 && (
                  <div className="border-t border-border px-4 py-6 text-center text-[11px] text-muted-foreground">
                    No records match the current filters.
                  </div>
                )}
              </div>
            );
          })}

          {selectedModules.size === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Filter size={32} className="text-muted-foreground mb-3"/>
              <p className="text-sm font-medium text-foreground">No modules selected</p>
              <p className="text-[11px] text-muted-foreground mt-1">Select at least one module from the left panel to see results.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

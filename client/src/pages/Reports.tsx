import { useState, useMemo, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import {
  FileText, Download, Search, Calendar, Filter,
  AlertTriangle, Train, Users, Radio, Gauge, TrafficCone,
  ChevronDown, ChevronRight, RefreshCw, X, Save, BookOpen,
  Trash2, ChevronLeft, BarChart2, Activity, Clock, TrendingUp,
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
  bgColor: string;
  description: string;
}

interface SavedConfig {
  id: string;
  name: string;
  preset: Preset;
  customStart: string;
  customEnd: string;
  selectedModules: string[];
  keyword: string;
  savedAt: string;
}

const MODULES: ModuleConfig[] = [
  { id: 'ot',       label: 'OT System Incidents',  icon: <AlertTriangle size={13}/>, color: 'text-amber-400',   bgColor: 'bg-amber-400',  description: 'Dynatrace Davis AI incidents' },
  { id: 'cardef',   label: 'Car Defect Incidents',  icon: <Gauge size={13}/>,        color: 'text-orange-400',  bgColor: 'bg-orange-400', description: 'Wayside detector alarms' },
  { id: 'crossing', label: 'Crossing Alarms',       icon: <TrafficCone size={13}/>,  color: 'text-red-400',     bgColor: 'bg-red-400',    description: 'DAU / WSDMM crossing events' },
  { id: 'fleet',    label: 'Fleet Events',           icon: <Train size={13}/>,        color: 'text-sky-400',     bgColor: 'bg-sky-400',    description: 'Consist & lifecycle events' },
  { id: 'crew',     label: 'Crew & HOS',             icon: <Users size={13}/>,        color: 'text-violet-400',  bgColor: 'bg-violet-400', description: 'Active crew HOS status' },
  { id: 'wayside',  label: 'Wayside Detections',    icon: <Radio size={13}/>,        color: 'text-emerald-400', bgColor: 'bg-emerald-400',description: 'Raw detector readings' },
  { id: 'dispatch', label: 'Dispatch Track Events', icon: <TrafficCone size={13}/>,  color: 'text-cyan-400',    bgColor: 'bg-cyan-400',   description: 'Track authorities & restrictions' },
];

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'all',       label: 'All Time' },
  { key: 'today',     label: 'Today' },
  { key: 'last7',     label: 'Last 7 days' },
  { key: 'last30',    label: 'Last 30 days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'custom',    label: 'Custom' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const SAVED_CONFIGS_KEY = 'cn-spog-report-configs';

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
  return [null, null];
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
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Pagination component ─────────────────────────────────────────────────────
function Pagination({ total, page, pageSize, onPage, onPageSize }: {
  total: number; page: number; pageSize: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/10">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          className="bg-background border border-border rounded px-1.5 py-0.5 text-[10px] text-foreground focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="ml-2">{from}–{to} of {total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="p-1 rounded hover:bg-muted/30 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground">
          <ChevronLeft size={12}/>
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="px-1.5 text-[10px] text-muted-foreground">…</span>
            : <button key={p} onClick={() => onPage(p as number)}
                className={`w-6 h-6 rounded text-[10px] font-medium transition-colors ${
                  p === page ? 'bg-cn-red text-white' : 'hover:bg-muted/30 text-muted-foreground'
                }`}>{p}</button>
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          className="p-1 rounded hover:bg-muted/30 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground">
          <ChevronRight size={12}/>
        </button>
      </div>
    </div>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-muted-foreground w-16 truncate shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }}/>
      </div>
      <span className="text-[9px] font-mono text-foreground w-6 text-right shrink-0">{value}</span>
    </div>
  );
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

  // Pagination: per-module page state
  const [pages, setPages]         = useState<Record<string, number>>({});
  const [pageSizes, setPageSizes] = useState<Record<string, number>>({});

  // Saved configurations
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_CONFIGS_KEY) || '[]'); }
    catch { return []; }
  });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName]             = useState('');
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  // Persist saved configs
  useEffect(() => {
    localStorage.setItem(SAVED_CONFIGS_KEY, JSON.stringify(savedConfigs));
  }, [savedConfigs]);

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

  const filteredCarDef = useMemo(() =>
    waysideIncidents.filter(i =>
      inRange(i.timestamp, rangeStart, rangeEnd) &&
      (!kw || [i.carNumber, i.detectorType, i.location, i.subdivision, i.status, i.title, i.description, i.trainId].join(' ').toLowerCase().includes(kw))
    ), [rangeStart, rangeEnd, kw]);

  const filteredCrossing = useMemo(() => {
    const alarms = getAllAlarms();
    return alarms.filter(a =>
      inRange(a.timestamp, rangeStart, rangeEnd) &&
      (!kw || [a.alarmId, a.crossingId, a.alarmCode, a.severity, a.deviceType, a.description, a.snowTicketId ?? ''].join(' ').toLowerCase().includes(kw))
    );
  }, [rangeStart, rangeEnd, kw]);

  const filteredFleet = useMemo(() =>
    CONSIST_EVENTS.filter(e =>
      inRange(e.timestamp, rangeStart, rangeEnd) &&
      (!kw || [e.id, e.trainId, e.yard, e.type, e.carOrLocoId, e.carType ?? '', e.foreignRailroad ?? ''].join(' ').toLowerCase().includes(kw))
    ), [rangeStart, rangeEnd, kw]);

  const filteredCrew = useMemo(() =>
    activeCrew.filter(c =>
      (!kw || [c.crewId, c.trainId, c.subdivision, c.hosStatus, ...c.members.map(m => m.name)].join(' ').toLowerCase().includes(kw))
    ), [kw]);

  const filteredWayside = useMemo(() =>
    waysideIncidents.filter(i =>
      inRange(i.timestamp, rangeStart, rangeEnd) &&
      (!kw || [i.carNumber, i.detectorType, i.location, i.subdivision, i.status, i.title].join(' ').toLowerCase().includes(kw))
    ), [rangeStart, rangeEnd, kw]);

  const filteredDispatch = useMemo(() =>
    TRACK_EVENTS.filter(e =>
      inRange(e.issuedAt, rangeStart, rangeEnd) &&
      (!kw || [e.id, e.type, e.subdivision, e.status, e.description, e.severity, e.affectedTrains.join(' ')].join(' ').toLowerCase().includes(kw))
    ), [rangeStart, rangeEnd, kw]);

  // ── Module result map ────────────────────────────────────────────────────
  const moduleResults: Record<string, { count: number; rows: string[][]; headers: string[] }> = useMemo(() => ({
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
  }), [filteredOT, filteredCarDef, filteredCrossing, filteredFleet, filteredCrew, filteredWayside, filteredDispatch]);

  const totalRecords = useMemo(() =>
    Object.entries(moduleResults)
      .filter(([id]) => selectedModules.has(id))
      .reduce((s, [, v]) => s + v.count, 0),
    [moduleResults, selectedModules]
  );

  // ── Summary statistics for charts ────────────────────────────────────────
  const summaryStats = useMemo(() => {
    const otOpen     = filteredOT.filter(i => i.status === 'open' || i.status === 'investigating').length;
    const otResolved = filteredOT.filter(i => i.status === 'resolved' || i.status === 'auto-resolved').length;
    const otAI       = filteredOT.filter(i => i.aiResolved).length;
    const otCritical = filteredOT.filter(i => i.severity === 'critical').length;

    const carAlarms  = filteredCarDef.filter(i => i.status === 'ALARM').length;
    const carAlerts  = filteredCarDef.filter(i => i.status === 'ALERT').length;

    const hosOk      = filteredCrew.filter(c => c.hosStatus === 'OK').length;
    const hosWarn    = filteredCrew.filter(c => c.hosStatus === 'WARNING').length;
    const hosExp     = filteredCrew.filter(c => c.hosStatus === 'CRITICAL').length;

    const dispActive = filteredDispatch.filter(e => e.status === 'ACTIVE').length;
    const dispCrit   = filteredDispatch.filter(e => e.severity === 'CRITICAL').length;

    // Severity breakdown across OT incidents
    const sevMap: Record<string, number> = {};
    filteredOT.forEach(i => { sevMap[i.severity] = (sevMap[i.severity] || 0) + 1; });

    // Module distribution
    const modDist = MODULES
      .filter(m => selectedModules.has(m.id))
      .map(m => ({ id: m.id, label: m.label, count: moduleResults[m.id].count, color: m.bgColor }))
      .sort((a, b) => b.count - a.count);

    return { otOpen, otResolved, otAI, otCritical, carAlarms, carAlerts, hosOk, hosWarn, hosExp, dispActive, dispCrit, sevMap, modDist };
  }, [filteredOT, filteredCarDef, filteredCrew, filteredDispatch, moduleResults, selectedModules]);

  // ── Pagination helpers ───────────────────────────────────────────────────
  const getPage     = (id: string) => pages[id]     ?? 1;
  const getPageSize = (id: string) => pageSizes[id] ?? 25;

  const setPage     = useCallback((id: string, p: number)    => setPages(prev     => ({ ...prev, [id]: p })), []);
  const setPageSize = useCallback((id: string, s: number)    => setPageSizes(prev => ({ ...prev, [id]: s })), []);

  // Reset pages when filters change
  useEffect(() => { setPages({}); }, [rangeStart, rangeEnd, kw, selectedModules]);

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

  // ── Saved config helpers ─────────────────────────────────────────────────
  function saveConfig() {
    if (!saveName.trim()) return;
    const cfg: SavedConfig = {
      id: Date.now().toString(),
      name: saveName.trim(),
      preset, customStart, customEnd,
      selectedModules: Array.from(selectedModules),
      keyword,
      savedAt: new Date().toISOString(),
    };
    setSavedConfigs(prev => [cfg, ...prev]);
    setSaveName('');
    setSaveDialogOpen(false);
  }

  function loadConfig(cfg: SavedConfig) {
    setPreset(cfg.preset);
    setCustomStart(cfg.customStart);
    setCustomEnd(cfg.customEnd);
    setSelectedModules(new Set(cfg.selectedModules));
    setKeyword(cfg.keyword);
    setShowSavedPanel(false);
  }

  function deleteConfig(id: string) {
    setSavedConfigs(prev => prev.filter(c => c.id !== id));
  }

  function resetAll() {
    setKeyword('');
    setPreset('all');
    setCustomStart('');
    setCustomEnd('');
    setSelectedModules(new Set(MODULES.map(m => m.id)));
  }

  const maxModuleCount = Math.max(...MODULES.map(m => moduleResults[m.id]?.count ?? 0), 1);

  return (
    <Layout>
      <div className="flex h-full min-h-screen bg-background">

        {/* ── Left Panel: Controls ─────────────────────────────────────── */}
        <div className="w-72 shrink-0 border-r border-border bg-card flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-cn-red"/>
                <span className="text-sm font-bold text-foreground">Reports</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSavedPanel(v => !v)}
                  title="Saved configurations"
                  className={`p-1.5 rounded border text-[10px] transition-colors ${showSavedPanel ? 'bg-cn-red/20 border-cn-red/40 text-cn-red' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/20'}`}
                >
                  <BookOpen size={12}/>
                </button>
                <button
                  onClick={() => setSaveDialogOpen(v => !v)}
                  title="Save current configuration"
                  className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                >
                  <Save size={12}/>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Search and export data across all modules</p>
          </div>

          {/* Save dialog */}
          {saveDialogOpen && (
            <div className="px-4 py-3 border-b border-border bg-muted/10 space-y-2">
              <p className="text-[10px] font-semibold text-foreground">Save Configuration</p>
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveConfig()}
                placeholder="Configuration name…"
                autoFocus
                className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-cn-red/50"
              />
              <div className="flex gap-2">
                <button onClick={saveConfig} disabled={!saveName.trim()}
                  className="flex-1 px-2 py-1.5 rounded text-[10px] font-semibold bg-cn-red text-white hover:bg-cn-red/90 disabled:opacity-40 disabled:cursor-not-allowed">
                  Save
                </button>
                <button onClick={() => { setSaveDialogOpen(false); setSaveName(''); }}
                  className="flex-1 px-2 py-1.5 rounded text-[10px] font-medium border border-border text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Saved configs panel */}
          {showSavedPanel && (
            <div className="border-b border-border bg-muted/5">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-foreground">Saved Configurations</span>
                <span className="text-[9px] text-muted-foreground">{savedConfigs.length} saved</span>
              </div>
              {savedConfigs.length === 0 ? (
                <div className="px-4 pb-3 text-[10px] text-muted-foreground">No saved configurations yet.</div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {savedConfigs.map(cfg => (
                    <div key={cfg.id} className="flex items-center gap-2 px-4 py-2 hover:bg-muted/10 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium text-foreground truncate">{cfg.name}</div>
                        <div className="text-[9px] text-muted-foreground">
                          {PRESETS.find(p => p.key === cfg.preset)?.label} · {cfg.selectedModules.length} modules
                        </div>
                      </div>
                      <button onClick={() => loadConfig(cfg)}
                        className="text-[9px] px-2 py-1 rounded bg-cn-red/10 text-cn-red hover:bg-cn-red/20 font-medium shrink-0">
                        Load
                      </button>
                      <button onClick={() => deleteConfig(cfg.id)}
                        className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 shrink-0">
                        <Trash2 size={10}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                  const pct = maxModuleCount > 0 ? (r.count / maxModuleCount) * 100 : 0;
                  return (
                    <button key={m.id} onClick={() => toggleModule(m.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded border text-left transition-colors ${
                        active ? 'bg-muted/20 border-border' : 'bg-transparent border-transparent opacity-40'
                      }`}>
                      <div className={`shrink-0 ${m.color}`}>{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium text-foreground truncate">{m.label}</div>
                        <div className="relative h-1 rounded-full bg-muted/30 mt-1">
                          <div className={`absolute left-0 top-0 h-1 rounded-full ${m.bgColor} opacity-70`} style={{ width: `${pct}%` }}/>
                        </div>
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
            <button onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors">
              <RefreshCw size={11}/>Reset
            </button>
          </div>

          {/* ── Visual Summary Charts ─────────────────────────────────── */}
          {totalRecords > 0 && (
            <div className="grid grid-cols-4 gap-3">

              {/* KPI tiles */}
              <div className="bg-card border border-border rounded p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Activity size={10} className="text-cn-red"/>Total Records
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">{totalRecords}</div>
                <div className="text-[9px] text-muted-foreground">{selectedModules.size} modules active</div>
              </div>

              <div className="bg-card border border-border rounded p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <AlertTriangle size={10} className="text-red-400"/>Open Incidents
                </div>
                <div className="text-2xl font-bold font-mono text-red-400">{summaryStats.otOpen}</div>
                <div className="text-[9px] text-muted-foreground">{summaryStats.otCritical} critical severity</div>
              </div>

              <div className="bg-card border border-border rounded p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Gauge size={10} className="text-orange-400"/>Car Defect Alarms
                </div>
                <div className="text-2xl font-bold font-mono text-orange-400">{summaryStats.carAlarms}</div>
                <div className="text-[9px] text-muted-foreground">{summaryStats.carAlerts} alerts also active</div>
              </div>

              <div className="bg-card border border-border rounded p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <TrendingUp size={10} className="text-emerald-400"/>AI Auto-Resolved
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">{summaryStats.otAI}</div>
                <div className="text-[9px] text-muted-foreground">of {filteredOT.length} OT incidents</div>
              </div>

              {/* Module distribution bar chart */}
              <div className="col-span-2 bg-card border border-border rounded p-3">
                <div className="flex items-center gap-1.5 mb-3 text-[10px] font-semibold text-foreground">
                  <BarChart2 size={11} className="text-cn-red"/>Module Distribution
                </div>
                <div className="space-y-1.5">
                  {summaryStats.modDist.map(m => (
                    <MiniBar key={m.id} label={m.label.split(' ')[0]} value={m.count} max={maxModuleCount} color={m.color}/>
                  ))}
                </div>
              </div>

              {/* OT severity breakdown */}
              <div className="bg-card border border-border rounded p-3">
                <div className="flex items-center gap-1.5 mb-3 text-[10px] font-semibold text-foreground">
                  <AlertTriangle size={11} className="text-amber-400"/>OT Severity
                </div>
                <div className="space-y-1.5">
                  {[
                    { key: 'critical', color: 'bg-red-400',    label: 'Critical' },
                    { key: 'warning',  color: 'bg-amber-400',  label: 'Warning'  },
                    { key: 'info',     color: 'bg-sky-400',    label: 'Info'     },
                  ].map(s => (
                    <MiniBar key={s.key} label={s.label} value={summaryStats.sevMap[s.key] ?? 0} max={filteredOT.length || 1} color={s.color}/>
                  ))}
                  <div className="pt-1 border-t border-border/50 flex justify-between text-[9px] text-muted-foreground">
                    <span>Resolved: <span className="text-emerald-400 font-mono">{summaryStats.otResolved}</span></span>
                    <span>Open: <span className="text-red-400 font-mono">{summaryStats.otOpen}</span></span>
                  </div>
                </div>
              </div>

              {/* Crew HOS status */}
              <div className="bg-card border border-border rounded p-3">
                <div className="flex items-center gap-1.5 mb-3 text-[10px] font-semibold text-foreground">
                  <Clock size={11} className="text-violet-400"/>Crew HOS Status
                </div>
                <div className="space-y-1.5">
                  <MiniBar label="OK" value={summaryStats.hosOk} max={filteredCrew.length || 1} color="bg-emerald-400"/>
                  <MiniBar label="Warning" value={summaryStats.hosWarn} max={filteredCrew.length || 1} color="bg-amber-400"/>
                  <MiniBar label="Expired" value={summaryStats.hosExp} max={filteredCrew.length || 1} color="bg-red-400"/>
                </div>
                <div className="pt-1 mt-1 border-t border-border/50 flex justify-between text-[9px] text-muted-foreground">
                  <span>Dispatch Active: <span className="text-cyan-400 font-mono">{summaryStats.dispActive}</span></span>
                  <span>Crit: <span className="text-red-400 font-mono">{summaryStats.dispCrit}</span></span>
                </div>
              </div>
            </div>
          )}

          {/* Module result cards */}
          {MODULES.filter(m => selectedModules.has(m.id)).map(m => {
            const r = moduleResults[m.id];
            const isOpen  = expandedModule === m.id;
            const pg      = getPage(m.id);
            const pgSize  = getPageSize(m.id);
            const totalPg = r.rows.length;
            const pageRows = r.rows.slice((pg - 1) * pgSize, pg * pgSize);

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
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={e => { e.stopPropagation(); if (r.count > 0) exportModule(m.id); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); if (r.count > 0) exportModule(m.id); } }}
                    aria-disabled={r.count === 0}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors ${r.count === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <Download size={10}/>CSV
                  </span>
                  {isOpen ? <ChevronDown size={14} className="text-muted-foreground shrink-0"/> : <ChevronRight size={14} className="text-muted-foreground shrink-0"/>}
                </button>

                {/* Expanded table with pagination */}
                {isOpen && r.count > 0 && (
                  <>
                    <div className="border-t border-border overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-muted/20">
                            <th className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap border-b border-border w-8">#</th>
                            {r.headers.map(h => (
                              <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap border-b border-border">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pageRows.map((row, ri) => (
                            <tr key={ri} className="border-b border-border/50 hover:bg-muted/10">
                              <td className="px-3 py-1.5 text-muted-foreground font-mono text-[9px]">{(pg - 1) * pgSize + ri + 1}</td>
                              {row.map((cell, ci) => (
                                <td key={ci} className="px-3 py-1.5 text-foreground whitespace-nowrap max-w-[200px] truncate" title={cell}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      total={totalPg}
                      page={pg}
                      pageSize={pgSize}
                      onPage={p => setPage(m.id, p)}
                      onPageSize={s => setPageSize(m.id, s)}
                    />
                  </>
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

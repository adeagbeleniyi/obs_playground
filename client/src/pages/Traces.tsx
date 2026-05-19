import Layout from "@/components/Layout";
import { syntheticTraces, type SyntheticTrace } from "@/lib/mockData";
import { useState, useMemo, useEffect, Fragment } from "react";
import {
  GitBranch, CheckCircle, AlertTriangle, XCircle, Clock, Search,
  Filter, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft,
  ChevronsRight, ArrowUpDown, Radio, Wifi, Server, Cpu, Activity,
  BarChart2, AlertCircle, RefreshCw, Download
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'complete' | 'degraded' | 'failed';
type LatencyFilter = 'all' | 'gt1000' | 'gt2000' | 'gt5000';
type SortField = 'id' | 'locoId' | 'subdivision' | 'status' | 'latencyMs' | 'startTime';
type SortDir = 'asc' | 'desc';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusIcon: Record<string, React.ReactNode> = {
  complete: <CheckCircle size={13} className="text-emerald-400 shrink-0" />,
  degraded: <AlertTriangle size={13} className="text-amber-400 shrink-0" />,
  failed:   <XCircle size={13} className="text-red-400 shrink-0" />,
};

const statusBadge: Record<string, string> = {
  complete: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  degraded: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  failed:   "bg-red-500/15 text-red-400 border-red-500/30",
};

const hopColor: Record<string, string> = {
  ok:     "bg-emerald-500",
  slow:   "bg-amber-500",
  failed: "bg-red-500",
};

const hopBorder: Record<string, string> = {
  ok:     "border-emerald-500 bg-emerald-500/20",
  slow:   "border-amber-500 bg-amber-500/20",
  failed: "border-red-500 bg-red-500/20",
};

const hopText: Record<string, string> = {
  ok:     "text-emerald-400",
  slow:   "text-amber-400",
  failed: "text-red-400",
};

const hopIcon: Record<string, React.ReactNode> = {
  ok:     <CheckCircle size={10} />,
  slow:   <AlertTriangle size={10} />,
  failed: <XCircle size={10} />,
};

const systemIcon: Record<string, React.ReactNode> = {
  'OWL Agent': <Cpu size={11} className="text-sky-400" />,
  'ITCnet':    <Radio size={11} className="text-violet-400" />,
  'COBRA':     <Wifi size={11} className="text-amber-400" />,
  'BOS':       <Server size={11} className="text-emerald-400" />,
};

function signalStrength(dbm?: number): { label: string; color: string } {
  if (dbm === undefined) return { label: '—', color: 'text-muted-foreground' };
  if (dbm >= -70) return { label: 'Strong', color: 'text-emerald-400' };
  if (dbm >= -80) return { label: 'Nominal', color: 'text-sky-400' };
  if (dbm >= -88) return { label: 'Marginal', color: 'text-amber-400' };
  return { label: 'Weak', color: 'text-red-400' };
}

function aiDiagnosis(trace: SyntheticTrace): string {
  if (trace.status === 'complete') return '';
  const failedHop = trace.hops.find(h => h.status === 'failed');
  const slowHop = trace.hops.find(h => h.status === 'slow');
  if (trace.status === 'failed' && failedHop) {
    return `PTC message ${trace.seqNum} was transmitted by ${trace.locoId} but failed at the ${failedHop.name} stage. ${failedHop.detail}. Recommend immediate investigation of ${failedHop.system} on ${trace.subdivision} subdivision. An NSR (No Status Received) flag has been raised in BOS.`;
  }
  if (trace.status === 'degraded' && slowHop) {
    const latSec = (trace.latencyMs / 1000).toFixed(1);
    return `PTC message ${trace.seqNum} was delivered but with ${latSec}s end-to-end latency, exceeding the 2s Trip Optimizer threshold. Bottleneck identified at ${slowHop.name} (${slowHop.site || slowHop.system}): ${slowHop.detail}. Monitor ${slowHop.site || slowHop.system} for continued congestion.`;
  }
  return 'No issues detected.';
}

// ─── Pagination Bar ───────────────────────────────────────────────────────────
function PaginationBar({ total, page, pageSize, onPage, onPageSize }: {
  total: number; page: number; pageSize: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/10">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Rows per page:</span>
        <select value={pageSize} onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          className="bg-card border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none">
          {[10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="ml-2">{from}–{to} of {total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(1)} disabled={page === 1} className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-colors"><ChevronsLeft size={13} /></button>
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft size={13} /></button>
        {pages.map((p, i) => p === '...' ? (
          <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p as number)}
            className={`w-6 h-6 rounded text-xs font-medium transition-colors ${p === page ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{p}</button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-colors"><ChevronRight size={13} /></button>
        <button onClick={() => onPage(totalPages)} disabled={page === totalPages} className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-colors"><ChevronsRight size={13} /></button>
      </div>
    </div>
  );
}

// ─── Latency Waterfall Bar ────────────────────────────────────────────────────
function LatencyWaterfall({ trace }: { trace: SyntheticTrace }) {
  if (trace.status === 'failed' || trace.latencyMs === 0) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-3 rounded bg-red-500/20 border border-red-500/30 flex items-center justify-center">
          <span className="text-[9px] text-red-400 font-medium">NOT DELIVERED</span>
        </div>
      </div>
    );
  }
  const total = trace.latencyMs;
  return (
    <div className="flex items-center gap-0.5 w-full" title={`Total: ${total}ms`}>
      {trace.hops.filter(h => (h.hopDurationMs ?? 0) > 0).map((hop, i) => {
        const pct = Math.max(4, ((hop.hopDurationMs ?? 0) / total) * 100);
        return (
          <div
            key={i}
            className={`h-3 rounded-sm ${hopColor[hop.status]} opacity-80`}
            style={{ width: `${pct}%` }}
            title={`${hop.name}: ${hop.hopDurationMs}ms`}
          />
        );
      })}
      <span className={`text-[10px] font-mono ml-1.5 shrink-0 ${total > 5000 ? 'text-red-400' : total > 2000 ? 'text-amber-400' : 'text-emerald-400'}`}>
        {total}ms
      </span>
    </div>
  );
}

// ─── Expanded Detail Panel ────────────────────────────────────────────────────
function TraceDetailPanel({ trace }: { trace: SyntheticTrace }) {
  const diagnosis = aiDiagnosis(trace);
  const totalMs = trace.latencyMs;

  return (
    <div className="border-t border-border bg-muted/5 px-6 py-4 space-y-4">
      {/* Hop-by-hop waterfall */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Hop-by-Hop Breakdown — {trace.seqNum}
        </p>
        <div className="space-y-2">
          {trace.hops.map((hop, idx) => {
            const pct = totalMs > 0 && (hop.hopDurationMs ?? 0) > 0
              ? Math.max(5, ((hop.hopDurationMs ?? 0) / totalMs) * 100)
              : 0;
            const sig = signalStrength(hop.signalDbm);
            return (
              <div key={idx} className="grid grid-cols-[28px_1fr_80px_80px_80px] gap-2 items-center">
                {/* Step node */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${hopBorder[hop.status]}`}>
                  <span className={`text-[9px] font-bold ${hopText[hop.status]}`}>{idx + 1}</span>
                </div>
                {/* Bar + label */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {systemIcon[hop.system] || <Activity size={11} className="text-muted-foreground" />}
                    <span className="text-xs font-medium text-foreground">{hop.name}</span>
                    <span className="text-[10px] text-muted-foreground">({hop.system})</span>
                    {hop.site && <span className="text-[10px] text-muted-foreground">· {hop.site}</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pct > 0 ? (
                      <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden max-w-[200px]">
                        <div className={`h-full rounded-full ${hopColor[hop.status]}`} style={{ width: `${pct}%` }} />
                      </div>
                    ) : (
                      <div className="flex-1 h-2 bg-red-500/20 rounded-full max-w-[200px]" />
                    )}
                    <span className={`text-[10px] font-mono ${hopText[hop.status]}`}>
                      {hop.hopDurationMs ? `${hop.hopDurationMs}ms` : '—'}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{hop.detail}</p>
                </div>
                {/* Signal */}
                <div className="text-right">
                  {hop.signalDbm !== undefined ? (
                    <>
                      <div className={`text-[10px] font-mono ${sig.color}`}>{hop.signalDbm} dBm</div>
                      <div className={`text-[9px] ${sig.color}`}>{sig.label}</div>
                    </>
                  ) : <span className="text-[10px] text-muted-foreground">—</span>}
                </div>
                {/* Offset */}
                <div className="text-right">
                  <div className={`text-[10px] font-mono ${hopText[hop.status]}`}>
                    {hop.timestampOffset > 0 ? `+${hop.timestampOffset}ms` : idx === 0 ? 'T+0' : '—'}
                  </div>
                  <div className="text-[9px] text-muted-foreground">from start</div>
                </div>
                {/* Status */}
                <div className="text-right">
                  <span className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded border ${
                    hop.status === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    hop.status === 'slow' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {hopIcon[hop.status]}
                    {hop.status.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Diagnosis */}
      {diagnosis && (
        <div className={`p-3 rounded border text-xs ${
          trace.status === 'failed'
            ? 'border-red-500/20 bg-red-500/5 text-red-300'
            : 'border-amber-500/20 bg-amber-500/5 text-amber-300'
        }`}>
          <div className="flex items-start gap-2">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">AI Diagnosis: </span>
              {diagnosis}
            </div>
          </div>
        </div>
      )}

      {/* Summary row */}
      <div className="flex items-center gap-6 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
        <span>Trace ID: <span className="font-mono text-foreground">{trace.id}</span></span>
        <span>Sequence: <span className="font-mono text-foreground">{trace.seqNum}</span></span>
        <span>Start: <span className="font-mono text-foreground">{trace.startTime}</span></span>
        {trace.latencyMs > 0 && (
          <span>Total Latency: <span className={`font-mono font-semibold ${trace.latencyMs > 5000 ? 'text-red-400' : trace.latencyMs > 2000 ? 'text-amber-400' : 'text-emerald-400'}`}>{trace.latencyMs}ms</span></span>
        )}
      </div>
    </div>
  );
}

// ─── Sort Icon ────────────────────────────────────────────────────────────────
function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown size={10} className="text-muted-foreground/40" />;
  return sortDir === 'asc'
    ? <ChevronDown size={10} className="text-foreground" />
    : <ChevronDown size={10} className="text-foreground rotate-180" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Traces() {
  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [subdivisionFilter, setSubdivisionFilter] = useState('all');
  const [latencyFilter, setLatencyFilter] = useState<LatencyFilter>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, statusFilter, subdivisionFilter, latencyFilter, sortField, sortDir]);

  // Derived values
  const subdivisions = useMemo(() =>
    ['all', ...Array.from(new Set(syntheticTraces.map(t => t.subdivision))).sort()],
    []
  );

  const filtered = useMemo(() => {
    let data = [...syntheticTraces];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(t =>
        t.locoId.toLowerCase().includes(q) ||
        t.seqNum.toLowerCase().includes(q) ||
        t.subdivision.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.hops.some(h => h.site?.toLowerCase().includes(q) || h.detail.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') data = data.filter(t => t.status === statusFilter);
    if (subdivisionFilter !== 'all') data = data.filter(t => t.subdivision === subdivisionFilter);

    if (latencyFilter === 'gt1000') data = data.filter(t => t.latencyMs > 1000);
    else if (latencyFilter === 'gt2000') data = data.filter(t => t.latencyMs > 2000);
    else if (latencyFilter === 'gt5000') data = data.filter(t => t.latencyMs > 5000);

    data.sort((a, b) => {
      let av: string | number = '', bv: string | number = '';
      if (sortField === 'id')          { av = a.id;          bv = b.id; }
      if (sortField === 'locoId')      { av = a.locoId;      bv = b.locoId; }
      if (sortField === 'subdivision') { av = a.subdivision; bv = b.subdivision; }
      if (sortField === 'status')      { av = a.status;      bv = b.status; }
      if (sortField === 'latencyMs')   { av = a.latencyMs;   bv = b.latencyMs; }
      if (sortField === 'startTime')   { av = a.startTime;   bv = b.startTime; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [search, statusFilter, subdivisionFilter, latencyFilter, sortField, sortDir]);

  const paged = useMemo(() =>
    filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  // KPI calculations (from full dataset)
  const kpis = useMemo(() => {
    const total = syntheticTraces.length;
    const failed = syntheticTraces.filter(t => t.status === 'failed').length;
    const degraded = syntheticTraces.filter(t => t.status === 'degraded').length;
    const complete = syntheticTraces.filter(t => t.status === 'complete').length;
    const delivered = syntheticTraces.filter(t => t.latencyMs > 0);
    const avgLatency = delivered.length
      ? Math.round(delivered.reduce((s, t) => s + t.latencyMs, 0) / delivered.length)
      : 0;
    const sorted = [...delivered].sort((a, b) => a.latencyMs - b.latencyMs);
    const p95idx = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95idx]?.latencyMs ?? 0;
    const deliveryRate = total > 0 ? ((complete + degraded) / total * 100).toFixed(1) : '0.0';
    return { total, failed, degraded, complete, avgLatency, p95, deliveryRate };
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSubdivisionFilter('all');
    setLatencyFilter('all');
  };

  const hasFilters = search || statusFilter !== 'all' || subdivisionFilter !== 'all' || latencyFilter !== 'all';

  return (
    <Layout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Synthetic PTC Traces
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              End-to-end EMP message delivery tracing — Locomotive → 220MHz → COBRA → BOS
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <RefreshCw size={10} />Last updated: just now
            </span>
          </div>
        </div>

        {/* ETC vs PTC Terminology Legend */}
        <div className="flex flex-wrap gap-3 px-4 py-2.5 rounded border border-slate-700/50 bg-slate-800/40 text-[11px]">
          <span className="font-semibold text-slate-400 self-center">Terminology:</span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-900/30 border border-cyan-700/40 text-cyan-300">
            <span className="text-base">🇨🇦</span>
            <span><span className="font-bold">ETC</span> (Electronic Train Control) — used on <span className="font-semibold">CN Canada</span> subdivisions</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-900/30 border border-amber-700/40 text-amber-300">
            <span className="text-base">🇺🇸</span>
            <span><span className="font-bold">PTC</span> (Positive Train Control) — used on <span className="font-semibold">US (CSXT / interop)</span> subdivisions</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-700/30 border border-slate-600/40 text-slate-400">
            Both use the same <span className="font-mono font-bold text-slate-300">EMP</span> message protocol
          </span>
        </div>

        {/* How it works banner */}
        <div className="bg-sky-500/5 border border-sky-500/20 rounded p-3">
          <div className="flex items-start gap-2">
            <GitBranch size={13} className="text-sky-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-sky-300 leading-relaxed">
              <span className="font-semibold">How Synthetic Tracing Works: </span>
              Since PTC hardware cannot carry native OTel trace IDs, CN correlates messages using the PTC sequence number embedded in every I-ETMS packet. Dynatrace stitches the journey across OWL logs, ITCnet routing logs, and BOS acknowledgement logs to reconstruct the full trace — proving delivery and measuring latency at every hop.
            </p>
          </div>
        </div>

        {/* KPI Bar */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Total Traces',    value: kpis.total,          color: 'text-foreground',    bg: 'bg-card border-border',                    icon: <BarChart2 size={14} className="text-muted-foreground" /> },
            { label: 'Complete',        value: kpis.complete,        color: 'text-emerald-400',   bg: 'bg-emerald-500/5 border-emerald-500/20',   icon: <CheckCircle size={14} className="text-emerald-400" /> },
            { label: 'Degraded',        value: kpis.degraded,        color: 'text-amber-400',     bg: 'bg-amber-500/5 border-amber-500/20',       icon: <AlertTriangle size={14} className="text-amber-400" /> },
            { label: 'Failed',          value: kpis.failed,          color: 'text-red-400',       bg: 'bg-red-500/5 border-red-500/20',           icon: <XCircle size={14} className="text-red-400" /> },
            { label: 'Avg Latency',     value: `${kpis.avgLatency}ms`, color: kpis.avgLatency > 2000 ? 'text-amber-400' : 'text-sky-400', bg: 'bg-sky-500/5 border-sky-500/20', icon: <Clock size={14} className="text-sky-400" /> },
            { label: 'Delivery Rate',   value: `${kpis.deliveryRate}%`, color: Number(kpis.deliveryRate) >= 90 ? 'text-emerald-400' : 'text-amber-400', bg: 'bg-card border-border', icon: <Activity size={14} className="text-emerald-400" /> },
          ].map(k => (
            <div key={k.label} className={`rounded border p-3 ${k.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{k.label}</div>
                {k.icon}
              </div>
              <div className={`text-2xl font-bold font-mono ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap p-3 rounded border border-border bg-card">
          <Filter size={12} className="text-muted-foreground shrink-0" />

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search loco ID, seq #, subdivision, site…"
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-muted border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
            />
          </div>

          {/* Status */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="text-xs bg-muted border border-border rounded px-2 py-1.5 text-foreground focus:outline-none">
            <option value="all">All Statuses</option>
            <option value="complete">Complete</option>
            <option value="degraded">Degraded</option>
            <option value="failed">Failed</option>
          </select>

          {/* Subdivision */}
          <select value={subdivisionFilter} onChange={e => setSubdivisionFilter(e.target.value)}
            className="text-xs bg-muted border border-border rounded px-2 py-1.5 text-foreground focus:outline-none">
            {subdivisions.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Subdivisions' : s}</option>
            ))}
          </select>

          {/* Latency threshold */}
          <select value={latencyFilter} onChange={e => setLatencyFilter(e.target.value as LatencyFilter)}
            className="text-xs bg-muted border border-border rounded px-2 py-1.5 text-foreground focus:outline-none">
            <option value="all">Any Latency</option>
            <option value="gt1000">&gt; 1,000ms</option>
            <option value="gt2000">&gt; 2,000ms</option>
            <option value="gt5000">&gt; 5,000ms</option>
          </select>

          {/* Result count + clear */}
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
            {filtered.length} of {syntheticTraces.length} traces
          </span>
          {hasFilters && (
            <button onClick={clearFilters}
              className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors shrink-0">
              Clear
            </button>
          )}
        </div>

        {/* Trace Table */}
        <div className="bg-card border border-border rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-8 px-3 py-2.5" />
                <th className="text-left px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort('id')}>
                  <div className="flex items-center gap-1">Trace ID <SortIcon field="id" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort('locoId')}>
                  <div className="flex items-center gap-1">Locomotive <SortIcon field="locoId" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort('subdivision')}>
                  <div className="flex items-center gap-1">Subdivision <SortIcon field="subdivision" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort('status')}>
                  <div className="flex items-center gap-1">Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium" style={{ minWidth: 200 }}>
                  Latency Waterfall
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  EMP Message
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  ETC Phase
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] text-muted-foreground uppercase tracking-widest font-medium cursor-pointer select-none hover:text-foreground"
                  onClick={() => toggleSort('startTime')}>
                  <div className="flex items-center gap-1 justify-end">Time <SortIcon field="startTime" sortField={sortField} sortDir={sortDir} /></div>
                </th>
                <th className="w-8 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {paged.map((trace, idx) => {
                const isExpanded = expandedId === trace.id;
                const rowNum = (page - 1) * pageSize + idx;
                return (
                  <Fragment key={trace.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : trace.id)}
                      className={`group border-b border-border/50 cursor-pointer transition-colors
                        ${rowNum % 2 === 0 ? '' : 'bg-muted/5'}
                        ${isExpanded ? 'bg-muted/15 border-b-0' : 'hover:bg-muted/10'}
                        ${trace.status === 'failed' ? 'hover:bg-red-500/5' : trace.status === 'degraded' ? 'hover:bg-amber-500/5' : ''}`}
                      title="Click to expand trace details"
                    >
                      {/* Status dot */}
                      <td className="px-3 py-3">
                        <div className={`w-2 h-2 rounded-full ${
                          trace.status === 'complete' ? 'bg-emerald-500' :
                          trace.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                      </td>
                      {/* Trace ID */}
                      <td className="px-3 py-3">
                        <span className="font-mono text-[11px] text-muted-foreground">{trace.id}</span>
                      </td>
                      {/* Loco */}
                      <td className="px-3 py-3">
                        <span className="font-semibold text-foreground">{trace.locoId}</span>
                      </td>
                      {/* Subdivision */}
                      <td className="px-3 py-3">
                        <span className="text-muted-foreground">{trace.subdivision}</span>
                      </td>
                      {/* Status badge */}
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium ${statusBadge[trace.status]}`}>
                          {statusIcon[trace.status]}
                          {trace.status.toUpperCase()}
                        </span>
                      </td>
                      {/* Waterfall */}
                      <td className="px-3 py-3" style={{ minWidth: 200 }}>
                        <LatencyWaterfall trace={trace} />
                      </td>
                      {/* EMP Message */}
                      <td className="px-3 py-3">
                        {trace.empMessageType ? (
                          <span className="font-mono text-[10px] text-sky-300 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded" title={trace.seqNum}>
                            {trace.empMessageType.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-muted-foreground">{trace.seqNum}</span>
                        )}
                      </td>
                      {/* ETC Phase */}
                      <td className="px-3 py-3">
                        {trace.etcPhase ? (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                            trace.etcPhase === 'AUTHORITY'      ? 'bg-violet-500/10 text-violet-300 border-violet-500/20' :
                            trace.etcPhase === 'POLLING'        ? 'bg-sky-500/10 text-sky-300 border-sky-500/20' :
                            trace.etcPhase === 'CREW_AUTH'      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                            trace.etcPhase === 'CONSIST'        ? 'bg-teal-500/10 text-teal-300 border-teal-500/20' :
                            trace.etcPhase === 'SW_VALIDATION'  ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                            trace.etcPhase === 'DEPARTURE_TEST' ? 'bg-orange-500/10 text-orange-300 border-orange-500/20' :
                            'bg-muted/20 text-muted-foreground border-border'
                          }`}>
                            {trace.etcPhase.replace(/_/g, ' ')}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      {/* Time */}
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end text-muted-foreground">
                          <Clock size={10} />
                          <span className="font-mono text-[11px]">{trace.startTime}</span>
                        </div>
                      </td>
                      {/* Expand chevron */}
                      <td className="px-3 py-3">
                        <ChevronRight size={13} className={`text-muted-foreground group-hover:text-foreground transition-all ${isExpanded ? 'rotate-90' : ''}`} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-border/50">
                        <td colSpan={11} className="p-0">
                          <TraceDetailPanel trace={trace} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-muted-foreground text-xs">
                    No traces match the current filters.
                    {hasFilters && (
                      <button onClick={clearFilters} className="ml-2 underline hover:text-foreground">Clear filters</button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PaginationBar
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </div>

        {/* Waterfall legend */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="font-medium">Waterfall legend:</span>
          {[
            { color: 'bg-emerald-500', label: 'OK hop' },
            { color: 'bg-amber-500', label: 'Slow hop' },
            { color: 'bg-red-500', label: 'Failed hop' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${l.color}`} />
              <span>{l.label}</span>
            </div>
          ))}
          <span className="ml-2">· Bar width proportional to hop duration · Click any row to expand</span>
        </div>
      </div>
    </Layout>
  );
}

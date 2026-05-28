import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { assets } from "@/lib/mockData";
import type { Asset, WIUHazardDetector, WIUSignal, WIUSwitch } from "@/lib/mockData";
import {
  Radio, MapPin, AlertTriangle, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronRight, Search, RefreshCw, Maximize2,
  Navigation, Activity, Zap, GitBranch, Filter
} from "lucide-react";

// ─── Filter tag definitions (matching Screen 4) ───────────────────────────────
const FILTER_TAGS = [
  { key: 'Critical',       label: 'Critical',        color: 'border-red-500/40 bg-red-500/10 text-red-400',     activeColor: 'border-red-500 bg-red-500/20 text-red-300' },
  { key: 'Medium',         label: 'Medium',          color: 'border-amber-500/40 bg-amber-500/10 text-amber-400', activeColor: 'border-amber-500 bg-amber-500/20 text-amber-300' },
  { key: 'Stale WIUs',     label: 'Stale WIUs',      color: 'border-orange-500/40 bg-orange-500/10 text-orange-400', activeColor: 'border-orange-500 bg-orange-500/20 text-orange-300' },
  { key: 'PTC Issue',      label: 'PTC Issue',       color: 'border-sky-500/40 bg-sky-500/10 text-sky-400',     activeColor: 'border-sky-500 bg-sky-500/20 text-sky-300' },
  { key: 'Dyn. Sub.',      label: 'Dyn. Sub.',       color: 'border-purple-500/40 bg-purple-500/10 text-purple-400', activeColor: 'border-purple-500 bg-purple-500/20 text-purple-300' },
  { key: 'Direct Connect', label: 'Direct Connect',  color: 'border-teal-500/40 bg-teal-500/10 text-teal-400',  activeColor: 'border-teal-500 bg-teal-500/20 text-teal-300' },
  { key: 'Foreign RR WIU', label: 'Foreign RR WIU',  color: 'border-slate-500/40 bg-slate-500/10 text-slate-400', activeColor: 'border-slate-500 bg-slate-500/20 text-slate-300' },
  { key: 'Power Off',      label: 'Power Off',       color: 'border-red-500/40 bg-red-500/10 text-red-400',     activeColor: 'border-red-500 bg-red-500/20 text-red-300' },
  { key: 'Light Out',      label: 'Light Out',       color: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400', activeColor: 'border-yellow-500 bg-yellow-500/20 text-yellow-300' },
  { key: 'HMAC Failure',   label: 'HMAC Failure',    color: 'border-pink-500/40 bg-pink-500/10 text-pink-400',  activeColor: 'border-pink-500 bg-pink-500/20 text-pink-300' },
  { key: 'CTC Alarm',      label: 'CTC Alarm',       color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400', activeColor: 'border-indigo-500 bg-indigo-500/20 text-indigo-300' },
];

// ─── Signal aspect dots ────────────────────────────────────────────────────────
function SignalAspects({ aspects }: { aspects: ('red' | 'yellow' | 'green' | 'dark')[] }) {
  const color: Record<string, string> = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-400',
    green: 'bg-emerald-500',
    dark: 'bg-slate-700 border border-slate-600',
  };
  return (
    <div className="flex gap-0.5 items-center">
      {aspects.map((a, i) => <span key={i} className={`w-2.5 h-2.5 rounded-full ${color[a]}`} />)}
    </div>
  );
}

// ─── Thinline Track Diagram (SVG) ─────────────────────────────────────────────
function ThinlineDiagram({ asset }: { asset: Asset }) {
  // Simplified SVG track diagram inspired by the real thinline view
  const switches = asset.switches ?? [];
  const signals = asset.signals ?? [];
  const hazards = asset.hazardDetectors ?? [];

  return (
    <div className="bg-background border border-border rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Thinline View</span>
          <h3 className="text-[13px] font-bold text-foreground mt-0.5">{asset.subdivision.toUpperCase()} / {asset.name.replace('WIU ', '')}</h3>
        </div>
        <div className="flex items-center gap-2">
          {asset.wuiId && <span className="text-[9px] px-1.5 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-400">{asset.wuiId}</span>}
          {asset.wmsStatus && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${asset.wmsStatus === 'OK' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>WMS</span>}
          {asset.wrStatus && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${asset.wrStatus === 'OK' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>WR</span>}
          {asset.wdcId && <span className="text-[9px] px-1.5 py-0.5 rounded border border-slate-500/30 bg-slate-500/10 text-slate-400">{asset.wdcId}</span>}
        </div>
      </div>

      {/* SVG Track Diagram */}
      <div className="relative bg-muted/5 rounded border border-border/50 overflow-hidden" style={{ minHeight: 180 }}>
        <svg width="100%" height="180" viewBox="0 0 700 180" preserveAspectRatio="xMidYMid meet">
          {/* Main track line */}
          <line x1="40" y1="100" x2="660" y2="100" stroke="#334155" strokeWidth="3" />

          {/* Siding / diverging track (if switches exist) */}
          {switches.length > 0 && (
            <>
              <line x1="200" y1="100" x2="350" y2="55" stroke="#334155" strokeWidth="3" />
              <line x1="350" y1="55" x2="500" y2="55" stroke="#334155" strokeWidth="3" />
              <line x1="500" y1="55" x2="580" y2="100" stroke="#334155" strokeWidth="3" />
            </>
          )}

          {/* Switch markers */}
          {switches.slice(0, 4).map((sw, i) => {
            const x = 200 + i * 120;
            const isNormal = sw.position === 'N';
            return (
              <g key={sw.name}>
                <rect x={x - 8} y="93" width="16" height="14" rx="2"
                  fill={isNormal ? '#10b981' : sw.position === 'R' ? '#f59e0b' : '#64748b'}
                  opacity="0.9"
                />
                <text x={x} y="104" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">{sw.position}</text>
                <text x={x} y="125" textAnchor="middle" fontSize="7" fill="#94a3b8">{sw.name.replace(' SWITCH', '')}</text>
              </g>
            );
          })}

          {/* Signal markers */}
          {signals.slice(0, 4).map((sig, i) => {
            const x = 120 + i * 140;
            const topAspect = sig.aspects[0];
            const midAspect = sig.aspects[1];
            const botAspect = sig.aspects[2];
            const aspectColor = (a: string) => a === 'red' ? '#ef4444' : a === 'yellow' ? '#eab308' : a === 'green' ? '#10b981' : '#1e293b';
            return (
              <g key={sig.name}>
                {/* Signal mast */}
                <line x1={x} y1="75" x2={x} y2="97" stroke="#475569" strokeWidth="1.5" />
                {/* Signal head */}
                <rect x={x - 7} y="62" width="14" height="30" rx="3" fill="#1e293b" stroke="#334155" />
                <circle cx={x} cy="68" r="3.5" fill={aspectColor(topAspect)} />
                <circle cx={x} cy="77" r="3.5" fill={aspectColor(midAspect)} />
                <circle cx={x} cy="86" r="3.5" fill={aspectColor(botAspect)} />
                <text x={x} y="55" textAnchor="middle" fontSize="7" fill="#94a3b8">{sig.name.replace(' SIGNAL', '')}</text>
                <text x={x + 9} y="68" fontSize="7" fill="#64748b">/{sig.id}</text>
              </g>
            );
          })}

          {/* Hazard detector markers */}
          {hazards.slice(0, 5).map((hd, i) => {
            const x = 80 + i * 120;
            const isActive = hd.status === 'active';
            const isFault = hd.status === 'fault';
            return (
              <g key={hd.name}>
                <line x1={x} y1="100" x2={x} y2="118" stroke="#475569" strokeWidth="1.5" />
                <rect x={x - 10} y="118" width="20" height="12" rx="2"
                  fill={isActive ? '#0ea5e9' : isFault ? '#ef4444' : '#1e293b'}
                  stroke={isActive ? '#38bdf8' : isFault ? '#f87171' : '#334155'}
                />
                <text x={x} y="127" textAnchor="middle" fontSize="6" fill={isActive ? 'white' : isFault ? 'white' : '#64748b'}>
                  {hd.name.replace(' TRACK', '').replace(' SWITCH', '').replace(' OUT', '').replace(' OFF', '')}
                </text>
              </g>
            );
          })}

          {/* Milepost labels */}
          <text x="40" y="145" fontSize="8" fill="#475569">MP {asset.milepost}</text>
          <text x="620" y="145" fontSize="8" fill="#475569" textAnchor="end">→</text>

          {/* Direction arrows */}
          <text x="660" y="98" fontSize="10" fill="#334155">→</text>
          <text x="30" y="98" fontSize="10" fill="#334155">←</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 flex-wrap">
        <div className="flex items-center gap-1"><span className="w-3 h-1 bg-emerald-500 rounded" /><span className="text-[9px] text-muted-foreground">Switch N</span></div>
        <div className="flex items-center gap-1"><span className="w-3 h-1 bg-amber-500 rounded" /><span className="text-[9px] text-muted-foreground">Switch R</span></div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-[9px] text-muted-foreground">Signal Red</span></div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><span className="text-[9px] text-muted-foreground">Signal Yellow</span></div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /><span className="text-[9px] text-muted-foreground">Hazard Active</span></div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-[9px] text-muted-foreground">Hazard Fault</span></div>
      </div>
    </div>
  );
}

// ─── WIU Expanded Detail Panel ─────────────────────────────────────────────────
function WIUDetailPanel({ asset }: { asset: Asset }) {
  const [view, setView] = useState<'panels' | 'thinline'>('panels');

  return (
    <div className="border-t border-border">
      {/* View switcher */}
      <div className="flex items-center gap-0 border-b border-border bg-muted/5">
        <button
          onClick={() => setView('panels')}
          className={`px-4 py-2 text-[11px] font-medium border-b-2 transition-colors ${view === 'panels' ? 'border-sky-500 text-sky-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Equipment Status
        </button>
        <button
          onClick={() => setView('thinline')}
          className={`px-4 py-2 text-[11px] font-medium border-b-2 transition-colors ${view === 'thinline' ? 'border-sky-500 text-sky-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Thinline View
        </button>
      </div>

      {view === 'thinline' ? (
        <div className="p-4">
          <ThinlineDiagram asset={asset} />
        </div>
      ) : (
        <div className="p-4 bg-muted/5">
          <div className="grid grid-cols-3 gap-6">
            {/* Hazard Detectors */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Activity size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Hazard Detectors</span>
              </div>
              <div className="space-y-1.5">
                {(asset.hazardDetectors ?? []).map(d => (
                  <div key={d.name} className="flex items-center justify-between text-[11px] py-0.5 border-b border-border/30">
                    <span className="text-foreground/80">{d.name}</span>
                    <span className={`flex items-center gap-1 ${
                      d.status === 'active' ? 'text-sky-400' :
                      d.status === 'fault' ? 'text-red-400' :
                      d.status === 'unknown' ? 'text-slate-500' :
                      'text-muted-foreground'
                    }`}>
                      {d.status === 'active' && <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_4px_#38bdf8]" />}
                      {d.status === 'fault' && <XCircle size={10} />}
                      {d.status === 'ok' && <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />}
                      {d.status === 'unknown' && <span className="text-[9px]">?</span>}
                      <span className="text-[9px] uppercase">{d.status}</span>
                    </span>
                  </div>
                ))}
                {(asset.hazardDetectors ?? []).length === 0 && (
                  <span className="text-[11px] text-muted-foreground">No hazard detectors</span>
                )}
              </div>
            </div>

            {/* Signals */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Zap size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Signals</span>
              </div>
              <div className="space-y-2">
                {(asset.signals ?? []).map(s => (
                  <div key={s.name} className="flex items-center justify-between text-[11px] py-0.5 border-b border-border/30">
                    <span className="text-foreground/80">{s.name} / {s.id}</span>
                    <div className="flex items-center gap-2">
                      <SignalAspects aspects={s.aspects} />
                      {s.count !== undefined && (
                        <span className="text-[10px] text-muted-foreground w-5 text-right font-mono">{s.count}</span>
                      )}
                    </div>
                  </div>
                ))}
                {(asset.signals ?? []).length === 0 && (
                  <span className="text-[11px] text-muted-foreground">No signals</span>
                )}
              </div>
            </div>

            {/* Switches */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <GitBranch size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Switches</span>
              </div>
              <div className="space-y-1.5">
                {(asset.switches ?? []).map(sw => (
                  <div key={sw.name} className="flex items-center justify-between text-[11px] py-0.5 border-b border-border/30">
                    <span className="text-foreground/80">{sw.name} / {sw.id}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      sw.position === 'N' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                      sw.position === 'R' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                      'border-slate-500/30 bg-slate-500/10 text-slate-400'
                    }`}>
                      {sw.position}
                    </span>
                  </div>
                ))}
                {(asset.switches ?? []).length === 0 && (
                  <span className="text-[11px] text-muted-foreground">No switch status</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WIU Row ───────────────────────────────────────────────────────────────────
function WIURow({ asset, expanded, onToggle }: { asset: Asset; expanded: boolean; onToggle: () => void }) {
  const criticalCount = (asset.hazardDetectors ?? []).filter(d => d.status === 'fault').length;
  const mediumCount = (asset.hazardDetectors ?? []).filter(d => d.status === 'active').length;

  return (
    <>
      <div
        className={`flex items-center gap-3 px-4 py-3 border-b border-border/40 cursor-pointer hover:bg-muted/10 transition-colors ${expanded ? 'bg-muted/10' : ''}`}
        onClick={onToggle}
      >
        {/* Expand */}
        <div className="shrink-0">
          {expanded ? <ChevronDown size={12} className="text-muted-foreground" /> : <ChevronRight size={12} className="text-muted-foreground" />}
        </div>

        {/* Milepost + Name */}
        <div className="w-48 shrink-0">
          <div className="text-[10px] text-muted-foreground font-mono">{asset.milepost ? `${asset.milepost}` : '—'}</div>
          <div className="text-[12px] font-semibold text-foreground truncate">{asset.name}</div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1.5 flex-wrap w-40 shrink-0">
          {asset.wuiId && <span className="text-[9px] px-1 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-400">{asset.wuiId}</span>}
          {asset.wmsStatus && <span className={`text-[9px] px-1 py-0.5 rounded border ${asset.wmsStatus === 'OK' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>WMS</span>}
          {asset.wrStatus && <span className={`text-[9px] px-1 py-0.5 rounded border ${asset.wrStatus === 'OK' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>WR</span>}
          {asset.wdcId && <span className="text-[9px] px-1 py-0.5 rounded border border-slate-500/30 bg-slate-500/10 text-slate-400">{asset.wdcId}</span>}
        </div>

        {/* Subdivision */}
        <div className="text-[11px] text-muted-foreground w-28 shrink-0">{asset.subdivision}</div>

        {/* Alarm counts */}
        <div className="flex items-center gap-2 w-24 shrink-0">
          {criticalCount > 0 && <span className="flex items-center gap-0.5 text-[10px] text-red-400"><XCircle size={9} />{criticalCount}</span>}
          {mediumCount > 0 && <span className="flex items-center gap-0.5 text-[10px] text-amber-400"><AlertTriangle size={9} />{mediumCount}</span>}
          {criticalCount === 0 && mediumCount === 0 && <span className="text-[10px] text-emerald-400 flex items-center gap-0.5"><CheckCircle size={9} />OK</span>}
        </div>

        {/* Filter tags */}
        <div className="flex items-center gap-1 flex-wrap flex-1">
          {(asset.filterTags ?? []).map(tag => {
            const def = FILTER_TAGS.find(f => f.key === tag);
            return (
              <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded border ${def?.color ?? 'border-border text-muted-foreground'}`}>{tag}</span>
            );
          })}
        </div>

        {/* Last HB */}
        <div className="text-[10px] text-muted-foreground w-20 text-right shrink-0 flex items-center gap-1 justify-end">
          <Clock size={9} />{asset.lastSeen}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button className="p-1 rounded hover:bg-muted/20 text-muted-foreground hover:text-foreground" title="Refresh"><RefreshCw size={11} /></button>
          <button className="p-1 rounded hover:bg-muted/20 text-muted-foreground hover:text-foreground" title="Expand"><Maximize2 size={11} /></button>
          <button className="p-1 rounded hover:bg-muted/20 text-muted-foreground hover:text-foreground" title="Location"><Navigation size={11} /></button>
        </div>
      </div>

      {expanded && (
        <div className="border-b border-border">
          <WIUDetailPanel asset={asset} />
        </div>
      )}
    </>
  );
}

// ─── Subdivision Group ─────────────────────────────────────────────────────────
function SubdivisionGroup({ subdivision, wius, expandedIds, onToggle }: {
  subdivision: string;
  wius: Asset[];
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const critCount = wius.filter(w => w.status === 'critical').length;
  const warnCount = wius.filter(w => w.status === 'warning').length;

  return (
    <div className="border border-border rounded mb-3 overflow-hidden">
      {/* Subdivision header */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <ChevronDown size={12} className="text-muted-foreground" /> : <ChevronRight size={12} className="text-muted-foreground" />}
        <MapPin size={12} className="text-sky-400" />
        <span className="text-[12px] font-semibold text-foreground">{subdivision.toUpperCase()}</span>
        <span className="text-[10px] text-muted-foreground">{wius.length} WIU{wius.length !== 1 ? 's' : ''}</span>
        {critCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400">{critCount} Critical</span>}
        {warnCount > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">{warnCount} Warning</span>}
      </div>

      {/* WIU rows */}
      {open && (
        <div>
          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 py-1.5 bg-muted/10 border-b border-border/40">
            <div className="w-4 shrink-0" />
            <div className="w-48 shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">WIU / Location</div>
            <div className="w-40 shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Status Badges</div>
            <div className="w-28 shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Subdivision</div>
            <div className="w-24 shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Alarms</div>
            <div className="flex-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Flags</div>
            <div className="w-20 text-right shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Last H.B.</div>
            <div className="w-16 shrink-0" />
          </div>
          {wius.map(w => (
            <WIURow key={w.id} asset={w} expanded={expandedIds.has(w.id)} onToggle={() => onToggle(w.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main WaysideIntel Page ────────────────────────────────────────────────────
export default function WaysideIntel() {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [groupBySubdivision, setGroupBySubdivision] = useState(true);

  const wius = useMemo(() => assets.filter(a => a.type === 'wayside'), []);

  // Filter tag counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FILTER_TAGS.forEach(f => {
      counts[f.key] = wius.filter(w => (w.filterTags ?? []).includes(f.key)).length;
    });
    counts['Critical'] = wius.filter(w => w.status === 'critical').length;
    counts['Medium'] = wius.filter(w => w.status === 'warning').length;
    return counts;
  }, [wius]);

  const toggleFilter = (key: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const filteredWIUs = useMemo(() => {
    let list = wius;
    if (search) list = list.filter(w => w.name.toLowerCase().includes(search.toLowerCase()) || w.subdivision.toLowerCase().includes(search.toLowerCase()));
    if (activeFilters.size > 0) {
      list = list.filter(w => {
        const tags = w.filterTags ?? [];
        if (activeFilters.has('Critical') && w.status !== 'critical') return false;
        if (activeFilters.has('Medium') && w.status !== 'warning') return false;
        for (const f of Array.from(activeFilters)) {
          if (f !== 'Critical' && f !== 'Medium' && !tags.includes(f)) return false;
        }
        return true;
      });
    }
    return list;
  }, [wius, search, activeFilters]);

  const subdivisions = useMemo(() => {
    const map: Record<string, Asset[]> = {};
    filteredWIUs.forEach(w => {
      (map[w.subdivision] = map[w.subdivision] ?? []).push(w);
    });
    return map;
  }, [filteredWIUs]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Summary counts
  const totalWIUs = wius.length;
  const criticalWIUs = wius.filter(w => w.status === 'critical').length;
  const staleWIUs = wius.filter(w => (w.filterTags ?? []).includes('Stale WIUs')).length;
  const ptcIssueWIUs = wius.filter(w => (w.filterTags ?? []).includes('PTC Issue')).length;

  return (
    <Layout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wayside Intelligence</h1>
            <p className="text-sm text-muted-foreground mt-0.5">WASP · WIU Network · Hazard Detectors · Signals · Switches</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground">Last update: {new Date().toLocaleTimeString()}</span>
            <span className="text-[10px] text-muted-foreground">AUTO REFRESH</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          </div>
        </div>

        {/* Filter tag bar (matching Screen 4) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_TAGS.map(f => {
            const count = tagCounts[f.key] ?? 0;
            const active = activeFilters.has(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggleFilter(f.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium rounded border transition-colors ${active ? f.activeColor : f.color}`}
              >
                <span className="font-bold text-[12px]">{count}</span>
                <span>{f.label}</span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search WIU, subdivision…"
                className="pl-7 pr-3 py-1.5 text-[11px] bg-muted/20 border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500 w-52"
              />
            </div>
            <button
              onClick={() => setGroupBySubdivision(g => !g)}
              className={`px-2.5 py-1.5 text-[10px] rounded border transition-colors ${groupBySubdivision ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-border text-muted-foreground'}`}
            >
              Group by Subdivision
            </button>
          </div>
        </div>

        {/* Summary KPI bar */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total WIUs', value: totalWIUs, color: 'text-foreground' },
            { label: 'Critical', value: criticalWIUs, color: criticalWIUs > 0 ? 'text-red-400' : 'text-muted-foreground' },
            { label: 'Stale WIUs', value: staleWIUs, color: staleWIUs > 0 ? 'text-orange-400' : 'text-muted-foreground' },
            { label: 'PTC Issues', value: ptcIssueWIUs, color: ptcIssueWIUs > 0 ? 'text-amber-400' : 'text-muted-foreground' },
          ].map(k => (
            <div key={k.label} className="rounded border border-border bg-muted/10 p-3">
              <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>

        {/* WIU list */}
        {filteredWIUs.length === 0 ? (
          <div className="rounded border border-border p-8 text-center text-[12px] text-muted-foreground">
            No WIUs match the current filters.
          </div>
        ) : groupBySubdivision ? (
          Object.entries(subdivisions).map(([sub, wius]) => (
            <SubdivisionGroup
              key={sub}
              subdivision={sub}
              wius={wius}
              expandedIds={expandedIds}
              onToggle={toggleExpand}
            />
          ))
        ) : (
          <div className="border border-border rounded overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-muted/10 border-b border-border/40">
              <div className="w-4 shrink-0" />
              <div className="w-48 shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">WIU / Location</div>
              <div className="w-40 shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Status Badges</div>
              <div className="w-28 shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Subdivision</div>
              <div className="w-24 shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Alarms</div>
              <div className="flex-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Flags</div>
              <div className="w-20 text-right shrink-0 text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Last H.B.</div>
              <div className="w-16 shrink-0" />
            </div>
            {filteredWIUs.map(w => (
              <WIURow key={w.id} asset={w} expanded={expandedIds.has(w.id)} onToggle={() => toggleExpand(w.id)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

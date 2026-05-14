import Layout from '@/components/Layout';
import { carDatabase, type CarRecord, type WaysideReading, type DefectFlag } from '@/lib/crewCarData';
import { getIncidentsForCar } from '@/lib/waysideIncidents';
import { useEffect, useState } from 'react';
import {
  Search, Train, MapPin, AlertTriangle, CheckCircle,
  Clock, ChevronDown, ChevronUp, Shield, Zap, Package,
  Activity, FileText, Radio, ExternalLink
} from 'lucide-react';

// ─── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: CarRecord['currentStatus'] }) {
  const map: Record<CarRecord['currentStatus'], { label: string; cls: string }> = {
    IN_TRANSIT: { label: 'In Transit', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    IN_YARD: { label: 'In Yard', cls: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
    SHOP: { label: 'In Shop', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    FOREIGN_ROAD: { label: 'Foreign Road', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    STORED: { label: 'Stored', cls: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
}

// ─── Detector type badge ───────────────────────────────────────────────────
function DetectorBadge({ type }: { type: WaysideReading['detectorType'] }) {
  const map: Record<WaysideReading['detectorType'], string> = {
    HBD: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    WILD: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    DED: 'bg-red-500/10 text-red-400 border-red-500/30',
    AEI: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    TADS: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    WIM: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${map[type]}`}>{type}</span>;
}

// ─── Reading status dot ────────────────────────────────────────────────────
function ReadingDot({ status }: { status: WaysideReading['status'] }) {
  const cls = status === 'ALARM' ? 'bg-red-400' : status === 'ALERT' ? 'bg-amber-400' : 'bg-emerald-400';
  return <span className={`inline-block w-2 h-2 rounded-full ${cls} flex-shrink-0 mt-1`} />;
}

// ─── Defect severity badge ─────────────────────────────────────────────────
function DefectBadge({ severity, resolved }: { severity: DefectFlag['severity']; resolved: boolean }) {
  if (resolved) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">RESOLVED</span>;
  const map: Record<DefectFlag['severity'], string> = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
    WARNING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    INFO: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[severity]}`}>{severity}</span>;
}

// ─── Consist History Tab ───────────────────────────────────────────────────
function ConsistTab({ car }: { car: CarRecord }) {
  return (
    <div className="space-y-2">
      {car.consistHistory.map((c, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Train className="w-3.5 h-3.5 text-cn-red flex-shrink-0" />
              <span className="font-mono text-sm font-bold text-foreground">{c.trainId}</span>
              <span className="text-xs text-muted-foreground">{c.date}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Position <span className="text-foreground font-semibold">#{c.position}</span> of {c.totalCars} cars</span>
              <span>{(c.weight / 1000).toFixed(0)}k lbs</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{c.origin}</span>
            <span className="mx-1">→</span>
            <span>{c.destination}</span>
            <span className="mx-1">·</span>
            <span>{c.subdivision} Sub</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Wayside Readings Tab ──────────────────────────────────────────────────
function WaysideTab({ car }: { car: CarRecord }) {
  return (
    <div className="space-y-2">
      {car.waysideReadings.map((r, i) => (
        <div key={i} className={`rounded-lg border p-3 ${
          r.status === 'ALARM' ? 'bg-red-500/5 border-red-500/30' :
          r.status === 'ALERT' ? 'bg-amber-500/5 border-amber-500/30' :
          'bg-card border-border'
        }`}>
          <div className="flex items-start gap-2">
            <ReadingDot status={r.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DetectorBadge type={r.detectorType} />
                <span className="text-xs font-semibold text-foreground">{r.detectorId}</span>
                <span className="text-xs text-muted-foreground">{r.timestamp}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{r.location} · MP {r.milepost} · {r.subdivision} Sub</span>
              </div>
              <p className={`text-xs mt-1 ${r.status !== 'NORMAL' ? 'text-amber-300 font-medium' : 'text-muted-foreground'}`}>
                {r.reading}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <Train className="w-3 h-3" />
                <span>Train {r.trainId}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Defect Flags Tab ──────────────────────────────────────────────────────
function DefectsTab({ car }: { car: CarRecord }) {
  if (car.defectFlags.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
        <p className="text-sm">No defect flags on record</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {car.defectFlags.map(d => (
        <div key={d.flagId} className={`rounded-lg border p-4 ${
          d.resolved ? 'bg-emerald-500/5 border-emerald-500/20' :
          d.severity === 'CRITICAL' ? 'bg-red-500/5 border-red-500/30' :
          d.severity === 'WARNING' ? 'bg-amber-500/5 border-amber-500/30' :
          'bg-blue-500/5 border-blue-500/20'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{d.flagId}</span>
              <DefectBadge severity={d.severity} resolved={d.resolved} />
            </div>
            <span className="text-xs text-muted-foreground">{d.date}</span>
          </div>
          <div className="text-sm font-semibold text-foreground mb-1">{d.type}</div>
          <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Detected by: </span>
              <span className="text-foreground">{d.detectedBy}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Location: </span>
              <span className="text-foreground">{d.location}</span>
            </div>
            {d.workOrderId && (
              <div>
                <span className="text-muted-foreground">Work Order: </span>
                <span className="text-foreground font-mono">{d.workOrderId}</span>
              </div>
            )}
            {d.resolved && d.resolvedBy && (
              <div>
                <span className="text-muted-foreground">Resolved by: </span>
                <span className="text-foreground">{d.resolvedBy} · {d.resolvedDate}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Car Detail Panel ──────────────────────────────────────────────────────
function CarDetail({ car }: { car: CarRecord }) {
  const [tab, setTab] = useState<'consist' | 'wayside' | 'defects'>('consist');
  const openDefects = car.defectFlags.filter(d => !d.resolved).length;
  const alarmReadings = car.waysideReadings.filter(r => r.status !== 'NORMAL').length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Car header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xl font-bold text-foreground">{car.carNumber}</span>
              <StatusBadge status={car.currentStatus} />
              {car.hazmat && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
                  ⚠ HAZMAT
                </span>
              )}
            </div>
            {car.hazmat && car.hazmatClass && (
              <p className="text-xs text-red-400 mt-0.5">{car.hazmatClass}</p>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{car.currentLocation}</span>
              {car.currentTrainId && (
                <>
                  <span className="mx-1">·</span>
                  <Train className="w-3 h-3 text-cn-red" />
                  <span className="text-foreground font-semibold">{car.currentTrainId}</span>
                </>
              )}
            </div>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-xs">
            {[
              ['Type', car.carType],
              ['Owner', car.owner],
              ['Built', car.builtYear],
              ['Capacity', `${car.capacity}t`],
              ['Length', `${car.length} ft`],
              ['Last Seen', car.lastSeen],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-muted-foreground">{label}: </span>
                <span className="text-foreground font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert summary */}
        {(openDefects > 0 || alarmReadings > 0) && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {openDefects > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                <AlertTriangle className="w-3 h-3" />
                <span>{openDefects} open defect{openDefects > 1 ? 's' : ''}</span>
              </div>
            )}
            {alarmReadings > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
                <Activity className="w-3 h-3" />
                <span>{alarmReadings} elevated detector reading{alarmReadings > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([
          { key: 'consist', label: 'Consist History', icon: Train, count: car.consistHistory.length },
          { key: 'wayside', label: 'Wayside Readings', icon: Radio, count: car.waysideReadings.length },
          { key: 'defects', label: 'Defect Flags', icon: AlertTriangle, count: car.defectFlags.length },
        ] as const).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors border-b-2 ${
              tab === key
                ? 'border-cn-red text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-cn-red/20 text-cn-red' : 'bg-muted text-muted-foreground'}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {tab === 'consist' && <ConsistTab car={car} />}
        {tab === 'wayside' && <WaysideTab car={car} />}
        {tab === 'defects' && <DefectsTab car={car} />}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function CarSearch() {
  const [query, setQuery] = useState('');
  const [selectedCar, setSelectedCar] = useState<CarRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [fromIncident, setFromIncident] = useState(false);

  // Auto-search when navigated from Incidents page via ?car= param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const carParam = params.get('car');
    if (carParam) {
      const found = carDatabase.find(c => c.carNumber.toLowerCase() === carParam.toLowerCase());
      if (found) {
        setQuery(found.carNumber);
        setSelectedCar(found);
        setSearched(true);
        setFromIncident(true);
      }
    }
  }, []);

  const suggestions = query.length >= 2
    ? carDatabase.filter(c =>
        c.carNumber.toLowerCase().includes(query.toLowerCase()) ||
        c.reportingMark.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  function handleSearch(car: CarRecord) {
    setSelectedCar(car);
    setQuery(car.carNumber);
    setSearched(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = carDatabase.find(c => c.carNumber.toLowerCase() === query.toLowerCase());
    if (found) handleSearch(found);
    else if (suggestions.length > 0) handleSearch(suggestions[0]);
    setSearched(true);
  }

  // Get open incidents for the currently selected car
  const carIncidents = selectedCar ? getIncidentsForCar(selectedCar.carNumber) : [];
  const openCarIncidents = carIncidents.filter(i => i.incidentStatus !== 'resolved');

  return (
    <Layout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Car Search</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Look up any car by reporting mark and number — consist history, wayside detector readings, and defect flags
        </p>
      </div>

      {/* Incident referral banner — shown when navigated from Incidents page */}
      {fromIncident && selectedCar && openCarIncidents.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/40 bg-red-500/5">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-red-400">Referred from Incidents</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold">
                {openCarIncidents.length} open incident{openCarIncidents.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              {openCarIncidents.map(inc => (
                <div key={inc.id} className="flex items-start gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${
                    inc.status === 'ALARM' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>{inc.status}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{inc.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{inc.description}</p>
                    {inc.workOrderId && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Work Order: <span className="font-mono text-foreground">{inc.workOrderId}</span>
                        {' · '}Assigned to: <span className="text-foreground">{inc.assignedTo}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card focus-within:border-cn-red transition-colors">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSearched(false); }}
            placeholder="Enter car number — e.g. CN 412847, BNSF 584291, TTX 891204..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none font-mono"
            autoFocus
          />
          <button type="submit" className="px-4 py-1.5 rounded bg-cn-red text-white text-xs font-semibold hover:bg-red-600 transition-colors flex-shrink-0">
            Search
          </button>
        </div>

        {/* Autocomplete */}
        {suggestions.length > 0 && !searched && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-xl z-10 overflow-hidden">
            {suggestions.map(car => (
              <button
                key={car.carNumber}
                type="button"
                onClick={() => handleSearch(car)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
              >
                <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-sm font-semibold text-foreground">{car.carNumber}</span>
                  <span className="text-xs text-muted-foreground ml-2">{car.carType} · {car.owner}</span>
                </div>
                <StatusBadge status={car.currentStatus} />
                {car.defectFlags.filter(d => !d.resolved).length > 0 && (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Quick access sample cars */}
      {!selectedCar && (
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Sample Cars — Click to View</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {carDatabase.map(car => {
              const openDefects = car.defectFlags.filter(d => !d.resolved).length;
              const alarms = car.waysideReadings.filter(r => r.status !== 'NORMAL').length;
              return (
                <button
                  key={car.carNumber}
                  onClick={() => handleSearch(car)}
                  className="text-left rounded-lg border border-border bg-card p-3 hover:border-cn-red/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-bold text-foreground">{car.carNumber}</span>
                    <StatusBadge status={car.currentStatus} />
                  </div>
                  <div className="text-xs text-muted-foreground">{car.carType} · Built {car.builtYear}</div>
                  {car.currentTrainId && (
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      <Train className="w-3 h-3 text-cn-red" />
                      <span className="text-foreground font-semibold">{car.currentTrainId}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-1.5">
                    {openDefects > 0 && (
                      <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />{openDefects} defect{openDefects > 1 ? 's' : ''}
                      </span>
                    )}
                    {alarms > 0 && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                        <Activity className="w-2.5 h-2.5" />{alarms} alert{alarms > 1 ? 's' : ''}
                      </span>
                    )}
                    {openDefects === 0 && alarms === 0 && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" />Clean
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search result */}
      {selectedCar && <CarDetail car={selectedCar} />}

      {/* No result */}
      {searched && !selectedCar && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No car found for "{query}"</p>
          <p className="text-xs mt-1">Try the full reporting mark and number, e.g. CN 412847</p>
        </div>
      )}

      {/* Detector legend */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Wayside Detector Types</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { type: 'HBD', name: 'Hot Box Detector', desc: 'Infrared bearing temperature scan' },
            { type: 'WILD', name: 'Wheel Impact Load Detector', desc: 'Dynamic wheel force measurement (kips)' },
            { type: 'DED', name: 'Dragging Equipment Detector', desc: 'Low-hanging or dragging component detection' },
            { type: 'AEI', name: 'Automatic Equipment Identification', desc: 'RFID tag reader — confirms car identity' },
            { type: 'TADS', name: 'Truck Alignment Detection System', desc: 'Lateral truck alignment and hunting detection' },
            { type: 'WIM', name: 'Weigh-in-Motion', desc: 'Dynamic axle load and gross weight measurement' },
          ].map(({ type, name, desc }) => (
            <div key={type} className="flex gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border h-fit flex-shrink-0 ${
                type === 'HBD' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                type === 'WILD' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                type === 'DED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                type === 'AEI' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                type === 'TADS' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>{type}</span>
              <div>
                <div className="font-medium text-foreground">{name}</div>
                <div className="text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </Layout>
  );
}

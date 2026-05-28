import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { assets } from "@/lib/mockData";
import type { Asset, ETCState, WOPKState, LocoSubsystems, SubsystemComponent, LocoAlarm, WIUHazardDetector, WIUSignal, WIUSwitch, LVVRData, LVVRHealth, CameraState, LVVRDrivePartition, LVVRCamera } from "@/lib/mockData";
import { FLEET_SNAPSHOT } from "@/lib/fleetData";
import {
  Train, Radio, MapPin, Clock, Search, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle, XCircle, ShieldCheck, ShieldAlert, ShieldOff,
  KeyRound, Activity, Filter, ArrowUpDown, ArrowUp, ArrowDown, Wifi, Cpu,
  Satellite, Zap, Eye, EyeOff
} from "lucide-react";

// ─── Safety system helpers ────────────────────────────────────────────────────
const ETC_ATP_SUBDIVISIONS = ['Ruel', 'Bala', 'MacTier', 'Capreol', 'Kingston'];
const ETC_DAS_SUBDIVISIONS = ['Edson', 'Wainwright', 'Rivers'];

function getSafetySystem(subdivision: string): 'ETC-ATP' | 'ETC-DAS' | 'PTC' {
  if (ETC_ATP_SUBDIVISIONS.includes(subdivision)) return 'ETC-ATP';
  if (ETC_DAS_SUBDIVISIONS.includes(subdivision)) return 'ETC-DAS';
  return 'PTC';
}

// ─── ETC / PTC state helpers ──────────────────────────────────────────────────
const etcStateLabel: Record<ETCState, string> = {
  POWER_UP: 'POWER UP', SELF_TEST: 'SELF TEST', INITIALIZING: 'INIT',
  ACTIVE: 'ACTIVE', CUT_OUT: 'CUT_OUT', FAILED: 'FAILED', NOT_EQUIPPED: 'NOT EQUIPPED',
};
const etcStateBg: Record<ETCState, string> = {
  POWER_UP: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  SELF_TEST: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  INITIALIZING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  CUT_OUT: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/30',
  NOT_EQUIPPED: 'bg-muted/20 text-muted-foreground border-border',
};

// ─── Subsystem dot helpers ─────────────────────────────────────────────────────
function subsystemDot(status: string) {
  if (status === 'critical') return <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />;
  if (status === 'warning') return <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />;
  if (status === 'ok') return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-slate-500 mr-1" />;
}

function worstStatus(components?: SubsystemComponent[]): string {
  if (!components || components.length === 0) return 'ok';
  if (components.some(c => c.status === 'critical')) return 'critical';
  if (components.some(c => c.status === 'warning')) return 'warning';
  return 'ok';
}

// ─── Onboard Equipment Panel ──────────────────────────────────────────────────
function SubsystemGroup({ title, items }: { title: string; items?: SubsystemComponent[] }) {
  if (!items || items.length === 0) return null;
  const worst = worstStatus(items);
  return (
    <div className="min-w-[140px]">
      <div className="flex items-center gap-1 mb-1.5">
        {subsystemDot(worst)}
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</span>
      </div>
      <div className="space-y-0.5">
        {items.map(c => (
          <div key={c.name} className="flex items-center gap-1 text-[11px]">
            {subsystemDot(c.status)}
            <span className={c.status === 'critical' ? 'text-red-400' : c.status === 'warning' ? 'text-amber-400' : 'text-foreground/80'}>{c.name}</span>
            {c.detail && <span className="text-muted-foreground ml-1 truncate max-w-[100px]" title={c.detail}>({c.detail})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function OnboardEquipmentPanel({ subsystems, ptcEquipped, tripOptimizerOperative }: {
  subsystems?: LocoSubsystems;
  ptcEquipped?: boolean;
  tripOptimizerOperative?: boolean;
}) {
  if (!subsystems) return <div className="text-[11px] text-muted-foreground p-4">No subsystem data available.</div>;
  return (
    <div className="p-4 bg-muted/5 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">Onboard Equipment Status</span>
        {ptcEquipped && <span className="text-[9px] px-1.5 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-400">PTC Equipped: Y</span>}
        {tripOptimizerOperative && <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Trip Optimizer: Y</span>}
      </div>
      <div className="flex flex-wrap gap-6">
        <SubsystemGroup title="CDU" items={subsystems.cdu} />
        <SubsystemGroup title="TMC" items={subsystems.tmc} />
        <SubsystemGroup title="ACC" items={subsystems.acc} />
        <SubsystemGroup title="Loco Systems" items={subsystems.locoSystems} />
        <SubsystemGroup title="Recording" items={subsystems.recordingSystem} />
        <SubsystemGroup title="GPS" items={subsystems.gps} />
        <SubsystemGroup title="Comms." items={subsystems.comms} />
        <SubsystemGroup title="Resilio" items={subsystems.resilio} />
        <SubsystemGroup title="ITCM Routes" items={subsystems.itcmRoutes} />
      </div>
    </div>
  );
}

// ─── Alarms Panel ─────────────────────────────────────────────────────────────
function AlarmRow({ alarm }: { alarm: LocoAlarm }) {
  const icon = alarm.severity === 'critical'
    ? <XCircle size={12} className="text-red-400 shrink-0" />
    : alarm.severity === 'warning'
    ? <AlertTriangle size={12} className="text-amber-400 shrink-0" />
    : <Activity size={12} className="text-sky-400 shrink-0" />;
  return (
    <tr className="border-b border-border/40 hover:bg-muted/10">
      <td className="py-1.5 px-2 text-[10px] text-muted-foreground whitespace-nowrap">{alarm.startTime}</td>
      <td className="py-1.5 px-2 text-[10px] text-muted-foreground whitespace-nowrap">{alarm.lastUpdate}</td>
      <td className="py-1.5 px-2 text-[10px] font-medium text-foreground/80 whitespace-nowrap">{alarm.subsystem}</td>
      <td className="py-1.5 px-2 text-[11px] text-foreground/90">
        <div className="flex items-start gap-1">{icon}<span>{alarm.message}</span></div>
      </td>
    </tr>
  );
}

function AlarmsPanel({ openAlarms, closedAlarms }: { openAlarms?: LocoAlarm[]; closedAlarms?: LocoAlarm[] }) {
  const [tab, setTab] = useState<'open' | 'closed' | 'snow'>('open');
  const grouped = useMemo(() => {
    const list = tab === 'open' ? (openAlarms ?? []) : (closedAlarms ?? []);
    const map: Record<string, LocoAlarm[]> = {};
    list.forEach(a => { (map[a.subsystem] = map[a.subsystem] ?? []).push(a); });
    return map;
  }, [tab, openAlarms, closedAlarms]);

  return (
    <div className="border-t border-border">
      <div className="flex items-center gap-0 border-b border-border bg-muted/10">
        {(['open', 'closed', 'snow'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[11px] font-medium border-b-2 transition-colors ${tab === t ? 'border-sky-500 text-sky-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'open' ? `Open Alarms (${openAlarms?.length ?? 0})` : t === 'closed' ? `Closed Alarms (${closedAlarms?.length ?? 0})` : 'ServiceNow Tickets'}
          </button>
        ))}
      </div>
      {tab === 'snow' ? (
        <div className="p-4 text-[11px] text-muted-foreground">No ServiceNow tickets linked.</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="p-4 text-[11px] text-muted-foreground">No {tab} alarms.</div>
      ) : (
        <div className="p-3">
          {Object.entries(grouped).map(([subsystem, alarms]) => (
            <div key={subsystem} className="mb-3">
              <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
                <ChevronDown size={9} />{subsystem}
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-[9px] text-muted-foreground uppercase tracking-widest">
                    <th className="text-left px-2 pb-1 font-normal">Start Time</th>
                    <th className="text-left px-2 pb-1 font-normal">Last Update</th>
                    <th className="text-left px-2 pb-1 font-normal">Subsystem</th>
                    <th className="text-left px-2 pb-1 font-normal">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {alarms.map(a => <AlarmRow key={a.id} alarm={a} />)}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LVVR Monitoring Panel ────────────────────────────────────────────────────
const lvvrHealthBg: Record<LVVRHealth, string> = {
  NORMAL: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  ATTENTION: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  FAIL: 'border-red-500/30 bg-red-500/10 text-red-400',
  DISABLED: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  UNKNOWN: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
};
const cameraStateBg: Record<CameraState, string> = {
  Recording: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  Standby: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  Fault: 'border-red-500/30 bg-red-500/10 text-red-400',
  NotEquipped: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  Unknown: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
};

function DrivePartitionBar({ name, usagePct, status }: { name: string; usagePct: number; status: 'ok' | 'warning' | 'critical' }) {
  const barColor = status === 'critical' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-400' : 'bg-emerald-500';
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-muted-foreground">{name}</span>
        <span className={status === 'warning' ? 'text-amber-400 font-semibold' : status === 'critical' ? 'text-red-400 font-semibold' : 'text-foreground/70'}>{usagePct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${usagePct}%` }} />
      </div>
    </div>
  );
}

function LVVRPanel({ lvvr }: { lvvr?: LVVRData }) {
  if (!lvvr) return <div className="p-4 text-[11px] text-muted-foreground">No LVVR data available.</div>;

  const suppressed = !!lvvr.suppressionReason;
  const suppressionLabel: Record<string, string> = {
    SHOP: 'Loco in SHOP — LVVR alarms suppressed (LOBS-11749)',
    STORAGE: 'Loco in STORAGE — LVVR alarms suppressed (LOBS-11751)',
    LAB: 'Lab locomotive — LVVR alarms suppressed (LOBS-11754)',
    DT: 'Dark Territory — LVVR alarms suppressed (LOBS-11747)',
    UPGRADE: 'Software upgrade in progress — LVVR alarms suppressed (LOBS-11758)',
    DECOMMISSIONED: 'Loco decommissioned — no LVVR alarms (LOBS-11750)',
    NO_INTERNET: 'No internet connectivity — LVVR alarms suppressed (LOBS-11755)',
    OUTSIDE_CANADA: 'Outside Canada — audio/video alarms suppressed',
    BRAKES_SHUTDOWN: 'Brakes shutdown — new LVVR alarms suppressed (LOBS-11800)',
  };

  return (
    <div className="p-4 bg-muted/5">
      {/* Suppression Banner */}
      {suppressed && lvvr.suppressionReason && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded border border-sky-500/30 bg-sky-500/10">
          <ShieldOff size={13} className="text-sky-400 shrink-0" />
          <span className="text-[11px] text-sky-300">{suppressionLabel[lvvr.suppressionReason] ?? 'LVVR alarms suppressed'}</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {/* LVVR Agent + LDVR + ER */}
        <div className="space-y-3">
          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">LVVR System</div>
          {/* Agent */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] text-foreground/80">OWL Agent</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${lvvr.agentResponsive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                {lvvr.agentResponsive ? 'Responsive' : 'Unresponsive'}
              </span>
            </div>
            {lvvr.agentLastSeen && <div className="text-[10px] text-muted-foreground">{lvvr.agentVersion} — {lvvr.agentLastSeen}</div>}
          </div>
          {/* LDVR */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] text-foreground/80">{lvvr.ldvrModel ?? 'LDVR'}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${lvvrHealthBg[lvvr.ldvrHealth]}`}>{lvvr.ldvrHealth}</span>
            </div>
            {lvvr.ldvrHealth === 'FAIL' && <div className="text-[10px] text-red-400">⚠ LDVR health FAIL — dependent alarms active (LOBS-11738)</div>}
            {lvvr.ldvrHealth === 'ATTENTION' && <div className="text-[10px] text-amber-400">⚠ LDVR health ATTENTION — monitoring</div>}
          </div>
          {/* ER */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] text-foreground/80">Event Recorder</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                lvvr.erStatus === 'NORMAL' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                lvvr.erStatus === 'NOT_OPERATIONAL' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                lvvr.erStatus === 'ATTENTION' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                'border-slate-500/30 bg-slate-500/10 text-slate-400'
              }`}>{lvvr.erStatus}</span>
            </div>
            {lvvr.erStatus === 'NOT_OPERATIONAL' && (
              <div className="text-[10px] text-red-400">
                {(lvvr.erNotOperationalCount ?? 0) >= 3 ? `⚠ ALARM: NOT_OPERATIONAL ×${lvvr.erNotOperationalCount} (LOBS-11737)` : `⚠ WARNING: NOT_OPERATIONAL ×${lvvr.erNotOperationalCount} (LOBS-11746)`}
              </div>
            )}
          </div>
        </div>

        {/* CHM */}
        <div>
          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">CHM (Crash/Health Module)</div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-foreground/80">{lvvr.chmSerialNumber ?? 'CHM'}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${lvvr.chmConnected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
              {lvvr.chmConnected ? 'Connected' : 'DISCONNECTED'}
            </span>
          </div>
          {!lvvr.chmConnected && <div className="text-[10px] text-red-400 mb-2">⚠ ALARM: CHM disconnected (LOBS-11757)</div>}
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Drive Partitions</div>
          {lvvr.chmPartitions.map(p => <DrivePartitionBar key={p.name} {...p} />)}
          {lvvr.chmPartitions.some(p => p.status === 'warning' || p.status === 'critical') && (
            <div className="text-[10px] text-amber-400 mt-1">⚠ WARNING: Partition usage &gt;90% (LOBS-11759)</div>
          )}
        </div>

        {/* SSD */}
        <div>
          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">SSD (Solid State Drive)</div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-foreground/80">{lvvr.ssdSerialNumber ?? 'SSD'}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${lvvr.ssdConnected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
              {lvvr.ssdConnected ? 'Connected' : 'DISCONNECTED'}
            </span>
          </div>
          {!lvvr.ssdConnected && <div className="text-[10px] text-red-400 mb-2">⚠ ALARM: SSD disconnected (LOBS-11756)</div>}
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Drive Partitions</div>
          {lvvr.ssdPartitions.map(p => <DrivePartitionBar key={p.name} {...p} />)}
          {lvvr.ssdPartitions.some(p => p.status === 'warning' || p.status === 'critical') && (
            <div className="text-[10px] text-amber-400 mt-1">⚠ WARNING: Partition usage &gt;90% (LOBS-11760)</div>
          )}
        </div>

        {/* Cameras + MIC */}
        <div>
          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Cameras &amp; Audio</div>
          <div className="space-y-2">
            {lvvr.cameras.map(cam => (
              <div key={cam.id} className="border border-border/40 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-foreground/90">{cam.label}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${cameraStateBg[cam.state]}`}>{cam.state}</span>
                </div>
                <div className="flex gap-2 text-[10px]">
                  <span className={cam.recordingVideo ? 'text-emerald-400' : 'text-red-400'}>
                    {cam.recordingVideo ? '● Video' : '✕ Video'}
                  </span>
                  <span className={cam.recordingAudio ? 'text-emerald-400' : 'text-red-400'}>
                    {cam.recordingAudio ? '● Audio' : '✕ Audio'}
                  </span>
                  <span className={cam.healthOk ? 'text-emerald-400' : 'text-red-400'}>
                    {cam.healthOk ? '● Health OK' : '✕ Health Fault'}
                  </span>
                </div>
                {!cam.healthOk && <div className="text-[10px] text-red-400 mt-0.5">⚠ ALARM: Camera {cam.id} health not OK (LOBS-1186{cam.id})</div>}
                {cam.healthOk && !cam.recordingVideo && cam.state !== 'Standby' && <div className="text-[10px] text-red-400 mt-0.5">⚠ ALARM: Camera {cam.id} not recording video (LOBS-1177{cam.id + 3})</div>}
              </div>
            ))}
            {/* External MIC */}
            <div className="border border-border/40 rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-foreground/90">External MIC</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${lvvr.micHealthOk ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                  {lvvr.micHealthOk ? 'Health OK' : 'Health Fault'}
                </span>
              </div>
              <span className={`text-[10px] ${lvvr.micRecordingAudio ? 'text-emerald-400' : 'text-red-400'}`}>
                {lvvr.micRecordingAudio ? '● Recording Audio' : '✕ Not Recording Audio'}
              </span>
              {!lvvr.micHealthOk && <div className="text-[10px] text-red-400 mt-0.5">⚠ ALARM: External MIC health not good (LOBS-11700)</div>}
              {lvvr.micHealthOk && !lvvr.micRecordingAudio && <div className="text-[10px] text-red-400 mt-0.5">⚠ ALARM: Not recording audio from External MIC (LOBS-11860)</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WIU Expanded Panel ────────────────────────────────────────────────────────
function SignalAspects({ aspects }: { aspects: ('red' | 'yellow' | 'green' | 'dark')[] }) {
  const color = { red: 'bg-red-500', yellow: 'bg-yellow-400', green: 'bg-emerald-500', dark: 'bg-slate-700 border border-slate-600' };
  return (
    <div className="flex gap-0.5 items-center">
      {aspects.map((a, i) => <span key={i} className={`w-2.5 h-2.5 rounded-full ${color[a]}`} />)}
    </div>
  );
}

function WIUExpandedPanel({ asset }: { asset: Asset }) {
  return (
    <div className="p-4 bg-muted/5 border-t border-border">
      <div className="grid grid-cols-3 gap-4">
        {/* Hazard Detectors */}
        <div>
          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Hazard Detectors</div>
          <div className="space-y-1">
            {(asset.hazardDetectors ?? []).map(d => (
              <div key={d.name} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground/80">{d.name}</span>
                <span className={`w-4 h-4 flex items-center justify-center ${d.status === 'active' ? 'text-sky-400' : d.status === 'fault' ? 'text-red-400' : d.status === 'unknown' ? 'text-slate-500' : 'text-muted-foreground'}`}>
                  {d.status === 'active' ? '●' : d.status === 'fault' ? '✕' : d.status === 'unknown' ? '?' : '▬'}
                </span>
              </div>
            ))}
            {(asset.hazardDetectors ?? []).length === 0 && <span className="text-[11px] text-muted-foreground">No detectors</span>}
          </div>
        </div>
        {/* Signals */}
        <div>
          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Signals</div>
          <div className="space-y-1.5">
            {(asset.signals ?? []).map(s => (
              <div key={s.name} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground/80">{s.name} / {s.id}</span>
                <div className="flex items-center gap-1.5">
                  <SignalAspects aspects={s.aspects} />
                  {s.count !== undefined && <span className="text-[10px] text-muted-foreground w-5 text-right">{s.count}</span>}
                </div>
              </div>
            ))}
            {(asset.signals ?? []).length === 0 && <span className="text-[11px] text-muted-foreground">No signals</span>}
          </div>
        </div>
        {/* Switches */}
        <div>
          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Switches</div>
          <div className="space-y-1">
            {(asset.switches ?? []).map(sw => (
              <div key={sw.name} className="flex items-center justify-between text-[11px]">
                <span className="text-foreground/80">{sw.name} / {sw.id}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${sw.position === 'N' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : sw.position === 'R' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-slate-500/30 bg-slate-500/10 text-slate-400'}`}>
                  {sw.position}
                </span>
              </div>
            ))}
            {(asset.switches ?? []).length === 0 && <span className="text-[11px] text-muted-foreground">No switch status</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Locomotive Fleet Table Row ────────────────────────────────────────────────
type SortKey = 'name' | 'etcState' | 'ptcMissionCritical' | 'position' | 'lastHeartbeat' | 'subdivision' | 'status';
type SortDir = 'asc' | 'desc';

function StatusBadges({ critical = 0, warning = 0, info = 0 }: { critical?: number; warning?: number; info?: number }) {
  return (
    <div className="flex items-center gap-1">
      {critical > 0 && <span className="flex items-center gap-0.5 text-[10px] text-red-400"><XCircle size={9} />{critical}</span>}
      {warning > 0 && <span className="flex items-center gap-0.5 text-[10px] text-amber-400"><AlertTriangle size={9} />{warning}</span>}
      {info > 0 && <span className="flex items-center gap-0.5 text-[10px] text-sky-400"><Activity size={9} />{info}</span>}
      {critical === 0 && warning === 0 && info === 0 && <span className="text-[10px] text-emerald-400">—</span>}
    </div>
  );
}

function LocoTableRow({ asset, expanded, onToggle }: { asset: Asset; expanded: boolean; onToggle: () => void }) {
  const ptcState = FLEET_SNAPSHOT.find(t => t.locos.includes(asset.name))?.ptcState;
  const safetySystem = getSafetySystem(asset.subdivision);
  const [expandTab, setExpandTab] = useState<'equipment' | 'alarms' | 'lvvr'>('equipment');

  const safetyBadge = safetySystem === 'ETC-ATP'
    ? <span className="text-[9px] px-1 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">🇨🇦 ETC-ATP</span>
    : safetySystem === 'ETC-DAS'
    ? <span className="text-[9px] px-1 py-0.5 rounded border border-teal-500/30 bg-teal-500/10 text-teal-400">🇨🇦 ETC-DAS</span>
    : <span className="text-[9px] px-1 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">🇺🇸 PTC</span>;

  const ptcStateBadge = ptcState
    ? <span className={`text-[9px] px-1 py-0.5 rounded border font-mono ${
        ptcState === 'ACTIVE' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
        ptcState === 'SUPPRESSED' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
        ptcState === 'BYPASS' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
        ptcState === 'INITIALIZING' ? 'border-sky-500/30 bg-sky-500/10 text-sky-400' :
        'border-slate-500/30 bg-slate-500/10 text-slate-400'
      }`}>{ptcState}</span>
    : null;

  return (
    <>
      <tr
        className={`border-b border-border/40 hover:bg-muted/10 cursor-pointer transition-colors ${expanded ? 'bg-muted/10' : ''}`}
        onClick={onToggle}
      >
        {/* Expand chevron */}
        <td className="py-2 px-2 w-6">
          {expanded ? <ChevronDown size={12} className="text-muted-foreground" /> : <ChevronRight size={12} className="text-muted-foreground" />}
        </td>
        {/* LOCO ID */}
        <td className="py-2 px-2 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${asset.status === 'critical' ? 'bg-red-500' : asset.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-[12px] font-semibold text-foreground">{asset.name}</span>
          </div>
        </td>
        {/* PTC STATE */}
        <td className="py-2 px-2 whitespace-nowrap">
          <div className="flex flex-col gap-0.5">
            {safetyBadge}
            {ptcStateBadge}
          </div>
        </td>
        {/* PTC M.C. */}
        <td className="py-2 px-2 text-[11px] text-center">
          {asset.ptcMissionCritical === true ? <span className="text-emerald-400 font-medium">YES</span> : <span className="text-muted-foreground">NO</span>}
        </td>
        {/* PHYS. STATUS */}
        <td className="py-2 px-2 text-[11px] text-muted-foreground">{asset.physStatus || '—'}</td>
        {/* OP. CODE */}
        <td className="py-2 px-2">
          {asset.opCode && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/30 text-foreground/70">{asset.opCode}</span>}
        </td>
        {/* POS. */}
        <td className="py-2 px-2">
          {asset.position && <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
            asset.position === 'LEAD' ? 'border-sky-500/30 bg-sky-500/10 text-sky-400' :
            asset.position === 'TRAIL' ? 'border-slate-500/30 bg-slate-500/10 text-slate-400' :
            asset.position === 'YARD' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
            'border-muted text-muted-foreground'
          }`}>{asset.position}</span>}
        </td>
        {/* STATUS badges */}
        <td className="py-2 px-2">
          <StatusBadges critical={asset.criticalAlarmCount} warning={asset.warningAlarmCount} info={asset.infoAlarmCount} />
        </td>
        {/* MODEL */}
        <td className="py-2 px-2 text-[11px] text-foreground/70 whitespace-nowrap">{asset.locoModel || '—'}</td>
        {/* CLASS */}
        <td className="py-2 px-2 text-[11px] text-muted-foreground whitespace-nowrap">{asset.locoClass || '—'}</td>
        {/* LAST H.B. */}
        <td className="py-2 px-2 text-[11px] text-muted-foreground whitespace-nowrap">{asset.lastHeartbeat || asset.lastSeen}</td>
        {/* LOCATION */}
        <td className="py-2 px-2 text-[11px] text-sky-400 whitespace-nowrap max-w-[180px] truncate" title={asset.location}>{asset.location || asset.subdivision}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-border">
          <td colSpan={12} className="p-0">
            {/* Tab switcher */}
            <div className="flex items-center gap-0 border-b border-border bg-muted/5">
              <button
                onClick={e => { e.stopPropagation(); setExpandTab('equipment'); }}
                className={`px-4 py-2 text-[11px] font-medium border-b-2 transition-colors ${expandTab === 'equipment' ? 'border-sky-500 text-sky-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                Onboard Equipment
              </button>
              <button
                onClick={e => { e.stopPropagation(); setExpandTab('alarms'); }}
                className={`px-4 py-2 text-[11px] font-medium border-b-2 transition-colors ${expandTab === 'alarms' ? 'border-sky-500 text-sky-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                Alarms ({(asset.openAlarms?.length ?? 0) + (asset.closedAlarms?.length ?? 0)})
              </button>
              <button
                onClick={e => { e.stopPropagation(); setExpandTab('lvvr'); }}
                className={`px-4 py-2 text-[11px] font-medium border-b-2 transition-colors ${expandTab === 'lvvr' ? 'border-sky-500 text-sky-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                LVVR Recording
              </button>
            </div>
            {expandTab === 'equipment' ? (
              <OnboardEquipmentPanel subsystems={asset.subsystems} ptcEquipped={asset.ptcEquipped} tripOptimizerOperative={asset.tripOptimizerOperative} />
            ) : expandTab === 'lvvr' ? (
              <LVVRPanel lvvr={asset.lvvr} />
            ) : (
              <AlarmsPanel openAlarms={asset.openAlarms} closedAlarms={asset.closedAlarms} />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── WIU Table Row ─────────────────────────────────────────────────────────────
function WIUTableRow({ asset, expanded, onToggle }: { asset: Asset; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <tr
        className={`border-b border-border/40 hover:bg-muted/10 cursor-pointer transition-colors ${expanded ? 'bg-muted/10' : ''}`}
        onClick={onToggle}
      >
        <td className="py-2 px-2 w-6">
          {expanded ? <ChevronDown size={12} className="text-muted-foreground" /> : <ChevronRight size={12} className="text-muted-foreground" />}
        </td>
        <td className="py-2 px-2 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${asset.status === 'critical' ? 'bg-red-500' : asset.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="text-[12px] font-semibold text-foreground">{asset.name}</span>
          </div>
        </td>
        <td className="py-2 px-2">
          <div className="flex items-center gap-1 flex-wrap">
            {asset.wuiId && <span className="text-[9px] px-1 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-400">{asset.wuiId}</span>}
            {asset.wmsStatus && <span className={`text-[9px] px-1 py-0.5 rounded border ${asset.wmsStatus === 'OK' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>WMS</span>}
            {asset.wrStatus && <span className={`text-[9px] px-1 py-0.5 rounded border ${asset.wrStatus === 'OK' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>WR</span>}
            {asset.wdcId && <span className="text-[9px] px-1 py-0.5 rounded border border-slate-500/30 bg-slate-500/10 text-slate-400">{asset.wdcId}</span>}
          </div>
        </td>
        <td className="py-2 px-2 text-[11px] text-muted-foreground">{asset.subdivision}</td>
        <td className="py-2 px-2 text-[11px] text-muted-foreground">{asset.milepost ? `MP ${asset.milepost}` : '—'}</td>
        <td className="py-2 px-2 text-[11px] text-muted-foreground">{asset.lastSeen}</td>
        <td className="py-2 px-2">
          <div className="flex gap-1 flex-wrap">
            {(asset.filterTags ?? []).map(tag => (
              <span key={tag} className={`text-[9px] px-1 py-0.5 rounded border ${
                tag === 'Critical' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                tag === 'PTC Issue' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                tag === 'Stale WIUs' ? 'border-orange-500/30 bg-orange-500/10 text-orange-400' :
                'border-border text-muted-foreground'
              }`}>{tag}</span>
            ))}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border">
          <td colSpan={7} className="p-0">
            <WIUExpandedPanel asset={asset} />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Sort header helper ────────────────────────────────────────────────────────
function SortTh({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: string; current: string; dir: SortDir; onSort: (k: string) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-foreground select-none whitespace-nowrap"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active ? (dir === 'asc' ? <ArrowUp size={9} /> : <ArrowDown size={9} />) : <ArrowUpDown size={9} className="opacity-30" />}
      </div>
    </th>
  );
}

// ─── Main Assets Page ─────────────────────────────────────────────────────────
export default function Assets() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'locomotive' | 'wayside' | 'radio' | 'crossing' | 'atip'>('all');
  const [safetyFilter, setSafetyFilter] = useState<'all' | 'ETC-ATP' | 'ETC-DAS' | 'PTC'>('all');
  const [ptcStateFilter, setPtcStateFilter] = useState<'all' | 'ACTIVE' | 'BYPASS' | 'SUPPRESSED' | 'FAILED'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string>('status');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const locos = useMemo(() => assets.filter(a => a.type === 'locomotive'), []);
  const wius = useMemo(() => assets.filter(a => a.type === 'wayside'), []);
  const others = useMemo(() => assets.filter(a => !['locomotive', 'wayside'].includes(a.type)), []);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredLocos = useMemo(() => {
    let list = locos;
    if (search) list = list.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || (a.location ?? '').toLowerCase().includes(search.toLowerCase()) || a.subdivision.toLowerCase().includes(search.toLowerCase()));
    if (safetyFilter !== 'all') list = list.filter(a => getSafetySystem(a.subdivision) === safetyFilter);
    if (ptcStateFilter !== 'all') {
      list = list.filter(a => {
        const snap = FLEET_SNAPSHOT.find(t => t.locos.includes(a.name));
        if (ptcStateFilter === 'FAILED') return a.etcState === 'FAILED';
        return snap?.ptcState === ptcStateFilter;
      });
    }
    // Sort
    list = [...list].sort((a, b) => {
      let av: string | number = 0, bv: string | number = 0;
      if (sortKey === 'name') { av = a.name; bv = b.name; }
      else if (sortKey === 'status') { const o = { critical: 3, warning: 2, info: 1, operational: 0 }; av = o[a.status] ?? 0; bv = o[b.status] ?? 0; }
      else if (sortKey === 'subdivision') { av = a.subdivision; bv = b.subdivision; }
      else if (sortKey === 'position') { av = a.position ?? ''; bv = b.position ?? ''; }
      else if (sortKey === 'ptcMissionCritical') { av = a.ptcMissionCritical ? 1 : 0; bv = b.ptcMissionCritical ? 1 : 0; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [locos, search, safetyFilter, ptcStateFilter, sortKey, sortDir]);

  const filteredWIUs = useMemo(() => {
    let list = wius;
    if (search) list = list.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.subdivision.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [wius, search]);

  // Summary counts
  const totalLocos = locos.length;
  const criticalLocos = locos.filter(a => a.status === 'critical').length;
  const bypassLocos = locos.filter(a => {
    const snap = FLEET_SNAPSHOT.find(t => t.locos.includes(a.name));
    return snap?.ptcState === 'BYPASS';
  }).length;
  const etcAtpCount = locos.filter(a => getSafetySystem(a.subdivision) === 'ETC-ATP').length;
  const etcDasCount = locos.filter(a => getSafetySystem(a.subdivision) === 'ETC-DAS').length;
  const ptcCount = locos.filter(a => getSafetySystem(a.subdivision) === 'PTC').length;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fleet Asset Monitoring</h1>
            <p className="text-sm text-muted-foreground mt-0.5">CN Rail OT · OWL · CARMA · WASP · {totalLocos} Locomotives Matching</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">AUTO REFRESH</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          </div>
        </div>

        {/* Summary KPI bar */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Total Locos', value: totalLocos, color: 'text-foreground' },
            { label: 'Critical', value: criticalLocos, color: 'text-red-400' },
            { label: 'ETC-ATP Locos', value: etcAtpCount, color: 'text-cyan-400' },
            { label: 'ETC-DAS Locos', value: etcDasCount, color: 'text-teal-400' },
            { label: 'PTC Locos', value: ptcCount, color: 'text-amber-400' },
            { label: 'BYPASS Active', value: bypassLocos, color: bypassLocos > 0 ? 'text-red-400' : 'text-muted-foreground' },
          ].map(k => (
            <div key={k.label} className="rounded border border-border bg-muted/10 p-3">
              <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search loco, location, subdivision…"
              className="pl-8 pr-3 py-1.5 text-[12px] bg-muted/20 border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500 w-64"
            />
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'locomotive', 'wayside', 'radio', 'crossing'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 text-[10px] rounded border transition-colors ${typeFilter === t ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'ETC-ATP', 'ETC-DAS', 'PTC'] as const).map(s => (
              <button key={s} onClick={() => setSafetyFilter(s)}
                className={`px-2.5 py-1 text-[10px] rounded border transition-colors ${safetyFilter === s ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                {s === 'all' ? 'All Systems' : s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'ACTIVE', 'BYPASS', 'SUPPRESSED', 'FAILED'] as const).map(s => (
              <button key={s} onClick={() => setPtcStateFilter(s)}
                className={`px-2.5 py-1 text-[10px] rounded border transition-colors ${ptcStateFilter === s ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                {s === 'all' ? 'All States' : s}
              </button>
            ))}
          </div>
        </div>

        {/* ── LVVR Fleet Summary Bar ── */}
        {(typeFilter === 'all' || typeFilter === 'locomotive') && (() => {
          const lvvrLocos = locos.filter(a => a.lvvr);
          const lvvrFaults = lvvrLocos.filter(a => {
            const l = a.lvvr!;
            return !l.suppressionReason && (
              !l.agentResponsive ||
              l.ldvrHealth === 'FAIL' ||
              (l.erNotOperationalCount !== undefined && l.erNotOperationalCount >= 3) ||
              (l.cameras && l.cameras.some((c: LVVRCamera) => c.state === 'Fault')) ||
              !l.chmConnected || l.chmPartitions.some((p: LVVRDrivePartition) => p.usagePct >= 90) ||
              !l.ssdConnected || l.ssdPartitions.some((p: LVVRDrivePartition) => p.usagePct >= 90)
            );
          });
          const lvvrSuppressed = lvvrLocos.filter(a => !!a.lvvr!.suppressionReason);
          const lvvrHealthy = lvvrLocos.filter(a => !a.lvvr!.suppressionReason && !lvvrFaults.includes(a));
          const cameraFaults = lvvrLocos.filter(a => a.lvvr?.cameras?.some(c => c.state === 'Fault') && !a.lvvr?.suppressionReason);
          const chmFaults = lvvrLocos.filter(a => a.lvvr && (!a.lvvr.chmConnected || a.lvvr.chmPartitions.some((p: LVVRDrivePartition) => p.usagePct >= 90)) && !a.lvvr?.suppressionReason);
          const ssdFaults = lvvrLocos.filter(a => a.lvvr && (!a.lvvr.ssdConnected || a.lvvr.ssdPartitions.some((p: LVVRDrivePartition) => p.usagePct >= 90)) && !a.lvvr?.suppressionReason);
          return (
            <div className="rounded border border-border bg-card/40 p-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Eye size={12} className="text-[#D22630]" />
                <span className="text-[10px] font-semibold text-foreground uppercase tracking-widest">LVVR Fleet Health</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-emerald-400">{lvvrHealthy.length}</span>
                <span className="text-[10px] text-muted-foreground">Healthy</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-red-400">{lvvrFaults.length}</span>
                <span className="text-[10px] text-muted-foreground">Faults</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-sky-400">{lvvrSuppressed.length}</span>
                <span className="text-[10px] text-muted-foreground">Suppressed</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-3">
                {cameraFaults.length > 0 && <span className="text-[10px] text-amber-400">{cameraFaults.length} Camera</span>}
                {chmFaults.length > 0 && <span className="text-[10px] text-amber-400">{chmFaults.length} CHM</span>}
                {ssdFaults.length > 0 && <span className="text-[10px] text-amber-400">{ssdFaults.length} SSD</span>}
                {cameraFaults.length === 0 && chmFaults.length === 0 && ssdFaults.length === 0 && <span className="text-[10px] text-emerald-400">No active LVVR faults</span>}
              </div>
              <div className="ml-auto text-[9px] text-muted-foreground">LOBS-11781 · Suppression rules applied</div>
            </div>
          );
        })()}

        {/* ── Locomotive Fleet Table ── */}
        {(typeFilter === 'all' || typeFilter === 'locomotive') && (
          <div className="rounded border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Train size={14} className="text-sky-400" />
                <span className="text-[11px] font-semibold text-foreground">Locomotives — {filteredLocos.length} / {totalLocos} matching</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-muted/10 border-b border-border">
                  <tr>
                    <th className="w-6" />
                    <SortTh label="Loco ID" sortKey="name" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">PTC State</th>
                    <SortTh label="PTC M.C." sortKey="ptcMissionCritical" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Phys. Status</th>
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Op. Code</th>
                    <SortTh label="Pos." sortKey="position" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortTh label="Status" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Model</th>
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Class</th>
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Last H.B.</th>
                    <SortTh label="Location" sortKey="subdivision" current={sortKey} dir={sortDir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {filteredLocos.map(asset => (
                    <LocoTableRow
                      key={asset.id}
                      asset={asset}
                      expanded={expandedIds.has(asset.id)}
                      onToggle={() => toggleExpand(asset.id)}
                    />
                  ))}
                  {filteredLocos.length === 0 && (
                    <tr><td colSpan={12} className="py-8 text-center text-[12px] text-muted-foreground">No locomotives match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── WIU Table ── */}
        {(typeFilter === 'all' || typeFilter === 'wayside') && (
          <div className="rounded border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center gap-2">
              <MapPin size={14} className="text-amber-400" />
              <span className="text-[11px] font-semibold text-foreground">Wayside Interface Units — {filteredWIUs.length} matching</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-muted/10 border-b border-border">
                  <tr>
                    <th className="w-6" />
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">WIU ID</th>
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Status Badges</th>
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Subdivision</th>
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Milepost</th>
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Last H.B.</th>
                    <th className="py-2 px-2 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWIUs.map(asset => (
                    <WIUTableRow
                      key={asset.id}
                      asset={asset}
                      expanded={expandedIds.has(asset.id)}
                      onToggle={() => toggleExpand(asset.id)}
                    />
                  ))}
                  {filteredWIUs.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-[12px] text-muted-foreground">No WIUs match the current filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Other Assets (Radio, Crossing, ATIP) ── */}
        {(typeFilter === 'all' || ['radio', 'crossing', 'atip'].includes(typeFilter)) && others.length > 0 && (
          <div className="rounded border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/20 border-b border-border flex items-center gap-2">
              <Radio size={14} className="text-purple-400" />
              <span className="text-[11px] font-semibold text-foreground">Radio Sites, Crossings & ATIP — {others.length} assets</span>
            </div>
            <div className="divide-y divide-border/40">
              {others.map(asset => (
                <div key={asset.id} className="flex items-center gap-4 px-4 py-2.5 hover:bg-muted/10">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${asset.status === 'critical' ? 'bg-red-500' : asset.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="text-[12px] font-medium text-foreground w-44 shrink-0">{asset.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground">{asset.type}</span>
                  <span className="text-[11px] text-muted-foreground">{asset.subdivision}{asset.milepost ? ` · MP ${asset.milepost}` : ''}</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">{asset.lastSeen}</span>
                  {Object.entries(asset.details).slice(0, 3).map(([k, v]) => (
                    <span key={k} className="text-[10px] text-muted-foreground hidden xl:block">{k}: <span className="text-foreground/70">{v}</span></span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

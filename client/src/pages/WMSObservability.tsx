import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  GitBranch,
  Wifi,
  Server,
  Radio,
  Bell,
  BellOff,
  Clock,
  Mail,
  ChevronDown,
  ChevronRight,
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Signal,
  Thermometer,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const GIT_SYNC = {
  lastSync: "2026-05-05 07:42:11",
  commitHash: "a3f9c12",
  status: "OK" as "OK" | "FAILED" | "STALE",
  nextSync: "2026-05-05 07:57:11",
};

const IP_ALERTS = [
  {
    id: "IPA-001",
    timestamp: "2026-05-05 07:38:44",
    ip: "192.168.45.201",
    site: "BALA-MP112",
    port: 8002,
    protocol: "TCP",
    direction: "Inbound",
    severity: "CRITICAL" as const,
    type: "UNAUTHORIZED",
    status: "OPEN",
    acknowledged: false,
  },
  {
    id: "IPA-002",
    timestamp: "2026-05-05 06:55:12",
    ip: "10.44.22.88",
    site: "RUEL-MP044",
    port: 8001,
    protocol: "TCP",
    direction: "Inbound",
    severity: "WARNING" as const,
    type: "FOREIGN_RAILROAD",
    foreignRR: "CP Rail",
    status: "OPEN",
    acknowledged: false,
  },
  {
    id: "IPA-003",
    timestamp: "2026-05-05 05:12:33",
    ip: "172.16.88.14",
    site: "KINGSTON-MP088",
    port: 22,
    protocol: "TCP",
    direction: "Inbound",
    severity: "CRITICAL" as const,
    type: "UNAUTHORIZED",
    status: "ACKNOWLEDGED",
    acknowledged: true,
  },
  {
    id: "IPA-004",
    timestamp: "2026-05-04 23:44:07",
    ip: "10.55.33.99",
    site: "CAPREOL-MP201",
    port: 8002,
    protocol: "TCP",
    direction: "Inbound",
    severity: "WARNING" as const,
    type: "FOREIGN_RAILROAD",
    foreignRR: "BNSF",
    status: "RESOLVED",
    acknowledged: true,
  },
];

const IP_REGISTRY = [
  { site: "BALA-MP112", ips: ["10.12.44.5", "10.12.44.6", "192.168.1.100"], syncHash: "a3f9c12", syncTime: "2026-05-05 07:42:11" },
  { site: "RUEL-MP044", ips: ["10.12.55.8", "10.12.55.9"], syncHash: "a3f9c12", syncTime: "2026-05-05 07:42:11" },
  { site: "KINGSTON-MP088", ips: ["10.12.66.12", "10.12.66.13", "10.12.66.14"], syncHash: "a3f9c12", syncTime: "2026-05-05 07:42:11" },
  { site: "CAPREOL-MP201", ips: ["10.12.77.20", "10.12.77.21"], syncHash: "a3f9c12", syncTime: "2026-05-05 07:42:11" },
  { site: "BALA-MP156", ips: ["10.12.44.30"], syncHash: "a3f9c12", syncTime: "2026-05-05 07:42:11" },
];

const COBRA_ISSUES = [
  {
    id: "CBR-001",
    type: "CELL_MODEM_SLOT_MISMATCH",
    site: "RUEL-MP044",
    description: "Cell Modem 0 reported DOWN — site only has Cell 1 card installed",
    status: "SUPPRESSED",
    tag: "SUPPRESSED: SLOT_NOT_INSTALLED",
    detectedAt: "2026-05-05 06:10:22",
    resolvedAt: null,
    restartScheduled: true,
    restartWindow: "2026-05-05 22:00:00",
  },
  {
    id: "CBR-002",
    type: "STUCK_ALARM_MSG_RATE",
    site: "BALA-MP112",
    description: "Current Message Send Rate alarm stuck open — metric normalized 18 min ago",
    status: "AUTO_CLEARED",
    tag: "AUTO_CLEARED: METRIC_NORMALIZED",
    detectedAt: "2026-05-05 05:44:00",
    resolvedAt: "2026-05-05 06:02:00",
    restartScheduled: true,
    restartWindow: "2026-05-05 22:00:00",
  },
  {
    id: "CBR-003",
    type: "DSB_FSB_MISMATCH",
    site: "KINGSTON-MP088",
    description: "Dynamic Short Broadcast alert triggered — site is configured as FSB. Ref: INC0846705",
    status: "SUPPRESSED",
    tag: "SUPPRESSED: SITE_TYPE_MISMATCH",
    detectedAt: "2026-05-05 04:55:10",
    resolvedAt: null,
    restartScheduled: true,
    restartWindow: "2026-05-05 22:00:00",
  },
  {
    id: "CBR-004",
    type: "WIU_PORT_NOT_CONFIGURED",
    site: "CAPREOL-MP201",
    description: "WIU(L8001):DOWN alert — site only has WIU on L8002",
    status: "SUPPRESSED",
    tag: "SUPPRESSED: PORT_NOT_CONFIGURED",
    detectedAt: "2026-05-05 03:22:44",
    resolvedAt: null,
    restartScheduled: false,
    restartWindow: null,
  },
  {
    id: "CBR-005",
    type: "SNMP_DAEMON_DOWN",
    site: "BALA-MP156",
    description: "SNMP Trap Daemon not running — last seen 2026-05-04 22:11:00",
    status: "OPEN",
    tag: "SNMP_DAEMON_DOWN",
    detectedAt: "2026-05-05 07:15:00",
    resolvedAt: null,
    restartScheduled: true,
    restartWindow: "2026-05-05 07:30:00",
  },
  {
    id: "CBR-006",
    type: "SNMP_PIPE_SIZE_EXCEEDED",
    site: "RUEL-MP044",
    description: "cobra_snmp-WIU.pipe is 1.2 GB — growth rate 45 MB/hr. Rotation to /data/snmp-archive scheduled.",
    status: "OPEN",
    tag: "SNMP_PIPE_SIZE_EXCEEDED",
    detectedAt: "2026-05-05 06:30:00",
    resolvedAt: null,
    restartScheduled: false,
    restartWindow: null,
  },
];

const SUPPRESSED_ALERTS = [
  {
    id: "SUP-001",
    type: "WIU SSH daily max rate exceeded",
    site: "KINGSTON-MP088",
    reason: "Active change window: WIU configuration for CTC (CHG0012345)",
    suppressedAt: "2026-05-05 06:00:00",
    expiresAt: "2026-05-05 10:00:00",
    tag: "SUPPRESSED: CHANGE_WINDOW",
  },
];

const CELL_MODEMS = [
  {
    site: "BALA-MP112",
    slot: "Cell 1",
    rsrp: -98,
    rsrq: -11,
    sinr: 4.2,
    rssi: -75,
    band: "B4",
    rat: "LTE",
    regState: "Home",
    pdpActive: true,
    simStatus: "OK",
    apn: "cn-ptc.apn",
    temp: 42,
    resets: 0,
    firmware: "RG500Q-EA_V2.03",
    uptime: "14d 6h",
    txBytes: "2.1 GB",
    rxBytes: "840 MB",
    latency: 28,
    status: "OK" as const,
  },
  {
    site: "RUEL-MP044",
    slot: "Cell 1",
    rsrp: -114,
    rsrq: -14,
    sinr: -1.2,
    rssi: -90,
    band: "B12",
    rat: "LTE",
    regState: "Home",
    pdpActive: true,
    simStatus: "OK",
    apn: "cn-ptc.apn",
    temp: 55,
    resets: 3,
    firmware: "RG500Q-EA_V2.01",
    uptime: "2d 1h",
    txBytes: "450 MB",
    rxBytes: "210 MB",
    latency: 88,
    status: "DEGRADED" as const,
  },
  {
    site: "KINGSTON-MP088",
    slot: "Cell 0",
    rsrp: -88,
    rsrq: -9,
    sinr: 8.5,
    rssi: -65,
    band: "B2",
    rat: "LTE",
    regState: "Home",
    pdpActive: true,
    simStatus: "OK",
    apn: "cn-ptc.apn",
    temp: 38,
    resets: 0,
    firmware: "RG500Q-EA_V2.03",
    uptime: "22d 14h",
    txBytes: "5.8 GB",
    rxBytes: "2.1 GB",
    latency: 19,
    status: "OK" as const,
  },
  {
    site: "CAPREOL-MP201",
    slot: "Cell 1",
    rsrp: -122,
    rsrq: -16,
    sinr: -3.1,
    rssi: -95,
    band: "B12",
    rat: "LTE",
    regState: "Searching",
    pdpActive: false,
    simStatus: "OK",
    apn: "cn-ptc.apn",
    temp: 61,
    resets: 7,
    firmware: "RG500Q-EA_V1.99",
    uptime: "0d 4h",
    txBytes: "12 MB",
    rxBytes: "5 MB",
    latency: 0,
    status: "CRITICAL" as const,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SeverityBadge = ({ sev }: { sev: "CRITICAL" | "WARNING" | "OK" }) => {
  const map = {
    CRITICAL: "bg-red-900/60 text-red-300 border-red-700",
    WARNING: "bg-amber-900/60 text-amber-300 border-amber-700",
    OK: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
  };
  return <span className={`text-xs font-mono px-2 py-0.5 rounded border ${map[sev]}`}>{sev}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    OPEN: "bg-red-900/40 text-red-300 border-red-700",
    ACKNOWLEDGED: "bg-amber-900/40 text-amber-300 border-amber-700",
    RESOLVED: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
    SUPPRESSED: "bg-blue-900/40 text-blue-300 border-blue-700",
    "AUTO_CLEARED": "bg-purple-900/40 text-purple-300 border-purple-700",
  };
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${map[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status.replace("_", " ")}
    </span>
  );
};

const SignalBar = ({ value, min, max, warnBelow, critBelow, unit }: {
  value: number; min: number; max: number; warnBelow: number; critBelow: number; unit: string;
}) => {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const color = value <= critBelow ? "bg-red-500" : value <= warnBelow ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-foreground w-20 text-right">{value} {unit}</span>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WMSObservability() {
  const [expandedIpAlert, setExpandedIpAlert] = useState<string | null>(null);
  const [expandedCobra, setExpandedCobra] = useState<string | null>(null);
  const [expandedModem, setExpandedModem] = useState<string | null>(null);
  const [showRegistry, setShowRegistry] = useState(false);

  const openIpAlerts = IP_ALERTS.filter((a) => a.status === "OPEN").length;
  const openCobraIssues = COBRA_ISSUES.filter((c) => c.status === "OPEN").length;
  const criticalModems = CELL_MODEMS.filter((m) => m.status === "CRITICAL").length;
  const degradedModems = CELL_MODEMS.filter((m) => m.status === "DEGRADED").length;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-6 h-6 text-red-400" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            WMS Observability
          </h1>
        </div>
        <p className="text-muted-foreground text-sm ml-9">
          Wayside Management System — IP Security, COBRA Agent Health, Cellular Modem Intelligence
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Unauthorized IP Alerts", value: openIpAlerts, color: "text-red-400", icon: <Shield className="w-4 h-4" /> },
          { label: "COBRA Issues (Open)", value: openCobraIssues, color: "text-amber-400", icon: <AlertTriangle className="w-4 h-4" /> },
          { label: "Critical Modems", value: criticalModems, color: "text-red-400", icon: <Wifi className="w-4 h-4" /> },
          { label: "Degraded Modems", value: degradedModems, color: "text-amber-400", icon: <Signal className="w-4 h-4" /> },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              {k.icon}
              {k.label}
            </div>
            <div className={`text-3xl font-bold ${k.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="security">
        <TabsList className="bg-card border border-border mb-6">
          <TabsTrigger value="security" className="data-[state=active]:bg-red-900/40 data-[state=active]:text-red-300">
            <Shield className="w-4 h-4 mr-1.5" /> IP Security
          </TabsTrigger>
          <TabsTrigger value="cobra" className="data-[state=active]:bg-amber-900/40 data-[state=active]:text-amber-300">
            <AlertTriangle className="w-4 h-4 mr-1.5" /> COBRA Health
          </TabsTrigger>
          <TabsTrigger value="cell" className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-300">
            <Wifi className="w-4 h-4 mr-1.5" /> Cellular Modems
          </TabsTrigger>
          <TabsTrigger value="suppressed" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">
            <BellOff className="w-4 h-4 mr-1.5" /> Suppressed Alerts
          </TabsTrigger>
        </TabsList>

        {/* ── IP SECURITY TAB ── */}
        <TabsContent value="security">
          {/* Git Sync Status */}
          <div className="bg-card border border-border rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-sm font-semibold text-foreground">Git IP Registry</div>
                <div className="text-xs text-muted-foreground">
                  Last sync: {GIT_SYNC.lastSync} · Commit: <span className="font-mono text-foreground">{GIT_SYNC.commitHash}</span> · Next: {GIT_SYNC.nextSync}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> SYNCED
              </span>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-border text-foreground hover:bg-muted"
                onClick={() => toast.success("Git sync triggered — refreshing IP registry")}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-border text-foreground hover:bg-muted"
                onClick={() => setShowRegistry(!showRegistry)}
              >
                {showRegistry ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
                {showRegistry ? "Hide" : "View"} Registry
              </Button>
            </div>
          </div>

          {/* Registry Table */}
          {showRegistry && (
            <div className="bg-card border border-border rounded-lg p-4 mb-4">
              <div className="text-sm font-semibold text-foreground mb-3">Authorized IP Registry (from Git)</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-2 pr-4">Site</th>
                    <th className="text-left pb-2 pr-4">Authorized IPs</th>
                    <th className="text-left pb-2 pr-4">Commit</th>
                    <th className="text-left pb-2">Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {IP_REGISTRY.map((r) => (
                    <tr key={r.site} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-mono text-foreground">{r.site}</td>
                      <td className="py-2 pr-4 font-mono text-emerald-400">{r.ips.join(", ")}</td>
                      <td className="py-2 pr-4 font-mono text-muted-foreground">{r.syncHash}</td>
                      <td className="py-2 text-muted-foreground">{r.syncTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* IP Alerts */}
          <div className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Unauthorized / Foreign IP Alerts
            <span className="text-xs text-muted-foreground font-normal ml-1">— email notifications sent to PTC-messaging-support@cn.ca</span>
          </div>
          <div className="space-y-2">
            {IP_ALERTS.map((alert) => (
              <div key={alert.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/50"
                  onClick={() => setExpandedIpAlert(expandedIpAlert === alert.id ? null : alert.id)}
                >
                  <div className="flex-shrink-0">
                    {alert.type === "UNAUTHORIZED" ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-foreground">{alert.ip}</span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span className="text-foreground text-sm">{alert.site}</span>
                      <span className="text-muted-foreground text-xs">Port {alert.port}</span>
                      {alert.type === "FOREIGN_RAILROAD" && (
                        <span className="text-xs bg-amber-900/30 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded">
                          {alert.foreignRR}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {alert.timestamp}
                      <span>·</span>
                      <span>{alert.protocol} {alert.direction}</span>
                      <span>·</span>
                      <Mail className="w-3 h-3" /> Email sent
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SeverityBadge sev={alert.severity} />
                    <StatusBadge status={alert.status} />
                    {expandedIpAlert === alert.id ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {expandedIpAlert === alert.id && (
                  <div className="border-t border-border p-4 bg-background/50 text-xs space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><div className="text-muted-foreground mb-1">Timestamp</div><div className="font-mono text-foreground">{alert.timestamp}</div></div>
                      <div><div className="text-muted-foreground mb-1">Unauthorized IP</div><div className="font-mono text-red-400">{alert.ip}</div></div>
                      <div><div className="text-muted-foreground mb-1">Site</div><div className="font-mono text-foreground">{alert.site}</div></div>
                      <div><div className="text-muted-foreground mb-1">Port / Protocol</div><div className="font-mono text-foreground">{alert.port} / {alert.protocol}</div></div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Authorized IPs for {alert.site}</div>
                      <div className="font-mono text-emerald-400">
                        {IP_REGISTRY.find((r) => r.site === alert.site)?.ips.join(", ") ?? "No registry entry found"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs border-border text-foreground hover:bg-muted"
                        onClick={() => toast.success(`Alert ${alert.id} acknowledged`)}>
                        Acknowledge
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs border-border text-foreground hover:bg-muted"
                        onClick={() => toast.info("ServiceNow ticket created for investigation")}>
                        Create ServiceNow Ticket
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── COBRA HEALTH TAB ── */}
        <TabsContent value="cobra">
          <div className="text-sm text-muted-foreground mb-4 bg-card border border-border rounded-lg p-3">
            <span className="text-amber-400 font-semibold">Observability Insight:</span> All 6 known COBRA agent issues share a common pattern — a clean COBRA agent restart resolves the symptom. This page surfaces the root cause of each issue and schedules automatic restarts during maintenance windows, eliminating the need for manual intervention.
          </div>
          <div className="space-y-2">
            {COBRA_ISSUES.map((issue) => (
              <div key={issue.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/50"
                  onClick={() => setExpandedCobra(expandedCobra === issue.id ? null : issue.id)}
                >
                  <div className="flex-shrink-0">
                    {issue.status === "OPEN" ? (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    ) : issue.status === "AUTO_CLEARED" ? (
                      <CheckCircle2 className="w-5 h-5 text-purple-400" />
                    ) : (
                      <BellOff className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground font-medium truncate">{issue.description}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <Server className="w-3 h-3" /> {issue.site}
                      <span>·</span>
                      <Clock className="w-3 h-3" /> {issue.detectedAt}
                      {issue.restartScheduled && (
                        <>
                          <span>·</span>
                          <RotateCcw className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-400">Restart @ {issue.restartWindow}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={issue.status} />
                    {expandedCobra === issue.id ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {expandedCobra === issue.id && (
                  <div className="border-t border-border p-4 bg-background/50 text-xs space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div><div className="text-muted-foreground mb-1">Issue Type</div><div className="font-mono text-foreground">{issue.type}</div></div>
                      <div><div className="text-muted-foreground mb-1">Site</div><div className="font-mono text-foreground">{issue.site}</div></div>
                      <div><div className="text-muted-foreground mb-1">System Tag</div><div className="font-mono text-blue-300">{issue.tag}</div></div>
                      <div><div className="text-muted-foreground mb-1">Detected At</div><div className="font-mono text-foreground">{issue.detectedAt}</div></div>
                      <div><div className="text-muted-foreground mb-1">Resolved At</div><div className="font-mono text-foreground">{issue.resolvedAt ?? "—"}</div></div>
                      <div><div className="text-muted-foreground mb-1">Auto Restart</div><div className="font-mono text-amber-300">{issue.restartScheduled ? issue.restartWindow : "Not scheduled"}</div></div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs border-border text-foreground hover:bg-muted"
                        onClick={() => toast.success(`COBRA agent restart triggered for ${issue.site}`)}>
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restart COBRA Now
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs border-border text-foreground hover:bg-muted"
                        onClick={() => toast.info("ServiceNow ticket created")}>
                        Create ServiceNow Ticket
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── CELLULAR MODEMS TAB ── */}
        <TabsContent value="cell">
          <div className="space-y-3">
            {CELL_MODEMS.map((modem) => {
              const statusColor = modem.status === "CRITICAL" ? "border-red-700" : modem.status === "DEGRADED" ? "border-amber-700" : "border-border";
              return (
                <div key={modem.site} className={`bg-card border rounded-lg overflow-hidden ${statusColor}`}>
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/50"
                    onClick={() => setExpandedModem(expandedModem === modem.site ? null : modem.site)}
                  >
                    <Wifi className={`w-5 h-5 flex-shrink-0 ${modem.status === "CRITICAL" ? "text-red-400" : modem.status === "DEGRADED" ? "text-amber-400" : "text-emerald-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{modem.site}</span>
                        <span className="text-xs text-muted-foreground">{modem.slot}</span>
                        <span className="text-xs font-mono text-muted-foreground">{modem.rat} · {modem.band}</span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-4 gap-3 max-w-xl">
                        <div>
                          <div className="text-muted-foreground text-xs mb-0.5">RSRP</div>
                          <SignalBar value={modem.rsrp} min={-140} max={-44} warnBelow={-110} critBelow={-120} unit="dBm" />
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-0.5">SINR</div>
                          <SignalBar value={modem.sinr} min={-20} max={30} warnBelow={0} critBelow={-5} unit="dB" />
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-0.5">Latency</div>
                          <div className={`text-xs font-mono ${modem.latency === 0 ? "text-red-400" : modem.latency > 60 ? "text-amber-400" : "text-emerald-400"}`}>
                            {modem.latency === 0 ? "No response" : `${modem.latency} ms`}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-0.5">Reg State</div>
                          <div className={`text-xs font-mono ${modem.regState === "Home" ? "text-emerald-400" : modem.regState === "Roaming" ? "text-amber-400" : "text-red-400"}`}>
                            {modem.regState}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <SeverityBadge sev={modem.status === "OK" ? "OK" : modem.status === "DEGRADED" ? "WARNING" : "CRITICAL"} />
                      {expandedModem === modem.site ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  {expandedModem === modem.site && (
                    <div className="border-t border-border p-4 bg-background/50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                        {[
                          { label: "RSRP", value: `${modem.rsrp} dBm`, warn: modem.rsrp <= -110 },
                          { label: "RSRQ", value: `${modem.rsrq} dB`, warn: modem.rsrq <= -14 },
                          { label: "SINR", value: `${modem.sinr} dB`, warn: modem.sinr <= 0 },
                          { label: "RSSI", value: `${modem.rssi} dBm`, warn: false },
                          { label: "SIM Status", value: modem.simStatus, warn: modem.simStatus !== "OK" },
                          { label: "APN", value: modem.apn, warn: false },
                          { label: "PDP Active", value: modem.pdpActive ? "Yes" : "No", warn: !modem.pdpActive },
                          { label: "Modem Temp", value: `${modem.temp}°C`, warn: modem.temp > 55 },
                          { label: "Resets (24h)", value: String(modem.resets), warn: modem.resets >= 3 },
                          { label: "Firmware", value: modem.firmware, warn: false },
                          { label: "Uptime", value: modem.uptime, warn: false },
                          { label: "TX / RX", value: `${modem.txBytes} / ${modem.rxBytes}`, warn: false },
                        ].map((f) => (
                          <div key={f.label}>
                            <div className="text-muted-foreground mb-0.5">{f.label}</div>
                            <div className={`font-mono ${f.warn ? "text-red-400" : "text-foreground"}`}>{f.value}</div>
                          </div>
                        ))}
                      </div>
                      {(modem.status === "CRITICAL" || modem.status === "DEGRADED") && (
                        <div className="bg-red-950/30 border border-red-800/50 rounded p-3 text-xs text-red-300 mb-3">
                          <span className="font-semibold">Observability Insight: </span>
                          {modem.status === "CRITICAL"
                            ? `${modem.site} modem is in "${modem.regState}" state with ${modem.resets} resets in 24h. RSRP ${modem.rsrp} dBm and SINR ${modem.sinr} dB are both below critical thresholds. PDP context is inactive — PTC cellular channel is DOWN. Cross-reference with 220MHz radio health before dispatching field crew.`
                            : `${modem.site} modem RSRP ${modem.rsrp} dBm and SINR ${modem.sinr} dB are below warning thresholds. ${modem.resets} resets recorded — firmware version ${modem.firmware} may be a contributing factor (fleet standard is V2.03).`}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs border-border text-foreground hover:bg-muted"
                          onClick={() => toast.info("Modem diagnostic command sent via COBRA")}>
                          Run Diagnostic
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs border-border text-foreground hover:bg-muted"
                          onClick={() => toast.info("ServiceNow ticket created")}>
                          Create Ticket
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── SUPPRESSED ALERTS TAB ── */}
        <TabsContent value="suppressed">
          <div className="text-sm text-muted-foreground mb-4 bg-card border border-border rounded-lg p-3">
            <span className="text-blue-400 font-semibold">Alert Quality:</span> Alerts suppressed here are legitimate operational events that do not require NOC action. Suppression rules are context-aware — they reference change windows, site hardware inventory, and site configuration to distinguish noise from genuine issues.
          </div>
          <div className="space-y-2">
            {SUPPRESSED_ALERTS.map((s) => (
              <div key={s.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <BellOff className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{s.type}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.site}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.reason}</div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Suppressed: {s.suppressedAt}</span>
                      <span>·</span>
                      <span>Expires: {s.expiresAt}</span>
                      <span>·</span>
                      <span className="font-mono text-blue-300">{s.tag}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs border-border text-foreground hover:bg-muted flex-shrink-0"
                    onClick={() => toast.info("Suppression rule removed — alert will fire if condition recurs")}>
                    Remove Suppression
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

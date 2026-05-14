// mockData.ts — Enriched OT observability data
// Grounded in real CN Rail systems: CARMA, OWL, COBRA, WASP, I-ETMS, PDS, BOS, KES, GCP

export type Severity = 'critical' | 'warning' | 'info' | 'operational';
export type SystemTag = 'CARMA' | 'OWL' | 'COBRA' | 'PDS' | 'BOS' | 'KES' | 'I-ETMS' | 'GCP' | 'WASP' | 'ATIP' | 'COSMA';

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  system: SystemTag;
  loco?: string;
  subdivision?: string;
  milepost?: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved' | 'auto-resolved';
  tag: string;
  assignedTo: string;
  mttr?: number; // minutes
  aiResolved?: boolean;
}

export interface Asset {
  id: string;
  name: string;
  type: 'locomotive' | 'wayside' | 'crossing' | 'atip' | 'radio' | 'server';
  status: Severity;
  subdivision: string;
  milepost?: string;
  lastSeen: string;
  system: SystemTag;
  details: Record<string, string>;
}

export interface SyntheticTrace {
  id: string;
  locoId: string;
  seqNum: string;
  subdivision: string;
  startTime: string;
  hops: TraceHop[];
  status: 'complete' | 'degraded' | 'failed';
  latencyMs: number;
}

export interface TraceHop {
  name: string;
  system: string;
  timestampOffset: number; // ms from start
  status: 'ok' | 'slow' | 'failed';
  detail: string;
}

export interface KpiMetric {
  label: string;
  value: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'flat';
  trendValue: string;
  severity: Severity;
}

export interface SystemHealth {
  name: SystemTag;
  fullName: string;
  status: Severity;
  uptime: string;
  activeAlerts: number;
  lastEvent: string;
  layer: 'edge' | 'back-office' | 'cloud' | 'transport';
}

// ─── KPI Metrics ──────────────────────────────────────────────────────────────
export const kpiMetrics: KpiMetric[] = [
  { label: 'Active Incidents', value: 47, trend: 'up', trendValue: '+9 vs 1h ago', severity: 'warning' },
  { label: 'Avg MTTR', value: '14', unit: 'min', trend: 'down', trendValue: '-6 min vs last week', severity: 'warning' },
  { label: 'Locomotives Online', value: '1,438 / 1,489', trend: 'flat', trendValue: '96.6% fleet availability', severity: 'operational' },
  { label: 'PTC Compliance', value: '99.4', unit: '%', trend: 'up', trendValue: '+0.2% vs yesterday', severity: 'operational' },
  { label: 'Trip Optimizer Active', value: '1,121 / 1,438', trend: 'up', trendValue: '78.0% utilization', severity: 'info' },
  { label: 'AI Auto-Resolved', value: 63, unit: 'today', trend: 'up', trendValue: '+14 vs yesterday', severity: 'info' },
];

// ─── System Health ─────────────────────────────────────────────────────────────
export const systemHealth: SystemHealth[] = [
  { name: 'OWL', fullName: 'Operational Wayside & Locomotives', status: 'operational', uptime: '99.97%', activeAlerts: 3, lastEvent: '1 min ago', layer: 'back-office' },
  { name: 'CARMA', fullName: 'CN Autonomous Railway Monitoring App', status: 'operational', uptime: '99.93%', activeAlerts: 1, lastEvent: '2 min ago', layer: 'back-office' },
  { name: 'COBRA', fullName: 'Continuous Onsite Base Radio Agent', status: 'warning', uptime: '97.8%', activeAlerts: 7, lastEvent: '3 min ago', layer: 'edge' },
  { name: 'PDS', fullName: 'Precision Dispatch System', status: 'operational', uptime: '99.99%', activeAlerts: 0, lastEvent: '45 sec ago', layer: 'back-office' },
  { name: 'BOS', fullName: 'Back Office Server (I-ETMS)', status: 'warning', uptime: '99.71%', activeAlerts: 4, lastEvent: '5 min ago', layer: 'back-office' },
  { name: 'KES', fullName: 'Key Exchange Server', status: 'operational', uptime: '100%', activeAlerts: 0, lastEvent: '48 min ago', layer: 'back-office' },
  { name: 'I-ETMS', fullName: 'Interoperable Train Mgmt System', status: 'warning', uptime: '96.9%', activeAlerts: 11, lastEvent: '1 min ago', layer: 'edge' },
  { name: 'GCP', fullName: 'Google Cloud Platform (OT VMs)', status: 'operational', uptime: '99.98%', activeAlerts: 0, lastEvent: '8 min ago', layer: 'cloud' },
  { name: 'WASP', fullName: 'Wayside Asset Status Platform', status: 'operational', uptime: '99.5%', activeAlerts: 2, lastEvent: '11 min ago', layer: 'back-office' },
  { name: 'ATIP', fullName: 'Autonomous Track Inspection Program', status: 'info', uptime: '100%', activeAlerts: 0, lastEvent: '3 hr ago', layer: 'edge' },
  { name: 'COSMA', fullName: 'CN Operations Safety Monitoring App', status: 'operational', uptime: '99.88%', activeAlerts: 1, lastEvent: '18 min ago', layer: 'back-office' },
];

// ─── Active Incidents ──────────────────────────────────────────────────────────
export const incidents: Incident[] = [
  {
    id: 'INC-20250514-001',
    title: 'LIG Socket Disconnected — Locomotive CN 3864',
    severity: 'critical',
    system: 'OWL',
    loco: 'CN 3864',
    subdivision: 'Ruel',
    milepost: '142.3',
    timestamp: '2025-05-14T14:32:11Z',
    status: 'investigating',
    tag: 'LIG Failures',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-002',
    title: 'GPS Signal Lost — CN 5501 (Tunnel Zone)',
    severity: 'warning',
    system: 'I-ETMS',
    loco: 'CN 5501',
    subdivision: 'Bala',
    milepost: '88.7',
    timestamp: '2025-05-14T14:28:44Z',
    status: 'auto-resolved',
    tag: 'GPS Issues',
    assignedTo: 'AI Agent',
    mttr: 3,
    aiResolved: true,
  },
  {
    id: 'INC-20250514-003',
    title: 'Trip Optimizer Initialization Failure — CN 2271',
    severity: 'warning',
    system: 'I-ETMS',
    loco: 'CN 2271',
    subdivision: 'MacTier',
    timestamp: '2025-05-14T14:19:02Z',
    status: 'open',
    tag: 'NSR',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-004',
    title: 'WIU Device Offline — Capreol Subdivision MP 201',
    severity: 'critical',
    system: 'WASP',
    subdivision: 'Capreol',
    milepost: '201.0',
    timestamp: '2025-05-14T14:05:33Z',
    status: 'investigating',
    tag: 'OB to Wayside',
    assignedTo: 'Signals Team',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-005',
    title: 'COBRA Radio Site Degraded — Hornepayne',
    severity: 'warning',
    system: 'COBRA',
    subdivision: 'Ruel',
    milepost: '310.0',
    timestamp: '2025-05-14T13:58:17Z',
    status: 'investigating',
    tag: 'TMC Internal Faults',
    assignedTo: 'Telecom Team',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-006',
    title: 'BOS Polling Delay > 60s — Geographic BOS Instance 2',
    severity: 'warning',
    system: 'BOS',
    timestamp: '2025-05-14T13:44:09Z',
    status: 'open',
    tag: 'OB to Wayside',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-007',
    title: 'Wheel Tach Speed Invalid — CN 8012',
    severity: 'warning',
    system: 'I-ETMS',
    loco: 'CN 8012',
    subdivision: 'Kingston',
    timestamp: '2025-05-14T13:31:55Z',
    status: 'resolved',
    tag: 'Wheel Tach: Speed Invalid',
    assignedTo: 'Mechanical Team',
    mttr: 47,
    aiResolved: false,
  },
  {
    id: 'INC-20250514-008',
    title: 'GCP Pub/Sub Latency Spike — owl-telemetry-ingress',
    severity: 'info',
    system: 'GCP',
    timestamp: '2025-05-14T13:15:00Z',
    status: 'auto-resolved',
    tag: 'Cloud Infrastructure',
    assignedTo: 'AI Agent',
    mttr: 2,
    aiResolved: true,
  },
  {
    id: 'INC-20250514-009',
    title: 'NSR — CN 4412 (Kingston Sub MP 188.4)',
    severity: 'critical',
    system: 'I-ETMS',
    loco: 'CN 4412',
    subdivision: 'Kingston',
    milepost: '188.4',
    timestamp: '2025-05-14T12:55:22Z',
    status: 'investigating',
    tag: 'NSR',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-010',
    title: 'CDU Display Blank — CN 7701 (Ruel Sub)',
    severity: 'warning',
    system: 'OWL',
    loco: 'CN 7701',
    subdivision: 'Ruel',
    milepost: '79.9',
    timestamp: '2025-05-14T12:44:08Z',
    status: 'open',
    tag: 'CDU Issues',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-011',
    title: 'COBRA Site Offline — Jasper AB',
    severity: 'critical',
    system: 'COBRA',
    subdivision: 'Edson',
    milepost: '158.0',
    timestamp: '2025-05-14T12:30:44Z',
    status: 'investigating',
    tag: 'TMC Internal Faults',
    assignedTo: 'Telecom Team',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-012',
    title: 'BPP/EBI Fault — CN 9201 (Wainwright Sub)',
    severity: 'warning',
    system: 'I-ETMS',
    loco: 'CN 9201',
    subdivision: 'Wainwright',
    milepost: '122.4',
    timestamp: '2025-05-14T12:18:31Z',
    status: 'open',
    tag: 'BPP/EBI',
    assignedTo: 'Mechanical Team',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-013',
    title: 'GPS Constellation Degraded — 4 Locos Affected (Capreol Sub)',
    severity: 'warning',
    system: 'I-ETMS',
    subdivision: 'Capreol',
    timestamp: '2025-05-14T12:05:19Z',
    status: 'auto-resolved',
    tag: 'GPS Issues',
    assignedTo: 'AI Agent',
    mttr: 8,
    aiResolved: true,
  },
  {
    id: 'INC-20250514-014',
    title: 'KES Re-key Timeout — WIU MP 44.5 (Bala Sub)',
    severity: 'warning',
    system: 'KES',
    subdivision: 'Bala',
    milepost: '44.5',
    timestamp: '2025-05-14T11:51:03Z',
    status: 'resolved',
    tag: 'OB to Wayside',
    assignedTo: 'Signals Team',
    mttr: 22,
    aiResolved: false,
  },
  {
    id: 'INC-20250514-015',
    title: 'CARMA Threshold Drift — WILD MP 188.4 Kingston Sub',
    severity: 'info',
    system: 'CARMA',
    subdivision: 'Kingston',
    milepost: '188.4',
    timestamp: '2025-05-14T11:38:44Z',
    status: 'open',
    tag: 'OB to Wayside',
    assignedTo: 'Wayside Monitoring',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-016',
    title: 'NSR — CN 5812 (Edson Sub MP 80.2)',
    severity: 'critical',
    system: 'I-ETMS',
    loco: 'CN 5812',
    subdivision: 'Edson',
    milepost: '80.2',
    timestamp: '2025-05-14T11:22:17Z',
    status: 'investigating',
    tag: 'NSR',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-017',
    title: 'TMC Telemetry Overdue — CN 3301 (Ruel Sub)',
    severity: 'info',
    system: 'OWL',
    loco: 'CN 3301',
    subdivision: 'Ruel',
    timestamp: '2025-05-14T11:10:00Z',
    status: 'auto-resolved',
    tag: 'TMC Internal Faults',
    assignedTo: 'AI Agent',
    mttr: 4,
    aiResolved: true,
  },
  {
    id: 'INC-20250514-018',
    title: 'Crossing Gate Delay — MP 27.6 Bala Sub (Hwy 400)',
    severity: 'warning',
    system: 'WASP',
    subdivision: 'Bala',
    milepost: '27.6',
    timestamp: '2025-05-14T10:58:33Z',
    status: 'resolved',
    tag: 'OB to Wayside',
    assignedTo: 'Signals Team',
    mttr: 12,
    aiResolved: false,
  },
  {
    id: 'INC-20250514-019',
    title: 'COSMA Safety Event — Crew HOS Expiry (CRW-6644)',
    severity: 'critical',
    system: 'COSMA',
    subdivision: 'Rivers',
    timestamp: '2025-05-14T10:45:00Z',
    status: 'investigating',
    tag: 'NSR',
    assignedTo: 'Crew Management',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-020',
    title: 'I-ETMS Software Exception — CN 2743 (Bala Sub)',
    severity: 'warning',
    system: 'I-ETMS',
    loco: 'CN 2743',
    subdivision: 'Bala',
    milepost: '18.7',
    timestamp: '2025-05-14T10:31:11Z',
    status: 'open',
    tag: 'NSR',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-021',
    title: 'GCP BigQuery Export Delay — CARMA Analytics Pipeline',
    severity: 'info',
    system: 'GCP',
    timestamp: '2025-05-14T10:15:00Z',
    status: 'auto-resolved',
    tag: 'Cloud Infrastructure',
    assignedTo: 'AI Agent',
    mttr: 5,
    aiResolved: true,
  },
  {
    id: 'INC-20250514-022',
    title: 'WILD ALARM — TTX 891204 Axle B1 (Kingston Sub MP 144.8)',
    severity: 'critical',
    system: 'CARMA',
    subdivision: 'Kingston',
    milepost: '144.8',
    timestamp: '2025-05-14T09:58:44Z',
    status: 'investigating',
    tag: 'OB to Wayside',
    assignedTo: 'Mechanical — Car Dept',
    aiResolved: false,
  },
  {
    id: 'INC-20250514-023',
    title: 'BOS Instance 1 Failover — Primary → Secondary',
    severity: 'critical',
    system: 'BOS',
    timestamp: '2025-05-14T09:44:22Z',
    status: 'resolved',
    tag: 'OB to Wayside',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    mttr: 18,
    aiResolved: false,
  },
  {
    id: 'INC-20250514-024',
    title: 'NSR — CN 8801 (MacTier Sub MP 44.2)',
    severity: 'critical',
    system: 'I-ETMS',
    loco: 'CN 8801',
    subdivision: 'MacTier',
    milepost: '44.2',
    timestamp: '2025-05-14T09:30:08Z',
    status: 'resolved',
    tag: 'NSR',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    mttr: 31,
    aiResolved: false,
  },
];

// ─── Synthetic Traces ──────────────────────────────────────────────────────────
export const syntheticTraces: SyntheticTrace[] = [
  {
    id: 'TRC-001',
    locoId: 'CN 3864',
    seqNum: 'PTC-SEQ-88421',
    subdivision: 'Ruel',
    startTime: '14:32:08',
    status: 'failed',
    latencyMs: 0,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, status: 'ok', detail: 'Sent PTC msg #88421' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 120, status: 'ok', detail: 'Signal: -72 dBm (nominal)' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 340, status: 'ok', detail: 'Routed via Hornepayne site' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 0, status: 'failed', detail: 'Message not received — LIG socket closed' },
    ],
  },
  {
    id: 'TRC-002',
    locoId: 'CN 5501',
    seqNum: 'PTC-SEQ-77103',
    subdivision: 'Bala',
    startTime: '14:28:41',
    status: 'complete',
    latencyMs: 890,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, status: 'ok', detail: 'Sent PTC msg #77103' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 210, status: 'ok', detail: 'Signal: -68 dBm' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 450, status: 'ok', detail: 'Routed via Barrie site' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 890, status: 'ok', detail: 'Acknowledged — authority granted' },
    ],
  },
  {
    id: 'TRC-003',
    locoId: 'CN 2271',
    seqNum: 'PTC-SEQ-91204',
    subdivision: 'MacTier',
    startTime: '14:19:00',
    status: 'degraded',
    latencyMs: 4200,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, status: 'ok', detail: 'Sent PTC msg #91204' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 180, status: 'ok', detail: 'Signal: -74 dBm' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 520, status: 'slow', detail: 'Queue delay: 1,800ms (threshold: 500ms)' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 4200, status: 'slow', detail: 'Received after 4.2s — Trip Optimizer timeout' },
    ],
  },
  {
    id: 'TRC-004',
    locoId: 'CN 4412',
    seqNum: 'PTC-SEQ-55812',
    subdivision: 'Kingston',
    startTime: '12:55:18',
    status: 'failed',
    latencyMs: 0,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, status: 'ok', detail: 'Sent PTC msg #55812' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 95, status: 'ok', detail: 'Signal: -69 dBm' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 280, status: 'ok', detail: 'Routed via Napanee site' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 0, status: 'failed', detail: 'NSR — No status received from onboard I-ETMS' },
    ],
  },
  {
    id: 'TRC-005',
    locoId: 'CN 7701',
    seqNum: 'PTC-SEQ-33901',
    subdivision: 'Ruel',
    startTime: '12:44:05',
    status: 'degraded',
    latencyMs: 6800,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, status: 'ok', detail: 'Sent PTC msg #33901' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 310, status: 'slow', detail: 'Signal: -88 dBm (marginal)' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 1200, status: 'slow', detail: 'Hornepayne site degraded — queue backup' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 6800, status: 'slow', detail: 'Received after 6.8s — CDU display blank, crew unaware' },
    ],
  },
  {
    id: 'TRC-006',
    locoId: 'CN 9201',
    seqNum: 'PTC-SEQ-44120',
    subdivision: 'Wainwright',
    startTime: '12:18:28',
    status: 'complete',
    latencyMs: 720,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, status: 'ok', detail: 'Sent PTC msg #44120' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 140, status: 'ok', detail: 'Signal: -71 dBm' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 390, status: 'ok', detail: 'Routed via Wainwright site' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 720, status: 'ok', detail: 'Acknowledged — authority granted' },
    ],
  },
  {
    id: 'TRC-007',
    locoId: 'CN 5812',
    seqNum: 'PTC-SEQ-66334',
    subdivision: 'Edson',
    startTime: '11:22:14',
    status: 'failed',
    latencyMs: 0,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, status: 'ok', detail: 'Sent PTC msg #66334' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 88, status: 'ok', detail: 'Signal: -75 dBm' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 0, status: 'failed', detail: 'Jasper COBRA site offline — no route available' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 0, status: 'failed', detail: 'Message never delivered — NSR raised' },
    ],
  },
  {
    id: 'TRC-008',
    locoId: 'CN 2743',
    seqNum: 'PTC-SEQ-22811',
    subdivision: 'Bala',
    startTime: '10:31:08',
    status: 'complete',
    latencyMs: 1050,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, status: 'ok', detail: 'Sent PTC msg #22811' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 200, status: 'ok', detail: 'Signal: -70 dBm' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 560, status: 'ok', detail: 'Routed via Barrie site' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 1050, status: 'ok', detail: 'Acknowledged — authority granted' },
    ],
  },
];

// ─── Asset Inventory ───────────────────────────────────────────────────────────
export const assets: Asset[] = [
  { id: 'LOCO-3864', name: 'CN 3864', type: 'locomotive', status: 'critical', subdivision: 'Ruel', milepost: '142.3', lastSeen: '2 min ago', system: 'OWL', details: { 'PTC State': 'Enforcement', 'LIG': 'Disconnected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Inactive' } },
  { id: 'LOCO-5501', name: 'CN 5501', type: 'locomotive', status: 'operational', subdivision: 'Bala', milepost: '88.7', lastSeen: '30 sec ago', system: 'OWL', details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Active' } },
  { id: 'LOCO-2271', name: 'CN 2271', type: 'locomotive', status: 'warning', subdivision: 'MacTier', lastSeen: '1 min ago', system: 'OWL', details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Failed Init' } },
  { id: 'LOCO-8012', name: 'CN 8012', type: 'locomotive', status: 'operational', subdivision: 'Kingston', lastSeen: '45 sec ago', system: 'OWL', details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Active' } },
  { id: 'LOCO-4412', name: 'CN 4412', type: 'locomotive', status: 'critical', subdivision: 'Kingston', milepost: '188.4', lastSeen: '5 min ago', system: 'OWL', details: { 'PTC State': 'NSR', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Inactive' } },
  { id: 'LOCO-7701', name: 'CN 7701', type: 'locomotive', status: 'warning', subdivision: 'Ruel', milepost: '79.9', lastSeen: '3 min ago', system: 'OWL', details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'CDU': 'Blank' } },
  { id: 'LOCO-9201', name: 'CN 9201', type: 'locomotive', status: 'warning', subdivision: 'Wainwright', milepost: '122.4', lastSeen: '2 min ago', system: 'OWL', details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'BPP': 'Fault' } },
  { id: 'LOCO-5812', name: 'CN 5812', type: 'locomotive', status: 'critical', subdivision: 'Edson', milepost: '80.2', lastSeen: '8 min ago', system: 'OWL', details: { 'PTC State': 'NSR', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Inactive' } },
  { id: 'LOCO-2743', name: 'CN 2743', type: 'locomotive', status: 'operational', subdivision: 'Bala', milepost: '18.7', lastSeen: '1 min ago', system: 'OWL', details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Active' } },
  { id: 'LOCO-8801', name: 'CN 8801', type: 'locomotive', status: 'operational', subdivision: 'MacTier', milepost: '44.2', lastSeen: '20 min ago', system: 'OWL', details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Active' } },
  { id: 'WIU-CAP-201', name: 'WIU Capreol MP 201', type: 'wayside', status: 'critical', subdivision: 'Capreol', milepost: '201.0', lastSeen: '28 min ago', system: 'WASP', details: { 'Device Type': 'WIU', 'Last Heartbeat': '28 min ago', 'Power': 'Unknown', 'Comms': 'Offline' } },
  { id: 'WIU-BAL-44', name: 'WIU Bala MP 44.5', type: 'wayside', status: 'warning', subdivision: 'Bala', milepost: '44.5', lastSeen: '2 min ago', system: 'WASP', details: { 'Device Type': 'WIU', 'Last Heartbeat': '2 min ago', 'Power': 'OK', 'Comms': 'KES re-key in progress' } },
  { id: 'WIU-KIN-188', name: 'WIU Kingston MP 188.4', type: 'wayside', status: 'operational', subdivision: 'Kingston', milepost: '188.4', lastSeen: '1 min ago', system: 'WASP', details: { 'Device Type': 'WIU', 'Last Heartbeat': '1 min ago', 'Power': 'OK', 'Comms': 'Nominal' } },
  { id: 'RADIO-HORN', name: 'Hornepayne Radio Site', type: 'radio', status: 'warning', subdivision: 'Ruel', milepost: '310.0', lastSeen: '4 min ago', system: 'COBRA', details: { 'RSSI': '-81 dBm (degraded)', 'Uptime': '97.8%', 'Active Locos': '4', 'Backhaul': 'Nominal' } },
  { id: 'RADIO-JASP', name: 'Jasper Radio Site', type: 'radio', status: 'critical', subdivision: 'Edson', milepost: '158.0', lastSeen: '12 min ago', system: 'COBRA', details: { 'RSSI': 'N/A', 'Uptime': '0% (offline)', 'Active Locos': '0', 'Backhaul': 'Down' } },
  { id: 'RADIO-NAPA', name: 'Napanee Radio Site', type: 'radio', status: 'operational', subdivision: 'Kingston', milepost: '144.8', lastSeen: '30 sec ago', system: 'COBRA', details: { 'RSSI': '-68 dBm', 'Uptime': '99.9%', 'Active Locos': '2', 'Backhaul': 'Nominal' } },
  { id: 'RADIO-BARR', name: 'Barrie Radio Site', type: 'radio', status: 'operational', subdivision: 'Bala', milepost: '44.1', lastSeen: '45 sec ago', system: 'COBRA', details: { 'RSSI': '-71 dBm', 'Uptime': '99.7%', 'Active Locos': '3', 'Backhaul': 'Nominal' } },
  { id: 'CROSS-BAL-27', name: 'Crossing MP 27.6 (Hwy 400)', type: 'crossing', status: 'warning', subdivision: 'Bala', milepost: '27.6', lastSeen: '10 min ago', system: 'WASP', details: { 'Gate Delay': '4.2s (threshold: 2.0s)', 'Last Activation': '10 min ago', 'Status': 'Alert raised' } },
  { id: 'CROSS-KIN-100', name: 'Crossing MP 100.2 (Hwy 401)', type: 'crossing', status: 'operational', subdivision: 'Kingston', milepost: '100.2', lastSeen: '5 min ago', system: 'WASP', details: { 'Gate Delay': '1.6s', 'Last Activation': '5 min ago', 'Status': 'Normal' } },
  { id: 'ATIP-CAR-01', name: 'ATIP Car 01', type: 'atip', status: 'operational', subdivision: 'Bala', lastSeen: '3 hr ago', system: 'ATIP', details: { 'Last Run': 'Bala Sub MP 0–150', 'Defects Found': '2 (low severity)', 'Next Run': 'Scheduled 06:00' } },
  { id: 'ATIP-CAR-02', name: 'ATIP Car 02', type: 'atip', status: 'info', subdivision: 'Kingston', lastSeen: '6 hr ago', system: 'ATIP', details: { 'Last Run': 'Kingston Sub MP 0–220', 'Defects Found': '4 (2 medium, 2 low)', 'Next Run': 'Scheduled tomorrow 04:00' } },
];

// ─── Incident Trend Data (last 12 months) ─────────────────────────────────────
export const incidentTrendData = [
  { month: 'May 24', total: 82, critical: 12, aiResolved: 0 },
  { month: 'Jun 24', total: 95, critical: 15, aiResolved: 0 },
  { month: 'Jul 24', total: 110, critical: 18, aiResolved: 2 },
  { month: 'Aug 24', total: 128, critical: 21, aiResolved: 5 },
  { month: 'Sep 24', total: 145, critical: 19, aiResolved: 9 },
  { month: 'Oct 24', total: 162, critical: 24, aiResolved: 14 },
  { month: 'Nov 24', total: 188, critical: 28, aiResolved: 22 },
  { month: 'Dec 24', total: 201, critical: 31, aiResolved: 31 },
  { month: 'Jan 25', total: 245, critical: 35, aiResolved: 48 },
  { month: 'Feb 25', total: 268, critical: 33, aiResolved: 61 },
  { month: 'Mar 25', total: 312, critical: 38, aiResolved: 79 },
  { month: 'Apr 25', total: 325, critical: 41, aiResolved: 98 },
  { month: 'May 25', total: 47, critical: 8, aiResolved: 21 },
];

// ─── Tag Distribution ──────────────────────────────────────────────────────────
export const tagDistribution = [
  { tag: 'NSR', count: 1596, color: '#D22630' },
  { tag: 'GPS Issues', count: 288, color: '#F59E0B' },
  { tag: 'TMC Internal Faults', count: 161, color: '#EF4444' },
  { tag: 'LIG Failures', count: 136, color: '#F97316' },
  { tag: 'Wheel Tach: Speed Invalid', count: 108, color: '#FBBF24' },
  { tag: 'BPP/EBI', count: 91, color: '#A78BFA' },
  { tag: 'OB to Wayside', count: 89, color: '#38BDF8' },
  { tag: 'CDU Issues', count: 56, color: '#34D399' },
  { tag: 'Cloud Infrastructure', count: 44, color: '#818CF8' },
  { tag: 'Other', count: 324, color: '#475569' },
];

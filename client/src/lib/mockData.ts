// CN Rail OT Single Pane of Glass — Mock Data
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
  { label: 'Active Incidents', value: 23, trend: 'up', trendValue: '+4 vs 1h ago', severity: 'warning' },
  { label: 'Avg MTTR', value: '18', unit: 'min', trend: 'down', trendValue: '-12 min vs last week', severity: 'warning' },
  { label: 'Locomotives Online', value: '1,412 / 1,489', trend: 'flat', trendValue: '94.8% fleet availability', severity: 'operational' },
  { label: 'PTC Compliance', value: '99.2', unit: '%', trend: 'flat', trendValue: 'All subdivisions nominal', severity: 'operational' },
  { label: 'Trip Optimizer Active', value: '1,089 / 1,412', trend: 'up', trendValue: '77.1% utilization', severity: 'info' },
  { label: 'AI Auto-Resolved', value: 41, unit: 'today', trend: 'up', trendValue: '+8 vs yesterday', severity: 'info' },
];

// ─── System Health ─────────────────────────────────────────────────────────────
export const systemHealth: SystemHealth[] = [
  { name: 'OWL', fullName: 'Operational Wayside & Locomotives', status: 'operational', uptime: '99.97%', activeAlerts: 2, lastEvent: '2 min ago', layer: 'back-office' },
  { name: 'CARMA', fullName: 'CN Autonomous Railway Monitoring App', status: 'operational', uptime: '99.91%', activeAlerts: 0, lastEvent: '1 min ago', layer: 'back-office' },
  { name: 'COBRA', fullName: 'Continuous Onsite Base Radio Agent', status: 'warning', uptime: '98.4%', activeAlerts: 5, lastEvent: '4 min ago', layer: 'edge' },
  { name: 'PDS', fullName: 'Precision Dispatch System', status: 'operational', uptime: '99.99%', activeAlerts: 0, lastEvent: '30 sec ago', layer: 'back-office' },
  { name: 'BOS', fullName: 'Back Office Server (I-ETMS)', status: 'operational', uptime: '99.85%', activeAlerts: 1, lastEvent: '8 min ago', layer: 'back-office' },
  { name: 'KES', fullName: 'Key Exchange Server', status: 'operational', uptime: '100%', activeAlerts: 0, lastEvent: '1 hr ago', layer: 'back-office' },
  { name: 'I-ETMS', fullName: 'Interoperable Train Mgmt System', status: 'warning', uptime: '97.2%', activeAlerts: 8, lastEvent: '1 min ago', layer: 'edge' },
  { name: 'GCP', fullName: 'Google Cloud Platform (OT VMs)', status: 'operational', uptime: '99.98%', activeAlerts: 0, lastEvent: '5 min ago', layer: 'cloud' },
  { name: 'WASP', fullName: 'Wayside Asset Status Platform', status: 'operational', uptime: '99.6%', activeAlerts: 1, lastEvent: '15 min ago', layer: 'back-office' },
  { name: 'ATIP', fullName: 'Autonomous Track Inspection Program', status: 'info', uptime: '100%', activeAlerts: 0, lastEvent: '2 hr ago', layer: 'edge' },
];

// ─── Active Incidents ──────────────────────────────────────────────────────────
export const incidents: Incident[] = [
  {
    id: 'INC-20240501-001',
    title: 'LIG Socket Disconnected — Locomotive CN 3864',
    severity: 'critical',
    system: 'OWL',
    loco: 'CN 3864',
    subdivision: 'Ruel',
    milepost: '142.3',
    timestamp: '2024-05-04T14:32:11Z',
    status: 'investigating',
    tag: 'LIG Failures',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
  {
    id: 'INC-20240501-002',
    title: 'GPS Signal Lost — CN 5501 (Tunnel Zone)',
    severity: 'warning',
    system: 'I-ETMS',
    loco: 'CN 5501',
    subdivision: 'Bala',
    milepost: '88.7',
    timestamp: '2024-05-04T14:28:44Z',
    status: 'auto-resolved',
    tag: 'GPS Issues',
    assignedTo: 'AI Agent',
    mttr: 3,
    aiResolved: true,
  },
  {
    id: 'INC-20240501-003',
    title: 'Trip Optimizer Initialization Failure — CN 2271',
    severity: 'warning',
    system: 'I-ETMS',
    loco: 'CN 2271',
    subdivision: 'MacTier',
    timestamp: '2024-05-04T14:19:02Z',
    status: 'open',
    tag: 'NSR',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
  {
    id: 'INC-20240501-004',
    title: 'WIU Device Offline — Capreol Subdivision MP 201',
    severity: 'critical',
    system: 'WASP',
    subdivision: 'Capreol',
    milepost: '201.0',
    timestamp: '2024-05-04T14:05:33Z',
    status: 'investigating',
    tag: 'OB to Wayside',
    assignedTo: 'Signals Team',
    aiResolved: false,
  },
  {
    id: 'INC-20240501-005',
    title: 'COBRA Radio Site Degraded — Hornepayne',
    severity: 'warning',
    system: 'COBRA',
    subdivision: 'Ruel',
    milepost: '310.0',
    timestamp: '2024-05-04T13:58:17Z',
    status: 'investigating',
    tag: 'TMC Internal Faults',
    assignedTo: 'Telecom Team',
    aiResolved: false,
  },
  {
    id: 'INC-20240501-006',
    title: 'BOS Polling Delay > 60s — Geographic BOS Instance 2',
    severity: 'warning',
    system: 'BOS',
    timestamp: '2024-05-04T13:44:09Z',
    status: 'open',
    tag: 'OB to Wayside',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
  {
    id: 'INC-20240501-007',
    title: 'Wheel Tach Speed Invalid — CN 8012',
    severity: 'warning',
    system: 'I-ETMS',
    loco: 'CN 8012',
    subdivision: 'Kingston',
    timestamp: '2024-05-04T13:31:55Z',
    status: 'resolved',
    tag: 'Wheel Tach: Speed Invalid',
    assignedTo: 'Mechanical Team',
    mttr: 47,
    aiResolved: false,
  },
  {
    id: 'INC-20240501-008',
    title: 'GCP Pub/Sub Latency Spike — owl-telemetry-ingress',
    severity: 'info',
    system: 'GCP',
    timestamp: '2024-05-04T13:15:00Z',
    status: 'auto-resolved',
    tag: 'Cloud Infrastructure',
    assignedTo: 'AI Agent',
    mttr: 2,
    aiResolved: true,
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
];

// ─── Asset Inventory ───────────────────────────────────────────────────────────
export const assets: Asset[] = [
  { id: 'LOCO-3864', name: 'CN 3864', type: 'locomotive', status: 'critical', subdivision: 'Ruel', milepost: '142.3', lastSeen: '2 min ago', system: 'OWL', details: { 'PTC State': 'Enforcement', 'LIG': 'Disconnected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Inactive' } },
  { id: 'LOCO-5501', name: 'CN 5501', type: 'locomotive', status: 'operational', subdivision: 'Bala', milepost: '88.7', lastSeen: '30 sec ago', system: 'OWL', details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Active' } },
  { id: 'LOCO-2271', name: 'CN 2271', type: 'locomotive', status: 'warning', subdivision: 'MacTier', lastSeen: '1 min ago', system: 'OWL', details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Failed Init' } },
  { id: 'LOCO-8012', name: 'CN 8012', type: 'locomotive', status: 'operational', subdivision: 'Kingston', lastSeen: '45 sec ago', system: 'OWL', details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Active' } },
  { id: 'WIU-CAP-201', name: 'WIU Capreol MP 201', type: 'wayside', status: 'critical', subdivision: 'Capreol', milepost: '201.0', lastSeen: '28 min ago', system: 'WASP', details: { 'Device Type': 'WIU', 'Last Heartbeat': '28 min ago', 'Power': 'Unknown', 'Comms': 'Offline' } },
  { id: 'RADIO-HORN', name: 'Hornepayne Radio Site', type: 'radio', status: 'warning', subdivision: 'Ruel', milepost: '310.0', lastSeen: '4 min ago', system: 'COBRA', details: { 'RSSI': '-81 dBm (degraded)', 'Uptime': '98.4%', 'Active Locos': '3', 'Backhaul': 'Nominal' } },
  { id: 'ATIP-CAR-01', name: 'ATIP Car 01', type: 'atip', status: 'operational', subdivision: 'Bala', lastSeen: '2 hr ago', system: 'ATIP', details: { 'Last Run': 'Bala Sub MP 0–150', 'Defects Found': '2 (low severity)', 'Next Run': 'Scheduled 06:00' } },
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
  { tag: 'Other', count: 368, color: '#475569' },
];

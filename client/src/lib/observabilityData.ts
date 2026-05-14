// CN Rail OT Observability — Predictive Alerts & Root Cause Explanation Data
// This module extends mockData.ts with the intelligence layer:
//   - Predictive alerts (threshold drift, correlated weak signals, synthetic trace latency)
//   - Root cause explanations (five-layer model: what, where, why, blast radius, action)

// ─── PREDICTIVE ALERT TYPES ────────────────────────────────────────────────────

export type PredictiveAlertType = 'threshold-drift' | 'correlated-signals' | 'trace-latency';
export type PredictiveAlertUrgency = 'watch' | 'warning' | 'imminent';

export interface DriftPoint {
  location: string;       // detector name or milepost
  value: number;
  timestamp: string;
}

export interface CorrelatedSignal {
  system: string;
  metric: string;
  currentValue: string;
  normalValue: string;
  deviation: string;       // e.g. "+13 sec" or "-6 dBm"
}

export interface PredictiveAlert {
  id: string;
  type: PredictiveAlertType;
  urgency: PredictiveAlertUrgency;
  title: string;
  asset: string;           // loco ID, car number, or infrastructure ID
  assetType: 'locomotive' | 'car' | 'wayside' | 'communications';
  subdivision: string;
  milepost?: string;
  summary: string;         // one-line plain-language summary
  detail: string;          // full explanation paragraph
  confidence: number;      // 0–100
  estimatedTimeToFailure?: string;  // e.g. "~120 miles" or "~47 min"
  nextAction: string;
  // For threshold-drift
  driftHistory?: DriftPoint[];
  threshold?: number;
  unit?: string;
  // For correlated-signals
  correlatedSignals?: CorrelatedSignal[];
  historicalMatches?: number;
  // For trace-latency
  affectedHop?: string;
  currentLatencyMs?: number;
  baselineLatencyMs?: number;
  timestamp: string;
}

// ─── ROOT CAUSE EXPLANATION TYPES ─────────────────────────────────────────────

export type TraceHopStatus = 'ok' | 'slow' | 'failed' | 'unknown';

export interface RcaTraceHop {
  name: string;
  system: string;
  latencyMs: number;
  status: TraceHopStatus;
  detail: string;
  sequenceNum?: string;
}

export interface BlastRadiusItem {
  assetId: string;
  assetName: string;
  assetType: string;
  impact: string;
  subdivision: string;
}

export interface RecommendedAction {
  label: string;
  type: 'auto' | 'manual' | 'ticket';
  estimatedResolutionMin: number;
  safetyGated: boolean;   // requires human approval before execution
  description: string;
}

export interface RootCauseExplanation {
  incidentId: string;
  // Layer 1: What happened
  whatHappened: string;
  eventTimestamp: string;
  // Layer 2: Where in the chain (synthetic trace)
  traceHops: RcaTraceHop[];
  failedHop: string;       // name of the hop where failure occurred
  // Layer 3: Why it happened
  rootCause: string;       // plain-language root cause
  rootCauseSystem: string; // system responsible
  supportingEvidence: string[];  // list of corroborating data points
  confidence: number;      // 0–100
  // Layer 4: Blast radius
  blastRadius: BlastRadiusItem[];
  // Layer 5: Recommended action
  recommendedActions: RecommendedAction[];
  // Timeline of correlated events
  correlatedTimeline: { timestamp: string; system: string; event: string; relevance: 'direct' | 'contributing' | 'context' }[];
}

// ─── PREDICTIVE ALERTS DATA ────────────────────────────────────────────────────

export const predictiveAlerts: PredictiveAlert[] = [
  {
    id: 'PRED-001',
    type: 'threshold-drift',
    urgency: 'imminent',
    title: 'Bearing Temperature Rising — Car TTGX 8841 (Axle A2-Right)',
    asset: 'TTGX 8841',
    assetType: 'car',
    subdivision: 'Bala',
    milepost: '112.4',
    summary: 'HBD readings show a 12°C/40-mile rise rate. Projected to exceed 105°C threshold within 120 miles.',
    detail: 'Car TTGX 8841 Axle A2-Right recorded 44°C at MP 72.1, 52°C at MP 88.7, and 68°C at MP 112.4. The rate of rise (12°C per 40 miles) is consistent with early-stage bearing degradation. At the current rate, the bearing will exceed the 105°C alarm threshold before reaching the next scheduled HBD at MP 232.0. The next available set-out location is Barrie Yard at MP 138.5.',
    confidence: 87,
    estimatedTimeToFailure: '~120 miles (~2h 40min at current speed)',
    nextAction: 'Set out TTGX 8841 at Barrie Yard (MP 138.5) for bearing inspection before next detector.',
    driftHistory: [
      { location: 'HBD MP 72.1', value: 44, timestamp: '2024-05-04T11:14:00Z' },
      { location: 'HBD MP 88.7', value: 52, timestamp: '2024-05-04T12:31:00Z' },
      { location: 'HBD MP 112.4', value: 68, timestamp: '2024-05-04T14:18:00Z' },
    ],
    threshold: 105,
    unit: '°C',
    timestamp: '2024-05-04T14:18:00Z',
  },
  {
    id: 'PRED-002',
    type: 'correlated-signals',
    urgency: 'warning',
    title: 'Pre-Failure Signature Detected — Locomotive CN 3864 (LIG)',
    asset: 'CN 3864',
    assetType: 'locomotive',
    subdivision: 'Ruel',
    milepost: '142.3',
    summary: 'Three weak signals on CN 3864 match the pre-failure pattern seen before 136 previous LIG socket failures. Confidence: 78%.',
    detail: 'No single metric on CN 3864 is alarming in isolation. However, the combination of a 6% drop in LIG message throughput, a marginal 220MHz RSSI reading at the Hornepayne base station, and a BOS polling interval that has slipped from 58 to 71 seconds forms a correlated signature. This exact pattern was observed in the 30–60 minutes preceding 136 confirmed LIG socket disconnections in the historical incident record. The locomotive is currently 47 miles from the Hornepayne crew change point — a natural intervention window.',
    confidence: 78,
    estimatedTimeToFailure: '~30–60 min if pattern holds',
    nextAction: 'Pre-position maintenance crew at Hornepayne. Monitor LIG throughput every 5 minutes.',
    correlatedSignals: [
      { system: 'OWL / LIG', metric: 'Message Throughput', currentValue: '94%', normalValue: '100%', deviation: '-6%' },
      { system: 'COBRA / 220MHz', metric: 'RSSI at Hornepayne', currentValue: '−95 dBm', normalValue: '−82 dBm', deviation: '−13 dBm (marginal)' },
      { system: 'BOS / G-BOS', metric: 'Polling Interval (CN 3864)', currentValue: '71 sec', normalValue: '58 sec', deviation: '+13 sec' },
    ],
    historicalMatches: 136,
    timestamp: '2024-05-04T14:05:00Z',
  },
  {
    id: 'PRED-003',
    type: 'trace-latency',
    urgency: 'watch',
    title: 'PTC Message Latency Climbing — Ruel Subdivision',
    asset: 'Ruel Sub — ITCM Pipeline',
    assetType: 'communications',
    subdivision: 'Ruel',
    summary: 'Synthetic trace round-trip latency on Ruel Sub has risen from 2.1s to 4.8s over 20 minutes. Bottleneck identified at GCP Pub/Sub ingestion.',
    detail: 'The OWL synthetic trace for the Ruel Subdivision normally shows a 2.1-second round-trip from locomotive to G BOS and back. Over the past 20 minutes, this has climbed progressively to 4.8 seconds. The bottleneck has been isolated to the GCP Pub/Sub `owl-telemetry-ingress` topic, where message queue depth has grown from 120 to 1,840 messages. The OWL Receiver VMs are healthy (CPU < 30%). The most probable cause is a GCP Pub/Sub quota approaching its per-minute throughput limit. No locomotive has yet experienced a PTC communication failure, but continued growth will cause BOS polling timeouts within approximately 15 minutes.',
    confidence: 91,
    estimatedTimeToFailure: '~15 min to first BOS polling timeout if queue continues growing',
    nextAction: 'Scale up GCP Pub/Sub throughput quota or restart the OWL Receiver VM to clear the queue.',
    affectedHop: 'GCP Pub/Sub (owl-telemetry-ingress)',
    currentLatencyMs: 4800,
    baselineLatencyMs: 2100,
    timestamp: '2024-05-04T14:20:00Z',
  },
  {
    id: 'PRED-004',
    type: 'threshold-drift',
    urgency: 'watch',
    title: 'Wheel Impact Load Trending Up — Car BNSF 112847 (Axle B1)',
    asset: 'BNSF 112847',
    assetType: 'car',
    subdivision: 'Kingston',
    milepost: '203.7',
    summary: 'WILD readings on Axle B1 show a 15% increase over the last 3 detector passes. Still below alarm threshold but trending.',
    detail: 'Foreign car BNSF 112847 Axle B1 has shown progressive WILD readings of 142 kips (MP 98.2), 156 kips (MP 145.0), and 163 kips (MP 203.7). The alarm threshold is 200 kips. While still within safe limits, the 15% increase over three passes is consistent with a developing flat spot or wheel out-of-round condition. If the trend continues at the same rate, the next detector reading (estimated MP 260.0) may approach the advisory threshold of 185 kips.',
    confidence: 72,
    estimatedTimeToFailure: '~1–2 detector passes before advisory threshold',
    nextAction: 'Flag BNSF 112847 for wheel profile inspection at next available facility. Notify BNSF via interline protocol.',
    driftHistory: [
      { location: 'WILD MP 98.2', value: 142, timestamp: '2024-05-04T08:44:00Z' },
      { location: 'WILD MP 145.0', value: 156, timestamp: '2024-05-04T10:52:00Z' },
      { location: 'WILD MP 203.7', value: 163, timestamp: '2024-05-04T13:37:00Z' },
    ],
    threshold: 200,
    unit: 'kips',
    timestamp: '2024-05-04T13:37:00Z',
  },
  {
    id: 'PRED-005',
    type: 'correlated-signals',
    urgency: 'watch',
    title: 'KES Key Propagation Delay Pattern — Bala Subdivision',
    asset: 'G-BOS Bala',
    assetType: 'wayside',
    subdivision: 'Bala',
    summary: 'KES issued a new OPK 23 minutes ago. G-BOS Bala has not yet acknowledged it. 4 locomotives on Bala Sub may experience authentication delays.',
    detail: 'The Key Exchange Server issued a new Operational Private Key (OPK) at 14:09:17. The CI-BOS and SA-BOS acknowledged within 90 seconds (normal). The G-BOS Bala instance has not acknowledged after 23 minutes — well outside the normal 3-minute window. Historical analysis shows that unacknowledged OPK propagation to the G-BOS precedes PTC communication authentication failures in 68% of cases within the following 30 minutes. Four locomotives currently operating on the Bala Subdivision are at risk.',
    confidence: 68,
    estimatedTimeToFailure: '~30 min to potential authentication failures for 4 locomotives',
    nextAction: 'Restart G-BOS Bala KES key cache. Verify OPK acknowledgement within 5 minutes.',
    correlatedSignals: [
      { system: 'KES', metric: 'OPK Issued', currentValue: '14:09:17', normalValue: 'N/A', deviation: '23 min ago — unacknowledged by G-BOS' },
      { system: 'BOS / G-BOS Bala', metric: 'KES Acknowledgement', currentValue: 'Pending', normalValue: '<3 min', deviation: '+20 min overdue' },
      { system: 'I-ETMS (4 locos)', metric: 'Authentication State', currentValue: 'Active (expiring)', normalValue: 'Active', deviation: 'OPK will expire in ~30 min' },
    ],
    historicalMatches: 23,
    timestamp: '2024-05-04T14:32:00Z',
  },
];

// ─── ROOT CAUSE EXPLANATIONS ───────────────────────────────────────────────────

export const rootCauseExplanations: Record<string, RootCauseExplanation> = {
  'INC-20250514-001': {
    incidentId: 'INC-20250514-001',
    whatHappened: 'The LIG (Locomotive Interface Gateway) socket on CN 3864 disconnected at 14:32:11, causing CARMA to lose all telemetry visibility into the locomotive. The locomotive entered PTC enforcement mode 47 seconds later.',
    eventTimestamp: '2024-05-04T14:32:11Z',
    traceHops: [
      { name: 'CN 3864 (I-ETMS / LIG)', system: 'I-ETMS', latencyMs: 0, status: 'failed', detail: 'LIG socket closed unexpectedly. No outbound PTC messages after 14:32:11.', sequenceNum: 'PTC-SEQ-88421' },
      { name: '220MHz Radio (Hornepayne)', system: 'COBRA', latencyMs: 340, status: 'ok', detail: 'Radio signal nominal at −81 dBm. Last packet received at 14:32:08 — 3 seconds before LIG failure.', sequenceNum: 'PTC-SEQ-88420' },
      { name: 'ITCM / EMP Router', system: 'ITCM', latencyMs: 680, status: 'ok', detail: 'ITCM routed last message normally. Queue depth normal.', sequenceNum: 'PTC-SEQ-88420' },
      { name: 'G-BOS (Ruel Sub)', system: 'BOS', latencyMs: 1240, status: 'slow', detail: 'G-BOS polling interval for CN 3864 had slipped to 71 sec (normal: 58 sec) in the 30 min before failure — a contributing signal.', sequenceNum: 'PTC-SEQ-88419' },
      { name: 'OWL Back Office Receiver', system: 'OWL', latencyMs: 1580, status: 'ok', detail: 'OWL Receiver healthy. Heartbeat from CN 3864 missed at 14:32:30 — triggered CARMA alert.', sequenceNum: 'N/A' },
    ],
    failedHop: 'CN 3864 (I-ETMS / LIG)',
    rootCause: 'The LIG socket closed due to an ACC (Application Control Computer) CPU spike to 98% at 14:31:58 — 13 seconds before the disconnection. The ACC CPU spike was caused by a concurrent I-ETMS software exception during a route data update received from PDS. The LIG process was starved of CPU cycles and the socket timed out.',
    rootCauseSystem: 'I-ETMS / ACC',
    supportingEvidence: [
      'ACC CPU telemetry (OWL): 98% spike at 14:31:58 — 13 seconds before LIG disconnection',
      'I-ETMS exception log: "RouteDataUpdateException" at 14:31:55 during PDS route push',
      'PDS audit log: Route data update broadcast to 47 locomotives at 14:31:50',
      'Historical pattern: 23 of 136 LIG failures in the incident record were preceded by ACC CPU spikes during PDS route updates',
      'G-BOS polling slip (71 sec vs 58 sec normal) in the 30 min before failure — consistent with a locomotive under CPU load',
    ],
    confidence: 91,
    blastRadius: [
      { assetId: 'LOCO-3864', assetName: 'CN 3864', assetType: 'Locomotive', impact: 'PTC enforcement — train stopped. LIG offline — no telemetry.', subdivision: 'Ruel' },
      { assetId: 'LOCO-3901', assetName: 'CN 3901', assetType: 'Locomotive', impact: 'Same PDS route update received. ACC CPU spike to 87% — recovered. Monitor for recurrence.', subdivision: 'Ruel' },
      { assetId: 'LOCO-4412', assetName: 'CN 4412', assetType: 'Locomotive', impact: 'Same PDS route update received. No CPU spike observed. No impact.', subdivision: 'Capreol' },
    ],
    recommendedActions: [
      {
        label: 'Restart LIG Socket via OWL Agent',
        type: 'auto',
        estimatedResolutionMin: 4,
        safetyGated: true,
        description: 'OWL Agent sends a socket restart command to the LIG process on CN 3864. Requires human approval — locomotive must not be in active PTC enforcement. Estimated recovery: 4 minutes.',
      },
      {
        label: 'Create ServiceNow Ticket for PDS Route Update Review',
        type: 'ticket',
        estimatedResolutionMin: 0,
        safetyGated: false,
        description: 'Create a P2 ticket to investigate the PDS route data broadcast that triggered the ACC CPU spike. 23 similar events in the record suggest a systemic issue with large route update payloads.',
      },
      {
        label: 'Dispatch Field Technician to CN 3864',
        type: 'manual',
        estimatedResolutionMin: 45,
        safetyGated: false,
        description: 'If remote LIG restart is unsuccessful, dispatch a field technician to CN 3864 at MP 142.3 (Ruel Sub) for manual ACC reboot.',
      },
    ],
    correlatedTimeline: [
      { timestamp: '14:31:50', system: 'PDS', event: 'Route data update broadcast to 47 locomotives on Ruel and Capreol subdivisions', relevance: 'direct' },
      { timestamp: '14:31:55', system: 'I-ETMS (CN 3864)', event: 'RouteDataUpdateException thrown during route data parsing', relevance: 'direct' },
      { timestamp: '14:31:58', system: 'OWL / ACC', event: 'ACC CPU spike to 98% on CN 3864', relevance: 'direct' },
      { timestamp: '14:32:08', system: 'COBRA / 220MHz', event: 'Last PTC packet received from CN 3864 at Hornepayne base station', relevance: 'context' },
      { timestamp: '14:32:11', system: 'OWL / LIG', event: 'LIG socket closed — PTC communication lost', relevance: 'direct' },
      { timestamp: '14:32:30', system: 'OWL Receiver', event: 'Missed heartbeat from CN 3864 — CARMA alert triggered', relevance: 'direct' },
      { timestamp: '14:32:58', system: 'I-ETMS (CN 3864)', event: 'PTC enforcement initiated — locomotive stopped', relevance: 'direct' },
      { timestamp: '14:33:15', system: 'ServiceNow', event: 'INC-20240501-001 created and assigned to PTC-LOCOMOTIVE-IETMS-SUPPORT', relevance: 'context' },
      { timestamp: '14:33:22', system: 'I-ETMS (CN 3901)', event: 'ACC CPU spike to 87% on CN 3901 (same PDS broadcast) — recovered without LIG failure', relevance: 'contributing' },
    ],
  },

  'INC-20250514-004': {
    incidentId: 'INC-20250514-004',
    whatHappened: 'WIU device at Capreol Subdivision MP 201.0 went offline at 14:05:33, causing loss of wayside monitoring for a 12-mile stretch of track. The device has not responded to OWL polling for 28 minutes.',
    eventTimestamp: '2024-05-04T14:05:33Z',
    traceHops: [
      { name: 'WIU Capreol MP 201', system: 'WASP', latencyMs: 0, status: 'failed', detail: 'WIU stopped responding to OWL polling at 14:05:33. Last heartbeat was at 14:04:58 — 35 seconds before loss.', sequenceNum: 'WIU-SEQ-44102' },
      { name: 'COBRA Radio Site (Capreol)', system: 'COBRA', latencyMs: 0, status: 'ok', detail: 'Radio site healthy. RSSI nominal. Other WIUs on same radio site are responding normally.', sequenceNum: 'N/A' },
      { name: 'OWL Back Office Receiver', system: 'OWL', latencyMs: 1200, status: 'ok', detail: 'OWL Receiver healthy. Polling the WIU every 60 seconds — no response since 14:05:33.', sequenceNum: 'N/A' },
    ],
    failedHop: 'WIU Capreol MP 201',
    rootCause: 'Power supply failure at the WIU cabinet. The COBRA radio site and OWL Receiver are both healthy, eliminating a communication failure as the cause. The WIU is not responding to any protocol — consistent with a complete power loss rather than a software hang. The nearest power source is a solar panel array that was reported as partially shaded by vegetation in the last ATIP inspection run (3 days ago).',
    rootCauseSystem: 'WASP / WIU Hardware',
    supportingEvidence: [
      'COBRA radio site at Capreol is healthy — 3 other WIUs on the same site are responding normally',
      'OWL polling shows zero response to all protocol types (heartbeat, config query, status request)',
      'ATIP inspection log (3 days ago): "Vegetation encroachment on solar panel array at MP 200.8 — advisory flag"',
      'Power telemetry from WIU: last reported battery voltage was 11.2V (below 12V nominal) at 13:58:00 — 7 minutes before failure',
      'No train movements reported in the affected zone — no immediate safety impact',
    ],
    confidence: 88,
    blastRadius: [
      { assetId: 'WIU-CAP-201', assetName: 'WIU Capreol MP 201', assetType: 'Wayside', impact: 'Offline — 12-mile monitoring gap from MP 195 to MP 207', subdivision: 'Capreol' },
      { assetId: 'CROSSING-CAP-203', assetName: 'Crossing MP 203.2', assetType: 'Crossing', impact: 'Crossing monitoring dependent on WIU-CAP-201 — unmonitored', subdivision: 'Capreol' },
    ],
    recommendedActions: [
      {
        label: 'Dispatch Signals Crew to WIU Capreol MP 201',
        type: 'manual',
        estimatedResolutionMin: 90,
        safetyGated: false,
        description: 'Dispatch a signals crew to inspect and restore power to the WIU cabinet at MP 201.0. Check solar panel array for vegetation obstruction and battery condition.',
      },
      {
        label: 'Create ServiceNow Ticket for Vegetation Management',
        type: 'ticket',
        estimatedResolutionMin: 0,
        safetyGated: false,
        description: 'Create a P3 maintenance ticket for vegetation clearance at MP 200.8 solar panel array — flagged by ATIP 3 days ago. This is the root cause of the power degradation.',
      },
    ],
    correlatedTimeline: [
      { timestamp: '3 days ago', system: 'ATIP', event: 'Vegetation encroachment advisory flag on solar panel array at MP 200.8', relevance: 'contributing' },
      { timestamp: '13:58:00', system: 'WASP / WIU', event: 'WIU battery voltage reported at 11.2V (below 12V nominal)', relevance: 'direct' },
      { timestamp: '14:04:58', system: 'WASP / WIU', event: 'Last heartbeat received from WIU Capreol MP 201', relevance: 'direct' },
      { timestamp: '14:05:33', system: 'OWL Receiver', event: 'WIU polling timeout — device declared offline', relevance: 'direct' },
      { timestamp: '14:05:45', system: 'CARMA', event: 'Critical alert raised: WIU offline — 12-mile monitoring gap', relevance: 'context' },
      { timestamp: '14:06:02', system: 'ServiceNow', event: 'INC-20240501-004 created and assigned to Signals Team', relevance: 'context' },
    ],
  },

  'INC-20250514-002': {
    incidentId: 'INC-20250514-002',
    whatHappened: 'CN 5501 lost GPS signal at 14:28:44 while traversing the Bala Sub tunnel zone near MP 88.7. The I-ETMS initiated a GPS-loss recovery procedure. Signal was restored at 14:31:52 — MTTR: 3 minutes.',
    eventTimestamp: '2024-05-04T14:28:44Z',
    traceHops: [
      { name: 'CN 5501 (GPS Receiver)', system: 'I-ETMS', latencyMs: 0, status: 'failed', detail: 'GPS signal lost at MP 88.7 — known tunnel zone. Expected transient event.', sequenceNum: 'GPS-SEQ-5501-1428' },
      { name: 'I-ETMS Dead Reckoning', system: 'I-ETMS', latencyMs: 0, status: 'ok', detail: 'I-ETMS activated dead reckoning using wheel tachometer and last known position. Position maintained within ±50m.', sequenceNum: 'N/A' },
      { name: 'G-BOS (Bala Sub)', system: 'BOS', latencyMs: 890, status: 'ok', detail: 'G-BOS continued receiving position updates via dead reckoning. No movement authority gap.', sequenceNum: 'PTC-SEQ-55012' },
    ],
    failedHop: 'CN 5501 (GPS Receiver)',
    rootCause: 'Expected GPS signal loss due to tunnel geometry at MP 88.7 (Bala Sub). This is a known geographic dead zone — 288 similar events have been recorded at this location in the past 16 months. No hardware failure. I-ETMS dead reckoning maintained position continuity throughout. Auto-resolved by AI Agent after confirming GPS restoration at MP 89.4.',
    rootCauseSystem: 'Geography (Known Dead Zone)',
    supportingEvidence: [
      '288 GPS loss events recorded at MP 88.7 (Bala Sub) in the past 16 months — all transient',
      'I-ETMS dead reckoning maintained position accuracy within ±50m throughout the outage',
      'G-BOS continued receiving position updates — no movement authority gap',
      'GPS signal restored at 14:31:52 at MP 89.4 — consistent with tunnel exit location',
      'No PTC enforcement triggered — dead reckoning kept the locomotive within authority',
    ],
    confidence: 99,
    blastRadius: [],
    recommendedActions: [
      {
        label: 'No Action Required — Auto-Resolved',
        type: 'auto',
        estimatedResolutionMin: 0,
        safetyGated: false,
        description: 'This is a known geographic transient. The AI Agent confirmed GPS restoration and closed the incident. No human action required. Consider adding MP 88.7 to the GPS Dead Zone registry to suppress future alerts for this location.',
      },
    ],
    correlatedTimeline: [
      { timestamp: '14:28:44', system: 'I-ETMS (CN 5501)', event: 'GPS signal lost — tunnel entry at MP 88.7', relevance: 'direct' },
      { timestamp: '14:28:45', system: 'I-ETMS (CN 5501)', event: 'Dead reckoning activated — wheel tachometer + last known position', relevance: 'direct' },
      { timestamp: '14:28:46', system: 'AI Agent', event: 'Alert received — cross-referenced against GPS Dead Zone registry — flagged as known transient', relevance: 'context' },
      { timestamp: '14:31:52', system: 'I-ETMS (CN 5501)', event: 'GPS signal restored at MP 89.4 — tunnel exit confirmed', relevance: 'direct' },
      { timestamp: '14:31:55', system: 'AI Agent', event: 'GPS restoration confirmed — incident auto-resolved. MTTR: 3 minutes.', relevance: 'direct' },
    ],
  },
};

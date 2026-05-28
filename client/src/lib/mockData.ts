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
  safetySystem?: 'ETC-ATP' | 'ETC-DAS' | 'PTC'; // Safety system active on this subdivision
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved' | 'auto-resolved';
  tag: string;
  assignedTo: string;
  mttr?: number; // minutes
  aiResolved?: boolean;
}

// KES OPK state for wayside units
export type WOPKState = 'ACTIVE' | 'PRE_ACTIVATION' | 'DEACTIVATED' | 'UNKNOWN';
// ETC state machine for locomotives
export type ETCState = 'POWER_UP' | 'SELF_TEST' | 'INITIALIZING' | 'ACTIVE' | 'CUT_OUT' | 'FAILED' | 'NOT_EQUIPPED';

// Subsystem component health for locomotive onboard equipment
export type SubsystemHealth = 'ok' | 'warning' | 'critical' | 'unknown';

export interface SubsystemComponent {
  name: string;
  status: SubsystemHealth;
  detail?: string;  // e.g. "14d 13:44:10" age, IP address, version
}

export interface LocoSubsystems {
  cdu?: SubsystemComponent[];           // CDU Eng, CDU Cond
  tmc?: SubsystemComponent[];           // CPU1-3, RSM, EBI, IOC, DIO, SLOT10
  acc?: SubsystemComponent[];           // SMM, WCM, CELL 1/2, WIFI1/2, HPEAP, PSM
  locoSystems?: SubsystemComponent[];   // Control Sys, Radio 220MHz, Westermo
  recordingSystem?: SubsystemComponent[]; // Voltage, ER System, CHM, SSD, cameras, audio
  gps?: SubsystemComponent[];           // GPS1, GPS2, GNSS1, GNSS2
  comms?: SubsystemComponent[];         // OWL Agent, Loco TMC
  resilio?: SubsystemComponent[];       // Resilio version, last seen, status
  itcmRoutes?: SubsystemComponent[];    // CELL 1, CELL 2, Radio 220MHz
}

export interface LocoAlarm {
  id: string;
  startTime: string;
  lastUpdate: string;
  subsystem: string;  // TMC, ACC, GPS, CI, etc.
  severity: 'critical' | 'warning' | 'info';
  message: string;
}

// ── LVVR (Locomotive Video/Voice Recorder) R15 monitoring data ─────────────
export type LVVRHealth = 'NORMAL' | 'ATTENTION' | 'FAIL' | 'DISABLED' | 'UNKNOWN';
export type CameraState = 'Recording' | 'Standby' | 'Fault' | 'NotEquipped' | 'Unknown';

export interface LVVRDrivePartition {
  name: string;    // e.g. 'Loco Event', 'PTC Data', 'Audio/Video'
  usagePct: number; // 0-100
  status: 'ok' | 'warning' | 'critical'; // warning if >90%
}

export interface LVVRCamera {
  id: number;        // 1=Outward, 2=Inward1, 3=Inward2
  label: string;     // 'Outward Camera', 'Inward Camera 1', 'Inward Camera 2'
  healthOk: boolean;
  recordingVideo: boolean;
  recordingAudio: boolean;
  state: CameraState;
}

export interface LVVRData {
  // Suppression context (LOBS-11781)
  suppressionReason?: 'SHOP' | 'STORAGE' | 'LAB' | 'DT' | 'UPGRADE' | 'DECOMMISSIONED' | 'NO_INTERNET' | 'OUTSIDE_CANADA' | 'BRAKES_SHUTDOWN' | null;
  // LVVR Agent (OWL)
  agentResponsive: boolean;
  agentVersion?: string;
  agentLastSeen?: string;
  // LDVR / PowerView unit
  ldvrHealth: LVVRHealth;
  ldvrModel?: string;  // 'PowerView' or other
  // Event Recorder (ER)
  erStatus: 'NORMAL' | 'NOT_OPERATIONAL' | 'ATTENTION' | 'UNKNOWN';
  erNotOperationalCount?: number; // consecutive NOT_OPERATIONAL readings
  // CHM (Crash/Health Module)
  chmConnected: boolean;
  chmSerialNumber?: string;
  chmPartitions: LVVRDrivePartition[];
  // SSD
  ssdConnected: boolean;
  ssdSerialNumber?: string;
  ssdPartitions: LVVRDrivePartition[];
  // Cameras (3 cameras: outward + 2 inward; Camera 4 & 5 removed per LOBS-11701)
  cameras: LVVRCamera[];
  // External MIC
  micHealthOk: boolean;
  micRecordingAudio: boolean;
}

// Wayside Interface Unit (WIU) field data
export interface WIUHazardDetector {
  name: string;   // e.g. "5 TRACK", "4EA TRACK"
  status: 'ok' | 'active' | 'fault' | 'unknown';
}

export interface WIUSignal {
  name: string;   // e.g. "4E SIGNAL"
  id: number;     // signal number
  aspects: ('red' | 'yellow' | 'green' | 'dark')[];  // lit lenses
  count?: number; // aspect count number shown
}

export interface WIUSwitch {
  name: string;   // e.g. "3B SWITCH"
  id: string;     // e.g. "1000070"
  position: 'N' | 'R' | 'UNKNOWN';
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
  // KES / OPK fields
  etcState?: ETCState;          // Locomotive ETC state machine state
  blOpkExpiresAt?: string;      // BL-OPK expiry (ISO timestamp) — refreshes every 24h
  blOpkIssuedAt?: string;       // When BL-OPK was last issued
  blOpkStatus?: 'VALID' | 'EXPIRING' | 'EXPIRED' | 'REVOKED'; // EXPIRING = <2h remaining
  wOpkState?: WOPKState;        // W-OPK state for WIU devices
  pollingStatus?: 'OK' | 'OVERDUE' | 'MISMATCH'; // Polling health
  lastPollAt?: string;          // Last successful poll timestamp
  // ── Locomotive fleet table fields (matching real CN monitoring system) ──
  ptcMissionCritical?: boolean; // PTC M.C. — is this loco on a mission-critical PTC corridor?
  physStatus?: string;          // Physical status (blank = in service, SHOP, etc.)
  opCode?: 'SM' | 'LN' | 'LD' | 'LA' | 'LS'; // Operating code: SM=Manifest, LN=Intermodal, LD=Loaded, LA=Auto-rack, LS=Loaded Stack
  position?: 'LEAD' | 'TRAIL' | 'YARD' | 'SHOP' | 'INVALID'; // Train position
  locoModel?: string;           // e.g. C44-9W, ET44AC, SD75I, AC44C6M
  locoClass?: string;           // e.g. EF-644F, GF-643C, GR-420C
  environment?: string;         // Operating environment (blank = standard)
  controlSystem?: string;       // Control system identifier
  lastHeartbeat?: string;       // e.g. "2m", "8h", "1w"
  location?: string;            // e.g. "GULF, PEORIA, US", "CENTRAL, CHICAGO, US (YARD) UY70"
  ptcEquipped?: boolean;        // PTC Equipped flag
  tripOptimizerOperative?: boolean; // Trip Optimizer Operative flag
  criticalAlarmCount?: number;  // Number of critical alarms
  warningAlarmCount?: number;   // Number of warning alarms
  infoAlarmCount?: number;      // Number of info alarms
  // ── Onboard equipment subsystems (expanded row panel) ──
  subsystems?: LocoSubsystems;
  openAlarms?: LocoAlarm[];
  closedAlarms?: LocoAlarm[];
  // ── LVVR recording system detailed data ──
  lvvr?: LVVRData;
  // ── WIU wayside fields ──
  wmsStatus?: 'OK' | 'FAULT' | 'UNKNOWN';  // WMS (Wayside Management System) status
  wrStatus?: 'OK' | 'FAULT' | 'UNKNOWN';   // WR (Wayside Radio) status
  wdcId?: string;                           // WDC identifier e.g. "WDC:01"
  wuiId?: string;                           // WUI identifier e.g. "WIU:05"
  hazardDetectors?: WIUHazardDetector[];    // Track hazard detectors
  signals?: WIUSignal[];                    // Signal aspects
  switches?: WIUSwitch[];                   // Switch positions
  filterTags?: string[];                    // Filter tags: 'PTC Issue', 'Dyn. Sub.', 'Direct Connect', etc.
}

// EMP message type taxonomy — S-9361.V3.1 PTC Office-Locomotive Segment ICD
// Office Segment → Locomotive: 01xxx series
// Locomotive → Office Segment: 02xxx series
// WSRS → Locomotive: 015xx; Locomotive → WSRS: 025xx
export type EMPMessageType =
  // ── Crew Authentication ──────────────────────────────────────────────────────
  | '02000_VERIFY_EMPLOYEE_INFO_REQ'    // Loco→BOS: Verify Employee Info Request
  | '01000_VERIFY_EMPLOYEE_INFO_RESP'   // BOS→Loco: Verify Employee Info Response
  // ── Train ID Selection ───────────────────────────────────────────────────────
  | '02001_REQUEST_TRAIN_ID_LIST'       // Loco→BOS: Request Train ID List
  | '01001_TRAIN_ID_LIST'               // BOS→Loco: Train ID List
  | '02003_SELECTED_TRAIN_ID'           // Loco→BOS: Selected Train ID
  | '01003_REQUEST_SELECTED_TRAIN_ID'   // BOS→Loco: Request Selected Train ID
  | '01004_CONFIRM_SELECTED_TRAIN_ID'   // BOS→Loco: Confirmation of Selected Train ID
  // ── Configuration ────────────────────────────────────────────────────────────
  | '02005_CONFIG_VERSION_LIST_REQ'     // Loco→BOS: Configuration Version List Request
  | '01005_CONFIG_VERSION_LIST'         // BOS→Loco: Configuration Version List
  | '02007_REQUEST_SUBDIV_LIST'         // Loco→BOS: Request Train Subdivision/District List
  | '01007_SUBDIV_LIST'                 // BOS→Loco: Train Subdivision/District List
  | '02008_CONFIRM_SUBDIV_LIST'         // Loco→BOS: Confirmation of Train Subdivision/District List
  // ── Locomotive System State ──────────────────────────────────────────────────
  | '02010_LOCO_SYSTEM_STATE'           // Loco→BOS: Locomotive System State
  | '01010_CMD_CONFIRM_LOCO_STATE'      // BOS→Loco: Command/Confirm Locomotive System State
  // ── Departure Test ───────────────────────────────────────────────────────────
  | '02011_DEPARTURE_TEST_REPORT'       // Loco→BOS: Departure Test Report
  | '01011_CONFIRM_DEPARTURE_TEST'      // BOS→Loco: Confirmation of Departure Test Report
  // ── Poll Registration ────────────────────────────────────────────────────────
  | '02020_POLL_REGISTRATION'           // Loco→BOS: Poll Registration
  | '01020_CONFIRM_POLL_REGISTRATION'   // BOS→Loco: Confirmation of Poll Registration
  | '01021_OFFICE_SEGMENT_POLL'         // BOS→Loco: Office Segment Poll
  | '02021_POLL_RESPONSE'               // Loco→BOS: Poll Response
  | '01022_CURRENT_DATASET_LIST'        // BOS→Loco: Current Dataset List
  // ── Consist ──────────────────────────────────────────────────────────────────
  | '02030_REQUEST_TRAIN_CONSIST'       // Loco→BOS: Request Train Consist
  | '01030_TRAIN_CONSIST'               // BOS→Loco: Train Consist
  | '02032_ONBOARD_TRAIN_CONSIST'       // Loco→BOS: Onboard Train Consist
  | '01033_CONFIRM_ONBOARD_CONSIST'     // BOS→Loco: Confirmation of Onboard Train Consist
  // ── Bulletins ────────────────────────────────────────────────────────────────
  | '01040_REQUEST_CREW_ACK_BULLETIN'   // BOS→Loco: Request Crew Acknowledgment of Bulletin
  | '01041_BULLETIN_DATASET'            // BOS→Loco: Bulletin Dataset
  | '01043_BULLETIN_CANCELLATION'       // BOS→Loco: Bulletin Cancellation
  | '02040_CONFIRM_CREW_ACK_BULLETIN'   // Loco→BOS: Confirmation of Crew Acknowledgment of Bulletin
  | '02041_REQUEST_BULLETIN_DATASET'    // Loco→BOS: Request Bulletin Dataset
  | '02042_CONFIRM_BULLETIN_DATASET'    // Loco→BOS: Confirmation of Bulletin Dataset
  | '02043_CONFIRM_BULLETIN_CANCEL'     // Loco→BOS: Confirmation of Bulletin Cancellation
  | '02062_CONFIRM_BULLETIN_SEQUENCE'   // Loco→BOS: Confirmation of Bulletin Sequence
  // ── Movement Authority (Crew Authority) ─────────────────────────────────────
  | '02050_CREW_AUTH_REQUEST'           // Loco→BOS: Crew Authority Request
  | '01050_CONFIRM_CREW_AUTH_REQUEST'   // BOS→Loco: Confirmation of Crew Authority Request
  | '01051_MOVEMENT_AUTHORITY_DATASET'  // BOS→Loco: Movement Authority Dataset
  | '02051_REQUEST_MA_DATASET'          // Loco→BOS: Request Movement Authority Dataset
  | '02052_CONFIRM_MOVEMENT_AUTHORITY'  // Loco→BOS: Confirmation of Movement Authority
  | '01053_MOVEMENT_AUTHORITY_VOID'     // BOS→Loco: Movement Authority Void
  | '02053_CONFIRM_MA_VOID'             // Loco→BOS: Confirmation of Movement Authority Void
  | '01054_CONFIRM_EMT_PSS_AUTH_USED'   // BOS→Loco: Confirmation of EMT/PSS Authority Used Notification
  | '02054_EMT_PSS_AUTH_USED'           // Loco→BOS: EMT/PSS Authority Used Notification
  | '02086_ACK_CONDITIONAL_AUTHORITY'   // Loco→BOS: Acknowledge Conditional Authority Report
  // ── Crew Messages & Mandatory Directives ────────────────────────────────────
  | '01060_CREW_MESSAGE'                // BOS→Loco: Crew Message
  | '02060_CONFIRM_CREW_MESSAGE'        // Loco→BOS: Confirmation of Crew Message
  | '01061_CONFIRM_CREW_ACK_MANDATORY'  // BOS→Loco: Confirmation of Crew Ack Mandatory Directive Status
  | '02061_CREW_ACK_MANDATORY'          // Loco→BOS: Crew Acknowledgment of Mandatory Directive Status
  // ── Position Reporting ───────────────────────────────────────────────────────
  | '02080_LOCO_POSITION_REPORT'        // Loco→BOS: Locomotive Position Report
  | '01080_REQUEST_LOCO_POSITION'       // BOS→Loco: Request Locomotive Position Report
  // ── Fault Reporting ──────────────────────────────────────────────────────────
  | '02081_LOCO_FAULT_SUMMARY'          // Loco→BOS: Locomotive Fault Summary Report
  | '01081_REQUEST_LOCO_FAULT_SUMMARY'  // BOS→Loco: Request Locomotive Fault Summary
  | '01082_CONFIRM_LOCO_FAULT_SUMMARY'  // BOS→Loco: Confirmation of Locomotive Fault Summary Report
  | '02087_LOCO_FAULT_REPORT'           // Loco→BOS: Locomotive Fault Report
  | '01087_CONFIRM_LOCO_FAULT_REPORT'   // BOS→Loco: Confirmation of Locomotive Fault Report
  | '02088_ONBOARD_COMPONENT_CONFIG'    // Loco→BOS: Onboard Component Configuration Report
  | '01088_REQUEST_ONBOARD_COMPONENT'   // BOS→Loco: Request Onboard Component Configuration
  | '01089_CONFIRM_ONBOARD_COMPONENT'   // BOS→Loco: Confirmation of Onboard Component Configuration
  // ── Safety Events ────────────────────────────────────────────────────────────
  | '02082_PTC_INTERACTION'             // Loco→BOS: PTC Interaction
  | '02083_ENFORCEMENT_BRAKING'         // Loco→BOS: Enforcement Warning/Braking Notification
  | '01083_CONFIRM_ENFORCEMENT_BRAKING' // BOS→Loco: Confirmation of Enforcement Warning/Braking
  | '02084_EMERGENCY_BRAKE_APPLICATION' // Loco→BOS: Emergency Brake Application Report
  | '01084_CONFIRM_EMERGENCY_BRAKE'     // BOS→Loco: Confirmation of Emergency Brake Application
  | '02085_TRAIN_HANDLING_EXCEPTION'    // Loco→BOS: Train Handling Exception Report
  | '01085_CONFIRM_TRAIN_HANDLING'      // BOS→Loco: Confirmation of Train Handling Exception
  // ── Violations ───────────────────────────────────────────────────────────────
  | '02070_ONBOARD_VIOLATION_REPORT'    // Loco→BOS: Onboard Violation Report
  | '01071_VIOLATION_REPORT'            // BOS→Loco: Violation Report
  | '01070_CONFIRM_VIOLATION_REPORT'    // BOS→Loco: Confirmation of Violation Report
  | '02071_CONFIRM_VIOLATION_REPORT'    // Loco→BOS: Confirmation of Violation Report
  | '02072_ONBOARD_VIOLATION_CLEARED'   // Loco→BOS: Onboard Violation Cleared
  | '01072_VIOLATION_CLEARED'           // BOS→Loco: Violation Cleared
  | '02073_CONFIRM_VIOLATION_CLEARED'   // Loco→BOS: Confirmation of Violation Cleared
  | '01073_CONFIRM_ONBOARD_VIO_CLEARED' // BOS→Loco: Confirmation of Onboard Violation Cleared
  // ── File Transfer (Database Updates) ────────────────────────────────────────
  | '02100_CLIENT_FILESET_LIST'         // Loco→BOS: Client Fileset List
  | '01100_FILESET_LIST'                // BOS→Loco: Fileset List
  | '02101_FILE_INFO_REQUEST'           // Loco→BOS: File Info Request
  | '01101_FILE_INFO'                   // BOS→Loco: File Info
  | '02102_FILE_PART_CHECKSUM_REQ'      // Loco→BOS: File Part Checksum Request
  | '01102_FILE_PART_CHECKSUM'          // BOS→Loco: File Part Checksum
  | '02103_FILE_DATA_REQUEST'           // Loco→BOS: File Data Request
  | '01103_FILE_DATA'                   // BOS→Loco: File Data
  | '02104_FILE_COMPLETE'               // Loco→BOS: File Complete
  | '01104_NO_FILE'                     // BOS→Loco: No File
  | '02105_FILE_DOWNLOAD_FAILED'        // Loco→BOS: File Download Failed
  | '01105_FILE_TRANSFER_UNAVAILABLE'   // BOS→Loco: File Transfer Unavailable
  | '02120_FILE_INFO'                   // Loco→BOS: File Info
  | '01120_FILE_REQUEST'                // BOS→Loco: File Request
  | '02121_NO_FILE'                     // Loco→BOS: No File
  | '01122_FILE_DATA_REQUEST'           // BOS→Loco: File Data Request
  | '02122_FILE_DATA'                   // Loco→BOS: File Data
  | '01123_FILE_COMPLETE'               // BOS→Loco: File Complete
  // ── WSRS Messages ────────────────────────────────────────────────────────────
  | '02500_WSRS_SUBSCRIBE'              // Loco→WSRS: WSRS Subscribe
  | '02501_WSRS_UNSUBSCRIBE'            // Loco→WSRS: WSRS Unsubscribe
  | '01500_CONFIRM_WSRS_SUBSCRIBE'      // WSRS→Loco: Confirmation of WSRS Subscribe
  | '01501_CONFIRM_WSRS_UNSUBSCRIBE'    // WSRS→Loco: Confirmation of WSRS Unsubscribe
  // ── KES / OPK (CN-specific key management) ──────────────────────────────────
  | '101_BL_OPK_REQUEST'               // BL-OPK Key Exchange Request (KES)
  | '102_BL_OPK_RESPONSE'              // BL-OPK Key Exchange Response (KES)
  // ── WASP / Wayside Detector ──────────────────────────────────────────────────
  | '06200_WASP_ALERT'                  // WASP Detector Alert
  | '06250_WASP_STALE';                 // WASP Stale Data Alert

// ETC/PTC initialization phase groupings (aligned with S-9361.V3.1)
export type ETCPhase =
  | 'CREW_AUTH'         // Phase 1: Crew Authentication (02000/01000)
  | 'TRAIN_ID'          // Phase 2: Train ID Selection (02001/01001/02003/01004)
  | 'CONFIGURATION'     // Phase 3: Config Version + Subdivision (02005/01005/02007/01007)
  | 'SYSTEM_STATE'      // Phase 4: Locomotive System State (02010/01010)
  | 'DEPARTURE_TEST'    // Phase 5: Departure Test (02011/01011)
  | 'POLL_REGISTRATION' // Phase 6: Poll Registration (02020/01020)
  | 'CONSIST'           // Phase 7: Consist (02030/01030/02032/01033)
  | 'BULLETINS'         // Phase 8: Bulletins (01040/01041/02040/02041)
  | 'AUTHORITY'         // Phase 9: Movement Authority (02050/01051/02052)
  | 'POLLING'           // Ongoing: Poll cycle (01021/02021)
  | 'POSITION'          // Ongoing: Position Reporting (02080)
  | 'SAFETY_EVENT'      // Ongoing: Enforcement/Braking/Emergency (02082/02083/02084/02085)
  | 'VIOLATION'         // Ongoing: Violations (02070/02072)
  | 'FAULT_REPORTING'   // Ongoing: Fault Reports (02081/02087/02088)
  | 'FILE_TRANSFER'     // Ongoing: File/DB Updates (02100-02122)
  | 'WSRS'              // WSRS: Wayside Status Relay (02500/02501)
  | 'SW_VALIDATION';    // KES: BL-OPK key exchange (101/102)

export interface SyntheticTrace {
  id: string;
  locoId: string;
  seqNum: string;
  empMessageType?: EMPMessageType;  // EMP message number from ATS spec
  etcPhase?: ETCPhase;              // Which initialization phase this trace belongs to
  safetySystem?: 'ETC-ATP' | 'ETC-DAS' | 'PTC'; // Safety system: ETC-ATP (Canada, WIUs, brake enforcement), ETC-DAS (Canada, advisory only), PTC (USA)
  subdivision: string;
  startTime: string;
  hops: TraceHop[];
  status: 'complete' | 'degraded' | 'failed';
  latencyMs: number;
  aiDiagnosis?: string;  // Optional AI-generated diagnosis for failed/degraded traces
}

export interface TraceHop {
  name: string;
  system: string;
  timestampOffset: number; // ms from start
  hopDurationMs?: number;  // duration of this hop alone
  status: 'ok' | 'slow' | 'failed';
  detail: string;
  signalDbm?: number;      // radio signal strength
  site?: string;           // COBRA site name
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-DAS',
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
    safetySystem: 'ETC-DAS',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-DAS',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-DAS',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
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
    safetySystem: 'ETC-ATP',
    milepost: '44.2',
    timestamp: '2025-05-14T09:30:08Z',
    status: 'resolved',
    tag: 'NSR',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    mttr: 31,
    aiResolved: false,
  },
  // ─── KMS / KES Security Events (ITC S-9420) ────────────────────────────────
  {
    id: 'KES-20250514-001',
    title: 'SMPK Signature Verification Failed — Possible MITM Attack (CN 3864)',
    severity: 'critical',
    system: 'KES',
    loco: 'CN 3864',
    subdivision: 'Ruel',
    safetySystem: 'ETC-ATP',
    milepost: '142.3',
    timestamp: '2025-05-14T14:35:00Z',
    status: 'investigating',
    tag: 'Security',
    assignedTo: 'Cybersecurity Team',
    aiResolved: false,
  },
  {
    id: 'KES-20250514-002',
    title: 'Unable to Create BL-OPK — CN 5501 (Bala Sub)',
    severity: 'critical',
    system: 'KES',
    loco: 'CN 5501',
    subdivision: 'Bala',
    safetySystem: 'ETC-ATP',
    timestamp: '2025-05-14T13:20:00Z',
    status: 'open',
    tag: 'Security',
    assignedTo: 'KMS Operations',
    aiResolved: false,
  },
  {
    id: 'KES-20250514-003',
    title: 'BL-OPK Expiring in < 2h — CN 7701, CN 9201, CN 4412 (3 Locos)',
    severity: 'warning',
    system: 'KES',
    timestamp: '2025-05-14T12:00:00Z',
    status: 'open',
    tag: 'Security',
    assignedTo: 'KMS Operations',
    aiResolved: false,
  },
  {
    id: 'KES-20250514-004',
    title: 'W-OPK Deactivated — WIU MP 201.0 (Capreol Sub) — Latent Reboot Fault',
    severity: 'warning',
    system: 'KES',
    subdivision: 'Capreol',
    safetySystem: 'ETC-ATP',
    milepost: '201.0',
    timestamp: '2025-05-14T11:45:00Z',
    status: 'open',
    tag: 'Security',
    assignedTo: 'Signals Team',
    aiResolved: false,
  },
  {
    id: 'KES-20250514-005',
    title: 'Create BL-OPK Potential Security Attack — CN 2271 (MacTier Sub)',
    severity: 'critical',
    system: 'KES',
    loco: 'CN 2271',
    subdivision: 'MacTier',
    safetySystem: 'ETC-ATP',
    timestamp: '2025-05-14T10:10:00Z',
    status: 'resolved',
    tag: 'Security',
    assignedTo: 'Cybersecurity Team',
    mttr: 45,
    aiResolved: false,
  },
  {
    id: 'KES-20250514-006',
    title: 'No W-OPK Found for WIU — MP 44.5 (Bala Sub) — Config Decrypt Risk',
    severity: 'warning',
    system: 'KES',
    subdivision: 'Bala',
    safetySystem: 'ETC-ATP',
    milepost: '44.5',
    timestamp: '2025-05-14T09:55:00Z',
    status: 'resolved',
    tag: 'Security',
    assignedTo: 'Signals Team',
    mttr: 22,
    aiResolved: false,
  },
  // ─── Polling / EMP 02100 Events ───────────────────────────────────────────────
  {
    id: 'POLL-20250514-001',
    title: 'Polling Overdue > 5 min — CN 8012 (Wainwright Sub)',
    severity: 'warning',
    system: 'BOS',
    loco: 'CN 8012',
    subdivision: 'Wainwright',
    safetySystem: 'ETC-DAS',
    milepost: '55.1',
    timestamp: '2025-05-14T13:05:00Z',
    status: 'open',
    tag: 'OB to Wayside',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
  {
    id: 'POLL-20250514-002',
    title: 'Polling State Mismatch — CN 5812 Authority vs BOS Record (Edson Sub)',
    severity: 'critical',
    system: 'BOS',
    loco: 'CN 5812',
    subdivision: 'Edson',
    safetySystem: 'ETC-DAS',
    milepost: '80.2',
    timestamp: '2025-05-14T11:18:00Z',
    status: 'investigating',
    tag: 'NSR',
    assignedTo: 'PTC-LOCOMOTIVE-IETMS-SUPPORT',
    aiResolved: false,
  },
];

// ─── Synthetic Traces ──────────────────────────────────────────────────────────
export const syntheticTraces: SyntheticTrace[] = [
  { id: '02090-CN3864-20250514-001', locoId: 'CN 3864', seqNum: '02090', empMessageType: '02080_LOCO_POSITION_REPORT', etcPhase: 'POLLING', subdivision: 'Ruel',
    startTime: '14:32:08', status: 'failed', latencyMs: 0,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'EMP 02090 Position Report transmitted — LIG socket fault detected post-send', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 120, hopDurationMs: 120, status: 'ok', detail: 'Transmitted to ground', signalDbm: -72, site: 'Hornepayne tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 340, hopDurationMs: 220, status: 'ok', detail: 'Routed via Hornepayne site', site: 'Hornepayne' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 0, hopDurationMs: 0, status: 'failed', detail: 'EMP 02090 not received — LIG socket closed, NSR flag raised in BOS', site: 'Toronto NOC' },
    ],
  },
  { id: '02060-CN5501-20250514-002', locoId: 'CN 5501', seqNum: '02060', empMessageType: '02052_CONFIRM_MOVEMENT_AUTHORITY', etcPhase: 'AUTHORITY', subdivision: 'Bala',
    startTime: '14:28:41', status: 'complete', latencyMs: 890,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'EMP 02050 Authority Request sent — requesting MP 88.7 → MP 130.0', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 210, hopDurationMs: 210, status: 'ok', detail: 'Clear signal, nominal', signalDbm: -68, site: 'Barrie tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 450, hopDurationMs: 240, status: 'ok', detail: 'Routed via Barrie site', site: 'Barrie' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 890, hopDurationMs: 440, status: 'ok', detail: 'EMP 02060 Authority Response — MA issued MP 88.7 → MP 130.0, 60 mph, expires 15:28', site: 'Toronto NOC' },
    ],
  },
  { id: '02030-CN2271-20250514-003', locoId: 'CN 2271', seqNum: '02030', empMessageType: '02032_ONBOARD_TRAIN_CONSIST', etcPhase: 'CONSIST', subdivision: 'MacTier',
    startTime: '14:19:00', status: 'degraded', latencyMs: 4200,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'EMP 02030 Consist Registration sent — 82 cars, 17,400 tons, 5,180 ft', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 180, hopDurationMs: 180, status: 'ok', detail: 'Signal nominal', signalDbm: -74, site: 'MacTier tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 520, hopDurationMs: 340, status: 'slow', detail: 'Queue delay: 1,800ms (threshold: 500ms) — Hornepayne site congested', site: 'Hornepayne' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 4200, hopDurationMs: 3680, status: 'slow', detail: 'EMP 02040 Consist Response after 4.2s — Trip Optimizer initialization timeout', site: 'Toronto NOC' },
    ],
  },
  { id: '02100-CN4412-20250514-004', locoId: 'CN 4412', seqNum: '02100', empMessageType: '02021_POLL_RESPONSE', etcPhase: 'POLLING', subdivision: 'Kingston',
    startTime: '12:55:18', status: 'failed', latencyMs: 0,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'EMP 02100 Polling request sent — expected 02110 response within 30s', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 95, hopDurationMs: 95, status: 'ok', detail: 'Signal clear', signalDbm: -69, site: 'Napanee tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 280, hopDurationMs: 185, status: 'ok', detail: 'Routed via Napanee site', site: 'Napanee' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 0, hopDurationMs: 0, status: 'failed', detail: 'EMP 02110 Polling Response not received — NSR flag raised, BOS polling mismatch detected', site: 'Toronto NOC' },
    ],
  },
  {
    id: '02050-CN7701-20250514-005', locoId: 'CN 7701', seqNum: 'PTC-SEQ-33901', subdivision: 'Ruel',
    startTime: '12:44:05', status: 'degraded', latencyMs: 6800,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #33901', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 310, hopDurationMs: 310, status: 'slow', detail: 'Marginal signal, 3 retries', signalDbm: -88, site: 'Hornepayne tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 1200, hopDurationMs: 890, status: 'slow', detail: 'Hornepayne site degraded — queue backup', site: 'Hornepayne' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 6800, hopDurationMs: 5600, status: 'slow', detail: 'Received after 6.8s — CDU display blank, crew unaware', site: 'Toronto NOC' },
    ],
  },
  {
    id: '02060-CN9201-20250514-006', locoId: 'CN 9201', seqNum: 'PTC-SEQ-44120', subdivision: 'Wainwright',
    startTime: '12:18:28', status: 'complete', latencyMs: 720,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #44120', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 140, hopDurationMs: 140, status: 'ok', detail: 'Strong signal', signalDbm: -71, site: 'Wainwright tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 390, hopDurationMs: 250, status: 'ok', detail: 'Routed via Wainwright site', site: 'Wainwright' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 720, hopDurationMs: 330, status: 'ok', detail: 'Acknowledged — authority granted', site: 'Edmonton NOC' },
    ],
  },
  { id: '101-CN5812-20250514-007', locoId: 'CN 5812', seqNum: '101', empMessageType: '101_BL_OPK_REQUEST', etcPhase: 'SW_VALIDATION', subdivision: 'Edson',
    startTime: '11:22:14', status: 'failed', latencyMs: 0,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'EMP 101 BL-OPK Key Exchange Request sent to KES — daily key renewal', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 88, hopDurationMs: 88, status: 'ok', detail: 'Signal nominal', signalDbm: -75, site: 'Jasper tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 0, hopDurationMs: 0, status: 'failed', detail: 'Jasper COBRA site offline — KES request cannot be routed', site: 'Jasper' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 0, hopDurationMs: 0, status: 'failed', detail: 'EMP 102 BL-OPK Response never received — loco cannot authenticate at next subdivision boundary', site: 'Edmonton NOC' },
    ],
  },
  {
    id: '02000-CN2743-20250514-008', locoId: 'CN 2743', seqNum: 'PTC-SEQ-22811', subdivision: 'Bala',
    startTime: '10:31:08', status: 'complete', latencyMs: 1050,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #22811', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 200, hopDurationMs: 200, status: 'ok', detail: 'Signal clear', signalDbm: -70, site: 'Barrie tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 560, hopDurationMs: 360, status: 'ok', detail: 'Routed via Barrie site', site: 'Barrie' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 1050, hopDurationMs: 490, status: 'ok', detail: 'Acknowledged — authority granted', site: 'Toronto NOC' },
    ],
  },
  {
    id: '02050-CN6612-20250514-009', locoId: 'CN 6612', seqNum: 'PTC-SEQ-10092', subdivision: 'Capreol',
    startTime: '10:05:33', status: 'complete', latencyMs: 980,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #10092', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 155, hopDurationMs: 155, status: 'ok', detail: 'Signal nominal', signalDbm: -73, site: 'Capreol tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 420, hopDurationMs: 265, status: 'ok', detail: 'Routed via Capreol site', site: 'Capreol' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 980, hopDurationMs: 560, status: 'ok', detail: 'Acknowledged — authority granted', site: 'Toronto NOC' },
    ],
  },
  {
    id: '02030-CN8801-20250514-010', locoId: 'CN 8801', seqNum: 'PTC-SEQ-29944', subdivision: 'MacTier',
    startTime: '09:48:12', status: 'degraded', latencyMs: 3100,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #29944', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 240, hopDurationMs: 240, status: 'slow', detail: 'Signal degraded, 2 retries', signalDbm: -84, site: 'MacTier tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 900, hopDurationMs: 660, status: 'slow', detail: 'MacTier site queue congested', site: 'MacTier' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 3100, hopDurationMs: 2200, status: 'slow', detail: 'Received after 3.1s — authority delayed', site: 'Toronto NOC' },
    ],
  },
  {
    id: '02060-CN3301-20250514-011', locoId: 'CN 3301', seqNum: 'PTC-SEQ-48821', subdivision: 'Rivers',
    startTime: '09:22:55', status: 'complete', latencyMs: 810,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #48821', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 165, hopDurationMs: 165, status: 'ok', detail: 'Signal clear', signalDbm: -67, site: 'Rivers tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 410, hopDurationMs: 245, status: 'ok', detail: 'Routed via Rivers site', site: 'Rivers' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 810, hopDurationMs: 400, status: 'ok', detail: 'Acknowledged — authority granted', site: 'Winnipeg NOC' },
    ],
  },
  { id: '02000-CN4190-20250514-012', locoId: 'CN 4190', seqNum: '02000', empMessageType: '02000_VERIFY_EMPLOYEE_INFO_REQ', etcPhase: 'CREW_AUTH', subdivision: 'Kingston',
    startTime: '09:11:44', status: 'failed', latencyMs: 0,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'EMP 02000 Crew Authentication request prepared — Crew ID CRW-4190', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 0, hopDurationMs: 0, status: 'failed', detail: 'Radio hardware fault — no transmission possible, signal -99 dBm', signalDbm: -99, site: 'Kingston tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 0, hopDurationMs: 0, status: 'failed', detail: 'No signal received from loco — COBRA site cannot relay', site: 'Napanee' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 0, hopDurationMs: 0, status: 'failed', detail: 'EMP 02010 Crew Auth Response never delivered — crew cannot be authenticated, departure blocked', site: 'Toronto NOC' },
    ],
  },
  {
    id: '02090-CN7120-20250514-013', locoId: 'CN 7120', seqNum: 'PTC-SEQ-81002', subdivision: 'Edson',
    startTime: '08:55:30', status: 'complete', latencyMs: 660,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #81002', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 130, hopDurationMs: 130, status: 'ok', detail: 'Strong signal', signalDbm: -65, site: 'Edson tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 350, hopDurationMs: 220, status: 'ok', detail: 'Routed via Edson site', site: 'Edson' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 660, hopDurationMs: 310, status: 'ok', detail: 'Acknowledged — authority granted', site: 'Edmonton NOC' },
    ],
  },
  {
    id: '02100-CN5240-20250514-014', locoId: 'CN 5240', seqNum: 'PTC-SEQ-60011', subdivision: 'Wainwright',
    startTime: '08:30:18', status: 'degraded', latencyMs: 5500,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #60011', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 290, hopDurationMs: 290, status: 'slow', detail: 'Weak signal in valley', signalDbm: -86, site: 'Wainwright tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 1400, hopDurationMs: 1110, status: 'slow', detail: 'Wainwright site high load', site: 'Wainwright' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 5500, hopDurationMs: 4100, status: 'slow', detail: 'Received after 5.5s — approaching enforcement threshold', site: 'Edmonton NOC' },
    ],
  },
  {
    id: '02060-CN2090-20250514-015', locoId: 'CN 2090', seqNum: 'PTC-SEQ-19283', subdivision: 'Capreol',
    startTime: '08:12:44', status: 'complete', latencyMs: 750,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #19283', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 145, hopDurationMs: 145, status: 'ok', detail: 'Signal nominal', signalDbm: -72, site: 'Capreol tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 395, hopDurationMs: 250, status: 'ok', detail: 'Routed via Capreol site', site: 'Capreol' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 750, hopDurationMs: 355, status: 'ok', detail: 'Acknowledged — authority granted', site: 'Toronto NOC' },
    ],
  },
  {
    id: '02030-CN6633-20250514-016', locoId: 'CN 6633', seqNum: 'PTC-SEQ-92100', subdivision: 'Bala',
    startTime: '07:58:02', status: 'failed', latencyMs: 0,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #92100', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 175, hopDurationMs: 175, status: 'ok', detail: 'Signal clear', signalDbm: -70, site: 'Barrie tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 430, hopDurationMs: 255, status: 'ok', detail: 'Routed via Barrie site', site: 'Barrie' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 0, hopDurationMs: 0, status: 'failed', detail: 'BOS process crash — message dropped', site: 'Toronto NOC' },
    ],
  },
  {
    id: '101-CN1122-20250514-017', locoId: 'CN 1122', seqNum: 'PTC-SEQ-55001', subdivision: 'Rivers',
    startTime: '07:41:19', status: 'complete', latencyMs: 920,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #55001', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 190, hopDurationMs: 190, status: 'ok', detail: 'Signal clear', signalDbm: -69, site: 'Rivers tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 480, hopDurationMs: 290, status: 'ok', detail: 'Routed via Rivers site', site: 'Rivers' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 920, hopDurationMs: 440, status: 'ok', detail: 'Acknowledged — authority granted', site: 'Winnipeg NOC' },
    ],
  },
  {
    id: '02050-CN9900-20250514-018', locoId: 'CN 9900', seqNum: 'PTC-SEQ-38811', subdivision: 'MacTier',
    startTime: '07:22:05', status: 'complete', latencyMs: 830,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #38811', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 160, hopDurationMs: 160, status: 'ok', detail: 'Signal nominal', signalDbm: -71, site: 'MacTier tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 430, hopDurationMs: 270, status: 'ok', detail: 'Routed via MacTier site', site: 'MacTier' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 830, hopDurationMs: 400, status: 'ok', detail: 'Acknowledged — authority granted', site: 'Toronto NOC' },
    ],
  },
  {
    id: '02000-CN4455-20250514-019', locoId: 'CN 4455', seqNum: 'PTC-SEQ-11900', subdivision: 'Ruel',
    startTime: '07:05:44', status: 'degraded', latencyMs: 2800,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #11900', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 220, hopDurationMs: 220, status: 'ok', detail: 'Signal nominal', signalDbm: -76, site: 'Hornepayne tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 600, hopDurationMs: 380, status: 'slow', detail: 'Hornepayne site partial outage', site: 'Hornepayne' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 2800, hopDurationMs: 2200, status: 'slow', detail: 'Received after 2.8s — marginal Trip Optimizer init', site: 'Toronto NOC' },
    ],
  },
  {
    id: '02090-CN3388-20250514-020', locoId: 'CN 3388', seqNum: 'PTC-SEQ-77700', subdivision: 'Kingston',
    startTime: '06:50:11', status: 'complete', latencyMs: 680,
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Sent PTC msg #77700', site: 'On-board' },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 130, hopDurationMs: 130, status: 'ok', detail: 'Strong signal', signalDbm: -66, site: 'Kingston tower' },
      { name: 'COBRA Site', system: 'COBRA', timestampOffset: 360, hopDurationMs: 230, status: 'ok', detail: 'Routed via Kingston site', site: 'Kingston' },
      { name: 'BOS Receiver', system: 'BOS', timestampOffset: 680, hopDurationMs: 320, status: 'ok', detail: 'Acknowledged — authority granted', site: 'Toronto NOC' },
    ],
  },
  // ─── PTC Traces (US/CSXT Interop Subdivisions) ────────────────────────────────────────────────────────────────────
  {
    id: '02050-CSXT7210-20250514-021', locoId: 'CSXT 7210', seqNum: 'PTC-SEQ-88100', subdivision: 'CSXT Barr (Chicago)',
    startTime: '07:15:44', status: 'complete', latencyMs: 720, safetySystem: 'PTC',
    empMessageType: '02050_CREW_AUTH_REQUEST',
    etcPhase: 'AUTHORITY',
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'PTC authority request initiated', site: 'On-board', signalDbm: -71 },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 140, hopDurationMs: 140, status: 'ok', detail: 'PTC radio link active', signalDbm: -74, site: 'Chicago Barr tower' },
      { name: 'CSXT BOS', system: 'BOS', timestampOffset: 420, hopDurationMs: 280, status: 'ok', detail: 'CSXT Back-Office Server received', site: 'Jacksonville NOC' },
      { name: 'BOS Response', system: 'BOS', timestampOffset: 720, hopDurationMs: 300, status: 'ok', detail: 'Authority granted to MP 44.2', site: 'Jacksonville NOC' },
    ],
  },
  {
    id: '02060-CSXT8841-20250514-022', locoId: 'CSXT 8841', seqNum: 'PTC-SEQ-88200', subdivision: 'CSXT Toledo (Ohio)',
    startTime: '08:02:19', status: 'degraded', latencyMs: 3100, safetySystem: 'PTC',
    empMessageType: '02052_CONFIRM_MOVEMENT_AUTHORITY',
    etcPhase: 'AUTHORITY',
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'PTC authority request sent', site: 'On-board', signalDbm: -78 },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 200, hopDurationMs: 200, status: 'slow', detail: 'Marginal signal — cell fallback active', signalDbm: -88, site: 'Toledo tower' },
      { name: 'CSXT BOS', system: 'BOS', timestampOffset: 1800, hopDurationMs: 1600, status: 'slow', detail: 'BOS processing delay — high load', site: 'Jacksonville NOC' },
      { name: 'BOS Response', system: 'BOS', timestampOffset: 3100, hopDurationMs: 1300, status: 'ok', detail: 'Authority granted with delay', site: 'Jacksonville NOC' },
    ],
  },
  {
    id: '02000-CSXT5530-20250514-023', locoId: 'CSXT 5530', seqNum: 'PTC-SEQ-88300', subdivision: 'CSXT Willard (Ohio)',
    startTime: '09:44:02', status: 'failed', latencyMs: 5200, safetySystem: 'PTC',
    empMessageType: '02000_VERIFY_EMPLOYEE_INFO_REQ',
    etcPhase: 'CREW_AUTH',
    aiDiagnosis: 'PTC crew authentication failed at CSXT Willard subdivision. I-ETMS onboard unit transmitted EMP-02000 Crew Auth message but received no acknowledgment from CSXT BOS within the 5-second timeout window. Likely cause: BOS authentication service degraded or 220MHz radio coverage gap near MP 88. Recommend: verify CSXT BOS auth service status and check radio coverage at Willard MP 85-92.',
    hops: [
      { name: 'I-ETMS (Loco)', system: 'OWL Agent', timestampOffset: 0, hopDurationMs: 0, status: 'ok', detail: 'Crew auth request sent', site: 'On-board', signalDbm: -82 },
      { name: '220MHz Radio', system: 'ITCnet', timestampOffset: 300, hopDurationMs: 300, status: 'slow', detail: 'Weak signal near MP 88', signalDbm: -91, site: 'Willard tower' },
      { name: 'CSXT BOS', system: 'BOS', timestampOffset: 5200, hopDurationMs: 4900, status: 'failed', detail: 'Auth service timeout — no response', site: 'Jacksonville NOC' },
    ],
  },
];



// ─── Asset Inventory ───────────────────────────────────────────────────────────
export const assets: Asset[] = [
  {
    id: 'LOCO-3864', name: 'CN 3864', type: 'locomotive', status: 'critical',
    subdivision: 'Ruel', milepost: '142.3', lastSeen: '2 min ago', system: 'OWL',
    details: { 'PTC State': 'Enforcement', 'LIG': 'Disconnected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Inactive' },
    etcState: 'ACTIVE', blOpkStatus: 'VALID', blOpkIssuedAt: '2026-05-19T05:44:00Z', blOpkExpiresAt: '2026-05-20T05:44:00Z',
    pollingStatus: 'OK', lastPollAt: '2 min ago',
    ptcMissionCritical: true, opCode: 'SM', position: 'LEAD', locoModel: 'ET44AC', locoClass: 'EF-644F',
    lastHeartbeat: '2m', location: 'RUEL, HORNEPAYNE, CA', ptcEquipped: true, tripOptimizerOperative: false,
    criticalAlarmCount: 3, warningAlarmCount: 2, infoAlarmCount: 0,
    subsystems: {
      cdu: [{ name: 'CDU Eng.', status: 'ok', detail: '4d 15:52:40' }, { name: 'CDU Cond.', status: 'ok', detail: '4d 15:52:41' }],
      tmc: [
        { name: 'CPU1', status: 'ok' }, { name: 'CPU2', status: 'ok' }, { name: 'CPU3', status: 'ok' },
        { name: 'RSM', status: 'ok' }, { name: 'EBI', status: 'ok' }, { name: 'IOC', status: 'ok' },
        { name: 'DIO', status: 'ok' }, { name: 'SLOT10', status: 'warning', detail: '14d 13:44:10' },
      ],
      acc: [
        { name: 'SMM', status: 'ok' }, { name: 'WCM', status: 'ok' },
        { name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' },
        { name: 'WIFI1', status: 'ok' }, { name: 'WIFI2', status: 'ok' },
        { name: 'HPEAP', status: 'ok' }, { name: 'PSM', status: 'ok' },
      ],
      locoSystems: [
        { name: 'Contr. Syst. (TMC-DIO)', status: 'ok' },
        { name: 'Radio 220 Mhz', status: 'critical', detail: 'VSWR NA' },
        { name: 'Westermo', status: 'warning', detail: '17 days, 16:56' },
      ],
      recordingSystem: [
        { name: 'Voltage', status: 'critical', detail: '0.0V' },
        { name: 'ER System', status: 'warning' },
        { name: 'Data recorder (CHM)', status: 'ok' }, { name: 'SSD', status: 'ok' },
        { name: 'Outward Facing Video', status: 'ok' }, { name: 'Inward Facing Video', status: 'ok' },
        { name: 'Inward Facing Audio', status: 'ok' }, { name: 'External Audio', status: 'ok' },
      ],
      gps: [
        { name: 'GPS1', status: 'critical', detail: '?' }, { name: 'GPS2', status: 'critical', detail: '?' },
        { name: 'GNSS1', status: 'ok' }, { name: 'GNSS2', status: 'ok' },
      ],
      comms: [
        { name: 'OWL Agent', status: 'critical', detail: 'May 19 01:54:21 2026 - owl-19.1.14' },
        { name: 'Loco. TMC', status: 'critical', detail: 'May 19 00:36:37 2026' },
      ],
      resilio: [{ name: 'Resilio', status: 'critical', detail: 'v3.8.3.2313 — Last Seen: May 19 01:55:35 2026 — Status: error' }],
      itcmRoutes: [
        { name: 'CELL 1', status: 'ok', detail: 'May 17 15:15:40 2026' },
        { name: 'CELL 2', status: 'ok', detail: 'May 17 15:15:34 2026' },
        { name: 'Radio 220Mhz', status: 'critical' },
      ],
    },
    openAlarms: [
      { id: 'ALM-3864-001', startTime: 'May 19 00:46:21', lastUpdate: 'May 19 01:54:21', subsystem: 'TMC', severity: 'warning', message: 'SLOT10 not connected to Radio' },
      { id: 'ALM-3864-002', startTime: 'May 16 22:21:11', lastUpdate: 'May 19 01:54:21', subsystem: 'ACC', severity: 'warning', message: 'The connectivity with the EDAP (LEAM) cannot be established.' },
      { id: 'ALM-3864-003', startTime: 'May 16 22:21:11', lastUpdate: 'May 19 01:54:21', subsystem: 'ACC', severity: 'warning', message: 'The connectivity with the EDAP (BSR) cannot be established.' },
      { id: 'ALM-3864-004', startTime: 'May 16 22:21:11', lastUpdate: 'May 19 01:54:21', subsystem: 'ACC', severity: 'critical', message: 'Radio VSWR out of range NaN' },
      { id: 'ALM-3864-005', startTime: 'May 16 03:55:08', lastUpdate: 'May 19 01:54:21', subsystem: 'GPS', severity: 'critical', message: 'PTC: Dual DURO DURO2 bad antenna GNSS2=Invalid Comm2=True' },
      { id: 'ALM-3864-006', startTime: 'May 16 03:55:08', lastUpdate: 'May 19 01:54:21', subsystem: 'GPS', severity: 'critical', message: 'PTC: Dual DURO DURO1 bad antenna GNSS1=Invalid Comm1=True' },
      { id: 'ALM-3864-007', startTime: 'Nov 18 16:19:04', lastUpdate: 'May 19 01:54:21', subsystem: 'CI', severity: 'warning', message: 'Locomotive has no voltage: 0.0 V!' },
    ],
    closedAlarms: [
      { id: 'ALM-3864-C01', startTime: 'May 14 08:12:00', lastUpdate: 'May 14 09:44:00', subsystem: 'TMC', severity: 'warning', message: 'CPU3 restart detected — recovered' },
    ],
    lvvr: {
      suppressionReason: null,
      agentResponsive: true,
      agentVersion: 'owl-19.1.14',
      agentLastSeen: 'May 19 01:54:21 2026',
      ldvrHealth: 'FAIL',
      ldvrModel: 'PowerView',
      erStatus: 'NOT_OPERATIONAL',
      erNotOperationalCount: 4,
      chmConnected: true,
      chmSerialNumber: 'CHM-A4F2-3864',
      chmPartitions: [
        { name: 'Loco Event', usagePct: 62, status: 'ok' },
        { name: 'PTC Data', usagePct: 78, status: 'ok' },
        { name: 'Audio/Video', usagePct: 94, status: 'warning' },
      ],
      ssdConnected: true,
      ssdSerialNumber: 'SSD-B9C1-3864',
      ssdPartitions: [
        { name: 'Loco Event', usagePct: 45, status: 'ok' },
        { name: 'PTC Data', usagePct: 55, status: 'ok' },
        { name: 'Audio/Video', usagePct: 91, status: 'warning' },
      ],
      cameras: [
        { id: 1, label: 'Outward Camera', healthOk: false, recordingVideo: false, recordingAudio: false, state: 'Fault' },
        { id: 2, label: 'Inward Camera 1', healthOk: false, recordingVideo: false, recordingAudio: false, state: 'Fault' },
        { id: 3, label: 'Inward Camera 2', healthOk: false, recordingVideo: false, recordingAudio: false, state: 'Fault' },
      ],
      micHealthOk: false,
      micRecordingAudio: false,
    },
  },
  {
    id: 'LOCO-5501', name: 'CN 5501', type: 'locomotive', status: 'operational',
    subdivision: 'Bala', milepost: '88.7', lastSeen: '30 sec ago', system: 'OWL',
    details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Active' },
    etcState: 'ACTIVE', blOpkStatus: 'VALID', blOpkIssuedAt: '2026-05-19T06:10:00Z', blOpkExpiresAt: '2026-05-20T06:10:00Z',
    pollingStatus: 'OK', lastPollAt: '30 sec ago',
    ptcMissionCritical: true, opCode: 'LN', position: 'LEAD', locoModel: 'C44-9W', locoClass: 'GF-643C',
    lastHeartbeat: '30s', location: 'BALA, BARRIE, CA', ptcEquipped: true, tripOptimizerOperative: true,
    criticalAlarmCount: 0, warningAlarmCount: 0, infoAlarmCount: 0,
    subsystems: {
      cdu: [{ name: 'CDU Eng.', status: 'ok', detail: '1d 08:12:00' }, { name: 'CDU Cond.', status: 'ok', detail: '1d 08:12:01' }],
      tmc: [
        { name: 'CPU1', status: 'ok' }, { name: 'CPU2', status: 'ok' }, { name: 'CPU3', status: 'ok' },
        { name: 'RSM', status: 'ok' }, { name: 'EBI', status: 'ok' }, { name: 'IOC', status: 'ok' },
        { name: 'DIO', status: 'ok' }, { name: 'SLOT10', status: 'ok', detail: '1d 08:00:00' },
      ],
      acc: [
        { name: 'SMM', status: 'ok' }, { name: 'WCM', status: 'ok' },
        { name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' },
        { name: 'WIFI1', status: 'ok' }, { name: 'WIFI2', status: 'ok' },
        { name: 'HPEAP', status: 'ok' }, { name: 'PSM', status: 'ok' },
      ],
      locoSystems: [
        { name: 'Contr. Syst. (TMC-DIO)', status: 'ok' },
        { name: 'Radio 220 Mhz', status: 'ok', detail: 'VSWR 1.4' },
        { name: 'Westermo', status: 'ok', detail: '1 day, 08:10' },
      ],
      recordingSystem: [
        { name: 'Voltage', status: 'ok', detail: '74.2V' },
        { name: 'ER System', status: 'ok' },
        { name: 'Data recorder (CHM)', status: 'ok' }, { name: 'SSD', status: 'ok' },
        { name: 'Outward Facing Video', status: 'ok' }, { name: 'Inward Facing Video', status: 'ok' },
      ],
      gps: [
        { name: 'GPS1', status: 'ok' }, { name: 'GPS2', status: 'ok' },
        { name: 'GNSS1', status: 'ok' }, { name: 'GNSS2', status: 'ok' },
      ],
      comms: [
        { name: 'OWL Agent', status: 'ok', detail: 'May 19 01:54:21 2026 - owl-19.1.14' },
        { name: 'Loco. TMC', status: 'ok', detail: 'May 19 01:54:00 2026' },
      ],
      resilio: [{ name: 'Resilio', status: 'ok', detail: 'v3.8.3.2313 — Last Seen: May 19 01:55:00 2026 — Status: ok' }],
      itcmRoutes: [
        { name: 'CELL 1', status: 'ok', detail: 'May 19 01:54:00 2026' },
        { name: 'CELL 2', status: 'ok', detail: 'May 19 01:54:00 2026' },
        { name: 'Radio 220Mhz', status: 'ok' },
      ],
    },
    openAlarms: [],
    closedAlarms: [],
    lvvr: {
      suppressionReason: null,
      agentResponsive: true,
      agentVersion: 'owl-19.1.14',
      agentLastSeen: 'May 19 01:54:00 2026',
      ldvrHealth: 'NORMAL',
      ldvrModel: 'PowerView',
      erStatus: 'NORMAL',
      chmConnected: true,
      chmSerialNumber: 'CHM-C3D1-5501',
      chmPartitions: [
        { name: 'Loco Event', usagePct: 38, status: 'ok' },
        { name: 'PTC Data', usagePct: 44, status: 'ok' },
        { name: 'Audio/Video', usagePct: 61, status: 'ok' },
      ],
      ssdConnected: true,
      ssdSerialNumber: 'SSD-D4E2-5501',
      ssdPartitions: [
        { name: 'Loco Event', usagePct: 29, status: 'ok' },
        { name: 'PTC Data', usagePct: 33, status: 'ok' },
        { name: 'Audio/Video', usagePct: 52, status: 'ok' },
      ],
      cameras: [
        { id: 1, label: 'Outward Camera', healthOk: true, recordingVideo: true, recordingAudio: true, state: 'Recording' },
        { id: 2, label: 'Inward Camera 1', healthOk: true, recordingVideo: true, recordingAudio: true, state: 'Recording' },
        { id: 3, label: 'Inward Camera 2', healthOk: true, recordingVideo: true, recordingAudio: true, state: 'Recording' },
      ],
      micHealthOk: true,
      micRecordingAudio: true,
    },
  },
  {
    id: 'LOCO-2271', name: 'CN 2271', type: 'locomotive', status: 'warning',
    subdivision: 'MacTier', lastSeen: '1 min ago', system: 'OWL',
    details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Failed Init' },
    etcState: 'ACTIVE', blOpkStatus: 'EXPIRING', blOpkIssuedAt: '2026-05-18T07:30:00Z', blOpkExpiresAt: '2026-05-19T07:30:00Z',
    pollingStatus: 'OK', lastPollAt: '1 min ago',
    ptcMissionCritical: true, opCode: 'SM', position: 'LEAD', locoModel: 'AC44C6M', locoClass: 'EF-644D',
    lastHeartbeat: '1m', location: 'MACTIER, TORONTO, CA', ptcEquipped: true, tripOptimizerOperative: false,
    criticalAlarmCount: 0, warningAlarmCount: 2, infoAlarmCount: 1,
    subsystems: {
      cdu: [{ name: 'CDU Eng.', status: 'ok', detail: '2d 04:10:00' }, { name: 'CDU Cond.', status: 'ok', detail: '2d 04:10:01' }],
      tmc: [
        { name: 'CPU1', status: 'ok' }, { name: 'CPU2', status: 'ok' }, { name: 'CPU3', status: 'ok' },
        { name: 'RSM', status: 'ok' }, { name: 'EBI', status: 'ok' }, { name: 'IOC', status: 'ok' },
        { name: 'DIO', status: 'ok' }, { name: 'SLOT10', status: 'ok' },
      ],
      acc: [
        { name: 'SMM', status: 'ok' }, { name: 'WCM', status: 'ok' },
        { name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'warning', detail: 'Intermittent' },
        { name: 'WIFI1', status: 'ok' }, { name: 'WIFI2', status: 'ok' },
        { name: 'HPEAP', status: 'ok' }, { name: 'PSM', status: 'ok' },
      ],
      locoSystems: [
        { name: 'Contr. Syst. (TMC-DIO)', status: 'ok' },
        { name: 'Radio 220 Mhz', status: 'ok', detail: 'VSWR 1.6' },
        { name: 'Westermo', status: 'ok', detail: '2 days, 04:05' },
      ],
      recordingSystem: [
        { name: 'Voltage', status: 'ok', detail: '72.1V' },
        { name: 'ER System', status: 'ok' },
        { name: 'Data recorder (CHM)', status: 'ok' }, { name: 'SSD', status: 'ok' },
        { name: 'Outward Facing Video', status: 'ok' }, { name: 'Inward Facing Video', status: 'ok' },
      ],
      gps: [
        { name: 'GPS1', status: 'ok' }, { name: 'GPS2', status: 'ok' },
        { name: 'GNSS1', status: 'ok' }, { name: 'GNSS2', status: 'ok' },
      ],
      comms: [
        { name: 'OWL Agent', status: 'ok', detail: 'May 19 01:54:21 2026 - owl-19.1.14' },
        { name: 'Loco. TMC', status: 'warning', detail: 'May 18 22:10:00 2026 — delayed HB' },
      ],
      resilio: [{ name: 'Resilio', status: 'ok', detail: 'v3.8.3.2313 — Status: ok' }],
      itcmRoutes: [
        { name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'warning', detail: 'Intermittent' },
        { name: 'Radio 220Mhz', status: 'ok' },
      ],
    },
    openAlarms: [
      { id: 'ALM-2271-001', startTime: 'May 18 22:10:00', lastUpdate: 'May 19 01:54:21', subsystem: 'ACC', severity: 'warning', message: 'CELL 2 intermittent connectivity — packet loss 12%' },
      { id: 'ALM-2271-002', startTime: 'May 18 20:00:00', lastUpdate: 'May 19 01:54:21', subsystem: 'TMC', severity: 'warning', message: 'Trip Optimizer initialization failed — consist mismatch' },
      { id: 'ALM-2271-003', startTime: 'May 19 00:00:00', lastUpdate: 'May 19 01:54:21', subsystem: 'KES', severity: 'info', message: 'BL-OPK expiring in < 2h — renewal pending' },
    ],
    closedAlarms: [],
    lvvr: {
      suppressionReason: null,
      agentResponsive: true,
      agentVersion: 'owl-19.1.14',
      agentLastSeen: 'May 19 01:54:21 2026',
      ldvrHealth: 'NORMAL',
      ldvrModel: 'PowerView',
      erStatus: 'NORMAL',
      chmConnected: true,
      chmSerialNumber: 'CHM-E5F3-2271',
      chmPartitions: [
        { name: 'Loco Event', usagePct: 71, status: 'ok' },
        { name: 'PTC Data', usagePct: 82, status: 'ok' },
        { name: 'Audio/Video', usagePct: 93, status: 'warning' },
      ],
      ssdConnected: true,
      ssdSerialNumber: 'SSD-F6G4-2271',
      ssdPartitions: [
        { name: 'Loco Event', usagePct: 58, status: 'ok' },
        { name: 'PTC Data', usagePct: 66, status: 'ok' },
        { name: 'Audio/Video', usagePct: 74, status: 'ok' },
      ],
      cameras: [
        { id: 1, label: 'Outward Camera', healthOk: true, recordingVideo: true, recordingAudio: true, state: 'Recording' },
        { id: 2, label: 'Inward Camera 1', healthOk: true, recordingVideo: true, recordingAudio: true, state: 'Recording' },
        { id: 3, label: 'Inward Camera 2', healthOk: true, recordingVideo: true, recordingAudio: true, state: 'Recording' },
      ],
      micHealthOk: true,
      micRecordingAudio: true,
    },
  },
  {
    id: 'LOCO-8012', name: 'CN 8012', type: 'locomotive', status: 'operational',
    subdivision: 'Kingston', lastSeen: '45 sec ago', system: 'OWL',
    details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Active' },
    etcState: 'ACTIVE', blOpkStatus: 'VALID', blOpkIssuedAt: '2026-05-19T04:55:00Z', blOpkExpiresAt: '2026-05-20T04:55:00Z',
    pollingStatus: 'OK', lastPollAt: '45 sec ago',
    ptcMissionCritical: true, opCode: 'LN', position: 'LEAD', locoModel: 'SD75I', locoClass: 'GF-643C',
    lastHeartbeat: '45s', location: 'KINGSTON, TORONTO, CA', ptcEquipped: true, tripOptimizerOperative: true,
    criticalAlarmCount: 0, warningAlarmCount: 0, infoAlarmCount: 0,
    subsystems: {
      cdu: [{ name: 'CDU Eng.', status: 'ok' }, { name: 'CDU Cond.', status: 'ok' }],
      tmc: [
        { name: 'CPU1', status: 'ok' }, { name: 'CPU2', status: 'ok' }, { name: 'CPU3', status: 'ok' },
        { name: 'RSM', status: 'ok' }, { name: 'EBI', status: 'ok' }, { name: 'IOC', status: 'ok' },
        { name: 'DIO', status: 'ok' }, { name: 'SLOT10', status: 'ok' },
      ],
      acc: [
        { name: 'SMM', status: 'ok' }, { name: 'WCM', status: 'ok' },
        { name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' },
        { name: 'WIFI1', status: 'ok' }, { name: 'WIFI2', status: 'ok' },
        { name: 'HPEAP', status: 'ok' }, { name: 'PSM', status: 'ok' },
      ],
      locoSystems: [
        { name: 'Contr. Syst. (TMC-DIO)', status: 'ok' },
        { name: 'Radio 220 Mhz', status: 'ok', detail: 'VSWR 1.3' },
        { name: 'Westermo', status: 'ok', detail: '3 days, 11:22' },
      ],
      gps: [{ name: 'GPS1', status: 'ok' }, { name: 'GPS2', status: 'ok' }, { name: 'GNSS1', status: 'ok' }, { name: 'GNSS2', status: 'ok' }],
      comms: [{ name: 'OWL Agent', status: 'ok', detail: 'May 19 01:54:21 2026' }, { name: 'Loco. TMC', status: 'ok' }],
      resilio: [{ name: 'Resilio', status: 'ok', detail: 'v3.8.3.2313 — Status: ok' }],
      itcmRoutes: [{ name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' }, { name: 'Radio 220Mhz', status: 'ok' }],
    },
    openAlarms: [], closedAlarms: [],
  },
  {
    id: 'LOCO-4412', name: 'CN 4412', type: 'locomotive', status: 'critical',
    subdivision: 'Kingston', milepost: '188.4', lastSeen: '5 min ago', system: 'OWL',
    details: { 'PTC State': 'NSR', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Inactive' },
    etcState: 'FAILED', blOpkStatus: 'VALID', blOpkIssuedAt: '2026-05-19T05:20:00Z', blOpkExpiresAt: '2026-05-20T05:20:00Z',
    pollingStatus: 'MISMATCH', lastPollAt: '5 min ago',
    ptcMissionCritical: true, opCode: 'SM', position: 'LEAD', locoModel: 'C44-9W', locoClass: 'EF-644ZC',
    lastHeartbeat: '5m', location: 'KINGSTON, TORONTO, CA', ptcEquipped: true, tripOptimizerOperative: false,
    criticalAlarmCount: 3, warningAlarmCount: 1, infoAlarmCount: 0,
    subsystems: {
      cdu: [{ name: 'CDU Eng.', status: 'ok' }, { name: 'CDU Cond.', status: 'ok' }],
      tmc: [
        { name: 'CPU1', status: 'ok' }, { name: 'CPU2', status: 'ok' }, { name: 'CPU3', status: 'ok' },
        { name: 'RSM', status: 'ok' }, { name: 'EBI', status: 'ok' }, { name: 'IOC', status: 'ok' },
        { name: 'DIO', status: 'ok' }, { name: 'SLOT10', status: 'ok' },
      ],
      acc: [
        { name: 'SMM', status: 'ok' }, { name: 'WCM', status: 'ok' },
        { name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' },
        { name: 'WIFI1', status: 'ok' }, { name: 'WIFI2', status: 'ok' },
        { name: 'HPEAP', status: 'ok' }, { name: 'PSM', status: 'ok' },
      ],
      locoSystems: [
        { name: 'Contr. Syst. (TMC-DIO)', status: 'ok' },
        { name: 'Radio 220 Mhz', status: 'ok', detail: 'VSWR 1.5' },
        { name: 'Westermo', status: 'ok' },
      ],
      gps: [{ name: 'GPS1', status: 'ok' }, { name: 'GPS2', status: 'ok' }, { name: 'GNSS1', status: 'ok' }, { name: 'GNSS2', status: 'ok' }],
      comms: [{ name: 'OWL Agent', status: 'critical', detail: 'NSR flag active' }, { name: 'Loco. TMC', status: 'ok' }],
      resilio: [{ name: 'Resilio', status: 'ok', detail: 'v3.8.3.2313 — Status: ok' }],
      itcmRoutes: [{ name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' }, { name: 'Radio 220Mhz', status: 'ok' }],
    },
    openAlarms: [
      { id: 'ALM-4412-001', startTime: 'May 19 01:00:00', lastUpdate: 'May 19 01:54:21', subsystem: 'BOS', severity: 'critical', message: 'Polling State Mismatch — authority vs BOS record' },
      { id: 'ALM-4412-002', startTime: 'May 19 00:55:00', lastUpdate: 'May 19 01:54:21', subsystem: 'I-ETMS', severity: 'critical', message: 'NSR — No Signal Response from BOS within timeout' },
      { id: 'ALM-4412-003', startTime: 'May 18 22:00:00', lastUpdate: 'May 19 01:54:21', subsystem: 'CI', severity: 'critical', message: 'Trip Optimizer inactive — consist data mismatch' },
      { id: 'ALM-4412-004', startTime: 'May 18 20:00:00', lastUpdate: 'May 19 01:54:21', subsystem: 'GPS', severity: 'warning', message: 'GPS accuracy degraded — HDOP > 4.0' },
    ],
    closedAlarms: [],
    lvvr: {
      suppressionReason: null,
      agentResponsive: true,
      agentVersion: 'owl-19.1.14',
      agentLastSeen: 'May 19 01:54:21 2026',
      ldvrHealth: 'ATTENTION',
      ldvrModel: 'PowerView',
      erStatus: 'NOT_OPERATIONAL',
      erNotOperationalCount: 2,
      chmConnected: true,
      chmSerialNumber: 'CHM-G7H5-4412',
      chmPartitions: [
        { name: 'Loco Event', usagePct: 55, status: 'ok' },
        { name: 'PTC Data', usagePct: 60, status: 'ok' },
        { name: 'Audio/Video', usagePct: 88, status: 'ok' },
      ],
      ssdConnected: true,
      ssdSerialNumber: 'SSD-H8I6-4412',
      ssdPartitions: [
        { name: 'Loco Event', usagePct: 42, status: 'ok' },
        { name: 'PTC Data', usagePct: 48, status: 'ok' },
        { name: 'Audio/Video', usagePct: 77, status: 'ok' },
      ],
      cameras: [
        { id: 1, label: 'Outward Camera', healthOk: true, recordingVideo: true, recordingAudio: true, state: 'Recording' },
        { id: 2, label: 'Inward Camera 1', healthOk: false, recordingVideo: false, recordingAudio: false, state: 'Fault' },
        { id: 3, label: 'Inward Camera 2', healthOk: false, recordingVideo: false, recordingAudio: false, state: 'Fault' },
      ],
      micHealthOk: true,
      micRecordingAudio: true,
    },
  },
  {
    id: 'LOCO-7701', name: 'CN 7701', type: 'locomotive', status: 'warning',
    subdivision: 'Ruel', milepost: '79.9', lastSeen: '3 min ago', system: 'OWL',
    details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'CDU': 'Blank' },
    etcState: 'ACTIVE', blOpkStatus: 'VALID', blOpkIssuedAt: '2026-05-19T03:15:00Z', blOpkExpiresAt: '2026-05-20T03:15:00Z',
    pollingStatus: 'OVERDUE', lastPollAt: '18 min ago',
    ptcMissionCritical: true, opCode: 'LD', position: 'LEAD', locoModel: 'SD75I', locoClass: 'GF-643B',
    lastHeartbeat: '3m', location: 'RUEL, HORNEPAYNE, CA', ptcEquipped: true, tripOptimizerOperative: true,
    criticalAlarmCount: 0, warningAlarmCount: 2, infoAlarmCount: 0,
    subsystems: {
      cdu: [{ name: 'CDU Eng.', status: 'warning', detail: 'Display blank — crew unaware' }, { name: 'CDU Cond.', status: 'ok' }],
      tmc: [
        { name: 'CPU1', status: 'ok' }, { name: 'CPU2', status: 'ok' }, { name: 'CPU3', status: 'ok' },
        { name: 'RSM', status: 'ok' }, { name: 'EBI', status: 'ok' }, { name: 'IOC', status: 'ok' },
        { name: 'DIO', status: 'ok' }, { name: 'SLOT10', status: 'ok' },
      ],
      acc: [
        { name: 'SMM', status: 'ok' }, { name: 'WCM', status: 'ok' },
        { name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' },
        { name: 'WIFI1', status: 'ok' }, { name: 'WIFI2', status: 'ok' },
        { name: 'HPEAP', status: 'ok' }, { name: 'PSM', status: 'ok' },
      ],
      locoSystems: [
        { name: 'Contr. Syst. (TMC-DIO)', status: 'ok' },
        { name: 'Radio 220 Mhz', status: 'warning', detail: 'VSWR 2.1 — marginal' },
        { name: 'Westermo', status: 'ok', detail: '5 days, 02:14' },
      ],
      gps: [{ name: 'GPS1', status: 'ok' }, { name: 'GPS2', status: 'ok' }, { name: 'GNSS1', status: 'ok' }, { name: 'GNSS2', status: 'ok' }],
      comms: [{ name: 'OWL Agent', status: 'ok', detail: 'May 19 01:54:21 2026' }, { name: 'Loco. TMC', status: 'ok' }],
      resilio: [{ name: 'Resilio', status: 'ok', detail: 'v3.8.3.2313 — Status: ok' }],
      itcmRoutes: [{ name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' }, { name: 'Radio 220Mhz', status: 'warning', detail: 'Marginal signal' }],
    },
    openAlarms: [
      { id: 'ALM-7701-001', startTime: 'May 19 00:30:00', lastUpdate: 'May 19 01:54:21', subsystem: 'CDU', severity: 'warning', message: 'CDU display blank — crew notification required' },
      { id: 'ALM-7701-002', startTime: 'May 18 23:00:00', lastUpdate: 'May 19 01:54:21', subsystem: 'ACC', severity: 'warning', message: 'Radio VSWR marginal — 2.1 (threshold: 2.0)' },
    ],
    closedAlarms: [],
    lvvr: {
      suppressionReason: null,
      agentResponsive: true,
      agentVersion: 'owl-19.1.14',
      agentLastSeen: 'May 19 01:54:21 2026',
      ldvrHealth: 'NORMAL',
      ldvrModel: 'PowerView',
      erStatus: 'NORMAL',
      chmConnected: true,
      chmSerialNumber: 'CHM-J9K7-7701',
      chmPartitions: [
        { name: 'Loco Event', usagePct: 48, status: 'ok' },
        { name: 'PTC Data', usagePct: 52, status: 'ok' },
        { name: 'Audio/Video', usagePct: 69, status: 'ok' },
      ],
      ssdConnected: true,
      ssdSerialNumber: 'SSD-L0M8-7701',
      ssdPartitions: [
        { name: 'Loco Event', usagePct: 35, status: 'ok' },
        { name: 'PTC Data', usagePct: 40, status: 'ok' },
        { name: 'Audio/Video', usagePct: 58, status: 'ok' },
      ],
      cameras: [
        { id: 1, label: 'Outward Camera', healthOk: true, recordingVideo: true, recordingAudio: true, state: 'Recording' },
        { id: 2, label: 'Inward Camera 1', healthOk: true, recordingVideo: true, recordingAudio: true, state: 'Recording' },
        { id: 3, label: 'Inward Camera 2', healthOk: true, recordingVideo: false, recordingAudio: false, state: 'Standby' },
      ],
      micHealthOk: true,
      micRecordingAudio: true,
    },
  },
  {
    id: 'LOCO-9201', name: 'CN 9201', type: 'locomotive', status: 'warning',
    subdivision: 'Wainwright', milepost: '122.4', lastSeen: '2 min ago', system: 'OWL',
    details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'BPP': 'Fault' },
    etcState: 'ACTIVE', blOpkStatus: 'VALID', blOpkIssuedAt: '2026-05-19T08:00:00Z', blOpkExpiresAt: '2026-05-20T08:00:00Z',
    pollingStatus: 'OK', lastPollAt: '2 min ago',
    ptcMissionCritical: false, opCode: 'SM', position: 'LEAD', locoModel: 'GP38-2', locoClass: 'GR-420C',
    lastHeartbeat: '2m', location: 'WAINWRIGHT, EDMONTON, CA', ptcEquipped: true, tripOptimizerOperative: true,
    criticalAlarmCount: 0, warningAlarmCount: 1, infoAlarmCount: 0,
    subsystems: {
      cdu: [{ name: 'CDU Eng.', status: 'ok' }, { name: 'CDU Cond.', status: 'ok' }],
      tmc: [
        { name: 'CPU1', status: 'ok' }, { name: 'CPU2', status: 'ok' }, { name: 'CPU3', status: 'ok' },
        { name: 'RSM', status: 'ok' }, { name: 'EBI', status: 'warning', detail: 'BPP/EBI fault' }, { name: 'IOC', status: 'ok' },
        { name: 'DIO', status: 'ok' }, { name: 'SLOT10', status: 'ok' },
      ],
      acc: [
        { name: 'SMM', status: 'ok' }, { name: 'WCM', status: 'ok' },
        { name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' },
        { name: 'WIFI1', status: 'ok' }, { name: 'WIFI2', status: 'ok' },
        { name: 'HPEAP', status: 'ok' }, { name: 'PSM', status: 'ok' },
      ],
      locoSystems: [
        { name: 'Contr. Syst. (TMC-DIO)', status: 'ok' },
        { name: 'Radio 220 Mhz', status: 'ok', detail: 'VSWR 1.4' },
        { name: 'Westermo', status: 'ok', detail: '2 days, 14:30' },
      ],
      gps: [{ name: 'GPS1', status: 'ok' }, { name: 'GPS2', status: 'ok' }, { name: 'GNSS1', status: 'ok' }, { name: 'GNSS2', status: 'ok' }],
      comms: [{ name: 'OWL Agent', status: 'ok', detail: 'May 19 01:54:21 2026' }, { name: 'Loco. TMC', status: 'ok' }],
      resilio: [{ name: 'Resilio', status: 'ok', detail: 'v3.8.3.2313 — Status: ok' }],
      itcmRoutes: [{ name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' }, { name: 'Radio 220Mhz', status: 'ok' }],
    },
    openAlarms: [
      { id: 'ALM-9201-001', startTime: 'May 19 00:10:00', lastUpdate: 'May 19 01:54:21', subsystem: 'TMC', severity: 'warning', message: 'BPP/EBI fault detected — brake performance monitoring degraded' },
    ],
    closedAlarms: [],
  },
  {
    id: 'LOCO-5812', name: 'CN 5812', type: 'locomotive', status: 'critical',
    subdivision: 'Edson', milepost: '80.2', lastSeen: '8 min ago', system: 'OWL',
    details: { 'PTC State': 'NSR', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Inactive' },
    etcState: 'FAILED', blOpkStatus: 'VALID', blOpkIssuedAt: '2026-05-19T02:40:00Z', blOpkExpiresAt: '2026-05-20T02:40:00Z',
    pollingStatus: 'MISMATCH', lastPollAt: '8 min ago',
    ptcMissionCritical: false, opCode: 'SM', position: 'LEAD', locoModel: 'SD75I', locoClass: 'GF-643A',
    lastHeartbeat: '8m', location: 'EDSON, JASPER, CA', ptcEquipped: true, tripOptimizerOperative: false,
    criticalAlarmCount: 2, warningAlarmCount: 1, infoAlarmCount: 0,
    subsystems: {
      cdu: [{ name: 'CDU Eng.', status: 'ok' }, { name: 'CDU Cond.', status: 'ok' }],
      tmc: [
        { name: 'CPU1', status: 'ok' }, { name: 'CPU2', status: 'ok' }, { name: 'CPU3', status: 'ok' },
        { name: 'RSM', status: 'ok' }, { name: 'EBI', status: 'ok' }, { name: 'IOC', status: 'ok' },
        { name: 'DIO', status: 'ok' }, { name: 'SLOT10', status: 'ok' },
      ],
      acc: [
        { name: 'SMM', status: 'ok' }, { name: 'WCM', status: 'ok' },
        { name: 'CELL 1', status: 'critical', detail: 'No signal — Jasper COBRA offline' }, { name: 'CELL 2', status: 'critical', detail: 'No signal — Jasper COBRA offline' },
        { name: 'WIFI1', status: 'ok' }, { name: 'WIFI2', status: 'ok' },
        { name: 'HPEAP', status: 'ok' }, { name: 'PSM', status: 'ok' },
      ],
      locoSystems: [
        { name: 'Contr. Syst. (TMC-DIO)', status: 'ok' },
        { name: 'Radio 220 Mhz', status: 'critical', detail: 'VSWR NA — Jasper site offline' },
        { name: 'Westermo', status: 'ok', detail: '8 days, 01:20' },
      ],
      gps: [{ name: 'GPS1', status: 'ok' }, { name: 'GPS2', status: 'ok' }, { name: 'GNSS1', status: 'ok' }, { name: 'GNSS2', status: 'ok' }],
      comms: [{ name: 'OWL Agent', status: 'critical', detail: 'NSR flag active — BOS unreachable' }, { name: 'Loco. TMC', status: 'ok' }],
      resilio: [{ name: 'Resilio', status: 'ok', detail: 'v3.8.3.2313 — Status: ok' }],
      itcmRoutes: [{ name: 'CELL 1', status: 'critical', detail: 'No route' }, { name: 'CELL 2', status: 'critical', detail: 'No route' }, { name: 'Radio 220Mhz', status: 'critical', detail: 'Jasper offline' }],
    },
    openAlarms: [
      { id: 'ALM-5812-001', startTime: 'May 19 01:22:00', lastUpdate: 'May 19 01:54:21', subsystem: 'BOS', severity: 'critical', message: 'NSR — Polling State Mismatch, authority vs BOS record' },
      { id: 'ALM-5812-002', startTime: 'May 19 01:22:00', lastUpdate: 'May 19 01:54:21', subsystem: 'COBRA', severity: 'critical', message: 'Jasper COBRA site offline — KES request cannot be routed' },
      { id: 'ALM-5812-003', startTime: 'May 18 20:00:00', lastUpdate: 'May 19 01:54:21', subsystem: 'ACC', severity: 'warning', message: 'CELL 1 & CELL 2 no signal — radio coverage gap near Jasper' },
    ],
    closedAlarms: [],
  },
  {
    id: 'LOCO-2743', name: 'CN 2743', type: 'locomotive', status: 'operational',
    subdivision: 'Bala', milepost: '18.7', lastSeen: '1 min ago', system: 'OWL',
    details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Active' },
    etcState: 'ACTIVE', blOpkStatus: 'VALID', blOpkIssuedAt: '2026-05-19T07:05:00Z', blOpkExpiresAt: '2026-05-20T07:05:00Z',
    pollingStatus: 'OK', lastPollAt: '1 min ago',
    ptcMissionCritical: true, opCode: 'LN', position: 'LEAD', locoModel: 'C44-9W', locoClass: 'GF-643C',
    lastHeartbeat: '1m', location: 'BALA, BARRIE, CA', ptcEquipped: true, tripOptimizerOperative: true,
    criticalAlarmCount: 0, warningAlarmCount: 0, infoAlarmCount: 0,
    subsystems: {
      cdu: [{ name: 'CDU Eng.', status: 'ok' }, { name: 'CDU Cond.', status: 'ok' }],
      tmc: [
        { name: 'CPU1', status: 'ok' }, { name: 'CPU2', status: 'ok' }, { name: 'CPU3', status: 'ok' },
        { name: 'RSM', status: 'ok' }, { name: 'EBI', status: 'ok' }, { name: 'IOC', status: 'ok' },
        { name: 'DIO', status: 'ok' }, { name: 'SLOT10', status: 'ok' },
      ],
      acc: [
        { name: 'SMM', status: 'ok' }, { name: 'WCM', status: 'ok' },
        { name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' },
        { name: 'WIFI1', status: 'ok' }, { name: 'WIFI2', status: 'ok' },
        { name: 'HPEAP', status: 'ok' }, { name: 'PSM', status: 'ok' },
      ],
      locoSystems: [
        { name: 'Contr. Syst. (TMC-DIO)', status: 'ok' },
        { name: 'Radio 220 Mhz', status: 'ok', detail: 'VSWR 1.3' },
        { name: 'Westermo', status: 'ok', detail: '1 day, 05:00' },
      ],
      gps: [{ name: 'GPS1', status: 'ok' }, { name: 'GPS2', status: 'ok' }, { name: 'GNSS1', status: 'ok' }, { name: 'GNSS2', status: 'ok' }],
      comms: [{ name: 'OWL Agent', status: 'ok', detail: 'May 19 01:54:21 2026' }, { name: 'Loco. TMC', status: 'ok' }],
      resilio: [{ name: 'Resilio', status: 'ok', detail: 'v3.8.3.2313 — Status: ok' }],
      itcmRoutes: [{ name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' }, { name: 'Radio 220Mhz', status: 'ok' }],
    },
    openAlarms: [], closedAlarms: [],
  },
  {
    id: 'LOCO-8801', name: 'CN 8801', type: 'locomotive', status: 'operational',
    subdivision: 'MacTier', milepost: '44.2', lastSeen: '20 min ago', system: 'OWL',
    details: { 'PTC State': 'Active', 'LIG': 'Connected', 'GPS': 'Active', 'TMC': 'Nominal', 'Trip Optimizer': 'Active' },
    etcState: 'ACTIVE', blOpkStatus: 'VALID', blOpkIssuedAt: '2026-05-19T01:30:00Z', blOpkExpiresAt: '2026-05-20T01:30:00Z',
    pollingStatus: 'OK', lastPollAt: '20 min ago',
    ptcMissionCritical: true, opCode: 'SM', position: 'LEAD', locoModel: 'AC44C6M', locoClass: 'EF-644D',
    lastHeartbeat: '20m', location: 'MACTIER, TORONTO, CA', ptcEquipped: true, tripOptimizerOperative: true,
    criticalAlarmCount: 0, warningAlarmCount: 0, infoAlarmCount: 0,
    subsystems: {
      cdu: [{ name: 'CDU Eng.', status: 'ok' }, { name: 'CDU Cond.', status: 'ok' }],
      tmc: [
        { name: 'CPU1', status: 'ok' }, { name: 'CPU2', status: 'ok' }, { name: 'CPU3', status: 'ok' },
        { name: 'RSM', status: 'ok' }, { name: 'EBI', status: 'ok' }, { name: 'IOC', status: 'ok' },
        { name: 'DIO', status: 'ok' }, { name: 'SLOT10', status: 'ok' },
      ],
      acc: [
        { name: 'SMM', status: 'ok' }, { name: 'WCM', status: 'ok' },
        { name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' },
        { name: 'WIFI1', status: 'ok' }, { name: 'WIFI2', status: 'ok' },
        { name: 'HPEAP', status: 'ok' }, { name: 'PSM', status: 'ok' },
      ],
      locoSystems: [
        { name: 'Contr. Syst. (TMC-DIO)', status: 'ok' },
        { name: 'Radio 220 Mhz', status: 'ok', detail: 'VSWR 1.4' },
        { name: 'Westermo', status: 'ok', detail: '4 days, 18:44' },
      ],
      gps: [{ name: 'GPS1', status: 'ok' }, { name: 'GPS2', status: 'ok' }, { name: 'GNSS1', status: 'ok' }, { name: 'GNSS2', status: 'ok' }],
      comms: [{ name: 'OWL Agent', status: 'ok', detail: 'May 19 01:54:21 2026' }, { name: 'Loco. TMC', status: 'ok' }],
      resilio: [{ name: 'Resilio', status: 'ok', detail: 'v3.8.3.2313 — Status: ok' }],
      itcmRoutes: [{ name: 'CELL 1', status: 'ok' }, { name: 'CELL 2', status: 'ok' }, { name: 'Radio 220Mhz', status: 'ok' }],
    },
    openAlarms: [], closedAlarms: [],
  },
  {
    id: 'WIU-CAP-201', name: 'WIU Capreol MP 201', type: 'wayside', status: 'critical',
    subdivision: 'Capreol', milepost: '201.0', lastSeen: '28 min ago', system: 'WASP',
    details: { 'Device Type': 'WIU', 'Last Heartbeat': '28 min ago', 'Power': 'Unknown', 'Comms': 'Offline' },
    wOpkState: 'UNKNOWN', pollingStatus: 'OVERDUE', lastPollAt: '28 min ago',
    wuiId: 'WIU:03', wmsStatus: 'FAULT', wrStatus: 'FAULT',
    filterTags: ['Critical', 'Stale WIUs', 'PTC Issue'],
    hazardDetectors: [
      { name: '1 TRACK', status: 'unknown' }, { name: '2 TRACK', status: 'unknown' },
      { name: '3 TRACK', status: 'unknown' }, { name: '1EA TRACK', status: 'unknown' },
      { name: 'LIGHT OUT', status: 'fault' }, { name: 'POWER OFF', status: 'fault' },
    ],
    signals: [
      { name: 'R SIGNAL', id: 14, aspects: ['dark', 'dark', 'dark'], count: 0 },
      { name: 'L SIGNAL', id: 16, aspects: ['dark', 'dark', 'dark'], count: 0 },
    ],
    switches: [
      { name: '1 SWITCH', id: '1000020', position: 'UNKNOWN' },
      { name: '2 SWITCH', id: '1000021', position: 'UNKNOWN' },
    ],
  },
  {
    id: 'WIU-BAL-44', name: 'WIU Bala MP 44.5', type: 'wayside', status: 'warning',
    subdivision: 'Bala', milepost: '44.5', lastSeen: '2 min ago', system: 'WASP',
    details: { 'Device Type': 'WIU', 'Last Heartbeat': '2 min ago', 'Power': 'OK', 'Comms': 'KES re-key in progress' },
    wOpkState: 'PRE_ACTIVATION', pollingStatus: 'OK', lastPollAt: '2 min ago',
    wuiId: 'WIU:04', wmsStatus: 'OK', wrStatus: 'OK', wdcId: 'WDC:01',
    filterTags: ['PTC Issue'],
    hazardDetectors: [
      { name: '1 TRACK', status: 'ok' }, { name: '2WA TRACK', status: 'ok' },
      { name: '4EA TRACK', status: 'active' }, { name: '1EA TRACK', status: 'ok' },
      { name: '8EA TRACK', status: 'ok' }, { name: '3 TRACK', status: 'ok' },
    ],
    signals: [
      { name: '4E SIGNAL', id: 6, aspects: ['red', 'red', 'red'], count: 15 },
      { name: '4W SIGNAL', id: 7, aspects: ['red', 'red', 'red'], count: 15 },
      { name: '2E SIGNAL', id: 4, aspects: ['red', 'red', 'red'], count: 15 },
      { name: '2W SIGNAL', id: 5, aspects: ['red', 'yellow', 'red'], count: 7 },
    ],
    switches: [
      { name: '3B SWITCH', id: '1000070', position: 'N' },
      { name: '1 SWITCH', id: '1000020', position: 'N' },
      { name: '9 SWITCH', id: '1000021', position: 'N' },
      { name: '5 SWITCH', id: '1000069', position: 'N' },
      { name: '7A SWITCH', id: '1000072', position: 'N' },
      { name: '7B SWITCH', id: '1000071', position: 'N' },
      { name: '3A SWITCH', id: '1000012', position: 'N' },
    ],
  },
  {
    id: 'WIU-KIN-188', name: 'WIU Kingston MP 188.4', type: 'wayside', status: 'operational',
    subdivision: 'Kingston', milepost: '188.4', lastSeen: '1 min ago', system: 'WASP',
    details: { 'Device Type': 'WIU', 'Last Heartbeat': '1 min ago', 'Power': 'OK', 'Comms': 'Nominal' },
    wOpkState: 'ACTIVE', pollingStatus: 'OK', lastPollAt: '1 min ago',
    wuiId: 'WIU:05', wmsStatus: 'OK', wrStatus: 'OK', wdcId: 'WDC:01',
    filterTags: [],
    hazardDetectors: [
      { name: '5 TRACK', status: 'ok' }, { name: '2WA TRACK', status: 'ok' },
      { name: '4EA TRACK', status: 'ok' }, { name: '1 TRACK', status: 'ok' },
      { name: '8EA TRACK', status: 'ok' }, { name: '10EA TRACK', status: 'ok' },
      { name: '2EA TRACK', status: 'ok' }, { name: '6EA TRACK', status: 'ok' },
      { name: '4WA TRACK', status: 'ok' }, { name: '3 TRACK', status: 'ok' },
    ],
    signals: [
      { name: '4E SIGNAL', id: 6, aspects: ['red', 'red', 'red'], count: 15 },
      { name: '4W SIGNAL', id: 7, aspects: ['red', 'red', 'red'], count: 15 },
      { name: '8E SIGNAL', id: 9, aspects: ['red', 'red', 'red'], count: 15 },
      { name: '2E SIGNAL', id: 4, aspects: ['red', 'red', 'red'], count: 15 },
      { name: '10E SIGNAL', id: 3, aspects: ['red', 'red', 'red'], count: 15 },
      { name: '6E SIGNAL', id: 8, aspects: ['red', 'red', 'red'], count: 15 },
      { name: '2W SIGNAL', id: 5, aspects: ['red', 'yellow', 'red'], count: 7 },
    ],
    switches: [
      { name: '3B SWITCH', id: '1000070', position: 'N' },
      { name: '1 SWITCH', id: '1000020', position: 'N' },
      { name: '9 SWITCH', id: '1000021', position: 'N' },
      { name: '5 SWITCH', id: '1000069', position: 'N' },
      { name: '7A SWITCH', id: '1000072', position: 'N' },
      { name: '7B SWITCH', id: '1000071', position: 'N' },
      { name: '3A SWITCH', id: '1000012', position: 'N' },
    ],
  },
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

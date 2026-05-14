// ─── Types ─────────────────────────────────────────────────────────────────────
export type CrossingStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE';
export type AlarmSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type DeviceType = 'DAU' | 'WSDMM' | 'SYSTEM';

export interface DAU {
  serialNumber: string;
  ipAddress: string;
  macAddress: string;
  partNumber: string;
  softwareVersion: string;
  hardwareVersion: string;
  osVersion: string;
  uptime: string;
  lastHeartbeat: string;
  // Voltages
  v1: number; // Battery
  v2: number; // AC Input
  v3: number; // Gate East
  v4: number; // Gate West
  v5: number; // Signal
  v6: number; // Standby
  // System resources
  cpuUsage: string;
  memoryUsagePercent: number;
  diskUsagePercent: number;
  temp: number;
  // Digital inputs (circuit states)
  di1: boolean; // Island
  di2: boolean; // Approach East
  di3: boolean; // Approach West
  di4: boolean; // Gate Down East
  di5: boolean; // Gate Down West
  di6: boolean; // Bell
  di7: boolean; // Flash
  di8: boolean; // Power Fail
  di9: boolean; // Standby Power
  di10: boolean; // Maintenance Switch
  di11: boolean; // Reserved
  di12: boolean; // Reserved
}

export interface WSDMM {
  serialNumber: string;
  ipAddress: string;
  hostname: string;
  osVersion: string;
  dockerVersion: string;
  wsdmmImageVersion: string;
  kernelVersion: string;
  uptime: string;
  cpuUsage: string;
  memoryUsagePercent: number;
  diskUsagePercent: number;
  dockerImages: string;
}

export interface CrossingAlarm {
  alarmId: string;
  crossingId: string;
  alarmCode: string;
  severity: AlarmSeverity;
  deviceType: DeviceType;
  description: string;
  timestamp: string;
  snowTicketId?: string;
  snowTicketUrl?: string;
  rootCause?: string;
  impactAssessment?: string;
  recommendedAction?: string;
}

export interface CrossingEvent {
  eventId: string;
  crossingId: string;
  eventType: string;
  deviceType: DeviceType;
  timestamp: string;
  description: string;
  site: string;
  subdivision: string;
  milepost: string;
  details: Record<string, string | number | boolean>;
}

export interface CrossingAsset {
  crossingId: string;
  streetName: string;
  city: string;
  province: string;
  subdivision: string;
  milepost: string;
  dotNum: string;
  status: CrossingStatus;
  maintenanceMode: boolean;
  maintenanceModeSetBy?: string;
  maintenanceModeSetAt?: string;
  maintenanceModeReason?: string;
  snowAssetId: string;
  snowLastSync: string;
  lastInspection: string;
  nextInspectionDue: string;
  dau: DAU;
  wsdmm: WSDMM;
  activeAlarms: CrossingAlarm[];
  recentEvents: CrossingEvent[];
}

// ─── Crossing Assets ──────────────────────────────────────────────────────────
export const crossingAssets: CrossingAsset[] = [
  {
    crossingId: 'CX-001',
    streetName: 'Highway 7 / Carling Ave',
    city: 'Ottawa',
    province: 'ON',
    subdivision: 'Kingston',
    milepost: '114.2',
    dotNum: '628441T',
    status: 'ONLINE',
    maintenanceMode: false,
    snowAssetId: 'CI-00441822',
    snowLastSync: '2026-05-14 13:45',
    lastInspection: '2026-03-12',
    nextInspectionDue: '2026-09-12',
    dau: {
      serialNumber: 'DAU-KGS-0441', ipAddress: '10.44.1.101', macAddress: '00:1A:2B:3C:4D:5E',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.2.1', hardwareVersion: 'HW-Rev-C',
      osVersion: 'Linux 5.15.0', uptime: '127d 14h 22m', lastHeartbeat: '2026-05-14 13:59:02',
      v1: 12.8, v2: 120.4, v3: 12.6, v4: 12.7, v5: 12.5, v6: 12.9,
      cpuUsage: '12%', memoryUsagePercent: 34, diskUsagePercent: 41, temp: 38,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-KGS-0441', ipAddress: '10.44.1.102', hostname: 'wsdmm-kgs-0441',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.1.4',
      kernelVersion: '5.15.0-91-generic', uptime: '127d 14h 18m',
      cpuUsage: '8%', memoryUsagePercent: 28, diskUsagePercent: 39,
      dockerImages: 'wsdmm-agent:3.1.4, owl-connector:2.0.1, data-collector:1.8.2',
    },
    activeAlarms: [],
    recentEvents: [
      { eventId: 'EVT-CX001-001', crossingId: 'CX-001', eventType: 'HEARTBEAT_OK', deviceType: 'DAU', timestamp: '2026-05-14 13:59:02', description: 'DAU heartbeat received — all circuits nominal', site: 'Highway 7 / Carling Ave', subdivision: 'Kingston', milepost: '114.2', details: { v1: 12.8, temp: 38, uptime: '127d' } },
      { eventId: 'EVT-CX001-002', crossingId: 'CX-001', eventType: 'DIGITAL_INPUT_CHANGE', deviceType: 'DAU', timestamp: '2026-05-14 13:41:18', description: 'Train activation: Island circuit energized, approach circuits activated, gates lowered', site: 'Highway 7 / Carling Ave', subdivision: 'Kingston', milepost: '114.2', details: { di1: true, di2: true, di4: true, di5: true } },
      { eventId: 'EVT-CX001-003', crossingId: 'CX-001', eventType: 'DIGITAL_INPUT_CHANGE', deviceType: 'DAU', timestamp: '2026-05-14 13:42:05', description: 'Train cleared: Island circuit de-energized, gates raised, all circuits normal', site: 'Highway 7 / Carling Ave', subdivision: 'Kingston', milepost: '114.2', details: { di1: false, di4: false, di5: false } },
    ],
  },
  {
    crossingId: 'CX-002',
    streetName: 'Industrial Rd / CN Mainline',
    city: 'Brockville',
    province: 'ON',
    subdivision: 'Kingston',
    milepost: '88.7',
    dotNum: '628112K',
    status: 'DEGRADED',
    maintenanceMode: false,
    snowAssetId: 'CI-00441823',
    snowLastSync: '2026-05-14 12:30',
    lastInspection: '2026-01-20',
    nextInspectionDue: '2026-07-20',
    dau: {
      serialNumber: 'DAU-KGS-0442', ipAddress: '10.44.2.101', macAddress: '00:1A:2B:3C:4D:6F',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.1.8', hardwareVersion: 'HW-Rev-B',
      osVersion: 'Linux 5.15.0', uptime: '42d 8h 11m', lastHeartbeat: '2026-05-14 13:55:14',
      v1: 11.2, v2: 118.6, v3: 11.0, v4: 10.8, v5: 11.1, v6: 11.3,
      cpuUsage: '18%', memoryUsagePercent: 52, diskUsagePercent: 67, temp: 44,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-KGS-0442', ipAddress: '10.44.2.102', hostname: 'wsdmm-kgs-0442',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.0.9',
      kernelVersion: '5.15.0-88-generic', uptime: '42d 8h 07m',
      cpuUsage: '22%', memoryUsagePercent: 61, diskUsagePercent: 73,
      dockerImages: 'wsdmm-agent:3.0.9, owl-connector:2.0.0, data-collector:1.7.8',
    },
    activeAlarms: [
      {
        alarmId: 'ALM-CX002-001', crossingId: 'CX-002', alarmCode: 'DAU-V3-LOW',
        severity: 'WARNING', deviceType: 'DAU',
        description: 'Gate East voltage (V3) at 11.0V — below nominal range (11.5–13.5V). Gate operation may be impaired under heavy load.',
        timestamp: '2026-05-14 11:22:08',
        snowTicketId: 'INC0088412', snowTicketUrl: '#',
        rootCause: 'Battery charging circuit fault on Gate East power supply. Likely cause: corroded terminal connection at the battery junction box, reducing charging efficiency. V3 has been trending down over the past 72 hours (12.4V → 11.8V → 11.0V).',
        impactAssessment: 'Gate East may fail to lower or raise under high-current demand. Risk of partial gate activation during train approach. No immediate safety impact at current voltage but continued degradation will trigger Level 2 alarm at 10.5V.',
        recommendedAction: '1. Dispatch field technician to inspect battery junction box at CX-002 (Brockville, Kingston Sub MP 88.7).\n2. Clean and re-torque terminal connections.\n3. Verify charging circuit output with multimeter.\n4. If voltage does not recover within 4 hours, place crossing in maintenance mode and notify operations.',
      },
      {
        alarmId: 'ALM-CX002-002', crossingId: 'CX-002', alarmCode: 'WSDMM-DISK-HIGH',
        severity: 'WARNING', deviceType: 'WSDMM',
        description: 'WSDMM disk usage at 73% — approaching 80% warning threshold. Log rotation may not be keeping pace with data collection rate.',
        timestamp: '2026-05-14 09:45:33',
        snowTicketId: 'INC0088398', snowTicketUrl: '#',
        rootCause: 'WSDMM image version 3.0.9 has a known log rotation bug where high-frequency train activations (>15/day) cause log files to accumulate faster than the nightly cleanup job can process them. This crossing averages 22 activations/day.',
        impactAssessment: 'If disk reaches 95%, WSDMM data collection will pause and events will be lost until disk is freed. No immediate safety impact but data continuity is at risk.',
        recommendedAction: '1. SSH to wsdmm-kgs-0442 and run: docker exec wsdmm-agent logrotate -f /etc/logrotate.d/wsdmm\n2. Upgrade WSDMM image to v3.1.4 (fixes log rotation bug) during next maintenance window.\n3. Monitor disk usage hourly until resolved.',
      },
    ],
    recentEvents: [
      { eventId: 'EVT-CX002-001', crossingId: 'CX-002', eventType: 'ALARM_RAISED', deviceType: 'DAU', timestamp: '2026-05-14 11:22:08', description: 'V3 voltage alarm raised — Gate East voltage below nominal', site: 'Industrial Rd / CN Mainline', subdivision: 'Kingston', milepost: '88.7', details: { v3: 11.0, threshold: 11.5 } },
      { eventId: 'EVT-CX002-002', crossingId: 'CX-002', eventType: 'HEARTBEAT_OK', deviceType: 'DAU', timestamp: '2026-05-14 13:55:14', description: 'DAU heartbeat received — V3 voltage still degraded', site: 'Industrial Rd / CN Mainline', subdivision: 'Kingston', milepost: '88.7', details: { v3: 11.0, v1: 11.2 } },
    ],
  },
  {
    crossingId: 'CX-003',
    streetName: 'Main Street / CN Edson Sub',
    city: 'Edson',
    province: 'AB',
    subdivision: 'Edson',
    milepost: '80.5',
    dotNum: '712441A',
    status: 'OFFLINE',
    maintenanceMode: false,
    snowAssetId: 'CI-00441824',
    snowLastSync: '2026-05-14 06:00',
    lastInspection: '2025-11-15',
    nextInspectionDue: '2026-05-15',
    dau: {
      serialNumber: 'DAU-EDS-0801', ipAddress: '10.80.1.101', macAddress: '00:1A:2B:3C:5D:7G',
      partNumber: 'CN-DAU-3100', softwareVersion: 'v4.0.3', hardwareVersion: 'HW-Rev-A',
      osVersion: 'Linux 5.10.0', uptime: '0d 0h 0m', lastHeartbeat: '2026-05-14 06:02:11',
      v1: 0.0, v2: 0.0, v3: 0.0, v4: 0.0, v5: 0.0, v6: 0.0,
      cpuUsage: 'N/A', memoryUsagePercent: 0, diskUsagePercent: 0, temp: 0,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: true, di9: false, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-EDS-0801', ipAddress: '10.80.1.102', hostname: 'wsdmm-eds-0801',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.5', wsdmmImageVersion: '2.9.1',
      kernelVersion: '5.10.0-28-generic', uptime: '0d 0h 0m',
      cpuUsage: 'N/A', memoryUsagePercent: 0, diskUsagePercent: 0,
      dockerImages: 'wsdmm-agent:2.9.1',
    },
    activeAlarms: [
      {
        alarmId: 'ALM-CX003-001', crossingId: 'CX-003', alarmCode: 'DAU-POWER-FAIL',
        severity: 'CRITICAL', deviceType: 'DAU',
        description: 'DAU complete power failure — DI8 (Power Fail) asserted. Last heartbeat 2026-05-14 06:02:11. All voltages zero. Crossing protection status UNKNOWN.',
        timestamp: '2026-05-14 06:02:11',
        snowTicketId: 'INC0088441', snowTicketUrl: '#',
        rootCause: 'Complete AC power loss at the crossing cabinet. DI8 (Power Fail input) was asserted in the last heartbeat before communications were lost. Possible causes: (1) utility power outage in the Edson area, (2) blown main fuse in the crossing cabinet, (3) vandalism or vehicle strike to the power supply enclosure. The DED Level 2 alarm at MP 112.8 earlier today involved a HAZMAT car — field inspection should check for any infrastructure damage in the area.',
        impactAssessment: 'CRITICAL: Crossing protection is UNKNOWN. The crossing at Main Street / Edson Sub MP 80.5 may have no active warning devices (lights, bells, gates). Train operations on Edson Sub must be notified immediately. Flagging may be required until power is restored and crossing function is verified.',
        recommendedAction: '1. IMMEDIATE: Notify Edson Sub train dispatcher — crossing at MP 80.5 has unknown protection status.\n2. Consider flagging requirement per Rule 103 until crossing is verified operational.\n3. Dispatch field technician to CX-003 immediately.\n4. Check utility power at the site and cabinet fuse.\n5. Once power is restored, verify all circuits before removing flagging.',
      },
    ],
    recentEvents: [
      { eventId: 'EVT-CX003-001', crossingId: 'CX-003', eventType: 'POWER_FAIL', deviceType: 'DAU', timestamp: '2026-05-14 06:02:11', description: 'Power failure detected — DI8 asserted. Last heartbeat before loss of communications.', site: 'Main Street / CN Edson Sub', subdivision: 'Edson', milepost: '80.5', details: { di8: true, v1: 0.0, v2: 0.0 } },
      { eventId: 'EVT-CX003-002', crossingId: 'CX-003', eventType: 'HEARTBEAT_MISSED', deviceType: 'DAU', timestamp: '2026-05-14 06:07:11', description: 'Heartbeat missed — no response from DAU after 5 minutes. Crossing marked OFFLINE.', site: 'Main Street / CN Edson Sub', subdivision: 'Edson', milepost: '80.5', details: { missedCount: 1 } },
      { eventId: 'EVT-CX003-003', crossingId: 'CX-003', eventType: 'HEARTBEAT_MISSED', deviceType: 'DAU', timestamp: '2026-05-14 07:02:11', description: 'Heartbeat missed — 12 consecutive missed heartbeats. SNOW ticket INC0088441 auto-created.', site: 'Main Street / CN Edson Sub', subdivision: 'Edson', milepost: '80.5', details: { missedCount: 12, snowTicket: 'INC0088441' } },
    ],
  },
  {
    crossingId: 'CX-004',
    streetName: 'Portage Ave / CN Rivers Sub',
    city: 'Portage la Prairie',
    province: 'MB',
    subdivision: 'Rivers',
    milepost: '44.8',
    dotNum: '844112R',
    status: 'ONLINE',
    maintenanceMode: false,
    snowAssetId: 'CI-00441825',
    snowLastSync: '2026-05-14 13:50',
    lastInspection: '2026-04-08',
    nextInspectionDue: '2026-10-08',
    dau: {
      serialNumber: 'DAU-RVR-0448', ipAddress: '10.44.8.101', macAddress: '00:1A:2B:4C:5D:8H',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.2.1', hardwareVersion: 'HW-Rev-C',
      osVersion: 'Linux 5.15.0', uptime: '88d 6h 44m', lastHeartbeat: '2026-05-14 13:58:55',
      v1: 13.1, v2: 121.2, v3: 13.0, v4: 13.1, v5: 12.9, v6: 13.2,
      cpuUsage: '9%', memoryUsagePercent: 31, diskUsagePercent: 38, temp: 36,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-RVR-0448', ipAddress: '10.44.8.102', hostname: 'wsdmm-rvr-0448',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.1.4',
      kernelVersion: '5.15.0-91-generic', uptime: '88d 6h 40m',
      cpuUsage: '7%', memoryUsagePercent: 26, diskUsagePercent: 35,
      dockerImages: 'wsdmm-agent:3.1.4, owl-connector:2.0.1, data-collector:1.8.2',
    },
    activeAlarms: [],
    recentEvents: [
      { eventId: 'EVT-CX004-001', crossingId: 'CX-004', eventType: 'HEARTBEAT_OK', deviceType: 'DAU', timestamp: '2026-05-14 13:58:55', description: 'DAU heartbeat received — all circuits nominal', site: 'Portage Ave / CN Rivers Sub', subdivision: 'Rivers', milepost: '44.8', details: { v1: 13.1, temp: 36 } },
      { eventId: 'EVT-CX004-002', crossingId: 'CX-004', eventType: 'SOFTWARE_UPDATE', deviceType: 'WSDMM', timestamp: '2026-05-12 02:15:00', description: 'WSDMM image updated from v3.1.2 to v3.1.4 — log rotation fix applied', site: 'Portage Ave / CN Rivers Sub', subdivision: 'Rivers', milepost: '44.8', details: { fromVersion: '3.1.2', toVersion: '3.1.4' } },
    ],
  },
  {
    crossingId: 'CX-005',
    streetName: 'Barrie Street / CN Bala Sub',
    city: 'Barrie',
    province: 'ON',
    subdivision: 'Bala',
    milepost: '60.3',
    dotNum: '512884B',
    status: 'MAINTENANCE',
    maintenanceMode: true,
    maintenanceModeSetBy: 'J. Tremblay (Signal Technician)',
    maintenanceModeSetAt: '2026-05-14 08:00:00',
    maintenanceModeReason: 'Scheduled gate arm replacement — East gate arm cracked. Estimated completion 16:00 EST.',
    snowAssetId: 'CI-00441826',
    snowLastSync: '2026-05-14 08:05',
    lastInspection: '2026-02-28',
    nextInspectionDue: '2026-08-28',
    dau: {
      serialNumber: 'DAU-BLA-0603', ipAddress: '10.60.3.101', macAddress: '00:1A:2B:5C:6D:9I',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.2.0', hardwareVersion: 'HW-Rev-C',
      osVersion: 'Linux 5.15.0', uptime: '61d 3h 12m', lastHeartbeat: '2026-05-14 13:57:44',
      v1: 12.9, v2: 119.8, v3: 12.7, v4: 0.0, v5: 12.6, v6: 12.8,
      cpuUsage: '11%', memoryUsagePercent: 38, diskUsagePercent: 44, temp: 39,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: true, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-BLA-0603', ipAddress: '10.60.3.102', hostname: 'wsdmm-bla-0603',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.1.3',
      kernelVersion: '5.15.0-90-generic', uptime: '61d 3h 08m',
      cpuUsage: '10%', memoryUsagePercent: 35, diskUsagePercent: 42,
      dockerImages: 'wsdmm-agent:3.1.3, owl-connector:2.0.1, data-collector:1.8.1',
    },
    activeAlarms: [],
    recentEvents: [
      { eventId: 'EVT-CX005-001', crossingId: 'CX-005', eventType: 'MAINTENANCE_MODE_ON', deviceType: 'SYSTEM', timestamp: '2026-05-14 08:00:00', description: 'Maintenance mode activated by J. Tremblay — alarms suppressed. Reason: gate arm replacement.', site: 'Barrie Street / CN Bala Sub', subdivision: 'Bala', milepost: '60.3', details: { setBy: 'J. Tremblay', reason: 'Gate arm replacement' } },
      { eventId: 'EVT-CX005-002', crossingId: 'CX-005', eventType: 'DIGITAL_INPUT_CHANGE', deviceType: 'DAU', timestamp: '2026-05-14 08:05:00', description: 'DI10 (Maintenance Switch) asserted — physical maintenance switch activated at cabinet', site: 'Barrie Street / CN Bala Sub', subdivision: 'Bala', milepost: '60.3', details: { di10: true } },
    ],
  },
  {
    crossingId: 'CX-006',
    streetName: 'Ruel Rd / CN Ruel Sub',
    city: 'Chapleau',
    province: 'ON',
    subdivision: 'Ruel',
    milepost: '200.1',
    dotNum: '901224C',
    status: 'ONLINE',
    maintenanceMode: false,
    snowAssetId: 'CI-00441827',
    snowLastSync: '2026-05-14 13:48',
    lastInspection: '2026-04-22',
    nextInspectionDue: '2026-10-22',
    dau: {
      serialNumber: 'DAU-RUL-2001', ipAddress: '10.200.1.101', macAddress: '00:2A:3B:4C:5D:0J',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.2.1', hardwareVersion: 'HW-Rev-C',
      osVersion: 'Linux 5.15.0', uptime: '211d 22h 08m', lastHeartbeat: '2026-05-14 13:59:11',
      v1: 12.7, v2: 120.1, v3: 12.5, v4: 12.6, v5: 12.4, v6: 12.8,
      cpuUsage: '10%', memoryUsagePercent: 29, diskUsagePercent: 36, temp: 35,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-RUL-2001', ipAddress: '10.200.1.102', hostname: 'wsdmm-rul-2001',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.1.4',
      kernelVersion: '5.15.0-91-generic', uptime: '211d 22h 04m',
      cpuUsage: '6%', memoryUsagePercent: 24, diskUsagePercent: 33,
      dockerImages: 'wsdmm-agent:3.1.4, owl-connector:2.0.1, data-collector:1.8.2',
    },
    activeAlarms: [],
    recentEvents: [
      { eventId: 'EVT-CX006-001', crossingId: 'CX-006', eventType: 'HEARTBEAT_OK', deviceType: 'DAU', timestamp: '2026-05-14 13:59:11', description: 'DAU heartbeat received — all circuits nominal', site: 'Ruel Rd / CN Ruel Sub', subdivision: 'Ruel', milepost: '200.1', details: { v1: 12.7, temp: 35 } },
    ],
  },
  {
    crossingId: 'CX-007',
    streetName: 'Walker Ave / CN Walker Sub',
    city: 'Winnipeg',
    province: 'MB',
    subdivision: 'Walker',
    milepost: '4.2',
    dotNum: '844441W',
    status: 'DEGRADED',
    maintenanceMode: false,
    snowAssetId: 'CI-00441828',
    snowLastSync: '2026-05-14 12:15',
    lastInspection: '2026-03-05',
    nextInspectionDue: '2026-09-05',
    dau: {
      serialNumber: 'DAU-WLK-0042', ipAddress: '10.4.2.101', macAddress: '00:3A:4B:5C:6D:1K',
      partNumber: 'CN-DAU-3100', softwareVersion: 'v4.1.5', hardwareVersion: 'HW-Rev-B',
      osVersion: 'Linux 5.10.0', uptime: '14d 2h 33m', lastHeartbeat: '2026-05-14 13:54:28',
      v1: 12.4, v2: 117.9, v3: 12.2, v4: 12.3, v5: 12.1, v6: 12.5,
      cpuUsage: '31%', memoryUsagePercent: 78, diskUsagePercent: 82, temp: 51,
    di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-WLK-0042', ipAddress: '10.4.2.102', hostname: 'wsdmm-wlk-0042',
      osVersion: 'Ubuntu 20.04 LTS', dockerVersion: '23.0.6', wsdmmImageVersion: '2.8.4',
      kernelVersion: '5.4.0-182-generic', uptime: '14d 2h 29m',
      cpuUsage: '28%', memoryUsagePercent: 81, diskUsagePercent: 88,
      dockerImages: 'wsdmm-agent:2.8.4',
    },
    activeAlarms: [
      {
        alarmId: 'ALM-CX007-001', crossingId: 'CX-007', alarmCode: 'DAU-CPU-HIGH',
        severity: 'WARNING', deviceType: 'DAU',
        description: 'DAU CPU usage at 31% — elevated above normal baseline (8–15%). Possible runaway process or excessive log writes.',
        timestamp: '2026-05-14 12:18:44',
        snowTicketId: 'INC0088455', snowTicketUrl: '#',
        rootCause: 'DAU firmware v4.1.5 has a known memory leak in the event logging module triggered by high-frequency train activations. Walker Sub averages 18 activations/day at this crossing. The CPU spike correlates with the memory usage reaching 78% — the OS is swapping aggressively.',
        impactAssessment: 'Elevated CPU and memory usage may cause delayed heartbeat responses and slow circuit state reporting. If CPU reaches 95%, the DAU may restart, causing a brief gap in crossing protection monitoring.',
        recommendedAction: '1. Upgrade DAU firmware to v4.2.1 (fixes memory leak) during next maintenance window.\n2. Monitor CPU and memory hourly.\n3. If CPU exceeds 90%, schedule emergency firmware update.\n4. Consider placing in maintenance mode during firmware update.',
      },
      {
        alarmId: 'ALM-CX007-002', crossingId: 'CX-007', alarmCode: 'WSDMM-DISK-CRITICAL',
        severity: 'CRITICAL', deviceType: 'WSDMM',
        description: 'WSDMM disk usage at 88% — approaching critical threshold (95%). Data collection will pause at 95%. Immediate action required.',
        timestamp: '2026-05-14 13:02:17',
        snowTicketId: 'INC0088461', snowTicketUrl: '#',
        rootCause: 'WSDMM image v2.8.4 (EOL) has no automatic log rotation. Combined with the outdated Ubuntu 20.04 OS, system logs and WSDMM event archives have accumulated over 14 days without cleanup. The docker overlay filesystem is consuming 62% of disk space alone.',
        impactAssessment: 'CRITICAL: If disk reaches 95%, WSDMM will stop collecting crossing events. This means train activations, circuit state changes, and alarm events will not be recorded. Regulatory compliance for crossing event logging will be violated.',
        recommendedAction: '1. IMMEDIATE: SSH to wsdmm-wlk-0042 and run: docker system prune -f && journalctl --vacuum-size=100M\n2. Schedule WSDMM upgrade to v3.1.4 and OS upgrade to Ubuntu 22.04 within 48 hours.\n3. After disk cleanup, verify data collection is resumed.\n4. Update SNOW ticket INC0088461 with actions taken.',
      },
    ],
    recentEvents: [
      { eventId: 'EVT-CX007-001', crossingId: 'CX-007', eventType: 'ALARM_RAISED', deviceType: 'WSDMM', timestamp: '2026-05-14 13:02:17', description: 'WSDMM disk usage critical alarm raised — 88% utilization', site: 'Walker Ave / CN Walker Sub', subdivision: 'Walker', milepost: '4.2', details: { diskPct: 88, threshold: 95 } },
      { eventId: 'EVT-CX007-002', crossingId: 'CX-007', eventType: 'MEMORY_HIGH', deviceType: 'DAU', timestamp: '2026-05-14 12:18:44', description: 'DAU memory usage elevated — 78% utilization, CPU spike to 31%', site: 'Walker Ave / CN Walker Sub', subdivision: 'Walker', milepost: '4.2', details: { memPct: 78, cpuPct: 31 } },
    ],
  },
  {
    crossingId: 'CX-008',
    streetName: 'MacTier Rd / CN MacTier Sub',
    city: 'MacTier',
    province: 'ON',
    subdivision: 'MacTier',
    milepost: '88.4',
    dotNum: '512001M',
    status: 'ONLINE',
    maintenanceMode: false,
    snowAssetId: 'CI-00441829',
    snowLastSync: '2026-05-14 13:52',
    lastInspection: '2026-04-15',
    nextInspectionDue: '2026-10-15',
    dau: {
      serialNumber: 'DAU-MCT-0884', ipAddress: '10.88.4.101', macAddress: '00:4A:5B:6C:7D:2L',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.2.1', hardwareVersion: 'HW-Rev-C',
      osVersion: 'Linux 5.15.0', uptime: '156d 11h 22m', lastHeartbeat: '2026-05-14 13:59:44',
      v1: 12.9, v2: 120.8, v3: 12.8, v4: 12.9, v5: 12.7, v6: 13.0,
      cpuUsage: '8%', memoryUsagePercent: 27, diskUsagePercent: 34, temp: 37,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-MCT-0884', ipAddress: '10.88.4.102', hostname: 'wsdmm-mct-0884',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.1.4',
      kernelVersion: '5.15.0-91-generic', uptime: '156d 11h 18m',
      cpuUsage: '6%', memoryUsagePercent: 23, diskUsagePercent: 31,
      dockerImages: 'wsdmm-agent:3.1.4, owl-connector:2.0.1, data-collector:1.8.2',
    },
    activeAlarms: [],
    recentEvents: [
      { eventId: 'EVT-CX008-001', crossingId: 'CX-008', eventType: 'HEARTBEAT_OK', deviceType: 'DAU', timestamp: '2026-05-14 13:59:44', description: 'DAU heartbeat received — all circuits nominal', site: 'MacTier Rd / CN MacTier Sub', subdivision: 'MacTier', milepost: '88.4', details: { v1: 12.9, temp: 37 } },
    ],
  },
  {
    crossingId: 'CX-009',
    streetName: 'Capreol Blvd / CN Capreol Sub',
    city: 'Capreol',
    province: 'ON',
    subdivision: 'Capreol',
    milepost: '178.8',
    dotNum: '628884C',
    status: 'ONLINE',
    maintenanceMode: false,
    snowAssetId: 'CI-00441830',
    snowLastSync: '2026-05-14 13:55',
    lastInspection: '2026-05-01',
    nextInspectionDue: '2026-11-01',
    dau: {
      serialNumber: 'DAU-CAP-1788', ipAddress: '10.178.8.101', macAddress: '00:5A:6B:7C:8D:3M',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.2.1', hardwareVersion: 'HW-Rev-C',
      osVersion: 'Linux 5.15.0', uptime: '13d 8h 44m', lastHeartbeat: '2026-05-14 13:59:58',
      v1: 13.0, v2: 120.6, v3: 12.9, v4: 13.0, v5: 12.8, v6: 13.1,
      cpuUsage: '9%', memoryUsagePercent: 30, diskUsagePercent: 37, temp: 38,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-CAP-1788', ipAddress: '10.178.8.102', hostname: 'wsdmm-cap-1788',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.1.4',
      kernelVersion: '5.15.0-91-generic', uptime: '13d 8h 40m',
      cpuUsage: '7%', memoryUsagePercent: 25, diskUsagePercent: 34,
      dockerImages: 'wsdmm-agent:3.1.4, owl-connector:2.0.1, data-collector:1.8.2',
    },
    activeAlarms: [],
    recentEvents: [
      { eventId: 'EVT-CX009-001', crossingId: 'CX-009', eventType: 'HEARTBEAT_OK', deviceType: 'DAU', timestamp: '2026-05-14 13:59:58', description: 'DAU heartbeat received — all circuits nominal', site: 'Capreol Blvd / CN Capreol Sub', subdivision: 'Capreol', milepost: '178.8', details: { v1: 13.0, temp: 38 } },
    ],
  },
  {
    crossingId: 'CX-010',
    streetName: 'Wainwright Ave / CN Wainwright Sub',
    city: 'Wainwright',
    province: 'AB',
    subdivision: 'Wainwright',
    milepost: '88.2',
    dotNum: '712884W',
    status: 'ONLINE',
    maintenanceMode: false,
    snowAssetId: 'CI-00441831',
    snowLastSync: '2026-05-14 13:47',
    lastInspection: '2026-03-20',
    nextInspectionDue: '2026-09-20',
    dau: {
      serialNumber: 'DAU-WAI-0882', ipAddress: '10.88.2.101', macAddress: '00:6A:7B:8C:9D:4N',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.2.1', hardwareVersion: 'HW-Rev-C',
      osVersion: 'Linux 5.15.0', uptime: '55d 17h 08m', lastHeartbeat: '2026-05-14 13:58:12',
      v1: 12.8, v2: 120.2, v3: 12.7, v4: 12.8, v5: 12.6, v6: 12.9,
      cpuUsage: '10%', memoryUsagePercent: 33, diskUsagePercent: 40, temp: 37,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-WAI-0882', ipAddress: '10.88.2.102', hostname: 'wsdmm-wai-0882',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.1.4',
      kernelVersion: '5.15.0-91-generic', uptime: '55d 17h 04m',
      cpuUsage: '8%', memoryUsagePercent: 28, diskUsagePercent: 37,
      dockerImages: 'wsdmm-agent:3.1.4, owl-connector:2.0.1, data-collector:1.8.2',
    },
    activeAlarms: [],
    recentEvents: [
      { eventId: 'EVT-CX010-001', crossingId: 'CX-010', eventType: 'HEARTBEAT_OK', deviceType: 'DAU', timestamp: '2026-05-14 13:58:12', description: 'DAU heartbeat received — all circuits nominal', site: 'Wainwright Ave / CN Wainwright Sub', subdivision: 'Wainwright', milepost: '88.2', details: { v1: 12.8, temp: 37 } },
    ],
  },
  {
    crossingId: 'CX-011',
    streetName: 'Strathroy Rd / CN Strathroy Sub',
    city: 'Strathroy',
    province: 'ON',
    subdivision: 'Strathroy',
    milepost: '22.4',
    dotNum: '512224S',
    status: 'ONLINE',
    maintenanceMode: false,
    snowAssetId: 'CI-00441832',
    snowLastSync: '2026-05-14 13:44',
    lastInspection: '2026-04-02',
    nextInspectionDue: '2026-10-02',
    dau: {
      serialNumber: 'DAU-STR-0224', ipAddress: '10.22.4.101', macAddress: '00:7A:8B:9C:0D:5O',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.2.1', hardwareVersion: 'HW-Rev-C',
      osVersion: 'Linux 5.15.0', uptime: '42d 19h 55m', lastHeartbeat: '2026-05-14 13:59:33',
      v1: 12.7, v2: 119.9, v3: 12.6, v4: 12.7, v5: 12.5, v6: 12.8,
      cpuUsage: '9%', memoryUsagePercent: 30, diskUsagePercent: 38, temp: 36,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-STR-0224', ipAddress: '10.22.4.102', hostname: 'wsdmm-str-0224',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.1.4',
      kernelVersion: '5.15.0-91-generic', uptime: '42d 19h 51m',
      cpuUsage: '7%', memoryUsagePercent: 26, diskUsagePercent: 35,
      dockerImages: 'wsdmm-agent:3.1.4, owl-connector:2.0.1, data-collector:1.8.2',
    },
    activeAlarms: [],
    recentEvents: [
      { eventId: 'EVT-CX011-001', crossingId: 'CX-011', eventType: 'HEARTBEAT_OK', deviceType: 'DAU', timestamp: '2026-05-14 13:59:33', description: 'DAU heartbeat received — all circuits nominal', site: 'Strathroy Rd / CN Strathroy Sub', subdivision: 'Strathroy', milepost: '22.4', details: { v1: 12.7, temp: 36 } },
    ],
  },
  {
    crossingId: 'CX-012',
    streetName: 'Parry Sound Rd / CN Parry Sound Sub',
    city: 'Parry Sound',
    province: 'ON',
    subdivision: 'Parry Sound',
    milepost: '44.1',
    dotNum: '512441P',
    status: 'DEGRADED',
    maintenanceMode: false,
    snowAssetId: 'CI-00441833',
    snowLastSync: '2026-05-14 11:00',
    lastInspection: '2026-02-10',
    nextInspectionDue: '2026-08-10',
    dau: {
      serialNumber: 'DAU-PSN-0441', ipAddress: '10.44.1.201', macAddress: '00:8A:9B:0C:1D:6P',
      partNumber: 'CN-DAU-3100', softwareVersion: 'v4.0.8', hardwareVersion: 'HW-Rev-A',
      osVersion: 'Linux 5.10.0', uptime: '8d 4h 11m', lastHeartbeat: '2026-05-14 13:53:02',
      v1: 11.8, v2: 116.4, v3: 11.6, v4: 11.7, v5: 11.5, v6: 11.9,
      cpuUsage: '14%', memoryUsagePercent: 44, diskUsagePercent: 58, temp: 42,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-PSN-0441', ipAddress: '10.44.1.202', hostname: 'wsdmm-psn-0441',
      osVersion: 'Ubuntu 20.04 LTS', dockerVersion: '23.0.4', wsdmmImageVersion: '2.9.8',
      kernelVersion: '5.4.0-174-generic', uptime: '8d 4h 07m',
      cpuUsage: '19%', memoryUsagePercent: 55, diskUsagePercent: 64,
      dockerImages: 'wsdmm-agent:2.9.8, owl-connector:1.9.2',
    },
    activeAlarms: [
      {
        alarmId: 'ALM-CX012-001', crossingId: 'CX-012', alarmCode: 'DAU-AC-LOW',
        severity: 'WARNING', deviceType: 'DAU',
        description: 'AC input voltage (V2) at 116.4V — below nominal range (118–122V). Possible utility voltage sag or loose connection.',
        timestamp: '2026-05-14 10:44:18',
        snowTicketId: 'INC0088471', snowTicketUrl: '#',
        rootCause: 'Utility voltage sag detected on the Parry Sound feeder circuit. The AC input has been reading 115–117V for the past 8 days (since last DAU restart). Local utility (Hydro One) has an open work order for voltage regulation on this feeder. Additionally, the DAU power supply is an older HW-Rev-A unit with a narrower input tolerance.',
        impactAssessment: 'All crossing functions are operating normally at current voltage. However, if AC voltage drops below 110V, the DAU will switch to battery backup (V1). Battery capacity is sufficient for approximately 8 hours of operation.',
        recommendedAction: '1. Contact Hydro One regarding open work order for voltage regulation on Parry Sound feeder.\n2. Inspect AC input connections at the crossing cabinet for loose terminals.\n3. Consider upgrading DAU to HW-Rev-C (wider input tolerance: 100–130V).\n4. Monitor V2 voltage trend — if it drops below 113V, escalate to CRITICAL.',
      },
    ],
    recentEvents: [
      { eventId: 'EVT-CX012-001', crossingId: 'CX-012', eventType: 'ALARM_RAISED', deviceType: 'DAU', timestamp: '2026-05-14 10:44:18', description: 'V2 AC input voltage alarm raised — 116.4V below nominal', site: 'Parry Sound Rd / CN Parry Sound Sub', subdivision: 'Parry Sound', milepost: '44.1', details: { v2: 116.4, threshold: 118.0 } },
    ],
  },
  {
    crossingId: 'CX-013',
    streetName: 'Oakville Line / CN Oakville Sub',
    city: 'Oakville',
    province: 'ON',
    subdivision: 'Oakville',
    milepost: '22.8',
    dotNum: '512228O',
    status: 'ONLINE',
    maintenanceMode: false,
    snowAssetId: 'CI-00441834',
    snowLastSync: '2026-05-14 13:58',
    lastInspection: '2026-05-05',
    nextInspectionDue: '2026-11-05',
    dau: {
      serialNumber: 'DAU-OKV-0228', ipAddress: '10.22.8.101', macAddress: '00:9A:0B:1C:2D:7Q',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.2.1', hardwareVersion: 'HW-Rev-C',
      osVersion: 'Linux 5.15.0', uptime: '9d 12h 08m', lastHeartbeat: '2026-05-14 14:00:01',
      v1: 13.2, v2: 121.4, v3: 13.1, v4: 13.2, v5: 13.0, v6: 13.3,
      cpuUsage: '7%', memoryUsagePercent: 25, diskUsagePercent: 32, temp: 35,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-OKV-0228', ipAddress: '10.22.8.102', hostname: 'wsdmm-okv-0228',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.1.4',
      kernelVersion: '5.15.0-91-generic', uptime: '9d 12h 04m',
      cpuUsage: '6%', memoryUsagePercent: 22, diskUsagePercent: 29,
      dockerImages: 'wsdmm-agent:3.1.4, owl-connector:2.0.1, data-collector:1.8.2',
    },
    activeAlarms: [],
    recentEvents: [
      { eventId: 'EVT-CX013-001', crossingId: 'CX-013', eventType: 'HEARTBEAT_OK', deviceType: 'DAU', timestamp: '2026-05-14 14:00:01', description: 'DAU heartbeat received — all circuits nominal', site: 'Oakville Line / CN Oakville Sub', subdivision: 'Oakville', milepost: '22.8', details: { v1: 13.2, temp: 35 } },
    ],
  },
  {
    crossingId: 'CX-014',
    streetName: 'Montréal Blvd / CN Montréal Sub',
    city: 'Montréal',
    province: 'QC',
    subdivision: 'Montréal',
    milepost: '8.4',
    dotNum: '901084M',
    status: 'ONLINE',
    maintenanceMode: false,
    snowAssetId: 'CI-00441835',
    snowLastSync: '2026-05-14 13:56',
    lastInspection: '2026-04-28',
    nextInspectionDue: '2026-10-28',
    dau: {
      serialNumber: 'DAU-MTL-0084', ipAddress: '10.8.4.101', macAddress: '00:0A:1B:2C:3D:8R',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.2.1', hardwareVersion: 'HW-Rev-C',
      osVersion: 'Linux 5.15.0', uptime: '16d 7h 22m', lastHeartbeat: '2026-05-14 13:59:48',
      v1: 12.9, v2: 120.5, v3: 12.8, v4: 12.9, v5: 12.7, v6: 13.0,
      cpuUsage: '8%', memoryUsagePercent: 28, diskUsagePercent: 35, temp: 36,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-MTL-0084', ipAddress: '10.8.4.102', hostname: 'wsdmm-mtl-0084',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.1.4',
      kernelVersion: '5.15.0-91-generic', uptime: '16d 7h 18m',
      cpuUsage: '7%', memoryUsagePercent: 24, diskUsagePercent: 32,
      dockerImages: 'wsdmm-agent:3.1.4, owl-connector:2.0.1, data-collector:1.8.2',
    },
    activeAlarms: [],
    recentEvents: [
      { eventId: 'EVT-CX014-001', crossingId: 'CX-014', eventType: 'HEARTBEAT_OK', deviceType: 'DAU', timestamp: '2026-05-14 13:59:48', description: 'DAU heartbeat received — all circuits nominal', site: 'Montréal Blvd / CN Montréal Sub', subdivision: 'Montréal', milepost: '8.4', details: { v1: 12.9, temp: 36 } },
    ],
  },
  {
    crossingId: 'CX-015',
    streetName: 'Biggar Ave / CN Biggar Sub',
    city: 'Biggar',
    province: 'SK',
    subdivision: 'Biggar',
    milepost: '112.4',
    dotNum: '844124B',
    status: 'ONLINE',
    maintenanceMode: false,
    snowAssetId: 'CI-00441836',
    snowLastSync: '2026-05-14 13:51',
    lastInspection: '2026-03-30',
    nextInspectionDue: '2026-09-30',
    dau: {
      serialNumber: 'DAU-BGG-1124', ipAddress: '10.112.4.101', macAddress: '00:1A:2B:3C:4D:9S',
      partNumber: 'CN-DAU-3200', softwareVersion: 'v4.2.1', hardwareVersion: 'HW-Rev-C',
      osVersion: 'Linux 5.15.0', uptime: '44d 14h 33m', lastHeartbeat: '2026-05-14 13:58:44',
      v1: 12.8, v2: 120.1, v3: 12.7, v4: 12.8, v5: 12.6, v6: 12.9,
      cpuUsage: '9%', memoryUsagePercent: 29, diskUsagePercent: 37, temp: 37,
      di1: false, di2: false, di3: false, di4: false, di5: false,
      di6: false, di7: false, di8: false, di9: true, di10: false, di11: false, di12: false,
    },
    wsdmm: {
      serialNumber: 'WSD-BGG-1124', ipAddress: '10.112.4.102', hostname: 'wsdmm-bgg-1124',
      osVersion: 'Ubuntu 22.04 LTS', dockerVersion: '24.0.7', wsdmmImageVersion: '3.1.4',
      kernelVersion: '5.15.0-91-generic', uptime: '44d 14h 29m',
      cpuUsage: '7%', memoryUsagePercent: 25, diskUsagePercent: 34,
      dockerImages: 'wsdmm-agent:3.1.4, owl-connector:2.0.1, data-collector:1.8.2',
    },
    activeAlarms: [],
    recentEvents: [
      { eventId: 'EVT-CX015-001', crossingId: 'CX-015', eventType: 'HEARTBEAT_OK', deviceType: 'DAU', timestamp: '2026-05-14 13:58:44', description: 'DAU heartbeat received — all circuits nominal', site: 'Biggar Ave / CN Biggar Sub', subdivision: 'Biggar', milepost: '112.4', details: { v1: 12.8, temp: 37 } },
    ],
  },
];

// ─── Summary helpers ──────────────────────────────────────────────────────────
export function getCrossingSummary() {
  const total = crossingAssets.length;
  const online = crossingAssets.filter(c => c.status === 'ONLINE' && !c.maintenanceMode).length;
  const degraded = crossingAssets.filter(c => c.status === 'DEGRADED').length;
  const offline = crossingAssets.filter(c => c.status === 'OFFLINE').length;
  const maintenance = crossingAssets.filter(c => c.maintenanceMode).length;
  const allAlarms = crossingAssets.flatMap(c => c.activeAlarms);
  const critical = allAlarms.filter(a => a.severity === 'CRITICAL').length;
  const warning = allAlarms.filter(a => a.severity === 'WARNING').length;
  const totalAlarms = allAlarms.length;
  const totalEvents = crossingAssets.flatMap(c => c.recentEvents).length;
  return { total, online, degraded, offline, maintenance, critical, warning, totalAlarms, totalEvents };
}

export function getAllAlarms(): CrossingAlarm[] {
  return crossingAssets.flatMap(c => c.activeAlarms)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getAllEvents(): (CrossingEvent & { crossingName: string })[] {
  return crossingAssets.flatMap(c =>
    c.recentEvents.map(e => ({ ...e, crossingName: c.streetName }))
  ).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

// ─── Chart data helpers ───────────────────────────────────────────────────────
export function getAlarmFrequencyBySubdivision() {
  const counts: Record<string, { critical: number; warning: number; info: number }> = {};
  crossingAssets.forEach(c => {
    if (!counts[c.subdivision]) counts[c.subdivision] = { critical: 0, warning: 0, info: 0 };
    c.activeAlarms.forEach(a => {
      counts[c.subdivision][a.severity.toLowerCase() as 'critical' | 'warning' | 'info']++;
    });
  });
  return Object.entries(counts).map(([sub, v]) => ({ subdivision: sub, ...v }));
}

export function getStatusDistribution() {
  const s = getCrossingSummary();
  return [
    { name: 'Online', value: s.online, color: '#10B981' },
    { name: 'Degraded', value: s.degraded, color: '#F59E0B' },
    { name: 'Offline', value: s.offline, color: '#EF4444' },
    { name: 'Maintenance', value: s.maintenance, color: '#3B82F6' },
  ];
}

export function getVoltageHistory() {
  // Synthetic 24-hour V1 (battery) trend for CX-002 (degraded)
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    v1: 12.4 - (i * 0.05) + (Math.random() * 0.1 - 0.05),
    v3: 11.8 - (i * 0.04) + (Math.random() * 0.08 - 0.04),
    nominal: 11.5,
  }));
}

export function getHeartbeatTimeline() {
  // Last 12 hours of heartbeat status for all crossings
  return Array.from({ length: 12 }, (_, i) => {
    const hour = new Date(2026, 4, 14, 2 + i, 0, 0);
    return {
      time: `${String(2 + i).padStart(2, '0')}:00`,
      online: crossingAssets.filter(c => c.status === 'ONLINE' && !c.maintenanceMode).length - (i === 4 ? 1 : 0),
      degraded: crossingAssets.filter(c => c.status === 'DEGRADED').length,
      offline: crossingAssets.filter(c => c.status === 'OFFLINE').length + (i === 4 ? 1 : 0),
      maintenance: crossingAssets.filter(c => c.maintenanceMode).length,
    };
  });
}

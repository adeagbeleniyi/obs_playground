// ─── Crew & HOS Management Data ───────────────────────────────────────────────

export type HOSStatus = 'CRITICAL' | 'WARNING' | 'OK';

export interface CrewMember {
  id: string;
  name: string;
  role: 'Engineer' | 'Conductor' | 'Brakeman' | 'Trainmaster';
  employeeId: string;
}

export interface CrewChangePoint {
  location: string;
  milepost: number;
  subdivision: string;
  estimatedArrival: string; // HH:MM
  distanceRemaining: number; // miles
}

export interface ActiveCrew {
  crewId: string;
  trainId: string;
  subdivision: string;
  origin: string;
  destination: string;
  currentLocation: string;
  currentMilepost: number;
  speed: number;
  members: CrewMember[];
  dutyStartTime: string;       // HH:MM
  hoursOnDuty: number;         // decimal hours
  hosLimitHours: number;       // 12 for most, 10 for some
  hosRemainingMinutes: number; // minutes remaining
  hosStatus: HOSStatus;
  nextCrewChange: CrewChangePoint;
  lastRestHours: number;       // hours of rest before this duty
  calledAt: string;            // time crew was called
  releaseType: 'AWAY_FROM_HOME' | 'HOME_TERMINAL';
  distanceTravelled: number;   // miles this duty
  notes?: string;
}

export const activeCrew: ActiveCrew[] = [
  {
    crewId: 'CRW-3301',
    trainId: 'Q11451-05',
    subdivision: 'Kingston',
    origin: 'MacMillan Yard',
    destination: 'Taschereau Yard',
    currentLocation: 'Kingston, ON',
    currentMilepost: 188.4,
    speed: 52,
    members: [
      { id: 'E-4421', name: 'James Whitmore', role: 'Engineer', employeeId: '004421' },
      { id: 'C-7812', name: 'Marie Tremblay', role: 'Conductor', employeeId: '007812' },
    ],
    dutyStartTime: '06:15',
    hoursOnDuty: 8.75,
    hosLimitHours: 12,
    hosRemainingMinutes: 195,
    hosStatus: 'WARNING',
    nextCrewChange: {
      location: 'Brockville, ON',
      milepost: 214.0,
      subdivision: 'Kingston',
      estimatedArrival: '15:48',
      distanceRemaining: 25.6,
    },
    lastRestHours: 14.5,
    calledAt: '05:45',
    releaseType: 'AWAY_FROM_HOME',
    distanceTravelled: 312,
  },
  {
    crewId: 'CRW-6644',
    trainId: 'F77251-05',
    subdivision: 'Rivers',
    origin: 'Symington Yard',
    destination: 'Walker Yard',
    currentLocation: 'Portage la Prairie, MB',
    currentMilepost: 44.1,
    speed: 48,
    members: [
      { id: 'E-2290', name: 'Derek Fontaine', role: 'Engineer', employeeId: '002290' },
      { id: 'C-5531', name: 'Priya Sharma', role: 'Conductor', employeeId: '005531' },
    ],
    dutyStartTime: '03:30',
    hoursOnDuty: 11.63,
    hosLimitHours: 12,
    hosRemainingMinutes: 22,
    hosStatus: 'CRITICAL',
    nextCrewChange: {
      location: 'Portage la Prairie, MB',
      milepost: 44.1,
      subdivision: 'Rivers',
      estimatedArrival: '14:28',
      distanceRemaining: 0,
    },
    lastRestHours: 10.0,
    calledAt: '03:00',
    releaseType: 'AWAY_FROM_HOME',
    distanceTravelled: 198,
    notes: 'Crew change crew is on standby at Portage — relief ETA 14:35',
  },
  {
    crewId: 'CRW-1122',
    trainId: 'L50251-05',
    subdivision: 'Edson',
    origin: 'Walker Yard',
    destination: 'MacMillan Yard',
    currentLocation: 'Edson, AB',
    currentMilepost: 112.8,
    speed: 44,
    members: [
      { id: 'E-8801', name: 'Carlos Mendes', role: 'Engineer', employeeId: '008801' },
      { id: 'C-3340', name: 'Susan Kowalski', role: 'Conductor', employeeId: '003340' },
      { id: 'B-9910', name: 'Tom Nguyen', role: 'Brakeman', employeeId: '009910' },
    ],
    dutyStartTime: '08:00',
    hoursOnDuty: 6.5,
    hosLimitHours: 12,
    hosRemainingMinutes: 330,
    hosStatus: 'OK',
    nextCrewChange: {
      location: 'Jasper, AB',
      milepost: 158.0,
      subdivision: 'Edson',
      estimatedArrival: '17:15',
      distanceRemaining: 45.2,
    },
    lastRestHours: 16.0,
    calledAt: '07:30',
    releaseType: 'HOME_TERMINAL',
    distanceTravelled: 145,
  },
  {
    crewId: 'CRW-4455',
    trainId: 'G87351-05',
    subdivision: 'MacMillan',
    origin: 'MacMillan Yard',
    destination: 'Capreol Yard',
    currentLocation: 'Barrie, ON',
    currentMilepost: 77.2,
    speed: 55,
    members: [
      { id: 'E-1155', name: 'Ahmed Hassan', role: 'Engineer', employeeId: '001155' },
      { id: 'C-6620', name: 'Linda Park', role: 'Conductor', employeeId: '006620' },
    ],
    dutyStartTime: '10:00',
    hoursOnDuty: 4.5,
    hosLimitHours: 12,
    hosRemainingMinutes: 450,
    hosStatus: 'OK',
    nextCrewChange: {
      location: 'Capreol, ON',
      milepost: 148.0,
      subdivision: 'MacMillan',
      estimatedArrival: '16:45',
      distanceRemaining: 70.8,
    },
    lastRestHours: 18.5,
    calledAt: '09:30',
    releaseType: 'HOME_TERMINAL',
    distanceTravelled: 77,
  },
  {
    crewId: 'CRW-7788',
    trainId: 'T22151-05',
    subdivision: 'Sprague',
    origin: 'Symington Yard',
    destination: 'Fort Frances, ON',
    currentLocation: 'Richer, MB',
    currentMilepost: 33.5,
    speed: 40,
    members: [
      { id: 'E-3370', name: 'Paul Beauchamp', role: 'Engineer', employeeId: '003370' },
      { id: 'C-8840', name: 'Anita Johal', role: 'Conductor', employeeId: '008840' },
    ],
    dutyStartTime: '07:00',
    hoursOnDuty: 7.5,
    hosLimitHours: 10,
    hosRemainingMinutes: 30,
    hosStatus: 'CRITICAL',
    nextCrewChange: {
      location: 'Sprague, MB',
      milepost: 55.0,
      subdivision: 'Sprague',
      estimatedArrival: '15:20',
      distanceRemaining: 21.5,
    },
    lastRestHours: 8.0,
    calledAt: '06:30',
    releaseType: 'AWAY_FROM_HOME',
    distanceTravelled: 134,
    notes: 'HOS limit is 10h (passenger-adjacent territory). Relief crew dispatched from Sprague.',
  },
  {
    crewId: 'CRW-2233',
    trainId: 'M30151-05',
    subdivision: 'Rivers',
    origin: 'Symington Yard',
    destination: 'Walker Yard',
    currentLocation: 'Brandon, MB',
    currentMilepost: 44.1,
    speed: 48,
    members: [
      { id: 'E-5512', name: 'Rachel Okafor', role: 'Engineer', employeeId: '005512' },
      { id: 'C-1190', name: 'Mike Larsen', role: 'Conductor', employeeId: '001190' },
    ],
    dutyStartTime: '09:15',
    hoursOnDuty: 5.25,
    hosLimitHours: 12,
    hosRemainingMinutes: 405,
    hosStatus: 'OK',
    nextCrewChange: {
      location: 'Virden, MB',
      milepost: 90.0,
      subdivision: 'Rivers',
      estimatedArrival: '16:30',
      distanceRemaining: 45.9,
    },
    lastRestHours: 12.0,
    calledAt: '08:45',
    releaseType: 'HOME_TERMINAL',
    distanceTravelled: 88,
  },
];

// ─── Car Search Data ────────────────────────────────────────────────────────

export type CarType = 'Boxcar' | 'Gondola' | 'Flatcar' | 'Tank Car' | 'Hopper' | 'Intermodal' | 'Autorack' | 'Coil Car' | 'Centerbeam';
export type CarOwner = 'CN' | 'CP' | 'BNSF' | 'CSX' | 'NS' | 'UP' | 'TTX' | 'CSXT' | 'Private';
export type DefectSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ConsistRecord {
  trainId: string;
  date: string;
  position: number;       // position in consist (1 = first car behind locos)
  totalCars: number;
  origin: string;
  destination: string;
  subdivision: string;
  weight: number;         // lbs
}

export interface WaysideReading {
  detectorId: string;
  detectorType: 'HBD' | 'WILD' | 'DED' | 'AEI' | 'TADS' | 'WIM';
  location: string;
  milepost: number;
  subdivision: string;
  timestamp: string;
  reading: string;        // e.g. "L-Bearing: 42°F above ambient"
  status: 'NORMAL' | 'ALERT' | 'ALARM';
  trainId: string;
}

export interface DefectFlag {
  flagId: string;
  date: string;
  severity: DefectSeverity;
  type: string;
  description: string;
  detectedBy: string;
  location: string;
  resolved: boolean;
  resolvedDate?: string;
  resolvedBy?: string;
  workOrderId?: string;
}

export interface CarRecord {
  carNumber: string;
  reportingMark: string;
  carType: CarType;
  owner: CarOwner;
  builtYear: number;
  capacity: number;       // tons
  length: number;         // feet
  hazmat: boolean;
  hazmatClass?: string;
  currentTrainId?: string;
  currentStatus: 'IN_TRANSIT' | 'IN_YARD' | 'SHOP' | 'FOREIGN_ROAD' | 'STORED';
  currentLocation: string;
  lastSeen: string;
  consistHistory: ConsistRecord[];
  waysideReadings: WaysideReading[];
  defectFlags: DefectFlag[];
}

export const carDatabase: CarRecord[] = [
  {
    carNumber: 'CN 412847',
    reportingMark: 'CN',
    carType: 'Gondola',
    owner: 'CN',
    builtYear: 2011,
    capacity: 100,
    length: 52,
    hazmat: false,
    currentTrainId: 'Q11451-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Kingston Sub MP 188.4',
    lastSeen: '2026-05-05 14:22',
    consistHistory: [
      { trainId: 'Q11451-05', date: '2026-05-05', position: 14, totalCars: 85, origin: 'MacMillan Yard', destination: 'Taschereau Yard', subdivision: 'Kingston', weight: 198400 },
      { trainId: 'Q11350-04', date: '2026-05-03', position: 22, totalCars: 92, origin: 'Taschereau Yard', destination: 'MacMillan Yard', subdivision: 'Kingston', weight: 201000 },
      { trainId: 'M30151-04', date: '2026-04-28', position: 7, totalCars: 113, origin: 'Symington Yard', destination: 'Walker Yard', subdivision: 'Rivers', weight: 187500 },
      { trainId: 'G87251-03', date: '2026-04-20', position: 31, totalCars: 78, origin: 'MacMillan Yard', destination: 'Capreol Yard', subdivision: 'MacMillan', weight: 195000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-KGS-188', detectorType: 'HBD', location: 'Kingston, ON', milepost: 188.0, subdivision: 'Kingston', timestamp: '2026-05-05 14:20', reading: 'All bearings normal — max 28°F above ambient', status: 'NORMAL', trainId: 'Q11451-05' },
      { detectorId: 'WILD-KGS-150', detectorType: 'WILD', location: 'Napanee, ON', milepost: 150.2, subdivision: 'Kingston', timestamp: '2026-05-05 13:41', reading: 'Wheel impact: 42 kips — within limits', status: 'NORMAL', trainId: 'Q11451-05' },
      { detectorId: 'AEI-KGS-100', detectorType: 'AEI', location: 'Belleville, ON', milepost: 100.4, subdivision: 'Kingston', timestamp: '2026-05-05 12:58', reading: 'Tag read confirmed — CN 412847', status: 'NORMAL', trainId: 'Q11451-05' },
      { detectorId: 'HBD-KGS-050', detectorType: 'HBD', location: 'Cobourg, ON', milepost: 50.1, subdivision: 'Kingston', timestamp: '2026-05-05 12:10', reading: 'All bearings normal — max 22°F above ambient', status: 'NORMAL', trainId: 'Q11451-05' },
      { detectorId: 'HBD-RVR-090', detectorType: 'HBD', location: 'Brandon, MB', milepost: 90.3, subdivision: 'Rivers', timestamp: '2026-04-28 09:14', reading: 'All bearings normal', status: 'NORMAL', trainId: 'M30151-04' },
    ],
    defectFlags: [],
  },
  {
    carNumber: 'BNSF 584291',
    reportingMark: 'BNSF',
    carType: 'Hopper',
    owner: 'BNSF',
    builtYear: 2008,
    capacity: 110,
    length: 56,
    hazmat: false,
    currentTrainId: 'M30151-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Rivers Sub MP 44.1',
    lastSeen: '2026-05-05 14:10',
    consistHistory: [
      { trainId: 'M30151-05', date: '2026-05-05', position: 44, totalCars: 113, origin: 'Symington Yard', destination: 'Walker Yard', subdivision: 'Rivers', weight: 220000 },
      { trainId: 'F77150-04', date: '2026-05-01', position: 12, totalCars: 98, origin: 'Walker Yard', destination: 'Symington Yard', subdivision: 'Rivers', weight: 215000 },
      { trainId: 'Q11250-03', date: '2026-04-24', position: 67, totalCars: 88, origin: 'MacMillan Yard', destination: 'Taschereau Yard', subdivision: 'Kingston', weight: 218000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-RVR-044', detectorType: 'HBD', location: 'Brandon, MB', milepost: 44.1, subdivision: 'Rivers', timestamp: '2026-05-05 14:08', reading: 'R-Bearing: 58°F above ambient — ALERT threshold 60°F', status: 'ALERT', trainId: 'M30151-05' },
      { detectorId: 'WILD-RVR-020', detectorType: 'WILD', location: 'Portage la Prairie, MB', milepost: 20.5, subdivision: 'Rivers', timestamp: '2026-05-05 13:22', reading: 'Wheel impact: 71 kips — elevated', status: 'ALERT', trainId: 'M30151-05' },
      { detectorId: 'AEI-RVR-001', detectorType: 'AEI', location: 'Symington Yard Exit', milepost: 1.0, subdivision: 'Rivers', timestamp: '2026-05-05 11:45', reading: 'Tag read confirmed — BNSF 584291', status: 'NORMAL', trainId: 'M30151-05' },
    ],
    defectFlags: [
      {
        flagId: 'DEF-2026-0441',
        date: '2026-05-05',
        severity: 'WARNING',
        type: 'Hot Bearing',
        description: 'Right-side bearing reading 58°F above ambient at Brandon HBD. Approaching alert threshold. Monitoring required.',
        detectedBy: 'HBD-RVR-044',
        location: 'Brandon, MB — Rivers Sub MP 44.1',
        resolved: false,
      },
    ],
  },
  {
    carNumber: 'CN 771033',
    reportingMark: 'CN',
    carType: 'Tank Car',
    owner: 'CN',
    builtYear: 2016,
    capacity: 30000,
    length: 60,
    hazmat: true,
    hazmatClass: 'Class 3 — Flammable Liquid (Crude Oil)',
    currentTrainId: undefined,
    currentStatus: 'IN_YARD',
    currentLocation: 'Taschereau Yard — Track 14',
    lastSeen: '2026-05-05 08:30',
    consistHistory: [
      { trainId: 'L50150-04', date: '2026-05-04', position: 3, totalCars: 148, origin: 'Walker Yard', destination: 'Taschereau Yard', subdivision: 'Edson', weight: 286000 },
      { trainId: 'L50050-03', date: '2026-04-29', position: 8, totalCars: 152, origin: 'Taschereau Yard', destination: 'Walker Yard', subdivision: 'Edson', weight: 284000 },
      { trainId: 'L50950-02', date: '2026-04-22', position: 5, totalCars: 144, origin: 'Walker Yard', destination: 'Taschereau Yard', subdivision: 'Edson', weight: 289000 },
      { trainId: 'L50850-01', date: '2026-04-15', position: 11, totalCars: 150, origin: 'Taschereau Yard', destination: 'Walker Yard', subdivision: 'Edson', weight: 282000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-EDS-112', detectorType: 'HBD', location: 'Edson, AB', milepost: 112.8, subdivision: 'Edson', timestamp: '2026-05-04 16:44', reading: 'All bearings normal — max 19°F above ambient', status: 'NORMAL', trainId: 'L50150-04' },
      { detectorId: 'TADS-EDS-080', detectorType: 'TADS', location: 'Hinton, AB', milepost: 80.2, subdivision: 'Edson', timestamp: '2026-05-04 15:55', reading: 'Truck alignment nominal — no lateral shift detected', status: 'NORMAL', trainId: 'L50150-04' },
      { detectorId: 'DED-EDS-040', detectorType: 'DED', location: 'Evansburg, AB', milepost: 40.1, subdivision: 'Edson', timestamp: '2026-05-04 15:10', reading: 'No dragging equipment detected', status: 'NORMAL', trainId: 'L50150-04' },
    ],
    defectFlags: [
      {
        flagId: 'DEF-2026-0388',
        date: '2026-04-29',
        severity: 'INFO',
        type: 'Scheduled Inspection',
        description: 'DOT-117 annual qualification inspection due within 30 days. Car cleared for service pending inspection scheduling.',
        detectedBy: 'Mechanical Inspection — Walker Yard',
        location: 'Walker Yard',
        resolved: false,
      },
    ],
  },
  {
    carNumber: 'CSX 304812',
    reportingMark: 'CSX',
    carType: 'Boxcar',
    owner: 'CSX',
    builtYear: 2005,
    capacity: 70,
    length: 50,
    hazmat: false,
    currentTrainId: 'G87351-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'MacMillan Sub MP 77.2',
    lastSeen: '2026-05-05 14:30',
    consistHistory: [
      { trainId: 'G87351-05', date: '2026-05-05', position: 9, totalCars: 42, origin: 'MacMillan Yard', destination: 'Capreol Yard', subdivision: 'MacMillan', weight: 140000 },
      { trainId: 'G87250-04', date: '2026-04-30', position: 18, totalCars: 55, origin: 'Capreol Yard', destination: 'MacMillan Yard', subdivision: 'MacMillan', weight: 138000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-MCM-077', detectorType: 'HBD', location: 'Barrie, ON', milepost: 77.2, subdivision: 'MacMillan', timestamp: '2026-05-05 14:28', reading: 'All bearings normal', status: 'NORMAL', trainId: 'G87351-05' },
      { detectorId: 'AEI-MCM-001', detectorType: 'AEI', location: 'MacMillan Yard Exit', milepost: 1.0, subdivision: 'MacMillan', timestamp: '2026-05-05 10:02', reading: 'Tag read confirmed — CSX 304812', status: 'NORMAL', trainId: 'G87351-05' },
    ],
    defectFlags: [
      {
        flagId: 'DEF-2026-0312',
        date: '2026-04-30',
        severity: 'WARNING',
        type: 'Door Latch',
        description: 'Left-side door latch reported stiff during unloading at Capreol. Lubricated on-site. Monitor at next inspection.',
        detectedBy: 'Yard Inspection — Capreol',
        location: 'Capreol Yard',
        resolved: true,
        resolvedDate: '2026-04-30',
        resolvedBy: 'Mechanical — Capreol',
        workOrderId: 'WO-2026-8841',
      },
    ],
  },
  {
    carNumber: 'TTX 891204',
    reportingMark: 'TTX',
    carType: 'Flatcar',
    owner: 'TTX',
    builtYear: 2014,
    capacity: 80,
    length: 89,
    hazmat: false,
    currentTrainId: undefined,
    currentStatus: 'SHOP',
    currentLocation: 'MacMillan Yard — Mechanical Shop Bay 3',
    lastSeen: '2026-05-04 09:00',
    consistHistory: [
      { trainId: 'Q11350-04', date: '2026-05-03', position: 55, totalCars: 92, origin: 'Taschereau Yard', destination: 'MacMillan Yard', subdivision: 'Kingston', weight: 160000 },
      { trainId: 'Q11250-03', date: '2026-04-27', position: 38, totalCars: 88, origin: 'MacMillan Yard', destination: 'Taschereau Yard', subdivision: 'Kingston', weight: 158000 },
    ],
    waysideReadings: [
      { detectorId: 'WILD-KGS-150', detectorType: 'WILD', location: 'Napanee, ON', milepost: 150.2, subdivision: 'Kingston', timestamp: '2026-05-03 11:22', reading: 'Wheel impact: 112 kips — ALARM threshold 100 kips exceeded', status: 'ALARM', trainId: 'Q11350-04' },
      { detectorId: 'HBD-KGS-100', detectorType: 'HBD', location: 'Belleville, ON', milepost: 100.4, subdivision: 'Kingston', timestamp: '2026-05-03 10:48', reading: 'All bearings normal', status: 'NORMAL', trainId: 'Q11350-04' },
    ],
    defectFlags: [
      {
        flagId: 'DEF-2026-0401',
        date: '2026-05-03',
        severity: 'CRITICAL',
        type: 'Wheel Flat / High Impact',
        description: 'WILD alarm at Napanee — wheel impact 112 kips exceeds 100 kip alarm threshold. Car set out at MacMillan Yard for wheel inspection. Flat spot confirmed on axle 2 left wheel. Scheduled for wheel truing.',
        detectedBy: 'WILD-KGS-150',
        location: 'Napanee, ON — Kingston Sub MP 150.2',
        resolved: false,
        workOrderId: 'WO-2026-9102',
      },
    ],
  },
];

// ─── HOS Summary Stats ─────────────────────────────────────────────────────

export function getHOSSummary() {
  const critical = activeCrew.filter(c => c.hosStatus === 'CRITICAL').length;
  const warning = activeCrew.filter(c => c.hosStatus === 'WARNING').length;
  const ok = activeCrew.filter(c => c.hosStatus === 'OK').length;
  const totalCrewMembers = activeCrew.reduce((sum, c) => sum + c.members.length, 0);
  return { critical, warning, ok, totalCrewMembers, totalTrains: activeCrew.length };
}

export function formatHOSRemaining(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function hosStatusColor(status: HOSStatus): string {
  switch (status) {
    case 'CRITICAL': return 'text-red-400';
    case 'WARNING': return 'text-amber-400';
    case 'OK': return 'text-emerald-400';
  }
}

export function hosStatusBg(status: HOSStatus): string {
  switch (status) {
    case 'CRITICAL': return 'bg-red-500/10 border-red-500/30';
    case 'WARNING': return 'bg-amber-500/10 border-amber-500/30';
    case 'OK': return 'bg-emerald-500/10 border-emerald-500/30';
  }
}

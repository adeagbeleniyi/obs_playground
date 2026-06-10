// CN Rail OT Observability — Crew & Car Data
// ─────────────────────────────────────────────────────────────────────────────

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
  dutyStartTime: string;
  hoursOnDuty: number;
  hosLimitHours: number;
  hosRemainingMinutes: number;
  hosStatus: HOSStatus;
  nextCrewChange: CrewChangePoint;
  lastRestHours: number;
  calledAt: string;
  releaseType: 'AWAY_FROM_HOME' | 'HOME_TERMINAL';
  distanceTravelled: number;
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
    nextCrewChange: { location: 'Brockville, ON', milepost: 214.0, subdivision: 'Kingston', estimatedArrival: '15:48', distanceRemaining: 25.6 },
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
    nextCrewChange: { location: 'Portage la Prairie, MB', milepost: 44.1, subdivision: 'Rivers', estimatedArrival: '14:28', distanceRemaining: 0 },
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
    nextCrewChange: { location: 'Jasper, AB', milepost: 158.0, subdivision: 'Edson', estimatedArrival: '17:15', distanceRemaining: 45.2 },
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
    nextCrewChange: { location: 'Capreol, ON', milepost: 148.0, subdivision: 'MacMillan', estimatedArrival: '16:45', distanceRemaining: 70.8 },
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
    nextCrewChange: { location: 'Sprague, MB', milepost: 55.0, subdivision: 'Sprague', estimatedArrival: '15:20', distanceRemaining: 21.5 },
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
    nextCrewChange: { location: 'Virden, MB', milepost: 90.0, subdivision: 'Rivers', estimatedArrival: '16:30', distanceRemaining: 45.9 },
    lastRestHours: 12.0,
    calledAt: '08:45',
    releaseType: 'HOME_TERMINAL',
    distanceTravelled: 88,
  },
  {
    crewId: 'CRW-5566',
    trainId: 'A41451-05',
    subdivision: 'Montréal',
    origin: 'Taschereau Yard',
    destination: 'Gordon Yard',
    currentLocation: 'Montréal-Est, QC',
    currentMilepost: 22.4,
    speed: 60,
    members: [
      { id: 'E-7701', name: 'François Leblanc', role: 'Engineer', employeeId: '007701' },
      { id: 'C-2280', name: 'Nadia Bouchard', role: 'Conductor', employeeId: '002280' },
    ],
    dutyStartTime: '08:55',
    hoursOnDuty: 5.5,
    hosLimitHours: 12,
    hosRemainingMinutes: 390,
    hosStatus: 'OK',
    nextCrewChange: { location: 'Farnham, QC', milepost: 65.0, subdivision: 'Montréal', estimatedArrival: '10:40', distanceRemaining: 42.6 },
    lastRestHours: 15.0,
    calledAt: '08:25',
    releaseType: 'HOME_TERMINAL',
    distanceTravelled: 22,
  },
  {
    crewId: 'CRW-8899',
    trainId: 'U55451-05',
    subdivision: 'Kingston',
    origin: 'Taschereau Yard',
    destination: 'MacMillan Yard',
    currentLocation: 'Napanee, ON',
    currentMilepost: 144.8,
    speed: 0,
    members: [
      { id: 'E-6601', name: 'Tony Marchetti', role: 'Engineer', employeeId: '006601' },
      { id: 'C-4410', name: 'Sandra Chu', role: 'Conductor', employeeId: '004410' },
    ],
    dutyStartTime: '05:00',
    hoursOnDuty: 9.0,
    hosLimitHours: 12,
    hosRemainingMinutes: 180,
    hosStatus: 'WARNING',
    nextCrewChange: { location: 'Belleville, ON', milepost: 100.0, subdivision: 'Kingston', estimatedArrival: '16:00', distanceRemaining: 44.8 },
    lastRestHours: 11.0,
    calledAt: '04:30',
    releaseType: 'AWAY_FROM_HOME',
    distanceTravelled: 144,
    notes: 'Train stopped at MP 144.8 — WILD ALARM on car TTX 891204. Awaiting mechanical inspection clearance.',
  },
  {
    crewId: 'CRW-9900',
    trainId: 'K88151-05',
    subdivision: 'Kingston',
    origin: 'MacMillan Yard',
    destination: 'Walker Yard',
    currentLocation: 'MacMillan Yard, Toronto ON',
    currentMilepost: 0,
    speed: 0,
    members: [
      { id: 'E-3312', name: 'David Osei', role: 'Engineer', employeeId: '003312' },
      { id: 'C-7741', name: 'Claire Moreau', role: 'Conductor', employeeId: '007741' },
      { id: 'B-1120', name: 'Raj Patel', role: 'Brakeman', employeeId: '001120' },
    ],
    dutyStartTime: '11:00',
    hoursOnDuty: 3.5,
    hosLimitHours: 12,
    hosRemainingMinutes: 510,
    hosStatus: 'OK',
    nextCrewChange: { location: 'Oshawa, ON', milepost: 28.0, subdivision: 'Kingston', estimatedArrival: '14:30', distanceRemaining: 28.0 },
    lastRestHours: 20.0,
    calledAt: '10:30',
    releaseType: 'HOME_TERMINAL',
    distanceTravelled: 0,
  },
  {
    crewId: 'CRW-1144',
    trainId: 'B44251-05',
    subdivision: 'Montréal',
    origin: 'Taschereau Yard',
    destination: 'Gordon Yard',
    currentLocation: 'Taschereau Yard, Montréal QC',
    currentMilepost: 0,
    speed: 0,
    members: [
      { id: 'E-9920', name: 'Sylvain Gagnon', role: 'Engineer', employeeId: '009920' },
      { id: 'C-4480', name: 'Mei Lin', role: 'Conductor', employeeId: '004480' },
    ],
    dutyStartTime: '10:30',
    hoursOnDuty: 4.0,
    hosLimitHours: 12,
    hosRemainingMinutes: 480,
    hosStatus: 'OK',
    nextCrewChange: { location: 'Farnham, QC', milepost: 65.0, subdivision: 'Montréal', estimatedArrival: '13:15', distanceRemaining: 65.0 },
    lastRestHours: 14.0,
    calledAt: '10:00',
    releaseType: 'HOME_TERMINAL',
    distanceTravelled: 0,
  },
  {
    crewId: 'CRW-3388',
    trainId: 'P11151-05',
    subdivision: 'Edson',
    origin: 'MacMillan Yard',
    destination: 'Walker Yard',
    currentLocation: 'Walker Yard, Edmonton AB',
    currentMilepost: 0,
    speed: 0,
    members: [
      { id: 'E-7780', name: 'Glen Hartley', role: 'Engineer', employeeId: '007780' },
      { id: 'C-2250', name: 'Isabelle Roy', role: 'Conductor', employeeId: '002250' },
    ],
    dutyStartTime: '02:00',
    hoursOnDuty: 12.0,
    hosLimitHours: 12,
    hosRemainingMinutes: 0,
    hosStatus: 'CRITICAL',
    nextCrewChange: { location: 'Walker Yard', milepost: 0, subdivision: 'Edson', estimatedArrival: '14:00', distanceRemaining: 0 },
    lastRestHours: 9.5,
    calledAt: '01:30',
    releaseType: 'AWAY_FROM_HOME',
    distanceTravelled: 412,
    notes: 'HOS expired on arrival at Walker Yard. Crew tied up. Relief crew en route.',
  },
  {
    crewId: 'CRW-6612',
    trainId: 'CN-L50251-05',
    subdivision: 'Edson',
    origin: 'Walker Yard',
    destination: 'MacMillan Yard',
    currentLocation: 'Hinton, AB',
    currentMilepost: 80.2,
    speed: 44,
    members: [
      { id: 'E-4102', name: 'Wayne Drummond', role: 'Engineer', employeeId: '004102' },
      { id: 'C-8811', name: 'Fatima Al-Rashid', role: 'Conductor', employeeId: '008811' },
      { id: 'B-3301', name: 'Kevin Tran', role: 'Brakeman', employeeId: '003301' },
    ],
    dutyStartTime: '04:00',
    hoursOnDuty: 10.5,
    hosLimitHours: 12,
    hosRemainingMinutes: 90,
    hosStatus: 'WARNING',
    nextCrewChange: { location: 'Jasper, AB', milepost: 158.0, subdivision: 'Edson', estimatedArrival: '16:00', distanceRemaining: 77.8 },
    lastRestHours: 11.5,
    calledAt: '03:30',
    releaseType: 'AWAY_FROM_HOME',
    distanceTravelled: 332,
    notes: 'Train has 2 active WILD alarms. Mechanical inspection ordered at Jasper.',
  },
  {
    crewId: 'CRW-4488',
    trainId: 'F77251-05',
    subdivision: 'Moncton',
    origin: 'Gordon Yard',
    destination: 'Taschereau Yard',
    currentLocation: 'Amherst, NS',
    currentMilepost: 44.2,
    speed: 55,
    members: [
      { id: 'E-2201', name: 'Alain Côté', role: 'Engineer', employeeId: '002201' },
      { id: 'C-9901', name: 'Brenda MacLeod', role: 'Conductor', employeeId: '009901' },
    ],
    dutyStartTime: '07:30',
    hoursOnDuty: 7.0,
    hosLimitHours: 12,
    hosRemainingMinutes: 300,
    hosStatus: 'OK',
    nextCrewChange: { location: 'Truro, NS', milepost: 88.0, subdivision: 'Moncton', estimatedArrival: '16:10', distanceRemaining: 43.8 },
    lastRestHours: 13.0,
    calledAt: '07:00',
    releaseType: 'HOME_TERMINAL',
    distanceTravelled: 144,
  },
  {
    crewId: 'CRW-5577',
    trainId: 'H22351-05',
    subdivision: 'Wainwright',
    origin: 'Walker Yard',
    destination: 'Biggar, SK',
    currentLocation: 'Wainwright, AB',
    currentMilepost: 122.4,
    speed: 58,
    members: [
      { id: 'E-8812', name: 'Lorne Pedersen', role: 'Engineer', employeeId: '008812' },
      { id: 'C-3321', name: 'Diane Lefebvre', role: 'Conductor', employeeId: '003321' },
    ],
    dutyStartTime: '06:00',
    hoursOnDuty: 8.5,
    hosLimitHours: 12,
    hosRemainingMinutes: 210,
    hosStatus: 'WARNING',
    nextCrewChange: { location: 'Biggar, SK', milepost: 188.0, subdivision: 'Wainwright', estimatedArrival: '17:00', distanceRemaining: 65.6 },
    lastRestHours: 12.5,
    calledAt: '05:30',
    releaseType: 'AWAY_FROM_HOME',
    distanceTravelled: 244,
  },
];

// ─── Car Search Data ────────────────────────────────────────────────────────

export type CarType = 'Boxcar' | 'Gondola' | 'Flatcar' | 'Tank Car' | 'Hopper' | 'Intermodal' | 'Autorack' | 'Coil Car' | 'Centerbeam';
export type CarOwner = 'CN' | 'CP' | 'BNSF' | 'CSX' | 'NS' | 'UP' | 'TTX' | 'CSXT' | 'Private';
export type DefectSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ConsistRecord {
  trainId: string;
  date: string;
  position: number;
  totalCars: number;
  origin: string;
  destination: string;
  subdivision: string;
  weight: number;
}

export interface WaysideReading {
  detectorId: string;
  detectorType: 'HBD' | 'WILD' | 'DED' | 'AEI' | 'TADS' | 'WIM';
  location: string;
  milepost: number;
  subdivision: string;
  timestamp: string;
  reading: string;
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
  capacity: number;
  length: number;
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
  // ── Car 1: CN Gondola — IN_TRANSIT, Kingston Sub ──────────────────────────
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
    lastSeen: '2026-05-14 14:22',
    consistHistory: [
      { trainId: 'Q11451-05', date: '2026-05-14', position: 14, totalCars: 85, origin: 'MacMillan Yard', destination: 'Taschereau Yard', subdivision: 'Kingston', weight: 198400 },
      { trainId: 'Q11350-04', date: '2026-05-12', position: 22, totalCars: 92, origin: 'Taschereau Yard', destination: 'MacMillan Yard', subdivision: 'Kingston', weight: 201000 },
      { trainId: 'M30151-04', date: '2026-05-07', position: 7, totalCars: 113, origin: 'Symington Yard', destination: 'Walker Yard', subdivision: 'Rivers', weight: 187500 },
      { trainId: 'G87251-03', date: '2026-04-29', position: 31, totalCars: 78, origin: 'MacMillan Yard', destination: 'Capreol Yard', subdivision: 'MacMillan', weight: 195000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-KGS-188', detectorType: 'HBD', location: 'Kingston, ON', milepost: 188.0, subdivision: 'Kingston', timestamp: '2026-05-14 14:20', reading: 'All bearings normal — max 28°F above ambient', status: 'NORMAL', trainId: 'Q11451-05' },
      { detectorId: 'WILD-KGS-150', detectorType: 'WILD', location: 'Napanee, ON', milepost: 150.2, subdivision: 'Kingston', timestamp: '2026-05-14 13:41', reading: 'Wheel impact: 42 kips — within limits', status: 'NORMAL', trainId: 'Q11451-05' },
      { detectorId: 'AEI-KGS-100', detectorType: 'AEI', location: 'Belleville, ON', milepost: 100.4, subdivision: 'Kingston', timestamp: '2026-05-14 12:58', reading: 'Tag read confirmed — CN 412847', status: 'NORMAL', trainId: 'Q11451-05' },
      { detectorId: 'HBD-KGS-050', detectorType: 'HBD', location: 'Cobourg, ON', milepost: 50.1, subdivision: 'Kingston', timestamp: '2026-05-14 12:10', reading: 'All bearings normal — max 22°F above ambient', status: 'NORMAL', trainId: 'Q11451-05' },
      { detectorId: 'HBD-RVR-090', detectorType: 'HBD', location: 'Brandon, MB', milepost: 90.3, subdivision: 'Rivers', timestamp: '2026-05-07 09:14', reading: 'All bearings normal', status: 'NORMAL', trainId: 'M30151-04' },
    ],
    defectFlags: [],
  },

  // ── Car 2: BNSF Hopper — IN_TRANSIT, Rivers Sub, HBD ALERT ───────────────
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
    lastSeen: '2026-05-14 14:10',
    consistHistory: [
      { trainId: 'M30151-05', date: '2026-05-14', position: 44, totalCars: 113, origin: 'Symington Yard', destination: 'Walker Yard', subdivision: 'Rivers', weight: 220000 },
      { trainId: 'F77150-04', date: '2026-05-10', position: 12, totalCars: 98, origin: 'Walker Yard', destination: 'Symington Yard', subdivision: 'Rivers', weight: 215000 },
      { trainId: 'Q11250-03', date: '2026-05-03', position: 67, totalCars: 88, origin: 'MacMillan Yard', destination: 'Taschereau Yard', subdivision: 'Kingston', weight: 218000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-RVR-044', detectorType: 'HBD', location: 'Brandon, MB', milepost: 44.1, subdivision: 'Rivers', timestamp: '2026-05-14 14:08', reading: 'R-Bearing: 58°F above ambient — ALERT threshold 60°F', status: 'ALERT', trainId: 'M30151-05' },
      { detectorId: 'WILD-RVR-020', detectorType: 'WILD', location: 'Portage la Prairie, MB', milepost: 20.5, subdivision: 'Rivers', timestamp: '2026-05-14 13:22', reading: 'Wheel impact: 71 kips — elevated', status: 'ALERT', trainId: 'M30151-05' },
      { detectorId: 'AEI-RVR-001', detectorType: 'AEI', location: 'Symington Yard Exit', milepost: 1.0, subdivision: 'Rivers', timestamp: '2026-05-14 11:45', reading: 'Tag read confirmed — BNSF 584291', status: 'NORMAL', trainId: 'M30151-05' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0441', date: '2026-05-14', severity: 'WARNING', type: 'Hot Bearing', description: 'Axle A2-Right bearing reading 58°F above ambient at Brandon HBD. Approaching alert threshold. Monitoring required.', detectedBy: 'HBD-RVR-044', location: 'Brandon, MB — Rivers Sub MP 44.1', resolved: false },
    ],
  },

  // ── Car 3: CN Tank Car — IN_YARD, HAZMAT ─────────────────────────────────
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
    currentStatus: 'IN_YARD',
    currentLocation: 'Taschereau Yard — Track 14',
    lastSeen: '2026-05-14 08:30',
    consistHistory: [
      { trainId: 'L50150-04', date: '2026-05-13', position: 3, totalCars: 148, origin: 'Walker Yard', destination: 'Taschereau Yard', subdivision: 'Edson', weight: 286000 },
      { trainId: 'L50050-03', date: '2026-05-08', position: 8, totalCars: 152, origin: 'Taschereau Yard', destination: 'Walker Yard', subdivision: 'Edson', weight: 284000 },
      { trainId: 'L50950-02', date: '2026-05-01', position: 5, totalCars: 144, origin: 'Walker Yard', destination: 'Taschereau Yard', subdivision: 'Edson', weight: 289000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-EDS-112', detectorType: 'HBD', location: 'Edson, AB', milepost: 112.8, subdivision: 'Edson', timestamp: '2026-05-13 16:44', reading: 'All bearings normal — max 19°F above ambient', status: 'NORMAL', trainId: 'L50150-04' },
      { detectorId: 'TADS-EDS-080', detectorType: 'TADS', location: 'Hinton, AB', milepost: 80.2, subdivision: 'Edson', timestamp: '2026-05-13 15:55', reading: 'Truck alignment nominal — no lateral shift detected', status: 'NORMAL', trainId: 'L50150-04' },
      { detectorId: 'DED-EDS-040', detectorType: 'DED', location: 'Evansburg, AB', milepost: 40.1, subdivision: 'Edson', timestamp: '2026-05-13 15:10', reading: 'No dragging equipment detected', status: 'NORMAL', trainId: 'L50150-04' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0388', date: '2026-05-08', severity: 'INFO', type: 'Scheduled Inspection', description: 'DOT-117 annual qualification inspection due within 30 days. Car cleared for service pending inspection scheduling.', detectedBy: 'Mechanical Inspection — Walker Yard', location: 'Walker Yard', resolved: false },
    ],
  },

  // ── Car 4: CSX Boxcar — IN_TRANSIT, MacMillan Sub ─────────────────────────
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
    lastSeen: '2026-05-14 14:30',
    consistHistory: [
      { trainId: 'G87351-05', date: '2026-05-14', position: 9, totalCars: 42, origin: 'MacMillan Yard', destination: 'Capreol Yard', subdivision: 'MacMillan', weight: 140000 },
      { trainId: 'G87250-04', date: '2026-05-09', position: 18, totalCars: 55, origin: 'Capreol Yard', destination: 'MacMillan Yard', subdivision: 'MacMillan', weight: 138000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-MCM-077', detectorType: 'HBD', location: 'Barrie, ON', milepost: 77.2, subdivision: 'MacMillan', timestamp: '2026-05-14 14:28', reading: 'All bearings normal', status: 'NORMAL', trainId: 'G87351-05' },
      { detectorId: 'AEI-MCM-001', detectorType: 'AEI', location: 'MacMillan Yard Exit', milepost: 1.0, subdivision: 'MacMillan', timestamp: '2026-05-14 10:02', reading: 'Tag read confirmed — CSX 304812', status: 'NORMAL', trainId: 'G87351-05' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0312', date: '2026-05-09', severity: 'WARNING', type: 'Door Latch', description: 'Left-side door latch reported stiff during unloading at Capreol. Lubricated on-site. Monitor at next inspection.', detectedBy: 'Yard Inspection — Capreol', location: 'Capreol Yard', resolved: true, resolvedDate: '2026-05-09', resolvedBy: 'Mechanical — Capreol', workOrderId: 'WO-2026-8841' },
    ],
  },

  // ── Car 5: TTX Flatcar — SHOP, WILD ALARM ────────────────────────────────
  {
    carNumber: 'TTX 891204',
    reportingMark: 'TTX',
    carType: 'Flatcar',
    owner: 'TTX',
    builtYear: 2014,
    capacity: 80,
    length: 89,
    hazmat: false,
    currentStatus: 'SHOP',
    currentLocation: 'MacMillan Yard — Mechanical Shop Bay 3',
    lastSeen: '2026-05-13 09:00',
    consistHistory: [
      { trainId: 'Q11350-04', date: '2026-05-12', position: 55, totalCars: 92, origin: 'Taschereau Yard', destination: 'MacMillan Yard', subdivision: 'Kingston', weight: 160000 },
      { trainId: 'Q11250-03', date: '2026-05-06', position: 38, totalCars: 88, origin: 'MacMillan Yard', destination: 'Taschereau Yard', subdivision: 'Kingston', weight: 158000 },
    ],
    waysideReadings: [
      { detectorId: 'WILD-KGS-150', detectorType: 'WILD', location: 'Napanee, ON', milepost: 150.2, subdivision: 'Kingston', timestamp: '2026-05-12 11:22', reading: 'Wheel impact: 112 kips — ALARM threshold 100 kips exceeded', status: 'ALARM', trainId: 'Q11350-04' },
      { detectorId: 'HBD-KGS-100', detectorType: 'HBD', location: 'Belleville, ON', milepost: 100.4, subdivision: 'Kingston', timestamp: '2026-05-12 10:48', reading: 'All bearings normal', status: 'NORMAL', trainId: 'Q11350-04' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0401', date: '2026-05-12', severity: 'CRITICAL', type: 'Wheel Flat / High Impact', description: 'WILD alarm at Napanee — wheel impact 112 kips exceeds 100 kip alarm threshold. Car set out at MacMillan Yard for wheel inspection. Flat spot confirmed on Axle A2-Left. Scheduled for wheel truing.', detectedBy: 'WILD-KGS-150', location: 'Napanee, ON — Kingston Sub MP 150.2', resolved: false, workOrderId: 'WO-2026-9102' },
    ],
  },

  // ── Car 6: NS Autorack — IN_TRANSIT, Edson Sub ───────────────────────────
  {
    carNumber: 'NS 74412',
    reportingMark: 'NS',
    carType: 'Autorack',
    owner: 'NS',
    builtYear: 2018,
    capacity: 90,
    length: 89,
    hazmat: false,
    currentTrainId: 'L50251-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Edson Sub MP 112.8',
    lastSeen: '2026-05-14 14:15',
    consistHistory: [
      { trainId: 'L50251-05', date: '2026-05-14', position: 1, totalCars: 148, origin: 'Walker Yard', destination: 'MacMillan Yard', subdivision: 'Edson', weight: 241000 },
      { trainId: 'L50150-04', date: '2026-05-10', position: 4, totalCars: 144, origin: 'MacMillan Yard', destination: 'Walker Yard', subdivision: 'Edson', weight: 238000 },
    ],
    waysideReadings: [
      { detectorId: 'WILD-EDS-080', detectorType: 'WILD', location: 'Hinton, AB', milepost: 80.2, subdivision: 'Edson', timestamp: '2026-05-14 13:10', reading: 'Wheel impact: 88 kips — ALERT range 70–100 kips', status: 'ALERT', trainId: 'L50251-05' },
      { detectorId: 'HBD-EDS-112', detectorType: 'HBD', location: 'Edson, AB', milepost: 112.8, subdivision: 'Edson', timestamp: '2026-05-14 14:05', reading: 'All bearings normal — max 31°F above ambient', status: 'NORMAL', trainId: 'L50251-05' },
      { detectorId: 'AEI-EDS-001', detectorType: 'AEI', location: 'Walker Yard Exit', milepost: 1.0, subdivision: 'Edson', timestamp: '2026-05-14 04:12', reading: 'Tag read confirmed — NS 74412', status: 'NORMAL', trainId: 'L50251-05' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0455', date: '2026-05-14', severity: 'WARNING', type: 'Elevated Wheel Impact', description: 'WILD reading of 88 kips at Hinton — Axle B1-Right in ALERT range. Car to be inspected at next yard stop (MacMillan Yard). No set-out required at this time.', detectedBy: 'WILD-EDS-080', location: 'Hinton, AB — Edson Sub MP 80.2', resolved: false },
    ],
  },

  // ── Car 7: CN Tank Car — IN_TRANSIT, HAZMAT, Edson Sub ───────────────────
  {
    carNumber: 'CN 881204',
    reportingMark: 'CN',
    carType: 'Tank Car',
    owner: 'CN',
    builtYear: 2019,
    capacity: 28000,
    length: 60,
    hazmat: true,
    hazmatClass: 'Class 2.1 — Flammable Gas (LPG)',
    currentTrainId: 'L50251-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Edson Sub MP 112.8',
    lastSeen: '2026-05-14 14:15',
    consistHistory: [
      { trainId: 'L50251-05', date: '2026-05-14', position: 12, totalCars: 148, origin: 'Walker Yard', destination: 'MacMillan Yard', subdivision: 'Edson', weight: 280000 },
      { trainId: 'L50050-03', date: '2026-05-07', position: 9, totalCars: 152, origin: 'Taschereau Yard', destination: 'Walker Yard', subdivision: 'Edson', weight: 278000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-EDS-112', detectorType: 'HBD', location: 'Edson, AB', milepost: 112.8, subdivision: 'Edson', timestamp: '2026-05-14 14:05', reading: 'All bearings normal — max 24°F above ambient', status: 'NORMAL', trainId: 'L50251-05' },
      { detectorId: 'TADS-EDS-080', detectorType: 'TADS', location: 'Hinton, AB', milepost: 80.2, subdivision: 'Edson', timestamp: '2026-05-14 13:10', reading: 'Truck alignment nominal', status: 'NORMAL', trainId: 'L50251-05' },
    ],
    defectFlags: [],
  },

  // ── Car 8: CP Hopper — IN_YARD, Symington ────────────────────────────────
  {
    carNumber: 'CP 418822',
    reportingMark: 'CP',
    carType: 'Hopper',
    owner: 'CP',
    builtYear: 2012,
    capacity: 105,
    length: 54,
    hazmat: false,
    currentStatus: 'IN_YARD',
    currentLocation: 'Symington Yard — Track 18',
    lastSeen: '2026-05-14 06:00',
    consistHistory: [
      { trainId: 'M30050-04', date: '2026-05-13', position: 78, totalCars: 113, origin: 'Walker Yard', destination: 'Symington Yard', subdivision: 'Rivers', weight: 210000 },
      { trainId: 'M29950-03', date: '2026-05-08', position: 55, totalCars: 108, origin: 'Symington Yard', destination: 'Walker Yard', subdivision: 'Rivers', weight: 208000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-RVR-002', detectorType: 'HBD', location: 'Symington Yard Entry', milepost: 2.0, subdivision: 'Rivers', timestamp: '2026-05-13 18:22', reading: 'All bearings normal', status: 'NORMAL', trainId: 'M30050-04' },
      { detectorId: 'AEI-RVR-001', detectorType: 'AEI', location: 'Symington Yard Exit', milepost: 1.0, subdivision: 'Rivers', timestamp: '2026-05-08 07:30', reading: 'Tag read confirmed — CP 418822', status: 'NORMAL', trainId: 'M29950-03' },
    ],
    defectFlags: [],
  },

  // ── Car 9: UP Gondola — IN_TRANSIT, Wainwright Sub ───────────────────────
  {
    carNumber: 'UP 334521',
    reportingMark: 'UP',
    carType: 'Gondola',
    owner: 'UP',
    builtYear: 2009,
    capacity: 100,
    length: 52,
    hazmat: false,
    currentTrainId: 'H22351-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Wainwright Sub MP 122.4',
    lastSeen: '2026-05-14 14:00',
    consistHistory: [
      { trainId: 'H22351-05', date: '2026-05-14', position: 33, totalCars: 88, origin: 'Walker Yard', destination: 'Biggar, SK', subdivision: 'Wainwright', weight: 200000 },
      { trainId: 'H22250-04', date: '2026-05-09', position: 41, totalCars: 92, origin: 'Biggar, SK', destination: 'Walker Yard', subdivision: 'Wainwright', weight: 198000 },
    ],
    waysideReadings: [
      { detectorId: 'WILD-WAI-088', detectorType: 'WILD', location: 'Hardisty, AB', milepost: 88.0, subdivision: 'Wainwright', timestamp: '2026-05-14 12:44', reading: 'Wheel impact: 54 kips — slightly elevated, within limits', status: 'NORMAL', trainId: 'H22351-05' },
      { detectorId: 'HBD-WAI-088', detectorType: 'HBD', location: 'Hardisty, AB', milepost: 88.0, subdivision: 'Wainwright', timestamp: '2026-05-14 12:44', reading: 'All bearings normal — max 18°F above ambient', status: 'NORMAL', trainId: 'H22351-05' },
    ],
    defectFlags: [],
  },

  // ── Car 10: CN Intermodal — IN_TRANSIT, Montréal Sub ─────────────────────
  {
    carNumber: 'CN 512004',
    reportingMark: 'CN',
    carType: 'Intermodal',
    owner: 'CN',
    builtYear: 2020,
    capacity: 120,
    length: 89,
    hazmat: false,
    currentTrainId: 'A41451-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Montréal Sub MP 22.4',
    lastSeen: '2026-05-14 14:05',
    consistHistory: [
      { trainId: 'A41451-05', date: '2026-05-14', position: 5, totalCars: 94, origin: 'Taschereau Yard', destination: 'Gordon Yard', subdivision: 'Montréal', weight: 240000 },
      { trainId: 'A41350-03', date: '2026-05-11', position: 8, totalCars: 90, origin: 'Gordon Yard', destination: 'Taschereau Yard', subdivision: 'Montréal', weight: 238000 },
    ],
    waysideReadings: [
      { detectorId: 'AEI-MTL-001', detectorType: 'AEI', location: 'Taschereau Yard Exit', milepost: 1.0, subdivision: 'Montréal', timestamp: '2026-05-14 08:58', reading: 'Tag read confirmed — CN 512004', status: 'NORMAL', trainId: 'A41451-05' },
      { detectorId: 'HBD-MTL-020', detectorType: 'HBD', location: 'Longueuil, QC', milepost: 20.0, subdivision: 'Montréal', timestamp: '2026-05-14 09:22', reading: 'All bearings normal — max 15°F above ambient', status: 'NORMAL', trainId: 'A41451-05' },
    ],
    defectFlags: [],
  },

  // ── Car 11: CN Coil Car — IN_TRANSIT, Kingston Sub, WILD 63 kips ─────────
  {
    carNumber: 'CN 634812',
    reportingMark: 'CN',
    carType: 'Coil Car',
    owner: 'CN',
    builtYear: 2013,
    capacity: 95,
    length: 52,
    hazmat: false,
    currentTrainId: 'U55451-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Kingston Sub MP 144.8 (STOPPED)',
    lastSeen: '2026-05-14 14:00',
    consistHistory: [
      { trainId: 'U55451-05', date: '2026-05-14', position: 22, totalCars: 55, origin: 'Taschereau Yard', destination: 'MacMillan Yard', subdivision: 'Kingston', weight: 190000 },
      { trainId: 'U55350-04', date: '2026-05-10', position: 18, totalCars: 60, origin: 'MacMillan Yard', destination: 'Taschereau Yard', subdivision: 'Kingston', weight: 188000 },
    ],
    waysideReadings: [
      { detectorId: 'WILD-KGS-150', detectorType: 'WILD', location: 'Napanee, ON', milepost: 150.2, subdivision: 'Kingston', timestamp: '2026-05-14 13:30', reading: 'Wheel impact: 63 kips — elevated, below alert threshold', status: 'NORMAL', trainId: 'U55451-05' },
      { detectorId: 'HBD-KGS-100', detectorType: 'HBD', location: 'Belleville, ON', milepost: 100.4, subdivision: 'Kingston', timestamp: '2026-05-14 12:45', reading: 'All bearings normal', status: 'NORMAL', trainId: 'U55451-05' },
    ],
    defectFlags: [],
  },

  // ── Car 12: CSXT Boxcar — FOREIGN_ROAD, Ruel Sub ─────────────────────────
  {
    carNumber: 'CSXT 4412',
    reportingMark: 'CSXT',
    carType: 'Boxcar',
    owner: 'CSXT',
    builtYear: 2007,
    capacity: 70,
    length: 50,
    hazmat: false,
    currentStatus: 'FOREIGN_ROAD',
    currentLocation: 'Ruel Sub MP 201.4 (via interchange)',
    lastSeen: '2026-05-14 11:00',
    consistHistory: [
      { trainId: 'T22151-05', date: '2026-05-14', position: 31, totalCars: 78, origin: 'Gordon Yard', destination: 'Symington Yard', subdivision: 'Ruel', weight: 140000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-RUL-200', detectorType: 'HBD', location: 'Chapleau, ON', milepost: 200.0, subdivision: 'Ruel', timestamp: '2026-05-14 10:55', reading: 'All bearings normal', status: 'NORMAL', trainId: 'T22151-05' },
    ],
    defectFlags: [],
  },

  // ── Car 13: CN Tank Car — STORED, HAZMAT, Walker Yard ────────────────────
  {
    carNumber: 'CN 990441',
    reportingMark: 'CN',
    carType: 'Tank Car',
    owner: 'CN',
    builtYear: 2015,
    capacity: 32000,
    length: 60,
    hazmat: true,
    hazmatClass: 'Class 8 — Corrosive (Sulphuric Acid)',
    currentStatus: 'STORED',
    currentLocation: 'Walker Yard — Hazmat Track 4',
    lastSeen: '2026-05-10 14:00',
    consistHistory: [
      { trainId: 'L50050-03', date: '2026-05-07', position: 2, totalCars: 152, origin: 'Taschereau Yard', destination: 'Walker Yard', subdivision: 'Edson', weight: 320000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-EDS-040', detectorType: 'HBD', location: 'Evansburg, AB', milepost: 40.1, subdivision: 'Edson', timestamp: '2026-05-07 15:10', reading: 'All bearings normal', status: 'NORMAL', trainId: 'L50050-03' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0299', date: '2026-05-10', severity: 'INFO', type: 'Stored — Awaiting Consignee', description: 'Car stored at Walker Yard pending consignee instructions. Hazmat placard verified. Inspection due in 14 days.', detectedBy: 'Yard Inspection — Walker', location: 'Walker Yard — Hazmat Track 4', resolved: false },
    ],
  },

  // ── Car 14: CN Centerbeam — IN_TRANSIT, Bala Sub ─────────────────────────
  {
    carNumber: 'CN 288441',
    reportingMark: 'CN',
    carType: 'Centerbeam',
    owner: 'CN',
    builtYear: 2017,
    capacity: 85,
    length: 73,
    hazmat: false,
    currentTrainId: 'G87351-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Bala Sub MP 88.2',
    lastSeen: '2026-05-14 14:30',
    consistHistory: [
      { trainId: 'G87351-05', date: '2026-05-14', position: 28, totalCars: 42, origin: 'MacMillan Yard', destination: 'Capreol Yard', subdivision: 'Bala', weight: 170000 },
      { trainId: 'G87250-04', date: '2026-05-09', position: 15, totalCars: 55, origin: 'Capreol Yard', destination: 'MacMillan Yard', subdivision: 'MacMillan', weight: 168000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-BAL-088', detectorType: 'HBD', location: 'Huntsville, ON', milepost: 88.2, subdivision: 'Bala', timestamp: '2026-05-14 14:28', reading: 'All bearings normal — max 21°F above ambient', status: 'NORMAL', trainId: 'G87351-05' },
      { detectorId: 'WILD-BAL-060', detectorType: 'WILD', location: 'Gravenhurst, ON', milepost: 60.0, subdivision: 'Bala', timestamp: '2026-05-14 13:55', reading: 'Wheel impact: 38 kips — within limits', status: 'NORMAL', trainId: 'G87351-05' },
    ],
    defectFlags: [],
  },

  // ── Car 15: NS Gondola — IN_TRANSIT, Kingston Sub, WILD 57 kips ──────────
  {
    carNumber: 'NS 881204',
    reportingMark: 'NS',
    carType: 'Gondola',
    owner: 'NS',
    builtYear: 2010,
    capacity: 100,
    length: 52,
    hazmat: false,
    currentTrainId: 'Q11451-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Kingston Sub MP 188.4',
    lastSeen: '2026-05-14 14:22',
    consistHistory: [
      { trainId: 'Q11451-05', date: '2026-05-14', position: 62, totalCars: 85, origin: 'MacMillan Yard', destination: 'Taschereau Yard', subdivision: 'Kingston', weight: 200000 },
    ],
    waysideReadings: [
      { detectorId: 'WILD-KGS-150', detectorType: 'WILD', location: 'Napanee, ON', milepost: 150.2, subdivision: 'Kingston', timestamp: '2026-05-14 13:41', reading: 'Wheel impact: 57 kips — slightly elevated, below alert threshold', status: 'NORMAL', trainId: 'Q11451-05' },
      { detectorId: 'HBD-KGS-188', detectorType: 'HBD', location: 'Kingston, ON', milepost: 188.0, subdivision: 'Kingston', timestamp: '2026-05-14 14:20', reading: 'All bearings normal', status: 'NORMAL', trainId: 'Q11451-05' },
    ],
    defectFlags: [],
  },

  // ── Car 16: CN Hopper — IN_YARD, Taschereau ──────────────────────────────
  {
    carNumber: 'CN 774412',
    reportingMark: 'CN',
    carType: 'Hopper',
    owner: 'CN',
    builtYear: 2014,
    capacity: 110,
    length: 56,
    hazmat: false,
    currentStatus: 'IN_YARD',
    currentLocation: 'Taschereau Yard — Track 7',
    lastSeen: '2026-05-14 07:00',
    consistHistory: [
      { trainId: 'A41350-03', date: '2026-05-13', position: 44, totalCars: 90, origin: 'Gordon Yard', destination: 'Taschereau Yard', subdivision: 'Montréal', weight: 220000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-MTL-020', detectorType: 'HBD', location: 'Longueuil, QC', milepost: 20.0, subdivision: 'Montréal', timestamp: '2026-05-13 22:15', reading: 'All bearings normal', status: 'NORMAL', trainId: 'A41350-03' },
    ],
    defectFlags: [],
  },

  // ── Car 17: UP Flatcar — IN_TRANSIT, Rivers Sub ───────────────────────────
  {
    carNumber: 'UP 512881',
    reportingMark: 'UP',
    carType: 'Flatcar',
    owner: 'UP',
    builtYear: 2016,
    capacity: 80,
    length: 89,
    hazmat: false,
    currentTrainId: 'M30151-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Rivers Sub MP 44.1',
    lastSeen: '2026-05-14 14:10',
    consistHistory: [
      { trainId: 'M30151-05', date: '2026-05-14', position: 88, totalCars: 113, origin: 'Symington Yard', destination: 'Walker Yard', subdivision: 'Rivers', weight: 160000 },
    ],
    waysideReadings: [
      { detectorId: 'WILD-RVR-020', detectorType: 'WILD', location: 'Portage la Prairie, MB', milepost: 20.5, subdivision: 'Rivers', timestamp: '2026-05-14 13:22', reading: 'Wheel impact: 44 kips — within limits', status: 'NORMAL', trainId: 'M30151-05' },
      { detectorId: 'HBD-RVR-044', detectorType: 'HBD', location: 'Brandon, MB', milepost: 44.1, subdivision: 'Rivers', timestamp: '2026-05-14 14:08', reading: 'All bearings normal — max 12°F above ambient', status: 'NORMAL', trainId: 'M30151-05' },
    ],
    defectFlags: [],
  },

  // ── Car 18: CN Boxcar — SHOP, Symington ──────────────────────────────────
  {
    carNumber: 'CN 341122',
    reportingMark: 'CN',
    carType: 'Boxcar',
    owner: 'CN',
    builtYear: 2006,
    capacity: 70,
    length: 50,
    hazmat: false,
    currentStatus: 'SHOP',
    currentLocation: 'Symington Yard — Shop Bay 2',
    lastSeen: '2026-05-12 10:00',
    consistHistory: [
      { trainId: 'M29950-03', date: '2026-05-11', position: 14, totalCars: 108, origin: 'Walker Yard', destination: 'Symington Yard', subdivision: 'Rivers', weight: 140000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-RVR-090', detectorType: 'HBD', location: 'Brandon, MB', milepost: 90.3, subdivision: 'Rivers', timestamp: '2026-05-11 16:00', reading: 'L-Bearing: 72°F above ambient — ALARM threshold exceeded', status: 'ALARM', trainId: 'M29950-03' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0488', date: '2026-05-11', severity: 'CRITICAL', type: 'Hot Bearing — ALARM', description: 'HBD ALARM at Brandon — Axle B2-Left bearing 72°F above ambient, exceeds 60°F alarm threshold. Car set out at Symington Yard. Bearing replacement in progress.', detectedBy: 'HBD-RVR-090', location: 'Brandon, MB — Rivers Sub MP 90.3', resolved: false, workOrderId: 'WO-2026-9201' },
    ],
  },

  // ── Car 19: CN Gondola — IN_TRANSIT, Edson Sub, WILD 79 kips ─────────────
  {
    carNumber: 'CN 558801',
    reportingMark: 'CN',
    carType: 'Gondola',
    owner: 'CN',
    builtYear: 2015,
    capacity: 100,
    length: 52,
    hazmat: false,
    currentTrainId: 'L50251-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Edson Sub MP 112.8',
    lastSeen: '2026-05-14 14:15',
    consistHistory: [
      { trainId: 'L50251-05', date: '2026-05-14', position: 44, totalCars: 148, origin: 'Walker Yard', destination: 'MacMillan Yard', subdivision: 'Edson', weight: 200000 },
    ],
    waysideReadings: [
      { detectorId: 'WILD-EDS-080', detectorType: 'WILD', location: 'Hinton, AB', milepost: 80.2, subdivision: 'Edson', timestamp: '2026-05-14 13:10', reading: 'Wheel impact: 79 kips — ALERT range 70–100 kips', status: 'ALERT', trainId: 'L50251-05' },
      { detectorId: 'HBD-EDS-112', detectorType: 'HBD', location: 'Edson, AB', milepost: 112.8, subdivision: 'Edson', timestamp: '2026-05-14 14:05', reading: 'All bearings normal', status: 'NORMAL', trainId: 'L50251-05' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0461', date: '2026-05-14', severity: 'WARNING', type: 'Elevated Wheel Impact', description: 'WILD reading 79 kips at Hinton — Axle A1-Right in ALERT range. Monitor at next detector. Inspect at MacMillan Yard.', detectedBy: 'WILD-EDS-080', location: 'Hinton, AB — Edson Sub MP 80.2', resolved: false },
    ],
  },

  // ── Car 20: CN Intermodal — IN_TRANSIT, Moncton Sub ──────────────────────
  {
    carNumber: 'CN 620044',
    reportingMark: 'CN',
    carType: 'Intermodal',
    owner: 'CN',
    builtYear: 2021,
    capacity: 120,
    length: 89,
    hazmat: false,
    currentTrainId: 'F77251-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Moncton Sub MP 44.2',
    lastSeen: '2026-05-14 14:20',
    consistHistory: [
      { trainId: 'F77251-05', date: '2026-05-14', position: 11, totalCars: 96, origin: 'Walker Yard', destination: 'Symington Yard', subdivision: 'Moncton', weight: 240000 },
      { trainId: 'F77150-04', date: '2026-05-10', position: 8, totalCars: 98, origin: 'Symington Yard', destination: 'Walker Yard', subdivision: 'Rivers', weight: 238000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-MCT-044', detectorType: 'HBD', location: 'Amherst, NS', milepost: 44.2, subdivision: 'Moncton', timestamp: '2026-05-14 14:18', reading: 'All bearings normal — max 17°F above ambient', status: 'NORMAL', trainId: 'F77251-05' },
      { detectorId: 'AEI-MCT-001', detectorType: 'AEI', location: 'Gordon Yard Exit', milepost: 1.0, subdivision: 'Moncton', timestamp: '2026-05-14 07:30', reading: 'Tag read confirmed — CN 620044', status: 'NORMAL', trainId: 'F77251-05' },
    ],
    defectFlags: [],
  },

  // ── Car 21: CN Gondola — SHOP, HBD WM51 K-value alarm (Kt=4.8, Ke=3.2) ────
  // Caught by AAR S-6001 §4.1.1: Kt>3.5 AND Ke>2 AND bearing 50°F hotter than any other
  {
    carNumber: 'CN 448821',
    reportingMark: 'CN',
    carType: 'Gondola',
    owner: 'CN',
    builtYear: 2013,
    capacity: 100,
    length: 52,
    hazmat: false,
    currentStatus: 'SHOP',
    currentLocation: 'MacMillan Yard — Mechanical Shop Bay 5',
    lastSeen: '2026-05-14 10:30',
    consistHistory: [
      { trainId: 'Q11451-05', date: '2026-05-14', position: 38, totalCars: 85, origin: 'MacMillan Yard', destination: 'Taschereau Yard', subdivision: 'Kingston', weight: 200000 },
      { trainId: 'Q11350-04', date: '2026-05-10', position: 41, totalCars: 92, origin: 'Taschereau Yard', destination: 'MacMillan Yard', subdivision: 'Kingston', weight: 198000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-KGS-100', detectorType: 'HBD', location: 'Belleville, ON', milepost: 100.4, subdivision: 'Kingston', timestamp: '2026-05-14 09:15', reading: 'WM51 ALARM — Axle A1-Right: Kt=4.8, Ke=3.2, bearing 118°F above ambient (62°F hotter than next hottest bearing). Mandatory set-out required.', status: 'ALARM', trainId: 'Q11451-05' },
      { detectorId: 'HBD-KGS-050', detectorType: 'HBD', location: 'Cobourg, ON', milepost: 50.1, subdivision: 'Kingston', timestamp: '2026-05-14 08:22', reading: 'WM52 ALERT — Axle A1-Right: Kt=2.1, Ke=2.4, TADS rank 2 defect. Monitoring initiated.', status: 'ALERT', trainId: 'Q11451-05' },
      { detectorId: 'HBD-KGS-010', detectorType: 'HBD', location: 'Oshawa, ON', milepost: 10.2, subdivision: 'Kingston', timestamp: '2026-05-14 07:30', reading: 'Axle A1-Right: Kt=1.6, Ke=1.8 — elevated, monitoring.', status: 'NORMAL', trainId: 'Q11451-05' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0512', date: '2026-05-14', severity: 'CRITICAL', type: 'Hot Bearing — WM51 K-value Alarm', description: 'AAR S-6001 §4.1.1 WM51 qualifying indication at Belleville HBD: Axle A2-Right Kt=4.8 (>3.5), Ke=3.2 (>2), bearing 118°F above ambient — 62°F hotter than next hottest bearing on equipment. Mandatory set-out executed. Car pulled from Q11451-05 at Kingston. Bearing replacement ordered.', detectedBy: 'HBD-KGS-100', location: 'Belleville, ON — Kingston Sub MP 100.4', resolved: false, workOrderId: 'WO-2026-9310' },
    ],
  },

  // ── Car 22: BNSF Boxcar — SHOP, WILD Rule 41 ≥90 kips (immediate set-out) ──
  // Caught by AAR Field Manual Rule 41: wheel impact ≥90 kips = immediate set-out
  {
    carNumber: 'BNSF 771204',
    reportingMark: 'BNSF',
    carType: 'Boxcar',
    owner: 'BNSF',
    builtYear: 2009,
    capacity: 70,
    length: 50,
    hazmat: false,
    currentStatus: 'SHOP',
    currentLocation: 'Capreol Yard — Wheel Shop Bay 2',
    lastSeen: '2026-05-13 22:00',
    consistHistory: [
      { trainId: 'P33151-05', date: '2026-05-13', position: 67, totalCars: 118, origin: 'Gordon Yard', destination: 'Taschereau Yard', subdivision: 'Capreol', weight: 140000 },
      { trainId: 'P33050-04', date: '2026-05-08', position: 71, totalCars: 112, origin: 'Taschereau Yard', destination: 'Gordon Yard', subdivision: 'Capreol', weight: 138000 },
    ],
    waysideReadings: [
      { detectorId: 'WILD-CAP-178', detectorType: 'WILD', location: 'Capreol, ON', milepost: 178.4, subdivision: 'Capreol', timestamp: '2026-05-13 21:44', reading: 'Rule 41 ALARM — Axle B2-Left: 96 kips. Exceeds 90 kip mandatory immediate set-out threshold. Train stopped at MP 178.4.', status: 'ALARM', trainId: 'P33151-05' },
      { detectorId: 'WILD-CAP-100', detectorType: 'WILD', location: 'Sudbury, ON', milepost: 100.2, subdivision: 'Capreol', timestamp: '2026-05-13 20:55', reading: 'Axle B2-Left: 72 kips — Rule 41 ALERT range (65–89 kips). Set-out at next yard ordered.', status: 'ALERT', trainId: 'P33151-05' },
      { detectorId: 'WILD-CAP-044', detectorType: 'WILD', location: 'Parry Sound, ON', milepost: 44.2, subdivision: 'Capreol', timestamp: '2026-05-13 19:30', reading: 'Axle B2-Left: 58 kips — Rule 41 ELEVATED (50–64 kips). Owner notified.', status: 'NORMAL', trainId: 'P33151-05' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0521', date: '2026-05-13', severity: 'CRITICAL', type: 'Wheel Flat — Rule 41 ALARM', description: 'AAR Rule 41 ALARM: Axle B2-Left wheel impact 96 kips at Capreol WILD (MP 178.4). Exceeds 90 kip mandatory immediate set-out threshold. Train P33151-05 stopped. Car pulled from consist. Compound flat spot confirmed — wheel truing required. Progressive deterioration observed: 58 kips (Parry Sound) → 72 kips (Sudbury) → 96 kips (Capreol).', detectedBy: 'WILD-CAP-178', location: 'Capreol, ON — Capreol Sub MP 178.4', resolved: false, workOrderId: 'WO-2026-9318' },
    ],
  },

  // ── Car 23: UP Tank Car — SHOP, HAZMAT, DED Level 2 alarm (dragging brake rigging) ──
  {
    carNumber: 'UP 448812',
    reportingMark: 'UP',
    carType: 'Tank Car',
    owner: 'UP',
    builtYear: 2017,
    capacity: 28000,
    length: 60,
    hazmat: true,
    hazmatClass: 'Class 3 — Flammable Liquid (Ethanol)',
    currentStatus: 'SHOP',
    currentLocation: 'Edson, AB — Mechanical Set-Out Track 3',
    lastSeen: '2026-05-14 11:00',
    consistHistory: [
      { trainId: 'L50251-05', date: '2026-05-14', position: 22, totalCars: 148, origin: 'Walker Yard', destination: 'MacMillan Yard', subdivision: 'Edson', weight: 280000 },
      { trainId: 'L50150-04', date: '2026-05-09', position: 19, totalCars: 144, origin: 'MacMillan Yard', destination: 'Walker Yard', subdivision: 'Edson', weight: 278000 },
    ],
    waysideReadings: [
      { detectorId: 'DED-EDS-112', detectorType: 'DED', location: 'Edson, AB', milepost: 112.8, subdivision: 'Edson', timestamp: '2026-05-14 10:55', reading: 'DED Level 2 ALARM — Contact detected at rail head level. Dragging brake rigging confirmed. Train L50251-05 stopped immediately at MP 112.8. HAZMAT car — emergency response protocol activated.', status: 'ALARM', trainId: 'L50251-05' },
      { detectorId: 'DED-EDS-040', detectorType: 'DED', location: 'Evansburg, AB', milepost: 40.1, subdivision: 'Edson', timestamp: '2026-05-14 09:30', reading: 'DED Level 1 WARNING — Object detected above rail head clearance. Crew notified. Proceed at restricted speed to next inspection point.', status: 'ALERT', trainId: 'L50251-05' },
      { detectorId: 'HBD-EDS-112', detectorType: 'HBD', location: 'Edson, AB', milepost: 112.8, subdivision: 'Edson', timestamp: '2026-05-14 10:55', reading: 'All bearings normal — max 22°F above ambient', status: 'NORMAL', trainId: 'L50251-05' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0528', date: '2026-05-14', severity: 'CRITICAL', type: 'Dragging Equipment — DED Level 2 ALARM', description: 'DED Level 2 ALARM at Edson MP 112.8: contact detected at rail head level. Broken brake rigging (S-bracket) confirmed dragging. HAZMAT car (Class 3 Ethanol) — emergency response protocol activated. Train stopped immediately. Car set out at Edson mechanical track. Brake rigging replacement in progress.', detectedBy: 'DED-EDS-112', location: 'Edson, AB — Edson Sub MP 112.8', resolved: false, workOrderId: 'WO-2026-9325' },
    ],
  },

  // ── Car 24: CN Gondola — IN_TRANSIT, Ruel Sub, HBD WM51 §4.1.2 (second hottest <45%) ──
  // Caught by AAR S-6001 §4.1.2: Kt>3.5 AND second hottest bearing Kt<45% of this bearing
  {
    carNumber: 'CN 882341',
    reportingMark: 'CN',
    carType: 'Gondola',
    owner: 'CN',
    builtYear: 2014,
    capacity: 100,
    length: 52,
    hazmat: false,
    currentTrainId: 'T22151-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Ruel Sub MP 201.4 (STOPPED)',
    lastSeen: '2026-05-14 13:00',
    consistHistory: [
      { trainId: 'T22151-05', date: '2026-05-14', position: 18, totalCars: 78, origin: 'Gordon Yard', destination: 'Symington Yard', subdivision: 'Ruel', weight: 200000 },
      { trainId: 'T22050-04', date: '2026-05-09', position: 22, totalCars: 82, origin: 'Symington Yard', destination: 'Gordon Yard', subdivision: 'Ruel', weight: 198000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-RUL-200', detectorType: 'HBD', location: 'Chapleau, ON', milepost: 200.0, subdivision: 'Ruel', timestamp: '2026-05-14 12:55', reading: 'WM51 ALARM §4.1.2 — Axle B1-Right: Kt=4.1 (>3.5). Second hottest bearing Kt=1.7 (41% of 4.1, below 45% threshold). Mandatory set-out required.', status: 'ALARM', trainId: 'T22151-05' },
      { detectorId: 'HBD-RUL-150', detectorType: 'HBD', location: 'White River, ON', milepost: 150.0, subdivision: 'Ruel', timestamp: '2026-05-14 11:30', reading: 'Axle B1-Right: Kt=2.8, Ke=1.6 — elevated, monitoring.', status: 'NORMAL', trainId: 'T22151-05' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0534', date: '2026-05-14', severity: 'CRITICAL', type: 'Hot Bearing — WM51 K-value Alarm §4.1.2', description: 'AAR S-6001 §4.1.2 WM51 qualifying indication at Chapleau HBD (Ruel Sub MP 200.0): Axle B1-Right Kt=4.1 (>3.5 threshold). Second hottest bearing Kt=1.7, which is 41% of the alarm bearing — below the 45% threshold. Mandatory set-out executed at Chapleau. Bearing inspection ordered.', detectedBy: 'HBD-RUL-200', location: 'Chapleau, ON — Ruel Sub MP 200.0', resolved: false, workOrderId: 'WO-2026-9341' },
    ],
  },

  // ── Car 25: CSXT Boxcar — SHOP, HBD WM51 §4.1.3 (3-pass rolling window rule) ──
  // Caught by AAR S-6001 §4.1.3: 3 HBD passings within 240h rolling window
  {
    carNumber: 'CSXT 8812',
    reportingMark: 'CSXT',
    carType: 'Boxcar',
    owner: 'CSXT',
    builtYear: 2008,
    capacity: 70,
    length: 50,
    hazmat: false,
    currentStatus: 'SHOP',
    currentLocation: 'Symington Yard — Shop Bay 4',
    lastSeen: '2026-05-14 09:00',
    consistHistory: [
      { trainId: 'M30151-05', date: '2026-05-14', position: 55, totalCars: 113, origin: 'Symington Yard', destination: 'Walker Yard', subdivision: 'Rivers', weight: 140000 },
      { trainId: 'M30050-04', date: '2026-05-12', position: 48, totalCars: 113, origin: 'Walker Yard', destination: 'Symington Yard', subdivision: 'Rivers', weight: 138000 },
      { trainId: 'M29950-03', date: '2026-05-10', position: 52, totalCars: 108, origin: 'Symington Yard', destination: 'Walker Yard', subdivision: 'Rivers', weight: 136000 },
    ],
    waysideReadings: [
      { detectorId: 'HBD-RVR-044', detectorType: 'HBD', location: 'Brandon, MB', milepost: 44.1, subdivision: 'Rivers', timestamp: '2026-05-14 08:55', reading: 'WM51 ALARM §4.1.3 — Axle A2-Left: Kt=4.2, Ke=2.1, temp 98°F above ambient. Pass 1 of 3-pass rolling window rule triggered. Combined with 2 prior reads (Kt≥1.5, Ke≥2) within 240h window. Mandatory set-out required.', status: 'ALARM', trainId: 'M30151-05' },
      { detectorId: 'HBD-RVR-090', detectorType: 'HBD', location: 'Brandon, MB', milepost: 90.3, subdivision: 'Rivers', timestamp: '2026-05-12 14:20', reading: 'Axle A2-Left: Kt=1.8, Ke=2.3 — rolling window pass 2 of 3. Monitoring.', status: 'ALERT', trainId: 'M30050-04' },
      { detectorId: 'HBD-RVR-090', detectorType: 'HBD', location: 'Brandon, MB', milepost: 90.3, subdivision: 'Rivers', timestamp: '2026-05-10 11:05', reading: 'Axle A2-Left: Kt=1.6, Ke=2.1 — rolling window pass 3 of 3. Monitoring.', status: 'ALERT', trainId: 'M29950-03' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0548', date: '2026-05-14', severity: 'CRITICAL', type: 'Hot Bearing — WM51 §4.1.3 Rolling Window Alarm', description: 'AAR S-6001 §4.1.3 WM51 qualifying indication: 3 HBD passings within 240-hour rolling window. Pass 1 (2026-05-10): Kt=1.6, Ke=2.1. Pass 2 (2026-05-12): Kt=1.8, Ke=2.3. Pass 3 (2026-05-14): Kt=4.2, Ke=2.1, temp 98°F above ambient — satisfies §4.1.3 primary condition (Kt≥4.0, temp≥95°F above ambient, Ke≥2). Mandatory set-out executed at Symington Yard. Bearing replacement in progress.', detectedBy: 'HBD-RVR-044', location: 'Brandon, MB — Rivers Sub MP 44.1', resolved: false, workOrderId: 'WO-2026-9355' },
    ],
  },

  // ── Car 26: NS Gondola — IN_TRANSIT, Bala Sub, WILD Rule 41 65–89 kips (set-out at next yard) ──
  {
    carNumber: 'NS 441204',
    reportingMark: 'NS',
    carType: 'Gondola',
    owner: 'NS',
    builtYear: 2011,
    capacity: 100,
    length: 52,
    hazmat: false,
    currentTrainId: 'G87351-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Bala Sub MP 88.2',
    lastSeen: '2026-05-14 14:30',
    consistHistory: [
      { trainId: 'G87351-05', date: '2026-05-14', position: 14, totalCars: 42, origin: 'MacMillan Yard', destination: 'Capreol Yard', subdivision: 'Bala', weight: 200000 },
      { trainId: 'G87250-04', date: '2026-05-09', position: 19, totalCars: 55, origin: 'Capreol Yard', destination: 'MacMillan Yard', subdivision: 'Bala', weight: 198000 },
    ],
    waysideReadings: [
      { detectorId: 'WILD-BAL-060', detectorType: 'WILD', location: 'Gravenhurst, ON', milepost: 60.0, subdivision: 'Bala', timestamp: '2026-05-14 13:55', reading: 'Rule 41 ALERT — Axle A1-Left: 74 kips. In 65–89 kip range. Car must be set out at next yard stop (Capreol) for wheel inspection.', status: 'ALERT', trainId: 'G87351-05' },
      { detectorId: 'HBD-BAL-088', detectorType: 'HBD', location: 'Huntsville, ON', milepost: 88.2, subdivision: 'Bala', timestamp: '2026-05-14 14:28', reading: 'All bearings normal — max 19°F above ambient', status: 'NORMAL', trainId: 'G87351-05' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0562', date: '2026-05-14', severity: 'WARNING', type: 'Wheel Impact — Rule 41 ALERT', description: 'AAR Rule 41 ALERT: Axle A1-Left wheel impact 74 kips at Gravenhurst WILD (Bala Sub MP 60.0). In 65–89 kip range — car must be set out at next yard stop for inspection. Car continuing to Capreol Yard under monitoring.', detectedBy: 'WILD-BAL-060', location: 'Gravenhurst, ON — Bala Sub MP 60.0', resolved: false },
    ],
  },

  // ── Car 27: CP Covered Hopper — IN_TRANSIT, Wainwright Sub, HBD WM52 (ABD/TADS Rank 2) ──
  // Caught by AAR S-6001 §4.2.1: Kt>1.7 AND Ke>2 AND TADS defect rank ≥2
  {
    carNumber: 'CP 884412',
    reportingMark: 'CP',
    carType: 'Hopper',
    owner: 'CP',
    builtYear: 2015,
    capacity: 110,
    length: 56,
    hazmat: false,
    currentTrainId: 'H22351-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Wainwright Sub MP 122.4',
    lastSeen: '2026-05-14 14:00',
    consistHistory: [
      { trainId: 'H22351-05', date: '2026-05-14', position: 55, totalCars: 88, origin: 'Walker Yard', destination: 'Biggar, SK', subdivision: 'Wainwright', weight: 220000 },
      { trainId: 'H22250-04', date: '2026-05-09', position: 58, totalCars: 92, origin: 'Biggar, SK', destination: 'Walker Yard', subdivision: 'Wainwright', weight: 218000 },
    ],
    waysideReadings: [
      { detectorId: 'TADS-WAI-088', detectorType: 'TADS', location: 'Hardisty, AB', milepost: 88.0, subdivision: 'Wainwright', timestamp: '2026-05-14 12:44', reading: 'WM52 ALERT §4.2.1 — Axle B2-Right: Kt=2.2 (>1.7), Ke=2.6 (>2), TADS defect rank 2 (moderate spalling on cup running surface). Monitoring initiated. Set-out at next yard if Kt increases.', status: 'ALERT', trainId: 'H22351-05' },
      { detectorId: 'HBD-WAI-088', detectorType: 'HBD', location: 'Hardisty, AB', milepost: 88.0, subdivision: 'Wainwright', timestamp: '2026-05-14 12:44', reading: 'Axle B2-Right: 44°F above ambient — elevated, consistent with TADS indication.', status: 'ALERT', trainId: 'H22351-05' },
      { detectorId: 'HBD-WAI-044', detectorType: 'HBD', location: 'Wainwright, AB', milepost: 44.0, subdivision: 'Wainwright', timestamp: '2026-05-14 11:30', reading: 'Axle B2-Right: Kt=1.9, Ke=2.1 — first indication. Monitoring.', status: 'NORMAL', trainId: 'H22351-05' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0571', date: '2026-05-14', severity: 'WARNING', type: 'Bearing Defect — WM52 K-value Alert', description: 'AAR S-6001 §4.2.1 WM52 qualifying indication at Hardisty TADS/HBD (Wainwright Sub MP 88.0): Axle B2-Right Kt=2.2 (>1.7), Ke=2.6 (>2), TADS acoustic defect rank 2 (moderate spalling on cup running surface). Car flagged for set-out at Biggar, SK. Owner (CP) notified.', detectedBy: 'TADS-WAI-088', location: 'Hardisty, AB — Wainwright Sub MP 88.0', resolved: false },
    ],
  },

  // ── Car 28: CN Flatcar — IN_TRANSIT, Edson Sub, WILD 50–64 kips (ELEVATED, owner notified) ──
  {
    carNumber: 'CN 558412',
    reportingMark: 'CN',
    carType: 'Flatcar',
    owner: 'CN',
    builtYear: 2016,
    capacity: 80,
    length: 89,
    hazmat: false,
    currentTrainId: 'L50251-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Edson Sub MP 112.8',
    lastSeen: '2026-05-14 14:15',
    consistHistory: [
      { trainId: 'L50251-05', date: '2026-05-14', position: 66, totalCars: 148, origin: 'Walker Yard', destination: 'MacMillan Yard', subdivision: 'Edson', weight: 160000 },
      { trainId: 'L50150-04', date: '2026-05-09', position: 70, totalCars: 144, origin: 'MacMillan Yard', destination: 'Walker Yard', subdivision: 'Edson', weight: 158000 },
    ],
    waysideReadings: [
      { detectorId: 'WILD-EDS-080', detectorType: 'WILD', location: 'Hinton, AB', milepost: 80.2, subdivision: 'Edson', timestamp: '2026-05-14 13:10', reading: 'Rule 41 ELEVATED — Axle B1-Right: 62 kips. In 50–64 kip range. No mandatory action. Car owner (CN) notified. Monitor at next detector.', status: 'NORMAL', trainId: 'L50251-05' },
      { detectorId: 'HBD-EDS-112', detectorType: 'HBD', location: 'Edson, AB', milepost: 112.8, subdivision: 'Edson', timestamp: '2026-05-14 14:05', reading: 'All bearings normal — max 16°F above ambient', status: 'NORMAL', trainId: 'L50251-05' },
    ],
    defectFlags: [],
  },

  // ── Car 29: TTX Flatcar — SHOP, ABD/TADS Rank 4 (critical defect, immediate set-out) ──
  // Caught by AAR S-6000 Level-1 indication: orange peel surface + spalling ≥1.5 in²
  {
    carNumber: 'TTX 228841',
    reportingMark: 'TTX',
    carType: 'Flatcar',
    owner: 'TTX',
    builtYear: 2012,
    capacity: 80,
    length: 89,
    hazmat: false,
    currentStatus: 'SHOP',
    currentLocation: 'Walker Yard — Wheel Shop Bay 1',
    lastSeen: '2026-05-13 18:00',
    consistHistory: [
      { trainId: 'L50150-04', date: '2026-05-13', position: 12, totalCars: 144, origin: 'MacMillan Yard', destination: 'Walker Yard', subdivision: 'Edson', weight: 160000 },
      { trainId: 'L50050-03', date: '2026-05-08', position: 15, totalCars: 152, origin: 'Walker Yard', destination: 'MacMillan Yard', subdivision: 'Edson', weight: 158000 },
    ],
    waysideReadings: [
      { detectorId: 'TADS-EDS-080', detectorType: 'TADS', location: 'Hinton, AB', milepost: 80.2, subdivision: 'Edson', timestamp: '2026-05-13 16:44', reading: 'ABD/TADS Rank 4 ALARM — Axle A2-Right: S-6000 Level-1 indication. Orange peel surface detected on cup running surface. Spalling area estimated 2.1 in² (exceeds 1.5 in² threshold). Immediate set-out required.', status: 'ALARM', trainId: 'L50150-04' },
      { detectorId: 'HBD-EDS-112', detectorType: 'HBD', location: 'Edson, AB', milepost: 112.8, subdivision: 'Edson', timestamp: '2026-05-13 17:10', reading: 'Axle A2-Right: Kt=1.4, Ke=1.8 — consistent with TADS indication. Monitoring.', status: 'NORMAL', trainId: 'L50150-04' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0588', date: '2026-05-13', severity: 'CRITICAL', type: 'Bearing Defect — ABD/TADS Rank 4 (S-6000 Level-1)', description: 'AAR S-6000 Level-1 indication at Hinton TADS (Edson Sub MP 80.2): Axle A2-Right bearing shows orange peel surface on cup running surface AND spalling area 2.1 in² (exceeds 1.5 in² mandatory removal threshold per S-6000 §3.1). TADS defect rank 4 — critical, immediate set-out required. Car pulled from L50150-04 at Walker Yard. Bearing replacement in progress.', detectedBy: 'TADS-EDS-080', location: 'Hinton, AB — Edson Sub MP 80.2', resolved: false, workOrderId: 'WO-2026-9401' },
    ],
  },

  // ── Car 30: CN Gondola — IN_TRANSIT, Kingston Sub, WIM overweight (axle load violation) ──
  {
    carNumber: 'CN 334812',
    reportingMark: 'CN',
    carType: 'Gondola',
    owner: 'CN',
    builtYear: 2012,
    capacity: 100,
    length: 52,
    hazmat: false,
    currentTrainId: 'Q11451-05',
    currentStatus: 'IN_TRANSIT',
    currentLocation: 'Kingston Sub MP 188.4',
    lastSeen: '2026-05-14 14:22',
    consistHistory: [
      { trainId: 'Q11451-05', date: '2026-05-14', position: 71, totalCars: 85, origin: 'MacMillan Yard', destination: 'Taschereau Yard', subdivision: 'Kingston', weight: 286000 },
      { trainId: 'Q11350-04', date: '2026-05-10', position: 68, totalCars: 92, origin: 'Taschereau Yard', destination: 'MacMillan Yard', subdivision: 'Kingston', weight: 284000 },
    ],
    waysideReadings: [
      { detectorId: 'WIM-KGS-050', detectorType: 'WIM', location: 'Cobourg, ON', milepost: 50.1, subdivision: 'Kingston', timestamp: '2026-05-14 12:10', reading: 'WIM ALERT — Gross weight 286,000 lbs (143 tons). Axle 3 load: 36.8 tons (exceeds 33-ton single-axle limit). Car owner notified. Proceed to next yard for weight verification.', status: 'ALERT', trainId: 'Q11451-05' },
      { detectorId: 'HBD-KGS-050', detectorType: 'HBD', location: 'Cobourg, ON', milepost: 50.1, subdivision: 'Kingston', timestamp: '2026-05-14 12:10', reading: 'All bearings normal — max 24°F above ambient', status: 'NORMAL', trainId: 'Q11451-05' },
      { detectorId: 'AEI-KGS-100', detectorType: 'AEI', location: 'Belleville, ON', milepost: 100.4, subdivision: 'Kingston', timestamp: '2026-05-14 12:58', reading: 'Tag read confirmed — CN 334812', status: 'NORMAL', trainId: 'Q11451-05' },
    ],
    defectFlags: [
      { flagId: 'DEF-2026-0601', date: '2026-05-14', severity: 'WARNING', type: 'Overweight — WIM Axle Load Violation', description: 'WIM alert at Cobourg (Kingston Sub MP 50.1): Axle B1-Left load 36.8 tons exceeds 33-ton single-axle limit. Gross weight 286,000 lbs. Car owner (CN) notified. Car to be weighed and adjusted at Taschereau Yard.', detectedBy: 'WIM-KGS-050', location: 'Cobourg, ON — Kingston Sub MP 50.1', resolved: false },
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

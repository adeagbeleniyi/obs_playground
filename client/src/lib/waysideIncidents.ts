// ─── Wayside-Derived Car Defect Incidents ────────────────────────────────────
// These incidents are automatically generated from ALARM/ALERT wayside readings
// in the car database. They surface on the Incidents page and link back to Car Search.

import { carDatabase } from './crewCarData';

export interface WaysideIncident {
  id: string;
  carNumber: string;
  reportingMark: string;
  detectorId: string;
  detectorType: 'HBD' | 'WILD' | 'DED' | 'AEI' | 'TADS' | 'WIM';
  reading: string;
  status: 'ALARM' | 'ALERT';
  severity: 'critical' | 'warning';
  location: string;
  milepost: number;
  subdivision: string;
  trainId: string;
  timestamp: string;
  defectFlagId?: string;
  workOrderId?: string;
  incidentStatus: 'open' | 'investigating' | 'resolved';
  assignedTo: string;
  title: string;
  description: string;
}

// Derive incidents from all ALARM/ALERT wayside readings across the car database
function deriveWaysideIncidents(): WaysideIncident[] {
  const incidents: WaysideIncident[] = [];

  carDatabase.forEach(car => {
    car.waysideReadings.forEach((reading, idx) => {
      if (reading.status === 'ALARM' || reading.status === 'ALERT') {
        // Find matching defect flag if any
        const matchingDefect = car.defectFlags.find(d =>
          d.detectedBy === reading.detectorId && !d.resolved
        );

        const isCritical = reading.status === 'ALARM';
        const detectorLabels: Record<string, string> = {
          HBD: 'Hot Box Detector',
          WILD: 'Wheel Impact Load Detector',
          DED: 'Dragging Equipment Detector',
          AEI: 'AEI Reader',
          TADS: 'Truck Alignment Detection System',
          WIM: 'Weigh-in-Motion',
        };

        const title = isCritical
          ? `${reading.detectorType} ALARM — ${car.carNumber} · ${reading.location}`
          : `${reading.detectorType} ALERT — ${car.carNumber} · ${reading.location}`;

        const description = `${detectorLabels[reading.detectorType]} triggered ${reading.status} on car ${car.carNumber} (${car.carType}, ${car.owner}) in train ${reading.trainId} at ${reading.location} (MP ${reading.milepost}, ${reading.subdivision} Sub). Reading: ${reading.reading}.${matchingDefect ? ` Defect flag ${matchingDefect.flagId} raised.` : ''}`;

        incidents.push({
          id: `WI-${car.carNumber.replace(' ', '')}-${reading.detectorId}-${idx}`,
          carNumber: car.carNumber,
          reportingMark: car.reportingMark,
          detectorId: reading.detectorId,
          detectorType: reading.detectorType,
          reading: reading.reading,
          status: reading.status,
          severity: isCritical ? 'critical' : 'warning',
          location: reading.location,
          milepost: reading.milepost,
          subdivision: reading.subdivision,
          trainId: reading.trainId,
          timestamp: reading.timestamp,
          defectFlagId: matchingDefect?.flagId,
          workOrderId: matchingDefect?.workOrderId,
          incidentStatus: isCritical ? 'investigating' : 'open',
          assignedTo: isCritical ? 'Mechanical — Car Dept' : 'Wayside Monitoring',
          title,
          description,
        });
      }
    });
  });

  // Sort: ALARM first, then ALERT, then by timestamp desc
  return incidents.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'ALARM' ? -1 : 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

export const waysideIncidents: WaysideIncident[] = deriveWaysideIncidents();

// Get all wayside incidents for a specific car number
export function getIncidentsForCar(carNumber: string): WaysideIncident[] {
  return waysideIncidents.filter(i => i.carNumber === carNumber);
}

// Get count of open wayside incidents
export function getOpenWaysideIncidentCount(): number {
  return waysideIncidents.filter(i => i.incidentStatus !== 'resolved').length;
}

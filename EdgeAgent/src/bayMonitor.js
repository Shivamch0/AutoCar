import { localEdgeBuffer } from './localBuffer.js';

export class BayMonitor {
  constructor(totalBays = 4) {
    this.totalBays = totalBays;
    this.bays = Array.from({ length: totalBays }, (_, i) => ({
      bayIndex: i + 1,
      isOccupied: i === 0, // 1 bay initially occupied
      vehiclePlate: i === 0 ? 'DEMO-SF01' : null,
      lastChanged: new Date().toISOString()
    }));
  }

  getOccupancy() {
    return this.bays.filter((b) => b.isOccupied).length;
  }

  getActiveBays() {
    return this.totalBays;
  }

  updateBayStatus(bayIndex, isOccupied, vehiclePlate = null, isManual = false) {
    const bay = this.bays.find((b) => b.bayIndex === bayIndex);
    if (!bay) {
      throw new Error(`Bay index ${bayIndex} not found (1-${this.totalBays})`);
    }

    const previousState = bay.isOccupied;
    bay.isOccupied = isOccupied;
    bay.vehiclePlate = isOccupied ? vehiclePlate || `CAR-${Math.floor(100 + Math.random() * 900)}` : null;
    bay.lastChanged = new Date().toISOString();

    const occupancy = this.getOccupancy();

    // Buffer the edge status event
    const event = localEdgeBuffer.recordEvent(
      isOccupied ? 'bay_occupied' : 'bay_cleared',
      {
        bayIndex,
        isOccupied,
        previousState,
        vehiclePlate: bay.vehiclePlate,
        currentOccupancy: occupancy,
        source: isManual ? 'manual_local_override' : 'iot_sensor_telemetry'
      }
    );

    return { bay, occupancy, event };
  }

  simulateRandomEvent() {
    // Pick random bay
    const randomIndex = Math.floor(Math.random() * this.totalBays) + 1;
    const targetBay = this.bays.find((b) => b.bayIndex === randomIndex);
    const newOccupiedState = !targetBay.isOccupied;

    return this.updateBayStatus(randomIndex, newOccupiedState, null, false);
  }

  getStatus() {
    return {
      totalBays: this.totalBays,
      activeBays: this.getActiveBays(),
      currentOccupancy: this.getOccupancy(),
      bays: this.bays
    };
  }
}

export const bayMonitor = new BayMonitor(4);


import { metricsService } from './metricsService.js';

export class CloudClient {
  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    this.fogSecret = process.env.FOG_SERVICE_SECRET || 'autonear_fog_shared_secret_token_xyz_2026';
    this.timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS || '4000', 10);
    this.isOnline = true;
    this.lastHealthCheck = null;
  }

  async checkCloudHealth() {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${this.backendUrl}/health`, {
        signal: controller.signal
      });
      clearTimeout(timer);

      this.isOnline = res.ok;
      this.lastHealthCheck = new Date().toISOString();
      return { online: res.ok, latencyMs: Date.now() - start };
    } catch (err) {
      this.isOnline = false;
      this.lastHealthCheck = new Date().toISOString();
      return { online: false, error: err.message };
    }
  }

  async fetchNearbyGarages(params = {}) {
    const url = new URL(`${this.backendUrl}/api/v1/garages/nearby`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.append(k, v);
      }
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    metricsService.recordBackendCall();

    try {
      const res = await fetch(url.toString(), {
        headers: {
          'x-fog-secret': this.fogSecret
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Backend responded with HTTP ${res.status}`);
      }

      this.isOnline = true;
      return await res.json();
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ECONNREFUSED') {
        this.isOnline = false;
      }
      throw err;
    }
  }

  async fetchGarageAvailability(garageId) {
    const url = `${this.backendUrl}/api/v1/garages/${garageId}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    metricsService.recordBackendCall();

    try {
      const res = await fetch(url, {
        headers: { 'x-fog-secret': this.fogSecret },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Garage availability lookup failed: HTTP ${res.status}`);
      }

      this.isOnline = true;
      return await res.json();
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ECONNREFUSED') {
        this.isOnline = false;
      }
      throw err;
    }
  }

  async forwardBooking(bookingPayload) {
    const url = `${this.backendUrl}/api/v1/bookings`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    metricsService.recordBackendCall();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fog-secret': this.fogSecret
        },
        body: JSON.stringify({
          ...bookingPayload,
          fogAssisted: true
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Backend booking rejection: ${res.status}`);
      }

      this.isOnline = true;
      return data;
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
        this.isOnline = false;
      }
      throw err;
    }
  }
}

export const cloudClient = new CloudClient();


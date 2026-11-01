# AutoNear Garage-Side Edge Agent

The Edge Agent is a lightweight, independent microservice designed to run on a garage computer, tablet, or Raspberry Pi.

## Features
- **Service-Bay Monitoring**: Tracks occupancy across active bays (e.g., 4 bays).
- **Simulated Sensor Telemetry**: Automatically generates simulated vehicle arrival/departure events so no physical hardware is needed for demonstrations.
- **Manual Local Override**: Supports manual toggling of individual bay states via local REST calls.
- **Offline Event Buffer**: Buffers events with sequential IDs, idempotency keys, and ISO timestamps during internet outages.
- **Cloud Synchronization & Conflict Resolution**: Syncs buffered updates with `/api/v1/edge/sync` on the Cloud Backend, applying Last-Write-Wins precedence.
- **No Independent Confirmation**: The Edge Agent cannot authoritatively confirm appointments without the central booking system.

## Endpoints
- `GET /health`: Agent health, cloud sync status, buffered event count.
- `GET /status`: Complete bay telemetry and buffer status.
- `POST /api/agent/bays/:index/toggle`: Manually toggle a service bay's occupancy state.
- `POST /api/agent/sync`: Manually trigger synchronization to the cloud.

## Configuration (.env)
```env
PORT=4200
GARAGE_ID=672000000000000000000001
EDGE_AGENT_ID=agent_sf_apex_01
BACKEND_URL=http://localhost:5000
EDGE_AGENT_SECRET=autonear_fog_shared_secret_token_xyz_2026
SIMULATION_ENABLED=true
SIMULATION_INTERVAL_MS=15000
SYNC_INTERVAL_MS=10000
```

## Running the Edge Agent
```bash
npm install
npm run dev   # Runs on http://localhost:4200
npm test      # Runs automated unit tests
```


# AutoNear Distributed System Architecture

## 1. System Topology Overview

AutoNear extends the standard MERN stack into a four-tier distributed computing topology designed for real-time auto care discovery, edge-accelerated queries, and high-concurrency booking integrity:

```
[ Tier 1: Client Edge (Browser) ]
    ├── Browser Geolocation API (Permission & fallback handling)
    ├── Leaflet + OpenStreetMap Tiles
    ├── Client-Edge Haversine Distance & Ranking Utility
    └── Session Storage TTL Cache
           │
           ├── (Direct Cloud Mode / Fallback)
           │
[ Tier 2: Regional Fog Node (Port 4100) ]
    ├── Regional In-Memory TTL Cache (LRU Eviction)
    ├── Discovery & Availability Acceleration
    ├── Durable Offline Pending Queue ("Awaiting confirmation")
    └── Cache Invalidation on Booking/Status Updates
           │
           ├── (Service Auth: FOG_SERVICE_SECRET)
           │
[ Tier 4: Authoritative Cloud Backend (Port 5000 / Vercel Serverless) ]
    ├── MongoDB with 2dsphere GeoJSON Indexing
    ├── Authoritative Concurrency & Capacity Enforcement
    ├── Modular Socket.IO Server & Event Broadcaster
    ├── Safe Mongoose Connection Reuse for Serverless (api/index.js)
    └── HTTP Polling Real-Time Fallback (Vercel Compatibility)
           │
           ▲ (Edge Sync: x-edge-secret)
           │
[ Tier 3: Garage-Side Edge Agent (Port 4200) ]
    ├── Service-Bay Occupancy Monitoring
    ├── Simulated IoT Sensor Telemetry & Manual Overrides
    ├── Offline FIFO Buffer with Sequence & Idempotency Keys
    └── Periodic Cloud Sync & Conflict Resolution
```

---

## 2. Tier Details & Responsibilities

### Tier 1: Client Edge (Browser Processing)
- **Role**: Execute fast, localized computations close to user actions.
- **Components**:
  - `src/edge/browserEdge.js`: Validates browser latitude/longitude coordinates, calculates great-circle distances via the Haversine formula, and performs instant client-side filtering and sorting of already-retrieved garage lists.
  - **Caching**: Local search results cached in client storage with a 3-minute TTL and staleness indicators.
  - **Limitation & Authority**: Client-edge processing reduces redundant network round-trips for UI updates, but never has authority to confirm bookings or bypass server-side validation.

### Tier 2: Regional Fog Node (`FogNode/` - Port 4100)
- **Role**: Intermediate regional microservice deployable on local dev machines, edge gateways, or a Raspberry Pi.
- **Components**:
  - `TTLCache`: Regional cache for nearby garage listings and bay availability with hit/miss metrics and pattern invalidation.
  - `PendingQueue`: Durable buffer for booking requests when the authoritative cloud backend is temporarily unreachable. Requests receive an explicit `Awaiting confirmation` status; the fog node never fakes a confirmation.
  - `CloudClient`: Service-to-service communication with cloud backend using pre-shared secret `FOG_SERVICE_SECRET`.

### Tier 3: Garage-Side Edge Agent (`EdgeAgent/` - Port 4200)
- **Role**: Station-level agent operating at participating service garages.
- **Components**:
  - `BayMonitor`: Tracks real-time bay occupancy (e.g. 4 bays). Default configuration simulates sensor telemetry without requiring physical hardware.
  - `LocalBuffer`: Stores events with sequence numbers, timestamps, and UUIDs while the station is offline.
  - `CloudSyncService`: Automatically pushes buffered events to `/api/v1/edge/sync` when internet is restored, applying Last-Write-Wins timestamp conflict resolution.

### Tier 4: Authoritative Cloud Backend & Database
- **Role**: The single source of truth for all bookings, capacities, user authentication, and garage registry.
- **MongoDB Geospatial Indexing**:
  - Garages store locations as GeoJSON Points: `{ type: "Point", coordinates: [longitude, latitude] }`.
  - Indexed with `garageSchema.index({ location: '2dsphere' })`.
  - Queries use the MongoDB `$geoNear` aggregation pipeline to calculate exact distances in meters, filter by service categories, and enforce maximum search radii.
- **Authoritative Booking Enforcement**:
  - Verifies slot capacity: `activeBookingsCount < activeBays`.
  - Evaluates idempotency keys to prevent duplicate booking creation.
  - Emits real-time events via Socket.IO **only after** MongoDB write operations succeed.

---

## 3. Real-Time Architecture & Vercel Serverless Strategy

### The Challenge of WebSockets in Serverless Functions
Vercel serverless functions are ephemeral: invocations spin up to handle an incoming HTTP request and freeze or terminate shortly thereafter. Persistent TCP WebSocket connections (like standard Socket.IO) cannot stay continuously open inside a serverless runtime without a dedicated external gateway.

### AutoNear Dual Real-Time Strategy:
1. **Persistent Node.js Host Mode**:
   - `Backend/src/server.js` initializes `http.createServer(app)` and attaches `initSocketServer(server)`.
   - Handshake verifies JWT access tokens and assigns clients to authorized role rooms: `user_${userId}`, `garage_${garageId}`, and `admin_room`.
   - Live events emitted:
     - `booking:created`
     - `booking:updated`
     - `booking:cancelled`
     - `garage:availabilityUpdated`
     - `notification:new`
     - `fog:statusUpdated`

2. **Vercel Serverless Mode & Polling Fallback**:
   - When deployed to Vercel, the frontend's `socketClient.js` detects that the persistent WebSocket handshake is unavailable.
   - The client seamlessly switches to `transportMode = 'polling'`, running short-interval (10s) polling against `/api/v1/notifications` and `/api/v1/bookings/my`.
   - The UI displays an amber `Polling Fallback (Serverless)` badge so developers and users clearly understand the active transport.
   - If an external persistent Socket.IO server is configured (e.g. on Railway, Render, or a VPS), setting `VITE_SOCKET_URL` automatically enables full WebSocket mode.

---

## 4. Vercel Serverless Backend Entry Point (`Backend/api/index.js`)

To ensure smooth serverless operation on Vercel without duplicate HTTP listeners or cold start connection spikes:
- `Backend/src/server.js` is preserved strictly for local persistent development.
- `Backend/api/index.js` exports a serverless handler function:
  ```javascript
  export default async function handler(req, res) {
    await connectDB(); // Reuses global.mongoose connection promise
    return app(req, res); // Handles request without calling app.listen()
  }
  ```
- `Backend/src/config/db.js` uses connection caching (`global.mongoose = { conn: null, promise: null }`) to avoid opening new MongoDB Atlas connections on every serverless invocation.


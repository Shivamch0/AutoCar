# AutoNear Independent Regional Fog Node

The Fog Node is an independent Node.js service designed to deploy at regional points of presence (e.g. edge gateways, regional data centers, or a Raspberry Pi on the local garage network).

## Responsibilities
- **Regional Garage Discovery**: Proxies geospatial search queries, serving frequent regional requests from an in-memory TTL cache with LRU eviction.
- **Availability Acceleration**: Caches real-time bay availability and status with a short TTL (15–60 seconds).
- **Authoritative Booking Forwarder**: Validates booking requests, checks local cache for fast-fail conditions, and forwards requests to the authoritative Cloud Backend using `FOG_SERVICE_SECRET`.
- **Durable Offline Pending Queue**: When cloud connectivity drops, records bookings as `Awaiting confirmation` in a durable queue, retrying and synchronizing automatically once backend connectivity is restored.
- **Metrics & Health**: Exposes high-resolution request timing, cache hit rates, P95 latencies, and node health.

## Endpoints
- `GET /health`: Node status, cloud backend connectivity, queue depth.
- `GET /metrics`: Response time averages, percentiles, cache hit rate, and request volume.
- `GET /api/fog/garages/nearby`: Regional garage discovery with spatial cache quantization.
- `GET /api/fog/garages/:id/availability`: Garage availability caching.
- `POST /api/fog/bookings`: Authoritative forwarder with offline queue fallback.
- `POST /api/fog/cache/invalidate`: Clears specific keys or pattern prefixes (e.g., `nearby:*`).
- `GET /api/fog/queue`: Inspects buffered offline bookings awaiting cloud confirmation.
- `POST /api/fog/queue/process`: Manually triggers synchronization of offline queue.

## Configuration (.env)
```env
PORT=4100
BACKEND_URL=http://localhost:5000
FOG_SERVICE_SECRET=autonear_fog_shared_secret_token_xyz_2026
CACHE_TTL_SECONDS=60
REQUEST_TIMEOUT_MS=4000
FOG_REGION_ID=us-west-bayarea-node-01
FOG_REGION_NAME=US West Bay Area Edge Zone
```

## Running the Fog Node
```bash
npm install
npm run dev   # Runs on http://localhost:4100
npm test      # Runs automated unit tests
```


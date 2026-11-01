# AutoNear Benchmark Methodology & Scientific Performance Evaluation

## 1. Objectives

This evaluation framework empirically compares end-to-end response times, server resource load, network volume, and resilience across three architectural operating modes for the AutoNear application:

1. **Mode A (Cloud-Only)**: The client issues repeated geospatial discovery queries directly to the central Express API (`/api/v1/garages/nearby`), executing a full network roundtrip and MongoDB `$geoNear` aggregation.
2. **Mode B (Fog-Assisted)**: The client routes discovery queries through an independent regional Fog Node (`/api/fog/garages/nearby` on Port 4100). The Fog Node manages an in-memory TTL cache with LRU eviction and coordinates with the authoritative cloud backend on cache misses or invalidations.
3. **Mode C (Client-Edge Filtering)**: The client evaluates distance calculations and sorts a previously retrieved dataset locally in browser memory (`src/edge/browserEdge.js`), avoiding network roundtrips altogether for UI adjustments and filters.

---

## 2. Metrics Collected & Evaluation Rules

| Metric | Measurement Technique | Significance |
| :--- | :--- | :--- |
| **Average Response Time (ms)** | Client-side `performance.now()` deltas across $N$ iterations | Macro-level responsiveness |
| **Median Latency (ms)** | 50th percentile of sorted trial timings | Robust central tendency resistant to network outliers |
| **P95 Latency (ms)** | 95th percentile of sorted trial timings | Worst-case user experience under load/tail latency |
| **Cache Hit Rate (%)** | Ratio of cache hits to total requests ($H / (H + M) \times 100$) | Effectiveness of regional caching |
| **Authoritative Backend Requests** | Total requests forwarded to MongoDB/Cloud Backend | Cloud infrastructure cost and ingress traffic relief |
| **Error Rate (%)** | Proportion of HTTP status codes $\ge 400$ or failed fetches | Availability and network reliability |
| **Booking Success Rate (%)** | Confirmed bookings / total booking attempts | Concurrency and capacity enforcement |
| **Duplicate Booking Prevention** | Parallel submissions with identical `idempotencyKey` | Verification of double-spend & duplicate prevention |

---

## 3. Experimental Controls & Nuance

> [!IMPORTANT]
> **No Universal Superiority Assumption**: Fog computing introduces an intermediate network hop. When a Fog Node experiences a cache miss, total latency is $T_{\text{client}\to\text{fog}} + T_{\text{fog}\to\text{cloud}} + T_{\text{cloud}\to\text{fog}} + T_{\text{fog}\to\text{client}}$, which is strictly greater than direct cloud communication. Fog assistance excels in high-density regional re-queries where cache hit rates exceed 70%, drastically reducing cloud egress costs and database CPU cycles.

### Distinguishing Timings
- **End-to-End Browser Latency**: Measured from the moment `fetch()` is initiated in the browser until JSON parsing completes.
- **Server-Side Processing Time**: Computed inside Fog controllers and Backend logs via high-resolution timers (`Date.now()` or `process.hrtime.bigint()`).

---

## 4. Reproducing the Benchmark

1. Start all three services locally:
   ```bash
   # Terminal 1 - Cloud Backend
   cd Backend && npm run dev

   # Terminal 2 - Regional Fog Node
   cd FogNode && npm run dev

   # Terminal 3 - Frontend Application
   cd Frontend && npm run dev
   ```
2. Navigate to `http://localhost:5173` and click the **Fog vs Edge Benchmark** tab.
3. Select an iteration count (e.g., 10 or 20 trials).
4. Click **Run Benchmark**. The test runner sequentially executes Mode A, Mode B, and Mode C, displaying real-time metrics, percentiles, and comparison bar charts.
5. Click **Test Concurrency** to issue 5 simultaneous parallel bookings with identical idempotency keys to observe central capacity deduplication.


/**
 * Metrics Collector for Fog Node: tracks response times, percentiles, cache hit rates, and cloud forward counts.
 */
class MetricsService {
  constructor() {
    this.reset();
  }

  reset() {
    this.durations = [];
    this.backendCalls = 0;
    this.fogCacheHits = 0;
    this.fogCacheMisses = 0;
    this.errors = 0;
    this.totalRequests = 0;
    this.bookingForwardAttempts = 0;
    this.bookingSuccessCount = 0;
    this.bookingOfflineQueued = 0;
    this.startTime = Date.now();
  }

  recordRequest(durationMs, wasCacheHit = false, isError = false) {
    this.totalRequests++;
    this.durations.push(durationMs);

    // Limit memory footprint of durations array
    if (this.durations.length > 5000) {
      this.durations.splice(0, 1000);
    }

    if (wasCacheHit) {
      this.fogCacheHits++;
    } else {
      this.fogCacheMisses++;
    }

    if (isError) {
      this.errors++;
    }
  }

  recordBackendCall() {
    this.backendCalls++;
  }

  recordBookingAttempt(status) {
    this.bookingForwardAttempts++;
    if (status === 'confirmed') {
      this.bookingSuccessCount++;
    } else if (status === 'queued') {
      this.bookingOfflineQueued++;
    }
  }

  getMetrics() {
    const count = this.durations.length;
    if (count === 0) {
      return {
        totalRequests: this.totalRequests,
        averageDurationMs: 0,
        medianDurationMs: 0,
        p95DurationMs: 0,
        cacheHitRatePercent: 0,
        backendCalls: this.backendCalls,
        errors: this.errors,
        errorRatePercent: 0,
        bookings: {
          attempts: this.bookingForwardAttempts,
          confirmed: this.bookingSuccessCount,
          queuedOffline: this.bookingOfflineQueued
        },
        uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000)
      };
    }

    const sorted = [...this.durations].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const avg = sum / count;

    const median =
      count % 2 === 0
        ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
        : sorted[Math.floor(count / 2)];

    const p95Index = Math.min(count - 1, Math.floor(count * 0.95));
    const p95 = sorted[p95Index];

    const totalCacheRequests = this.fogCacheHits + this.fogCacheMisses;
    const hitRate = totalCacheRequests > 0 ? (this.fogCacheHits / totalCacheRequests) * 100 : 0;
    const errorRate = this.totalRequests > 0 ? (this.errors / this.totalRequests) * 100 : 0;

    return {
      totalRequests: this.totalRequests,
      sampleCount: count,
      averageDurationMs: Math.round(avg * 100) / 100,
      medianDurationMs: Math.round(median * 100) / 100,
      p95DurationMs: Math.round(p95 * 100) / 100,
      cacheHitRatePercent: Math.round(hitRate * 10) / 10,
      cacheHits: this.fogCacheHits,
      cacheMisses: this.fogCacheMisses,
      backendCalls: this.backendCalls,
      errors: this.errors,
      errorRatePercent: Math.round(errorRate * 10) / 10,
      bookings: {
        attempts: this.bookingForwardAttempts,
        confirmed: this.bookingSuccessCount,
        queuedOffline: this.bookingOfflineQueued
      },
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }
}

export const metricsService = new MetricsService();


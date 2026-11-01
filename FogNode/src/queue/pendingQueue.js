/**
 * Durable in-memory queue for offline booking requests when authoritative Cloud Backend is unreachable.
 */
export class PendingQueue {
  constructor() {
    this.queue = [];
    this.processedLog = [];
  }

  enqueue(bookingPayload) {
    const queueItem = {
      queueId: `PQ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      bookingPayload,
      queuedAt: new Date().toISOString(),
      status: 'Awaiting confirmation',
      attempts: 0,
      lastError: null
    };

    this.queue.push(queueItem);
    return queueItem;
  }

  getAll() {
    return [...this.queue];
  }

  getProcessed() {
    return [...this.processedLog.slice(-50)];
  }

  count() {
    return this.queue.length;
  }

  async processNext(cloudSyncFn) {
    if (this.queue.length === 0) return null;

    const item = this.queue[0];
    item.attempts++;

    try {
      const result = await cloudSyncFn(item.bookingPayload);
      // Success! Remove from pending and move to processed log
      this.queue.shift();
      this.processedLog.push({
        ...item,
        status: 'Confirmed by Cloud Backend',
        completedAt: new Date().toISOString(),
        cloudResult: result
      });
      return { success: true, item, result };
    } catch (err) {
      item.lastError = err.message || 'Cloud sync failed';
      // If exhausted attempts, keep in queue or log error
      console.warn(`[Fog Queue] Retry attempt ${item.attempts} failed for item ${item.queueId}:`, err.message);
      return { success: false, item, error: err.message };
    }
  }
}

export const pendingBookingQueue = new PendingQueue();


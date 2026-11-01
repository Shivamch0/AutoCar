/**
 * Local offline buffer for edge sensor events.
 * Uses sequence numbers, timestamps, and idempotency keys for reliable sync and conflict resolution.
 */
export class LocalBuffer {
  constructor(maxBufferSize = 500) {
    this.events = [];
    this.sequence = 0;
    this.maxBufferSize = maxBufferSize;
  }

  recordEvent(eventType, payload = {}) {
    this.sequence++;
    const event = {
      eventId: `EV-${Date.now()}-${this.sequence}-${Math.random().toString(36).substring(2, 6)}`,
      sequence: this.sequence,
      timestamp: new Date().toISOString(),
      eventType,
      ...payload
    };

    if (this.events.length >= this.maxBufferSize) {
      this.events.shift(); // Evict oldest if buffer overflow
    }

    this.events.push(event);
    return event;
  }

  getPendingEvents() {
    return [...this.events];
  }

  clearSynced(upToSequence) {
    this.events = this.events.filter((e) => e.sequence > upToSequence);
  }

  count() {
    return this.events.length;
  }
}

export const localEdgeBuffer = new LocalBuffer();


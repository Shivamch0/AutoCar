import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TTLCache } from '../src/cache/ttlCache.js';
import { PendingQueue } from '../src/queue/pendingQueue.js';

describe('AutoNear Fog Node TTL Cache', () => {
  test('sets and gets items correctly', () => {
    const cache = new TTLCache(10, 10);
    cache.set('key1', { message: 'hello' });
    const val = cache.get('key1');
    assert.deepStrictEqual(val, { message: 'hello' });
  });

  test('records cache hits and misses', () => {
    const cache = new TTLCache(10, 10);
    cache.get('nonexistent'); // miss
    cache.set('hitKey', 123);
    cache.get('hitKey'); // hit

    const stats = cache.getStats();
    assert.strictEqual(stats.metrics.hits, 1);
    assert.strictEqual(stats.metrics.misses, 1);
    assert.strictEqual(stats.metrics.hitRatePercent, 50);
  });

  test('invalidates by key and pattern', () => {
    const cache = new TTLCache(10, 10);
    cache.set('nearby:37:122', { data: 1 });
    cache.set('nearby:38:122', { data: 2 });
    cache.set('other:key', { data: 3 });

    const invalidated = cache.invalidatePattern('nearby:');
    assert.strictEqual(invalidated, 2);
    assert.strictEqual(cache.get('nearby:37:122'), null);
    assert.deepStrictEqual(cache.get('other:key'), { data: 3 });
  });
});

describe('AutoNear Fog Node Pending Queue', () => {
  test('enqueues pending booking with Awaiting confirmation status', () => {
    const queue = new PendingQueue();
    const item = queue.enqueue({
      garageId: 'g123',
      service: { name: 'Oil Change', price: 50 },
      scheduledTime: new Date().toISOString()
    });

    assert.strictEqual(queue.count(), 1);
    assert.strictEqual(item.status, 'Awaiting confirmation');
    assert.ok(item.queueId.startsWith('PQ-'));
  });

  test('processes next queued item with sync function', async () => {
    const queue = new PendingQueue();
    queue.enqueue({ test: true });

    let synced = false;
    const syncFn = async (payload) => {
      synced = true;
      return { success: true, bookingNumber: 'BK-TEST-123' };
    };

    const res = await queue.processNext(syncFn);
    assert.strictEqual(synced, true);
    assert.strictEqual(res.success, true);
    assert.strictEqual(queue.count(), 0);
    assert.strictEqual(queue.getProcessed().length, 1);
  });
});


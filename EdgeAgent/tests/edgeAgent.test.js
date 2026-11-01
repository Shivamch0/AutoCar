import { test, describe } from 'node:test';
import assert from 'node:assert';
import { LocalBuffer } from '../src/localBuffer.js';
import { BayMonitor } from '../src/bayMonitor.js';

describe('AutoNear Edge Agent - Local Event Buffer', () => {
  test('records events with incremental sequence numbers and timestamps', () => {
    const buffer = new LocalBuffer();
    const ev1 = buffer.recordEvent('bay_occupied', { bayIndex: 1 });
    const ev2 = buffer.recordEvent('bay_cleared', { bayIndex: 1 });

    assert.strictEqual(buffer.count(), 2);
    assert.strictEqual(ev1.sequence, 1);
    assert.strictEqual(ev2.sequence, 2);
    assert.ok(ev1.eventId.startsWith('EV-'));
    assert.ok(ev1.timestamp);
  });

  test('clears synced events up to specified sequence', () => {
    const buffer = new LocalBuffer();
    buffer.recordEvent('e1');
    buffer.recordEvent('e2');
    buffer.recordEvent('e3');

    assert.strictEqual(buffer.count(), 3);
    buffer.clearSynced(2);
    assert.strictEqual(buffer.count(), 1);
    assert.strictEqual(buffer.getPendingEvents()[0].sequence, 3);
  });
});

describe('AutoNear Edge Agent - Bay Monitor', () => {
  test('initializes with default bays and updates occupancy accurately', () => {
    const monitor = new BayMonitor(4);
    assert.strictEqual(monitor.totalBays, 4);

    const update = monitor.updateBayStatus(2, true, 'TEST-PLATE-1');
    assert.strictEqual(update.bay.isOccupied, true);
    assert.strictEqual(update.bay.vehiclePlate, 'TEST-PLATE-1');
    assert.ok(monitor.getOccupancy() >= 1);
  });

  test('rejects invalid bay index', () => {
    const monitor = new BayMonitor(4);
    assert.throws(() => {
      monitor.updateBayStatus(99, true);
    }, /not found/);
  });
});


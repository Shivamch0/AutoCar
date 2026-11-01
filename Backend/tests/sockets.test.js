import { test, describe } from 'node:test';
import assert from 'node:assert';
import { SOCKET_EVENTS } from '../src/config/constants.js';

describe('AutoNear Socket.IO Event Structure', () => {
  test('all required socket events are defined and follow standard naming', () => {
    assert.strictEqual(SOCKET_EVENTS.BOOKING_CREATED, 'booking:created');
    assert.strictEqual(SOCKET_EVENTS.BOOKING_UPDATED, 'booking:updated');
    assert.strictEqual(SOCKET_EVENTS.BOOKING_CANCELLED, 'booking:cancelled');
    assert.strictEqual(SOCKET_EVENTS.GARAGE_AVAILABILITY_UPDATED, 'garage:availabilityUpdated');
    assert.strictEqual(SOCKET_EVENTS.NOTIFICATION_NEW, 'notification:new');
    assert.strictEqual(SOCKET_EVENTS.FOG_STATUS_UPDATED, 'fog:statusUpdated');
  });
});


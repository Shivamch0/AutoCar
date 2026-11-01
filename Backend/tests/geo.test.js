import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  isValidCoordinate,
  calculateHaversineDistanceKm,
  kmToMeters,
  metersToKm
} from '../src/utils/geoUtils.js';

describe('AutoNear Geospatial & Haversine Utilities', () => {
  test('isValidCoordinate returns true for valid coordinates', () => {
    assert.strictEqual(isValidCoordinate(-122.3982, 37.7901), true);
    assert.strictEqual(isValidCoordinate(0, 0), true);
    assert.strictEqual(isValidCoordinate(-180, -90), true);
    assert.strictEqual(isValidCoordinate(180, 90), true);
  });

  test('isValidCoordinate rejects invalid coordinates', () => {
    assert.strictEqual(isValidCoordinate(181, 45), false);
    assert.strictEqual(isValidCoordinate(-120, 95), false);
    assert.strictEqual(isValidCoordinate('abc', 45), false);
    assert.strictEqual(isValidCoordinate(NaN, 45), false);
  });

  test('calculateHaversineDistanceKm computes accurate great-circle distance', () => {
    // San Francisco (37.7749, -122.4194) to Oakland (37.8044, -122.2712) ~ 13.5 km
    const dist = calculateHaversineDistanceKm(37.7749, -122.4194, 37.8044, -122.2712);
    assert.ok(dist > 12 && dist < 15, `Expected ~13.5 km, got ${dist}`);

    // Distance to same point is 0
    const zeroDist = calculateHaversineDistanceKm(37.7749, -122.4194, 37.7749, -122.4194);
    assert.strictEqual(zeroDist, 0);
  });

  test('kmToMeters and metersToKm convert correctly', () => {
    assert.strictEqual(kmToMeters(1.5), 1500);
    assert.strictEqual(metersToKm(1500), 1.5);
    assert.strictEqual(metersToKm(2345), 2.35);
  });
});


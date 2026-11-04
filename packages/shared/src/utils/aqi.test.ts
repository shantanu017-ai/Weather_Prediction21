import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateSubIndex,
  getAQICategory,
  calculateOverallAQI
} from './aqi';
import { AQICategory } from '../constants/cpcb';

describe('CPCB NAQI Sub-Index Calculations', () => {
  it('should accurately calculate PM2.5 sub-index across breakpoints', () => {
    // Breakpoint: 0-30 -> 0-50
    assert.strictEqual(calculateSubIndex('pm25', 15), 25);
    assert.strictEqual(calculateSubIndex('pm25', 30), 50);

    // Breakpoint: 31-60 -> 51-100
    assert.strictEqual(calculateSubIndex('pm25', 60), 100);

    // Breakpoint: 61-90 -> 101-200
    assert.strictEqual(calculateSubIndex('pm25', 75), 149);

    // Breakpoint: 91-120 -> 201-300
    assert.strictEqual(calculateSubIndex('pm25', 120), 300);

    // Breakpoint: 121-250 -> 301-400
    assert.strictEqual(calculateSubIndex('pm25', 250), 400);

    // Severe: > 250
    assert.strictEqual(calculateSubIndex('pm25', 350), 440);
  });

  it('should accurately calculate PM10 sub-index', () => {
    // 0-50 -> 0-50
    assert.strictEqual(calculateSubIndex('pm10', 50), 50);
    // 51-100 -> 51-100
    assert.strictEqual(calculateSubIndex('pm10', 100), 100);
    // 101-250 -> 101-200
    assert.strictEqual(calculateSubIndex('pm10', 175), 150);
  });

  it('should return null for null, undefined, or negative concentrations', () => {
    assert.strictEqual(calculateSubIndex('pm25', null), null);
    assert.strictEqual(calculateSubIndex('pm25', undefined), null);
    assert.strictEqual(calculateSubIndex('pm25', -10), null);
  });

  it('should map AQI values to official CPCB categories', () => {
    assert.strictEqual(getAQICategory(35), AQICategory.GOOD);
    assert.strictEqual(getAQICategory(75), AQICategory.SATISFACTORY);
    assert.strictEqual(getAQICategory(150), AQICategory.MODERATE);
    assert.strictEqual(getAQICategory(250), AQICategory.POOR);
    assert.strictEqual(getAQICategory(350), AQICategory.VERY_POOR);
    assert.strictEqual(getAQICategory(450), AQICategory.SEVERE);
  });

  it('should calculate overall AQI and identify dominant pollutant', () => {
    const result = calculateOverallAQI({
      pm25: 75, // sub-index approx 149
      pm10: 95, // sub-index 95
      no2: 30,  // sub-index approx 38
      so2: 12   // sub-index approx 15
    });

    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.dominantPollutant, 'PM25');
    assert.strictEqual(result.category, AQICategory.MODERATE);
    assert.strictEqual(result.aqi, 149);
  });

  it('should handle edge case: only single pollutant provided', () => {
    const result = calculateOverallAQI({
      pm25: 45
    });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.dominantPollutant, 'PM25');
    assert.ok(result.reason?.includes('partial pollutant coverage'));
  });

  it('should handle edge case: empty object provided', () => {
    const result = calculateOverallAQI({});
    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.aqi, null);
  });
});

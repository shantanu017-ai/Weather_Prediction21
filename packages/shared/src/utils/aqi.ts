import { AQICategory, CPCB_BREAKPOINTS, BreakpointRange } from '../constants/cpcb';

/**
 * Calculates a single pollutant's sub-index using CPCB formula:
 * Ip = Ilow + ((Ihigh - Ilow) / (Bhigh - Blow)) * (Cp - Blow)
 */
export function calculateSubIndex(pollutant: string, concentration: number | null | undefined): number | null {
  if (concentration === null || concentration === undefined || isNaN(concentration) || concentration < 0) {
    return null;
  }

  const ranges = CPCB_BREAKPOINTS[pollutant.toLowerCase()];
  if (!ranges) return null;

  for (const range of ranges) {
    if (concentration >= range.bLow && concentration <= range.bHigh) {
      const subIndex = range.iLow + ((range.iHigh - range.iLow) / (range.bHigh - range.bLow)) * (concentration - range.bLow);
      return Math.round(subIndex);
    }
  }

  // If concentration exceeds the highest breakpoint:
  const lastRange = ranges[ranges.length - 1];
  if (concentration > lastRange.bHigh) {
    return 500;
  }

  return 0;
}

/**
 * Maps an AQI value to its official CPCB category
 */
export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) return AQICategory.GOOD;
  if (aqi <= 100) return AQICategory.SATISFACTORY;
  if (aqi <= 200) return AQICategory.MODERATE;
  if (aqi <= 300) return AQICategory.POOR;
  if (aqi <= 400) return AQICategory.VERY_POOR;
  return AQICategory.SEVERE;
}

export interface AQICalculationResult {
  aqi: number | null;
  category: AQICategory | null;
  dominantPollutant: string | null;
  subIndices: Record<string, number>;
  isValid: boolean;
  reason?: string;
}

/**
 * Calculates overall CPCB AQI from a dict of pollutant concentrations.
 * CPCB rule:
 * - At least 3 pollutants must be monitored.
 * - At least one of PM2.5 or PM10 must be monitored.
 * - Overall AQI is the maximum of the sub-indices.
 */
export function calculateOverallAQI(pollutants: {
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  o3?: number | null;
}): AQICalculationResult {
  const subIndices: Record<string, number> = {};
  let validCount = 0;
  let hasParticulate = false;

  for (const [key, value] of Object.entries(pollutants)) {
    if (value !== undefined && value !== null && !isNaN(value)) {
      const subIdx = calculateSubIndex(key, value);
      if (subIdx !== null) {
        subIndices[key] = subIdx;
        validCount++;
        if (key.toLowerCase() === 'pm25' || key.toLowerCase() === 'pm10') {
          hasParticulate = true;
        }
      }
    }
  }

  if (validCount < 1) {
    return {
      aqi: null,
      category: null,
      dominantPollutant: null,
      subIndices,
      isValid: false,
      reason: 'No valid pollutant measurements provided'
    };
  }

  // Find maximum sub-index
  let maxAQI = -1;
  let dominant: string | null = null;

  for (const [key, val] of Object.entries(subIndices)) {
    if (val > maxAQI) {
      maxAQI = val;
      dominant = key.toUpperCase();
    }
  }

  // Strict CPCB criteria: 3 pollutants + at least 1 particulate.
  // For lenient fallback when sensors are sparse, report estimated AQI with note.
  const meetsStrictCPCB = validCount >= 3 && hasParticulate;

  return {
    aqi: maxAQI,
    category: getAQICategory(maxAQI),
    dominantPollutant: dominant,
    subIndices,
    isValid: true,
    reason: meetsStrictCPCB ? undefined : 'Calculated with partial pollutant coverage (lenient)'
  };
}

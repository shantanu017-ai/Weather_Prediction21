export enum AQICategory {
  GOOD = 'Good',
  SATISFACTORY = 'Satisfactory',
  MODERATE = 'Moderate',
  POOR = 'Poor',
  VERY_POOR = 'Very Poor',
  SEVERE = 'Severe'
}

export interface BreakpointRange {
  bLow: number;
  bHigh: number;
  iLow: number;
  iHigh: number;
}

export const CPCB_BREAKPOINTS: Record<string, BreakpointRange[]> = {
  pm25: [
    { bLow: 0, bHigh: 30, iLow: 0, iHigh: 50 },
    { bLow: 31, bHigh: 60, iLow: 51, iHigh: 100 },
    { bLow: 61, bHigh: 90, iLow: 101, iHigh: 200 },
    { bLow: 91, bHigh: 120, iLow: 201, iHigh: 300 },
    { bLow: 121, bHigh: 250, iLow: 301, iHigh: 400 },
    { bLow: 251, bHigh: 500, iLow: 401, iHigh: 500 }
  ],
  pm10: [
    { bLow: 0, bHigh: 50, iLow: 0, iHigh: 50 },
    { bLow: 51, bHigh: 100, iLow: 51, iHigh: 100 },
    { bLow: 101, bHigh: 250, iLow: 101, iHigh: 200 },
    { bLow: 251, bHigh: 350, iLow: 201, iHigh: 300 },
    { bLow: 351, bHigh: 430, iLow: 301, iHigh: 400 },
    { bLow: 431, bHigh: 600, iLow: 401, iHigh: 500 }
  ],
  no2: [
    { bLow: 0, bHigh: 40, iLow: 0, iHigh: 50 },
    { bLow: 41, bHigh: 80, iLow: 51, iHigh: 100 },
    { bLow: 81, bHigh: 180, iLow: 101, iHigh: 200 },
    { bLow: 181, bHigh: 280, iLow: 201, iHigh: 300 },
    { bLow: 281, bHigh: 400, iLow: 301, iHigh: 400 },
    { bLow: 401, bHigh: 800, iLow: 401, iHigh: 500 }
  ],
  so2: [
    { bLow: 0, bHigh: 40, iLow: 0, iHigh: 50 },
    { bLow: 41, bHigh: 80, iLow: 51, iHigh: 100 },
    { bLow: 81, bHigh: 380, iLow: 101, iHigh: 200 },
    { bLow: 381, bHigh: 800, iLow: 201, iHigh: 300 },
    { bLow: 801, bHigh: 1600, iLow: 301, iHigh: 400 },
    { bLow: 1601, bHigh: 2400, iLow: 401, iHigh: 500 }
  ],
  co: [
    { bLow: 0.0, bHigh: 1.0, iLow: 0, iHigh: 50 },
    { bLow: 1.1, bHigh: 2.0, iLow: 51, iHigh: 100 },
    { bLow: 2.1, bHigh: 10.0, iLow: 101, iHigh: 200 },
    { bLow: 10.1, bHigh: 17.0, iLow: 201, iHigh: 300 },
    { bLow: 17.1, bHigh: 34.0, iLow: 301, iHigh: 400 },
    { bLow: 34.1, bHigh: 50.0, iLow: 401, iHigh: 500 }
  ],
  o3: [
    { bLow: 0, bHigh: 50, iLow: 0, iHigh: 50 },
    { bLow: 51, bHigh: 100, iLow: 51, iHigh: 100 },
    { bLow: 101, bHigh: 168, iLow: 101, iHigh: 200 },
    { bLow: 169, bHigh: 208, iLow: 201, iHigh: 300 },
    { bLow: 209, bHigh: 748, iLow: 301, iHigh: 400 },
    { bLow: 749, bHigh: 1000, iLow: 401, iHigh: 500 }
  ]
};

export const AQI_COLOR_MAP: Record<AQICategory, { bg: string; text: string; hex: string }> = {
  [AQICategory.GOOD]: { bg: 'bg-emerald-500', text: 'text-emerald-500', hex: '#10b981' },
  [AQICategory.SATISFACTORY]: { bg: 'bg-green-500', text: 'text-green-500', hex: '#22c55e' },
  [AQICategory.MODERATE]: { bg: 'bg-yellow-500', text: 'text-yellow-500', hex: '#eab308' },
  [AQICategory.POOR]: { bg: 'bg-orange-500', text: 'text-orange-500', hex: '#f97316' },
  [AQICategory.VERY_POOR]: { bg: 'bg-red-500', text: 'text-red-500', hex: '#ef4444' },
  [AQICategory.SEVERE]: { bg: 'bg-rose-900', text: 'text-rose-900', hex: '#881337' }
};

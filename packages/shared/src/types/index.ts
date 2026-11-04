import { AQICategory } from '../constants/cpcb';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface MonitoringStation {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
  location: GeoLocation;
  elevation?: number;
  operator?: string;
  stationType?: string;
  isActive: boolean;
  latestMeasurement?: StationMeasurement;
}

export interface StationMeasurement {
  id?: string;
  stationId: string;
  recordedAt: string; // ISO 8601
  pm25?: number | null; // µg/m³
  pm10?: number | null; // µg/m³
  no2?: number | null;  // µg/m³
  so2?: number | null;  // µg/m³
  co?: number | null;   // mg/m³
  o3?: number | null;   // µg/m³
  aqi?: number | null;
  aqiCategory?: AQICategory | null;
  dominantPollutant?: string | null;
  subIndices?: Record<string, number>;
  sourceTag?: string;
}

export interface WeatherCondition {
  location: GeoLocation;
  recordedAt: string;
  temperature2m: number;       // °C
  relativeHumidity2m: number;   // %
  windSpeed10m: number;         // m/s
  windDirection10m: number;     // degrees (0-360)
  surfacePressure: number;      // hPa
  precipitation: number;        // mm
  boundaryLayerHeight?: number; // m
  source?: string;
}

export interface FireHotspot {
  id: string;
  latitude: number;
  longitude: number;
  acqDatetime: string;
  frp: number;                  // Fire Radiative Power (MW)
  confidence: string;           // 'low', 'nominal', 'high'
  satellite: string;            // 'VIIRS_SNPP', 'MODIS'
  daynight: string;
}

export interface SatelliteObservation {
  latitude: number;
  longitude: number;
  recordedAt: string;
  troposphericNO2?: number;     // mol/m²
  aod550nm?: number;            // Dimensionless AOD
  troposphericCO?: number;
  so2Column?: number;
  cloudFraction?: number;
}

export enum PollutionSourceType {
  TRAFFIC = 'Vehicular Traffic',
  INDUSTRIAL = 'Industrial Emissions',
  BIOMASS_BURNING = 'Crop Residue & Biomass Burning',
  DUST_CONSTRUCTION = 'Road & Construction Dust',
  OTHER = 'Other / Background Stagnation'
}

export interface SourceAttributionEvidence {
  metric: string;
  value: string | number;
  thresholdOrNorm: string;
  impact: 'High' | 'Moderate' | 'Low';
  description: string;
}

export interface SourceAttributionResult {
  location: GeoLocation;
  evaluatedAt: string;
  stationId?: string;
  stationName?: string;
  scores: {
    traffic: number;      // 0 - 100%
    industrial: number;   // 0 - 100%
    biomass: number;      // 0 - 100%
    dust: number;         // 0 - 100%
    other: number;        // 0 - 100%
  };
  dominantSource: PollutionSourceType;
  confidence: number;     // 0 - 100%
  evidence: SourceAttributionEvidence[];
  windContext: {
    speed: number;
    direction: number;
    ventilationFactor: 'Good' | 'Moderate' | 'Poor (Stagnant)';
  };
}

export interface PollutionHotspot {
  id: string;
  clusterId: number;
  centroid: GeoLocation;
  radiusMeters: number;
  avgPM25: number;
  avgPM10: number;
  avgAQI: number;
  severityLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  contributingStations: number;
  detectedAt: string;
  coordinatesPolygon?: [number, number][]; // Convex hull polygon coordinates [lat, lon]
}

export interface ForecastPoint {
  timestamp: string;
  pm25: number;
  pm10: number;
  aqi: number;
  aqiCategory: AQICategory;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface AirQualityForecast {
  stationId?: string;
  location: GeoLocation;
  generatedAt: string;
  horizonHours: number;
  forecast: ForecastPoint[];
}

export interface SystemFreshnessStatus {
  service: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastSyncTime: string;
  recordsCount?: number;
  mode: 'LIVE' | 'CACHED' | 'SAMPLE_BASELINE';
  message?: string;
}

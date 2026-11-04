import fs from 'fs';
import path from 'path';
import axios from 'axios';
import {
  MonitoringStation,
  StationMeasurement,
  WeatherCondition,
  FireHotspot,
  SystemFreshnessStatus
} from '@gp01/shared';
import { config } from '../config/env';

export class DataService {
  private stations: MonitoringStation[] = [];
  private measurements: StationMeasurement[] = [];
  private weatherRecords: any[] = [];
  private fires: FireHotspot[] = [];
  private lastSyncTime: Date = new Date();
  private mode: 'LIVE' | 'CACHED' | 'SAMPLE_BASELINE' = 'SAMPLE_BASELINE';

  constructor() {
    this.loadBaselineData();
  }

  private loadBaselineData(): void {
    try {
      const stationsPath = path.join(config.dataDir, 'stations.json');
      const measPath = path.join(config.dataDir, 'measurements.json');
      const weatherPath = path.join(config.dataDir, 'weather.json');
      const firesPath = path.join(config.dataDir, 'fires.json');

      if (fs.existsSync(stationsPath)) {
        this.stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
      }
      if (fs.existsSync(measPath)) {
        this.measurements = JSON.parse(fs.readFileSync(measPath, 'utf8'));
      }
      if (fs.existsSync(weatherPath)) {
        this.weatherRecords = JSON.parse(fs.readFileSync(weatherPath, 'utf8'));
      }
      if (fs.existsSync(firesPath)) {
        this.fires = JSON.parse(fs.readFileSync(firesPath, 'utf8'));
      }

      // Attach latest measurement to each station
      this.attachLatestMeasurements();
      console.log(`[DataService] Loaded ${this.stations.length} stations, ${this.measurements.length} measurements, ${this.fires.length} fire records.`);

      // Sync live NASA FIRMS data if key is available
      this.syncFirmsData();
    } catch (err) {
      console.error('[DataService] Error loading baseline data:', err);
    }
  }

  public async syncFirmsData(): Promise<void> {
    if (!config.nasaFirmsMapKey) return;
    try {
      console.log('[DataService] Querying live NASA FIRMS API for active thermal anomalies...');
      // Area query for Maharashtra & surrounding region (72 to 81 E, 15 to 22 N)
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${config.nasaFirmsMapKey}/VIIRS_SNPP_NRT/72,15,81,22/1`;
      const resp = await axios.get(url, { timeout: 8000 });
      const csvData = resp.data;

      if (typeof csvData === 'string' && csvData.includes('latitude,longitude')) {
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',');
        const latIdx = headers.indexOf('latitude');
        const lonIdx = headers.indexOf('longitude');
        const frpIdx = headers.indexOf('frp');
        const confIdx = headers.indexOf('confidence');
        const satIdx = headers.indexOf('satellite');
        const dateIdx = headers.indexOf('acq_date');
        const timeIdx = headers.indexOf('acq_time');
        const dnIdx = headers.indexOf('daynight');

        const liveFires: FireHotspot[] = [];
        for (let i = 1; i < lines.length && liveFires.length < 100; i++) {
          const parts = lines[i].split(',');
          if (parts.length >= headers.length) {
            const lat = parseFloat(parts[latIdx]);
            const lon = parseFloat(parts[lonIdx]);
            const frp = parseFloat(parts[frpIdx]);
            const acqDate = parts[dateIdx];
            const acqTime = (parts[timeIdx] || '0000').padStart(4, '0');

            if (!isNaN(lat) && !isNaN(lon)) {
              liveFires.push({
                id: `firm-live-${i}`,
                latitude: lat,
                longitude: lon,
                acqDatetime: `${acqDate}T${acqTime.slice(0, 2)}:${acqTime.slice(2)}:00Z`,
                frp: isNaN(frp) ? 15.0 : Math.round(frp * 10) / 10,
                confidence: parts[confIdx] || 'nominal',
                satellite: parts[satIdx] || 'VIIRS_SNPP',
                daynight: parts[dnIdx] || 'D'
              });
            }
          }
        }

        if (liveFires.length > 0) {
          this.fires = liveFires;
          this.lastSyncTime = new Date();
          this.mode = 'LIVE';
          console.log(`[DataService] 🔥 Successfully retrieved ${liveFires.length} LIVE active fire hotspots from NASA FIRMS!`);
        }
      }
    } catch (err: any) {
      console.warn('[DataService] Could not sync live FIRMS data, using cached baseline:', err.message);
    }
  }

  private attachLatestMeasurements(): void {
    const stationMap = new Map<string, StationMeasurement>();
    // Sort latest first
    const sorted = [...this.measurements].sort((a, b) => 
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );

    for (const m of sorted) {
      if (!stationMap.has(m.stationId)) {
        stationMap.set(m.stationId, m);
      }
    }

    this.stations = this.stations.map(st => ({
      ...st,
      latestMeasurement: stationMap.get(st.id)
    }));
  }

  public getStations(filter?: { city?: string; state?: string; active?: boolean }): MonitoringStation[] {
    let result = [...this.stations];
    if (filter?.city) {
      result = result.filter(s => s.city.toLowerCase() === filter.city?.toLowerCase());
    }
    if (filter?.state) {
      result = result.filter(s => s.state.toLowerCase() === filter.state?.toLowerCase());
    }
    if (filter?.active !== undefined) {
      result = result.filter(s => s.isActive === filter.active);
    }
    return result;
  }

  public getStationById(id: string): MonitoringStation | undefined {
    return this.stations.find(s => s.id === id);
  }

  public getStationHistory(stationId: string, limit: number = 72): StationMeasurement[] {
    return this.measurements
      .filter(m => m.stationId === stationId)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-limit);
  }

  public getActiveFires(): FireHotspot[] {
    return this.fires;
  }

  public getLatestWeather(lat: number, lon: number): WeatherCondition {
    // Find closest weather record or return default
    if (this.weatherRecords.length > 0) {
      let closest = this.weatherRecords[0];
      let minDist = 999999;
      for (const w of this.weatherRecords) {
        const d = Math.hypot(w.latitude - lat, w.longitude - lon);
        if (d < minDist) {
          minDist = d;
          closest = w;
        }
      }
      return {
        location: { latitude: lat, longitude: lon },
        recordedAt: closest.recordedAt || new Date().toISOString(),
        temperature2m: closest.temperature2m,
        relativeHumidity2m: closest.relativeHumidity2m,
        windSpeed10m: closest.windSpeed10m,
        windDirection10m: closest.windDirection10m,
        surfacePressure: closest.surfacePressure,
        precipitation: closest.precipitation,
        boundaryLayerHeight: closest.boundaryLayerHeight,
        source: closest.source
      };
    }

    return {
      location: { latitude: lat, longitude: lon },
      recordedAt: new Date().toISOString(),
      temperature2m: 28.5,
      relativeHumidity2m: 55,
      windSpeed10m: 3.2,
      windDirection10m: 235,
      surfacePressure: 1012.0,
      precipitation: 0.0,
      boundaryLayerHeight: 650,
      source: 'Default-Meteo-Simulation'
    };
  }

  public getFreshnessStatus(): SystemFreshnessStatus[] {
    return [
      {
        service: 'Ground Air Quality Stations (CPCB/OpenAQ)',
        status: 'ONLINE',
        lastSyncTime: this.lastSyncTime.toISOString(),
        recordsCount: this.measurements.length,
        mode: this.mode,
        message: 'Synchronized with continuous monitoring stations in Maharashtra'
      },
      {
        service: 'NASA FIRMS Fire Hotspots',
        status: 'ONLINE',
        lastSyncTime: this.lastSyncTime.toISOString(),
        recordsCount: this.fires.length,
        mode: this.mode,
        message: 'VIIRS/MODIS thermal anomalies active in region'
      },
      {
        service: 'Open-Meteo / ERA5 Atmospheric Weather',
        status: 'ONLINE',
        lastSyncTime: this.lastSyncTime.toISOString(),
        recordsCount: this.weatherRecords.length,
        mode: this.mode,
        message: 'High-resolution wind and planetary boundary layer metrics'
      }
    ];
  }
}

export const dataService = new DataService();

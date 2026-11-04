'use client';

import React, { useState, useEffect } from 'react';
import AQIGauge from '@/components/AQIGauge';
import PollutantCards from '@/components/PollutantCards';
import MapWrapper from '@/components/MapWrapper';
import SourceAttributionCard from '@/components/SourceAttributionCard';
import HistoricalChart from '@/components/HistoricalChart';
import SatelliteWeatherPanel from '@/components/SatelliteWeatherPanel';
import {
  getStations,
  getStationHistory,
  getSourceAttribution,
  getHotspots,
  getFires,
  getWeather
} from '@/lib/api';
import { MonitoringStation, StationMeasurement, SourceAttributionResult } from '@gp01/shared';
import { RefreshCw, MapPin, Building2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(null);
  const [history, setHistory] = useState<StationMeasurement[]>([]);
  const [attribution, setAttribution] = useState<SourceAttributionResult | null>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [fires, setFires] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData(targetStationId?: string) {
    try {
      const stationList = await getStations();
      setStations(stationList);

      const activeSt = targetStationId
        ? stationList.find((s: MonitoringStation) => s.id === targetStationId) || stationList[0]
        : selectedStation || stationList[0];

      setSelectedStation(activeSt);

      if (activeSt) {
        const [histData, attrData, hotData, fireData, weathData] = await Promise.all([
          getStationHistory(activeSt.id, 48),
          getSourceAttribution(activeSt.id),
          getHotspots(),
          getFires(),
          getWeather(activeSt.location.latitude, activeSt.location.longitude)
        ]);

        setHistory(histData || []);
        setAttribution(attrData?.attribution || null);
        setHotspots(hotData || []);
        setFires(fireData || []);
        setWeather(weathData || null);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleStationChange = (id: string) => {
    const st = stations.find((s) => s.id === id);
    if (st) {
      setSelectedStation(st);
      loadData(st.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading Air Quality Intelligence Stream...</p>
      </div>
    );
  }

  const latest = selectedStation?.latestMeasurement;

  return (
    <div className="space-y-6">
      {/* Top Filter and Region Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Active Monitoring Region
            </span>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Maharashtra · {selectedStation?.city}
            </h1>
          </div>
        </div>

        {/* Station Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStation?.id || ''}
            onChange={(e) => handleStationChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-sky-500"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.city} — {s.name} ({s.latestMeasurement?.aqi ? `AQI: ${s.latestMeasurement.aqi}` : 'Active'})
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setRefreshing(true);
              loadData(selectedStation?.id);
            }}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh Live Data"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Row 1: AQI Gauge & Mini Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AQIGauge
            aqi={latest?.aqi}
            dominantPollutant={latest?.dominantPollutant}
            category={latest?.aqiCategory}
            recordedAt={latest?.recordedAt}
            stationName={selectedStation?.name}
          />
        </div>

        <div className="lg:col-span-2">
          <MapWrapper
            stations={stations}
            hotspots={hotspots}
            fires={fires}
            selectedStationId={selectedStation?.id}
            onSelectStation={(st) => handleStationChange(st.id)}
            center={[selectedStation?.location.latitude || 16.705, selectedStation?.location.longitude || 74.243]}
            zoom={12}
          />
        </div>
      </div>

      {/* Row 2: Pollutant Concentrations Grid */}
      <PollutantCards
        data={{
          pm25: latest?.pm25,
          pm10: latest?.pm10,
          no2: latest?.no2,
          so2: latest?.so2,
          co: latest?.co,
          o3: latest?.o3
        }}
      />

      {/* Row 3: Probabilistic Source Attribution */}
      <SourceAttributionCard attribution={attribution} />

      {/* Row 4: Satellite & Meteorology Panel */}
      <SatelliteWeatherPanel weather={weather} />

      {/* Row 5: Historical Trends Recharts */}
      <HistoricalChart data={history} stationName={selectedStation?.name} />
    </div>
  );
}

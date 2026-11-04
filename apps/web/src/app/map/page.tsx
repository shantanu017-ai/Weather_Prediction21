'use client';

import React, { useState, useEffect } from 'react';
import MapWrapper from '@/components/MapWrapper';
import { getStations, getHotspots, getFires } from '@/lib/api';
import { MonitoringStation, FireHotspot, PollutionHotspot } from '@gp01/shared';
import { getAQIColor } from '@/lib/utils';
import { Layers, Flame, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function GeospatialMapPage() {
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [hotspots, setHotspots] = useState<PollutionHotspot[]>([]);
  const [fires, setFires] = useState<FireHotspot[]>([]);
  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(null);
  const [filterCity, setFilterCity] = useState<string>('All');
  const [showFires, setShowFires] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMapData() {
      try {
        const [stList, hotList, fireList] = await Promise.all([
          getStations(),
          getHotspots(),
          getFires()
        ]);
        setStations(stList || []);
        setHotspots(hotList || []);
        setFires(fireList || []);
        if (stList && stList.length > 0) {
          setSelectedStation(stList[0]);
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
  }, []);

  const cities = ['All', ...Array.from(new Set(stations.map((s) => s.city)))];

  const filteredStations = filterCity === 'All'
    ? stations
    : stations.filter((s) => s.city.toLowerCase() === filterCity.toLowerCase());

  const activeHotspots = showHotspots ? hotspots : [];
  const activeFires = showFires ? fires : [];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading Geospatial Layers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-sky-400" />
            Geospatial Hotspots & Monitoring Network
          </h1>
          <p className="text-xs text-slate-400">
            Interactive GIS visualizer combining CPCB ground stations, active NASA FIRMS fires, and DBSCAN spatial clusters.
          </p>
        </div>

        {/* Toggles and City Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* City selector */}
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Demonstration Regions' : c}
              </option>
            ))}
          </select>

          {/* Toggle FIRMS Fires */}
          <button
            onClick={() => setShowFires(!showFires)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              showFires
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            FIRMS Fires ({fires.length})
          </button>

          {/* Toggle DBSCAN Hotspots */}
          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              showHotspots
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            DBSCAN Hotspots ({hotspots.length})
          </button>
        </div>
      </div>

      {/* Main Map + Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 h-[600px]">
          <MapWrapper
            stations={filteredStations}
            hotspots={activeHotspots}
            fires={activeFires}
            selectedStationId={selectedStation?.id}
            onSelectStation={(st) => setSelectedStation(st)}
            center={[16.705, 74.243]}
            zoom={10}
          />
        </div>

        {/* Selected Station Inspector Sidebar */}
        <div className="lg:col-span-1 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Selected Site Details
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {selectedStation?.name || 'Select a Station'}
            </h3>
            <p className="text-xs text-slate-400">
              {selectedStation?.city}, {selectedStation?.state} · {selectedStation?.stationType}
            </p>

            {selectedStation?.latestMeasurement && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Overall AQI:</span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: getAQIColor(selectedStation.latestMeasurement.aqi || 0).color }}
                  >
                    {selectedStation.latestMeasurement.aqi} ({selectedStation.latestMeasurement.aqiCategory})
                  </span>
                </div>

                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-slate-300">
                    <span>PM2.5:</span>
                    <strong>{selectedStation.latestMeasurement.pm25} µg/m³</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>PM10:</span>
                    <strong>{selectedStation.latestMeasurement.pm10} µg/m³</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>NO₂:</span>
                    <strong>{selectedStation.latestMeasurement.no2} µg/m³</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>SO₂:</span>
                    <strong>{selectedStation.latestMeasurement.so2} µg/m³</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>CO:</span>
                    <strong>{selectedStation.latestMeasurement.co} mg/m³</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 p-3 rounded-lg bg-sky-950/20 border border-sky-800/40 text-xs text-slate-300">
            <div className="font-semibold text-sky-400 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="h-4 w-4" />
              Geospatial Verification
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Click any station on the map to inspect real-time multi-pollutant concentrations and CPCB compliance breakpoints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

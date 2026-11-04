'use client';

import React, { useState, useEffect } from 'react';
import ForecastChart from '@/components/ForecastChart';
import { getStations, getForecast } from '@/lib/api';
import { MonitoringStation, AirQualityForecast } from '@gp01/shared';
import { getAQIColor } from '@/lib/utils';
import { LineChart, Sparkles, Clock, Compass, ShieldCheck } from 'lucide-react';

export default function ForecastPage() {
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(null);
  const [forecastData, setForecastData] = useState<AirQualityForecast | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStationForecast(stId: string) {
    try {
      const res = await getForecast(stId);
      setForecastData(res?.forecast || null);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const stList = await getStations();
      setStations(stList || []);
      if (stList && stList.length > 0) {
        setSelectedStation(stList[0]);
        await loadStationForecast(stList[0].id);
      }
    }
    init();
  }, []);

  const handleSelectStation = (id: string) => {
    const st = stations.find((s) => s.id === id);
    if (st) {
      setSelectedStation(st);
      loadStationForecast(st.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Computing 24h ML Air Quality Forecast...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <LineChart className="h-5 w-5 text-sky-400" />
            24-Hour Predictive Air Quality Horizon
          </h1>
          <p className="text-xs text-slate-400">
            Gradient boosted autoregressive forecasting model incorporating diurnal atmospheric ventilation cycles and planetary boundary layer height.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStation?.id || ''}
            onChange={(e) => handleSelectStation(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.city} — {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <ForecastChart forecastData={forecastData} />

      {/* Hourly Forecast Breakdown Table */}
      {forecastData?.forecast && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-400" />
              Hourly Forecast Matrix
            </h3>
            <span className="text-xs text-slate-400">
              Generated: {new Date(forecastData.generatedAt).toLocaleString()} IST
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Predicted PM2.5</th>
                  <th className="py-2.5 px-3">Predicted PM10</th>
                  <th className="py-2.5 px-3">Estimated AQI</th>
                  <th className="py-2.5 px-3">CPCB NAQI Category</th>
                  <th className="py-2.5 px-3">Uncertainty Bounds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {forecastData.forecast.slice(0, 12).map((item, idx) => {
                  const color = getAQIColor(item.aqi);
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {item.pm25} µg/m³
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {item.pm10} µg/m³
                      </td>
                      <td className="py-2.5 px-3 font-bold" style={{ color: color.color }}>
                        {item.aqi}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: `${color.color}20`, color: color.color }}
                        >
                          {item.aqiCategory}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        [{item.confidenceInterval.lower} – {item.confidenceInterval.upper}]
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

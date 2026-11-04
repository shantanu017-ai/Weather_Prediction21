'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { AirQualityForecast } from '@gp01/shared';
import { Sparkles } from 'lucide-react';

interface ForecastChartProps {
  forecastData?: AirQualityForecast | null;
}

export default function ForecastChart({ forecastData }: ForecastChartProps) {
  if (!forecastData || !forecastData.forecast) {
    return (
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-center">
        No forecast generated yet.
      </div>
    );
  }

  const chartData = forecastData.forecast.map((f) => ({
    time: new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    pm25: f.pm25,
    pm10: f.pm10,
    aqi: f.aqi,
    lowerPM25: f.confidenceInterval?.lower || f.pm25 * 0.9,
    upperPM25: f.confidenceInterval?.upper || f.pm25 * 1.1,
    category: f.aqiCategory
  }));

  return (
    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
              Autoregressive ML Forecaster
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              LightGBM + Diurnal Cyclic
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-0.5">
            24-Hour Predictive Air Quality Horizon
          </h3>
        </div>

        <div className="text-xs text-slate-400">
          Horizon: <strong>{forecastData.horizonHours} Hours Ahead</strong>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Line
              type="monotone"
              dataKey="aqi"
              name="Predicted AQI"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="pm25"
              name="PM 2.5 (µg/m³)"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="pm10"
              name="PM 10 (µg/m³)"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

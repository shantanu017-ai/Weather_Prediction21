'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { StationMeasurement } from '@gp01/shared';

interface HistoricalChartProps {
  data: StationMeasurement[];
  stationName?: string;
}

export default function HistoricalChart({ data, stationName }: HistoricalChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'aqi' | 'pm25' | 'pm10'>('aqi');

  const chartData = data.map((d) => ({
    time: new Date(d.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date(d.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    aqi: d.aqi || 0,
    pm25: d.pm25 || 0,
    pm10: d.pm10 || 0
  }));

  const metricConfig = {
    aqi: { name: 'CPCB AQI', color: '#38bdf8', unit: '' },
    pm25: { name: 'PM 2.5', color: '#10b981', unit: 'µg/m³' },
    pm10: { name: 'PM 10', color: '#f59e0b', unit: 'µg/m³' }
  };

  const active = metricConfig[selectedMetric];

  return (
    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Air Quality Dynamics
          </span>
          <h3 className="text-base font-bold text-white mt-0.5">
            Historical Trends {stationName ? `— ${stationName}` : ''}
          </h3>
        </div>

        {/* Metric toggles */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800">
          {(['aqi', 'pm25', 'pm10'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMetric(m)}
              className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                selectedMetric === m
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={active.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={active.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return `${payload[0].payload.date} ${label}`;
                }
                return label;
              }}
            />
            <Area
              type="monotone"
              dataKey={selectedMetric}
              stroke={active.color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#metricGrad)"
              name={active.name}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

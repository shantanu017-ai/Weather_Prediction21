'use client';

import React from 'react';
import { getAQIColor, getHealthAdvisory } from '@/lib/utils';
import { AlertTriangle, Clock, ShieldCheck, Wind } from 'lucide-react';

interface AQIGaugeProps {
  aqi?: number | null;
  dominantPollutant?: string | null;
  category?: string | null;
  recordedAt?: string;
  stationName?: string;
}

export default function AQIGauge({
  aqi,
  dominantPollutant,
  category,
  recordedAt,
  stationName
}: AQIGaugeProps) {
  const currentCategory = category || (aqi ? getAQIColor(aqi).category : 'Moderate');
  const styling = getAQIColor(aqi || 0);
  const advisory = getHealthAdvisory(currentCategory);

  // Percentage for progress meter (max 500)
  const pct = Math.min(100, Math.round(((aqi || 0) / 500) * 100));

  return (
    <div className={`p-6 rounded-xl border ${styling.borderClass} ${styling.bgClass} relative overflow-hidden backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Air Quality Index (NAQI)
          </span>
          <h3 className="text-sm font-medium text-slate-300 mt-0.5">
            {stationName || 'Monitoring Station'}
          </h3>
        </div>

        <span
          className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${styling.color}20`, color: styling.color, border: `1px solid ${styling.color}40` }}
        >
          {currentCategory}
        </span>
      </div>

      <div className="mt-6 flex items-baseline gap-4">
        <span className="text-6xl font-black tracking-tight" style={{ color: styling.color }}>
          {aqi !== undefined && aqi !== null ? aqi : '--'}
        </span>

        <div>
          <p className="text-xs text-slate-400">Scale: 0 – 500</p>
          {dominantPollutant && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-300 font-medium">
              <Wind className="h-3.5 w-3.5 text-sky-400" />
              Dominant: <span className="font-bold text-white">{dominantPollutant}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: styling.color }}
        />
      </div>

      {/* Health Advisory */}
      <div className="mt-5 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{advisory}</p>
      </div>

      {recordedAt && (
        <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="h-3 w-3" />
          <span>Last synchronized: {new Date(recordedAt).toLocaleTimeString()} IST</span>
        </div>
      )}
    </div>
  );
}

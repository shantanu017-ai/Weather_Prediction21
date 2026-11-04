'use client';

import React from 'react';
import { SourceAttributionResult } from '@gp01/shared';
import {
  Car,
  Factory,
  Flame,
  Shovel,
  Wind,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Compass
} from 'lucide-react';

interface SourceAttributionCardProps {
  attribution?: SourceAttributionResult | null;
}

export default function SourceAttributionCard({ attribution }: SourceAttributionCardProps) {
  if (!attribution) {
    return (
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400">
        No source attribution data available for this location.
      </div>
    );
  }

  const scores = attribution.scores;
  const sources = [
    {
      name: 'Vehicular Traffic',
      score: scores.traffic,
      color: '#38bdf8',
      icon: Car,
      desc: 'Mobile exhaust combustion (NO₂, CO, fine PM)'
    },
    {
      name: 'Industrial Emissions',
      score: scores.industrial,
      color: '#f43f5e',
      icon: Factory,
      desc: 'Stationary point sources (SO₂, smelters, boilers)'
    },
    {
      name: 'Crop Residue & Biomass Burning',
      score: scores.biomass,
      color: '#f97316',
      icon: Flame,
      desc: 'Agricultural burning, wood combustion, upwind FIRMS fires'
    },
    {
      name: 'Road & Construction Dust',
      score: scores.dust,
      color: '#eab308',
      icon: Shovel,
      desc: 'Mechanical coarse resuspension (PM10/PM2.5 ratio)'
    },
    {
      name: 'Background Stagnation / Inversion',
      score: scores.other,
      color: '#94a3b8',
      icon: Wind,
      desc: 'Atmospheric boundary layer trapping and secondary aerosols'
    }
  ];

  return (
    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Probabilistic Source Attribution Engine
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">
            Primary Driver: <span className="text-sky-400">{attribution.dominantSource}</span>
          </h3>
          <p className="text-xs text-slate-400">
            Probabilistic multi-factor attribution based on chemical ratios, satellite fire detection, and meteorological dispersion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-sky-950/40 border border-sky-800 text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Confidence</div>
            <div className="text-base font-bold text-sky-400">{attribution.confidence}%</div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Dispersion</div>
            <div className="text-xs font-semibold text-slate-200">{attribution.windContext.ventilationFactor}</div>
          </div>
        </div>
      </div>

      {/* Probability Distribution Bars */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Pollution Source Contribution Breakdown
        </h4>
        <div className="space-y-3">
          {sources.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-200 font-medium">
                    <Icon className="h-4 w-4" style={{ color: s.color }} />
                    <span>{s.name}</span>
                  </div>
                  <span className="font-bold text-slate-100">{s.score}%</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.score}%`, backgroundColor: s.color }}
                  />
                </div>
                <div className="text-[10px] text-slate-500">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence Explainer Grid */}
      {attribution.evidence && attribution.evidence.length > 0 && (
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Supporting Observational & Physical Evidence
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attribution.evidence.map((ev, idx) => {
              const isHigh = ev.impact === 'High';
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                    isHigh
                      ? 'bg-sky-950/20 border-sky-800/60 text-slate-200'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{ev.metric}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isHigh
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {ev.impact} Impact
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Observed: <strong className="text-sky-300">{ev.value}</strong> · Baseline: {ev.thresholdOrNorm}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
                      {ev.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wind & Meteorology Banner */}
      <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-sky-400" />
          <span>Surface Wind Vector: <strong>{attribution.windContext.speed} m/s</strong> from <strong>{attribution.windContext.direction}°</strong></span>
        </div>
        <div className="text-[11px] text-slate-500">
          Source: Open-Meteo ERA5 Reanalysis
        </div>
      </div>
    </div>
  );
}

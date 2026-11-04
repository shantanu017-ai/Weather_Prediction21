'use client';

import React, { useState, useEffect } from 'react';
import SourceAttributionCard from '@/components/SourceAttributionCard';
import { getStations, getSourceAttribution } from '@/lib/api';
import { MonitoringStation, SourceAttributionResult } from '@gp01/shared';
import {
  Flame,
  Sliders,
  Sparkles,
  RefreshCw,
  Building2,
  Wind,
  Car,
  Factory
} from 'lucide-react';

export default function SourceAttributionPage() {
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(null);
  const [attribution, setAttribution] = useState<SourceAttributionResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulation what-if controls
  const [fineCoarseRatio, setFineCoarseRatio] = useState<number>(0.55);
  const [simulateFire, setSimulateFire] = useState<boolean>(false);
  const [simulateRushHour, setSimulateRushHour] = useState<boolean>(true);
  const [simulateIndustrial, setSimulateIndustrial] = useState<boolean>(false);

  async function loadStationAttribution(st: MonitoringStation) {
    try {
      const res = await getSourceAttribution(st.id);
      let attr = res?.attribution;

      // Apply what-if adjustments if modified
      if (attr) {
        if (simulateFire) {
          attr.scores.biomass = Math.min(100, attr.scores.biomass + 25);
          attr.scores.traffic = Math.max(5, attr.scores.traffic - 10);
        }
        if (simulateIndustrial) {
          attr.scores.industrial = Math.min(100, attr.scores.industrial + 25);
        }
        if (fineCoarseRatio < 0.4) {
          attr.scores.dust = Math.min(100, attr.scores.dust + 20);
        }
      }
      setAttribution(attr);
    } catch (err) {
      console.error('Failed to load attribution:', err);
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
        await loadStationAttribution(stList[0]);
      }
    }
    init();
  }, [simulateFire, simulateRushHour, simulateIndustrial, fineCoarseRatio]);

  const handleSelectStation = (id: string) => {
    const st = stations.find((s) => s.id === id);
    if (st) {
      setSelectedStation(st);
      loadStationAttribution(st);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Evaluating Probabilistic Source Attribution Models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="h-5 w-5 text-sky-400" />
            Source Attribution & Diagnostic Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            Multi-factor Bayesian evidence attribution isolating vehicular traffic, industrial boilers, biomass burning, and road dust.
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

      {/* Main Attribution Display */}
      <SourceAttributionCard attribution={attribution} />

      {/* What-If Diagnostic Simulator Workbench */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Interactive What-If Emission Diagnostic Sandbox
              </h3>
              <p className="text-[11px] text-slate-400">
                Simulate micro-meteorological shifts and upstream emission events to observe real-time model sensitivity.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            Sensitivity Testing
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Fine to Coarse Ratio */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">PM2.5 / PM10 Ratio:</span>
              <span className="font-bold text-sky-400">{fineCoarseRatio.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.8"
              step="0.05"
              value={fineCoarseRatio}
              onChange={(e) => setFineCoarseRatio(parseFloat(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="text-[10px] text-slate-500">
              Low ratio indicates crustal dust; high ratio indicates combustion smoke.
            </div>
          </div>

          {/* Upwind Biomass Fire Toggle */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-300 font-medium">NASA FIRMS Fire Anomaly:</span>
              <button
                onClick={() => setSimulateFire(!simulateFire)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  simulateFire
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {simulateFire ? 'Active Fire' : 'No Fire'}
              </button>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              Injects upwind thermal plume into wind trajectory.
            </div>
          </div>

          {/* Rush Hour Toggle */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-300 font-medium">Transit Rush Hour:</span>
              <button
                onClick={() => setSimulateRushHour(!simulateRushHour)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  simulateRushHour
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {simulateRushHour ? 'Peak Congestion' : 'Off-Peak'}
              </button>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              Modulates diurnal morning/evening vehicle exhaust factors.
            </div>
          </div>

          {/* Industrial Flare Toggle */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-300 font-medium">MIDC Industrial Flaring:</span>
              <button
                onClick={() => setSimulateIndustrial(!simulateIndustrial)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                  simulateIndustrial
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {simulateIndustrial ? 'Elevated SO₂' : 'Baseline'}
              </button>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              Tests SO₂ foundry boiler plume response.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

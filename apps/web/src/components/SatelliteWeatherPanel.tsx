'use client';

import React from 'react';
import { WeatherCondition } from '@gp01/shared';
import { CloudRain, Wind, Thermometer, Gauge, Satellite, Sparkles } from 'lucide-react';

interface SatelliteWeatherPanelProps {
  weather?: WeatherCondition | null;
  aod?: number;
  troposphericNO2?: number;
}

export default function SatelliteWeatherPanel({
  weather,
  aod = 0.58,
  troposphericNO2 = 0.000048
}: SatelliteWeatherPanelProps) {
  const pbl = weather?.boundaryLayerHeight || 680;
  const windSpd = weather?.windSpeed10m || 2.8;
  const ventilationIndex = Math.round((pbl * windSpd) / 1000 * 10) / 10;

  let dispersionTag = 'Moderate Ventilation';
  let tagColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  if (ventilationIndex > 3.0) {
    dispersionTag = 'Good Atmospheric Dispersion';
    tagColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  } else if (ventilationIndex < 1.5) {
    dispersionTag = 'Stagnant / Thermal Inversion';
    tagColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  }

  return (
    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Satellite className="h-5 w-5 text-sky-400" />
          <div>
            <h3 className="text-sm font-bold text-white">
              Satellite & Atmospheric Meteorological Fusion
            </h3>
            <p className="text-[11px] text-slate-400">
              Copernicus Sentinel-5P + MODIS AOD + Open-Meteo ERA5
            </p>
          </div>
        </div>

        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tagColor}`}>
          {dispersionTag}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* AOD */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 text-[11px]">Aerosol Optical Depth (AOD)</span>
          <div className="text-lg font-bold text-sky-400 mt-1">{aod}</div>
          <span className="text-[10px] text-slate-500">MODIS MAIAC 550nm</span>
        </div>

        {/* PBL Height */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 text-[11px]">Boundary Layer (PBL)</span>
          <div className="text-lg font-bold text-white mt-1">{pbl} m</div>
          <span className="text-[10px] text-slate-500">Dispersion cap height</span>
        </div>

        {/* Temperature & Humidity */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 text-[11px]">Temp & Humidity</span>
          <div className="text-lg font-bold text-white mt-1">
            {weather?.temperature2m || 28}°C · {weather?.relativeHumidity2m || 55}%
          </div>
          <span className="text-[10px] text-slate-500">Surface ambient</span>
        </div>

        {/* Wind Speed & Direction */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 text-[11px]">Wind Vector</span>
          <div className="text-lg font-bold text-white mt-1">
            {windSpd} m/s · {weather?.windDirection10m || 240}°
          </div>
          <span className="text-[10px] text-slate-500">South-westerly drift</span>
        </div>
      </div>
    </div>
  );
}

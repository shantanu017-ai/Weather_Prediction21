'use client';

import React from 'react';
import { calculateSubIndex } from '@gp01/shared';
import { getAQIColor } from '@/lib/utils';

interface PollutantsData {
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  o3?: number | null;
}

interface PollutantCardsProps {
  data?: PollutantsData;
}

export default function PollutantCards({ data }: PollutantCardsProps) {
  const pollutants = [
    {
      key: 'pm25',
      name: 'PM 2.5',
      subtitle: 'Fine Particulate Matter',
      unit: 'µg/m³',
      standard: '60 24h',
      value: data?.pm25
    },
    {
      key: 'pm10',
      name: 'PM 10',
      subtitle: 'Respirable Suspended Particulate',
      unit: 'µg/m³',
      standard: '100 24h',
      value: data?.pm10
    },
    {
      key: 'no2',
      name: 'NO₂',
      subtitle: 'Nitrogen Dioxide (Traffic proxy)',
      unit: 'µg/m³',
      standard: '80 24h',
      value: data?.no2
    },
    {
      key: 'so2',
      name: 'SO₂',
      subtitle: 'Sulfur Dioxide (Industrial proxy)',
      unit: 'µg/m³',
      standard: '80 24h',
      value: data?.so2
    },
    {
      key: 'co',
      name: 'CO',
      subtitle: 'Carbon Monoxide (Biomass proxy)',
      unit: 'mg/m³',
      standard: '2.0 8h',
      value: data?.co
    },
    {
      key: 'o3',
      name: 'Ozone (O₃)',
      subtitle: 'Photochemical Smog',
      unit: 'µg/m³',
      standard: '100 8h',
      value: data?.o3
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {pollutants.map((item) => {
        const subIndex = calculateSubIndex(item.key, item.value);
        const subColor = getAQIColor(subIndex);

        return (
          <div
            key={item.key}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{item.name}</span>
                {subIndex !== null && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${subColor.color}20`, color: subColor.color }}
                  >
                    Sub: {subIndex}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{item.subtitle}</p>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-100">
                  {item.value !== null && item.value !== undefined ? item.value : '--'}
                </span>
                <span className="text-[11px] text-slate-400">{item.unit}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>Std: {item.standard}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

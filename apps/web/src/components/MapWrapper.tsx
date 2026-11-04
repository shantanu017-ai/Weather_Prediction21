'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { MonitoringStation, FireHotspot, PollutionHotspot } from '@gp01/shared';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-3">
      <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-medium">Loading Geospatial Environmental Map...</span>
    </div>
  )
});

interface MapWrapperProps {
  stations?: MonitoringStation[];
  hotspots?: PollutionHotspot[];
  fires?: FireHotspot[];
  selectedStationId?: string;
  onSelectStation?: (station: MonitoringStation) => void;
  center?: [number, number];
  zoom?: number;
}

export default function MapWrapper(props: MapWrapperProps) {
  return <LeafletMap {...props} />;
}

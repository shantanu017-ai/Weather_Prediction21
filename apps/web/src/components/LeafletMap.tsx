'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MonitoringStation, FireHotspot, PollutionHotspot } from '@gp01/shared';
import { getAQIColor } from '@/lib/utils';
import { Layers, Globe, Moon } from 'lucide-react';

interface LeafletMapProps {
  stations?: MonitoringStation[];
  hotspots?: PollutionHotspot[];
  fires?: FireHotspot[];
  selectedStationId?: string;
  onSelectStation?: (station: MonitoringStation) => void;
  center?: [number, number];
  zoom?: number;
}

export default function LeafletMap({
  stations = [],
  hotspots = [],
  fires = [],
  selectedStationId,
  onSelectStation,
  center = [16.705, 74.243], // Kolhapur default
  zoom = 11
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark'>('satellite');

  const getTileUrl = (style: 'satellite' | 'dark') => {
    if (mapboxToken) {
      if (style === 'satellite') {
        return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`;
      }
      return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`;
    }
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: false
      });

      const tileLayer = L.tileLayer(getTileUrl(mapStyle), {
        maxZoom: 19,
        tileSize: 512,
        zoomOffset: -1,
        attribution: '© Mapbox © OpenStreetMap'
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Layer when style changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 19,
      tileSize: 512,
      zoomOffset: -1,
      attribution: '© Mapbox © OpenStreetMap'
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // Update markers and vector layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Render Pollution Hotspots (Convex Hull Polygons & Centroids)
    hotspots.forEach((h) => {
      if (h.coordinatesPolygon && h.coordinatesPolygon.length > 2) {
        const polygon = L.polygon(h.coordinatesPolygon as [number, number][], {
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.35,
          weight: 2.5,
          dashArray: '5, 5'
        }).addTo(layerGroup);

        polygon.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #f8fafc; padding: 4px;">
            <div style="font-weight: bold; color: #ef4444; font-size: 13px;">⚠️ Clustered Hotspot #${h.clusterId}</div>
            <div style="margin-top: 4px;">Severity: <strong>${h.severityLevel}</strong></div>
            <div>Avg AQI: <strong>${h.avgAQI}</strong></div>
            <div>Avg PM2.5: <strong>${h.avgPM25} µg/m³</strong></div>
            <div>Avg PM10: <strong>${h.avgPM10} µg/m³</strong></div>
            <div>Contributing Stations: <strong>${h.contributingStations}</strong></div>
          </div>
        `);
      }
    });

    // 2. Render Active NASA FIRMS Fire Hotspots
    fires.forEach((f) => {
      const fireIcon = L.divIcon({
        className: 'custom-fire-marker',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: #ea580c;
            border: 2px solid #ffedd5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 14px;
            box-shadow: 0 0 14px #ea580c;
            cursor: pointer;
            animation: pulse 1.5s infinite;
          ">🔥</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([f.latitude, f.longitude], { icon: fireIcon }).addTo(layerGroup);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #f8fafc; padding: 6px;">
          <div style="font-weight: bold; color: #ea580c; font-size: 13px;">🔥 NASA FIRMS Active Fire Anomaly</div>
          <div style="margin-top: 4px;">FRP (Radiative Power): <strong style="color: #f97316;">${f.frp} MW</strong></div>
          <div>Satellite Sensor: <strong>${f.satellite}</strong></div>
          <div>Confidence: <strong>${f.confidence}</strong></div>
          <div>Coordinates: <strong>${f.latitude.toFixed(4)}, ${f.longitude.toFixed(4)}</strong></div>
          <div>Observation Time: <strong>${new Date(f.acqDatetime).toLocaleString()} IST</strong></div>
        </div>
      `);
    });

    // 3. Render Ground Monitoring Stations
    stations.forEach((st) => {
      const aqi = st.latestMeasurement?.aqi || 50;
      const colorInfo = getAQIColor(aqi);
      const isSelected = selectedStationId === st.id;

      const stationMarker = L.divIcon({
        className: 'custom-station-marker',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '38px' : '30px'};
            height: ${isSelected ? '38px' : '30px'};
            background: #0f172a;
            border: 3px solid ${colorInfo.color};
            border-radius: 50%;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            box-shadow: 0 0 ${isSelected ? '20px' : '10px'} ${colorInfo.color};
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            ${aqi}
          </div>
        `,
        iconSize: [isSelected ? 38 : 30, isSelected ? 38 : 30],
        iconAnchor: [isSelected ? 19 : 15, isSelected ? 19 : 15]
      });

      const marker = L.marker([st.location.latitude, st.location.longitude], { icon: stationMarker })
        .addTo(layerGroup)
        .on('click', () => {
          if (onSelectStation) {
            onSelectStation(st);
          }
        });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #f8fafc; padding: 4px; min-width: 190px;">
          <div style="font-weight: bold; font-size: 13px; color: #38bdf8;">${st.name}</div>
          <div style="color: #94a3b8; font-size: 11px;">${st.city}, ${st.state}</div>
          <hr style="border: none; border-top: 1px solid #334155; margin: 6px 0;" />
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>AQI:</span>
            <span style="font-weight: bold; color: ${colorInfo.color}; font-size: 14px;">${aqi} (${colorInfo.category})</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 3px;">
            <span>PM2.5:</span>
            <strong>${st.latestMeasurement?.pm25 || '--'} µg/m³</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>PM10:</span>
            <strong>${st.latestMeasurement?.pm10 || '--'} µg/m³</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>NO₂:</span>
            <strong>${st.latestMeasurement?.no2 || '--'} µg/m³</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>SO₂:</span>
            <strong>${st.latestMeasurement?.so2 || '--'} µg/m³</strong>
          </div>
        </div>
      `);
    });
  }, [stations, hotspots, fires, selectedStationId]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Style Selector Pill (Mapbox Satellite vs Dark Mode) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-lg pointer-events-auto">
        <button
          onClick={() => setMapStyle('satellite')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
            mapStyle === 'satellite'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          Mapbox Satellite
        </button>
        <button
          onClick={() => setMapStyle('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
            mapStyle === 'dark'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Moon className="h-3.5 w-3.5" />
          Mapbox Dark
        </button>
      </div>

      {/* Map Legend & Active Key Badges */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg text-xs text-slate-300 pointer-events-auto">
        <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-slate-800">
          <div className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider">
            Live Map Layers
          </div>
          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
            Mapbox HD
          </span>
        </div>
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-emerald-500 bg-slate-900" />
            <span>Good (0–50) / Satisfactory (51–100)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-yellow-500 bg-slate-900" />
            <span>Moderate (101–200)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-orange-500 bg-slate-900" />
            <span>Poor (201–300) / Severe</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <span>NASA FIRMS Live Fire Anomaly</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-3 border border-red-500 bg-red-500/30" />
            <span>DBSCAN Clustered Hotspot</span>
          </div>
        </div>
      </div>
    </div>
  );
}

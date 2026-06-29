'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { MAP_CENTER, MAP_ZOOM, getStatusColor } from '@/lib/constants';
import { AlertStatus } from '@/lib/types';

// Dynamic import for Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null;

interface MapMarker {
  stationId: string;
  name: string;
  lat: number;
  lng: number;
  status: AlertStatus;
  discharge: number;
  waterLevel: number;
  capacityPercent: number;
  trend: number;
  trendDirection: string;
  type: string;
  soilMoisture?: number;
}

export default function MapPanel() {
  const stations = useSelector((s: RootState) => s.dashboard.stations);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const initRef = useRef(false);

  // Initialize map on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initRef.current) return;
    initRef.current = true;

    import('leaflet').then((leaflet) => {
      L = leaflet;

      // Fix default icon issue
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const container = document.getElementById('map-container');
      if (!container) return;

      const mapInstance = L.map(container, {
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      // OpenTopoMap for topographic view
      L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '© OpenTopoMap',
      }).addTo(mapInstance);

      // Draw river lines (Yom River and tributaries)
      drawRiverLines(mapInstance, L);

      mapRef.current = mapInstance;
      setMapReady(true);

      // Force resize
      setTimeout(() => mapInstance.invalidateSize(), 200);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initRef.current = false;
      }
    };
  }, []);

  // Update markers when station data changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || !L) return;
    const map = mapRef.current;

    // Clear existing markers
    markers.forEach((m) => m.remove());

    const newMarkers: L.Marker[] = [];
    const stationEntries: MapMarker[] = Object.values(stations).map((s) => ({
      stationId: s.stationId,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      status: s.status,
      discharge: s.discharge,
      waterLevel: s.waterLevel,
      capacityPercent: s.capacityPercent,
      trend: s.trend,
      trendDirection: s.trendDirection,
      type: s.type,
      soilMoisture: s.soilMoisture,
    }));

    stationEntries.forEach((station) => {
      const color = getStatusColor(station.status);
      const icon = L!.divIcon({
        className: 'custom-marker',
        html: `
          <div class="station-marker" style="background:${color}; box-shadow: 0 0 12px ${color}80;">
            <div style="width:8px;height:8px;border-radius:50%;background:white;opacity:0.9;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -18],
      });

      const marker = L!.marker([station.lat, station.lng], { icon })
        .addTo(map);

      // Build popup content
      const trendIcon = station.trendDirection === 'rising' ? '↑' :
                         station.trendDirection === 'falling' ? '↓' : '→';
      const trendColor = station.trendDirection === 'rising' ? '#ef4444' :
                          station.trendDirection === 'falling' ? '#22c55e' : '#94a3b8';

      let popupContent = `
        <div style="min-width:180px;">
          <div style="font-weight:700;font-size:0.85rem;margin-bottom:6px;color:${color};">
            ${station.stationId}
          </div>
          <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:8px;">${station.name}</div>
      `;

      if (station.type === 'sensor') {
        popupContent += `
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid #2a3a4e;">
            <span style="color:#94a3b8;">Soil Moisture</span>
            <span style="font-weight:600;">${station.soilMoisture?.toFixed(1) ?? 'N/A'}%</span>
          </div>
        `;
      } else {
        popupContent += `
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid #2a3a4e;">
            <span style="color:#94a3b8;">Discharge</span>
            <span style="font-weight:600;">${station.discharge.toFixed(0)} cms</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span style="color:#94a3b8;">Water Level</span>
            <span style="font-weight:600;">${station.waterLevel.toFixed(2)} m</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span style="color:#94a3b8;">Capacity</span>
            <span style="font-weight:600;color:${color};">${station.capacityPercent.toFixed(1)}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span style="color:#94a3b8;">Trend (3hr)</span>
            <span style="font-weight:600;color:${trendColor};">${trendIcon} ${station.trend > 0 ? '+' : ''}${station.trend.toFixed(2)} m</span>
          </div>
        `;
      }

      popupContent += '</div>';
      marker.bindPopup(popupContent, { maxWidth: 220 });

      // Tooltip on hover
      marker.bindTooltip(
        `<strong>${station.stationId}</strong> ${station.type === 'sensor' ? '(Sensor)' : `${station.discharge.toFixed(0)} cms`}`,
        {
          permanent: false,
          direction: 'top',
          offset: [0, -16],
          className: 'station-tooltip',
        }
      );

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations, mapReady]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Live Interactive Map — Phrae Hydrological Network
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div id="map-container" className="map-container" />

        {/* Map Legend */}
        <div className="map-legend" id="map-legend">
          <div style={{ fontWeight: 600, marginBottom: 6, color: '#e2e8f0', fontSize: '0.72rem' }}>
            Station Status
          </div>
          {(['safe', 'watch', 'warning', 'emergency'] as AlertStatus[]).map((status) => (
            <div className="map-legend-item" key={status}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: getStatusColor(status),
                  boxShadow: `0 0 6px ${getStatusColor(status)}60`,
                }}
              />
              <span style={{ textTransform: 'capitalize' }}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== DRAW RIVER LINES =====
function drawRiverLines(map: L.Map, leaflet: typeof import('leaflet')) {
  // Yom River (Mainstream) - approximate path
  const yomRiver: [number, number][] = [
    [18.42, 100.06],
    [18.40, 100.07],
    [18.385, 100.075], // Y.20
    [18.36, 100.08],
    [18.34, 100.09],
    [18.30, 100.095],
    [18.27, 100.10],
    [18.245, 100.102],
    [18.218, 100.105], // KY.1
    [18.20, 100.11],
    [18.18, 100.12],
    [18.16, 100.13],
    [18.15, 100.14],  // Y.1C
    [18.13, 100.15],
    [18.10, 100.16],
  ];

  leaflet.polyline(yomRiver, {
    color: '#3b82f6',
    weight: 3,
    opacity: 0.7,
    dashArray: undefined,
  }).addTo(map);

  // Add river label
  leaflet.marker([18.32, 100.06] as [number, number], {
    icon: leaflet.divIcon({
      className: 'river-label',
      html: '<div style="color:#60a5fa;font-size:0.7rem;font-weight:600;white-space:nowrap;text-shadow:0 0 4px #0a0e1a,0 0 8px #0a0e1a;">Yom River</div>',
      iconSize: [80, 20],
    }),
  }).addTo(map);

  // Mae Kham Mi (Tributary)
  const maeKhamMi: [number, number][] = [
    [18.34, 100.24],
    [18.32, 100.22],
    [18.31, 100.21],  // Y.38
    [18.29, 100.19],
    [18.28, 100.17],  // KM.1
    [18.27, 100.14],
    [18.26, 100.11],
    [18.245, 100.102],
  ];

  leaflet.polyline(maeKhamMi, {
    color: '#06b6d4',
    weight: 2,
    opacity: 0.6,
  }).addTo(map);

  leaflet.marker([18.33, 100.23] as [number, number], {
    icon: leaflet.divIcon({
      className: 'river-label',
      html: '<div style="color:#22d3ee;font-size:0.6rem;font-weight:500;white-space:nowrap;text-shadow:0 0 4px #0a0e1a;">Mae Kham Mi</div>',
      iconSize: [80, 20],
    }),
  }).addTo(map);

  // Mae Lai (Tributary)
  const maeLai: [number, number][] = [
    [18.22, 100.26],
    [18.21, 100.24],
    [18.20, 100.22],  // Y.34
    [18.195, 100.20],
    [18.19, 100.18],  // KL.1
    [18.18, 100.15],
    [18.17, 100.13],
    [18.16, 100.12],
  ];

  leaflet.polyline(maeLai, {
    color: '#06b6d4',
    weight: 2,
    opacity: 0.6,
  }).addTo(map);

  leaflet.marker([18.22, 100.25] as [number, number], {
    icon: leaflet.divIcon({
      className: 'river-label',
      html: '<div style="color:#22d3ee;font-size:0.6rem;font-weight:500;white-space:nowrap;text-shadow:0 0 4px #0a0e1a;">Mae Lai</div>',
      iconSize: [60, 20],
    }),
  }).addTo(map);
}

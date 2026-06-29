'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { FLOW_ROUTES, getStatusColor, formatDischarge, formatPercent } from '@/lib/constants';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function UpstreamStatus() {
  const stations = useSelector((s: RootState) => s.dashboard.stations);

  // Get upstream stations (exclude Y.1C itself and KS.1)
  const upstreamIds = ['Y.20', 'KY.1', 'Y.38', 'KM.1', 'Y.34', 'KS.1'];

  return (
    <div id="upstream-status">
      {/* Section Header */}
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Upstream Station Network Status
      </div>
      <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: 10 }}>
        Hydrograph superposition & tributary monitoring
      </div>

      {/* Flow Routes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {FLOW_ROUTES.map((route) => (
          <div
            key={route.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              background: 'rgba(6, 182, 212, 0.06)',
              borderRadius: 6,
              border: '1px solid rgba(6, 182, 212, 0.15)',
              fontSize: '0.65rem',
            }}
          >
            <span style={{ color: '#06b6d4', fontWeight: 600, minWidth: 60 }}>{route.name}:</span>
            <span className="flow-arrow">{route.label}</span>
          </div>
        ))}
      </div>

      {/* Station Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {upstreamIds.map((id) => {
          const station = stations[id];
          if (!station) return null;

          const color = getStatusColor(station.status);
          const isSensor = station.type === 'sensor';

          // Sparkline data
          const sparkData = station.history.slice(-20).map((d) => ({ v: d.value }));

          return (
            <div
              key={id}
              className="kpi-chip"
              id={`upstream-${id}`}
              style={{
                borderColor: `${color}30`,
                position: 'relative',
                overflow: 'hidden',
                padding: '8px 10px',
              }}
            >
              {/* Top color accent */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 2,
                background: color,
              }} />

              {/* Station ID + Status dot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#e2e8f0' }}>{id}</span>
                <div className={`status-dot ${station.status}`} style={{ width: 8, height: 8 }} />
              </div>

              {/* Sparkline */}
              <div style={{ height: 30, marginBottom: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkData}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={color}
                      strokeWidth={1.5}
                      dot={false}
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Metrics */}
              {isSensor ? (
                <>
                  <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Soil Moisture</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#06b6d4' }}>
                    {station.soilMoisture?.toFixed(1) ?? 'N/A'}%
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: 2 }}>
                    Wind: {station.windSpeed?.toFixed(1) ?? 'N/A'} m/s
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.55rem', color: '#64748b' }}>Q</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>
                      {formatDischarge(station.discharge)}
                    </span>
                    <span style={{ fontSize: '0.5rem', color: '#64748b' }}>cms</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 }}>
                    <span style={{ fontSize: '0.55rem', color: '#64748b' }}>Cap</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: station.capacityPercent > 100 ? '#ef4444' :
                             station.capacityPercent > 80 ? '#f97316' : '#94a3b8',
                    }}>
                      {formatPercent(station.capacityPercent)}%
                    </span>
                  </div>
                </>
              )}

              {/* Station Name */}
              <div style={{ fontSize: '0.5rem', color: '#475569', marginTop: 3, lineHeight: 1.2 }}>
                {station.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

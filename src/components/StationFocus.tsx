'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import {
  getStatusColor,
  getStatusLabel,
  getStatusAction,
  formatDischarge,
  formatWaterLevel,
  formatPercent,
  Y1C_CHANNEL_CAPACITY,
  ALERT_THRESHOLDS,
} from '@/lib/constants';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

export default function StationFocus() {
  const stations = useSelector((s: RootState) => s.dashboard.stations);
  const statusHistory = useSelector((s: RootState) => s.dashboard.statusHistory);
  const y1c = stations['Y.1C'];

  if (!y1c) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="card-header">
          <div className="status-dot safe" />
          Station Y.1C — Ban Nam Khong
        </div>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading station data...</div>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(y1c.status);
  const statusLabel = getStatusLabel(y1c.status);
  const statusAction = getStatusAction(y1c.status);

  const trendIcon = y1c.trendDirection === 'rising' ? '↑' :
                     y1c.trendDirection === 'falling' ? '↓' : '→';
  const trendColorClass = y1c.trendDirection === 'rising' ? 'trend-up' :
                           y1c.trendDirection === 'falling' ? 'trend-down' : 'trend-stable';

  // Format chart data
  const chartData = y1c.history.map((d) => ({
    time: new Date(d.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    discharge: d.value,
    waterLevel: d.waterLevel,
  }));

  // Last status change
  const lastChange = statusHistory.length > 0 ? statusHistory[statusHistory.length - 1] : null;

  return (
    <div className="card" id="station-focus" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="card-header" style={{ borderBottom: `2px solid ${statusColor}40` }}>
        <div className={`status-dot ${y1c.status}`} />
        <span>Station Y.1C — Ban Nam Khong</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#64748b' }}>
          Primary Chokepoint
        </span>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
        {/* Status Banner */}
        <div
          id="y1c-status-banner"
          style={{
            background: `linear-gradient(135deg, ${statusColor}15, ${statusColor}08)`,
            border: `1px solid ${statusColor}40`,
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: statusColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {statusLabel}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>
              {statusAction}
            </div>
          </div>
          <div className={`badge badge-${y1c.status}`}>
            {statusLabel}
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {/* Discharge */}
          <div className="kpi-chip" id="kpi-discharge">
            <span className="kpi-label">Discharge</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="kpi-value" style={{ color: statusColor, fontSize: '1.6rem' }}>
                {formatDischarge(y1c.discharge)}
              </span>
              <span className="kpi-unit">cms</span>
            </div>
            <span className={`${trendColorClass}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
              {trendIcon} Trend {y1c.trendDirection}
            </span>
          </div>

          {/* Water Level */}
          <div className="kpi-chip" id="kpi-water-level">
            <span className="kpi-label">Water Level</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="kpi-value" style={{ fontSize: '1.6rem' }}>
                {formatWaterLevel(y1c.waterLevel)}
              </span>
              <span className="kpi-unit">m MSL</span>
            </div>
            <span className={`${trendColorClass}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
              Δ {y1c.trend > 0 ? '+' : ''}{y1c.trend.toFixed(2)} m/3hr
            </span>
          </div>

          {/* Channel Capacity */}
          <div className="kpi-chip" id="kpi-capacity">
            <span className="kpi-label">Channel Capacity</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="kpi-value" style={{
                color: y1c.capacityPercent > 100 ? '#ef4444' :
                       y1c.capacityPercent > 80 ? '#f97316' : '#22c55e',
                fontSize: '1.6rem',
              }}>
                {formatPercent(y1c.capacityPercent)}
              </span>
              <span className="kpi-unit">%</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
              of {Y1C_CHANNEL_CAPACITY} cms
            </span>
          </div>

          {/* Operational Status */}
          <div className="kpi-chip" id="kpi-operational">
            <span className="kpi-label">Operational Status</span>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: statusColor, marginTop: 2 }}>
              {y1c.capacityPercent > 100 ? 'OVER CAPACITY' :
               y1c.capacityPercent > 80 ? 'NEAR CAPACITY' : 'NORMAL'}
            </div>
            {lastChange && (
              <span style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 2 }}>
                Last change: {new Date(lastChange.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div style={{ padding: '0 2px' }}>
          <div style={{
            height: 6,
            borderRadius: 3,
            background: '#1e293b',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(y1c.capacityPercent, 100)}%`,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${getStatusColor('safe')}, ${statusColor})`,
              transition: 'width 0.5s ease',
            }} />
            {/* Threshold markers */}
            <div style={{ position: 'absolute', left: '80%', top: 0, bottom: 0, width: 1, background: '#eab30880' }} />
            <div style={{ position: 'absolute', left: '100%', top: 0, bottom: 0, width: 1, background: '#f9731680' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#64748b', marginTop: 3 }}>
            <span>0</span>
            <span style={{ color: '#eab308' }}>834 (Watch)</span>
            <span style={{ color: '#f97316' }}>1042 (Warn)</span>
            <span style={{ color: '#ef4444' }}>1250 (Emer)</span>
          </div>
        </div>

        {/* 24-hour Discharge Chart */}
        <div style={{ flex: 1, minHeight: 140 }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
            24-Hour Discharge Trend
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="dischargeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={statusColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={statusColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: '#64748b' }}
                axisLine={{ stroke: '#2a3a4e' }}
                tickLine={false}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#64748b' }}
                axisLine={{ stroke: '#2a3a4e' }}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a2332',
                  border: '1px solid #2a3a4e',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  color: '#e2e8f0',
                }}
              />
              {/* Threshold reference lines */}
              <ReferenceLine y={ALERT_THRESHOLDS.safe.max} stroke="#eab30860" strokeDasharray="4 4" />
              <ReferenceLine y={ALERT_THRESHOLDS.watch.max} stroke="#f9731660" strokeDasharray="4 4" />
              <ReferenceLine y={ALERT_THRESHOLDS.warning.max} stroke="#ef444460" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="discharge"
                stroke={statusColor}
                fill="url(#dischargeGradient)"
                strokeWidth={2}
                dot={false}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Data Sources */}
        <div style={{
          display: 'flex',
          gap: 12,
          fontSize: '0.6rem',
          color: '#64748b',
          borderTop: '1px solid #2a3a4e',
          paddingTop: 8,
          flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: '#8b5cf6' }} />
            RID APIs
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: '#3b82f6' }} />
            HII APIs
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: '#06b6d4' }} />
            RIKA/Haiwell Cloud
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import {
  getStatusColor,
  getStatusLabel,
  formatDischarge,
  formatWaterLevel,
  formatPercent,
  Y1C_CHANNEL_CAPACITY,
} from '@/lib/constants';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export default function ForecastTimeline() {
  const forecasts = useSelector((s: RootState) => s.dashboard.forecasts);

  if (!forecasts || forecasts.length === 0) {
    return (
      <div id="forecast-timeline">
        <div style={{ color: '#64748b', fontSize: '0.8rem', padding: 16 }}>
          Loading forecasts...
        </div>
      </div>
    );
  }

  return (
    <div id="forecast-timeline">
      {/* Section Header */}
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        AI Multi-Horizon Predictive Forecast
      </div>
      <div style={{ fontSize: '0.58rem', color: '#64748b', marginBottom: 10, lineHeight: 1.4 }}>
        Multi-input LSTM: Q<sub>Y1C</sub>(t+h) = f(Q<sub>Y20</sub>, Q<sub>KM1</sub>, Q<sub>Y38</sub>, Q<sub>KL1</sub>, Q<sub>Y34</sub>, Q<sub>KY1</sub>, Rain, dQ/dt)
      </div>

      {/* Forecast Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {forecasts.map((forecast) => {
          const color = getStatusColor(forecast.status);
          const label = getStatusLabel(forecast.status);

          // Chart data
          const chartData = forecast.trend.map((d) => {
            const time = new Date(d.time);
            return {
              time: time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
              discharge: d.value,
              upper: d.value * (1 + forecast.uncertaintyPercent / 100),
              lower: d.value * (1 - forecast.uncertaintyPercent / 100),
            };
          });

          const isExceedWarning = forecast.predictedDischarge > Y1C_CHANNEL_CAPACITY;

          return (
            <div
              key={forecast.horizon}
              className={`forecast-card ${forecast.status}`}
              id={`forecast-${forecast.horizon}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                {/* Left: Horizon Label */}
                <div>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <span style={{
                      background: `${color}20`,
                      color,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}>
                      {forecast.horizon}
                    </span>
                    {forecast.horizon === '1h' ? '1-hour' : forecast.horizon === '3h' ? '3-hour' : '6-hour'} Forecast
                  </div>
                  {isExceedWarning && (
                    <div style={{
                      fontSize: '0.6rem',
                      color: '#ef4444',
                      fontWeight: 600,
                      marginTop: 4,
                      animation: 'blink-alert 1.5s ease-in-out infinite',
                    }}>
                      ⚠ Exceeds channel capacity ({Y1C_CHANNEL_CAPACITY} cms)
                    </div>
                  )}
                </div>

                {/* Right: Predicted Discharge */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.55rem', color: '#64748b', textTransform: 'uppercase' }}>
                    Predicted Discharge
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color }}>
                    {formatDischarge(forecast.predictedDischarge)}
                    <span style={{ fontSize: '0.6rem', fontWeight: 400, color: '#94a3b8' }}> cms</span>
                  </div>
                </div>
              </div>

              {/* Metrics Row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, background: 'rgba(10, 14, 26, 0.4)', borderRadius: 6, padding: '5px 8px' }}>
                  <div style={{ fontSize: '0.5rem', color: '#64748b' }}>Water Level</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
                    {formatWaterLevel(forecast.predictedWaterLevel)}
                    <span style={{ fontSize: '0.5rem', color: '#64748b' }}> m</span>
                  </div>
                </div>
                <div style={{ flex: 1, background: 'rgba(10, 14, 26, 0.4)', borderRadius: 6, padding: '5px 8px' }}>
                  <div style={{ fontSize: '0.5rem', color: '#64748b' }}>Capacity</div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: forecast.forecastCapacityPercent > 100 ? '#ef4444' :
                           forecast.forecastCapacityPercent > 80 ? '#f97316' : '#22c55e',
                  }}>
                    {formatPercent(forecast.forecastCapacityPercent)}
                    <span style={{ fontSize: '0.5rem', color: '#64748b' }}> %</span>
                  </div>
                </div>
                <div style={{ flex: 1, background: 'rgba(10, 14, 26, 0.4)', borderRadius: 6, padding: '5px 8px' }}>
                  <div style={{ fontSize: '0.5rem', color: '#64748b' }}>Status</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color }}>
                    {label}
                  </div>
                </div>
                <div style={{ flex: 1, background: 'rgba(10, 14, 26, 0.4)', borderRadius: 6, padding: '5px 8px' }}>
                  <div style={{ fontSize: '0.5rem', color: '#64748b' }}>Uncertainty</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b5cf6' }}>
                    ±{forecast.uncertaintyPercent}%
                  </div>
                </div>
              </div>

              {/* Mini Chart with Confidence Band */}
              <div style={{ height: 70 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <defs>
                      <linearGradient id={`grad-${forecast.horizon}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id={`conf-${forecast.horizon}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        background: '#1a2332',
                        border: '1px solid #2a3a4e',
                        borderRadius: 6,
                        fontSize: '0.7rem',
                        color: '#e2e8f0',
                      }}
                    />
                    {/* Confidence band */}
                    <Area
                      type="monotone"
                      dataKey="upper"
                      stroke="none"
                      fill={`url(#conf-${forecast.horizon})`}
                      animationDuration={500}
                    />
                    <Area
                      type="monotone"
                      dataKey="lower"
                      stroke="none"
                      fill="transparent"
                      animationDuration={500}
                    />
                    {/* Channel capacity reference */}
                    <ReferenceLine
                      y={Y1C_CHANNEL_CAPACITY}
                      stroke="#f9731640"
                      strokeDasharray="4 4"
                    />
                    {/* Main forecast line */}
                    <Area
                      type="monotone"
                      dataKey="discharge"
                      stroke={color}
                      fill={`url(#grad-${forecast.horizon})`}
                      strokeWidth={2}
                      dot={false}
                      animationDuration={500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Confidence interval label */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span className="confidence-label">
                  CI: {formatDischarge(forecast.confidenceLower)} – {formatDischarge(forecast.confidenceUpper)} cms
                </span>
                <span style={{ fontSize: '0.55rem', color: '#475569' }}>
                  {new Date(forecast.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

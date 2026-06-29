'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updateStations, updateForecasts, setConnectionStatus } from '@/lib/store';
import { fetchAllStationData } from '@/lib/api';
import { CRITICAL_POLL_INTERVAL } from '@/lib/constants';
import Header from './Header';
import MapPanel from './MapPanel';
import StationFocus from './StationFocus';
import UpstreamStatus from './UpstreamStatus';
import ForecastTimeline from './ForecastTimeline';

export default function Dashboard() {
  const dispatch = useDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstLoad = useRef(true);

  // ===== DATA POLLING =====
  const pollData = useCallback(async () => {
    try {
      const { stations, forecasts } = await fetchAllStationData();
      dispatch(updateStations(stations));
      dispatch(updateForecasts(forecasts));
      dispatch(setConnectionStatus(true));
    } catch (error) {
      console.error('[Dashboard] Data poll failed:', error);
      dispatch(setConnectionStatus(false));
    }
  }, [dispatch]);

  useEffect(() => {
    // Initial load
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      pollData();
    }

    // Set up polling interval
    intervalRef.current = setInterval(pollData, CRITICAL_POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollData]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />

      <main className="dashboard-grid">
        {/* LEFT PANEL: Interactive Map */}
        <div style={{ minHeight: 0 }}>
          <MapPanel />
        </div>

        {/* CENTER PANEL: Station Y.1C Focus */}
        <div style={{ minHeight: 0 }}>
          <StationFocus />
        </div>

        {/* RIGHT PANEL: Upstream + AI Forecast */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className="card-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Upstream Network & AI Forecast
          </div>
          <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
            <UpstreamStatus />
            <ForecastTimeline />
          </div>
        </div>
      </main>
    </div>
  );
}

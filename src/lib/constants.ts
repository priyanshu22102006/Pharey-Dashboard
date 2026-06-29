import { AlertStatus, FlowRoute } from './types';

// ===== ALERT THRESHOLDS FOR Y.1C =====
export const Y1C_CHANNEL_CAPACITY = 1042; // cms baseline

export const ALERT_THRESHOLDS = {
  safe:      { max: 834,  color: '#22c55e', label: 'Safe',      action: 'No alert' },
  watch:     { max: 1042, color: '#eab308', label: 'Watch',     action: 'Monitor closely' },
  warning:   { max: 1250, color: '#f97316', label: 'Warning',   action: 'Alert authorities' },
  emergency: { max: Infinity, color: '#ef4444', label: 'Emergency', action: 'Activate emergency protocols' },
} as const;

// ===== STATION DEFINITIONS =====
// Coordinates based on Phrae Province hydrological network
export const STATION_DEFINITIONS = {
  'Y.20': {
    name: 'Mae Yom Weir',
    nameThai: 'เขื่อนแม่ยม',
    lat: 18.3850,
    lng: 100.0750,
    channelCapacity: 1500,
    type: 'mainstream' as const,
  },
  'KY.1': {
    name: 'Tha Kham Bridge',
    nameThai: 'สะพานท่าขาม',
    lat: 18.2180,
    lng: 100.1050,
    channelCapacity: 1200,
    type: 'mainstream' as const,
  },
  'Y.1C': {
    name: 'Ban Nam Khong',
    nameThai: 'บ้านน้ำโค้ง',
    lat: 18.1500,
    lng: 100.1400,
    channelCapacity: 1042,
    type: 'mainstream' as const,
  },
  'Y.38': {
    name: 'Mae Kham Mi (Upper)',
    nameThai: 'แม่คำมี (ต้นน้ำ)',
    lat: 18.3100,
    lng: 100.2100,
    channelCapacity: 350,
    type: 'tributary' as const,
  },
  'KM.1': {
    name: 'Mae Kham Mi Bridge',
    nameThai: 'สะพานแม่คำมี',
    lat: 18.2800,
    lng: 100.1700,
    channelCapacity: 400,
    type: 'tributary' as const,
  },
  'Y.34': {
    name: 'Mae Lai (Upper)',
    nameThai: 'แม่ลาย (ต้นน้ำ)',
    lat: 18.2000,
    lng: 100.2200,
    channelCapacity: 300,
    type: 'tributary' as const,
  },
  'KL.1': {
    name: 'Mae Lai Bridge',
    nameThai: 'สะพานแม่ลาย',
    lat: 18.1900,
    lng: 100.1800,
    channelCapacity: 320,
    type: 'tributary' as const,
  },
  'KS.1': {
    name: 'Suan Khuean',
    nameThai: 'สวนเขือน',
    lat: 18.1200,
    lng: 100.2000,
    channelCapacity: 0,
    type: 'sensor' as const,
  },
} as const;

// ===== FLOW ROUTES =====
export const FLOW_ROUTES: FlowRoute[] = [
  {
    name: 'Mainstream',
    stations: ['Y.20', 'KY.1', 'Y.1C'],
    label: 'Y.20 → KY.1 → Y.1C',
  },
  {
    name: 'Mae Kham Mi',
    stations: ['Y.38', 'KM.1'],
    label: 'Y.38 → KM.1',
  },
  {
    name: 'Mae Lai',
    stations: ['Y.34', 'KL.1'],
    label: 'Y.34 → KL.1',
  },
];

// ===== MAP CONFIG =====
export const MAP_CENTER: [number, number] = [18.24, 100.15];
export const MAP_ZOOM = 11;

// ===== POLLING INTERVALS =====
export const CRITICAL_POLL_INTERVAL = 60_000;   // 1 minute
export const FORECAST_POLL_INTERVAL = 300_000;  // 5 minutes

// ===== DATA STALENESS THRESHOLD =====
export const STALE_THRESHOLD_MS = 180_000; // 3 minutes

// ===== HELPER: Determine alert status from discharge =====
export function getAlertStatus(discharge: number): AlertStatus {
  if (discharge < 834) return 'safe';
  if (discharge <= 1042) return 'watch';
  if (discharge <= 1250) return 'warning';
  return 'emergency';
}

export function getStatusColor(status: AlertStatus): string {
  return ALERT_THRESHOLDS[status].color;
}

export function getStatusLabel(status: AlertStatus): string {
  return ALERT_THRESHOLDS[status].label;
}

export function getStatusAction(status: AlertStatus): string {
  return ALERT_THRESHOLDS[status].action;
}

// ===== FORMAT HELPERS =====
export function formatDischarge(v: number): string {
  return v.toFixed(0);
}

export function formatWaterLevel(v: number): string {
  return v.toFixed(2);
}

export function formatPercent(v: number): string {
  return v.toFixed(1);
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

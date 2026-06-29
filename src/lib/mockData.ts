import { StationReading, ForecastHorizon, DataPoint, AlertStatus } from './types';
import { STATION_DEFINITIONS, getAlertStatus, Y1C_CHANNEL_CAPACITY } from './constants';

// ===== REALISTIC MOCK DATA GENERATOR =====
// Simulates realistic flood-scenario data for Phrae Province

// Time-varying base flow with sinusoidal pattern + random walk
let mockTick = 0;
let baseFlowFactor = 0.85; // Start near Watch level for dramatic display

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Generate 24-hour historical data with realistic hydrograph shape
function generateHistory(currentValue: number, points: number = 48): DataPoint[] {
  const history: DataPoint[] = [];
  const now = Date.now();
  const interval = (24 * 60 * 60 * 1000) / points;

  // Create a rising hydrograph that approaches current value
  const baseValue = currentValue * 0.6;
  const riseStart = Math.floor(points * 0.3);

  for (let i = 0; i < points; i++) {
    const time = new Date(now - (points - i) * interval).toISOString();
    let value: number;

    if (i < riseStart) {
      // Stable baseflow period
      value = jitter(baseValue, baseValue * 0.05);
    } else {
      // Rising limb - sigmoid-like curve
      const progress = (i - riseStart) / (points - riseStart);
      const sigmoid = 1 / (1 + Math.exp(-8 * (progress - 0.5)));
      value = baseValue + (currentValue - baseValue) * sigmoid;
      value = jitter(value, currentValue * 0.03);
    }

    const wl = valueToWaterLevel(value);
    history.push({
      time,
      value: Math.round(value * 10) / 10,
      waterLevel: Math.round(wl * 100) / 100,
    });
  }

  return history;
}

// Approximate water level from discharge using Manning's equation approximation
function valueToWaterLevel(discharge: number): number {
  // Simplified stage-discharge relationship for Yom River
  return 8.0 + Math.pow(discharge / 120, 0.6);
}

// Generate station readings
function generateStationReading(stationId: string): StationReading {
  const def = STATION_DEFINITIONS[stationId as keyof typeof STATION_DEFINITIONS];
  if (!def) throw new Error(`Unknown station: ${stationId}`);

  // Calculate discharge based on station type and position in network
  let discharge: number;
  const phase = mockTick * 0.02;

  switch (stationId) {
    case 'Y.20':
      discharge = jitter(650 * baseFlowFactor + Math.sin(phase) * 80, 30);
      break;
    case 'KY.1':
      discharge = jitter(780 * baseFlowFactor + Math.sin(phase + 0.5) * 90, 25);
      break;
    case 'Y.1C':
      // Primary chokepoint - sum of upstream contributions
      discharge = jitter(950 * baseFlowFactor + Math.sin(phase + 1) * 120, 40);
      break;
    case 'Y.38':
      discharge = jitter(180 * baseFlowFactor + Math.sin(phase + 0.3) * 40, 15);
      break;
    case 'KM.1':
      discharge = jitter(220 * baseFlowFactor + Math.sin(phase + 0.7) * 45, 12);
      break;
    case 'Y.34':
      discharge = jitter(150 * baseFlowFactor + Math.sin(phase + 0.4) * 35, 10);
      break;
    case 'KL.1':
      discharge = jitter(170 * baseFlowFactor + Math.sin(phase + 0.8) * 38, 10);
      break;
    case 'KS.1':
      discharge = 0; // Sensor station, no discharge
      break;
    default:
      discharge = 0;
  }

  discharge = Math.max(0, discharge);
  const capacityPercent = def.channelCapacity > 0
    ? (discharge / def.channelCapacity) * 100
    : 0;

  const waterLevel = stationId === 'KS.1' ? 0 : valueToWaterLevel(discharge);
  const trend = jitter(0.15, 0.3);
  const trendDirection = trend > 0.1 ? 'rising' as const :
                         trend < -0.1 ? 'falling' as const : 'stable' as const;

  const status = stationId === 'KS.1' ? 'safe' as AlertStatus :
    getAlertStatus(discharge * (Y1C_CHANNEL_CAPACITY / (def.channelCapacity || 1042)));

  const history = generateHistory(discharge);

  return {
    stationId,
    name: def.name,
    nameThai: def.nameThai,
    lat: def.lat,
    lng: def.lng,
    waterLevel: Math.round(waterLevel * 100) / 100,
    discharge: Math.round(discharge * 10) / 10,
    channelCapacity: def.channelCapacity,
    capacityPercent: Math.round(capacityPercent * 10) / 10,
    trend: Math.round(trend * 100) / 100,
    trendDirection,
    status,
    timestamp: new Date().toISOString(),
    type: def.type,
    rainfall: stationId === 'KS.1' ? undefined : jitter(12, 20),
    soilMoisture: stationId === 'KS.1' ? jitter(72, 15) : undefined,
    windSpeed: stationId === 'KS.1' ? jitter(3.5, 3) : undefined,
    history,
  };
}

// Generate forecast horizons
function generateForecasts(currentDischarge: number): ForecastHorizon[] {
  const horizons = [
    { horizon: '1h', hours: 1 },
    { horizon: '3h', hours: 3 },
    { horizon: '6h', hours: 6 },
  ];

  return horizons.map(({ horizon, hours }) => {
    // Forecasts show increasing discharge (flood approaching scenario)
    const growthRate = 1 + (0.06 * hours * baseFlowFactor);
    const predictedDischarge = clamp(
      jitter(currentDischarge * growthRate, currentDischarge * 0.02),
      0, 2000
    );
    const predictedWaterLevel = valueToWaterLevel(predictedDischarge);
    const forecastCapacityPercent = (predictedDischarge / Y1C_CHANNEL_CAPACITY) * 100;
    const uncertaintyPercent = 3 + hours * 2.5; // Uncertainty grows with horizon

    // Generate forecast trend
    const trend: DataPoint[] = [];
    for (let i = 0; i <= hours * 4; i++) {
      const t = new Date(Date.now() + i * 15 * 60 * 1000).toISOString();
      const progress = i / (hours * 4);
      const v = currentDischarge + (predictedDischarge - currentDischarge) * progress;
      trend.push({
        time: t,
        value: Math.round(jitter(v, v * 0.02) * 10) / 10,
        waterLevel: Math.round(valueToWaterLevel(v) * 100) / 100,
      });
    }

    return {
      horizon,
      hours,
      predictedDischarge: Math.round(predictedDischarge * 10) / 10,
      predictedWaterLevel: Math.round(predictedWaterLevel * 100) / 100,
      forecastCapacityPercent: Math.round(forecastCapacityPercent * 10) / 10,
      confidenceUpper: Math.round(predictedDischarge * (1 + uncertaintyPercent / 100) * 10) / 10,
      confidenceLower: Math.round(predictedDischarge * (1 - uncertaintyPercent / 100) * 10) / 10,
      uncertaintyPercent: Math.round(uncertaintyPercent * 10) / 10,
      status: getAlertStatus(predictedDischarge),
      trend,
      timestamp: new Date().toISOString(),
    };
  });
}

// ===== MAIN MOCK DATA FUNCTION =====
export function generateMockData(): {
  stations: Record<string, StationReading>;
  forecasts: ForecastHorizon[];
} {
  mockTick++;

  // Slowly vary the base flow factor for realistic dynamics
  baseFlowFactor = clamp(
    baseFlowFactor + (Math.random() - 0.48) * 0.01,
    0.65,
    1.35
  );

  const stationIds = Object.keys(STATION_DEFINITIONS);
  const stations: Record<string, StationReading> = {};

  for (const id of stationIds) {
    stations[id] = generateStationReading(id);
  }

  // Use Y.1C's actual discharge for forecasts
  const y1cDischarge = stations['Y.1C']?.discharge ?? 900;
  const forecasts = generateForecasts(y1cDischarge);

  return { stations, forecasts };
}

// ===== INITIAL DATA (for SSR/first paint) =====
export function getInitialMockData() {
  return generateMockData();
}

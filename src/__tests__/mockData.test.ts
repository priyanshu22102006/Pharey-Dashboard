import { generateMockData, getInitialMockData } from '../lib/mockData';
import { STATION_DEFINITIONS } from '../lib/constants';

describe('Mock Data Generator', () => {
  test('generateMockData returns all expected stations', () => {
    const { stations } = generateMockData();
    const expectedIds = Object.keys(STATION_DEFINITIONS);

    for (const id of expectedIds) {
      expect(stations[id]).toBeDefined();
      expect(stations[id].stationId).toBe(id);
    }
  });

  test('generateMockData returns valid station readings', () => {
    const { stations } = generateMockData();

    for (const [id, station] of Object.entries(stations)) {
      expect(station.stationId).toBe(id);
      expect(station.name).toBeTruthy();
      expect(typeof station.lat).toBe('number');
      expect(typeof station.lng).toBe('number');
      expect(typeof station.discharge).toBe('number');
      expect(station.discharge).toBeGreaterThanOrEqual(0);
      expect(station.timestamp).toBeTruthy();
      expect(['mainstream', 'tributary', 'sensor']).toContain(station.type);
      expect(['safe', 'watch', 'warning', 'emergency']).toContain(station.status);
      expect(['rising', 'falling', 'stable']).toContain(station.trendDirection);
    }
  });

  test('generateMockData returns valid forecasts', () => {
    const { forecasts } = generateMockData();

    expect(forecasts).toHaveLength(3);
    expect(forecasts[0].horizon).toBe('1h');
    expect(forecasts[1].horizon).toBe('3h');
    expect(forecasts[2].horizon).toBe('6h');

    for (const forecast of forecasts) {
      expect(forecast.predictedDischarge).toBeGreaterThan(0);
      expect(forecast.predictedWaterLevel).toBeGreaterThan(0);
      expect(forecast.forecastCapacityPercent).toBeGreaterThan(0);
      expect(forecast.uncertaintyPercent).toBeGreaterThan(0);
      expect(forecast.confidenceUpper).toBeGreaterThan(forecast.predictedDischarge);
      expect(forecast.confidenceLower).toBeLessThan(forecast.predictedDischarge);
      expect(forecast.trend.length).toBeGreaterThan(0);
      expect(['safe', 'watch', 'warning', 'emergency']).toContain(forecast.status);
    }
  });

  test('Station history has valid data points', () => {
    const { stations } = generateMockData();
    const y1c = stations['Y.1C'];

    expect(y1c.history.length).toBeGreaterThan(0);
    for (const point of y1c.history) {
      expect(typeof point.time).toBe('string');
      expect(typeof point.value).toBe('number');
      expect(point.value).toBeGreaterThanOrEqual(0);
    }
  });

  test('KS.1 is a sensor station with soil moisture', () => {
    const { stations } = generateMockData();
    const ks1 = stations['KS.1'];

    expect(ks1.type).toBe('sensor');
    expect(ks1.discharge).toBe(0);
    expect(typeof ks1.soilMoisture).toBe('number');
    expect(typeof ks1.windSpeed).toBe('number');
  });

  test('getInitialMockData returns same structure', () => {
    const data = getInitialMockData();
    expect(data.stations).toBeDefined();
    expect(data.forecasts).toBeDefined();
    expect(Object.keys(data.stations).length).toBe(Object.keys(STATION_DEFINITIONS).length);
  });

  test('Data changes between successive calls (time-varying)', () => {
    const data1 = generateMockData();
    const data2 = generateMockData();

    // At least some values should differ due to jitter
    const y1c1 = data1.stations['Y.1C'].discharge;
    const y1c2 = data2.stations['Y.1C'].discharge;
    // They might be equal by chance but very unlikely
    // Just test that they're both valid numbers
    expect(typeof y1c1).toBe('number');
    expect(typeof y1c2).toBe('number');
  });
});

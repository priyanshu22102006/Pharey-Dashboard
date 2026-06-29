import { getAlertStatus, getStatusColor, getStatusLabel, getStatusAction, formatDischarge, formatWaterLevel, formatPercent } from '../lib/constants';

// ===== ALERT THRESHOLD LOGIC TESTS =====
describe('Alert Threshold Logic', () => {
  test('Discharge < 834 should be Safe', () => {
    expect(getAlertStatus(0)).toBe('safe');
    expect(getAlertStatus(500)).toBe('safe');
    expect(getAlertStatus(833)).toBe('safe');
    expect(getAlertStatus(833.99)).toBe('safe');
  });

  test('Discharge >= 834 and <= 1042 should be Watch', () => {
    expect(getAlertStatus(834)).toBe('watch');
    expect(getAlertStatus(900)).toBe('watch');
    expect(getAlertStatus(1042)).toBe('watch');
  });

  test('Discharge > 1042 and <= 1250 should be Warning', () => {
    expect(getAlertStatus(1042.01)).toBe('warning');
    expect(getAlertStatus(1100)).toBe('warning');
    expect(getAlertStatus(1250)).toBe('warning');
  });

  test('Discharge > 1250 should be Emergency', () => {
    expect(getAlertStatus(1250.01)).toBe('emergency');
    expect(getAlertStatus(1500)).toBe('emergency');
    expect(getAlertStatus(2000)).toBe('emergency');
  });

  test('Boundary values are correctly classified', () => {
    // 834 boundary
    expect(getAlertStatus(833.99)).toBe('safe');
    expect(getAlertStatus(834)).toBe('watch');

    // 1042 boundary
    expect(getAlertStatus(1042)).toBe('watch');
    expect(getAlertStatus(1042.01)).toBe('warning');

    // 1250 boundary
    expect(getAlertStatus(1250)).toBe('warning');
    expect(getAlertStatus(1250.01)).toBe('emergency');
  });
});

// ===== STATUS HELPERS TESTS =====
describe('Status Helper Functions', () => {
  test('getStatusColor returns correct colors', () => {
    expect(getStatusColor('safe')).toBe('#22c55e');
    expect(getStatusColor('watch')).toBe('#eab308');
    expect(getStatusColor('warning')).toBe('#f97316');
    expect(getStatusColor('emergency')).toBe('#ef4444');
  });

  test('getStatusLabel returns correct labels', () => {
    expect(getStatusLabel('safe')).toBe('Safe');
    expect(getStatusLabel('watch')).toBe('Watch');
    expect(getStatusLabel('warning')).toBe('Warning');
    expect(getStatusLabel('emergency')).toBe('Emergency');
  });

  test('getStatusAction returns correct action descriptions', () => {
    expect(getStatusAction('safe')).toBe('No alert');
    expect(getStatusAction('watch')).toBe('Monitor closely');
    expect(getStatusAction('warning')).toBe('Alert authorities');
    expect(getStatusAction('emergency')).toBe('Activate emergency protocols');
  });
});

// ===== FORMAT HELPERS TESTS =====
describe('Format Helper Functions', () => {
  test('formatDischarge formats to 0 decimal places', () => {
    expect(formatDischarge(1042.567)).toBe('1043');
    expect(formatDischarge(0)).toBe('0');
    expect(formatDischarge(834)).toBe('834');
  });

  test('formatWaterLevel formats to 2 decimal places', () => {
    expect(formatWaterLevel(14.8)).toBe('14.80');
    expect(formatWaterLevel(14.856)).toBe('14.86');
  });

  test('formatPercent formats to 1 decimal place', () => {
    expect(formatPercent(80.0)).toBe('80.0');
    expect(formatPercent(102.456)).toBe('102.5');
  });
});

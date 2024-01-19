import {checkCandleStartTime} from "./time.js";


test('test check candle start time 1m', () => {
    const d = new Date('2024-01-19T03:58:28.089Z');
    const tms = d.getTime();
    expect(checkCandleStartTime(tms, '1m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '3m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '5m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '10m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '15m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '30m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '4h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1d')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1w')).toBeFalsy()
});

test('test check candle start time 3m', () => {
    let d = new Date('2024-01-19T05:03:28.089Z');
    let tms = d.getTime();
    expect(checkCandleStartTime(tms, '1m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '3m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '5m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '10m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '15m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '30m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '4h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1d')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1w')).toBeFalsy()

    d = new Date('2024-01-19T05:11:28.089Z');
    tms = d.getTime();
    expect(checkCandleStartTime(tms, '3m')).toBeFalsy()
});

test('test check candle start time 5m', () => {
    const d = new Date('2024-01-19T05:05:28.089Z');
    const tms = d.getTime();
    expect(checkCandleStartTime(tms, '1m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '3m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '5m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '10m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '15m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '30m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '4h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1d')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1w')).toBeFalsy()
});

test('test check candle start time 10m', () => {
    const d = new Date('2024-01-19T05:40:28.089Z');
    const tms = d.getTime();
    expect(checkCandleStartTime(tms, '1m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '3m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '5m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '10m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '15m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '30m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '4h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1d')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1w')).toBeFalsy()
});

test('test check candle start time 15m', () => {
    const d = new Date('2024-01-19T05:45:28.089Z');
    const tms = d.getTime();
    expect(checkCandleStartTime(tms, '1m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '3m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '5m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '10m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '15m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '30m')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '4h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1d')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1w')).toBeFalsy()
});

test('test check candle start time 30m', () => {
    const d = new Date('2024-01-19T05:30:28.089Z');
    const tms = d.getTime();
    expect(checkCandleStartTime(tms, '1m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '3m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '5m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '10m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '15m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '30m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '1h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '4h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1d')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1w')).toBeFalsy()
});

test('test check candle start time 1hour', () => {
    const d = new Date('2024-01-19T05:00:00.089Z');
    const tms = d.getTime();
    expect(checkCandleStartTime(tms, '1m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '3m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '5m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '10m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '15m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '30m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '1h')).toBeTruthy()
    expect(checkCandleStartTime(tms, '4h')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1d')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1w')).toBeFalsy()
});

test('test check candle start time 4hour', () => {
    let d = new Date('2024-01-19T04:00:00.089Z');
    let tms = d.getTime();
    expect(checkCandleStartTime(tms, '1m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '3m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '5m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '10m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '15m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '30m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '1h')).toBeTruthy()
    expect(checkCandleStartTime(tms, '4h')).toBeTruthy()
    expect(checkCandleStartTime(tms, '1d')).toBeFalsy()
    expect(checkCandleStartTime(tms, '1w')).toBeFalsy()

    d = new Date('2024-01-19T07:00:00.089Z');
    tms = d.getTime();
    expect(checkCandleStartTime(tms, '4h')).toBeFalsy()

    d = new Date('2024-01-19T08:00:00.089Z');
    tms = d.getTime();
    expect(checkCandleStartTime(tms, '4h')).toBeTruthy()
});

test('test check candle start time 1d', () => {
    const d = new Date('2024-01-19T00:00:00.089Z');
    const tms = d.getTime();
    expect(checkCandleStartTime(tms, '1m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '3m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '5m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '10m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '15m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '30m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '1h')).toBeTruthy()
    expect(checkCandleStartTime(tms, '4h')).toBeTruthy()
    expect(checkCandleStartTime(tms, '1d')).toBeTruthy()
    expect(checkCandleStartTime(tms, '1w')).toBeFalsy()
});

test('test check candle start time 1w', () => {
    const d = new Date('2024-01-15T00:00:00.089Z');
    const tms = d.getTime();
    expect(checkCandleStartTime(tms, '1m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '3m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '5m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '10m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '15m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '30m')).toBeTruthy()
    expect(checkCandleStartTime(tms, '1h')).toBeTruthy()
    expect(checkCandleStartTime(tms, '4h')).toBeTruthy()
    expect(checkCandleStartTime(tms, '1d')).toBeTruthy()
    expect(checkCandleStartTime(tms, '1w')).toBeTruthy()
});

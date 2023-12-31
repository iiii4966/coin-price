export const ms = 1000
export const minMs = 60 * ms

export const CANDLES = {
    '1m': {
        ms: minMs,
        sampleUnit: '1m',
    },
    '3m': {
        ms: minMs * 3,
        sampleUnit: '3m',
    },
    '5m': {
        ms: minMs * 5,
        sampleUnit: '5m',
    },
    '10m': {
        ms: minMs * 10,
        sampleUnit: '10m',
    },
    '15m': {
        ms: minMs * 15,
        sampleUnit: '15m',
    },
    '30m': {
        ms: minMs * 30,
        sampleUnit: '30m',
    },
    '1h': {
        ms: minMs * 60,
        sampleUnit: '1h',
    },
    '4h': {
        ms: minMs * 60 * 4,
        sampleUnit: '4h',
    },
    '1d': {
        ms: minMs * 60 * 24,
        sampleUnit: '1d',
    },
    '1w': {
        ms: minMs * 60 * 24 * 7,
        sampleUnit: '7d',
    },
}

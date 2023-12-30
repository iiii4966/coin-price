export const ms = 1000
export const minMs = 60 * ms

export const CANDLES = {
    'min': {
        ms: ms,
        sampleUnit: '1m',
    },
    'min3': {
        ms: minMs * 3,
        sampleUnit: '3m',
    },
    'min5': {
        ms: minMs * 5,
        sampleUnit: '5m',
    },
    'min10': {
        ms: minMs * 10,
        sampleUnit: '10m',
    },
    'min15': {
        ms: minMs * 15,
        sampleUnit: '15m',
    },
    'min30': {
        ms: minMs * 30,
        sampleUnit: '30m',
    },
    'hour': {
        ms: minMs * 60,
        sampleUnit: '1h',
    },
    'hour4': {
        ms: minMs * 60 * 4,
        sampleUnit: '4h',
    },
    'day': {
        ms: minMs * 60 * 24,
        sampleUnit: '1d',
    },
    'week': {
        ms: minMs * 60 * 24 * 7,
        sampleUnit: '7d',
    },
}
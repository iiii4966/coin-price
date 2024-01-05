export const ms = 1000
export const minMs = ms * 60
export const hourMs = minMs * 60;
export const dayMs = hourMs * 24;
export const hour6Ms = hourMs * 6;
export const weekMs = dayMs * 7;
export const utcHourMs = hourMs * 9

export const CANDLES = {
    '1m': {
        type: 'minutes',
        value: 1,
        ms: minMs,
        isRegular: true,
        questDB: {
            sampleBy: '1m',
            sampleByBase: '1m',
            partitionBy: 'DAY',
        }
    },
    '3m': {
        type: 'minutes',
        value: 3,
        ms: minMs * 3,
        isRegular: true,
        questDB: {
            sampleBy: '3m',
            sampleByBase: '1m',
            partitionBy: 'MONTH',
        }
    },
    '5m': {
        type: 'minutes',
        value: 5,
        ms: minMs * 5,
        isRegular: true,
        questDB: {
            sampleBy: '5m',
            sampleByBase: '1m',
            partitionBy: 'MONTH',
        }
    },
    '10m': {
        type: 'minutes',
        value: 10,
        ms: minMs * 10,
        isRegular: true,
        questDB: {
            sampleBy: '10m',
            sampleByBase: '1m',
            partitionBy: 'MONTH',
        }
    },
    '15m': {
        type: 'minutes',
        value: 15,
        ms: minMs * 15,
        isRegular: true,
        questDB: {
            sampleBy: '15m',
            sampleByBase: '1m',
            partitionBy: 'MONTH',
        }
    },
    '30m': {
        type: 'minutes',
        value: 30,
        ms: minMs * 30,
        isRegular: true,
        questDB: {
            sampleBy: '30m',
            sampleByBase: '1m',
            partitionBy: 'YEAR',
        }
    },
    '1h': {
        type: 'hours',
        value: 1,
        ms: hourMs,
        isRegular: true,
        questDB: {
            sampleBy: '1h',
            sampleByBase: '1m',
            partitionBy: 'YEAR',
        }
    },
    '2h': {
        type: 'hours',
        value: 2,
        ms: hourMs * 2,
        isRegular: true,
        questDB: {
            sampleBy: '2h',
            sampleByBase: '1h',
            partitionBy: 'YEAR',
        }
    },
    '4h': {
        type: 'hours',
        value: 4,
        ms: hourMs * 4,
        isRegular: true,
        questDB: {
            sampleBy: '4h',
            sampleByBase: '1h',
            partitionBy: 'YEAR',
        }
    },
    '6h': {
        type: 'hours',
        value: 6,
        ms: hourMs * 6,
        isRegular: true,
        questDB: {
            sampleBy: '6h',
            sampleByBase: '1h',
            partitionBy: 'YEAR',
        }
    },
    '12h': {
        type: 'hours',
        value: 12,
        ms: hourMs * 12,
        isRegular: true,
        questDB: {
            sampleBy: '12h',
            sampleByBase: '1h',
            partitionBy: 'YEAR',
        }
    },
    '1d': {
        type: 'day',
        value: 1,
        ms: dayMs,
        isRegular: true,
        questDB: {
            sampleBy: '1d',
            sampleByBase: '1h',
            partitionBy: 'YEAR',
        }
    },
    '1w': {
        type: 'week',
        value: 1,
        ms: weekMs,
        isRegular: false,
        questDB: {
            sampleBy: '7d',
            sampleByBase: '1d',
            partitionBy: 'YEAR',
        }
    },
}

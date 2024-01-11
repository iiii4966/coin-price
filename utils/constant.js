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
        sqlite: {
            unit: 'Min'
        },
        questDB: {
            bithumb: {
                sampleBy: '1m',
                sampleByBase: '1m',
            },
            upbit: {
                sampleBy: '1m',
                sampleByBase: '1m',
            },
            partitionBy: 'WEEK',
        }
    },
    '3m': {
        type: 'minutes',
        value: 3,
        ms: minMs * 3,
        isRegular: true,
        sqlite: {
            unit: 'Min3'
        },
        questDB: {
            bithumb: {
                sampleBy: '3m',
                sampleByBase: '1m',
            },
            upbit: {
                sampleBy: '3m',
                sampleByBase: '1m',
            },
            partitionBy: 'MONTH',
        }
    },
    '5m': {
        type: 'minutes',
        value: 5,
        ms: minMs * 5,
        isRegular: true,
        sqlite: {
            unit: 'Min5'
        },
        questDB: {
            bithumb: {
                sampleBy: '5m',
                sampleByBase: '1m',
            },
            upbit: {
                sampleBy: '5m',
                sampleByBase: '1m',
            },
            partitionBy: 'MONTH',
        }
    },
    '10m': {
        type: 'minutes',
        value: 10,
        ms: minMs * 10,
        isRegular: true,
        sqlite: {
            unit: 'Min10'
        },
        questDB: {
            bithumb: {
                sampleBy: '10m',
                sampleByBase: '1m',
            },
            upbit: {
                sampleBy: '10m',
                sampleByBase: '1m',
            },
            partitionBy: 'MONTH',
        }
    },
    '15m': {
        type: 'minutes',
        value: 15,
        ms: minMs * 15,
        isRegular: true,
        sqlite: {
            unit: 'Min15'
        },
        questDB: {
            bithumb: {
                sampleBy: '15m',
                sampleByBase: '1m',
            },
            upbit: {
                sampleBy: '15m',
                sampleByBase: '1m',
            },
            partitionBy: 'MONTH',
        }
    },
    '30m': {
        type: 'minutes',
        value: 30,
        ms: minMs * 30,
        isRegular: true,
        sqlite: {
            unit: 'Min30'
        },
        questDB: {
            bithumb: {
                sampleBy: '30m',
                sampleByBase: '15m',
            },
            upbit: {
                sampleBy: '30m',
                sampleByBase: '1m',
            },
            partitionBy: 'YEAR',
        }
    },
    '1h': {
        type: 'hours',
        value: 1,
        ms: hourMs,
        isRegular: true,
        sqlite: {
            unit: 'Hour'
        },
        questDB: {
            bithumb: {
                sampleBy: '1h',
                sampleByBase: '15m',
            },
            upbit: {
                sampleBy: '1h',
                sampleByBase: '1m',
            },
            partitionBy: 'YEAR',
        }
    },
    // '2h': {
    //     type: 'hours',
    //     value: 2,
    //     ms: hourMs * 2,
    //     isRegular: true,
    //     questDB: {
    //         sampleBy: '2h',
    //         sampleByBase: '1h',
    //         partitionBy: 'YEAR',
    //     }
    // },
    '4h': {
        type: 'hours',
        value: 4,
        ms: hourMs * 4,
        isRegular: true,
        sqlite: {
            unit: 'Hour4'
        },
        questDB: {
            bithumb: {
                sampleBy: '4h',
                sampleByBase: '1h',
            },
            upbit: {
                sampleBy: '4h',
                sampleByBase: '1h',
            },
            partitionBy: 'YEAR',
        }
    },
    // '6h': {
    //     type: 'hours',
    //     value: 6,
    //     ms: hourMs * 6,
    //     isRegular: true,
    //     questDB: {
    //         sampleBy: '6h',
    //         sampleByBase: '1h',
    //         partitionBy: 'YEAR',
    //     }
    // },
    // '12h': {
    //     type: 'hours',
    //     value: 12,
    //     ms: hourMs * 12,
    //     isRegular: true,
    //     questDB: {
    //         sampleBy: '12h',
    //         sampleByBase: '1h',
    //         partitionBy: 'YEAR',
    //     }
    // },
    '1d': {
        type: 'day',
        value: 1,
        ms: dayMs,
        isRegular: true,
        sqlite: {
            unit: 'Day'
        },
        questDB: {
            bithumb: {
                sampleBy: '1d',
                sampleByBase: '1h',
            },
            upbit: {
                sampleBy: '1d',
                sampleByBase: '1h',
            },
            partitionBy: 'YEAR',
        }
    },
    '1w': {
        type: 'week',
        value: 1,
        ms: weekMs,
        isRegular: false,
        sqlite: {
            unit: 'Week'
        },
        questDB: {
            bithumb: {
                sampleBy: '7d',
                sampleByBase: '1d',
            },
            upbit: {
                sampleBy: '7d',
                sampleByBase: '1d',
            },
            partitionBy: 'YEAR',
        }
    },
}

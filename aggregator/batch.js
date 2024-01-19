import {CANDLES, weekMs} from "../utils/constant.js";
import {getCandleTimeRange, getWeekTimeRange} from "../utils/time.js";


export class RegularTimeCandleBatchAggregator {
    exchange;
    unit;
    ms;
    timezone;
    batchOptions;

    constructor(options = {}) {
        this.exchange = options.exchange
        this.unit = options.unit
        this.timezone = options.timezone ?? 'UTC';

        const candleConfig = CANDLES[this.unit];
        this.ms = candleConfig.ms
        this.batchOptions = options.batchOptions ?? candleConfig.questDB[this.exchange]
    }

    getTimeWindow(tms) {
        const {start, end} = getCandleTimeRange(tms, this.unit, this.timezone);
        return {start: start - this.ms, end};
    }

    async aggregateAll(db){
        const {sampleBy, sampleByBase}  = this.batchOptions
        const params = {
            exchange: this.exchange, unit: this.unit, sampleBy, sampleByBase, timezone: this.timezone
        }
        return db.aggregateAllCandles(params)
    }

    async aggregateLatest(db, nowDate) {
        const {sampleBy, sampleByBase} = this.batchOptions;
        const {start} = this.getTimeWindow(nowDate.getTime());
        const params = {
            exchange: this.exchange, unit: this.unit, sampleBy, sampleByBase,
            timestamp: start, timezone: this.timezone
        }
        return db.aggregateLatestCandles(params)
    }
}

export class IrregularCandleBatchAggregator {
    exchange;
    unit;
    ms;
    batchOptions;

    constructor(options = {}) {
        this.exchange = options.exchange
        this.unit = options.unit
        this.timezone = options.timezone ?? 'UTC';

        const candleConfig = CANDLES[this.unit];
        this.ms = candleConfig.ms;
        this.batchOptions = candleConfig.questDB[this.exchange];
    }

    async getOldestCandleTms(reader){
        return reader.getOldestCandleTms(this.exchange, this.batchOptions.sampleByBase)
    }

    getTimeRange(){}

    async aggregateAll(db) {
        const {sampleBy, sampleByBase} = this.batchOptions
        const now = new Date();

        const oldestTms = await this.getOldestCandleTms(db);
        let {start, end} = this.getTimeRange(oldestTms);

        while (start < now) {
            const params = {
                exchange: this.exchange, unit: this.unit, sampleBy, sampleByBase,
                range: {start, end}, isAlign: false, timezone: this.timezone
            }
            await db.aggregateCandlesByTimeFrame(params);
            start = end
            end += weekMs
        }
    }

    async aggregateLatest(db, now) {
        const {sampleBy, sampleByBase} = this.batchOptions
        const {start, end} = this.getTimeRange(now)
        const params = {
            exchange: this.exchange, unit: this.unit, sampleBy, sampleByBase,
            range: {start, end}, timezone: this.timezone, isAlign: false
        }
        await db.aggregateCandlesByTimeFrame(params)
    }
}

export class WeekCandleBatchAggregator extends IrregularCandleBatchAggregator {
    constructor(options = {}) {
        super(options);
    }

    getTimeRange(date) {
        return getWeekTimeRange(date, this.timezone);
    }
}

export const aggregateRealtimeCandles = async (db, exchange) => {
    const now = new Date();

    const minBaseAggregationCandles = Object.entries(CANDLES).filter((candle) => {
        const [unit, {questDB}] = candle;
        const {sampleByBase} = questDB[exchange];
        return unit !== '1m' && sampleByBase === '1m';
    });
    const minBaseAggregations = minBaseAggregationCandles.map(async (candle) => {
        const [unit, _] = candle;
        const options = {exchange, unit, timezone: 'UTC'}
        const aggregator = new RegularTimeCandleBatchAggregator(options);
        return aggregator.aggregateLatest(db, now)
    })
    await Promise.all(minBaseAggregations);
    console.log(`aggregate ${exchange} 1m base candles`);

    const min15BaseAggregationCandles = Object.entries(CANDLES).filter((candle) => {
        const [_, {questDB}] = candle;
        const {sampleByBase} = questDB[exchange];
        return sampleByBase === '15m';
    });
    const min15BaseAggregations = min15BaseAggregationCandles.map(async (candle) => {
        const [unit, _] = candle;
        const options = {exchange, unit, timezone: 'UTC'}
        const aggregator = new RegularTimeCandleBatchAggregator(options);
        return aggregator.aggregateLatest(db, now)
    });
    await Promise.all(min15BaseAggregations);
    console.log(`aggregate ${exchange} 15m base candles`);

    const hourBaseAggregationCandles = Object.entries(CANDLES).filter((candle) => {
        const [_, {questDB}] = candle;
        const {sampleByBase} = questDB[exchange];
        return sampleByBase === '1h';
    });
    const hourBaseAggregations = hourBaseAggregationCandles.map(async (candle) => {
        const [unit, _] = candle;
        const options = {exchange, unit, timezone: 'UTC'}
        const aggregator = new RegularTimeCandleBatchAggregator(options);
        return aggregator.aggregateLatest(db, now)
    });
    await Promise.all(hourBaseAggregations);
    console.log(`aggregate ${exchange} 1h base candles`);

    const dayBaseAggregationCandles = Object.entries(CANDLES).filter((candle) => {
        const [_, {questDB}] = candle;
        const {sampleByBase} = questDB[exchange];
        return sampleByBase === '1d';
    });
    const dayBaseAggregations = dayBaseAggregationCandles.map(async (candle) => {
        const [unit, _] = candle;
        const options = {exchange, unit, timezone: 'UTC'}
        const aggregator = new WeekCandleBatchAggregator(options);
        return aggregator.aggregateLatest(db, now);
    })
    await Promise.all(dayBaseAggregations);
    console.log(`aggregate ${exchange} 1d base candles`);
}

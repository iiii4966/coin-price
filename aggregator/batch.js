import {CANDLES, weekMs} from "../utils/constant.js";
import {getCandleTimeRange, getWeekTimeRange} from "../utils/utils.js";


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
        this.batchOptions = candleConfig.questDB[this.exchange]
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

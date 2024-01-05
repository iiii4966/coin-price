import {CANDLES, weekMs} from "../constant.js";
import {getTimeRangeWithMoment, getWeekTimeRange} from "../utils.js";


export class RegularTimeCandleBatchAggregator {
    exchange;
    unit;
    ms;
    timeType;
    timeValue;
    batchOptions;

    constructor(options = {}) {
        this.exchange = options.exchange
        this.unit = options.unit

        const candleConfig = CANDLES[this.unit];
        this.ms = candleConfig.ms
        this.timeType = candleConfig.type === 'day' ? 'hours' : candleConfig.type
        this.timeValue = this.timeType === 'day' ? candleConfig.value * 24 : candleConfig.value
        this.batchOptions = candleConfig.questDB
    }

    getTimeWindow(tms) {
        const {start, end} = getTimeRangeWithMoment(tms, this.timeType, this.timeValue);
        return {start: start - this.ms, end};
    }

    async aggregateAll(writer){
        const {sampleBy, sampleByBase}  = this.batchOptions
        const params = {exchange: this.exchange, unit: this.unit, sampleBy, sampleByBase}
        return writer.aggregateAllCandles(params)
    }

    async aggregateLatest(writer, nowDate) {
        const {sampleBy, sampleByBase} = this.batchOptions;
        const {start} = getTimeRangeWithMoment(nowDate.getTime(), this.timeType, this.timeValue);
        const params = {exchange: this.exchange, unit: this.unit, sampleBy, sampleByBase, timestamp: start}
        return writer.aggregateLatestCandles(params)
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

        const candleConfig = CANDLES[this.unit];
        this.ms = candleConfig.ms;
        this.batchOptions = candleConfig.questDB;
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
                exchange: this.exchange, unit: this.unit, sampleBy, sampleByBase, range: {start, end}, isAlign: false
            }
            await db.aggregateCandlesByTimeFrame(params);
            start = end
            end += weekMs
        }
    }

    async aggregateLatest(writer, now) {
        const {sampleBy, sampleByBase} = this.batchOptions
        const range = this.getTimeRange(now)
        const params = {
            exchange: this.exchange, unit: this.unit, sampleBy, sampleByBase, range, isAlign: false
        }
        return writer.aggregateCandlesByTimeFrame(params)
    }
}

export class WeekCandleBatchAggregator extends IrregularCandleBatchAggregator {
    constructor(options = {}) {
        super(options);
    }

    getTimeRange(date) {
        return getWeekTimeRange(date);
    }
}

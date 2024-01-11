import {CANDLES} from "../utils/constant.js";
import {RegularTimeCandleBatchAggregator, WeekCandleBatchAggregator} from "../aggregator/batch.js";

export const aggregateRealtimeCandles = async (db, exchange) => {
    const now = new Date();

    const minBaseAggregationCandles = Object.entries(CANDLES).filter((candle) => {
        const [unit, {questDB}] = candle;
        const {sampleByBase} = questDB[exchange];
        return unit !== '1m' && sampleByBase === '1m';
    });
    const minBaseAggregations = minBaseAggregationCandles.map(async (candle) => {
        const [unit, _] = candle;
        const options = {exchange, unit}
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

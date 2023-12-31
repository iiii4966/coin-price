import {CANDLES} from "./constant.js";
import {getTimeRange} from "./utils.js";

export class CandleAggregator {
    exchange
    unit;
    ms;
    candles;

    constructor(options = {}) {
        this.exchange = options.exchange
        this.unit = options.unit
        this.ms = CANDLES[this.unit].ms
        this.candles = {};
        this.candleLatestTms = {};
    }

    getTimeWindow(tms) {
        return getTimeRange(tms, this.ms)
    }

    initCandle(start, end, symbol, price, amount) {
        return {
            start,
            end,
            latestUpdateTms: start,
            symbol,
            open: price,
            close: price,
            high: price,
            low: price,
            volume: amount,
            closed: false
        }
    }

    updateCandle(candle, tradeTms, price, amount) {
        const {latestUpdateTms, high, low} = candle;
        if (latestUpdateTms <= tradeTms) {
            candle.close = price;
        }
        candle.high = Math.max(high, price);
        candle.low = Math.min(low, price);
        candle.volume += amount;
        candle.latestUpdateTms = tradeTms;
        return candle;
    }

    getCandle(symbol, tms) {
        const symbolCandles = this.candles[symbol];
        if (!symbolCandles) {
            return;
        }
        return symbolCandles[tms];
    }

    setCandle(candle) {
        const {symbol, start} = candle;
        const symbolCandles = this.candles[symbol];
        if (!symbolCandles) {
            this.candles[symbol] = {[start]: candle};
        } else {
            this.candles[symbol][start] = candle
        }
        this.candleLatestTms[symbol] = start;
    }

    aggregate(trade){
        // trade
        // timestamp: 1704010633193,
        // symbol: 'ANKR_KRW',
        // type: 'trade',
        // side: 'buy',
        // price: 38.91,
        // amount: 200.76,
        // cost: 7811.5716,
        const {timestamp, symbol, price, amount} = trade;
        const {start, end} = this.getTimeWindow(timestamp);
        let candle = this.getCandle(symbol, start);
        if (candle) {
            candle = this.updateCandle(candle, timestamp, price, amount);
        } else {
            candle = this.initCandle(start, end, symbol, price, amount);
        }
        this.setCandle(candle);
    }

    async loadLatestCandles(db) {}

    async persist(db) {
        if (!this.candles) {
            return;
        }

        const insertCandles = []
        const closedCandles = []
        let insertSymbolCount = 0;

        for (const [symbol, candles] of Object.entries(this.candles)) {
            let latestTms = this.candleLatestTms[symbol];
            for (const candle of Object.values(candles)) {
                insertCandles.push(candle);
                if (candle.start < latestTms) {
                    candle.closed = true;
                    closedCandles.push(candle);
                }
            }

            insertSymbolCount += 1;
        }

        console.log(Object.values(this.candles['BTC_KRW']));

        await db.writeCandles(this.exchange, this.unit, insertCandles);

        console.log(`bithumb insert ${this.unit} candles:`, insertSymbolCount)
        this.removeClosedCandle(closedCandles);
    }

    removeClosedCandle(candles) {
        for (const candle of candles) {
            delete this.candles[candle.symbol][candle.start]
        }
    }
}

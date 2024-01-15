import {CandleRealtimeAggregator} from "./realtime.js";

export class UpbitRealtimeAggregator extends CandleRealtimeAggregator {
    constructor(options) {
        options.exchange = 'upbit'
        super(options);
    }

    initCandle(start, tradeTms, end, symbol, price, amount, sequentialId) {
        const sequentialIds = new Set();
        sequentialIds.add(sequentialId)

        const candle = {
            start,
            end,
            lastTradeTms: tradeTms,
            firstTradeTms: tradeTms,
            sequentialIds: sequentialIds,
            lastSequentialId: sequentialId,
            symbol,
            open: price,
            close: price,
            high: price,
            low: price,
            volume: amount,
            closed: false
        }

        this.setLatestTms(symbol, start);
        return candle
    }

    updateCandle(candle, tradeTms, price, amount, sequentialId) {
        if (candle.sequentialIds.has(sequentialId)) {
            return
        }

        const {firstTradeTms, lastTradeTms, high, low, lastSequentialId} = candle;

        if (firstTradeTms > tradeTms) {
            candle.open = price;
            candle.firstTradeTms = tradeTms;
        }

        if (lastTradeTms < tradeTms) {
            candle.close = price;
            candle.lastTradeTms = tradeTms;
        } else if (lastTradeTms === tradeTms) {
            if (+lastSequentialId < +sequentialId) {
                candle.close = price
                candle.lastSequentialId = sequentialId
            }
        }

        candle.high = Math.max(high, price);
        candle.low = Math.min(low, price);
        candle.volume += amount;

        candle.sequentialIds.add(sequentialId)
        return candle;
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
        const {timestamp, symbol, price, amount, id: sequentialId} = trade;
        const {start, end} = this.getTimeWindow(timestamp);
        let candle = this.getCandle(symbol, start);
        if (candle) {
            candle = this.updateCandle(candle, timestamp, price, amount, sequentialId);
        } else {
            candle = this.initCandle(start, timestamp, end, symbol, price, amount, sequentialId);
        }
        this.setCandle(candle);
    }
}

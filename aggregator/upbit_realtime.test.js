import {UpbitRealtimeAggregator} from "./upbit_realtime.js";
import fs from 'fs';
import {getCandleTimeRange} from "../utils/utils.js";


const mockdata = () => {
    const data = fs.readFileSync('./aggregator/upbit_trade_data.json', 'utf8');
    const trades = JSON.parse(data);
    return trades.map(({
        symbol,
        side,
        price,
        amount,
        sequential_id,
        timestamp
    }) => {
        return {
            symbol,
            side,
            price,
            amount,
            id: sequential_id,
            timestamp: new Date(timestamp).getTime()
        }
    }).reverse()
}

test('test upbit realtime aggregate', () => {
    const trades = mockdata()
    const minAggregator = new UpbitRealtimeAggregator(
        {unit: '1m', exchange: 'upbit'}
    );

    for (const trade of trades) {
        minAggregator.aggregate(trade);
    }

    const firstTrade = trades[0]
    const {start} = getCandleTimeRange(firstTrade.timestamp, '1m')
    const candle = minAggregator.getCandle('BTC/KRW', start)

    const result = {
        timestamp: 1705287120000,
        open: 58175000,
        high: 58193000,
        low: 58170000,
        close: 58176000,
        volume: 0.86351202
    }

    expect(candle.start).toBe(result.timestamp);
    expect(candle.firstTradeTms).toBe(1705287121690);
    expect(candle.lastTradeTms).toBe(1705287178843);
    expect(candle.lastSequentialId).toBe('17052871788430002');
    expect(candle.open).toBe(result.open);
    expect(candle.high).toBe(result.high);
    expect(candle.low).toBe(result.low);
    expect(candle.close).toBe(result.close);
    expect(candle.volume).toBe(result.volume);
});

import {pro} from 'ccxt';
import {CandleRealtimeAggregator} from "../aggregator/realtime.js";
import {sleep} from "../utils/utils.js";
import {CANDLES, minMs, utcHourMs} from "../utils/constant.js";

export class Upbit extends pro.upbit {
    internalSymbols = [];

    getInternalSymbols() {
        return this.symbols.filter(s => s.split('/')[1] === 'KRW')
    }

    async loadMarkets(reload = false, params = {}) {
        if ((reload && !this.reloadingMarkets) || !this.marketsLoading) {
            this.reloadingMarkets = true;
            this.marketsLoading = this.loadMarketsHelper(reload, params).then((resolved) => {
                this.reloadingMarkets = false;
                this.internalSymbols = this.getInternalSymbols()
                return resolved;
            }, (error) => {
                this.reloadingMarkets = false;
                throw error;
            });
        }
        return this.marketsLoading;
    }

    async watchTradesForSymbols(symbols = [],
                                since = undefined,
                                limit = undefined){
        const marketIds = this.marketIds(symbols);
        const request = [
            {
                'ticket': this.uuid(),
            },
            {
                'type': 'trade',
                'codes': marketIds,
            },
        ];

        const msgHashes = marketIds.map(s => 'trade' + ':' + s);
        const trades = await this.watchMultiple(this.urls['api']['ws'], msgHashes, request, msgHashes);
        if (this.newUpdates) {
            const first = this.safeValue(trades, 0);
            const tradeSymbol = this.safeString(first, 'symbol');
            limit = trades.getLimit(tradeSymbol, limit);
        }
        return this.filterBySinceLimit(trades, since, limit, 'timestamp', true);
    }

}

export const collect1mCandle = async (writer, reader) => {
    const upbit = new Upbit();
    await upbit.loadMarkets();

    console.log('load markets:', upbit.internalSymbols.length);

    setInterval(async () => {
        await upbit.loadMarkets(true).catch(console.error)
        console.log(upbit.internalSymbols.length)
    }, 1000 * 60 * 60);

    const minAggregator = new CandleRealtimeAggregator(
        {unit: '1m', exchange: upbit.name.toLowerCase()}
    );
    await minAggregator.loadLatestCandles(reader)
    setInterval(() => {
        minAggregator.persist(writer).catch(console.error)
    }, 1000 * 3);

    while (true) {
        try {
            const trades = await upbit.watchTradesForSymbols(upbit.internalSymbols);
            for (const trade of trades) {
                minAggregator.aggregate(trade);
            }
        } catch (e) {
            console.error(e)
            await sleep(10);
        }
    }
}

/**
 * 모든 종목 캔들 수집 시간: 30분
 */


export const collectCandleHistory = async (db, count = 2000) => {
    console.log(`start collect bithumb candle history\n`)

    const upbit = new Upbit();
    const exchange = upbit.name.toLowerCase();
    await upbit.loadMarkets();
    const fetchLimit = count < 200 ? count : 200

    const {internalSymbols: symbols} = upbit;
    for (const symbol of ['BTT/KRW']) {
        for (const timeframe of Object.keys(upbit.timeframes)) {
            if (timeframe === '1M') {
                continue
            }

            const collectCandles = [];
            let since = undefined;
            while (collectCandles.length < count) {
                const candles = await upbit.fetchOHLCV(symbol, timeframe, since, fetchLimit);
                if (candles.length === 0) {
                    break
                }

                since = candles[0][0] - CANDLES[timeframe].ms * fetchLimit;
                candles.forEach(
                    ([start, open, high, low, close, volume]) => {
                        collectCandles.push({start, symbol, open, high, low, close, volume});
                    }
                )
            }

            const collectCount = collectCandles.length;
            await db.writeCandles(exchange, timeframe, collectCandles)
            console.log(`collect upbit ${symbol} ${timeframe} candle history:`, collectCount)
        }
    }

    console.log(`complete collect upbit candle history`)
}

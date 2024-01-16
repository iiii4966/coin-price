import {pro} from 'ccxt';
import {sleep} from "../utils/utils.js";
import {UpbitRealtimeAggregator} from "../aggregator/upbit_realtime.js";
import * as Sentry from "@sentry/node";

export class Upbit extends pro.upbit {
    marketSymbols = [];

    describe() {
        return this.deepExtend(super.describe(), {
            'timeframes': {
                '1m': 'minutes',
                '3m': 'minutes',
                '5m': 'minutes',
                '15m': 'minutes',
                '30m': 'minutes',
                '10m': 'minutes',
                '1h': 'minutes',
                '4h': 'minutes',
                '1d': 'days',
                '1w': 'weeks',
                '1M': 'months',
            },
        });
    }

    marketSymbolToStandard(symbol){
        const [unit, s] = symbol.split('-')
        return `${s}/${unit}`
    }

    toStandardSymbol(symbol){
        const {baseId, quoteId} = this.market(symbol);
        return `${baseId}/${quoteId}`
    }

    toMarketSymbol(symbol){
        const {baseId, quoteId} = this.market(symbol);
        return `${quoteId}-${baseId}`
    }

    filterSymbols() {
        return this.symbols.filter(s => s.split('/')[1] === 'KRW')
    }

    getMarketSymbols() {
        return this.filterSymbols().map(s => this.toMarketSymbol(s))
    }

    async loadMarkets(reload = false, params = {}) {
        if ((reload && !this.reloadingMarkets) || !this.marketsLoading) {
            this.reloadingMarkets = true;
            this.marketsLoading = this.loadMarketsHelper(reload, params).then((resolved) => {
                this.reloadingMarkets = false;
                this.marketSymbols = this.getMarketSymbols()
                return resolved;
            }, (error) => {
                this.reloadingMarkets = false;
                throw error;
            });
        }
        return this.marketsLoading;
    }

    parseTrade(trade, market = undefined) {
        const parsed = super.parseTrade(trade, market);
        parsed.symbol = this.marketSymbolToStandard(parsed.info.code);
        parsed.timestamp = this.safeInteger(trade, 'trade_timestamp');
        parsed.datetime = this.iso8601(parsed.timestamp)
        parsed.info = undefined;
        return parsed
    }

    async watchTradesForSymbols(symbols = [],
                                since = undefined,
                                limit = undefined){
        const request = [
            {
                'ticket': this.uuid(),
            },
            {
                'type': 'trade',
                'codes': symbols,
                'isOnlyRealtime': true,
            },
        ];

        const msgHashes = symbols.map(s => 'trade:' + s);
        const trades = await this.watchMultiple(this.urls['api']['ws'], msgHashes, request, msgHashes);

        if (this.newUpdates) {
            const first = this.safeValue(trades, 0);
            const tradeSymbol = this.safeString(first, 'symbol');
            limit = trades.getLimit(tradeSymbol, limit);
        }
        return this.filterBySinceLimit(trades, since, limit, 'timestamp', true);
    }

    buildFetchOHLCVUrl(symbol, unit, to, limit){
        let url = 'https://api.upbit.com/v1/candles/';
        const apiUnit = this.timeframes[unit]
        if (apiUnit === 'minutes') {
            let interval;
            if (unit === '1h') {
                interval = 60
            } else if (unit === '4h') {
                interval = 240
            } else {
                interval = unit.slice(0, -1)
            }
            url += `minutes/${interval}`
        } else {
            url += apiUnit
        }

        return `${url}?market=${symbol}&to=${to}&count=${limit}`
    }

    parseRemainRequestCount(headers){
        const remainReq = headers.get('remaining-req');
        if (!remainReq) {
            throw new Error('Not exist remaining-req header')
        }
        let [_, remainReqCountPerMinutes, remainReqCountPerSecond] = remainReq.split(' ')
        const m = +remainReqCountPerMinutes.split('=')[1].slice(0, -1);
        const s = +remainReqCountPerSecond.split('=')[1];
        return {m, s};
    }

    /**
     * 성능 문제로 cctx api 를 사용하지 않음
     */
    async fetchOHLCVByCount(symbol, unit, since, limit) {
        const marketId = this.marketId(symbol)
        const fetchLimit = limit < 200 ? limit : 200
        let startTime = new Date().toISOString();
        const candles = [];

        while (candles.length < limit){
            const url = this.buildFetchOHLCVUrl(marketId, unit, startTime, fetchLimit)
            const resp = await fetch(url);

            if (resp.statusText === 'Too Many Requests') {
                await sleep(1000)
                continue
            }

            const data = await resp.json();
            if (data.length === 0) {
                break;
            }

            startTime = data[data.length - 1].candle_date_time_utc
            candles.push(...data.map(d => this.parseOHLCV(d)))

            const {s} = this.parseRemainRequestCount(resp.headers);
            if (s === 0) {
                await sleep(1000)
            }
        }

        return candles;
    }

    async fetchTradeHistoryByCount(symbol){

    }
}

export const collect1mCandle = async (writer, reader) => {
    const upbit = new Upbit();
    await upbit.loadMarkets();

    console.log('load markets:', upbit.marketSymbols.length, JSON.stringify(upbit.marketSymbols));

    setInterval(async () => {
        await upbit.loadMarkets(true).catch(console.error)
        console.log(upbit.marketSymbols.length, JSON.stringify(upbit.marketSymbols))
    }, 1000 * 60 * 60);

    const minAggregator = new UpbitRealtimeAggregator(
        {unit: '1m', exchange: upbit.name.toLowerCase()}
    );
    await minAggregator.loadLatestCandles(reader)
    setInterval(() => {minAggregator.persist(writer).catch(console.error)}, 1000 * 3);

    while (true) {
        try {
            const trades = await upbit.watchTradesForSymbols(upbit.marketSymbols);
            for (const trade of trades) {
                minAggregator.aggregate(trade);
            }
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
        }
    }
}

/**
 * 모든 종목 캔들 수집 시간: 30분
 */
export const collectCandleHistory = async (db, count = 2000) => {
    console.log(`start collect upbit candle history\n`)

    const upbit = new Upbit();
    const exchange = upbit.name.toLowerCase();
    await upbit.loadMarkets();

    const symbols = upbit.filterSymbols();
    for (const symbol of symbols) {
        for (const timeframe of Object.keys(upbit.timeframes)) {
            if (timeframe === '1M') {
                continue
            }
            const collectCandles = await upbit.fetchOHLCVByCount(symbol, timeframe, 0, 2000);
            await db.writeCandles(exchange, timeframe, collectCandles.map(
                ([start, open, high, low, close, volume]) => {
                    return {start, symbol: upbit.toStandardSymbol(symbol), open, high, low, close, volume};
                }
            ))
            console.log(`collect upbit ${symbol} ${timeframe} candle history:`, collectCandles.length)
        }
    }

    console.log(`complete collect upbit candle history`)
}

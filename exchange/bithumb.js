import {bithumb as bithumbRest} from 'ccxt';
import {ArrayCache} from "../utils/cache.js";
import {getCandleTimeRange, sleep} from "../utils/utils.js";
import {CandleRealtimeAggregator} from "../aggregator/realtime.js";
import {CANDLES, utcHourMs} from "../utils/constant.js";
import {RegularTimeCandleBatchAggregator, WeekCandleBatchAggregator} from "../aggregator/batch.js";
import * as Sentry from "@sentry/node";

export class Bithumb extends bithumbRest {
    marketSymbols = [];

    describe() {
        return this.deepExtend(super.describe(), {
            'verbose': false,
            'pro': true,
            'has': {
                'ws': true,
                'watchTradesForSymbols': true,
            },
            'urls': {
                'api': {
                    'ws': 'wss://pubwss.bithumb.com/pub/ws'
                },
            },
            'options': {
                newUpdates: true,
                'tradesLimit': 1000,
            },
            'streaming': {
                'keepAlive': 15000,
            },
        });
    }

    parseTrade(trade, market) {
        // trade
        //
        // {
        // 	"type" : "transaction",
        // 	"content" : {
        // 		"list" : [
        // 			{
        // 				"symbol" : "BTC_KRW",					    // 통화 코드
        // 				"buySellGb" : "1",							// 체결 종류(1:매도체결, 2:매수체결)
        // 				"contPrice" : "10579000",					// 체결 가격
        // 				"contQty" : "0.01",							// 체결 수량
        // 				"contAmt" : "105790.00",					// 체결 금액
        // 				"contDtm" : "2020-01-29 12:24:18.830039",	// 체결 시각
        // 				"updn" : "dn"								// 직전 시세와 비교 : up-상승, dn-하락
        // 			}
        // 		]
        // 	}
        // }

        let timestamp = undefined;
        const transactionDatetime = this.safeString(trade, 'contDtm');
        const parts = transactionDatetime.split(' ');
        const numParts = parts.length;
        if (numParts > 1) {
            const transactionDate = parts[0];
            let transactionTime = parts[1];
            if (transactionTime.length < 8) {
                transactionTime = '0' + transactionTime;
            }
            timestamp = this.parse8601(transactionDate + ' ' + transactionTime);
        }

        if (timestamp !== undefined) {
            timestamp -= utcHourMs; // they report UTC + 9 hours, server in Korean timezone
        }

        const symbol = this.marketSymbolToStandard(this.safeString(trade, 'symbol'));
        let side = this.safeString(trade, 'buySellGb');
        side = (side === '1') ? 'buy' : 'sell';
        const priceString = this.safeString(trade, 'contPrice');
        const amountString = this.fixCommaNumber(this.safeString2(trade, 'contQty', 'units'));
        const costString = this.safeString(trade, 'contAmt');

        return this.safeTrade({
            id: timestamp,
            info: undefined,
            timestamp: timestamp,
            datetime: undefined,
            symbol: symbol,
            order: undefined,
            type: 'trade',
            side: side,
            takerOrMaker: undefined,
            price: priceString,
            amount: amountString,
            cost: costString,
            fee: {},
        }, market);
    }

    handleTrades(client, message) {
        const rawTrades = message.content.list;
        const first = this.safeValue(rawTrades, 0);
        const symbol = this.safeString(first, 'symbol');

        let tradeCachedArray = this.safeValue(this.trades, symbol);
        if (tradeCachedArray === undefined) {
            const limit = this.safeInteger(this.options, 'tradesLimit', 1000);
            tradeCachedArray = new ArrayCache(limit);
            this.trades[symbol] = tradeCachedArray;
        }

        for (const rawTrade of rawTrades) {
            const trade = this.parseTrade(rawTrade)
            tradeCachedArray.append(trade)
        }

        const msgHash = 'trade:' + symbol;
        client.resolve(tradeCachedArray, msgHash);
    }

    handleMessage(client, message) {
        const methods = {
            'transaction': this.handleTrades,
        };
        const methodName = this.safeString(message, 'type');
        const method = this.safeValue(methods, methodName);
        if (method) {
            method.call(this, client, message);
        }
    }

    marketSymbolToStandard(symbol){
        return symbol.replace('_', '/')
    }

    toStandardSymbol(symbol){
        const {baseId, quoteId} = this.market(symbol);
        return `${baseId}/${quoteId}`
    }

    toMarketSymbol(symbol){
        const {baseId, quoteId} = this.market(symbol);
        return `${baseId}_${quoteId}`
    }

    filterSymbols() {
        return this.symbols.filter(s => s.split('/')[1] === 'KRW')
    }

    getMarketSymbols() {
        return this.filterSymbols().map((s) => this.toMarketSymbol(s))
    }

    async watchTradesForSymbols(symbols = [],
                                since = undefined,
                                limit = undefined,
                                params = {}){
        const url = this['urls']['api']['ws']
        const request = {
            type : 'transaction',
            symbols,
        }


        const msgHashes = symbols.map(s => 'trade:' + s);

        const trades = await this.watchMultiple(url, msgHashes, request, msgHashes);

        if (this.newUpdates) {
            const first = this.safeValue(trades, 0);
            const tradeSymbol = this.safeString(first, 'symbol');
            limit = trades.getLimit(tradeSymbol, limit);
        }
        return this.filterBySinceLimit(trades, since, limit, 'timestamp', true);
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
}

export const aggregateCandleHistory = async (db) => {
    console.log(`start aggregate bithumb candle history`)

    const bithumb = new Bithumb();
    await bithumb.loadMarkets();

    const exchange = bithumb.name.toLowerCase();
    const bithumbCandleUnits = Object.keys(bithumb.timeframes)

    for (const [unit, {isRegular}] of Object.entries(CANDLES)) {
        if (unit !== '1d' && bithumbCandleUnits.includes(unit)) {
            continue
        }

        let aggregator;
        const options = {exchange, unit, timezone: 'UTC'}
        if (unit === '15m') {
            options.batchOptions = {sampleBy: '15m', sampleByBase: '5m'};
        }

        if (isRegular) {
            aggregator = new RegularTimeCandleBatchAggregator(options)
        } else if (unit === '1w') {
            await sleep(1000)
            aggregator = new WeekCandleBatchAggregator(options)
        } else {
            throw new Error('No aggregator');
        }

        await aggregator.aggregateAll(db)
        console.log(`aggregate bithumb ${unit} candle history`)
    }

    console.log(`complete aggregate bithumb candle history`)
}

/**
 * 모든 종목 캔들 수집 시간: 30분
 */
export const collectCandleHistory = async (db) => {
    const bithumb = new Bithumb();
    await bithumb.loadMarkets();

    const symbols = bithumb.filterSymbols();

    console.log(`start collect bithumb candle history:`, symbols.length)

    for (const symbol of symbols) {
        const standardSymbol = bithumb.toStandardSymbol(symbol);
        for (const [timeframe, _] of Object.entries(bithumb.timeframes)) {
            // 빗썸의 1일 캔들은 한국시간 기준 00시 이므로 UTC 기준과 달라 수집하지 않음
            if (CANDLES[timeframe] === undefined || timeframe === '1d') {
                continue
            }

            const candles = await bithumb.fetchOHLCV(symbol, timeframe);
            const parsedCandles = candles.map(
                ([tms, open, high, low, close, volume], idx) => {
                    let start;
                    if (timeframe === '1d') {
                        // 1m 캔들은 데이터 조회 시 가장 최근 데이터 시간과 캔들 시간이 일치하지만
                        // 나머지 캔들은 일치하지 않는다. 최근 데이터의 시간을 통해 캔들의 시작 시간을 유추해야 한다.
                        const date = new Date(tms);
                        if (candles.length - 1 === idx && date.getUTCHours() !== 15) {
                            const range = getCandleTimeRange(tms, timeframe)
                            start = range.start
                            start -= utcHourMs
                        } else {
                            start = tms;
                        }
                    } else {
                        const range = getCandleTimeRange(tms, timeframe)
                        start = range.start
                    }
                    return {start, symbol: standardSymbol, open, high, low, close, volume, closed: true};
                }
            )
            await db.writeCandles(bithumb.name.toLowerCase(), timeframe, parsedCandles)
            console.log(`collect ${standardSymbol} ${timeframe} candle history:`, candles.length)
        }
    }

    console.log(`complete collect bithumb candle history`)
}

export const collect1mCandle = async (writer, reader) => {
    const bithumb = new Bithumb();
    await bithumb.loadMarkets();

    console.log('load markets:', bithumb.marketSymbols.length, JSON.stringify(bithumb.marketSymbols));

    setInterval(() => {
        bithumb.loadMarkets(true).catch(console.error);
        console.log('load markets:', bithumb.marketSymbols.length, JSON.stringify(bithumb.marketSymbols));
    }, 1000 * 60 * 60);

    const minAggregator = new CandleRealtimeAggregator(
        {unit: '1m', exchange: bithumb.name.toLowerCase()}
    );
    await minAggregator.loadLatestCandles(reader)
    setInterval(() => {
        minAggregator.persist(writer).catch(console.error)
    }, 1000 * 3);

    while (true) {
        try {
            const trades = await bithumb.watchTradesForSymbols(bithumb.marketSymbols);
            for (const trade of trades) {
                minAggregator.aggregate(trade);
            }
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
        }
    }
}

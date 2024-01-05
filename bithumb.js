import {bithumb as bithumbRest} from 'ccxt';
import {ArrayCache} from "./cache.js";
import {Quest} from "./quest.js";
import {getTimeRangeWithMoment, sleep} from "./utils.js";
import {CandleRealtimeAggregator} from "./aggregator/realtime.js";
import {Postgres} from "./postgres.js";
import {CANDLES, utcHourMs} from "./constant.js";
import {RegularTimeCandleBatchAggregator, WeekCandleBatchAggregator} from "./aggregator/batch.js";

class Bithumb extends bithumbRest {
    internalSymbols = [];

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
                'tradesLimit': 500,
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

        const symbol = this.internalToStandardSymbol(this.safeString(trade, 'symbol'));
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
            const limit = this.safeInteger(this.options, 'tradesLimit', 500);
            tradeCachedArray = new ArrayCache(limit);
            this.trades[symbol] = tradeCachedArray;
        }

        for (const rawTrade of rawTrades) {
            const trade = this.parseTrade(rawTrade)
            tradeCachedArray.append(trade)
        }

        const messageHash = 'trade:' + symbol;
        client.resolve(tradeCachedArray, messageHash);
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

    internalToStandardSymbol(symbol){
        return symbol.replace('_', '/')
    }

    toStandardSymbol(symbol){
        const {baseId, quoteId} = this.market(symbol);
        return `${baseId}/${quoteId}`
    }

    toInternalSymbol(symbol){
        const {baseId, quoteId} = this.market(symbol);
        return `${baseId}_${quoteId}`
    }

    getInternalSymbols() {
        return this.symbols.map((s) => this.toInternalSymbol(s))
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

        const msgHashes = symbols.map(s => 'trade' + ':' + s);
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
                this.internalSymbols = this.getInternalSymbols()
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
        if (bithumbCandleUnits.includes(unit)) {
            continue
        }

        let aggregator;
        const options = {exchange, unit: unit}
        if (isRegular) {
            aggregator = new RegularTimeCandleBatchAggregator(options)
        } else if (unit === '1w') {
            aggregator = new WeekCandleBatchAggregator(options)
        } else {
            throw new Error('No aggregator');
        }

        await aggregator.aggregateAll(db)
        console.log(`aggregate bithumb ${unit} candle history`)
    }

    console.log(`complete aggregate bithumb candle history`)
}

// 모든 캔들 수집하는데 30분 걸림
export const collectCandleHistory = async (db) => {
    console.log(`start collect bithumb candle history`)

    const bithumb = new Bithumb();
    await bithumb.loadMarkets();

    const {symbols} = bithumb;
    for (const symbol of symbols) {
        const internalSymbol = bithumb.toStandardSymbol(symbol);
        for (const [timeframe, bithumbTimeframe] of Object.entries(bithumb.timeframes)) {
            const {type, value} = CANDLES[timeframe];
            const rangeValue = type === 'day' ? value * 24 : value
            const rangeType = type === 'day' ? 'hours' : type

            const candles = await bithumb.fetchOHLCV(symbol, bithumbTimeframe);

            const parsedCandles = candles.map(
                ([tms, open, high, low, close, volume]) => {
                    const {start} = getTimeRangeWithMoment(tms, rangeType, rangeValue);
                    return {start, symbol: internalSymbol, open, high, low, close, volume, closed: true};
                }
            )

            await db.writeCandles(bithumb.name.toLowerCase(), timeframe, parsedCandles)
            console.log(`collect ${internalSymbol} ${timeframe} candle history:`, candles.length)
        }
    }

    console.log(`complete collect bithumb candle history`)
}

export const collect = async (config) => {
    const writer = new Quest();
    const reader = new Postgres(config);

    const bithumb = new Bithumb();
    await bithumb.loadMarkets();
    const loadMarketInterval = setInterval(() => {bithumb.loadMarkets(true).catch(console.error)}, 1000 * 60 * 60);

    const minAggregator = new CandleRealtimeAggregator(
        {unit: '1m', exchange: bithumb.name.toLowerCase()}
    );
    await minAggregator.loadLatestCandles(reader)
    const persistInterval = setInterval(() => {
        minAggregator.persist(writer).catch(console.error)
    }, 1000 * 3);

    while (true) {
        try {
            const trades = await bithumb.watchTradesForSymbols(bithumb.internalSymbols);
            for (const trade of trades) {
                minAggregator.aggregate(trade);
            }
        } catch (e) {
            console.error(e)
            await sleep(10);
        }
    }

    // TODO: signal
    // await writer.close();
    // await reader.close();
}

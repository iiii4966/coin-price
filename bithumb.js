import {bithumb as bithumbRest} from 'ccxt';
import {ArrayCache} from "./cache.js";
import {QuestDB} from "./questdb.js";
import {sleep} from "./utils.js";
import {CandleAggregator} from "./aggregator.js";

class Bithumb extends bithumbRest {
    wsSymbols = [];
    msgHashes = [];

    describe() {
        return this.deepExtend(super.describe(), {
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
        // 				"symbol" : "BTC_KRW",					// 통화 코드
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
            timestamp -= 9 * 3600000; // they report UTC + 9 hours, server in Korean timezone
        }

        market = this.safeString(trade, 'symbol');
        let side = this.safeString(trade, 'buySellGb');
        side = (side === '1') ? 'buy' : 'sell';
        const priceString = this.safeString(trade, 'contPrice');
        const amountString = this.fixCommaNumber(this.safeString2(trade, 'contQty', 'units'));
        const costString = this.safeString(trade, 'contAmt');

        return this.safeTrade({
            'id': timestamp,
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601(timestamp),
            'symbol': market,
            'order': undefined,
            'type': 'trade',
            'side': side,
            'takerOrMaker': undefined,
            'price': priceString,
            'amount': amountString,
            'cost': costString,
            'fee': {},
        }, market);
    }

    handleTrades(client, message) {
        const rawTrades = message.content.list;
        const first = this.safeValue(rawTrades, 0);
        const marketId = this.safeString(first, 'symbol');

        let tradeCachedArray = this.safeValue(this.trades, marketId);
        if (tradeCachedArray === undefined) {
            const limit = this.safeInteger(this.options, 'tradesLimit', 1000);
            tradeCachedArray = new ArrayCache(limit);
        }

        for (const rawTrade of rawTrades) {
            const trade = this.parseTrade(rawTrade)
            tradeCachedArray.append(trade)
        }

        this.trades[marketId] = tradeCachedArray;

        const messageHash = 'trade:' + marketId;
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

    async watchTradesForSymbols(symbols = [],
                                msgHashes = undefined,
                                since = undefined,
                                limit = undefined,
                                params = {}){
        const url = this['urls']['api']['ws']
        if (!this.valueIsDefined(msgHashes)) {
            msgHashes = symbols.map(s => 'trade' + ':' + s);
        }
        const request = {
            type : 'transaction',
            symbols,
        }

        const trades = await this.watchMultiple(url, msgHashes, request, msgHashes);

        if (this.newUpdates) {
            const first = this.safeValue(trades, 0);
            const tradeSymbol = this.safeString(first, 'symbol');
            limit = trades.getLimit(tradeSymbol, limit);
        }
        return this.filterBySinceLimit(trades, since, limit, 'timestamp', true);
    }

    async loadMarkets(reload = false, params = {}){
        await super.loadMarkets(reload, params)
        this.wsSymbols = this.symbols.map(s => s.replace('/', '_'))
        this.msgHashes = this.wsSymbols.map(s => 'trade' + ':' + s);
        console.log('load ws symbols:', this.wsSymbols.length);
        return this.marketsLoading;
    }
}

export const collect = async () => {
    const db = new QuestDB();

    const bithumb = new Bithumb();
    await bithumb.loadMarkets();
    setInterval(async () => {await bithumb.loadMarkets(true)}, 1000 * 60 * 60);

    const minAggregator = new CandleAggregator(
        {unit: '1m', exchange: bithumb.name.toLowerCase()}
    );
    setInterval(() => {minAggregator.persist(db)}, 1000 * 5);

    while (true) {
        try {
            const trades = await bithumb.watchTradesForSymbols(bithumb.wsSymbols, bithumb.msgHashes);
            for (const trade of trades) {
                minAggregator.aggregate(trade);
            }
        } catch (e) {
            console.error(e)
            await sleep(100);
        }
    }
}

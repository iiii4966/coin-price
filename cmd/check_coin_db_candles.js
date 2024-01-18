import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";
import {Bithumb} from "../exchange/bithumb.js";
import fs from "fs";
import {sleep} from "../utils/utils.js";
import {Upbit} from "../exchange/upbit.js";


const compare = (c1, c2) => {
    const result = {
        summary: false,
        tms: false,
        open: false,
        high: false,
        low: false,
        close: false,
        volume: false,
        volumeDiff: 0,
    }

    if (c1.timestamp.getTime() !== c2.timestamp) {
        result.tms = true
    }
    if (c1.open !== c2.open) {
        result.open = true
    }
    if (c1.close !== c2.close) {
        result.close = true
    }
    if (c1.high !== c2.high) {
        result.high = true
    }
    if (c1.low !== c2.low) {
        result.low = true
    } else if (Number(c1.volume.toFixed(4)) !== Number(c2.volume.toFixed(4))) {
        result.volume = true
        result.volumeDiff = Math.abs(c1.volume - c2.volume)
    }
    result.summary = Object.values(result).some(r => r)
    return result;
}

const logCheckCandles = (exchange, symbol, unit, data) => {
    symbol = symbol.replace('/', '_')
    fs.writeFile(`check_coin_db_results/${exchange}_${unit}_${symbol}_check_result.json`, JSON.stringify(data, null, 4), (err) => {
        if (err) throw err;
    });
}

const logCheckSummary = (exchange, data) => {
    fs.writeFile(`check_coin_db_results/${exchange}_check_summary.json`, JSON.stringify(data, null, 4), (err) => {
        if (err) throw err;
    });
}


(async function checkSameCoinDBCandlesWithExchangeCandles() {
    const {parsed: config} = configDotenv();
    const coinDB = new Postgres(config)

    const exchangeInArg = process.argv[2]
    const symbolInArg = process.argv[3]
    const candleUnitsInArg = process.argv[4] ? [process.argv[4]] : ['15m']

    let exchange;
    let fetchOHLCVFunction;
    if (exchangeInArg === 'bithumb') {
        exchange = new Bithumb()
        fetchOHLCVFunction = exchange.fetchOHLCV.bind(exchange)
    } else if (exchangeInArg === 'upbit') {
        exchange = new Upbit()
        fetchOHLCVFunction = exchange.fetchOHLCVByCount.bind(exchange)
    } else {
        throw new Error(`no exchange: ${exchangeInArg}`)
    }

    await exchange.loadMarkets()
    const exchangeName = exchange.name.toLowerCase()
    const symbols = symbolInArg !== undefined ? [symbolInArg] : exchange.filterSymbols();

    const summaries = {}

    for (const symbol of symbols) {
        for (const unit of candleUnitsInArg) {
            const candles = await coinDB.fetchCandlesBySymbol(exchangeName, unit, exchange.toStandardSymbol(symbol), 0, 500, 'DESC');
            if (candles.length === 0) {
                console.log(`${exchangeName} ${symbol} ${unit} candle empty`)
                continue
            }

            const exchangeCandles = await fetchOHLCVFunction(symbol, unit, 0, 500);

            let exchangeCandlesMap = {}
            exchangeCandles.forEach(
                ([timestamp, open, high, low, close, volume], idx) => {
                    exchangeCandlesMap[timestamp] = {timestamp, open, high, low, close, volume};
                }
            )

            const diffCandles = {
                unit,
                symbol,
                diff: []
            }

            candles.slice(1).forEach((c) => {
                let diff = {
                    unix: c.timestamp.getTime(),
                    date: c.timestamp
                }

                const ec = exchangeCandlesMap[c.timestamp.getTime()]
                if (ec === undefined) {
                    // diffCandles.diff.push(diff)
                    return
                }
                const result = compare(c, ec)
                if (result.summary) {
                    diff = {
                        unix: c.timestamp.getTime(),
                        date: c.timestamp,
                        candle: c,
                        exchangeCandle: ec,
                        ...result
                    }
                    diffCandles.diff.push(diff)
                }
            });

            if (diffCandles.diff.length > 0) {
                logCheckCandles(exchangeName, symbol, unit, diffCandles)
            }

            const summary = {
                unit,
                diffCount: diffCandles.diff.length,
                dbCount: candles.length,
                apiCount: exchangeCandles.length,
                percent: ((diffCandles.diff.length / candles.length) * 100).toFixed(2),
                pricePercent: ((diffCandles.diff.filter(d => (d.open || d.high || d.low || d.close)).length / candles.length) * 100).toFixed(3),
                volumePercent: ((diffCandles.diff.filter(d => d.volume).length / candles.length) * 100).toFixed(2),
                maxVolumeDiff: Math.max(...diffCandles.diff.map(d => d.volumeDiff))
            }

            if (summaries[symbol]) {
                summaries[symbol].push(summary)
            } else {
                summaries[symbol] = [summary]
            }

            console.log(`${exchangeName} ${symbol} ${unit} candle diff:`, summary)
            await sleep(10)
        }
    }

    logCheckSummary(exchangeName, summaries)
    await coinDB.close()
}())

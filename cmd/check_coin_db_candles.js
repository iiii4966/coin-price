import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";
import {Bithumb} from "../exchange/bithumb.js";
import fs from "fs";
import {sleep} from "../utils/utils.js";


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


(async function checkCoinDBCandles() {
    const {parsed: config} = configDotenv();
    const coinDB = new Postgres(config)

    const bithumb = new Bithumb()
    await bithumb.loadMarkets()
    const exchange = bithumb.name.toLowerCase()
    const summaries = {}

    const {symbols} = bithumb;
    for (const symbol of symbols) {
        for (const unit of ['1m', '10m', '1h']) {
            const candles = await coinDB.fetchCandlesBySymbol(exchange, unit, symbol === 'ArchLoot/KRW' ? 'ALT/KRW' : symbol, 0, 1500, 'DESC');

            let bithumbOHCLV = await bithumb.fetchOHLCV(symbol, unit, 0, 1500);

            let bithumbCandlesMap = {}
            bithumbOHCLV.forEach(
                ([timestamp, open, high, low, close, volume], idx) => {
                    bithumbCandlesMap[timestamp] = {timestamp, open, high, low, close, volume};
                }
            )

            const diffCandles = {
                unit,
                symbol,
                diff: []
            }

            candles.forEach((c) => {
                let diff = {
                    unix: c.timestamp.getTime(),
                    date: c.timestamp
                }

                const bc = bithumbCandlesMap[c.timestamp.getTime()]
                if (bc === undefined) {
                    // diffCandles.diff.push(diff)
                    return
                }
                const result = compare(c, bc)
                if (result.summary) {
                    diff = {
                        unix: c.timestamp.getTime(),
                        date: c.timestamp,
                        ...result
                    }
                    diffCandles.diff.push(diff)
                }
            });

            // logCheckCandles(exchange, symbol, unit, diffCandles)

            const summary = {
                unit,
                diffCount: diffCandles.diff.length,
                dbCount: candles.length,
                apiCount: bithumbOHCLV.length,
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

            console.log(`bithumb ${symbol} ${unit} candle diff:`, summary)
            await sleep(10)
        }
    }

    logCheckSummary(exchange, summaries)
    await coinDB.close()
}())

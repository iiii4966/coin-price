import {candleProps, db} from "./src/utils.js";
import fs from 'fs';

let candleQueries = {};
candleProps.forEach(candleProp => {
    const { type } = candleProp;
    candleQueries[type] = db.prepare(`SELECT 
     tms,
     op,
     hp,
     lp,
     cp,
     tv
     FROM ${type}Candle
     WHERE market = ?
     AND code = ?
     AND isComplete = true
     ORDER BY tms DESC
     LIMIT ?`);
});

// log format -> csv
// data file -> code, timestamp, op, hp, lp, cp, tv, different
// summary file -> code, price_diff_count, volume_diff_count, data_count, diff_ratio

const fetchCodes = () => {
    const sql = `
        SELECT DISTINCT code
        FROM MinCandle
        WHERE market = 'UPBIT'
    `
    return db.prepare(sql).all();
}

const compare = (c1, c2) => {
    const result = {
        summary: false,
        open: false,
        high: false,
        low: false,
        close: false,
        volume: false,
        volumeDiff: 0,
    }

    if (c1.op !== c2.op) {
        result.open = true
    }
    if (c1.cp !== c2.cp) {
        result.close = true
    }
    if (c1.hp !== c2.hp) {
        result.hp = true
    }
    if (c1.lp !== c2.lp) {
        result.low = true
    } else if (Number(c1.tv.toFixed(4)) !== Number(c2.tv.toFixed(4))) {
        result.volume = true
        result.volumeDiff = Math.abs(c1.tv - c2.tv)
    }

    result.summary = Object.values(result).some(r => r);
    result.isPrice = result.open || result.high || result.low || result.close;
    result.isVolume = result.volume;
    result.tms = c1.tms;
    return result;
}

async function fetchUpbitCandleData(code, unit) {
    let path;
    if (unit === 'Min') {
        path = `v1/candles/minutes/1`
    } else if (unit === 'Min15') {
        path = `v1/candles/minutes/15`
    } else if (unit === 'Day') {
        path = `v1/candles/days`
    }

    let startTime;
    const candles = {};

    while (Object.keys(candles).length < 1000){
        let url;
        if (!startTime) {
            url = `https://api.upbit.com/${path}?market=${code}&count=200`
        } else {
            url = `https://api.upbit.com/${path}?market=${code}&to=${startTime}&count=200`
        }

        const res = await got.get(url);
        let data = res.body;
        data = JSON.parse(data)

        if (data.length === 0) {
            break
        }

        startTime = data[data.length - 1].candle_date_time_utc

        data.forEach((d) => {
            const parsed = {
                tms: new Date(d.candle_date_time_utc + ".000Z").getTime(),
                op: d.opening_price,
                cp: d.trade_price,
                hp: d.high_price,
                lp: d.low_price,
                tv: d.candle_acc_trade_volume,
            }

            candles[parsed.tms] = parsed
        });
    }

    console.log(code, Object.keys(candles).length)
    return candles
}

const boolToOX = (b) => {
    return b ? 'o' : 'x';
}

(async function () {
    // 1. sqlite 에서 symbol 조회
    // 2. symbol iteration
    // 3. candle unit iteration
    // 4. sqlite candle fetch
    // 5. upbit api candle fetch
    // 6. compare candle
    // 7. if candle exist diff, write csv

    const codes = fetchCodes();
    const results = [];
    for (const {code} of codes) {
        for (const unit of ['Min', 'Min15', 'Day']) {
            const candles = candleQueries[unit].all('UPBIT', code, 1000);
            const upbitCandlesMap = await fetchUpbitCandleData(code, unit)
            const diffs = []
            candles.forEach((c) => {
                const upbitCandle = upbitCandlesMap[c.tms]
                if (!upbitCandle) {
                    // console.log(c)
                    return
                }
                const {
                    summary,
                    tms,
                    open,
                    close,
                    low,
                    high,
                    volume,
                    volumeDiff,
                    isPrice,
                    isVolume,
                } = compare(c, upbitCandle);

                if (summary) {
                    diffs.push([
                        code,
                        new Date(tms).toISOString(),
                        tms,
                        boolToOX(open),
                        boolToOX(high),
                        boolToOX(low),
                        boolToOX(close),
                        boolToOX(volume),
                        isPrice,
                        isVolume,
                        volumeDiff
                    ])
                }
            })
            // const csvData = diffs.sort((a,b) => b - a).map(row => row.join(',')).join('\n');
            // fs.writeFileSync(`compare_${unit.toLowerCase()}_candle_result.csv`, 'code,date,tms,open,high,low,close,volume,volumeDiff\n')
            // fs.appendFileSync(`compare_${unit.toLowerCase()}_candle_result.csv`, csvData, 'utf8');

            let maxVolumeDiff = 0;
            let maxVolumeDiffDate;
            diffs.forEach(d => {
                const volumeDiff = d[d.length - 1]
                if (maxVolumeDiff < volumeDiff) {
                    maxVolumeDiff = volumeDiff
                    maxVolumeDiffDate = d[1]
                }
            })

            results.push([
                code,
                unit.toLowerCase(),
                diffs.length,
                ((diffs.length / 1000) * 100).toFixed(2),
                diffs.filter(d => d[8]).length,
                diffs.filter(d => d[9]).length,
                maxVolumeDiff.toFixed(2),
                maxVolumeDiffDate,
            ])

            await (function sleep(ms) {
                return new Promise((r) => setTimeout(r, ms));
            }(10))
        }
    }
    fs.writeFileSync(`compare_candle_result.csv`, 'code,candle,diffCount,diffPercent,priceDiffCount,volumeDiffCount,maxVolumeDiff,maxVolumeDiffDate\n');
    fs.appendFileSync(`compare_candle_result.csv`, results.sort((a,b) => b - a).map(row => row.join(',')).join('\n'), 'utf8');
}())

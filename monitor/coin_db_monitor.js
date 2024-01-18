import {Bithumb} from "../exchange/bithumb.js";
import {sleep} from "../utils/utils.js";
import {Upbit} from "../exchange/upbit.js";
import {writeJsonFile} from "../utils/file.js";


export class CoinDBMonitor {

    constructor(options = {}) {
        this.slack = options.slack
        this.coinDB = options.coinDB
    }

    compare = (c1, c2) => {
        const result = {}

        result.open = c1.open !== c2.open
        result.close = c1.close !== c2.close
        result.high = c1.high !== c2.high
        result.low = c1.low !== c2.low

        const volumeDiff = Number(Math.abs(c1.volume - c2.volume).toFixed(4));
        result.volume = volumeDiff >= 0.1
        result.volumeDiff = volumeDiff

        result.summary = result.open || result.high || result.low || result.close || result.volume
        return result;
    }

    // 캔들 최초 생성시간이 1분 이상 차이나는지 확인
    compareCreatedAt = (timestamp, createdAt) => {
        const diff = Math.abs(timestamp - createdAt);
        const isDiff = createdAt && createdAt.getFullYear() !== 1970 && diff > 61000
        return {isDiff, diffTime: diff}
    }

    writeLogDiffCandles = (exchange, symbol, unit, data) => {
        const path = `check_coin_db_results/${exchange}_${unit}_${symbol.replace('/', '_')}.json`
        writeJsonFile(path, data);
        return path;
    }

    writeLogDiffCandleSummary = (exchange, data) => {
        const path = `check_coin_db_results/${exchange}_캔들_정합성_확인_결과.json`
        writeJsonFile(path, data);
        return path;
    }

    async checkCoinDBCandlesConsistency(
        {
            exchangeName = 'bithumb',
            units = ['1m', '10m', '1h'],
            symbols = ['BTC/KRW'],
            checkCount = 500,
            isLogDiffCandlesToFile = false,
            isLogSummaryToFile = false,
            isLogSummaryToSlack = false,
        }
    ) {
        let exchange;
        let fetchOHLCVFunction;
        if (exchangeName === 'bithumb') {
            exchange = new Bithumb()
            fetchOHLCVFunction = exchange.fetchOHLCV.bind(exchange)
        } else if (exchangeName === 'upbit') {
            exchange = new Upbit()
            fetchOHLCVFunction = exchange.fetchOHLCVByCount.bind(exchange)
        } else {
            throw new Error(`Not implement exchange: ${exchangeName}`)
        }

        await exchange.loadMarkets()
        symbols = symbols === 'all' ? exchange.filterSymbols() : symbols;

        const summaries = {}

        for (const symbol of symbols) {
            for (const unit of units) {
                const dbSymbol = exchange.toStandardSymbol(symbol);

                let summary = {
                    symbol: dbSymbol,
                    unit,
                    checkCount,
                    diffCount: 0,
                    createdAtDiffCount: 0,
                    dbCount: 0
                }

                const dbCandles = await this.coinDB.fetchCandlesBySymbol(
                    exchangeName, unit, dbSymbol, 0, checkCount, 'DESC'
                );
                if (dbCandles.length === 0) {
                    if (summaries[dbSymbol]) {
                        summaries[dbSymbol].push(summary)
                    } else {
                        summaries[dbSymbol] = [summary]
                    }
                    continue
                }

                let dbCandlesMap = {}
                dbCandles.forEach(
                    ({timestamp, open, high, low, close, volume, created_at: createdAt}) => {
                        const tms = timestamp.getTime();
                        dbCandlesMap[tms] = {timestamp: tms, open, high, low, close, volume, createdAt};
                        if (createdAt) {
                            const {isDiff, diffTime} = this.compareCreatedAt(timestamp, createdAt)
                            if (isDiff) {
                                summary.createdAtDiffCount += 1
                            }
                        }
                    }
                )

                let exchangeCandles = await fetchOHLCVFunction(symbol, unit, 0, checkCount);
                exchangeCandles = exchangeCandles.map(([timestamp, open, high, low, close, volume]) => {
                    return {timestamp, open, high, low, close, volume}
                }).sort((c1, c2) => c2.timestamp - c1.timestamp).slice(1); // 봉마감되지 않는 캔들 제외

                const diffResult = {
                    unit,
                    symbol: dbSymbol,
                    diffCandles: []
                }

                exchangeCandles.forEach((ec) => {
                    let diff = {
                        tms: ec.timestamp,
                        date: new Date(ec.timestamp),
                        dbCandle: null,
                        exchangeCandle: ec,
                    }

                    const dc = dbCandlesMap[ec.timestamp]
                    if (dc === undefined) {
                        diffResult.diffCandles.push(diff) // 거래소에서 조회되었지만 db 에는 없는 캔들
                        return
                    }
                    const result = this.compare(dc, ec)
                    if (result.summary) {
                        diff.dbCandle = dc;
                        diff = {
                            ...diff,
                            ...result,
                        }
                        diffResult.diffCandles.push(diff)
                    }
                });

                const {diffCandles} = diffResult

                if (diffCandles.length > 0 && isLogDiffCandlesToFile) {
                    this.writeLogDiffCandles(exchangeName, dbSymbol, unit, diffCandles)
                }

                summary = {
                    ...summary,
                    dbCount: dbCandles.length,
                    exchangeCount: exchangeCandles.length,
                    diffCount: diffCandles.length,
                    openDiffCount: diffCandles.filter(d => d.open).length,
                    highDiffCount: diffCandles.filter(d => d.high).length,
                    lowDiffCount: diffCandles.filter(d => d.low).length,
                    closeDiffCount: diffCandles.filter(d => d.close).length,
                    volumeDiffCount: diffCandles.filter(d => d.volume).length,
                    gapCount: diffCandles.filter(d => d.dbCandle === null).length,
                    maxVolumeDiff: Math.max(...diffCandles.map(d => d.volumeDiff))
                }

                if (summaries[dbSymbol]) {
                    summaries[dbSymbol].push(summary)
                } else {
                    summaries[dbSymbol] = [summary]
                }

                console.log(`Checked ${exchangeName} ${dbSymbol} ${unit} candle diff:`, summary.diffCount)

                await sleep(10)
            }
        }

        const onlyDiffSummary = [];
        Object.entries(summaries).map(([symbol, summaries])=> {
            onlyDiffSummary.push(...summaries.filter(s => s.diffCount > 0));
        })

        if (onlyDiffSummary.length > 0 && isLogSummaryToFile) {
            const filePath = this.writeLogDiffCandleSummary(exchangeName, onlyDiffSummary)
            if (isLogSummaryToSlack) {
                const filename = filePath.split('/')[1]
                const title = units.length === 1 ? `${exchangeName} ${units[0]} 캔들 정합성 확인 결과` : undefined
                await this.slack.uploadFile(filePath, filename, title)
            }
        }
    }
}

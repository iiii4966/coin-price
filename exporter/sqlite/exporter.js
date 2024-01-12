import {CANDLES} from "../../utils/constant.js";
import {getCandleTimeRange, sleep} from "../../utils/utils.js";


export class CoinMeerkatSqliteExporter {
    exchange
    candleUnits
    coinDB
    sqliteDB

    constructor(options = {}) {
        this.exchange = options.exchange;
        this.candleUnits = options.candleUnits ?? Object.keys(CANDLES);
        this.coinDB = options.coinDB;
        this.sqliteDB = options.sqliteDB;
    }

    convertExportData({timestamp: tms, symbol: code, open: op, high: hp, low: lp, close: cp, volume: tv}){
        return {market: this.exchange.toUpperCase(), tms: tms.getTime(), code, op, hp, lp, cp, tv}
    }

    async fetchSymbols(){
        const sql = `
            SELECT DISTINCT symbol FROM bithumb_candle_1m WHERE symbol LIKE '%KRW' ORDER BY symbol;
        `
        const {rows} = await this.coinDB.query(sql);
        return rows;
    }

    async loadCandleHistory(limit = 2000){
        const symbols = await this.fetchSymbols();

        const bulkInsertStatements = this.sqliteDB.prepareCandleBulkInsert()

        for (const {symbol} of symbols) {
            for (const unit of this.candleUnits) {
                const sql = `
                    SELECT 
                      timestamp,
                      symbol,
                      open, 
                      high, 
                      low, 
                      close, 
                      volume 
                    FROM ${this.exchange}_candle_${unit}  
                    WHERE symbol = '${symbol}'
                    ORDER BY timestamp DESC
                    LIMIT ${limit}
                `
                const {rows} = await this.coinDB.query(sql);
                const convertedRows = rows.map((row) => {
                    return this.convertExportData(row)
                })

                const exportUnit = CANDLES[unit].sqlite.unit;
                const bulkInsert = bulkInsertStatements[exportUnit];
                bulkInsert(convertedRows)
                console.log(`load ${symbol} ${unit} candle history`, rows.length)
                await sleep(10)
            }

        }

        console.log('complete candle history')
    }

    async updateLatestCandles(){
        console.time('t')
        const nowTms = new Date().getTime();
        const bulkInsertStatements = this.sqliteDB.prepareCandleBulkInsert()

        for (const unit of this.candleUnits) {
            let {start} = getCandleTimeRange(nowTms, unit);
            start -= CANDLES[unit].ms
            console.time(unit)
            const query = `
                SELECT
                    timestamp,
                    symbol,
                    open, 
                    high,
                    low,
                    close,
                    volume,
                FROM ${this.exchange}_candle_${unit}
                WHERE symbol LIKE '%KRW' AND timestamp >= ${start * 1000}
            `

            const {rows} = await this.coinDB.query(query);
            const convertedRows = rows.map((row) => {
                return this.convertExportData(row)
            })

            const exportUnit = CANDLES[unit].sqlite.unit;
            const bulkInsert = bulkInsertStatements[exportUnit];
            console.time(unit + '-' + 'sqlite')
            bulkInsert(convertedRows)
            console.timeEnd(unit + '-' + 'sqlite')
            console.log(`update latest ${unit} candle:`, rows.length)
            console.timeEnd(unit)
        }
        console.timeEnd('t')
    }
}


export class BithumbSqliteExporter extends CoinMeerkatSqliteExporter{

    constructor(options = {}) {
        options.exchange = 'bithumb';
        super(options)
    }

    convertExportData({timestamp: tms, symbol: code, open: op, high: hp, low: lp, close: cp, volume: tv}){
        return {
            market: this.exchange.toUpperCase(),
            tms: tms.getTime(),
            code: code.replace('/', '_'),
            op,
            hp,
            lp,
            cp,
            tv
        }
    }
}

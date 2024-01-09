import {CANDLES} from "../../utils/constant.js";


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

    async loadCandleHistory(){
        const bulkInsertStatements = this.sqliteDB.prepareCandleBulkInsert()
        for (const unit of this.candleUnits) {
            const query = `
                SELECT 
                  timestamp,
                  symbol,
                  open, 
                  high, 
                  low, 
                  close, 
                  volume 
                FROM ${this.exchange}_candle_${unit}  
                WHERE symbol LIKE '%KRW'
            `
            const {rows} = await this.coinDB.query(query);
            const convertedRows = rows.map((row) => {
                return this.convertExportData(row)
            })

            const exportUnit = CANDLES[unit].sqlite.unit;
            const bulkInsert = bulkInsertStatements[exportUnit];
            bulkInsert(convertedRows)
            console.log(`load ${unit} candle history`, rows.length)
        }

        console.log('complete candle history')
    }

    async updateLatestCandles(){
        const bulkInsertStatements = this.sqliteDB.prepareCandleBulkInsert()

        for (const unit of this.candleUnits) {
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
                WHERE symbol LIKE '%KRW'
                LATEST ON timestamp PARTITION BY symbol;
            `

            const {rows} = await this.coinDB.query(query);
            const convertedRows = rows.map((row) => {
                return this.convertExportData(row)
            })

            const exportUnit = CANDLES[unit].sqlite.unit;
            const bulkInsert = bulkInsertStatements[exportUnit];
            bulkInsert(convertedRows)
            console.log(`update latest ${unit} candle`, rows.length)
        }
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

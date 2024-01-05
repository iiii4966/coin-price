import pg from 'pg';


export class Postgres {
    pool

    constructor(config) {
        this.pool = new pg.Pool({
            host: config.DB_HOST,
            port: config.DB_PORT,
            user: config.DB_USER,
            password: config.DB_PASSWORD,
            database: config.DB_NAME,
        });
    }

    async connect(){
        return this.pool.connect()
    }

    async close(){
        await this.pool.end()
    }

    async query(query, params){
        const client = await this.connect();
        const result = await client.query(query, params);
        client.release();
        return result;
    }

    async fetchLatestCandles(exchange, unit = '1m'){
        const sql = `
            SELECT
                cast(extract(epoch from timestamp) * 1000 as bigint) timestamp,
                symbol,
                open, 
                high,
                low,
                close,
                volume,
            FROM ${exchange}_candle_${unit} 
            LATEST ON timestamp PARTITION BY symbol;
        `
        const result = await this.query(sql);
        return result.rows
    }

    async getOldestCandleTms(exchange, unit = '1m'){
        const sql = `
            SELECT timestamp FROM ${exchange}_candle_${unit} ORDER BY timestamp ASC LIMIT 1;
        `
        const result = await this.query(sql);
        return result.rows[0].timestamp
    }

    async aggregateAllCandles(params = {}){
        const {exchange, unit, sampleBy, sampleByBase, isAlign = true} = params;

        let alignToQuery = ''
        if (isAlign) {
            alignToQuery = 'ALIGN TO CALENDAR'
        }

        const sql = `
            INSERT INTO ${exchange}_candle_${unit}(timestamp, symbol, open, high, low, close, volume)
            SELECT
              timestamp,
              symbol,
              first(open) open,
              max(high) high,
              min(low) low,
              last(close) close,
              nsum(volume) volume
            FROM ${exchange}_candle_${sampleByBase}
            SAMPLE BY ${sampleBy} ${alignToQuery};
        `
        return this.query(sql);
    }

    async aggregateLatestCandles(params = {}){
        const {exchange, unit, sampleBy, sampleByBase, timestamp, isAlign = true} = params;

        let alignToQuery = ''
        if (isAlign) {
            alignToQuery = 'ALIGN TO CALENDAR'
        }

        const sql = `
            INSERT INTO ${exchange}_candle_${unit}(timestamp, symbol, open, high, low, close, volume)
            SELECT
              timestamp,
              symbol,
              first(open) open,
              max(high) high,
              min(low) low,
              last(close) close,
              nsum(volume) volume
            FROM ${exchange}_candle_${sampleByBase}
            WHERE ${timestamp * 1000} <= timestamp
            SAMPLE BY ${sampleBy} ${alignToQuery};
        `
        return this.query(sql);
    }

    async aggregateCandlesByTimeFrame(params = {}){
        const {exchange, unit, sampleBy, sampleByBase, range, isAlign = true} = params;

        let alignToQuery = ''
        if (isAlign) {
            alignToQuery = 'ALIGN TO CALENDAR'
        }

        const {start, end} = range;
        const sql = `
            INSERT INTO ${exchange}_candle_${unit}(timestamp, symbol, open, high, low, close, volume)
            SELECT
              timestamp,
              symbol,
              first(open) open,
              max(high) high,
              min(low) low,
              last(close) close,
              nsum(volume) volume
            FROM ${exchange}_candle_${sampleByBase}
            WHERE ${start * 1000} <= timestamp AND ${end * 1000} > timestamp
            SAMPLE BY ${sampleBy} ${alignToQuery};
        `
        return this.query(sql);
    }


}

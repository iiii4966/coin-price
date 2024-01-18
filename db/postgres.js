import pg from 'pg';
import fs from "fs";


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

    async fetchSymbols(exchange){
        const sql = `
            SELECT DISTINCT symbol FROM ${exchange}_candle_1m ORDER BY symbol;
        `
        const {rows} = await this.query(sql);
        return rows;
    }


    async fetchCandlesBySymbol(exchange,
                               unit = '1m',
                               symbol,
                               since = 0,
                               limit = 1000,
                               order = 'DESC'){
        let select;
        if (unit === '1m') {
            select = `
                timestamp,
                symbol,
                open, 
                high,
                low,
                close,
                volume,
                created_at
            `
        } else {
            select = `
                timestamp,
                symbol,
                open, 
                high,
                low,
                close,
                volume
            `
        }
        const sql = `
            SELECT ${select}
            FROM ${exchange}_candle_${unit}
            WHERE symbol = '${symbol}'
            ORDER BY timestamp ${order}
            LIMIT ${since}, ${limit}
        `
        const {rows} = await this.query(sql);
        return rows;
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
                volume
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
        const {
            exchange, unit, sampleBy, sampleByBase, timezone = 'UTC', isAlign = true
        } = params;

        let alignToQuery = ''
        if (isAlign) {
            alignToQuery = `ALIGN TO CALENDAR TIME ZONE '${timezone}'`
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
        const {
            exchange, unit, sampleBy, sampleByBase, timestamp, timezone = 'UTC', isAlign = true
        } = params;

        let alignToQuery = ''
        if (isAlign) {
            alignToQuery = `ALIGN TO CALENDAR TIME ZONE '${timezone}'`
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
        if (unit === '3m') {
            const result = await this.query(`
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
            `)
            fs.appendFile(`${exchange}_aggregate_latest_candles`, sql + '\n', (err) => {if (err) throw err;})
            fs.appendFile(`${exchange}_aggregate_latest_candles`, JSON.stringify(result.rows), (err) => {
                if (err) throw err;
            });

            const sql2 = `
                SELECT
                  timestamp,
                  symbol,
                  open,
                  high,
                  low, 
                  close, 
                  volume
                FROM ${exchange}_candle_${sampleByBase}
                WHERE ${timestamp * 1000} <= timestamp
            `
            const result2 = await this.query(sql2)

            fs.appendFile(`${exchange}_aggregate_latest_candles`, sql2 + '\n', (err) => {if (err) throw err;})
            fs.appendFile(`${exchange}_aggregate_latest_candles`, JSON.stringify(result2.rows), (err) => {
                if (err) throw err;
            });

        }
        return this.query(sql);
    }

    async aggregateCandlesByTimeFrame(params = {}){
        const {
            exchange, unit, sampleBy, sampleByBase, range, timezone = 'UTC', isAlign = true
        } = params;

        let alignToQuery = ''
        if (isAlign) {
            alignToQuery = `ALIGN TO CALENDAR TIME ZONE '${timezone}'`
        }

        let {start, end} = range;
        start *= 1000
        end *= 1000

        const sql = `
            INSERT INTO ${exchange}_candle_${unit}(timestamp, symbol, open, high, low, close, volume)
            SELECT 
              CAST(${start} AS timestamp) timestamp,
              symbol,
              open,
              high,
              low,
              close,
              volume
            FROM (
              SELECT
                timestamp,
                symbol,
                first(open) open,
                max(high) high,
                min(low) low,
                last(close) close,
                nsum(volume) volume
              FROM ${exchange}_candle_${sampleByBase}
              WHERE ${start} <= timestamp AND timestamp < ${end}
              SAMPLE BY ${sampleBy} ${alignToQuery}
            )
        `
        return this.query(sql);
    }
}

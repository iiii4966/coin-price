import pg from 'pg';


export class PostgresDB {
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

    async query(query, params){
        const client = await this.connect();
        const result = await client.query(query, params);
        client.release();
        return result;
    }

    async loadLatestCandles(exchange, unit = '1m'){
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
        console.log(`load ${exchange} ${unit} candles:`, result.rowCount);
        return result.rows
    }


}

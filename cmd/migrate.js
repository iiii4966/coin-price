import {Postgres} from "../postgres.js";
import {CANDLES} from "../constant.js";
import {configDotenv} from "dotenv";


const createCandleTables = async (db) => {
    const client = await db.connect();
    for (const [unit, {questDB: {partitionBy}}] of Object.entries(CANDLES)) {
        await client.query(
            `
                CREATE TABLE IF NOT EXISTS bithumb_candle_${unit} (
                  timestamp TIMESTAMP,
                  symbol SYMBOL INDEX,
                  open DOUBLE,
                  close DOUBLE,
                  high DOUBLE,
                  low DOUBLE,
                  volume DOUBLE
                ) timestamp(timestamp) PARTITION BY ${partitionBy} WAL DEDUP UPSERT KEYS(timestamp, symbol);
            `
        )
    }
    await client.release()
    await db.pool.end();
}

(async function () {
    const {parsed: config} = configDotenv();
    const db = new Postgres(config)
    await createCandleTables(db)
}()).catch(console.error)

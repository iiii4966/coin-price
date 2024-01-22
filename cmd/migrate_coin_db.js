import {Postgres} from "../db/postgres.js";
import {CANDLES} from "../utils/constant.js";
import {configDotenv} from "dotenv";

const createCandleTables = async (db, exchange) => {
    for (const [unit, {questDB: {partitionBy}}] of Object.entries(CANDLES)) {
        if (unit === '1m') {
            await db.query(
                `
                CREATE TABLE IF NOT EXISTS ${exchange}_candle_${unit} (
                  timestamp TIMESTAMP,
                  symbol SYMBOL INDEX,
                  open DOUBLE,
                  close DOUBLE,
                  high DOUBLE,
                  low DOUBLE,
                  volume DOUBLE,
                  created_at TIMESTAMP
                ) timestamp(timestamp) PARTITION BY ${partitionBy} WAL DEDUP UPSERT KEYS(timestamp, symbol);
            `
            )
        } else {
            await db.query(
                `
                CREATE TABLE IF NOT EXISTS ${exchange}_candle_${unit} (
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
    }
}

(async function () {
    const {parsed: config} = configDotenv();
    const db = new Postgres(config)
    const client = await db.connect();
    await createCandleTables(client, 'bithumb')
    await createCandleTables(client, 'upbit')
    console.log('complete coin db migrate')
    await client.close();
}())

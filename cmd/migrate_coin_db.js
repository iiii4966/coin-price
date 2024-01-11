import {Postgres} from "../db/postgres.js";
import {CANDLES} from "../utils/constant.js";
import {configDotenv} from "dotenv";

const createCandleTables = async (db, exchange) => {
    const client = await db.connect();
    for (const [unit, {questDB: {partitionBy}}] of Object.entries(CANDLES)) {
        await client.query(
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

(async function () {
    const {parsed: config} = configDotenv();
    const db = new Postgres(config)
    await createCandleTables(db, 'bithumb')
    await createCandleTables(db, 'upbit')
    console.log('complete coin db migrate')
    await db.close();
}()).catch(console.error)

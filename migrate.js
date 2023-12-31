import {PostgresDB} from "./postgresdb.js";
import {loadConfig} from "./config.js";
import {CANDLES} from "./constant.js";


const connectDB = () => {
    const config = loadConfig()
    return new PostgresDB(config.postgres);
}

const createCandleTables = async () => {
    const db = await connectDB();
    const client = await db.connect();
    for (const {sampleUnit} of Object.values(CANDLES)) {
        await client.query(
            `
                CREATE TABLE IF NOT EXISTS bithumb_candle_${sampleUnit} (
                  timestamp TIMESTAMP,
                  symbol SYMBOL INDEX,
                  open DOUBLE,
                  close DOUBLE,
                  high DOUBLE,
                  low DOUBLE,
                  volume DOUBLE
                ) timestamp(timestamp) PARTITION BY DAY WAL DEDUP UPSERT KEYS(timestamp, symbol);
            `
        )
    }
    await client.release()
    await db.pool.end();
}

(async function () {
    await createCandleTables()
}()).catch(console.error)

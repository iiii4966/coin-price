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
                CREATE TABLE IF NOT EXISTS bithumb_ohlcv_${sampleUnit} (
                  timestamp TIMESTAMP,
                  symbol SYMBOL,
                  candle SYMBOL,
                  open DOUBLE,
                  close DOUBLE,
                  high DOUBLE,
                  low DOUBLE,
                  volume DOUBLE
                ) timestamp (timestamp) PARTITION BY DAY WAL;
            `
        )
    }
    await client.release()
    await db.pool.end();
}

const createCandleTableV2 = async () => {
    const db = await connectDB();
    const client = await db.connect();
    await client.query(
        `
            CREATE TABLE IF NOT EXISTS bithumb_ohlcv (
              timestamp TIMESTAMP,
              symbol SYMBOL,
              candle SYMBOL,
              open DOUBLE,
              close DOUBLE,
              high DOUBLE,
              low DOUBLE,
              volume DOUBLE
            ) timestamp (timestamp) PARTITION BY DAY WAL;
        `
    )
    await client.release()
    await db.pool.end();
}

const dropCandleTables = async () => {
    const db = await connectDB();
    const client = await db.connect();
    for (const {sampleUnit} of Object.values(CANDLES)) {
        await client.query(
            `
                DROP TABLE bithumb_ohlcv_${sampleUnit}
            `
        )
    }
    await client.release()
    await db.pool.end();
}

(async function () {
    await dropCandleTables()
}()).catch(console.error)
import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";

(async function checkSameCoinDBCandlesWithExchangeCandles() {
    const {parsed: config} = configDotenv();

    const coinDB = new Postgres(config)

    const exchangeName = process.argv[2] ?? 'bithumb'
    const symbols = await coinDB.fetchSymbols(exchangeName)

    const duplicateSymbols = new Set();

    for (const {symbol} of symbols) {
        const candles = await coinDB.fetchCandlesBySymbol(exchangeName, '1m', symbol, 0, 500, 'DESC');
        for (const {timestamp, created_at} of candles) {
            if (created_at && created_at.getFullYear() !== 1970 && timestamp.getMinutes() !== created_at.getMinutes()) {
                console.log(`${symbol} difference minutes`, timestamp.getMinutes(), created_at.getMinutes(), timestamp, created_at)
                duplicateSymbols.add(symbol)
            }
        }
    }

    console.log(duplicateSymbols.size, duplicateSymbols);
    await coinDB.close()
}())

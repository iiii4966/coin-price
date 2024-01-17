import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";

(async function checkSameCoinDBCandlesWithExchangeCandles() {
    const {parsed: config} = configDotenv();

    config.DB_HOST = process.argv[2] ?? '43.200.23.235'
    const coinDB = new Postgres(config)

    const exchangeName = process.argv[3] ?? 'bithumb'
    const symbolInArg = process.argv[4]
    const symbols = symbolInArg ? [{symbol: symbolInArg}] : (await coinDB.fetchSymbols(exchangeName))

    const duplicateSymbols = new Set();

    for (const {symbol} of symbols) {
        const candles = await coinDB.fetchCandlesBySymbol(exchangeName, '1m', symbol, 0, 15, 'DESC');
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

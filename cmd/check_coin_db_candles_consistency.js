import {CoinDBMonitor} from "../monitor/coin_db_monitor.js";
import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";
import {Slack} from "../utils/slack.js";

(async function () {
    const {parsed: config} = configDotenv();
    const db = new Postgres(config)

    const slack = new Slack({slackApiToken: config.SLACK_API_TOKEN})
    const monitor = new CoinDBMonitor({coinDB: db, slack})

    const params = {
        exchangeName: 'upbit',
        units: ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'],
        symbols: ['BTC/KRW', 'BTT/KRW'],
        checkCount: 200,
        isLogDiffCandlesToFile: true,
        isLogSummaryToFile: true,
        isLogSummaryToSlack: true,
    }
    await monitor.checkCoinDBCandlesConsistency(params)
    await db.close()
}())

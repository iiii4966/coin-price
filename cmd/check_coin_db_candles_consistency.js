import {CoinDBMonitor} from "../monitor/coin_db_monitor.js";
import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";
import {Slack} from "../utils/slack.js";

(async function () {
    const {parsed: config} = configDotenv();
    const db = new Postgres(config)

    const slack = new Slack({slackApiToken: config.SLACK_API_TOKEN})
    const monitor = new CoinDBMonitor({coinDB: db, slack})

    const options = {
        exchangeName: 'bithumb',
        units: ['1h'],
        symbols: ['1INCH/KRW'],
        checkCount: 20,
        isLogDiffCandlesToFile: false,
        isLogSummaryToFile: true,
        isLogSummaryToSlack: true,
    }

    await monitor.checkCoinDBCandlesConsistency(options)
    await db.close()
}())

import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";
import {CronJob} from "cron";
import {aggregateRealtimeCandles} from "../aggregator/batch.js";
import * as Sentry from "@sentry/node";

const bootstrap = async () => {
    const {parsed: config} = configDotenv();

    Sentry.init({
        dsn: "https://c628a2798d5deceffbcc9c5eed6efac5@o4505600358678528.ingest.sentry.io/4506579606962176",
    });

    const db = new Postgres(config);

    const job = CronJob.from({
        cronTime: '*/5 * * * * *',
        onTick: async () => {
            try {
                await aggregateRealtimeCandles(db, 'bithumb');
            } catch (e) {
                Sentry.captureException(e)
            }
        },
    });

    process.on('SIGINT', async () => {
        console.log('Shutdown bithumb candles aggregator')
        process.exit()
    })

    job.start()
}

bootstrap().catch(console.error)

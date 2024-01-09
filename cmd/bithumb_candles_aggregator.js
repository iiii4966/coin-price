import * as bithumb from "../exchange/bithumb.js";
import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";
import {CronJob} from "cron";

const bootstrap = async () => {
    const {parsed: config} = configDotenv();
    const db = new Postgres(config);

    const job = CronJob.from({
        cronTime: '*/3 * * * * *',
        onTick: async () => {
            await bithumb.aggregateRealtimeCandles(db);
        },
    });

    process.on('SIGINT', async () => {
        console.log('Shutdown bithumb candles aggregator')
        process.exit()
    })

    job.start()
}

bootstrap().catch(console.error)

import * as bithumb from "../bithumb.js";
import {configDotenv} from "dotenv";
import {Postgres} from "../postgres.js";
import {CronJob} from "cron";

const bootstrap = async () => {
    const {parsed: config} = configDotenv();
    const db = new Postgres(config);

    process.on('SIGINT', async () => {
        console.log('Shutdown bithumb candles aggregator')
        process.exit()
    })

    const job = CronJob.from({
        cronTime: '*/3 * * * * *',
        onTick: async () => {
            await bithumb.aggregateRealtimeCandles(db);
        },
    });

    job.start()
}

bootstrap().catch(console.error)

import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";
import {CronJob} from "cron";
import {aggregateRealtimeCandles} from "../exchange/aggregate_candles.js";

const bootstrap = async () => {
    const {parsed: config} = configDotenv();
    const db = new Postgres(config);

    const job = CronJob.from({
        cronTime: '*/3 * * * * *',
        onTick: async () => {
            await aggregateRealtimeCandles(db, 'upbit');
        },
    });

    process.on('SIGINT', async () => {
        console.log(`Shutdown upbit candles aggregator`)
        process.exit()
    })

    job.start()
}

bootstrap().catch(console.error)

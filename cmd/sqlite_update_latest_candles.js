import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";
import {CronJob} from "cron";
import {SqliteDB} from "../db/sqlite-db.js";
import {BithumbSqliteExporter} from "../exporter/sqlite/exporter.js";

const bootstrap = async () => {
    const {parsed: config} = configDotenv();
    const reader = new Postgres(config);
    const writer = new SqliteDB();
    const exporter = new BithumbSqliteExporter({
        coinDB: reader,
        sqliteDB: writer
    });

    const job = CronJob.from({
        cronTime: '*/5 * * * * *',
        onTick: async () => {
            await exporter.updateLatestCandles();
        },
    });

    process.on('SIGINT', async () => {
        console.log('Shutdown sqlite update latest candles');
        process.exit();
    })

    job.start()
}

bootstrap().catch(console.error)

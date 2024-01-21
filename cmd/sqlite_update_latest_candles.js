import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";
import {CronJob} from "cron";
import {SqliteDB} from "../db/sqlite-db.js";
import {BithumbSqliteExporter, UpbitSqliteExporter} from "../exporter/sqlite/exporter.js";
import {CANDLES} from "../utils/constant.js";
import * as Sentry from "@sentry/node";

const bootstrap = async () => {
    const {parsed: config} = configDotenv();

    Sentry.init({
        dsn: "https://c628a2798d5deceffbcc9c5eed6efac5@o4505600358678528.ingest.sentry.io/4506579606962176",
    });

    const coinDB = new Postgres(config);
    const sqliteDB = new SqliteDB();
    const bithumbExporter = new BithumbSqliteExporter({
        coinDB: coinDB,
        sqliteDB: sqliteDB
    });
    const upbitExporter = new UpbitSqliteExporter({
        coinDB: coinDB,
        sqliteDB: sqliteDB
    });

    let cronTime = '*/5 * * * * *'
    if (config.NODE_ENV === 'dev') {
        cronTime = '*/8 * * * * *'
    }

    const job = CronJob.from({
        cronTime: cronTime,
        onTick: async () => {
            try {
                console.log('\nStart sqlite update latest candles')
                const now = new Date().getTime();

                await Promise.all([
                    bithumbExporter.updateLatestCandles(),
                    upbitExporter.updateLatestCandles()
                ])

                // 1분에 한번, sqlite db 캔들 2000개 이상 삭제
                if ((Math.floor(now / 1000) % 60) === 0) {
                    console.log('\nStart sqlite delete old candles')
                    for (const {ms, sqlite: {unit}} of Object.values(CANDLES)) {
                        if (unit === 'Week') {
                            continue;
                        }

                        let candleDurationCount = 2000;
                        if (unit === 'Min' || unit === 'Min3') {
                            candleDurationCount = 4000;
                        }
                        const oldestTms = now - (ms * candleDurationCount)
                        const deleteCount = sqliteDB.deleteOldCandles(unit, oldestTms)
                        console.log(`sqlite db ${unit.toLowerCase()} candles deleted: ${deleteCount}`);
                    }

                    console.log('Complete sqlite delete old candles\n')
                }

                console.log('Complete sqlite update latest candles')
            } catch (e) {
                Sentry.captureException(e)
            }
        },
    });

    process.on('SIGINT', async () => {
        console.log('Shutdown sqlite update latest candles');
        process.exit();
    })

    job.start()
}

bootstrap().catch(console.error)

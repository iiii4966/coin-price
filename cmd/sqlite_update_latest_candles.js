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

    const job = CronJob.from({
        cronTime: '*/1 * * * * *',
        onTick: async () => {
            const now = Date.now()
            if ((Math.floor(now / 1000) % 15) - 7 !== 0) { // 7, 22, 37, 52 초에 한번씩 캔들 insert
                return
            }

            try {
                console.log('\nStart sqlite update latest candles')

                await Promise.all([
                    bithumbExporter.updateLatestCandles(),
                    upbitExporter.updateLatestCandles()
                ])
                console.log('Complete sqlite update latest candles')

                if (new Date(now).getUTCSeconds() !== 52) {
                    return
                }

                // 1분에 한번, 오래된 캔들 삭제
                console.log('\nStart sqlite delete old candles')
                for (const {ms, sqlite: {unit}} of Object.values(CANDLES)) {
                    if (unit === 'Week') {
                        continue;
                    }

                    let candleDurationCount = 2000;
                    if (unit === 'Min') {
                        candleDurationCount = 4000;
                    }

                    const oldestTms = now - (ms * candleDurationCount)
                    const deleteCount = sqliteDB.deleteOldCandles(unit, oldestTms)
                    console.log(`sqlite db ${unit.toLowerCase()} candles deleted: ${deleteCount}`);
                }
                console.log('Complete sqlite delete old candles\n')
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

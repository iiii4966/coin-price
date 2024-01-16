import {configDotenv} from "dotenv";
import {Postgres} from "../db/postgres.js";
import {CronJob} from "cron";
import {SqliteDB} from "../db/sqlite-db.js";
import {BithumbSqliteExporter, UpbitSqliteExporter} from "../exporter/sqlite/exporter.js";
import {CANDLES, minMs} from "../utils/constant.js";

const bootstrap = async () => {
    const {parsed: config} = configDotenv();
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
        cronTime: '*/10 * * * * *',
        onTick: async () => {
            await Promise.all([
                bithumbExporter.updateLatestCandles(),
                upbitExporter.updateLatestCandles()
            ])

            // sqlite db 캔들 2000개 이상 삭제
            const candleDurationCount = 2000;
            const now = new Date().getTime();
            if ((Math.floor(now / 1000) % 60) === 0) {
                for (const {ms, sqlite: {unit}} of Object.values(CANDLES)) {
                    const oldestTms = now - (ms * candleDurationCount)
                    console.log(unit, oldestTms, new Date(oldestTms))
                    const deleteCount = sqliteDB.deleteOldCandles(unit, oldestTms)
                    console.log(`sqlite db ${unit.toLowerCase()} candles deleted: ${deleteCount}`);
                }
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

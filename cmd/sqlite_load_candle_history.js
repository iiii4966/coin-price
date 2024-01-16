import {configDotenv} from "dotenv";
import {SqliteDB} from "../db/sqlite-db.js";
import {Postgres} from "../db/postgres.js";
import {BithumbSqliteExporter, UpbitSqliteExporter} from "../exporter/sqlite/exporter.js";

(async function () {
    const {parsed: config} = configDotenv();
    const reader = new Postgres(config);
    const writer = new SqliteDB();
    const bithumbExporter = new BithumbSqliteExporter({
        coinDB: reader,
        sqliteDB: writer
    });
    await bithumbExporter.loadCandleHistory();

    const upbitExporter = new UpbitSqliteExporter({
        coinDB: reader,
        sqliteDB: writer
    });
    await upbitExporter.loadCandleHistory();

    await reader.close()

}()).catch(console.error)

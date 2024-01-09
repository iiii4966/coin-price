import {configDotenv} from "dotenv";
import {SqliteDB} from "../db/sqlite-db.js";
import {Postgres} from "../db/postgres.js";
import {BithumbSqliteExporter} from "../exporter/sqlite/exporter.js";

(async function () {
    const {parsed: config} = configDotenv();
    const reader = new Postgres(config);
    const writer = new SqliteDB();
    const exporter = new BithumbSqliteExporter({
        coinDB: reader,
        sqliteDB: writer
    });
    await exporter.loadCandleHistory();
}()).catch(console.error)

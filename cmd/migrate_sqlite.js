import {SqliteDB} from "../db/sqlite-db.js";

(function () {
    const db = new SqliteDB();
    db.createCandleTables()
    console.log('complete migrate')
}())

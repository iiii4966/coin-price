import Database from 'better-sqlite3';
import {CANDLES} from "../utils/constant.js";

export class SqliteDB {
    dbName
    db
    candleUnits

    constructor(options = {}) {
        this.dbName = options.dbName ?? 'coin-price.db';
        this.candleUnits = options.candleUnits ?? Object.values(CANDLES).map(c => c.sqlite.unit);
        this.db = new Database(this.dbName);
        this.db.exec('PRAGMA journal_mode = WAL');
        this.db.exec('PRAGMA journal_size_limit = 1073741824');
    }

    prepareCandleInsert(){
        const statements = {}
        for (const unit of this.candleUnits) {
            statements[unit] = this.db.prepare(`
                INSERT OR REPLACE INTO 
                ${unit}Candle (market, code, tms, op, hp, lp, cp, tv) 
                VALUES (@market, @code, @tms, @op, @hp, @lp, @cp, @tv)
            `);
        }
        return statements;
    }

    prepareCandleBulkInsert(){
        const statements = {}
        const states = this.prepareCandleInsert();
        for (const [unit, insert] of Object.entries(states)) {
            statements[unit] = this.db.transaction((candles) => {
                for (const c of candles) {
                    insert.run(c);
                }
            });
        }
        return statements;
    }

    createCandleTables(){
        for (const unit of this.candleUnits) {
            const ddl = `
                CREATE TABLE ${unit}Candle (
                    market TEXT NOT NULL,
                    code TEXT NOT NULL,
                    tms INTEGER NOT NULL,
                    op REAL,
                    hp REAL,
                    lp REAL,
                    cp REAL,
                    tv REAL,
                    CONSTRAINT Candle_PK PRIMARY KEY (market,code,tms)
                )
            `;
            this.db.prepare(ddl).run();
        }
    }
}




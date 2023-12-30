import pg from 'pg';


export class PostgresDB {
    pool

    constructor(config) {
        this.pool = new pg.Pool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
        });
    }

    async connect(){
        return this.pool.connect()
    }

    async query(query){
        const client = await this.connect();
        await client.query(query);
        await client.release();
    }


}
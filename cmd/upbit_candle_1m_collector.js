import * as upbit from "../exchange/upbit.js";
import {configDotenv} from "dotenv";
import {Quest} from "../db/quest.js";
import {Postgres} from "../db/postgres.js";

const bootstrap = async () => {
    const {parsed: config} = configDotenv();

    const writer = new Quest(config);
    const reader = new Postgres(config);

    await upbit.collect1mCandle(writer, reader);

    process.on('SIGINT', async () => {
        console.log('Shutdown upbit 1m candle collector')
        process.exit();
    })
}

bootstrap().catch(console.error)

import * as bithumb from "../exchange/bithumb.js";
import {configDotenv} from "dotenv";
import {Quest} from "../db/quest.js";
import {Postgres} from "../db/postgres.js";
import * as Sentry from "@sentry/node";

const bootstrap = async () => {
    const {parsed: config} = configDotenv()

    Sentry.init({
        dsn: "https://c628a2798d5deceffbcc9c5eed6efac5@o4505600358678528.ingest.sentry.io/4506579606962176",
    });

    const writer = new Quest(config);
    const reader = new Postgres(config);

    await bithumb.collect1mCandle(writer, reader);

    process.on('SIGINT', async () => {
        console.log('Shutdown bithumb 1m candle collector')
        process.exit();
    })
}

bootstrap().catch(console.error)

import * as bithumb from "../exchange/bithumb.js";
import {configDotenv} from "dotenv";
import {Quest} from "../db/quest.js";
import {Postgres} from "../db/postgres.js";

const bootstrap = async () => {
    const {parsed: config} = configDotenv()
    const writer = new Quest(config);
    await bithumb.collectCandleHistory(writer);

    const batchWriter = new Postgres(config);
    await bithumb.aggregateCandleHistory(batchWriter)

    await writer.close();
    await batchWriter.close();
}

bootstrap().catch(console.error)

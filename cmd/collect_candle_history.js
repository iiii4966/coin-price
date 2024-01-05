import * as bithumb from "../bithumb.js";
import {configDotenv} from "dotenv";
import {Quest} from "../quest.js";
import {Postgres} from "../postgres.js";

const bootstrap = async () => {
    const {parsed: config} = configDotenv()
    const writer = new Quest();
    await bithumb.collectCandleHistory(writer);

    const batchWriter = new Postgres(config);
    await bithumb.aggregateCandleHistory(batchWriter)

    await writer.close();
    await batchWriter.close();
}

bootstrap().catch(console.error)

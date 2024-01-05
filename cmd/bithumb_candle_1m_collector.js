import * as bithumb from "../bithumb.js";
import {configDotenv} from "dotenv";
import {Quest} from "../quest.js";
import {Postgres} from "../postgres.js";

const bootstrap = async () => {
    const {parsed: config} = configDotenv()

    const writer = new Quest();
    const reader = new Postgres(config);

    await bithumb.collect(writer, reader);

    process.on('SIGINT', async () => {
        await reader.close();
        await writer.close();
        process.exit();
    })
}

bootstrap().catch(console.error)

import * as upbit from "../exchange/upbit.js";
import {configDotenv} from "dotenv";
import {Quest} from "../db/quest.js";

const bootstrap = async () => {
    const {parsed: config} = configDotenv()
    const db = new Quest(config);
    await upbit.collectCandleHistory(db, 2000)
    await db.close();
}

bootstrap().catch(console.error)

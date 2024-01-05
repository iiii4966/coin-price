import * as bithumb from "../bithumb.js";
import {configDotenv} from "dotenv";

const bootstrap = async () => {
    const {parsed: config} = configDotenv()
    await bithumb.collect(config);
}

bootstrap().catch(console.error)

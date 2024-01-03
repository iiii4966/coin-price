import {collect} from "../bithumb.js";
import {configDotenv} from "dotenv";

const bootstrap = async () => {
    const {parsed: config} = configDotenv()
    await collect(config);
}

bootstrap().catch(console.error)

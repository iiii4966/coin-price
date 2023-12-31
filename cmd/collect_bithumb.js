import {collect} from "../bithumb.js";

const bootstrap = async () => {
    await collect()
}

bootstrap().catch(console.error)

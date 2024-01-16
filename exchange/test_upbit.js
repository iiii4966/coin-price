import {minMs} from "../utils/constant.js";
import {Upbit} from "./upbit.js";

(async function testFetchOHLCVTms() {
    const upbit = new Upbit();
    await upbit.loadMarkets();
    const limit = 2000

    console.time(`fetchOHLCVByCount ${limit}`)
    const collectCandles = await upbit.fetchOHLCVByCount('BTC/KRW', '3m', 0, limit);
    console.timeEnd(`fetchOHLCVByCount ${collectCandles.length}`)

    console.assert(collectCandles.length === limit)

    const candleTmsList = collectCandles.map(c => c[0]).sort((a,b) =>  b - a)
    for (let i = 0; i < candleTmsList.length - 1; i++) {
        const diff = candleTmsList[i] - candleTmsList[i + 1]
        if (diff !== minMs * 3) {
            console.log(diff, candleTmsList[i], candleTmsList[i + 1])
        }
    }
}())

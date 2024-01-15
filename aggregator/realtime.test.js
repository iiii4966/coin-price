import {CandleRealtimeAggregator} from "./realtime.js";
import {minMs} from "../utils/constant.js";


(function testCandleRealtimeAggregator(){
    const minAggregator = new CandleRealtimeAggregator(
        {unit: '1m', exchange: 'upbit'}
    );

    let tms = 1705069859999;
    let {start, end} = minAggregator.getTimeWindow(tms)
    console.assert(start === 1705069800000)
    console.assert(end === 1705069800000 + minMs)

    tms += 1;
    const window = minAggregator.getTimeWindow(tms)
    console.assert(window.start === 1705069800000 + minMs)
    console.assert(window.end === 1705069800000 + minMs * 2)
}())

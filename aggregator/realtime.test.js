import {CandleRealtimeAggregator} from "./realtime.js";
import {minMs} from "../utils/constant.js";

test('test upbit realtime aggregate', () => {
    const minAggregator = new CandleRealtimeAggregator(
        {unit: '1m', exchange: 'upbit'}
    );

    let tms = 1705069859999;
    let {start, end} = minAggregator.getTimeWindow(tms)
    expect(start === 1705069800000).toBeTruthy()
    expect(end === 1705069800000 + minMs).toBeTruthy()

    tms += 1;
    const window = minAggregator.getTimeWindow(tms)
    expect(window.start === 1705069800000 + minMs).toBeTruthy()
    expect(window.end === 1705069800000 + minMs * 2).toBeTruthy()
});

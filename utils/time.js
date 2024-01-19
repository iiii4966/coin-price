import {CANDLES, minMs, utcHourMs, weekMs} from "./constant.js";

export const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export const getMinuteTimeRange = (tms, roundMs = minMs) => {
    let rounded = Math.floor(tms / (roundMs)) * roundMs;
    return {
        start: rounded,
        end: rounded + roundMs
    };
}

export const getWeekTimeRange = (date, timezone = 'UTC') => {
    const monday = (date.getDay() - 1 + 7) % 7;
    let start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - monday);
    start.setHours(0, 0, 0, 0);
    start = start.getTime();
    if (timezone === 'KST') {
        start -= utcHourMs
    }
    const end = start + weekMs;
    return {start, end};
}

export const getCandleTimeRange = (tms, interval, timezone = 'UTC') => {
    const roundMs = CANDLES[interval].ms;

    let start;
    if (timezone === 'KST') {
        tms += utcHourMs
        start = (Math.floor((tms) / roundMs) * roundMs) - utcHourMs;
    } else if (timezone === 'UTC') {
        start = (Math.floor((tms) / roundMs) * roundMs);
    } else {
        throw new Error('no support timezone')
    }

    let end = start + roundMs;

    if (interval === '1d') {
        const date = new Date(start);
        date.setHours(0, 0, 0, 0);
        end = date.getTime() + roundMs;
    }

    return { start , end };
}

export const checkCandleStartTime = (tms, interval) => {
    const d = new Date(tms)
    d.setMilliseconds(0)
    d.setUTCSeconds(0)

    const candleInfo = CANDLES[interval];

    if (candleInfo.isRegular) {
        return d.getTime() % candleInfo.ms === 0
    } else if (interval === '1d') {
        return d.getUTCHours() === 0 && d.getUTCMinutes() === 0
    } else if (interval === '1w') {
        return d.getUTCDay() === 1 && d.getUTCHours() === 0 && d.getUTCMinutes() === 0
    } else {
        throw new Error('Not implement')
    }
}

import {CANDLES, dayMs, hourMs, minMs, utcHourMs, weekMs} from "./constant.js";
import * as mr from 'moment-round';
import * as mt from 'moment-timezone';
import moment from 'moment';

moment.tz.setDefault('UTC')

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

// unit: hours, minutes
// value: number type
export const getTimeRangeWithMoment = (tms, unit, value) => {
    let m = new moment(tms);
    m = m.floor(value, unit);
    const start = m.unix() * 1000;
    const end = start + (value * (unit === 'hours' ? hourMs : minMs));
    return {start, end}
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

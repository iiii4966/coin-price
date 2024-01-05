import {dayMs, hour6Ms, hourMs, minMs, utcHourMs, weekMs} from "./constant.js";
import * as mr from 'moment-round';
import moment from 'moment-timezone';

moment.tz.setDefault('UTC')


export const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export const isMidNight = (tms) => {
    const date = new Date(tms);
    return date.getUTCHours() === 15 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0;
}

export const getMinuteTimeRange = (tms, roundMs = minMs) => {
    let rounded = Math.floor(tms / (roundMs)) * roundMs;
    return {
        start: rounded,
        end: rounded + roundMs
    };
}

export const getDayTimeRange = (tms) => {
    if (isMidNight(tms)) {
        return {start: tms, end: tms + dayMs};
    }
    const rounded = (Math.floor(tms / (dayMs)) * dayMs) - utcHourMs;
    return {start: rounded, end: rounded + dayMs};
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

export const getWeekTimeRange = (date) => {
    const monday = (date.getDay() - 1 + 7) % 7;
    let start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - monday);
    start.setHours(0, 0, 0, 0);
    start = start.getTime();
    const end = new Date(start + weekMs).getTime();
    return {start, end};
}

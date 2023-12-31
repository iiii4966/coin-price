import {minMs} from "./constant.js";


export const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export const getTimeRange = (tms, roundMs = minMs) => {
    const roundedTms = Math.floor(tms / (roundMs)) * roundMs;
    return {
        start: roundedTms,
        end: (roundedTms + roundMs)
    };
}

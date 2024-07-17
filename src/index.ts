import moment from 'moment';
import Notify from 'simple-notify';

import {
    ASH_COUNTER_TYPE_COUNT,
    ASH_COUNTERS_MATCH,
    DURATION_WARNING_FACTOR,
    EMBER_COUNTER_TYPE_COUNT,
    EMBER_COUNTERS_PER_DEVICE_IRRELEVANTS,
    FAILED_PING_1_ATTEMPT_MATCH,
    FAILED_PING_2_ATTEMPTS_MATCH,
    FAILED_PING_MATCH,
    MIN_DURATION,
    NCP_COUNTERS_MATCH,
    NETWORK_ROUTE_ERROR_MATCH,
    ROUTING_ERROR_DUP_IGNORE_MS,
    START_OFFSET,
    TIMESTAMP_REGEX,
} from './consts';
import {
    ASH_COUNTERS_NOTICE,
    EMBER_STACK_ERRORS_NOTICE,
    IDEAL_ASH_COUNTERS,
    IDEAL_ASH_COUNTERS_FACTORS,
    IDEAL_NCP_COUNTERS,
    IDEAL_NCP_COUNTERS_FACTORS,
    IDEAL_ROUTER_RATIO,
    NCP_COUNTERS_NOTICE,
} from './data';
import { getValueClassName, makeButton, makeListCard, makeMessage, makeTable, makeTableContainer } from './dom';
import { NotifyError } from './notify-error';
import {
    AshCounters,
    EmberCounters,
    LogAshCounters,
    LogFailedPings,
    LogMetadata,
    LogNcpCounters,
    LogNetworkRouteErrors,
    TableCellData,
} from './types';
import { round, toHex } from './utils';
import { AshCounterType, EmberCounterType, EmberStackError } from './zh';

/** z2m default */
let timestampFormat: string = 'YYYY-MM-DD HH:mm:ss';
let routers: number = 0;
let endDevices: number = 0;
let totalDevices: number = 0;
let logFile: File;
const logMetadata: LogMetadata = {
    lines: 0,
    start: undefined,
    end: undefined,
    duration: 0,
    startOffset: undefined,
};

const ncpCountersSum: EmberCounters = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
const ncpCountersHoursCount: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const ncpCounters: LogNcpCounters = {
    all: [],
    avg: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    avgPerDevice: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    avgForHour: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
};
const ashCountersSum: AshCounters = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const ashCountersHoursCount: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const ashCounters: LogAshCounters = {
    all: [],
    avg: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    avgPerDevice: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    avgForHour: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
};

const networkRouteErrors: LogNetworkRouteErrors = {
    all: [],
};

const failedPings: LogFailedPings = {
    all: [],
};

function initVariables(): void {
    routers = 0;
    endDevices = 0;
    totalDevices = 0;
    // @ts-expect-error whatever
    logFile = undefined;
    logMetadata.lines = 0;
    logMetadata.start = undefined;
    logMetadata.end = undefined;
    logMetadata.duration = 0;
    logMetadata.startOffset = undefined;

    ncpCountersSum.fill(0);
    ncpCountersHoursCount.fill(0);
    ncpCounters.all = [];
    ncpCounters.avg.fill(0);
    ncpCounters.avgPerDevice.fill(0);

    for (let i = 0; i < ncpCounters.avgForHour.length; i++) {
        ncpCounters.avgForHour[i].fill(0);
    }

    ashCountersSum.fill(0);
    ashCountersHoursCount.fill(0);
    ashCounters.all = [];
    ashCounters.avg.fill(0);
    ashCounters.avgPerDevice.fill(0);

    for (let i = 0; i < ashCounters.avgForHour.length; i++) {
        ashCounters.avgForHour[i].fill(0);
    }

    networkRouteErrors.all = [];
}

// Adapted @from https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/read#example_2_-_handling_text_line_by_line
async function* makeTextFileLineIterator(file: File): AsyncGenerator<string, void, unknown> {
    const utf8Decoder = new TextDecoder('utf8');
    const reader = file.stream().getReader();
    let { value, done } = await reader.read();
    let chunk = value ? utf8Decoder.decode(value, { stream: true }) : '';

    const re = /\r\n|\n|\r/gm;
    let startIndex = 0;

    for (;;) {
        const result = re.exec(chunk);

        if (!result) {
            if (done) {
                break;
            }

            const remainder = chunk.slice(startIndex);

            ({ value, done } = await reader.read());

            chunk = remainder + (value ? utf8Decoder.decode(value, { stream: true }) : '');
            // eslint-disable-next-line no-multi-assign
            startIndex = re.lastIndex = 0;

            continue;
        }

        yield chunk.slice(startIndex, result.index);

        startIndex = re.lastIndex;
    }

    if (startIndex < chunk.length) {
        // last line didn't end in a newline char
        yield chunk.slice(startIndex);
    }
}

function parseLogLine(line: string): void {
    const timestampMatch = line.match(TIMESTAMP_REGEX);

    if (!timestampMatch) {
        // shouldn't happen with new logging, but just in case, ignore lines without timestamp
        return;
    }

    logMetadata.lines++;

    const timestampStr = timestampMatch[0].slice(1, -1);
    const timestamp = new Date(timestampStr);

    if (!logMetadata.start) {
        logMetadata.start = timestamp;
        logMetadata.startOffset = new Date(timestamp.getTime() + START_OFFSET);
    }

    logMetadata.end = timestamp;
    const hour = timestamp.getHours();

    const ncpCountersIndex = line.indexOf(NCP_COUNTERS_MATCH);

    if (ncpCountersIndex !== -1) {
        const subLine = line.slice(ncpCountersIndex + NCP_COUNTERS_MATCH.length);
        const counters = subLine.split(',').map((v) => Number.parseInt(v, 10));

        if (counters.length !== EMBER_COUNTER_TYPE_COUNT) {
            return;
        }

        // @ts-expect-error length validated above
        ncpCounters.all.push([timestamp, ...counters]);

        for (let i = 0; i < EMBER_COUNTER_TYPE_COUNT; i++) {
            // TODO: deal with 65535 & rollover
            const cI = counters[i];
            ncpCountersSum[i] += cI;
            ncpCounters.avgForHour[hour][i] += cI;
        }

        ncpCountersHoursCount[hour] += 1;

        return;
    }

    const ashCountersIndex = line.indexOf(ASH_COUNTERS_MATCH);

    if (ashCountersIndex !== -1) {
        const subLine = line.slice(ashCountersIndex + ASH_COUNTERS_MATCH.length);
        const counters = subLine.split(',').map((v) => Number.parseInt(v, 10));

        if (counters.length !== ASH_COUNTER_TYPE_COUNT) {
            return;
        }

        // @ts-expect-error length validated above
        ashCounters.all.push([timestamp, ...counters]);

        for (let i = 0; i < ASH_COUNTER_TYPE_COUNT; i++) {
            const cI = counters[i];
            ashCountersSum[i] += cI;
            ashCounters.avgForHour[hour][i] += cI;
        }

        ashCountersHoursCount[hour] += 1;

        return;
    }

    const networkRouteErrorIndex = line.indexOf(NETWORK_ROUTE_ERROR_MATCH);

    if (networkRouteErrorIndex !== -1) {
        // ignore network/route errors around Z2M start
        if (timestamp < logMetadata.startOffset!) {
            return;
        }

        const subLine = line.slice(networkRouteErrorIndex + NETWORK_ROUTE_ERROR_MATCH.length);
        const splitLine = subLine.split(' '); // ['ROUTE_ERROR_MANY_TO_ONE_ROUTE_FAILURE', 'for', '"38837".']
        const error = splitLine[0];
        const device = Number.parseInt(splitLine[2].slice(1, -2), 10);

        if (networkRouteErrors.all.length > 0) {
            const prev = networkRouteErrors.all.at(-1);

            if (prev) {
                const countOffset = prev[0].getTime() + ROUTING_ERROR_DUP_IGNORE_MS;

                // count duplicate errors within short period instead
                if (prev[1] === device && prev[2] === error && timestamp.getTime() < countOffset) {
                    prev[3] += 1;
                    return;
                }
            }
        }

        networkRouteErrors.all.push([timestamp, device, error, 1]);

        return;
    }

    const failedPingIndex = line.indexOf(FAILED_PING_MATCH);

    if (failedPingIndex !== -1) {
        const subLine = line.slice(failedPingIndex + FAILED_PING_MATCH.length);

        // only count if all attempts failed
        if (subLine.includes(FAILED_PING_2_ATTEMPTS_MATCH) || subLine.includes(FAILED_PING_1_ATTEMPT_MATCH)) {
            const device = subLine.slice(0, subLine.indexOf(`'`));

            failedPings.all.push([timestamp, device]);
        }

        // return;
    }
}

async function parseLogFile(): Promise<void> {
    if (!logFile) {
        throw new NotifyError('Load a log file from the menu first.', 'No log file');
    }

    for await (const line of makeTextFileLineIterator(logFile)) {
        parseLogLine(line);
    }

    if (!logMetadata.start || !logMetadata.end) {
        throw new NotifyError('Could not retrieve start or end timestamps from log file.', 'Invalid start or end timestamp');
    }

    logMetadata.duration = (logMetadata.end.getTime() - logMetadata.start.getTime()) / 1000 / 3600;

    if (logMetadata.duration < MIN_DURATION) {
        throw new NotifyError('Log analysis over such a duration would be irrelevant.', 'Log duration too short');
    }

    const ncpCountersCount = ncpCounters.all.length;

    if (ncpCountersCount > 0) {
        let i = 0;

        for (const c of ncpCountersSum) {
            const avg = c / ncpCountersCount;

            ncpCounters.avg[i] = round(avg, 2);
            ncpCounters.avgPerDevice[i] = round(avg / totalDevices, 4);
            i++;
        }

        // divide the computed sum to get actual average
        for (let hour = 0; hour < ncpCounters.avgForHour.length; hour++) {
            for (let counter = 0; counter < EMBER_COUNTER_TYPE_COUNT; counter++) {
                ncpCounters.avgForHour[hour][counter] = round(ncpCounters.avgForHour[hour][counter] / ncpCountersHoursCount[hour], 2);
            }
        }
    }

    const ashCountersCount = ashCounters.all.length;

    if (ashCountersCount > 0) {
        let i = 0;

        for (const c of ashCountersSum) {
            const avg = c / ashCountersCount;

            ashCounters.avg[i] = round(avg, 2);
            ashCounters.avgPerDevice[i] = round(avg / totalDevices, 4);
            i++;
        }

        // divide the computed sum to get actual average
        for (let hour = 0; hour < ashCounters.avgForHour.length; hour++) {
            for (let counter = 0; counter < EMBER_COUNTER_TYPE_COUNT; counter++) {
                ashCounters.avgForHour[hour][counter] = round(ashCounters.avgForHour[hour][counter] / ashCountersHoursCount[hour], 2);
            }
        }
    }
}

function appendStatsSection(section: HTMLDivElement): void {
    const grid = document.createElement('div');
    grid.className = 'grid';

    const ratio = endDevices > 0 ? round(routers / endDevices, 2) : -1;
    const parametersList = [`Number of routers: ${routers}`, `Number of end devices: ${endDevices}`];

    if (ratio !== -1) {
        parametersList.push(`Routers to end devices ratio: ${ratio} (Ideal: above ${IDEAL_ROUTER_RATIO})`);

        const warningRatio = totalDevices > 10 && ratio < IDEAL_ROUTER_RATIO;

        if (warningRatio) {
            parametersList.push(`<em class="has-text-warning">\u26A0 You may want to increase the number of routers in your network</em>`);
        }
    }

    const parametersCard = makeListCard('Parameters', parametersList);
    const warningDuration = logMetadata.duration < DURATION_WARNING_FACTOR;
    const logFileCard = makeListCard('Log file', [
        `Lines: ${logMetadata.lines}`,
        `Start: ${moment(logMetadata.start).format(timestampFormat)}`,
        `End: ${moment(logMetadata.end).format(timestampFormat)}`,
        `Ignore before (avoid starting "noise"): ${moment(logMetadata.startOffset).format(timestampFormat)}`,
        `Duration: ${round(logMetadata.duration, 2)} hours ${warningDuration ? '<em class="has-text-warning">\u26A0 This is likely too low to get relevant statistics</em>' : ''}`,
        `NCP Counters: ${ncpCounters.all.length}`,
        `ASH Counters: ${ashCounters.all.length}`,
        `Network/Router Errors: ${networkRouteErrors.all.length}`,
        `Failed pings (all successive attempts): ${failedPings.all.length}`,
    ]);

    grid.append(parametersCard);
    grid.append(logFileCard);
    section.append(grid);

    const failedPingsByDevice: { [device: string /* friendly name */]: number } = {};

    for (const entry of failedPings.all) {
        const device = entry[1];

        failedPingsByDevice[device] = 1 + (failedPingsByDevice[device] ?? 0);
    }

    for (const device of Object.keys(failedPingsByDevice)) {
        const count = failedPingsByDevice[device];

        // show only if at least one fail per hour
        if (count > logMetadata.duration) {
            section.append(
                makeMessage(
                    `Too many failed pings for '${device}' (x${count})`,
                    'This indicates an unreachable device on the network. If unavailable for long periods, consider disabling it to skip unnecessary network traffic.',
                    'is-warning',
                ),
            );
        }
    }
}

function appendNCPCountersSection(section: HTMLDivElement): void {
    if (ncpCounters.all.length === 0) {
        return;
    }

    const ncpCountersHeader: string[] = ['Timestamp'];
    const ncpCountersRows: TableCellData[][] = [];
    const ncpCountersIdealRows: TableCellData[] = [];
    const ncpCountersAvgPerDeviceRows: TableCellData[] = [];
    const ncpCountersAvgRows: TableCellData[] = [];
    const ncpCountersAvgForHourRows: [
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
    ] = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];

    for (let i = 0; i < EMBER_COUNTER_TYPE_COUNT; i++) {
        ncpCountersHeader.push(`<span title="${NCP_COUNTERS_NOTICE[i]}">${EmberCounterType[i]}</span>`);

        const counter = ncpCounters.avgPerDevice[i];
        const ideal = IDEAL_NCP_COUNTERS[i];

        ncpCountersIdealRows.push({ content: ideal.toString(), className: 'is-dark' });
        ncpCountersAvgPerDeviceRows.push({
            content: counter.toString(),
            className: EMBER_COUNTERS_PER_DEVICE_IRRELEVANTS.includes(i)
                ? 'is-invisible'
                : getValueClassName(counter, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[i]),
        });
        ncpCountersAvgRows.push({
            content: ncpCounters.avg[i].toString(),
            className: getValueClassName(counter, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[i]),
        });

        for (let hour = 0; hour < ncpCounters.avgForHour.length; hour++) {
            ncpCountersAvgForHourRows[hour].push({
                content: ncpCounters.avgForHour[hour][i].toString(),
                className: getValueClassName(ncpCounters.avgForHour[hour][i], ideal * totalDevices, ...IDEAL_NCP_COUNTERS_FACTORS[i]),
            });
        }
    }

    const tableContainerAvg = makeTableContainer(
        makeTable(
            ['', ...ncpCountersHeader.slice(1)],
            [],
            [
                [{ content: 'Ideal Per Device' }, ...ncpCountersIdealRows],
                [{ content: 'Average Per Device' }, ...ncpCountersAvgPerDeviceRows],
                [{ content: 'Average' }, ...ncpCountersAvgRows],
            ],
        ),
    );

    const tableContainerAvgForHour = makeTableContainer(
        makeTable(
            ['Average Hour Before', ...ncpCountersHeader.slice(1)],
            [],
            [
                [{ content: '00 (12AM)' }, ...ncpCountersAvgForHourRows[0]],
                [{ content: '01 (01AM)' }, ...ncpCountersAvgForHourRows[1]],
                [{ content: '02 (02AM)' }, ...ncpCountersAvgForHourRows[2]],
                [{ content: '03 (03AM)' }, ...ncpCountersAvgForHourRows[3]],
                [{ content: '04 (04AM)' }, ...ncpCountersAvgForHourRows[4]],
                [{ content: '05 (05AM)' }, ...ncpCountersAvgForHourRows[5]],
                [{ content: '06 (06AM)' }, ...ncpCountersAvgForHourRows[6]],
                [{ content: '07 (07AM)' }, ...ncpCountersAvgForHourRows[7]],
                [{ content: '08 (08AM)' }, ...ncpCountersAvgForHourRows[8]],
                [{ content: '09 (09AM)' }, ...ncpCountersAvgForHourRows[9]],
                [{ content: '10 (10AM)' }, ...ncpCountersAvgForHourRows[10]],
                [{ content: '11 (11AM)' }, ...ncpCountersAvgForHourRows[11]],
                [{ content: '12 (12PM)' }, ...ncpCountersAvgForHourRows[12]],
                [{ content: '13 (01PM)' }, ...ncpCountersAvgForHourRows[13]],
                [{ content: '14 (02PM)' }, ...ncpCountersAvgForHourRows[14]],
                [{ content: '15 (03PM)' }, ...ncpCountersAvgForHourRows[15]],
                [{ content: '16 (04PM)' }, ...ncpCountersAvgForHourRows[16]],
                [{ content: '17 (05PM)' }, ...ncpCountersAvgForHourRows[17]],
                [{ content: '18 (06PM)' }, ...ncpCountersAvgForHourRows[18]],
                [{ content: '19 (07PM)' }, ...ncpCountersAvgForHourRows[19]],
                [{ content: '20 (08PM)' }, ...ncpCountersAvgForHourRows[20]],
                [{ content: '21 (09PM)' }, ...ncpCountersAvgForHourRows[21]],
                [{ content: '22 (10PM)' }, ...ncpCountersAvgForHourRows[22]],
                [{ content: '23 (11PM)' }, ...ncpCountersAvgForHourRows[23]],
            ],
            true,
        ),
    );

    for (const entry of ncpCounters.all) {
        const row: TableCellData[] = [{ content: moment(entry[0]).format(timestampFormat) }];

        for (let i = 0; i < EMBER_COUNTER_TYPE_COUNT; i++) {
            const counter = entry[i + 1];

            row.push({
                content: counter.toString(),
                // @ts-expect-error Date is skipped in code, TS not narrowing
                className: getValueClassName(counter / totalDevices, IDEAL_NCP_COUNTERS[i], ...IDEAL_NCP_COUNTERS_FACTORS[i]),
            });
        }

        ncpCountersRows.push(row);
    }

    {
        const ashErrors =
            ncpCountersSum[EmberCounterType.ASH_OVERFLOW_ERROR] +
            ncpCountersSum[EmberCounterType.ASH_FRAMING_ERROR] +
            ncpCountersSum[EmberCounterType.ASH_OVERRUN_ERROR] +
            ncpCountersSum[EmberCounterType.ASH_XOFF];

        if (ashErrors !== 0) {
            const msg = makeMessage(
                `ASH errors detected (${ashErrors} times)`,
                'This can indicate a bad connection with the adapter or an issue with the driver installed in the operating system.',
                'is-danger',
            );

            section.append(msg);
        }
    }

    {
        const val = ncpCounters.avgPerDevice[EmberCounterType.PHY_CCA_FAIL_COUNT];
        const ideal = IDEAL_NCP_COUNTERS[EmberCounterType.PHY_CCA_FAIL_COUNT];
        const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.PHY_CCA_FAIL_COUNT]);

        if (cls) {
            const msg = makeMessage(
                `CCA failure count is high (${val} vs ${ideal} "ideal")`,
                'This can indicate interferences on the 2.4GHz band on or around the current channel (WiFi, other Zigbee...).',
                cls,
            );

            section.append(msg);
        }
    }

    {
        const val = ncpCounters.avgPerDevice[EmberCounterType.ROUTE_DISCOVERY_INITIATED];
        const ideal = IDEAL_NCP_COUNTERS[EmberCounterType.ROUTE_DISCOVERY_INITIATED];
        const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.ROUTE_DISCOVERY_INITIATED]);

        if (cls) {
            const msg = makeMessage(
                `Initiated route discovery count is high (${val} vs ${ideal} "ideal")`,
                'This can indicate general instability in the network (unresponsive devices, bad routers...).',
                cls,
            );

            section.append(msg);
        }
    }

    {
        const val = ncpCounters.avgPerDevice[EmberCounterType.MAC_TX_UNICAST_RETRY];
        const ideal = IDEAL_NCP_COUNTERS[EmberCounterType.MAC_TX_UNICAST_RETRY];
        const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.MAC_TX_UNICAST_RETRY]);

        if (cls) {
            const msg = makeMessage(
                `Packet retry count is high (${val} vs ${ideal} "ideal")`,
                'This can indicate general instability in your network (unresponsive devices, bad routers...).',
                cls,
            );

            section.append(msg);
        }
    }

    {
        const val = ncpCounters.avgPerDevice[EmberCounterType.ADDRESS_CONFLICT_SENT];
        const ideal = IDEAL_NCP_COUNTERS[EmberCounterType.ADDRESS_CONFLICT_SENT];
        const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.ADDRESS_CONFLICT_SENT]);

        if (cls) {
            const msg = makeMessage(
                `Address conflicts detected (${val} vs ${ideal} "ideal")`,
                'This can indicate device(s) with poor firmware.',
                cls,
            );

            section.append(msg);
        }
    }

    {
        const val = ncpCounters.avgPerDevice[EmberCounterType.BROADCAST_TABLE_FULL];
        const ideal = IDEAL_NCP_COUNTERS[EmberCounterType.BROADCAST_TABLE_FULL];
        const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.BROADCAST_TABLE_FULL]);

        if (cls) {
            const msg = makeMessage(
                `Broadcast table full detected (${val} vs ${ideal} "ideal")`,
                'This can indicate the network is relying too heavily on broadcasts (messages to the whole network or to groups).',
                cls,
            );

            section.append(msg);
        }
    }

    {
        const val = ncpCounters.avg[EmberCounterType.NEIGHBOR_STALE];
        const ideal = 1;
        const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.NEIGHBOR_STALE]);

        if (cls) {
            const msg = makeMessage(
                `Stale neighbors count is high (${val} vs ${ideal} "ideal")`,
                'This can indicate poor link quality between devices. Note: This is influenced by pairing/re-pairing.',
                cls,
            );

            section.append(msg);
        }
    }

    section.append(tableContainerAvg);
    section.append(tableContainerAvgForHour);

    const showAllButton = makeButton('Show All', 'is-primary');

    showAllButton.addEventListener('click', () => {
        showAllButton.remove();

        const tableContainerAll = makeTableContainer(makeTable(ncpCountersHeader, [], ncpCountersRows, true));

        section.append(tableContainerAll);
    });

    section.append(showAllButton);
}

function appendASHCountersSection(section: HTMLDivElement): void {
    if (ashCounters.all.length === 0) {
        return;
    }

    const ashCountersHeader: string[] = ['Timestamp'];
    const ashCountersRows: TableCellData[][] = [];
    const ashCountersIdealRows: TableCellData[] = [];
    const ashCountersAvgPerDeviceRows: TableCellData[] = [];
    const ashCountersAvgRows: TableCellData[] = [];
    const ashCountersAvgForHourRows: [
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
        TableCellData[],
    ] = [[], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], []];

    for (let i = 0; i < ASH_COUNTER_TYPE_COUNT; i++) {
        ashCountersHeader.push(`<span title="${ASH_COUNTERS_NOTICE[i]}">${AshCounterType[i]}</span>`);

        const counter = ashCounters.avgPerDevice[i];
        const ideal = IDEAL_ASH_COUNTERS[i];

        ashCountersIdealRows.push({ content: ideal.toString(), className: 'is-dark' });
        ashCountersAvgPerDeviceRows.push({
            content: counter.toString(),
            className: getValueClassName(counter, ideal, ...IDEAL_ASH_COUNTERS_FACTORS[i]),
        });
        ashCountersAvgRows.push({
            content: ashCounters.avg[i].toString(),
            className: getValueClassName(counter, ideal, ...IDEAL_ASH_COUNTERS_FACTORS[i]),
        });

        for (let hour = 0; hour < ashCounters.avgForHour.length; hour++) {
            ashCountersAvgForHourRows[hour].push({
                content: ashCounters.avgForHour[hour][i].toString(),
                className: getValueClassName(ashCounters.avgForHour[hour][i], ideal * totalDevices, ...IDEAL_ASH_COUNTERS_FACTORS[i]),
            });
        }
    }

    const tableContainerAvg = makeTableContainer(
        makeTable(
            ['', ...ashCountersHeader.slice(1)],
            [],
            [
                [{ content: 'Ideal Per Device' }, ...ashCountersIdealRows],
                [{ content: 'Average Per Device' }, ...ashCountersAvgPerDeviceRows],
                [{ content: 'Average' }, ...ashCountersAvgRows],
            ],
        ),
    );

    const tableContainerAvgForHour = makeTableContainer(
        makeTable(
            ['Average Hour Before', ...ashCountersHeader.slice(1)],
            [],
            [
                [{ content: '00 (12AM)' }, ...ashCountersAvgForHourRows[0]],
                [{ content: '01 (01AM)' }, ...ashCountersAvgForHourRows[1]],
                [{ content: '02 (02AM)' }, ...ashCountersAvgForHourRows[2]],
                [{ content: '03 (03AM)' }, ...ashCountersAvgForHourRows[3]],
                [{ content: '04 (04AM)' }, ...ashCountersAvgForHourRows[4]],
                [{ content: '05 (05AM)' }, ...ashCountersAvgForHourRows[5]],
                [{ content: '06 (06AM)' }, ...ashCountersAvgForHourRows[6]],
                [{ content: '07 (07AM)' }, ...ashCountersAvgForHourRows[7]],
                [{ content: '08 (08AM)' }, ...ashCountersAvgForHourRows[8]],
                [{ content: '09 (09AM)' }, ...ashCountersAvgForHourRows[9]],
                [{ content: '10 (10AM)' }, ...ashCountersAvgForHourRows[10]],
                [{ content: '11 (11AM)' }, ...ashCountersAvgForHourRows[11]],
                [{ content: '12 (12PM)' }, ...ashCountersAvgForHourRows[12]],
                [{ content: '13 (01PM)' }, ...ashCountersAvgForHourRows[13]],
                [{ content: '14 (02PM)' }, ...ashCountersAvgForHourRows[14]],
                [{ content: '15 (03PM)' }, ...ashCountersAvgForHourRows[15]],
                [{ content: '16 (04PM)' }, ...ashCountersAvgForHourRows[16]],
                [{ content: '17 (05PM)' }, ...ashCountersAvgForHourRows[17]],
                [{ content: '18 (06PM)' }, ...ashCountersAvgForHourRows[18]],
                [{ content: '19 (07PM)' }, ...ashCountersAvgForHourRows[19]],
                [{ content: '20 (08PM)' }, ...ashCountersAvgForHourRows[20]],
                [{ content: '21 (09PM)' }, ...ashCountersAvgForHourRows[21]],
                [{ content: '22 (10PM)' }, ...ashCountersAvgForHourRows[22]],
                [{ content: '23 (11PM)' }, ...ashCountersAvgForHourRows[23]],
            ],
            true,
        ),
    );

    for (const entry of ashCounters.all) {
        const row: TableCellData[] = [{ content: moment(entry[0]).format(timestampFormat) }];

        for (let i = 0; i < ASH_COUNTER_TYPE_COUNT; i++) {
            const counter = entry[i + 1];

            row.push({
                content: counter.toString(),
                // @ts-expect-error Date is skipped in code, TS not narrowing
                className: getValueClassName(counter / totalDevices, IDEAL_ASH_COUNTERS[i], ...IDEAL_ASH_COUNTERS_FACTORS[i]),
            });
        }

        ashCountersRows.push(row);
    }

    {
        const val = ashCounters.avgPerDevice[AshCounterType.TX_N1_FRAMES];
        const ideal = IDEAL_ASH_COUNTERS[AshCounterType.TX_N1_FRAMES];
        const cls = getValueClassName(val, ideal, ...IDEAL_ASH_COUNTERS_FACTORS[AshCounterType.TX_N1_FRAMES]);

        if (cls) {
            const msg = makeMessage(
                `"Not ready" transaction count is high (${val} vs ${ideal} "ideal")`,
                'This can indicate heavy spamming from devices. Zigbee2MQTT was forced to regulate the flow.',
                cls,
            );

            section.append(msg);
        }
    }

    {
        const val = ashCounters.avgPerDevice[AshCounterType.RX_NO_BUFFER];
        const ideal = IDEAL_ASH_COUNTERS[AshCounterType.RX_NO_BUFFER];
        const cls = getValueClassName(val, ideal, ...IDEAL_ASH_COUNTERS_FACTORS[AshCounterType.RX_NO_BUFFER]);

        if (cls) {
            const msg = makeMessage(
                `Out of buffer count is high (${val} vs ${ideal} "ideal")`,
                'This can indicate heavy spamming from devices. Zigbee2MQTT was forced to drop messages.',
                cls,
            );

            section.append(msg);
        }
    }

    {
        const rxBad =
            ashCounters.avg[AshCounterType.RX_CRC_ERRORS] +
            ashCounters.avg[AshCounterType.RX_COMM_ERRORS] +
            ashCounters.avg[AshCounterType.RX_TOO_SHORT] +
            ashCounters.avg[AshCounterType.RX_TOO_LONG] +
            ashCounters.avg[AshCounterType.RX_BAD_CONTROL] +
            ashCounters.avg[AshCounterType.RX_BAD_LENGTH] +
            ashCounters.avg[AshCounterType.RX_BAD_ACK_NUMBER] +
            ashCounters.avg[AshCounterType.RX_OUT_OF_SEQUENCE] +
            ashCounters.avg[AshCounterType.RX_ACK_TIMEOUTS];
        const cls = getValueClassName(rxBad, 1, 5, 10, false);

        if (cls) {
            const msg = makeMessage(
                `Error count with received messages is high (${rxBad} times)`,
                'This can indicate general instability (adapter/network).',
                cls,
            );

            section.append(msg);
        }
    }

    section.append(tableContainerAvg);
    section.append(tableContainerAvgForHour);

    const showAllButton = makeButton('Show All', 'is-primary');

    showAllButton.addEventListener('click', () => {
        showAllButton.remove();

        const tableContainerAll = makeTableContainer(makeTable(ashCountersHeader, [], ashCountersRows, true));

        section.append(tableContainerAll);
    });

    section.append(showAllButton);
}

function appendRoutingSection(section: HTMLDivElement): void {
    if (networkRouteErrors.all.length === 0) {
        return;
    }

    const rows: TableCellData[][] = [];
    const errorsByDevice: { [error: string /* EmberStackError */]: { [device: number]: number } } = {};

    for (const entry of networkRouteErrors.all) {
        const device = entry[1];
        const error = entry[2];
        const count = entry[3];

        if (errorsByDevice[error] === undefined) {
            errorsByDevice[error] = {};
        }

        errorsByDevice[error][device] = errorsByDevice[error][device] === undefined ? count : errorsByDevice[error][device] + count;

        if (count > 2) {
            rows.push([
                { content: moment(entry[0]).format(timestampFormat) },
                { content: `${device} / ${toHex(device)}` },
                { content: error },
                { content: count.toString() },
            ]);
        }
    }

    const tableContainer = makeTableContainer(
        makeTable(
            [
                '<span title="First occurrence">Timestamp</span>',
                'Device / Hex',
                'Error',
                '<span title="Within a short period at and after Timestamp (i.e. failed retries)">Count</span>',
            ],
            [],
            rows,
            true,
        ),
    );

    // eslint-disable-next-line guard-for-in
    for (const error in errorsByDevice) {
        const rowsByError: TableCellData[][] = [];

        // eslint-disable-next-line guard-for-in
        for (const k in errorsByDevice[error]) {
            const deviceAvgPerHour = round(errorsByDevice[error][k] / logMetadata.duration, 4);

            // only display msg for device if average per hour is high
            if (deviceAvgPerHour > 0.1) {
                rowsByError.push([
                    { content: `${k} / ${toHex(Number.parseInt(k, 10))}` },
                    { content: deviceAvgPerHour.toString(), className: getValueClassName(deviceAvgPerHour, 0.1, 10, 20) },
                ]);
            }
        }

        if (rowsByError.length > 0) {
            const tableContainer = makeTableContainer(makeTable(['Device / Hex', 'Errors per hour'], [], rowsByError, true));

            const notice = EMBER_STACK_ERRORS_NOTICE[EmberStackError[error as keyof typeof EmberStackError]];
            const msg = makeMessage(`${error}`, notice === '' ? `` : `<p>${notice}</p>`, 'is-warning is-table-header');

            section.append(msg);
            section.append(tableContainer);
        }
    }

    section.append(makeMessage(`Errors appearing at least 3 times in succession`, ``, 'is-danger is-table-header'));
    section.append(tableContainer);
}

window.addEventListener('load', () => {
    initVariables();

    const $loadForm = document.querySelector('#log-file-form')! as HTMLFormElement;
    const $heroBody = document.querySelector('#hero-body')!;
    const $menuHomeLink = document.querySelector('#menu-home')! as HTMLLinkElement;
    const $sectionHome = document.querySelector('#section-home')! as HTMLDivElement;
    const $menuStatsLink = document.querySelector('#menu-stats')! as HTMLLinkElement;
    const $sectionStats = document.querySelector('#section-stats')! as HTMLDivElement;
    const $menuNcpCountersLink = document.querySelector('#menu-ncp-counters')! as HTMLLinkElement;
    const $sectionNcpCounters = document.querySelector('#section-ncp-counters')! as HTMLDivElement;
    const $menuAshCountersLink = document.querySelector('#menu-ash-counters')! as HTMLLinkElement;
    const $sectionAshCounters = document.querySelector('#section-ash-counters')! as HTMLDivElement;
    const $menuRoutingLink = document.querySelector('#menu-routing')! as HTMLLinkElement;
    const $sectionRouting = document.querySelector('#section-routing')! as HTMLDivElement;
    const $menuToolsLink = document.querySelector('#menu-tools')! as HTMLLinkElement;
    const $sectionTools = document.querySelector('#section-tools')! as HTMLDivElement;
    const $menuHelpLink = document.querySelector('#menu-help')! as HTMLLinkElement;
    const $sectionHelp = document.querySelector('#section-help')! as HTMLDivElement;
    const menu: [HTMLLinkElement, HTMLDivElement][] = [
        [$menuHomeLink, $sectionHome],
        [$menuStatsLink, $sectionStats],
        [$menuNcpCountersLink, $sectionNcpCounters],
        [$menuAshCountersLink, $sectionAshCounters],
        [$menuRoutingLink, $sectionRouting],
        [$menuToolsLink, $sectionTools],
        [$menuHelpLink, $sectionHelp],
    ];

    for (const [$link, $section] of menu) {
        $link.addEventListener('click', () => {
            // li
            $link.parentElement!.className = 'is-active';
            $section.className = 'section';

            for (const [$otherLink, $otherSection] of menu.filter((m) => m[0] !== $link)) {
                $otherLink.parentElement!.className = '';
                $otherSection.className = 'section is-hidden';
            }
        });
    }

    $loadForm.addEventListener('submit', async (event: SubmitEvent) => {
        event.preventDefault();
        initVariables();
        const data = new FormData($loadForm);

        timestampFormat = data.get('timestamp-format') as string;

        routers = Number.parseInt(data.get('number-routers') as string, 10);

        if (Number.isNaN(routers) || routers < 0) {
            throw new NotifyError('Number of routers must be at least 0.', 'Invalid number of routers');
        }

        endDevices = Number.parseInt(data.get('number-devices') as string, 10);

        if (Number.isNaN(endDevices) || endDevices < 0) {
            throw new NotifyError('Number of end devices must be at least 0.', 'Invalid number of end devices');
        }

        totalDevices = routers + endDevices;

        if (Number.isNaN(totalDevices) || totalDevices <= 0) {
            throw new NotifyError('Total number of devices must be at least 1.', 'Invalid total number of devices');
        }

        logFile = data.get('log-file') as File;

        await parseLogFile();

        appendStatsSection($sectionStats);
        appendNCPCountersSection($sectionNcpCounters);
        appendASHCountersSection($sectionAshCounters);
        appendRoutingSection($sectionRouting);

        $heroBody.className = 'is-hidden';

        $menuStatsLink.click();
    });

    $menuHomeLink.addEventListener('click', async () => {});

    $menuStatsLink.addEventListener('click', async () => {
        if (!logFile) {
            throw new NotifyError('Load a log file from the menu first.', 'No log file');
        }
    });

    $menuNcpCountersLink.addEventListener('click', async () => {
        if (!logFile) {
            throw new NotifyError('Load a log file from the menu first.', 'No log file');
        }

        if (ncpCounters.all.length === 0) {
            throw new NotifyError('No NCP counters were found in the given log file.', 'No NCP counters found');
        }
    });

    $menuAshCountersLink.addEventListener('click', async () => {
        if (!logFile) {
            throw new NotifyError('Load a log file from the menu first.', 'No log file');
        }

        if (ashCounters.all.length === 0) {
            throw new NotifyError('No ASH counters were found in the given log file.', 'No ASH counters found');
        }
    });

    $menuRoutingLink.addEventListener('click', async () => {
        if (!logFile) {
            throw new NotifyError('Load a log file from the menu first.', 'No log file');
        }

        if (networkRouteErrors.all.length === 0) {
            // eslint-disable-next-line no-new
            new Notify({
                status: 'success',
                title: 'No network/route error found',
                text: `No network/router error was found in the given log file.`,
            });
        }
    });

    $menuToolsLink.addEventListener('click', async () => {});

    // add dynamic part of the help section
    {
        const ncpCountersRows: TableCellData[][] = [];

        for (let i = 0; i < EMBER_COUNTER_TYPE_COUNT; i++) {
            ncpCountersRows.push([
                { content: EmberCounterType[i] },
                { content: IDEAL_NCP_COUNTERS[i].toString() },
                { content: NCP_COUNTERS_NOTICE[i] },
            ]);
        }

        const ncpCountersTable = makeTableContainer(makeTable(['NCP Counter', 'Ideal (Per Device)', 'Note'], [], ncpCountersRows));

        const ashCountersRows: TableCellData[][] = [];

        for (let i = 0; i < ASH_COUNTER_TYPE_COUNT; i++) {
            ashCountersRows.push([
                { content: AshCounterType[i] },
                { content: IDEAL_ASH_COUNTERS[i].toString() },
                { content: ASH_COUNTERS_NOTICE[i] },
            ]);
        }

        const ashCountersTable = makeTableContainer(makeTable(['ASH Counter', 'Ideal (Per Device)', 'Note'], [], ashCountersRows));

        $sectionHelp.append(ncpCountersTable);
        $sectionHelp.append(ashCountersTable);
    }

    if (window.location.hash) {
        const link = document.querySelector(`#menu-${window.location.hash.slice(1)}`) as HTMLLinkElement;

        if (link) {
            link.click();
        }
    }
});

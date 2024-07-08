import moment from 'moment';
import Notify from 'simple-notify';
import { NotifyError } from './notify-error';
import { round, toHex } from "./utils";
import { AshCounterType, EmberCounterType, EmberStackError } from "./zh";
import {
    AshCounters,
    EmberCounters,
    LogAshCounters,
    LogMetadata,
    LogNcpCounters,
    LogNetworkRouteErrors,
    TableCellData
} from './types';
import {
    ASH_COUNTERS_MATCH,
    ASH_COUNTER_TYPE_COUNT,
    EMBER_COUNTER_TYPE_COUNT,
    MIN_DURATION,
    NCP_COUNTERS_MATCH,
    NETWORK_ROUTE_ERRORS_MATCH,
    EMBER_COUNTERS_PER_DEVICE_IRRELEVANTS,
    ROUTING_ERROR_DUP_IGNORE_MS,
    START_OFFSET,
    TIMESTAMP_REGEX,
    DURATION_WARNING_FACTOR
} from './consts';
import {
    getValueClassName,
    makeListCard,
    makeMessage,
    makeTable,
    makeTableContainer
} from './dom';
import {
    ASH_COUNTERS_NOTICE,
    IDEAL_ASH_COUNTERS,
    IDEAL_NCP_COUNTERS,
    NCP_COUNTERS_NOTICE,
    IDEAL_NCP_COUNTERS_FACTORS,
    IDEAL_ASH_COUNTERS_FACTORS,
    IDEAL_ROUTER_RATIO,
    EMBER_STACK_ERRORS_NOTICE
} from './data';

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
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0,
];
const ncpCounters: LogNcpCounters = {
    all: [],
    avg: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0,
    ],
    avgPerDevice: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0,
    ],
};
const ashCountersSum: AshCounters = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
];
const ashCounters: LogAshCounters = {
    all: [],
    avg: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
    ],
    avgPerDevice: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0,
    ],
};

const networkRouteErrors: LogNetworkRouteErrors = {
    all: [],
}

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
    ncpCounters.all = [];
    ncpCounters.avg.fill(0);
    ncpCounters.avgPerDevice.fill(0);

    ashCountersSum.fill(0);
    ashCounters.all = [];
    ashCounters.avg.fill(0);
    ashCounters.avgPerDevice.fill(0);

    networkRouteErrors.all = [];
}

/**
 * Adapted @from https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader/read#example_2_-_handling_text_line_by_line
 * @param fileURL 
 */
async function* makeTextFileLineIterator(file: File): AsyncGenerator<string, void, unknown> {
    const utf8Decoder = new TextDecoder("utf-8");
    let reader = file.stream().getReader();
    let { value, done } = await reader.read();
    let chunk = value ? utf8Decoder.decode(value, { stream: true }) : "";

    const re = /\r\n|\n|\r/gm;
    let startIndex = 0;

    for (; ;) {
        let result = re.exec(chunk);

        if (!result) {
            if (done) {
                break;
            }

            let remainder = chunk.substring(startIndex);

            ({ value, done } = await reader.read());

            chunk = remainder + (value ? utf8Decoder.decode(value, { stream: true }) : "");
            startIndex = re.lastIndex = 0;

            continue;
        }

        yield chunk.substring(startIndex, result.index);

        startIndex = re.lastIndex;
    }

    if (startIndex < chunk.length) {
        // last line didn't end in a newline char
        yield chunk.substring(startIndex);
    }
}

async function parseLogFile(): Promise<void> {
    if (!logFile) {
        throw new NotifyError('Load a log file from the menu first.', 'No log file');
    }

    for await (const line of makeTextFileLineIterator(logFile)) {
        const timestampMatch = line.match(TIMESTAMP_REGEX);

        if (!timestampMatch) {
            // shouldn't happen with new logging, but just in case, ignore lines without timestamp
            continue;
        }

        logMetadata.lines++;

        const timestampStr = timestampMatch[0].substring(1, timestampMatch[0].length - 1);
        const timestamp = new Date(timestampStr);

        if (!logMetadata.start) {
            logMetadata.start = timestamp;
            logMetadata.startOffset = new Date(timestamp.getTime() + START_OFFSET);
        }

        logMetadata.end = timestamp;

        const ncpCountersIndex = line.indexOf(NCP_COUNTERS_MATCH);

        if (ncpCountersIndex !== -1) {
            const subLine = line.substring(ncpCountersIndex + NCP_COUNTERS_MATCH.length);
            const counters = subLine.split(',').map((v) => parseInt(v));

            if (counters.length != EMBER_COUNTER_TYPE_COUNT) {
                continue;
            }

            // @ts-expect-error length validated above
            ncpCounters.all.push([timestamp, ...counters]);

            for (let i = 0; i < EMBER_COUNTER_TYPE_COUNT; i++) {
                // TODO: deal with 65535 & rollover
                const cI = counters[i];
                ncpCountersSum[i] += cI;
            }

            continue;
        }

        const ashCountersIndex = line.indexOf(ASH_COUNTERS_MATCH);

        if (ashCountersIndex !== -1) {
            const subLine = line.substring(ashCountersIndex + ASH_COUNTERS_MATCH.length);
            const counters = subLine.split(',').map((v) => parseInt(v));

            if (counters.length != ASH_COUNTER_TYPE_COUNT) {
                continue;
            }

            // @ts-expect-error length validated above
            ashCounters.all.push([timestamp, ...counters]);

            for (let i = 0; i < ASH_COUNTER_TYPE_COUNT; i++) {
                const cI = counters[i];
                ashCountersSum[i] += cI;
            }

            continue;
        }

        const networkRouteErrorsIndex = line.indexOf(NETWORK_ROUTE_ERRORS_MATCH);

        if (networkRouteErrorsIndex !== -1) {
            // ignore network/route errors around Z2M start
            if (timestamp < logMetadata.startOffset!) {
                continue;
            }

            const subLine = line.substring(networkRouteErrorsIndex + NETWORK_ROUTE_ERRORS_MATCH.length);
            const splitLine = subLine.split(' ');// ['ROUTE_ERROR_MANY_TO_ONE_ROUTE_FAILURE', 'for', '"38837".']
            const error = splitLine[0];
            const device = parseInt(splitLine[2].substring(1, splitLine[2].length - 2));

            if (networkRouteErrors.all.length !== 0) {
                const prev = (networkRouteErrors.all[networkRouteErrors.all.length - 1]);
                const countOffset = prev[0].getTime() + ROUTING_ERROR_DUP_IGNORE_MS;

                // count duplicate errors within short period instead
                if (prev[1] === device && prev[2] === error && timestamp.getTime() < countOffset) {
                    prev[3] += 1;
                    continue;
                }
            }

            networkRouteErrors.all.push([timestamp, device, error, 1]);

            continue;
        }
    }

    if (!logMetadata.start || !logMetadata.end) {
        throw new NotifyError('Could not retrieve start or end timestamps from log file.', 'Invalid start or end timestamp');
    }

    logMetadata.duration = (logMetadata.end.getTime() - logMetadata.start.getTime()) / 1000 / 3600;

    if (logMetadata.duration < MIN_DURATION) {
        throw new NotifyError('Log analysis over such a duration would be irrelevant.', 'Log duration too short');
    }

    const ncpCountersCount = ncpCounters.all.length;

    if (ncpCountersCount) {
        let i = 0;
        for (const c of ncpCountersSum) {
            const avg = (c / ncpCountersCount);

            ncpCounters.avg[i] = round(avg, 2);
            ncpCounters.avgPerDevice[i] = round(avg / totalDevices, 4);
            i++;
        }
    }

    const ashCountersCount = ashCounters.all.length;

    if (ashCountersCount) {
        let i = 0;
        for (const c of ashCountersSum) {
            const avg = (c / ashCountersCount);

            ashCounters.avg[i] = round(avg, 2);
            ashCounters.avgPerDevice[i] = round(avg / totalDevices, 4);
            i++;
        }
    }
}

window.onload = () => {
    initVariables();

    const $loadForm = document.getElementById('log-file-form')! as HTMLFormElement;
    const $heroBody = document.getElementById('hero-body')!;
    const $menuHomeLink = document.getElementById('menu-home')! as HTMLLinkElement;
    const $sectionHome = document.getElementById('section-home')! as HTMLLinkElement;
    const $menuStatsLink = document.getElementById('menu-stats')! as HTMLLinkElement;
    const $sectionStats = document.getElementById('section-stats')! as HTMLLinkElement;
    const $menuNcpCountersLink = document.getElementById('menu-ncp-counters')! as HTMLLinkElement;
    const $sectionNcpCounters = document.getElementById('section-ncp-counters')! as HTMLLinkElement;
    const $menuAshCountersLink = document.getElementById('menu-ash-counters')! as HTMLLinkElement;
    const $sectionAshCounters = document.getElementById('section-ash-counters')! as HTMLLinkElement;
    const $menuRoutingLink = document.getElementById('menu-routing')! as HTMLLinkElement;
    const $sectionRouting = document.getElementById('section-routing')! as HTMLLinkElement;
    const $menuToolsLink = document.getElementById('menu-tools')! as HTMLLinkElement;
    const $sectionTools = document.getElementById('section-tools')! as HTMLLinkElement;
    const $menuHelpLink = document.getElementById('menu-help')! as HTMLLinkElement;
    const $sectionHelp = document.getElementById('section-help')! as HTMLLinkElement;
    const menu: [HTMLLinkElement, HTMLLinkElement][] = [
        [$menuHomeLink, $sectionHome],
        [$menuStatsLink, $sectionStats],
        [$menuNcpCountersLink, $sectionNcpCounters],
        [$menuAshCountersLink, $sectionAshCounters],
        [$menuRoutingLink, $sectionRouting],
        [$menuToolsLink, $sectionTools],
        [$menuHelpLink, $sectionHelp]
    ];

    for (const [$link, $section] of menu) {
        $link.addEventListener('click', function () {
            // li
            $link.parentElement!.className = 'is-active';
            $section.className = 'section';

            for (const [$otherLink, $otherSection] of menu.filter((m) => m[0] != $link)) {
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

        routers = parseInt(data.get('number-routers') as string);

        if (Number.isNaN(routers) || routers < 0) {
            throw new NotifyError('Number of routers must be at least 0.', 'Invalid number of routers');
        }

        endDevices = parseInt(data.get('number-devices') as string);

        if (Number.isNaN(endDevices) || endDevices < 0) {
            throw new NotifyError('Number of end devices must be at least 0.', 'Invalid number of end devices');
        }

        totalDevices = routers + endDevices;

        if (Number.isNaN(totalDevices) || totalDevices <= 0) {
            throw new NotifyError('Total number of devices must be at least 1.', 'Invalid total number of devices');
        }

        logFile = data.get('log-file') as File;

        await parseLogFile();

        // stats
        {
            const grid = document.createElement('div');
            grid.className = 'grid';

            const ratio = (endDevices > 0) ? round(routers / endDevices, 2) : -1;
            const parametersList = [
                `Number of routers: ${routers}`,
                `Number of end devices: ${endDevices}`,
            ];

            if (ratio !== -1) {
                parametersList.push(`Routers to end devices ratio: ${ratio} (Ideal: above ${IDEAL_ROUTER_RATIO})`);

                const warningRatio = (totalDevices > 10) && (ratio < IDEAL_ROUTER_RATIO);

                if (warningRatio) {
                    parametersList.push(`<em class="has-text-warning">\u26a0 You may want to increase the number of routers in your network</em>`);
                }
            }

            const parametersCard = makeListCard('Parameters', parametersList);

            const warningDuration = logMetadata.duration < DURATION_WARNING_FACTOR;
            const logFileCard = makeListCard('Log file', [
                `Lines: ${logMetadata.lines}`,
                `Start: ${moment(logMetadata.start).format(timestampFormat)}`,
                `End: ${moment(logMetadata.end).format(timestampFormat)}`,
                `Ignore before (avoid starting "noise"): ${moment(logMetadata.startOffset).format(timestampFormat)}`,
                `Duration: ${round(logMetadata.duration, 2)} hours ${warningDuration ? '<em class="has-text-warning">\u26a0 This is likely too low to get relevant statistics</em>' : ''}`,
                `NCP Counters: ${ncpCounters.all.length}`,
                `ASH Counters: ${ashCounters.all.length}`,
                `Network/Router Errors: ${networkRouteErrors.all.length}`,
            ]);

            grid.appendChild(parametersCard);
            grid.appendChild(logFileCard);

            $sectionStats.appendChild(grid);
        }

        // ncp counters
        if (ncpCounters.all.length) {
            const ncpCountersHeader: string[] = ['Timestamp'];
            const ncpCountersRows: TableCellData[][] = [];
            const ncpCountersIdealRows: TableCellData[] = [];
            const ncpCountersAvgPerDeviceRows: TableCellData[] = [];
            const ncpCountersAvgRows: TableCellData[] = [];

            for (let i = 0; i < EMBER_COUNTER_TYPE_COUNT; i++) {
                ncpCountersHeader.push(`<span title="${NCP_COUNTERS_NOTICE[i]}">${EmberCounterType[i]}</span>`);

                const counter = ncpCounters.avgPerDevice[i];
                const ideal = IDEAL_NCP_COUNTERS[i];

                ncpCountersIdealRows.push({ content: ideal.toString(), className: 'is-dark' });
                ncpCountersAvgPerDeviceRows.push({
                    content: counter.toString(),
                    className: EMBER_COUNTERS_PER_DEVICE_IRRELEVANTS.includes(i) ?
                        'is-invisible' : getValueClassName(counter, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[i]),
                });
                ncpCountersAvgRows.push({
                    content: ncpCounters.avg[i].toString(),
                    className: getValueClassName(counter, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[i])
                });
            }

            const tableContainerAvg = makeTableContainer(makeTable(
                ['', ...ncpCountersHeader.slice(1)],
                [],
                [
                    [{content: 'Ideal Per Device'}, ...ncpCountersIdealRows],
                    [{content: 'Average Per Device'}, ...ncpCountersAvgPerDeviceRows],
                    [{content: 'Average'}, ...ncpCountersAvgRows],
                ],
            ));

            for (const entry of ncpCounters.all) {
                const row: TableCellData[] = [{content: moment(entry[0]).format(timestampFormat)}];

                for (let i = 0; i < EMBER_COUNTER_TYPE_COUNT; i++) {
                    const counter = entry[i + 1];

                    row.push({
                        content: counter.toString(),
                        // @ts-expect-error Date is skipped in code, TS not narrowing
                        className: getValueClassName((counter / totalDevices), IDEAL_NCP_COUNTERS[i], ...IDEAL_NCP_COUNTERS_FACTORS[i]),
                    });
                }

                ncpCountersRows.push(row);
            }

            const tableContainerAll = makeTableContainer(makeTable(
                ncpCountersHeader,
                [],
                ncpCountersRows,
                true,
            ));

            {
                const ashErrors = (ncpCountersSum[EmberCounterType.ASH_OVERFLOW_ERROR] + ncpCountersSum[EmberCounterType.ASH_FRAMING_ERROR]
                    + ncpCountersSum[EmberCounterType.ASH_OVERRUN_ERROR] + ncpCountersSum[EmberCounterType.ASH_XOFF]);

                if (ashErrors !== 0) {
                    const msg = makeMessage(
                        `ASH errors detected (${ashErrors} times)`,
                        'This can indicate a bad connection with the adapter or an issue with the driver installed in the operating system.',
                        'is-danger'
                    );

                    $sectionNcpCounters.appendChild(msg);
                }
            }

            {
                const val = ncpCounters.avgPerDevice[EmberCounterType.PHY_CCA_FAIL_COUNT];
                const ideal = IDEAL_NCP_COUNTERS[EmberCounterType.PHY_CCA_FAIL_COUNT];
                const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.PHY_CCA_FAIL_COUNT]);

                if (cls !== undefined) {
                    const msg = makeMessage(
                        `CCA failure count is high (${val} vs ${ideal} "ideal")`,
                        'This can indicate interferences on the 2.4GHz band on or around the current channel (WiFi, other Zigbee...).',
                        cls
                    );

                    $sectionNcpCounters.appendChild(msg);
                }
            }

            {
                const val = ncpCounters.avgPerDevice[EmberCounterType.ROUTE_DISCOVERY_INITIATED];
                const ideal = IDEAL_NCP_COUNTERS[EmberCounterType.ROUTE_DISCOVERY_INITIATED];
                const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.ROUTE_DISCOVERY_INITIATED]);

                if (cls !== undefined) {
                    const msg = makeMessage(
                        `Initiated route discovery count is high (${val} vs ${ideal} "ideal")`,
                        'This can indicate general instability in the network (unresponsive devices, bad routers...).',
                        cls
                    );

                    $sectionNcpCounters.appendChild(msg);
                }
            }

            {
                const val = ncpCounters.avgPerDevice[EmberCounterType.MAC_TX_UNICAST_RETRY];
                const ideal = IDEAL_NCP_COUNTERS[EmberCounterType.MAC_TX_UNICAST_RETRY];
                const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.MAC_TX_UNICAST_RETRY]);

                if (cls !== undefined) {
                    const msg = makeMessage(
                        `Packet retry count is high (${val} vs ${ideal} "ideal")`,
                        'This can indicate general instability in your network (unresponsive devices, bad routers...).',
                        cls
                    );

                    $sectionNcpCounters.appendChild(msg);
                }
            }

            {
                const val = ncpCounters.avgPerDevice[EmberCounterType.ADDRESS_CONFLICT_SENT];
                const ideal = IDEAL_NCP_COUNTERS[EmberCounterType.ADDRESS_CONFLICT_SENT];
                const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.ADDRESS_CONFLICT_SENT]);

                if (cls !== undefined) {
                    const msg = makeMessage(
                        `Address conflicts detected (${val} vs ${ideal} "ideal")`,
                        'This can indicate device(s) with poor firmware.',
                        cls
                    );

                    $sectionNcpCounters.appendChild(msg);
                }
            }

            {
                const val = ncpCounters.avgPerDevice[EmberCounterType.BROADCAST_TABLE_FULL];
                const ideal = IDEAL_NCP_COUNTERS[EmberCounterType.BROADCAST_TABLE_FULL];
                const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.BROADCAST_TABLE_FULL]);

                if (cls !== undefined) {
                    const msg = makeMessage(
                        `Broadcast table full detected (${val} vs ${ideal} "ideal")`,
                        'This can indicate the network is relying too heavily on broadcasts (messages to the whole network or to groups).',
                        cls
                    );

                    $sectionNcpCounters.appendChild(msg);
                }
            }

            {
                const val = ncpCounters.avg[EmberCounterType.NEIGHBOR_STALE];
                const ideal = 1;
                const cls = getValueClassName(val, ideal, ...IDEAL_NCP_COUNTERS_FACTORS[EmberCounterType.NEIGHBOR_STALE]);

                if (cls !== undefined) {
                    const msg = makeMessage(
                        `Stale neighbors count is high (${val} vs ${ideal} "ideal")`,
                        'This can indicate devices are regularly losing connection to the network.',
                        cls
                    );

                    $sectionNcpCounters.appendChild(msg);
                }
            }

            $sectionNcpCounters.appendChild(tableContainerAvg);
            $sectionNcpCounters.appendChild(tableContainerAll);
        }

        // ash counters
        if (ashCounters.all.length) {
            const ashCountersHeader: string[] = ['Timestamp'];
            const ashCountersRows: TableCellData[][] = [];
            const ashCountersIdealRows: TableCellData[] = [];
            const ashCountersAvgPerDeviceRows: TableCellData[] = [];
            const ashCountersAvgRows: TableCellData[] = [];

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
                    className: getValueClassName(counter, ideal, ...IDEAL_ASH_COUNTERS_FACTORS[i])
                });
            }

            const tableContainerAvg = makeTableContainer(makeTable(
                ['', ...ashCountersHeader.slice(1)],
                [],
                [
                    [{content: 'Ideal Per Device'}, ...ashCountersIdealRows],
                    [{content: 'Average Per Device'}, ...ashCountersAvgPerDeviceRows],
                    [{content: 'Average'}, ...ashCountersAvgRows],
                ],
            ));

            for (const entry of ashCounters.all) {
                const row: TableCellData[] = [{content: moment(entry[0]).format(timestampFormat)}];

                for (let i = 0; i < ASH_COUNTER_TYPE_COUNT; i++) {
                    const counter = entry[i + 1];

                    row.push({
                        content: counter.toString(),
                        // @ts-expect-error Date is skipped in code, TS not narrowing
                        className: getValueClassName((counter / totalDevices), IDEAL_ASH_COUNTERS[i], ...IDEAL_ASH_COUNTERS_FACTORS[i]),
                    });
                }

                ashCountersRows.push(row);
            }

            const tableContainerAll = makeTableContainer(makeTable(
                ashCountersHeader,
                [],
                ashCountersRows,
                true,
            ));

            {
                const val = ashCounters.avgPerDevice[AshCounterType.TX_N1_FRAMES];
                const ideal = IDEAL_ASH_COUNTERS[AshCounterType.TX_N1_FRAMES]
                const cls = getValueClassName(val, ideal, ...IDEAL_ASH_COUNTERS_FACTORS[AshCounterType.TX_N1_FRAMES]);

                if (cls !== undefined) {
                    const msg = makeMessage(
                        `"Not ready" transaction count is high (${val} vs ${ideal} "ideal")`,
                        'This can indicate heavy spamming from devices. Zigbee2MQTT was forced to regulate the flow.',
                        cls
                    );

                    $sectionAshCounters.appendChild(msg);
                }
            }

            {
                const val = ashCounters.avgPerDevice[AshCounterType.RX_NO_BUFFER];
                const ideal = IDEAL_ASH_COUNTERS[AshCounterType.RX_NO_BUFFER];
                const cls = getValueClassName(val, ideal, ...IDEAL_ASH_COUNTERS_FACTORS[AshCounterType.RX_NO_BUFFER]);

                if (cls !== undefined) {
                    const msg = makeMessage(
                        `Out of buffer count is high (${val} vs ${ideal} "ideal")`,
                        'This can indicate heavy spamming from devices. Zigbee2MQTT was forced to drop messages.',
                        cls
                    );

                    $sectionAshCounters.appendChild(msg);
                }
            }

            {
                const rxBad = (ashCounters.avg[AshCounterType.RX_CRC_ERRORS] + ashCounters.avg[AshCounterType.RX_COMM_ERRORS] + ashCounters.avg[AshCounterType.RX_TOO_SHORT]
                    + ashCounters.avg[AshCounterType.RX_TOO_LONG] + ashCounters.avg[AshCounterType.RX_BAD_CONTROL] + ashCounters.avg[AshCounterType.RX_BAD_LENGTH]
                    + ashCounters.avg[AshCounterType.RX_BAD_ACK_NUMBER] + ashCounters.avg[AshCounterType.RX_OUT_OF_SEQUENCE] + ashCounters.avg[AshCounterType.RX_ACK_TIMEOUTS]);
                const cls = getValueClassName(rxBad, 1, 5, 10, false);

                if (cls !== undefined) {
                    const msg = makeMessage(
                        `Error count with received messages is high (${rxBad} times)`,
                        'This can indicate general instability (adapter/network).',
                        cls
                    );

                    $sectionAshCounters.appendChild(msg);
                }
            }

            $sectionAshCounters.appendChild(tableContainerAvg);
            $sectionAshCounters.appendChild(tableContainerAll);
        }

        // routing
        if (networkRouteErrors.all.length) {
            const rows: TableCellData[][] = [];
            const errorsByDevice: {[error: string/*EmberStackError*/]: {[device: number]: number }} = {};

            for (const entry of networkRouteErrors.all) {
                const device = entry[1];
                const error = entry[2];
                const count = entry[3];

                if (errorsByDevice[error] === undefined) {
                    errorsByDevice[error] = {};
                }

                errorsByDevice[error][device] = (errorsByDevice[error][device] === undefined) ? count : errorsByDevice[error][device] + count;

                if (count > 2) {
                    rows.push([
                        { content: moment(entry[0]).format(timestampFormat) },
                        { content: `${device} / ${toHex(device)}` },
                        { content: error },
                        { content: count.toString() },
                    ]);
                }
            }

            const tableContainer = makeTableContainer(makeTable(
                ['<span title="First occurrence">Timestamp</span>', 'Device / Hex', 'Error', '<span title="Within a short period at and after Timestamp (i.e. failed retries)">Count</span>'],
                [],
                rows,
                true,
            ));

            for (const error in errorsByDevice) {
                const rowsByError: TableCellData[][] = [];

                for (const k in errorsByDevice[error]) {
                    const deviceAvgPerHour = round(errorsByDevice[error][k] / logMetadata.duration, 4);

                    // only display msg for device if average per hour is high
                    if (deviceAvgPerHour > 0.1) {
                        rowsByError.push([
                            { content: `${k} / ${toHex(parseInt(k))}` },
                            { content: deviceAvgPerHour.toString(), className: getValueClassName(deviceAvgPerHour, 0.1, 10, 20) },
                        ]);
                    }
                }

                if (rowsByError.length > 0) {
                    const tableContainer = makeTableContainer(makeTable(
                        ['Device / Hex', 'Errors per hour'],
                        [],
                        rowsByError,
                        true,
                    ));

                    // @ts-expect-error lookup by key
                    const notice = EMBER_STACK_ERRORS_NOTICE[EmberStackError[error]];
                    const msg = makeMessage(`${error}`, (notice !== '') ? `<p>${notice}</p>` : ``, 'is-warning is-table-header');

                    $sectionRouting.appendChild(msg);
                    $sectionRouting.appendChild(tableContainer);
                }
            }

            $sectionRouting.appendChild(makeMessage(`Errors appearing at least 3 times in succession`, ``, 'is-danger is-table-header'));
            $sectionRouting.appendChild(tableContainer);
        }

        $heroBody.className = 'is-hidden';

        $menuStatsLink.click();
    });

    $menuHomeLink.addEventListener('click', async function () {
    });

    $menuStatsLink.addEventListener('click', async function () {
        if (!logFile) {
            throw new NotifyError('Load a log file from the menu first.', 'No log file');
        }

    });

    $menuNcpCountersLink.addEventListener('click', async function () {
        if (!logFile) {
            throw new NotifyError('Load a log file from the menu first.', 'No log file');
        }

        if (!ncpCounters.all.length) {
            throw new NotifyError('No NCP counters were found in the given log file.', 'No NCP counters found');
        }
    });

    $menuAshCountersLink.addEventListener('click', async function () {
        if (!logFile) {
            throw new NotifyError('Load a log file from the menu first.', 'No log file');
        }

        if (!ashCounters.all.length) {
            throw new NotifyError('No ASH counters were found in the given log file.', 'No ASH counters found');
        }
    });

    $menuRoutingLink.addEventListener('click', async function () {
        if (!logFile) {
            throw new NotifyError('Load a log file from the menu first.', 'No log file');
        }

        if (!networkRouteErrors.all.length) {
            new Notify({
                status: 'success',
                title: 'No network/route error found',
                text: `No network/router error was found in the given log file.`,
            });
            return;
        }
    });

    $menuToolsLink.addEventListener('click', async function () {
    });

    // add dynamic part of the help section
    {
        const ncpCountersRows: TableCellData[][] = [];

        for (let i = 0; i < EMBER_COUNTER_TYPE_COUNT; i++) {
            ncpCountersRows.push([
                {content: EmberCounterType[i]}, {content: IDEAL_NCP_COUNTERS[i].toString()}, {content: NCP_COUNTERS_NOTICE[i]},
            ]);
        }

        const ncpCountersTable = makeTableContainer(makeTable(
            ['NCP Counter', 'Ideal (Per Device)', 'Note'],
            [],
            ncpCountersRows,
        ));

        const ashCountersRows: TableCellData[][] = [];

        for (let i = 0; i < ASH_COUNTER_TYPE_COUNT; i++) {
            ashCountersRows.push([
                {content: AshCounterType[i]}, {content: IDEAL_ASH_COUNTERS[i].toString()}, {content: ASH_COUNTERS_NOTICE[i]},
            ]);
        }

        const ashCountersTable = makeTableContainer(makeTable(
            ['ASH Counter', 'Ideal (Per Device)', 'Note'],
            [],
            ashCountersRows,
        ));

        $sectionHelp.appendChild(ncpCountersTable)
        $sectionHelp.appendChild(ashCountersTable);
    }

    if (window.location.hash) {
        const link = document.getElementById(`menu-${window.location.hash.slice(1)}`);

        if (link) {
            link.click();
        }
    }
};

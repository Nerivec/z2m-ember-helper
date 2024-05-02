import { EmberCounterType } from "./zh";

export const EMBER_COUNTER_TYPE_COUNT = 41;
export const ASH_COUNTER_TYPE_COUNT = 27;

export const NEW_LINE_REGEX = /\r\n|\n|\r/gm;
/** Offset used to ignore certain errors during/right after zigbee2mqtt start (in seconds). */
export const START_OFFSET = 60000;
/** Minimum duration (hours) for log analysis to be relevant. */
export const MIN_DURATION = 1;// (min 1 NCP counters logged)

export const TIMESTAMP_REGEX = new RegExp(/\[.*?\]/i);
export const NCP_COUNTERS_MATCH = '[NCP COUNTERS] ';
export const ASH_COUNTERS_MATCH = '[ASH COUNTERS] ';
export const NETWORK_ROUTE_ERRORS_MATCH = 'Received network/route error ';

/** Number of network/router erros considered acceptable over 100h of runtime, for 100 devices. */
export const ACCEPTABLE_NETWORK_ROUTE_ERRORS_PER_100H_100D = 25;

export const DURATION_WARNING_FACTOR = 5;
export const ROUTER_RATIO_WARNING_FACTOR = 0.8;

/** Timeframe within which duplicate network/route errors are ignored. */
export const ROUTING_ERROR_DUP_IGNORE_MS = 2500;

export const EMBER_COUNTERS_PER_DEVICE_IRRELEVANTS: EmberCounterType[] = [
    EmberCounterType.ROUTE_DISCOVERY_INITIATED,
    EmberCounterType.NEIGHBOR_ADDED,
    EmberCounterType.NEIGHBOR_REMOVED,
    EmberCounterType.NEIGHBOR_STALE,
    EmberCounterType.JOIN_INDICATION,
    EmberCounterType.CHILD_REMOVED,
    EmberCounterType.ASH_OVERFLOW_ERROR,
    EmberCounterType.ASH_FRAMING_ERROR,
    EmberCounterType.ASH_OVERRUN_ERROR,
    EmberCounterType.ASH_XOFF,
];

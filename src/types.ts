export type ListItemStatus = 'disabled' | 'success' | 'warning' | 'error' | 'unknown';
export type ListItemParams = [name: string, subject: string, desc: string, status?: ListItemStatus];

export type LogMetadata = {
    /** lines without timestamp ignored */
    lines: number;
    start?: Date;
    end?: Date;
    /** hours */
    duration: number;
    /** skip until this offset for certain data irrelevant during start. @see START_OFFSET */
    startOffset?: Date;
};

export type TableCellData = {
    content: string;
    className?: string;
}

/** @see EmberCounterType */
export type EmberCounters = [
    number, number, number, number, number, number, number, number, number, number,
    number, number, number, number, number, number, number, number, number, number,
    number, number, number, number, number, number, number, number, number, number,
    number, number, number, number, number, number, number, number, number, number,
    number,
];

export type LogNcpCounters = {
    all: [timestamp: Date, ...EmberCounters][];
    avg: EmberCounters;
    avgPerDevice: EmberCounters;
};

/** @see AshCounterType */
export type AshCounters = [
    number, number, number, number, number, number, number, number, number, number,
    number, number, number, number, number, number, number, number, number, number,
    number, number, number, number, number, number, number,
];

export type LogAshCounters = {
    all: [timestamp: Date, ...AshCounters][];
    avg: AshCounters;
    avgPerDevice: AshCounters;
};

export type LogNetworkRouteErrors = {
    all: [timestamp: Date, device: number, error: string/*EmberStackError*/][];
    counters: { [device: number]: number };
};

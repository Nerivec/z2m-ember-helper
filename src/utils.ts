export const round = (n: number, precision: number = 2): number => {
    const factor = 10 ** precision;

    return Math.round(n * factor) / factor;
};

// @from zigbee2mqtt-frontend
export const toHex = (input: number, padding = 4): string => {
    const padStr = '0'.repeat(padding);
    return '0x' + (padStr + input.toString(16)).slice(-1 * padding).toUpperCase();
};

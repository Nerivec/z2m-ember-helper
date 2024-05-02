import { AshCounters, EmberCounters } from "./types";
import { round } from "./utils";
import { MAX_TIME_MTORR_BROADCAST } from "./zh";

export const NCP_COUNTERS_NOTICE: readonly string[] = [
    /*MAC_RX_BROADCAST*/`The MAC received a broadcast Data frame, Command frame, or Beacon.`,
    /*MAC_TX_BROADCAST*/`The MAC transmitted a broadcast Data frame, Command frame or Beacon.`,
    /*MAC_RX_UNICAST*/`The MAC received a unicast Data or Command frame.`,
    /*MAC_TX_UNICAST_SUCCESS*/`The MAC successfully transmitted a unicast Data or Command frame. Note: Only frames with a 16-bit destination node ID are counted.`,
    /*MAC_TX_UNICAST_RETRY*/`The MAC retried a unicast Data or Command frame after initial Tx attempt. Note: CSMA-related failures are tracked separately via PHY_CCA_FAIL_COUNT.`,
    /*MAC_TX_UNICAST_FAILED*/`The MAC unsuccessfully transmitted a unicast Data or Command frame. Note: Only frames with a 16-bit destination node ID are counted.`,
    /*APS_DATA_RX_BROADCAST*/`The APS layer received a data broadcast.`,
    /*APS_DATA_TX_BROADCAST*/`The APS layer transmitted a data broadcast.`,
    /*APS_DATA_RX_UNICAST*/`The APS layer received a data unicast.`,
    /*APS_DATA_TX_UNICAST_SUCCESS*/`The APS layer successfully transmitted a data unicast.`,
    /*APS_DATA_TX_UNICAST_RETRY*/`The APS layer retried a unicast Data frame.`,
    /*APS_DATA_TX_UNICAST_FAILED*/`The APS layer unsuccessfully transmitted a data unicast.`,
    /*ROUTE_DISCOVERY_INITIATED*/`The network layer successfully submitted a new route discovery to the MAC. <em>Current Ember default is to trigger at least one every ${MAX_TIME_MTORR_BROADCAST} seconds.</em>`,
    /*NEIGHBOR_ADDED*/`An entry was added to the neighbor table.`,
    /*NEIGHBOR_REMOVED*/`An entry was removed from the neighbor table.`,
    /*NEIGHBOR_STALE*/`A neighbor table entry became stale because it had not been heard from.`,
    /*JOIN_INDICATION*/`A node joined or rejoined to the network via this node.`,
    /*CHILD_REMOVED*/`An entry was removed from the child table.`,
    /*ASH_OVERFLOW_ERROR*/`EZSP-UART only. An overflow error occurred in the UART.`,
    /*ASH_FRAMING_ERROR*/`EZSP-UART only. A framing error occurred in the UART.`,
    /*ASH_OVERRUN_ERROR*/`EZSP-UART only. An overrun error occurred in the UART.`,
    /*NWK_FRAME_COUNTER_FAILURE*/`A message was dropped at the Network layer because the NWK frame counter was not higher than the last message seen from that source.`,
    /*APS_FRAME_COUNTER_FAILURE*/`A message was dropped at the APS layer because the APS frame counter was not higher than the last message seen from that source.`,
    /*ASH_XOFF*/`EZSP-UART only. An XOFF was transmitted by the UART.`,
    /*APS_LINK_KEY_NOT_AUTHORIZED*/`An encrypted message was dropped by the APS layer because the sender's key has not been authenticated. As a result, the key is not authorized for use in APS data messages.`,
    /*NWK_DECRYPTION_FAILURE*/`A NWK encrypted message was received but dropped because decryption failed.`,
    /*APS_DECRYPTION_FAILURE*/`An APS encrypted message was received but dropped because decryption failed.`,
    /*ALLOCATE_PACKET_BUFFER_FAILURE*/`The number of failures to allocate a set of linked packet buffers. This doesn't necessarily mean that the packet buffer count was 0 at the time, but that the number requested was greater than the number free.`,
    /*RELAYED_UNICAST*/`The number of relayed unicast packets.`,
    /*PHY_TO_MAC_QUEUE_LIMIT_REACHED*/`The number of times a packet was dropped due to reaching the preset PHY-to-MAC queue limit. For each count, there may be more than 1 packet that was dropped due to the limit reached.`,
    /*PACKET_VALIDATE_LIBRARY_DROPPED_COUNT*/`The number of times a packet was dropped due to the packet-validate library checking a packet and rejecting it due to length or other formatting problems.`,
    /*TYPE_NWK_RETRY_OVERFLOW*/`The number of times the NWK retry queue is full and a new message failed to be added.`,
    /*PHY_CCA_FAIL_COUNT*/`The number of times the PHY layer was unable to transmit due to a failed CCA (Clear Channel Assessment) attempt.`,
    /*BROADCAST_TABLE_FULL*/`The number of times a NWK broadcast was dropped because the broadcast table was full.`,
    /*PTA_LO_PRI_REQUESTED*/`The number of times a low-priority packet traffic arbitration request has been made.`,
    /*PTA_HI_PRI_REQUESTED*/`The number of times a high-priority packet traffic arbitration request has been made.`,
    /*PTA_LO_PRI_DENIED*/`The number of times a low-priority packet traffic arbitration request has been denied.`,
    /*PTA_HI_PRI_DENIED*/`The number of times a high-priority packet traffic arbitration request has been denied.`,
    /*PTA_LO_PRI_TX_ABORTED*/`The number of times a low-priority packet traffic arbitration transmission has been aborted.`,
    /*PTA_HI_PRI_TX_ABORTED*/`The number of times a high-priority packet traffic arbitration transmission has been aborted.`,
    /*ADDRESS_CONFLICT_SENT*/`The number of times an address conflict has caused node_id change, and an address conflict error is sent.`,
];

export const ASH_COUNTERS_NOTICE: readonly string[] = [
    /*TX_DATA*/`The total bytes of transmitted data within DATA frames. <em>This can significantly vary if you have device types that transmit lots of data.</em>`,
    /*TX_ALL_FRAMES*/`The total number of transmitted frames.`,
    /*TX_DATA_FRAMES*/`The number of transmitted DATA frames.`,
    /*TX_ACK_FRAMES*/`The number of transmitted ACK frames.`,
    /*TX_NAK_FRAMES*/`The number of transmitted NAK frames.`,
    /*TX_RE_DATA_FRAMES*/`The number of re-transmitted DATA frames.`,
    /*TX_N1_FRAMES*/`The number of transmitted frames flagged with 'not ready'.`,
    /*TX_CANCELLED*/`The number of cancelled transmitted frames.`,
    /*RX_DATA*/`The total bytes of received data within DATA frames. <em>This can significantly vary if you have device types that transmit lots of data.</em>`,
    /*RX_ALL_FRAMES*/`The total number of received frames.`,
    /*RX_DATA_FRAMES*/`The number of received DATA frames.`,
    /*RX_ACK_FRAMES*/`The number of received ACK frames.`,
    /*RX_NAK_FRAMES*/`The number of received NAK frames.`,
    /*RX_RE_DATA_FRAMES*/`The number of re-transmitted received DATA frames.`,
    /*RX_N1_FRAMES*/`The number of received frames flagged with 'not ready'.`,
    /*RX_CANCELLED*/`The number of cancelled received frames.`,
    /*RX_CRC_ERRORS*/`The number of received frames with CRC errors.`,
    /*RX_COMM_ERRORS*/`The number of received frames with communication errors.`,
    /*RX_TOO_SHORT*/`The number of received frames that were too short.`,
    /*RX_TOO_LONG*/`The number of received frames that were too long.`,
    /*RX_BAD_CONTROL*/`The number of received frames with illegal control byte.`,
    /*RX_BAD_LENGTH*/`The number of received frames with illegal length for type.`,
    /*RX_BAD_ACK_NUMBER*/`The number of received frames with bad ACK number.`,
    /*RX_NO_BUFFER*/`The number of DATA frames discarded due to lack of buffers.`,
    /*RX_DUPLICATES*/`The number of received duplicate re-transmitted DATA frames.`,
    /*RX_OUT_OF_SEQUENCE*/`The number of DATA frames received out of sequence.`,
    /*RX_ACK_TIMEOUTS*/`The number of received ACK timeouts.`,
]

/**
 * @see index.html for details on these references
 */
export const IDEAL_NCP_COUNTERS: EmberCounters = [
    // [6388.21, 468.93, 7413.61, 6738.18, 62.46, 0.32, 0.14, 0.14, 5471.5, 5350.36, 0, 0, 60.32, 0, 0, 3.61, 0, 0, 0, 0, 0, 0.93, 0, 0, 0, 0, 6.43, 0, 0, 0, 0, 0, 0.25, 0, 0, 0, 0, 0, 0, 0, 0],
    193.5823,// MAC_RX_BROADCAST
    14.21,// MAC_TX_BROADCAST
    224.6548,// MAC_RX_UNICAST
    204.1872,// MAC_TX_UNICAST_SUCCESS
    1.8929,// MAC_TX_UNICAST_RETRY
    0.0097,// MAC_TX_UNICAST_FAILED
    0.0043,// APS_DATA_RX_BROADCAST
    0.0043,// APS_DATA_TX_BROADCAST
    165.803,// APS_DATA_RX_UNICAST
    162.132,// APS_DATA_TX_UNICAST_SUCCESS
    0,// APS_DATA_TX_UNICAST_RETRY
    0,// APS_DATA_TX_UNICAST_FAILED
    MAX_TIME_MTORR_BROADCAST,// ROUTE_DISCOVERY_INITIATED
    0,// NEIGHBOR_ADDED
    0,// NEIGHBOR_REMOVED
    0.1093,// NEIGHBOR_STALE
    0,// JOIN_INDICATION
    0,// CHILD_REMOVED
    0,// ASH_OVERFLOW_ERROR
    0,// ASH_FRAMING_ERROR
    0,// ASH_OVERRUN_ERROR
    0.0281,// NWK_FRAME_COUNTER_FAILURE
    0,// APS_FRAME_COUNTER_FAILURE
    0,// ASH_XOFF
    0,// APS_LINK_KEY_NOT_AUTHORIZED
    0,// NWK_DECRYPTION_FAILURE
    0.1948,// APS_DECRYPTION_FAILURE
    0,// ALLOCATE_PACKET_BUFFER_FAILURE
    0,// RELAYED_UNICAST
    0,// PHY_TO_MAC_QUEUE_LIMIT_REACHED
    0,// PACKET_VALIDATE_LIBRARY_DROPPED_COUNT
    0,// TYPE_NWK_RETRY_OVERFLOW
    0.0076,// PHY_CCA_FAIL_COUNT
    0,// BROADCAST_TABLE_FULL
    0,// PTA_LO_PRI_REQUESTED
    0,// PTA_HI_PRI_REQUESTED
    0,// PTA_LO_PRI_DENIED
    0,// PTA_HI_PRI_DENIED
    0,// PTA_LO_PRI_TX_ABORTED
    0,// PTA_HI_PRI_TX_ABORTED
    0,// ADDRESS_CONFLICT_SENT
];

/**
 * @see index.html for details on these references
 */
export const IDEAL_ASH_COUNTERS: AshCounters = [
    // [358977, 20943, 5107, 15836, 0, 0, 0, 0, 134107, 15868, 15868, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    10878,// TX_DATA
    634,// TX_ALL_FRAMES
    154,// TX_DATA_FRAMES
    479,// TX_ACK_FRAMES
    0,// TX_NAK_FRAMES
    0,// TX_RE_DATA_FRAMES
    0,// TX_N1_FRAMES
    0,// TX_CANCELLED
    4063,// RX_DATA
    480,// RX_ALL_FRAMES
    480,// RX_DATA_FRAMES
    0,// RX_ACK_FRAMES
    0,// RX_NAK_FRAMES
    0,// RX_RE_DATA_FRAMES
    0,// RX_N1_FRAMES
    0,// RX_CANCELLED
    0,// RX_CRC_ERRORS
    0,// RX_COMM_ERRORS
    0,// RX_TOO_SHORT
    0,// RX_TOO_LONG
    0,// RX_BAD_CONTROL
    0,// RX_BAD_LENGTH
    0,// RX_BAD_ACK_NUMBER
    0,// RX_NO_BUFFER
    0,// RX_DUPLICATES
    0,// RX_OUT_OF_SEQUENCE
    0,// RX_ACK_TIMEOUTS
]

/** From 20 routers, 13 end devices */
export const IDEAL_ROUTER_RATIO = round(20/13, 2);

/** 3 errors per devices over 100h */
export const IDEAL_NETWORK_ROUTE_ERRORS_PER_DEVICE_PER_1H = 0.03;

export const IDEAL_NCP_COUNTERS_FACTORS: [badFactor: number, veryBadFactor: number, higherBetter: boolean][] = [
    [5, 10, false],// MAC_RX_BROADCAST
    [5, 10, false],// MAC_TX_BROADCAST
    [5, 10, false],// MAC_RX_UNICAST
    [0, 0, false],// MAC_TX_UNICAST_SUCCESS
    [3, 5, false],// MAC_TX_UNICAST_RETRY
    [3, 5, false],// MAC_TX_UNICAST_FAILED
    [5, 10, false],// APS_DATA_RX_BROADCAST
    [5, 10, false],// APS_DATA_TX_BROADCAST
    [5, 10, false],// APS_DATA_RX_UNICAST
    [0, 0, false],// APS_DATA_TX_UNICAST_SUCCESS
    [-2, -2, false],// APS_DATA_TX_UNICAST_RETRY
    [-2, -2, false],// APS_DATA_TX_UNICAST_FAILED
    [1.3, 1.6, false],// ROUTE_DISCOVERY_INITIATED
    [0, 0, false],// NEIGHBOR_ADDED
    [0, 0, false],// NEIGHBOR_REMOVED
    [5, 10, false],// NEIGHBOR_STALE
    [0, 0, false],// JOIN_INDICATION
    [0, 0, false],// CHILD_REMOVED
    [-1, -1, false],// ASH_OVERFLOW_ERROR
    [-1, -1, false],// ASH_FRAMING_ERROR
    [-1, -1, false],// ASH_OVERRUN_ERROR
    [10, 20, false],// NWK_FRAME_COUNTER_FAILURE
    [10, 20, false],// APS_FRAME_COUNTER_FAILURE
    [-1, -1, false],// ASH_XOFF
    [0, 0, false],// APS_LINK_KEY_NOT_AUTHORIZED
    [10, 20, false],// NWK_DECRYPTION_FAILURE
    [10, 20, false],// APS_DECRYPTION_FAILURE
    [0, 0, false],// ALLOCATE_PACKET_BUFFER_FAILURE
    [0, 0, false],// RELAYED_UNICAST
    [-1, -1, false],// PHY_TO_MAC_QUEUE_LIMIT_REACHED
    [-1, -1, false],// PACKET_VALIDATE_LIBRARY_DROPPED_COUNT
    [-1, -1, false],// TYPE_NWK_RETRY_OVERFLOW
    [10, 15, false],// PHY_CCA_FAIL_COUNT
    [-2, -2, false],// BROADCAST_TABLE_FULL
    [0, 0, false],// PTA_LO_PRI_REQUESTED
    [0, 0, false],// PTA_HI_PRI_REQUESTED
    [0, 0, false],// PTA_LO_PRI_DENIED
    [0, 0, false],// PTA_HI_PRI_DENIED
    [0, 0, false],// PTA_LO_PRI_TX_ABORTED
    [0, 0, false],// PTA_HI_PRI_TX_ABORTED
    [-2, -2, false],// ADDRESS_CONFLICT_SENT
];

export const IDEAL_ASH_COUNTERS_FACTORS: [badFactor: number, veryBadFactor: number, higherBetter: boolean][] = [
    [0, 0, false],// TX_DATA
    [0, 0, false],// TX_ALL_FRAMES
    [0, 0, false],// TX_DATA_FRAMES
    [0, 0, false],// TX_ACK_FRAMES
    [-1, -1, false],// TX_NAK_FRAMES
    [-1, -1, false],// TX_RE_DATA_FRAMES
    [-1, -1, false],// TX_N1_FRAMES
    [-1, -1, false],// TX_CANCELLED
    [0, 0, false],// RX_DATA
    [0, 0, false],// RX_ALL_FRAMES
    [0, 0, false],// RX_DATA_FRAMES
    [0, 0, false],// RX_ACK_FRAMES
    [-1, -1, false],// RX_NAK_FRAMES
    [-1, -1, false],// RX_RE_DATA_FRAMES
    [-1, -1, false],// RX_N1_FRAMES
    [-1, -1, false],// RX_CANCELLED
    [-1, -1, false],// RX_CRC_ERRORS
    [-1, -1, false],// RX_COMM_ERRORS
    [-1, -1, false],// RX_TOO_SHORT
    [-1, -1, false],// RX_TOO_LONG
    [-1, -1, false],// RX_BAD_CONTROL
    [-1, -1, false],// RX_BAD_LENGTH
    [-1, -1, false],// RX_BAD_ACK_NUMBER
    [-1, -1, false],// RX_NO_BUFFER
    [-1, -1, false],// RX_DUPLICATES
    [-1, -1, false],// RX_OUT_OF_SEQUENCE
    [-1, -1, false],// RX_ACK_TIMEOUTS
];

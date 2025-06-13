/**
 * These should be kept in sync with zigbee-herdsman.
 */

/**
 * Defines the events reported to the application by the ::emberCounterHandler().
 * Usage of the destinationNodeId or data fields found in the EmberCounterInfo or EmberExtraCounterInfo
 * structs is denoted for counter types that use them.
 * (See comments accompanying enum definitions in this source file for details.)
 */
export enum EmberCounterType {
    /**
     * The MAC received a broadcast Data frame, Command frame, or Beacon.
     * - destinationNodeId: BROADCAST_ADDRESS or Data frames or sender node ID for Beacon frames
     * - data: not used
     */
    MAC_RX_BROADCAST = 0,
    /**
     * The MAC transmitted a broadcast Data frame, Command frame or Beacon.
     * - destinationNodeId: BROADCAST_ADDRESS
     * - data: not used
     */
    MAC_TX_BROADCAST = 1,
    /**
     * The MAC received a unicast Data or Command frame.
     * - destinationNodeId: MAC layer source or EMBER_UNKNOWN_NODE_ID if no 16-bit source node ID is present in the frame
     * - data: not used
     */
    MAC_RX_UNICAST = 2,
    /**
     * The MAC successfully transmitted a unicast Data or Command frame.
     *   Note: Only frames with a 16-bit destination node ID are counted.
     * - destinationNodeId: MAC layer destination address
     * - data: not used
     */
    MAC_TX_UNICAST_SUCCESS = 3,
    /**
     * The MAC retried a unicast Data or Command frame after initial Tx attempt.
     *   Note: CSMA-related failures are tracked separately via PHY_CCA_FAIL_COUNT.
     * - destinationNodeId: MAC layer destination or EMBER_UNKNOWN_NODE_ID if no 16-bit destination node ID is present in the frame
     * - data: number of retries (after initial Tx attempt) accumulated so far for this packet. (Should always be >0.)
     */
    MAC_TX_UNICAST_RETRY = 4,
    /**
     * The MAC unsuccessfully transmitted a unicast Data or Command frame.
     *   Note: Only frames with a 16-bit destination node ID are counted.
     * - destinationNodeId: MAC layer destination address
     * - data: not used
     */
    MAC_TX_UNICAST_FAILED = 5,
    /**
     * The APS layer received a data broadcast.
     * - destinationNodeId: sender's node ID
     * - data: not used
     */
    APS_DATA_RX_BROADCAST = 6,
    /** The APS layer transmitted a data broadcast. */
    APS_DATA_TX_BROADCAST = 7,
    /**
     * The APS layer received a data unicast.
     * - destinationNodeId: sender's node ID
     * - data: not used
     */
    APS_DATA_RX_UNICAST = 8,
    /**
     * The APS layer successfully transmitted a data unicast.
     * - destinationNodeId: NWK destination address
     * - data: number of APS retries (>=0) consumed for this unicast.
     */
    APS_DATA_TX_UNICAST_SUCCESS = 9,
    /**
     * The APS layer retried a unicast Data frame.
     * This is a placeholder and is not used by the @c ::emberCounterHandler() callback.
     * Instead, the number of APS retries are returned in the data parameter of the callback
     * for the @c ::APS_DATA_TX_UNICAST_SUCCESS and @c ::APS_DATA_TX_UNICAST_FAILED types.
     * However, our supplied Counters component code will attempt to collect this information
     * from the aforementioned counters and populate this counter.
     * Note that this counter's behavior differs from that of @c ::MAC_TX_UNICAST_RETRY .
     */
    APS_DATA_TX_UNICAST_RETRY = 10,
    /**
     * The APS layer unsuccessfully transmitted a data unicast.
     * - destinationNodeId: NWK destination address
     * - data: number of APS retries (>=0) consumed for this unicast.
     */
    APS_DATA_TX_UNICAST_FAILED = 11,
    /** The network layer successfully submitted a new route discovery to the MAC. */
    ROUTE_DISCOVERY_INITIATED = 12,
    /** An entry was added to the neighbor table. */
    NEIGHBOR_ADDED = 13,
    /** An entry was removed from the neighbor table. */
    NEIGHBOR_REMOVED = 14,
    /** A neighbor table entry became stale because it had not been heard from. */
    NEIGHBOR_STALE = 15,
    /**
     * A node joined or rejoined to the network via this node.
     * - destinationNodeId: node ID of child
     * - data: not used
     */
    JOIN_INDICATION = 16,
    /**
     * An entry was removed from the child table.
     * - destinationNodeId: node ID of child
     * - data: not used
     */
    CHILD_REMOVED = 17,
    /** EZSP-UART only. An overflow error occurred in the UART. */
    ASH_OVERFLOW_ERROR = 18,
    /** EZSP-UART only. A framing error occurred in the UART. */
    ASH_FRAMING_ERROR = 19,
    /** EZSP-UART only. An overrun error occurred in the UART. */
    ASH_OVERRUN_ERROR = 20,
    /** A message was dropped at the Network layer because the NWK frame counter was not higher than the last message seen from that source. */
    NWK_FRAME_COUNTER_FAILURE = 21,
    /**
     * A message was dropped at the APS layer because the APS frame counter was not higher than the last message seen from that source.
     * - destinationNodeId: node ID of MAC source that relayed the message
     * - data: not used
     */
    APS_FRAME_COUNTER_FAILURE = 22,
    /** EZSP-UART only. An XOFF was transmitted by the UART. */
    ASH_XOFF = 23,
    /**
     * An encrypted message was dropped by the APS layer because the sender's key has not been authenticated.
     * As a result, the key is not authorized for use in APS data messages.
     * - destinationNodeId: EMBER_NULL_NODE_ID
     * - data: APS key table index related to the sender
     */
    APS_LINK_KEY_NOT_AUTHORIZED = 24,
    /**
     * A NWK encrypted message was received but dropped because decryption failed.
     * - destinationNodeId: sender of the dropped packet
     * - data: not used
     */
    NWK_DECRYPTION_FAILURE = 25,
    /**
     * An APS encrypted message was received but dropped because decryption failed.
     * - destinationNodeId: sender of the dropped packet
     * - data: not used
     */
    APS_DECRYPTION_FAILURE = 26,
    /**
     * The number of failures to allocate a set of linked packet buffers.
     * This doesn't necessarily mean that the packet buffer count was 0 at the time,
     * but that the number requested was greater than the number free.
     */
    ALLOCATE_PACKET_BUFFER_FAILURE = 27,
    /**
     * The number of relayed unicast packets.
     * - destinationId: NWK layer destination address of relayed packet
     * - data: not used
     */
    RELAYED_UNICAST = 28,
    /**
     * The number of times a packet was dropped due to reaching the preset PHY-to-MAC queue limit (sli_mac_phy_to_mac_queue_length).
     * The limit will determine how many messages are accepted by the PHY between calls to emberTick().
     * After that limit is reached, packets will be dropped. The counter records the number of dropped packets.
     *
     * NOTE: For each call to emberCounterHandler() there may be more than 1 packet that was dropped due to the limit reached.
     * The actual number of packets dropped will be returned in the 'data' parameter passed to that function.
     *
     * - destinationNodeId: not used
     * - data: number of dropped packets represented by this counter event
     * - phyIndex: present
     */
    PHY_TO_MAC_QUEUE_LIMIT_REACHED = 29,
    /**
     * The number of times a packet was dropped due to the packet-validate library checking a packet
     * and rejecting it due to length or other formatting problems.
     * - destinationNodeId: not used
     * - data: type of validation condition that failed
     */
    PACKET_VALIDATE_LIBRARY_DROPPED_COUNT = 30,
    /**
     * The number of times the NWK retry queue is full and a new message failed to be added.
     * - destinationNodeId; not used
     * - data: NWK retry queue size that has been exceeded
     */
    TYPE_NWK_RETRY_OVERFLOW = 31,
    /**
     * The number of times the PHY layer was unable to transmit due to a failed CCA (Clear Channel Assessment) attempt.
     * See also: MAC_TX_UNICAST_RETRY.
     * - destinationNodeId: MAC layer destination or EMBER_UNKNOWN_NODE_ID if no 16-bit destination node ID is present in the frame
     * - data: not used
     */
    PHY_CCA_FAIL_COUNT = 32,
    /** The number of times a NWK broadcast was dropped because the broadcast table was full. */
    BROADCAST_TABLE_FULL = 33,
    /** The number of times a low-priority packet traffic arbitration request has been made. */
    PTA_LO_PRI_REQUESTED = 34,
    /** The number of times a high-priority packet traffic arbitration request has been made. */
    PTA_HI_PRI_REQUESTED = 35,
    /** The number of times a low-priority packet traffic arbitration request has been denied. */
    PTA_LO_PRI_DENIED = 36,
    /** The number of times a high-priority packet traffic arbitration request has been denied. */
    PTA_HI_PRI_DENIED = 37,
    /** The number of times a low-priority packet traffic arbitration transmission has been aborted. */
    PTA_LO_PRI_TX_ABORTED = 38,
    /** The number of times a high-priority packet traffic arbitration transmission has been aborted. */
    PTA_HI_PRI_TX_ABORTED = 39,
    /** The number of times an address conflict has caused node_id change, and an address conflict error is sent. */
    ADDRESS_CONFLICT_SENT = 40,
    /** The number of times CSL failed to schedule Rx on target */
    CSL_RX_SCHEDULE_FAILED = 41,
}

export enum AshCounterType {
    TX_DATA = 0,
    TX_ALL_FRAMES = 1,
    TX_DATA_FRAMES = 2,
    TX_ACK_FRAMES = 3,
    TX_NAK_FRAMES = 4,
    TX_RE_DATA_FRAMES = 5,
    TX_N1_FRAMES = 6,
    TX_CANCELLED = 7,
    RX_DATA = 8,
    RX_ALL_FRAMES = 9,
    RX_DATA_FRAMES = 10,
    RX_ACK_FRAMES = 11,
    RX_NAK_FRAMES = 12,
    RX_RE_DATA_FRAMES = 13,
    RX_N1_FRAMES = 14,
    RX_CANCELLED = 15,
    RX_CRC_ERRORS = 16,
    RX_COMM_ERRORS = 17,
    RX_TOO_SHORT = 18,
    RX_TOO_LONG = 19,
    RX_BAD_CONTROL = 20,
    RX_BAD_LENGTH = 21,
    RX_BAD_ACK_NUMBER = 22,
    RX_NO_BUFFER = 23,
    RX_DUPLICATES = 24,
    RX_OUT_OF_SEQUENCE = 25,
    RX_ACK_TIMEOUTS = 26,
}

export const MAX_TIME_MTORR_BROADCAST = 60;

export enum EmberStackError {
    // Error codes that a router uses to notify the message initiator about a broken route.
    ROUTE_ERROR_NO_ROUTE_AVAILABLE = 0x00,
    ROUTE_ERROR_TREE_LINK_FAILURE = 0x01,
    ROUTE_ERROR_NON_TREE_LINK_FAILURE = 0x02,
    ROUTE_ERROR_LOW_BATTERY_LEVEL = 0x03,
    ROUTE_ERROR_NO_ROUTING_CAPACITY = 0x04,
    ROUTE_ERROR_NO_INDIRECT_CAPACITY = 0x05,
    ROUTE_ERROR_INDIRECT_TRANSACTION_EXPIRY = 0x06,
    ROUTE_ERROR_TARGET_DEVICE_UNAVAILABLE = 0x07,
    ROUTE_ERROR_TARGET_ADDRESS_UNALLOCATED = 0x08,
    ROUTE_ERROR_PARENT_LINK_FAILURE = 0x09,
    ROUTE_ERROR_VALIDATE_ROUTE = 0x0a,
    ROUTE_ERROR_SOURCE_ROUTE_FAILURE = 0x0b,
    ROUTE_ERROR_MANY_TO_ONE_ROUTE_FAILURE = 0x0c,
    ROUTE_ERROR_ADDRESS_CONFLICT = 0x0d,
    ROUTE_ERROR_VERIFY_ADDRESSES = 0x0e,
    ROUTE_ERROR_PAN_IDENTIFIER_UPDATE = 0x0f,

    NETWORK_STATUS_NETWORK_ADDRESS_UPDATE = 0x10,
    NETWORK_STATUS_BAD_FRAME_COUNTER = 0x11,
    NETWORK_STATUS_BAD_KEY_SEQUENCE_NUMBER = 0x12,
    NETWORK_STATUS_UNKNOWN_COMMAND = 0x13,
}

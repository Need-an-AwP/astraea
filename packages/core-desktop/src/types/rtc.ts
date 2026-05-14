export type RTCRole = typeof OFFER | typeof ANSWER;

export const OFFER = "offer";

export const ANSWER = "answer";

export interface SDPWithICE {
    SDP: RTCSessionDescription
    ICEList: RTCIceCandidateInit[]
}

export type SendMessageMethod = (message: string) => void;

export type RTCConnectionStateCallback = (
    peerIP: string,
    role: string,
    state: string
) => void;

export type RelayDataChannelMessageCallback = (
    peerIP: string,
    message: string
) => void;

import { z } from 'zod';

/**
 * this schema responsible for rtc reports from both relay and direct,
 * every key should be covered by pion and browser.
 * common fields of candidate-pair can be tested by `test/statsDiff.test.ts`
 * all the desprictions are from MDN: https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidatePairStats
 */
export const RTCStatsSchema = z.object({
    // 筛选条件：保持严格，确保我们只处理 "被选中的候选对"
    /** A string with the value "candidate-pair", indicating the type of statistics that the object contains. */
    type: z.literal("candidate-pair"),
    /** A number representing the approximate available outbound capacity of the network. This reports the total number of bits per second available for all of the candidate pair's outgoing RTP streams. */
    availableOutgoingBitrate: z.number().optional().default(0),
    /** An integer representing the total number of bytes discarded due to socket errors on this candidate pair. */
    bytesDiscardedOnSend: z.number().optional().default(0),
    /** An integer representing the total number of payload bytes received on this candidate pair. */
    bytesReceived: z.number().optional().default(0),
    /** An integer representing the total number of payload bytes sent on this candidate pair (the total number of bytes sent excluding any headers, padding, or other protocol overhead). */
    bytesSent: z.number().optional().default(0),
    /** An integer representing the total number of STUN consent requests sent on this candidate pair. */
    consentRequestsSent: z.number().optional().default(0),
    /** A number representing the total time, in seconds, that elapsed between the most recently-sent STUN request and the response being received. */
    currentRoundTripTime: z.number().optional().default(0),
    /** A string that uniquely identifies the object that is being monitored to produce this set of statistics. */
    id: z.string().optional().default(""),
    /** A DOMHighResTimeStamp value indicating the time at which the last packet was received by the local peer from the remote peer for this candidate pair. */
    lastPacketReceivedTimestamp: z.number().optional().default(0),
    /** A DOMHighResTimeStamp value indicating the time at which the last packet was sent from the local peer to the remote peer for this candidate pair. */
    lastPacketSentTimestamp: z.number().optional().default(0),
    /** A string representing the unique ID corresponding to the RTCIceCandidate from the data included in the RTCIceCandidateStats object providing statistics for the candidate pair's local candidate. */
    localCandidateId: z.string().optional().default(""),
    /** A Boolean value which, if true, indicates that the candidate pair described by this object is one which has been proposed for use, and will be (or was) used if its priority is the highest among the nominated candidate pairs. */
    nominated: z.boolean().optional().default(false),
    /** An integer representing the total number of packets discarded due to socket errors on this candidate pair. */
    packetsDiscardedOnSend: z.number().optional().default(0),
    /** An integer representing the total number of packets received on this candidate pair. */
    packetsReceived: z.number().optional().default(0),
    /** An integer representing the total number of packets sent on this candidate pair. */
    packetsSent: z.number().optional().default(0),
    /** A string containing a unique ID corresponding to the remote candidate from which data was taken to construct the RTCIceCandidateStats object describing the remote end of the connection. */
    remoteCandidateId: z.string().optional().default(""),
    /** An integer representing the total number of connectivity check requests that have been received, including retransmissions. */
    requestsReceived: z.number().optional().default(0),
    /** An integer representing the total number of connectivity check requests that have been sent, not including retransmissions. */
    requestsSent: z.number().optional().default(0),
    /** An integer representing the total number of connectivity check responses that have been received. */
    responsesReceived: z.number().optional().default(0),
    /** An integer representing the total number of connectivity check responses that have been sent. */
    responsesSent: z.number().optional().default(0),
    /** A string which indicates the state of the connection between the two candidates. */
    state: z.string().optional().default(""),
    /** A DOMHighResTimeStamp object indicating the time at which the sample was taken for this statistics object. */
    timestamp: z.number().optional().default(0),
    /** A number indicating the total time, in seconds, that has elapsed between sending STUN requests and receiving responses to them, for all such requests made to date on this candidate pair. */
    totalRoundTripTime: z.number().optional().default(0),
    /** A string that uniquely identifies the RTCIceTransport that was inspected to obtain the transport-related statistics used in generating this object. */
    transportId: z.string().optional().default(""),
}).transform(data => ({
    availableOutgoingBitrate: data.availableOutgoingBitrate,
    bytesDiscardedOnSend: data.bytesDiscardedOnSend,
    bytesReceived: data.bytesReceived,
    bytesSent: data.bytesSent,
    consentRequestsSent: data.consentRequestsSent,
    currentRoundTripTime: data.currentRoundTripTime,
    id: data.id,
    lastPacketReceivedTimestamp: data.lastPacketReceivedTimestamp,
    lastPacketSentTimestamp: data.lastPacketSentTimestamp,
    localCandidateId: data.localCandidateId,
    nominated: data.nominated,
    packetsDiscardedOnSend: data.packetsDiscardedOnSend,
    packetsReceived: data.packetsReceived,
    packetsSent: data.packetsSent,
    remoteCandidateId: data.remoteCandidateId,
    requestsReceived: data.requestsReceived,
    requestsSent: data.requestsSent,
    responsesReceived: data.responsesReceived,
    responsesSent: data.responsesSent,
    state: data.state,
    timestamp: Date.now(),
    totalRoundTripTime: data.totalRoundTripTime,
    transportId: data.transportId,
}));

/**
 * zod RTC connection statistics type
 */
export type RTCStates = z.infer<typeof RTCStatsSchema>;
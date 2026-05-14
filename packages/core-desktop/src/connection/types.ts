export const RELAY = 'relay';
export const DIRECT = 'direct';

export type ActivePath = typeof RELAY | typeof DIRECT;

export interface ConnectionStats {
    rtt: number;
    packetsSent: number;
    packetsReceived: number;
    bytesSent: number;
    bytesReceived: number;
    timestamp: number;
}

export type messageListener = (path: ActivePath, msg: string) => void;
export type statusListener = (status: { relayStatus: RTCPeerConnectionState; directStatus: RTCPeerConnectionState; activePath: ActivePath }) => void;
export type trackListener = (path: ActivePath, track: MediaStreamTrack) => void;
export type disconnectListener = () => void;

import { type RTCStates } from "../types/rtc";
export type reportListener = (path: ActivePath, stats: RTCStates) => void;
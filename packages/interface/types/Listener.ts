import type { RTCStates } from "./rtc";

export type Listener<T> = (data: T) => void;
export type Unsubscribe = () => void;

export const RELAY = 'relay';
export const DIRECT = 'direct';
export type ActivePath = typeof RELAY | typeof DIRECT;

export type messageListener = (path: ActivePath, msg: string) => void;
export type statusListener = (status: {
    // DESKTOP & WEB
    relayStatus: RTCPeerConnectionState;
    // WEB ONLY, DESKTOP will always be 'closed'
    directStatus: RTCPeerConnectionState;
    // WEB ONLY, DESKTOP will always be 'relay'
    activePath: ActivePath
}) => void;
export type trackListener = (track: MediaStreamTrack, path?: ActivePath) => void;
export type reportListener = (stats: RTCStates, path?: ActivePath) => void;

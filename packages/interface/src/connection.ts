import type { RTCStates } from "../types/rtc";
import type { Listener, Unsubscribe } from '../types/Listener';


export const RELAY = 'relay';
export const DIRECT = 'direct';
export type ActivePath = typeof RELAY | typeof DIRECT;

export interface AstraeaConnection {
    /**
     * set status change event callback
     * @param listener 
     * @returns 
     */
    onStatusChange: (listener: Listener<{
        relayStatus: RTCPeerConnectionState;
        directStatus: RTCPeerConnectionState;
        activePath: ActivePath
    }>) => Unsubscribe

    /**
     * get current active path
     * @returns current active path, either RELAY or DIRECT
     */
    getCurrentActivePath: () => ActivePath

    /**
     * set message receive event callback
     * @param listener 
     * @returns 
     */
    onMessage: (listener: Listener<{
        path: ActivePath,
        msg: string
    }>) => Unsubscribe

    /**
     * send a message to target peer
     * ### the type string `offer_ice` and `answer_ice` are reserved for internal use, 
     * ### messages containing these type strings will be filtered
     * @param type 
     * @param data 
     * @returns 
     */
    sendMessage: (type: string, data: Object) => void

    /**
     * set a preferred path, but cannot guarentee
     * @param path 
     * @returns 
     */
    setPreferredPath: (path: ActivePath) => void

    /**
     * report RTC connection states
     * @param listener 
     * @returns 
     */
    onReport: (listener: Listener<{ path: ActivePath, stats: RTCStates }>) => Unsubscribe

    /**
     * set new media track receive event callback
     * @param listener 
     * @returns 
     */
    onTrack: (listener: Listener<{ path: ActivePath, track: MediaStreamTrack }>) => Unsubscribe

    /**
     * set peer disconnect event callback
     * @param listener 
     * @returns 
     */
    onDisconnect: (listener: () => void) => Unsubscribe
}
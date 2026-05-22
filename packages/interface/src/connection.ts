import type * as L from '../types/Listener';


export interface AstraeaConnection {
    readonly peerIP: string;

    /**
     * set status change event callback
     * - WEB: the listener will receive an object containing FULL status: relayStatus, directStatus and activePath
     * - DESKTOP: the listener will an object, but only relayStatus is meaningful, directStatus will always be 'closed' and activePath will always be 'relay'
     * @param listener 
     * @returns 
     */
    onStatusChange: (listener: L.statusListener) => L.Unsubscribe

    /**
     * set message receive event callback
     * @param listener 
     * @returns 
     */
    onMessage: (listener: L.messageListener) => L.Unsubscribe

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
     * ## WEB ONLY
     * @param path 
     * @returns 
     */
    setPreferredPath: (path: L.ActivePath) => void

    /**
     * report RTC connection states
     * - WEB: the listener will receive an RTC stats object and the path it comes from (relay or direct)
     * - DESKTOP: the listener will only receive RTC stats
     * @param listener 
     * @returns 
     */
    onReport: (listener: L.reportListener) => L.Unsubscribe

    /**
     * set new media track receive event callback
     * - WEB: the listener will receive a media track and the path it comes from (relay or direct)
     * - DESKTOP: the listener will only receive a media track
     * @param listener 
     * @returns 
     */
    onTrack: (listener: L.trackListener) => L.Unsubscribe

    /**
     * set peer disconnect event callback
     * @param listener 
     * @returns 
     */
    onDisconnect: (listener: () => void) => L.Unsubscribe
}
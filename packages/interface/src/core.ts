import { AstraeaConnection } from './connection';
import { Listener, Unsubscribe } from '../types/Listener';
import type { Status as TsStatus } from '../types/tailscale-ipnstate'


export type Platform = 'web' | 'desktop';


/** Mirrors values from ipn/backend.go */
export type NodeState =
    | "NoState"
    | "InUseOtherUser"
    | "NeedsLogin"
    | "NeedsMachineAuth"
    | "Stopped"
    | "Starting"
    | "Running"

export interface AstraeaCore {
    readonly platform: Platform;

    /**
     * set self node state change event callback
     * @param listener 
     * @returns 
     */
    onNodeStateChange: (listener: Listener<NodeState>) => Unsubscribe

    /**
     * set callback for Tailscale status update
     * @param listener 
     * @returns 
     */
    onTsStatusUpdate: (listener: Listener<TsStatus>) => Unsubscribe


    /**
     * set callback for error events from core
     * @param listener 
     * @returns 
     */
    onError: (listener: Listener<string>) => Unsubscribe

    /**
     * set new connection create event callback
     * @param listener 
     * @returns 
     */
    onConnection: (listener: Listener<AstraeaConnection>) => Unsubscribe

    /**
     * force media data transmission will keep sending data through relay path, 
     * no matter the direct path is available or not. This is useful for testing relay performance and stability.
     * @param force 
     * @returns 
     */
    setForceRelayMedia: (force: boolean) => void;

    /**
     * send string message to peer via low level KCP channel
     * ### test only
     * @param peerIP 
     * @param content 
     * @returns 
     */
    sendByKcp: (peerIP: string, content: string) => void

    /**
     * Set the audio input track for the core
     * @param track 
     * @returns 
     */
    setInputAudioTrack: (track: MediaStreamAudioTrack | null) => void

    /**
     * Set the video input track for the core
     * @param track 
     * @returns 
     */
    setInputVideoTrack: (track: MediaStreamVideoTrack | null) => void
}


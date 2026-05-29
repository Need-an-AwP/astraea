/// <reference path="../../bindings/github.com/wailsapp/wails/v3/internal/eventdata.d.ts" />
// reference wails bindings event types

import * as I from "@astraea/interface";
import { configStore } from "./configStore";
import { Events } from "@wailsio/runtime";
import { StartTWN } from '../../bindings/astraea-desktop/twn/twnservice';
import { AstraeaConnection } from "../connection";


export class AstraeaCoreDesktop implements I.AstraeaCore {
    private static instance: AstraeaCoreDesktop | null = null;
    public readonly platform: I.Platform = 'desktop';

    // core parts
    private connections: Map<string, AstraeaConnection> = new Map();

    private errorListener: I.Listener<string> | null = null;
    private connectionListener: I.Listener<I.AstraeaConnection> | null = null;
    private nodeStateListener: I.Listener<I.NodeState> | null = null;
    private tsStatusListener: I.Listener<I.TsStatus> | null = null;



    private constructor(c: I.CoreConfig) {
        StartTWN({
            hostName: c.hostname,
            authKey: c.authKey,
            dir: "/tmp",
            isEphemeral: true,
        })

        Events.On("ts_notify", (e) => {
            const { Notify: n, Status: s } = e.data;

            // transform n.State (from wails bindings) to I.NodeState (from tygo generation) and pass to nodeStateListener
            if (n.State !== null && n.State !== undefined) {
                const stateStr = I.stateMapping[n.State] as I.NodeState;
                this.nodeStateListener?.(stateStr);
            }
            // console.log("[AstraeaCoreDesktop] ts_notify notify: ", n);

            // assert status (from wails bindings) as I.TsStatus (from tygo generation)
            s && this.tsStatusListener?.(s as I.TsStatus);
            console.log("[AstraeaCoreDesktop] ts_notify status: ", s);
        });

        Events.On("rtc_state", (e) => {
            const { peerIP, role, state } = e.data;
            this.connections.set(peerIP, new AstraeaConnection(peerIP, this));
        })
    }

    public static async init(config: I.CoreConfig, options?: I.AstraeaCoreOptions): Promise<I.AstraeaCore> {
        if (AstraeaCoreDesktop.instance) {
            console.warn("AstraeaCore has already been initialized. Returning existing instance.");
            return AstraeaCoreDesktop.instance;
        }

        const instance = new AstraeaCoreDesktop(config);

        if (options) {
            options.videoTargetBitrate && configStore.setState({ videoTargetBitrate: options.videoTargetBitrate });
            options.forceRelayMedia && configStore.setState({ forceRelayMedia: options.forceRelayMedia });
            options.rtcReportInterval && configStore.setState({ rtcReportInterval: options.rtcReportInterval });
        }
        AstraeaCoreDesktop.instance = instance;
        return instance;
    }

    public onNodeStateChange(listener: I.Listener<I.NodeState>): I.Unsubscribe {
        if (!this.nodeStateListener) {
            this.nodeStateListener = listener;
        }
        return () => { this.nodeStateListener = null; };
    }

    public onTsStatusUpdate(listener: I.Listener<I.TsStatus>): I.Unsubscribe {
        if (!this.tsStatusListener) {
            this.tsStatusListener = listener;
        }
        return () => { this.tsStatusListener = null; };
    }

    public onError(listener: I.Listener<string>): I.Unsubscribe {
        this.errorListener = listener;
        return () => { this.errorListener = null; };
    }


    public onConnection(listener: I.Listener<I.AstraeaConnection>): I.Unsubscribe {
        this.connectionListener = listener;
        return () => { this.connectionListener = null; };
    }

    public sendByKcp(peerIP: string, content: string): void {

    }

    public setInputAudioTrack(track: MediaStreamAudioTrack | null): void {

    }

    public setInputVideoTrack(track: MediaStreamVideoTrack | null): void {

    }

    // EMPTY IMPLEMENTATIONS, everything here should be web only methods
    public setForceRelayMedia(force: boolean): void { }
}
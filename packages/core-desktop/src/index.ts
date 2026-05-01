import * as I from "@astraea/interface";
import { configStore } from "./configStore";
export * from './window';

export class AstraeaCoreDesktop implements I.AstraeaCore {
    private static instance: AstraeaCoreDesktop | null = null;
    public readonly platform: I.Platform = 'desktop';
    private forceRelayMedia = false; // TEST FLAG: force relay keep transmitting media data

    public static async init(config: I.CoreConfig, options?: I.AstraeaCoreOptions): Promise<I.AstraeaCore> {
        if (AstraeaCoreDesktop.instance) {
            console.warn("AstraeaCore has already been initialized. Returning existing instance.");
            return AstraeaCoreDesktop.instance;
        }

        const instance = new AstraeaCoreDesktop();

        if (options) {
            instance.forceRelayMedia = options.forceRelayMedia ?? instance.forceRelayMedia;
            options.videoTargetBitrate && configStore.setState({ videoTargetBitrate: options.videoTargetBitrate });
            options.forceRelayMedia && configStore.setState({ forceRelayMedia: options.forceRelayMedia });
            options.rtcReportInterval && configStore.setState({ rtcReportInterval: options.rtcReportInterval });
        }
        AstraeaCoreDesktop.instance = instance;
        return instance;
    }

    private constructor() {

    }


    public onNodeStateChange(listener: I.Listener<I.NodeState>): I.Unsubscribe {
        return () => { };
    }

    public onTsStatusUpdate(listener: I.Listener<I.TsStatus>): I.Unsubscribe {
        return () => { };
    }

    public onError(listener: I.Listener<string>): I.Unsubscribe {
        return () => { };
    }


    public onConnection(listener: I.Listener<I.AstraeaConnection>): I.Unsubscribe {
        return () => { };
    }

    public setForceRelayMedia(force: boolean): void {

    }

    public sendByKcp(peerIP: string, content: string): void {

    }


    public setInputAudioTrack(track: MediaStreamAudioTrack | null): void {

    }

    public setInputVideoTrack(track: MediaStreamVideoTrack | null): void {

    }

}
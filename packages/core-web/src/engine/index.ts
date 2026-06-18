import * as I from "@astraea/interface";
import { configStore } from "./configStore";

export class AstraeaCoreWeb implements I.AstraeaCore {
    private static instance: AstraeaCoreWeb | null = null;
    public readonly platform: I.Platform = 'web';
    private forceRelayMedia = false; // TEST FLAG: force relay keep transmitting media data

    public static init(config: I.CoreConfig, options?: I.AstraeaCoreOptions): I.AstraeaCore {
        if (AstraeaCoreWeb.instance) {
            console.warn("AstraeaCore has already been initialized. Returning existing instance.");
            return AstraeaCoreWeb.instance;
        }

        const instance = new AstraeaCoreWeb();

        if (options) {
            instance.forceRelayMedia = options.forceRelayMedia ?? instance.forceRelayMedia;
            options.videoTargetBitrate && configStore.setState({ videoTargetBitrate: options.videoTargetBitrate });
            options.forceRelayMedia && configStore.setState({ forceRelayMedia: options.forceRelayMedia });
            options.rtcReportInterval && configStore.setState({ rtcReportInterval: options.rtcReportInterval });
        }
        AstraeaCoreWeb.instance = instance;
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
        console.warn("setInputVideoTrack is not supported in web environment");
    }

}

// type check for static method init
const _staticCheck: I.AstraeaCoreStatic = AstraeaCoreWeb;
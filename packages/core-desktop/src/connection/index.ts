import * as I from "@astraea/interface";


export class AstraeaConnection implements I.AstraeaConnection {
    public readonly peerIP: string;
    protected core: I.AstraeaCore;

    protected statusListener: I.statusListener | null = null;
    protected messageListener: I.messageListener | null = null;
    protected reportListener: I.reportListener | null = null;
    protected trackListener: I.trackListener | null = null;
    protected disconnectListener: (() => void) | null = null;
    protected localAudioTrack: MediaStreamTrack | null = null;
    protected localVideoTrack: MediaStreamTrack | null = null;

    constructor(peerIP: string, core: I.AstraeaCore) {
        this.peerIP = peerIP;
        this.core = core;
    }

    public onStatusChange(listener: I.statusListener): I.Unsubscribe {
        this.statusListener = listener;
        return () => { this.statusListener = null; }
    }

    public onMessage(listener: I.messageListener): I.Unsubscribe {
        this.messageListener = listener;
        return () => { this.messageListener = null; }
    }

    public sendMessage(type: string, data: Object): void {
        const jsonData = JSON.stringify({
            type: type,
            payload: data,
            timestamp: Date.now()
        })
    }

    public onReport(listener: I.reportListener): I.Unsubscribe {
        this.reportListener = listener;
        return () => { this.reportListener = null; }
    }

    public onTrack(listener: I.trackListener) {
        this.trackListener = listener;
        return () => { this.trackListener = null; }
    }

    public onDisconnect(listener: () => void): I.Unsubscribe {
        this.disconnectListener = listener;
        return () => { this.disconnectListener = null; }
    }

    public addLocalAudioTrack(track: MediaStreamTrack | null) {
        this.localAudioTrack = track;
        // this.directConn?.replaceAudioTrack(track);
    }

    public addLocalVideoTrack(track: MediaStreamTrack | null) {
        this.localVideoTrack = track;
        // this.directConn?.replaceVideoTrack(track);
    }

    // EMPTY IMPLEMENTATIONS, everything here should be web only methods
    public setPreferredPath(path: I.ActivePath): void { }

}
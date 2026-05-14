import * as I from "@astraea/interface";


export class AstraeaConnection {
    public readonly peerIP: string;
    protected core: I.AstraeaCore;

    protected localAudioTrack: MediaStreamTrack | null = null;
    protected localVideoTrack: MediaStreamTrack | null = null;

    constructor(peerIP: string, core: I.AstraeaCore) {
        this.peerIP = peerIP;
        this.core = core;
    }


    public sendMessage(type: string, data: Object): void {

    }

    /**
     * only for direct connection
     * @internal
     * @param track 
     */
    public addLocalAudioTrack(track: MediaStreamTrack | null) {
        this.localAudioTrack = track;
        // this.directConn?.replaceAudioTrack(track);
    }

    /**
     * only for direct connection
     * @internal
     * @param track 
     */
    public addLocalVideoTrack(track: MediaStreamTrack | null) {
        this.localVideoTrack = track;
        // this.directConn?.replaceVideoTrack(track);
    }

}
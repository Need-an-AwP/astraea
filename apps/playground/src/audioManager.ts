export class AudioManager {
    private static instance: AudioManager;
    private ctx: AudioContext | null = null;
    private loopbackNode: MediaStreamAudioSourceNode | null = null;

    private constructor() {}

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    public async getContext(): Promise<AudioContext> {
        if (!this.ctx || this.ctx.state === 'closed') {
            this.ctx = new AudioContext();
            console.log("Global AudioContext created, state:", this.ctx.state);
        }
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
            console.log("Global AudioContext resumed, state:", this.ctx.state);
        }
        return this.ctx;
    }

    public async enableLoopback(track: MediaStreamTrack) {
        const ctx = await this.getContext();
        if (this.loopbackNode) {
            this.loopbackNode.disconnect();
        }
        const stream = new MediaStream([track]);
        this.loopbackNode = ctx.createMediaStreamSource(stream);
        this.loopbackNode.connect(ctx.destination);
    }

    public disableLoopback() {
        if (this.loopbackNode) {
            this.loopbackNode.disconnect();
            this.loopbackNode = null;
        }
    }

    public isLoopbackEnabled() {
        return this.loopbackNode !== null;
    }
}

export const globalAudioManager = AudioManager.getInstance();

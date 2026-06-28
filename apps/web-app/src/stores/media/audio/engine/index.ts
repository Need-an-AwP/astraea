export class AudioEngine {
    private static _instance: AudioEngine | null = null;
    public static get instance() {
        if (!this._instance) this._instance = new AudioEngine();
        return this._instance;
    }

    private constructor() { }

    private ctx: AudioContext | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private micGainNode: GainNode | null = null;
    private micMuteNode: GainNode | null = null;
    private micNoiseReductionNode: GainNode | null = null;
    private micAnalyserNode: AnalyserNode | null = null;
    private micDestinationNode: MediaStreamAudioDestinationNode | null = null;
    private cpaSourceNode: any | null = null;
    private cpaGainNode: GainNode | null = null;
    private cpaMuteNode: GainNode | null = null;
    private cpaAnalyserNode: AnalyserNode | null = null;
    private cpaDestinationNode: MediaStreamAudioDestinationNode | null = null;
    private mergerNode: GainNode | null = null;
    private destinationAnalyserNode: AnalyserNode | null = null;
    private destination: MediaStreamAudioDestinationNode | null = null;
    private playbackElement: HTMLAudioElement | null = null;

    public init() {
        if (this.ctx) return;
        // create nodes
        const ctx = new AudioContext();
        this.ctx = ctx

        // empty source
        const emptyAudioSource = ctx.createMediaStreamDestination();
        const emptyStream = new MediaStream([emptyAudioSource.stream.getAudioTracks()[0]]);

        // mic input
        this.sourceNode = ctx.createMediaStreamSource(emptyStream);
        this.micGainNode = ctx.createGain();
        this.micMuteNode = ctx.createGain();
        this.micNoiseReductionNode = ctx.createGain();
        this.micAnalyserNode = ctx.createAnalyser();
        this.micDestinationNode = ctx.createMediaStreamDestination();
        this.sourceNode.connect(this.micGainNode);
        this.micGainNode.connect(this.micMuteNode);
        this.micMuteNode.connect(this.micNoiseReductionNode);
        this.micNoiseReductionNode.connect(this.micAnalyserNode);
        this.micAnalyserNode.connect(this.micDestinationNode);

        // cpa input
        this.cpaSourceNode = ctx.createMediaStreamSource(emptyStream);
        this.cpaGainNode = ctx.createGain();
        this.cpaMuteNode = ctx.createGain();
        this.cpaAnalyserNode = ctx.createAnalyser();
        this.cpaDestinationNode = ctx.createMediaStreamDestination();
        this.cpaSourceNode.connect(this.cpaGainNode);
        this.cpaGainNode.connect(this.cpaMuteNode);
        this.cpaMuteNode.connect(this.cpaAnalyserNode);
        this.cpaAnalyserNode.connect(this.cpaDestinationNode);
        // test only
        const oscillator = ctx.createOscillator();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(3000, ctx.currentTime); // value in hertz
        oscillator.start();
        oscillator.connect(this.cpaGainNode);

        // merge
        this.mergerNode = ctx.createGain();
        this.destinationAnalyserNode = ctx.createAnalyser();
        this.destination = ctx.createMediaStreamDestination();
        this.micAnalyserNode.connect(this.mergerNode);
        this.cpaAnalyserNode.connect(this.mergerNode);
        this.mergerNode.connect(this.destinationAnalyserNode);
        this.destinationAnalyserNode.connect(this.destination);

        this.playbackElement = new Audio();
        this.playbackElement.srcObject = this.destination.stream;
        this.playbackElement.muted = true;
        this.playbackElement.autoplay = true;
    }

    public async setOutputDevice(deviceId: string) {
        if (!deviceId) return;
        if (!this.playbackElement) {
            console.error('Playback element is not initialized');
            return;
        }

        const stream = this.getLocalStream();
        if (stream && this.playbackElement.srcObject !== stream) {
            this.playbackElement.srcObject = stream;
        }

        if (!this.playbackElement.setSinkId) return;
        await this.playbackElement.setSinkId(deviceId);
    }

    public getContext() {
        if (!this.ctx) throw new Error('Main AudioContext is not initialized');
        return this.ctx;
    }

    public getLocalStream() {
        if (!this.ctx) console.error('Main AudioContext is not initialized');
        if (!this.destination) console.error('Destination node is not initialized');

        return this.destination?.stream ?? null;
    }

    public getMicStream() {
        if (!this.ctx) console.error('Main AudioContext is not initialized');
        if (!this.cpaDestinationNode) console.error('MIC Destination node is not initialized');

        return this.micDestinationNode?.stream ?? null;
    }

    public getCpaStream() {
        if (!this.ctx) console.error('Main AudioContext is not initialized');
        if (!this.cpaDestinationNode) console.error('CPA Destination node is not initialized');

        return this.cpaDestinationNode?.stream ?? null;
    }
}


export const initAudioEngine = () => {
    AudioEngine.instance.init();
}
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
        this.micAnalyserNode.fftSize = 256;
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
        this.cpaAnalyserNode.fftSize = 256;
        this.cpaDestinationNode = ctx.createMediaStreamDestination();
        this.cpaSourceNode.connect(this.cpaGainNode);
        this.cpaGainNode.connect(this.cpaMuteNode);
        this.cpaMuteNode.connect(this.cpaAnalyserNode);
        this.cpaAnalyserNode.connect(this.cpaDestinationNode);

        

        // merge
        this.mergerNode = ctx.createGain();
        this.destinationAnalyserNode = ctx.createAnalyser();
        this.destinationAnalyserNode.fftSize = 256;
        this.destination = ctx.createMediaStreamDestination();
        this.micAnalyserNode.connect(this.mergerNode);
        this.cpaAnalyserNode.connect(this.mergerNode);
        this.mergerNode.connect(this.destinationAnalyserNode);
        this.destinationAnalyserNode.connect(this.destination);

        this.playbackElement = new Audio();
        this.playbackElement.srcObject = this.destination.stream;
        this.playbackElement.muted = false;
        this.playbackElement.autoplay = false;
    }

    public startPlayback() {
        if (!this.playbackElement) {
            console.error('Playback element is not initialized');
            return;
        }
        this.playbackElement.play();
    }

    public stopPlayback() {
        if (!this.playbackElement) {
            console.error('Playback element is not initialized');
            return;
        }
        this.playbackElement.pause();
    }

    public async setInputDevice(deviceId: string) {
        if (!deviceId) {
            console.error('empty device ID is not allowed');
            return;
        }
        if (!this.ctx || !this.sourceNode || !this.micGainNode) {
            console.error('Main AudioContext or nodes are not initialized');
            return;
        }

        try {
            const newlocalStream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: deviceId },
                video: false
            })

            this.sourceNode.disconnect();
            // TODO: stop previous input stream

            this.sourceNode = this.ctx.createMediaStreamSource(newlocalStream);
            this.sourceNode.connect(this.micGainNode);
        } catch (error) {
            console.error('Error setting input device:', error);
            return;
        }
    }

    public async setOutputDevice(deviceId: string) {
        if (!deviceId) {
            console.error('empty device ID is not allowed');
            return;
        }
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

    public getDestinationByteFrequencyData() {
        if (!this.ctx || !this.destinationAnalyserNode) return null;

        const dataArray = new Uint8Array(this.destinationAnalyserNode.frequencyBinCount);
        this.destinationAnalyserNode.getByteFrequencyData(dataArray);

        return dataArray;
    }

}


export const initAudioEngine = () => {
    AudioEngine.instance.init();
}
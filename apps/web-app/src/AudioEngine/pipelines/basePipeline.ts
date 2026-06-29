export abstract class PipelineBase {
    protected ctx: AudioContext;
    protected gainNode: GainNode;
    protected muteNode: GainNode;
    protected analyserNode: AnalyserNode;
    protected destinationNode: MediaStreamAudioDestinationNode;

    constructor(ctx: AudioContext) {
        this.ctx = ctx;
        this.gainNode = ctx.createGain();
        this.muteNode = ctx.createGain();
        this.analyserNode = ctx.createAnalyser();
        this.analyserNode.fftSize = 256;
        this.destinationNode = ctx.createMediaStreamDestination();
    }

    protected connectOutputChain() {
        this.gainNode.connect(this.muteNode);
        this.muteNode.connect(this.analyserNode);
        this.analyserNode.connect(this.destinationNode);
    }

    public getStream() {
        return this.destinationNode.stream;
    }

    public getByteFrequencyData() {
        const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(dataArray);
        return dataArray;
    }

    public setMute(isMuted: boolean) {
        this.muteNode.gain.value = isMuted ? 0 : 1;
    }

    public setVolume(volume: number) {
        this.gainNode.gain.value = volume;
    }

    public getOutputNode() {
        return this.analyserNode;
    }
}
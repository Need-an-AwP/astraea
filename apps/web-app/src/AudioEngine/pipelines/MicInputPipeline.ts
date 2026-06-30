import { PipelineBase } from "./basePipeline";

export class MicInputPipeline extends PipelineBase {
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private noiseReductionNode: GainNode;
    
    constructor(ctx: AudioContext) {
        super(ctx);
        // empty source
        const emptyAudioSource = ctx.createMediaStreamDestination();
        const emptyStream = new MediaStream([emptyAudioSource.stream.getAudioTracks()[0]]);

        this.sourceNode = ctx.createMediaStreamSource(emptyStream);
        this.noiseReductionNode = ctx.createGain();

        // not using `connectOutputChain()` cause extra nodes
        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(this.muteNode);
        this.muteNode.connect(this.noiseReductionNode);
        this.noiseReductionNode.connect(this.analyserNode);
        this.analyserNode.connect(this.destinationNode);
    }

    public setInputStream(stream: MediaStream) {
        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }
        this.sourceNode = this.ctx.createMediaStreamSource(stream);
        this.sourceNode.connect(this.gainNode);
    }
}
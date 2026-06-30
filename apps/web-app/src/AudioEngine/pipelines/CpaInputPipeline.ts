import { PipelineBase } from "./basePipeline";

export class CpaInputPipeline extends PipelineBase {
    private sourceNode: MediaStreamAudioSourceNode | null = null;

    constructor(ctx: AudioContext) {
        super(ctx);
        // empty source
        const emptyAudioSource = ctx.createMediaStreamDestination();
        const emptyStream = new MediaStream([emptyAudioSource.stream.getAudioTracks()[0]]);

        this.sourceNode = ctx.createMediaStreamSource(emptyStream);

        this.sourceNode.connect(this.gainNode);
        this.connectOutputChain();

        // test oscillator
        const oscillator = ctx.createOscillator();
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
        oscillator.start();
        const lfo = ctx.createOscillator();
        lfo.type = "triangle";
        lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
        lfo.start();
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(800, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        // oscillator.connect(this.gainNode);
    }
}
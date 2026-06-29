import { PipelineBase } from "./basePipeline";

export class OutputPipeline extends PipelineBase {
    private mixBus: GainNode;

    constructor(ctx: AudioContext, [...upstreamNodes]: AudioNode[]) {
        super(ctx);
        this.mixBus = ctx.createGain();

        upstreamNodes.forEach(node => node.connect(this.mixBus));
        this.mixBus.connect(this.gainNode);
        this.connectOutputChain();
    }
}
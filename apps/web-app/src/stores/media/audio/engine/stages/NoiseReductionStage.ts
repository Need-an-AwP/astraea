import type { Stage } from '../types';

type NoiseReductionStageParams = {
    enabled?: boolean;
    // Placeholder for denoise strength before real processor is integrated.
    gain?: number;
};

export class NoiseReductionStage implements Stage {
    constructor(id = 'noise-reduction-stage') {
        this.id = id;
    }

    id: string;
    enabled = true;

    private processorNode: GainNode | null = null;

    init(ctx: AudioContext): void {
        if (!this.processorNode) {
            this.processorNode = ctx.createGain();
            this.processorNode.gain.value = 1;
        }
    }

    process(input: AudioNode): AudioNode {
        if (!this.enabled) {
            return input;
        }
        if (!this.processorNode) {
            throw new Error('Noise reduction processor node is not initialized');
        }
        input.connect(this.processorNode);
        return this.processorNode;
    }

    update(params: Record<string, unknown>): void {
        const { enabled, gain } = params as NoiseReductionStageParams;

        if (typeof enabled === 'boolean') {
            this.enabled = enabled;
        }

        if (typeof gain === 'number' && this.processorNode) {
            this.processorNode.gain.value = gain;
        }
    }

    dispose(): void {
        this.processorNode?.disconnect();
        this.processorNode = null;
    }
}

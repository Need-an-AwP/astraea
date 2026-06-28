import type { Stage } from '../types';

export class GainWithMuteStage implements Stage {
    constructor(id: string) {
        this.id = id;
    }
    id: string;
    enabled = true

    private gainNode: GainNode | null = null;
    private muteNode: GainNode | null = null;

    init(ctx: AudioContext): void {
        if (!this.gainNode) this.gainNode = ctx.createGain();
        if (!this.muteNode) this.muteNode = ctx.createGain();
        this.muteNode.connect(this.gainNode);
    }

    process(input: AudioNode): AudioNode {
        if (!this.gainNode || !this.muteNode) throw new Error('Gain and mute nodes are not initialized');
        input.connect(this.muteNode);
        return this.gainNode;
    }

    update(params: Record<string, unknown>): void {
        if (!this.gainNode || !this.muteNode) throw new Error('Gain and mute nodes are not initialized');
        // TODO
    }

    dispose(): void {
        this.gainNode?.disconnect();
        this.gainNode = null;

        this.muteNode?.disconnect();
        this.muteNode = null;
    }
}
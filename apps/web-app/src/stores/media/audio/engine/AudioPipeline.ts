import type { Stage } from './types';

export class AudioPipeline {
    private input: AudioNode | null = null;
    private output: AudioNode | null = null;
    constructor(private stages: Stage[]) { }
    
    build(ctx: AudioContext, source: AudioNode): AudioNode {
        let current = source;
        for (const s of this.stages) {
            s.init(ctx);
            if (s.enabled) current = s.process(current);
        }
        this.input = source;
        this.output = current;
        return current;
    }
    updateStage(id: string, params: Record<string, unknown>) {
        this.stages.find(s => s.id === id)?.update(params);
    }
    setStageEnabled(id: string, enabled: boolean) {
        const target = this.stages.find(s => s.id === id);
        if (target) target.enabled = enabled;
    }
    dispose() {
        this.stages.forEach(s => s.dispose());
    }
}
export interface Stage {
    id: string;
    enabled: boolean;

    /**
     * initialize the stage, create necessary nodes and connect them
     * @param ctx 
     */
    init(ctx: AudioContext): void;

    /**
     * input node will be connected to the stage, and the stage will return its last node
     * @param input 
     */
    process(input: AudioNode): AudioNode;

    update(params: Record<string, unknown>): void;

    /**
     * clean up method
     */
    dispose(): void;
}
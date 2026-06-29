import {
    MicInputPipeline,
    CpaInputPipeline,
    OutputPipeline
} from "./pipelines";
import { AudioPlayback } from "./AudioPlayback";

export class AudioEngine {
    private static _instance: AudioEngine | null = null;
    public static get instance() {
        if (!this._instance) this._instance = new AudioEngine();
        return this._instance;
    }

    private ctx: AudioContext;
    private micInputPipeline: MicInputPipeline;
    private cpaInputPipeline: CpaInputPipeline;
    private outputPipeline: OutputPipeline;
    private audioPlayback: AudioPlayback;

    constructor() {
        this.ctx = new AudioContext();
        this.micInputPipeline = new MicInputPipeline(this.ctx);
        this.cpaInputPipeline = new CpaInputPipeline(this.ctx);
        this.outputPipeline = new OutputPipeline(this.ctx, [
            this.micInputPipeline.getOutputNode(),
            this.cpaInputPipeline.getOutputNode(),
        ]);
        this.audioPlayback = new AudioPlayback(this.outputPipeline.getStream());
    }

    public init() {

    }

    public startPlayback(){
        this.audioPlayback.play();
    }

    public stopPlayback(){
        this.audioPlayback.pause();
    }

    public getDestinationByteFrequencyData(){
        return this.outputPipeline.getByteFrequencyData();
    }

    public setInputDevice(deviceId: string){
        
    }

    public setOutputDevice(deviceId: string){
        this.audioPlayback.setOutputDevice(deviceId);
    }
}


export const initAudioEngine = () => {
    AudioEngine.instance.init();
}
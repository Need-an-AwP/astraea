import {
    MicInputPipeline,
    CpaInputPipeline,
    OutputPipeline
} from "./pipelines";
import { AudioPlayback } from "./AudioPlayback";
import { AudioDevices } from "./AudioDevices";

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
    private audioDevices: AudioDevices | null = null;

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

    public async init() {
        this.audioDevices = await AudioDevices.init();
        this.audioDevices.setOnInputChanged((stream) => {
            stream && this.micInputPipeline.setInputStream(stream);
        });
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

    public async setInputDevice(deviceId: string){
        await this.audioDevices?.setSelectedInput(deviceId);
    }

    public async setOutputDevice(deviceId: string){
        await this.audioPlayback.setOutputDevice(deviceId);
        await this.audioDevices?.setSelectedOutput(deviceId);
    }
}


export const initAudioEngine = () => {
    AudioEngine.instance.init();
}
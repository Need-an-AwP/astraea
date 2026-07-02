import {
    MicInputPipeline,
    CpaInputPipeline,
    OutputPipeline
} from "./pipelines";
import { AudioPlayback } from "./AudioPlayback";
import { AudioDevices } from "./AudioDevices";

type workerSub = (worker: Worker) => void;
type workerUnsub = (worker: Worker) => void;

export class AudioEngine {
    private static _instance: AudioEngine | null = null;
    private static get instance() {
        if (!this._instance) this._instance = new AudioEngine();
        return this._instance;
    }

    private ctx: AudioContext;
    private micInputPipeline: MicInputPipeline;
    private cpaInputPipeline: CpaInputPipeline;
    private outputPipeline: OutputPipeline;
    private audioPlayback: AudioPlayback;
    private audioDevices: AudioDevices | null = null;
    public readonly audioData: {
        subscribeOutputData: workerSub;
        unsubscribeOutputData: workerUnsub;
        subscribeMicInputData: workerSub;
        unsubscribeMicInputData: workerUnsub;
        subscribeCpaInputData: workerSub;
        unsubscribeCpaInputData: workerUnsub;
    };
    public readonly devices: {
        setInputDevice: (deviceId: string) => Promise<void>;
        setOutputDevice: (deviceId: string) => Promise<void>;
    };
    public readonly playback: {
        start: () => void;
        stop: () => void;
    };

    private constructor() {
        this.ctx = new AudioContext();
        this.micInputPipeline = new MicInputPipeline(this.ctx);
        this.cpaInputPipeline = new CpaInputPipeline(this.ctx);
        this.outputPipeline = new OutputPipeline(this.ctx, [
            this.micInputPipeline.getOutputNode(),
            this.cpaInputPipeline.getOutputNode(),
        ]);
        this.audioPlayback = new AudioPlayback(this.outputPipeline.getStream());

        this.devices = {
            setInputDevice: this.setInputDevice,
            setOutputDevice: this.setOutputDevice,
        }
        this.playback = {
            start: () => this.audioPlayback.play(),
            stop: () => this.audioPlayback.pause(),
        }
        this.audioData = {
            subscribeOutputData: (worker) => this.outputPipeline.subscribeData(worker),
            unsubscribeOutputData: (worker) => this.outputPipeline.unsubscribeData(worker),
            subscribeMicInputData: (worker) => this.micInputPipeline.subscribeData(worker),
            unsubscribeMicInputData: (worker) => this.micInputPipeline.unsubscribeData(worker),
            subscribeCpaInputData: (worker) => this.cpaInputPipeline.subscribeData(worker),
            unsubscribeCpaInputData: (worker) => this.cpaInputPipeline.unsubscribeData(worker),
        };
    }

    static init() { return this.instance.init(); }

    public async init() {
        this.audioDevices = await AudioDevices.init();
        this.audioDevices.setOnInputChanged((stream) => {
            stream && this.micInputPipeline.setInputStream(stream);
        });
    }

    private async setInputDevice(deviceId: string) {
        await this.audioDevices?.setSelectedInput(deviceId);
    }

    private async setOutputDevice(deviceId: string) {
        await this.audioPlayback.setOutputDevice(deviceId);
        await this.audioDevices?.setSelectedOutput(deviceId);
    }

    static get audioData() { return this.instance.audioData; }
    static get devices() { return this.instance.devices; }
    static get playback() { return this.instance.playback; }
}


export const initAudioEngine = () => {
    AudioEngine.init();
}
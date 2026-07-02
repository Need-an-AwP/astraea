import { frame, cancelFrame } from 'framer-motion';
import { AUDIO_FREQUENCY_DATA_EVENT, type AudioDataEvent } from './workerEvents';

// prevent passing a whole analyser node to the constructor
const analyserPropsKeys = [
    'getByteFrequencyData',
    'frequencyBinCount'
] as const;
type keys = (typeof analyserPropsKeys)[number]
export type DataSource = Pick<AnalyserNode, keys> & {
    [K in Exclude<keyof AnalyserNode, keys>]?: undefined;
};

export class AudioDataPusher {
    private source: DataSource;
    private buffer: Uint8Array<ArrayBuffer>;
    private subscribers: Set<Worker> = new Set();

    constructor(source: DataSource) {
        this.source = source;
        this.buffer = new Uint8Array(this.source.frequencyBinCount);

        frame.update(this.pushData, true);
    }

    public get frequencyBinCount() {
        return this.source.frequencyBinCount;
    }

    public subscribe(worker: Worker) {
        // console.log("new data subscriber")
        this.subscribers.add(worker);
    }

    public unsubscribe(worker: Worker) {
        // console.log("removing data subscriber")
        this.subscribers.delete(worker);
    }

    private pushData = () => {
        // console.log("pushing data to ", this.subscribers.size, " subscribers")
        if (this.subscribers.size === 0) return;

        this.source.getByteFrequencyData(this.buffer);
        this.subscribers.forEach(worker => {
            const payload = new Uint8Array(this.buffer);
            const message: AudioDataEvent = {
                type: AUDIO_FREQUENCY_DATA_EVENT,
                payload
            };
            // keep using postMessage cause we dont need worker return value
            // transfer buffer to worker to avoid copying data
            worker.postMessage(message, [payload.buffer]);
        });
    };

    public dispose() {
        this.subscribers.clear();
        cancelFrame(this.pushData);
    }
}

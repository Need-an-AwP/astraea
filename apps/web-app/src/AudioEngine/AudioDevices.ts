import { useAudioDeviceStore, usePreferenceStore, type AudioDevice } from "@/stores"

export class AudioDevices {
    private static _instance: AudioDevices | null = null;

    private inputDevices: AudioDevice[] = [];
    private outputDevices: AudioDevice[] = [];
    private selectedInput: string = '';
    private selectedOutput: string = '';
    private onInputChanged: ((stream: MediaStream | null) => void) | null = null;
    private inputStream: MediaStream | null = null;
    private isDeviceChangeListening: boolean = false;

    private constructor() { }

    /**
     * provide a callback when input stream changed
     * @param callback 
     */
    public setOnInputChanged(callback: (stream: MediaStream | null) => void) {
        this.onInputChanged = callback;
    }

    public static async init(): Promise<AudioDevices> {
        if (!AudioDevices._instance) {
            AudioDevices._instance = new AudioDevices();
        }
        const instance = AudioDevices._instance;

        try {
            const { inputList, outputList } = await instance.enumerateDevices();
            const { inputDeviceId, outputDeviceId } = instance.resolveSelectedDevices();

            useAudioDeviceStore.setState({
                inputDevices: inputList,
                outputDevices: outputList,
                selectedInput: inputDeviceId,
                selectedOutput: outputDeviceId,
            });

            console.log('inputDevices', inputList,
                '\noutputDevices', outputList,
                '\nresolvedInputId', inputDeviceId,
                '\nresolvedOutputId', outputDeviceId);

            instance.ensureDeviceChangeListener();
        } catch (error) {
            console.error("Error initializing audio devices:", error);
        }

        return instance;
    }

    public async enumerateDevices(): Promise<{ inputList: AudioDevice[], outputList: AudioDevice[] }> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            const inputList: AudioDevice[] = [];
            const outputList: AudioDevice[] = [];
            devices.forEach(device => {
                if (device.kind === 'audioinput') {
                    inputList.push({ label: device.label, deviceId: device.deviceId, groupId: device.groupId });
                } else if (device.kind === 'audiooutput') {
                    outputList.push({ label: device.label, deviceId: device.deviceId, groupId: device.groupId });
                }
            });

            this.inputDevices = inputList;
            this.outputDevices = outputList;

            return { inputList, outputList };

        } catch (error) {
            console.error('Error enumerating devices:', error);
            this.inputDevices = [];
            this.outputDevices = [];

            return { inputList: [], outputList: [] };
        }
    }

    private resolveSelectedDevices(): { inputDeviceId: string, outputDeviceId: string } {
        const prefState = usePreferenceStore.getState();
        const storeInputDeviceId = prefState.audioInputDeviceId;
        const storeOutputDeviceId = prefState.audioOutputDeviceId;

        return {
            inputDeviceId: this.resolveDeviceId(this.inputDevices, storeInputDeviceId),
            outputDeviceId: this.resolveDeviceId(this.outputDevices, storeOutputDeviceId),
        };
    }

    private resolveDeviceId(list: AudioDevice[], storeId: string): string {
        return (storeId && list.find(i => i.deviceId === storeId)?.deviceId)
            || list.find(i => i.deviceId === 'default')?.deviceId
            || list[0]?.deviceId
            || '';
    }

    private ensureDeviceChangeListener() {
        if (this.isDeviceChangeListening) return;
        navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange);
        this.isDeviceChangeListening = true;
    }

    private async handleDeviceChange() {
        // only update list now
        const { inputList, outputList } = await this.enumerateDevices();
        useAudioDeviceStore.setState({
            inputDevices: inputList,
            outputDevices: outputList,
        });
    }

    public async setSelectedInput(deviceId: string) {
        if (!deviceId) return;
        const audioConstraints: MediaTrackConstraints = {
            deviceId: deviceId,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        }

        try {
            // create a new stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints }); // need request permission to access media devices on web

            // stop previous stream only after new stream is ready
            if (this.inputStream) {
                this.inputStream.getTracks().forEach(track => track.stop());
            }
            this.inputStream = stream;
            this.selectedInput = deviceId;
            this.onInputChanged?.(this.inputStream);

            // update store and preference only after switching succeeds
            useAudioDeviceStore.setState({ selectedInput: deviceId });
            const prefState = usePreferenceStore.getState();
            if (prefState.audioInputDeviceId !== deviceId) {
                prefState.setAudioInputDeviceId(deviceId);
            }
        } catch (error) {
            console.error('Error accessing audio input device:', error);
        }
    }

    public async setSelectedOutput(deviceId: string) {
        if (!deviceId) return;
        const audios = Array.from(document.querySelectorAll('audio'));

        try {
            // consider switch successful only when all setSinkId-capable elements succeed
            await Promise.all(
                audios.map(async (audio) => {
                    if (!audio.setSinkId) return;
                    await audio.setSinkId(deviceId);
                })
            );

            this.selectedOutput = deviceId;

            // update store and preference only after switching succeeds
            useAudioDeviceStore.setState({ selectedOutput: deviceId });
            const prefState = usePreferenceStore.getState();
            if (prefState.audioOutputDeviceId !== deviceId) {
                prefState.setAudioOutputDeviceId(deviceId);
            }
        } catch (error) {
            console.error('Error setting output audio device:', error);
        }
    }


}
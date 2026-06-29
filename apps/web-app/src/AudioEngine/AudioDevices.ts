import { useAudioDeviceStore, usePreferenceStore, type AudioDevice } from "@/stores"

export class AudioDevices {
    private inputDevices: AudioDevice[] = [];
    private outputDevices: AudioDevice[] = [];
    private selectedInput: string = '';
    private selectedOutput: string = '';
    private onInputChanged: ((stream: MediaStream | null) => void) | null = null;
    private inputStream: MediaStream | null = null;

    /**
     * provide a callback when input stream changed
     * @param callback 
     */
    public setOnInputChanged(callback: (stream: MediaStream | null) => void) {
        this.onInputChanged = callback;
    }

    public async init() {
        const prefState = usePreferenceStore.getState();
        const storeInputDeviceId = prefState.audioInputDeviceId;
        const storeOutputDeviceId = prefState.audioOutputDeviceId;

        try {
            await this.enumerateDevices();
            this.selectedInput = this.resolveDeviceId(this.inputDevices, storeInputDeviceId);
            this.selectedOutput = this.resolveDeviceId(this.outputDevices, storeOutputDeviceId);
            console.log('inputDevices', this.inputDevices, '\noutputDevices', this.outputDevices, '\nresolvedInputId', this.selectedInput, '\nresolvedOutputId', this.selectedOutput);
        } catch (error) {
            console.error("Error initializing audio devices:", error);
        }


        // need request permission to access media devices on web
        // navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        //     .then(stream => {

        //         stream.getTracks().forEach(track => track.stop());
        //     }).catch(error => {
        //         console.error("Error accessing media devices:", error);
        //     })
    }

    public async enumerateDevices() {
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
        } catch (error) {
            console.error('Error enumerating devices:', error);
            this.inputDevices = [];
            this.outputDevices = [];
        }
    }

    private resolveDeviceId(list: AudioDevice[], storeId: string) {
        return (storeId && list.find(i => i.deviceId === storeId)?.deviceId)
            || list.find(i => i.deviceId === 'default')?.deviceId
            || list[0]?.deviceId;
    }

    public setSelectedInput(deviceId: string) {
        if (!deviceId) return;
        this.selectedInput = deviceId;
        // update store

        // stop previous stream
        // create a new stream
    }

    public setSelectedOutput(deviceId: string) {
        if (!deviceId) return;

        this.selectedOutput = deviceId;
        // update store

        // update element sink id
        document.querySelectorAll('audio').forEach(audio => {
            if (audio.setSinkId) {
                audio.setSinkId(deviceId)
                    .catch(error => {
                        console.error('Error setting sink id for audio element:', error);
                    });
            }
        });
    }

}
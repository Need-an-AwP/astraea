import { create } from 'zustand'
import { usePreferenceStore } from '@/stores'
import { AudioEngine } from './AudioEngine'

export type AudioDevice = {
    label: string;
    deviceId: string;
    groupId: string;
}

interface AudioDeviceState {
    inputDevices: AudioDevice[]
    outputDevices: AudioDevice[]
    selectedInput: string
    selectedOutput: string

    setInputDevices: (devices: AudioDevice[]) => void
    setOutputDevices: (devices: AudioDevice[]) => void
    setSelectedInput: (deviceId: string) => void
    setSelectedOutput: (deviceId: string) => void
}

const applySelectedInputDevice = (deviceId: string) => {
    AudioEngine.instance.setInputDevice(deviceId)
        .then(() => {
            console.log('Input device set to:', deviceId);
        })
        .catch(error => {
            console.error('Error switching audio input device:', error);
        });
};

const applySelectedOutputDevice = (deviceId: string) => {
    AudioEngine.instance.setOutputDevice(deviceId)
        .then(() => {
            console.log('Output device set to:', deviceId);
        })
        .catch(error => {
            console.error('Error switching audio output device:', error);
        });

    document.querySelectorAll('audio').forEach(audio => {
        if (audio.setSinkId) {
            audio.setSinkId(deviceId)
                .catch(error => {
                    console.error('Error setting sink id for audio element:', error);
                });
        }
    });
};

let preferenceSubscribed = false;

const ensurePreferenceSubscription = () => {
    if (preferenceSubscribed) return;
    preferenceSubscribed = true;

    const prefState = usePreferenceStore.getState();
    useAudioDeviceStore.setState({
        selectedInput: prefState.audioInputDeviceId,
        selectedOutput: prefState.audioOutputDeviceId,
    });

    usePreferenceStore.subscribe((state, prevState) => {
        if (state.audioInputDeviceId !== prevState.audioInputDeviceId) {
            useAudioDeviceStore.setState({ selectedInput: state.audioInputDeviceId });
            applySelectedInputDevice(state.audioInputDeviceId);
        }

        if (state.audioOutputDeviceId !== prevState.audioOutputDeviceId) {
            useAudioDeviceStore.setState({ selectedOutput: state.audioOutputDeviceId });
            applySelectedOutputDevice(state.audioOutputDeviceId);
        }
    });
};

export const useAudioDeviceStore = create<AudioDeviceState>((set) => ({
    inputDevices: [],
    outputDevices: [],
    selectedInput: '',
    selectedOutput: '',

    setInputDevices: (devices: AudioDevice[]) => set({ inputDevices: devices }),
    setOutputDevices: (devices: AudioDevice[]) => set({ outputDevices: devices }),
    setSelectedInput: (deviceId: string) => {
        const prefState = usePreferenceStore.getState();
        if (prefState.audioInputDeviceId === deviceId) return;
        prefState.setAudioInputDeviceId(deviceId);
        console.log('input device changed:', deviceId);
    },
    setSelectedOutput: (deviceId: string) => {
        const prefState = usePreferenceStore.getState();
        if (prefState.audioOutputDeviceId === deviceId) return;
        prefState.setAudioOutputDeviceId(deviceId);
        console.log("output device changed:", deviceId);
    },
}));

export const initialAudioDevices = () => {
    ensurePreferenceSubscription();

    const store = useAudioDeviceStore.getState();
    const prefState = usePreferenceStore.getState();
    const storeInputDeviceId = prefState.audioInputDeviceId;
    const storeOutputDeviceId = prefState.audioOutputDeviceId;

    //enumerate input and output devices
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const inputList: AudioDevice[] = [];
            const outputList: AudioDevice[] = [];

            devices.forEach(device => {
                if (device.kind === 'audioinput') {
                    inputList.push({ label: device.label, deviceId: device.deviceId, groupId: device.groupId });
                } else if (device.kind === 'audiooutput') {
                    outputList.push({ label: device.label, deviceId: device.deviceId, groupId: device.groupId });
                }
            });

            store.setInputDevices(inputList);
            store.setOutputDevices(outputList);

            const resolvedInputId =
                (storeInputDeviceId && inputList.find(i => i.deviceId === storeInputDeviceId)?.deviceId)
                || inputList.find(i => i.deviceId === 'default')?.deviceId
                || inputList[0]?.deviceId
                || '';

            const resolvedOutputId =
                (storeOutputDeviceId && outputList.find(i => i.deviceId === storeOutputDeviceId)?.deviceId)
                || outputList.find(i => i.deviceId === 'default')?.deviceId
                || outputList[0]?.deviceId
                || '';

            if (resolvedInputId) {
                store.setSelectedInput(resolvedInputId);
            }
            if (resolvedOutputId) {
                store.setSelectedOutput(resolvedOutputId);
            }

            console.log('inputDevices', inputList, '\noutputDevices', outputList, '\nresolvedInputId', resolvedInputId, '\nresolvedOutputId', resolvedOutputId);
        })
        .catch(error => {
            console.error("Error enumerating devices:", error);
        });

    // need request permission to access media devices on web
    // navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    //     .then(stream => {

    //         stream.getTracks().forEach(track => track.stop());
    //     }).catch(error => {
    //         console.error("Error accessing media devices:", error);
    //     })
}

const stopAllTracks = (stream: MediaStream) => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
};

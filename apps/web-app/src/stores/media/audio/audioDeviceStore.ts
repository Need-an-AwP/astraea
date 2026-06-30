import { create } from 'zustand'
import { AudioEngine } from '@/AudioEngine'

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

export const useAudioDeviceStore = create<AudioDeviceState>((set) => ({
    inputDevices: [],
    outputDevices: [],
    selectedInput: '',
    selectedOutput: '',

    setInputDevices: (devices: AudioDevice[]) => set({ inputDevices: devices }),
    setOutputDevices: (devices: AudioDevice[]) => set({ outputDevices: devices }),
    setSelectedInput: (deviceId: string) => {
        // won't write store here, state will be updated by AudioEngine if change succeeds
        AudioEngine.instance.setInputDevice(deviceId)
        console.log('input device changed:', deviceId);
    },
    setSelectedOutput: (deviceId: string) => {
        // won't write store here, state will be updated by AudioEngine if change succeeds
        AudioEngine.instance.setOutputDevice(deviceId)
        console.log("output device changed:", deviceId);
    },
}));


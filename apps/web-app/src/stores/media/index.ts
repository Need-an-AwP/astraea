import { initialAudioDevices } from './audio/audioDeviceStore'
import { initAudioEngine } from './audio/AudioEngine'

export const initMediaDevices = () =>{
    initialAudioDevices();
    // initAudioEngine();
}
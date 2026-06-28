import { initialAudioDevices } from './audio/audioDeviceStore'
import { initAudioEngine } from './audio/engine'

export const initMediaDevices = () =>{
    initialAudioDevices();
    initAudioEngine();
}
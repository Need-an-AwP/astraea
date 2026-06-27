import { initialAudioDevices } from './audio/audioDeviceStore'
import { initializeAudioProcessing } from './audio/audioProcessingStore'

export const initMediaDevices = () =>{
    initialAudioDevices();
    initializeAudioProcessing()
}
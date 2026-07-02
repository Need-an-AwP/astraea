export const AUDIO_FREQUENCY_DATA_EVENT = 'audio-frequency-data';

export type AudioDataEvent = {
    type: typeof AUDIO_FREQUENCY_DATA_EVENT;
    payload: Uint8Array<ArrayBuffer>;
};

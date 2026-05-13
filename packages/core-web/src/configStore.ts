import { createStore } from 'zustand/vanilla';

interface ConfigStore {
    videoTargetBitrate?: number;
    forceRelayMedia?: boolean;
    rtcReportInterval?: number;
}

export const configStore = createStore<ConfigStore>((set, get) => ({}));

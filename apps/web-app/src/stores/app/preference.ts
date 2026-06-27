import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import idbStorage from '../idb';

interface PreferenceState {
    hasHydrated: boolean;
    
    audioInputDeviceId: string;
    audioOutputDeviceId: string;
    videoInputDeviceId: string;
    setHasHydrated: (hasHydrated: boolean) => void;
    setAudioInputDeviceId: (deviceId: string) => void;
    setAudioOutputDeviceId: (deviceId: string) => void;
    setVideoInputDeviceId: (deviceId: string) => void;
}

type PreferenceDataKeys = 'audioInputDeviceId' | 'audioOutputDeviceId' | 'videoInputDeviceId' | 'hasHydrated';

export const usePreferenceStore = create<PreferenceState>()(
    persist(
        (set) => ({
            hasHydrated: false,
            audioInputDeviceId: '',
            audioOutputDeviceId: '',
            videoInputDeviceId: '',

            setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
            setAudioInputDeviceId: (deviceId: string) => set({ audioInputDeviceId: deviceId }),
            setAudioOutputDeviceId: (deviceId: string) => set({ audioOutputDeviceId: deviceId }),
            setVideoInputDeviceId: (deviceId: string) => set({ videoInputDeviceId: deviceId }),
        }),
        {
            name: 'astraea-preference',
            storage: createJSONStorage(() => idbStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

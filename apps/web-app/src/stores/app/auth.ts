import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import idbStorage from '../idb';

type keySource = 'url' | 'idb' | 'env' | 'unknown';

interface AuthState {
    hostname: string;
    authKey: string | null;
    keySource: keySource;
    hasHydrated: boolean;
    setHasHydrated: (hasHydrated: boolean) => void;
    setHostname: (hostname: string) => void;
    setAuthKey: (key: string, keySource: keySource) => void;
    clearAuthKey: () => void;
}

type PersistedAuthState = Pick<AuthState, 'authKey'>;

const mergeAuthState = (
    persisted: PersistedAuthState | undefined,
    current: AuthState
): AuthState => {
    if (!persisted?.authKey) return current;

    return {
        ...current,
        authKey: persisted.authKey,
        keySource: 'idb',
    };
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            hostname: '',
            authKey: null,
            keySource: 'unknown',
            hasHydrated: false,
            setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
            setHostname: (hostname: string) => set({ hostname }),
            setAuthKey: (key: string, keySource: keySource) => set({ authKey: key, keySource }),
            clearAuthKey: () => set({ authKey: null, keySource: 'unknown' }),
        }),
        {
            name: 'astraea-auth-credential',
            storage: createJSONStorage(() => idbStorage),
            partialize: (state: AuthState) => ({
                hostname: state.hostname,
                authKey: state.authKey,
            }),
            merge: (persistedState, currentState) => mergeAuthState(
                persistedState as PersistedAuthState | undefined,
                currentState as AuthState
            ),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import idbStorage from '../idb';

export type DataSource = 'url' | 'idb' | 'env' | 'empty';

interface AuthState {
    hostname: string;
    authKey: string | null;
    isLoggingIn: boolean;
    keySource: DataSource;
    hasHydrated: boolean;
    setIsLoggingIn: (isLoggingIn: boolean) => void;
    setHasHydrated: (hasHydrated: boolean) => void;
    setHostname: (hostname: string) => void;
    setAuthKey: (key: string, keySource: Exclude<DataSource, 'empty'>) => void;
    clearAuthKey: () => void;
}

type PersistedAuthState = Pick<AuthState, 'hostname' | 'authKey'>;

const mergeAuthState = (
    persisted: PersistedAuthState | undefined,
    current: AuthState
): AuthState => {
    if (!persisted) return current;

    const next: AuthState = { ...current };

    if (persisted.hostname) {
        next.hostname = persisted.hostname;
    }

    if (persisted.authKey) {
        next.authKey = persisted.authKey;
        next.keySource = 'idb';
    }

    return next;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            hostname: '',
            authKey: null,
            isLoggingIn: false,
            keySource: 'empty',
            hasHydrated: false,
            setIsLoggingIn: (isLoggingIn: boolean) => set({ isLoggingIn }),
            setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
            setHostname: (hostname: string) => set({ hostname }),
            setAuthKey: (key: string, keySource: Exclude<DataSource, 'empty'>) => {
                set({ authKey: key, keySource })
            },
            clearAuthKey: () => set({ authKey: null, keySource: 'empty' }),
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
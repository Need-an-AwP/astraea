import { create } from 'zustand';
import { subscribeWithSelector, type StateStorage, persist, createJSONStorage } from 'zustand/middleware'
import type { PeerState } from '@/types';
import * as idb from 'idb-keyval';

interface RemoteUsersState {
    peers: Record<string, PeerState>
    removePeer: (peerIP: string) => void
    updatePeerState: (peerIP: string, peerState: PeerState) => void
}

export const useRemoteUsersStore = create<RemoteUsersState>()(
    subscribeWithSelector((set, get) => ({
        peers: {},

        removePeer: (peerIP: string) => {
            set((state) => {
                const { [peerIP]: removed, ...rest } = state.peers;
                return { peers: rest };
            });
        },

        updatePeerState: (peerIP: string, peerState: PeerState) => {
            console.log('Updating peer state:', peerIP, peerState);
            set((state) => ({
                peers: {
                    ...state.peers,
                    [peerIP]: peerState,
                }
            }));
        },
    }))
)

const defaultPeerState: PeerState = {
    // storage state
    userName: 'userName',
    userAvatar: 'https://github.com/evilrabbit.png',
    // temporary state
    isInChat: false,
    isInputMuted: false,
    isOutputMuted: false,
    isSharingScreen: false,
    isSharingAudio: false,
}

const idbStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await idb.get(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await idb.set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await idb.del(name);
    },
};

interface LocalUserStateStore {
    userState: PeerState
    initialized: boolean
    initializeSelfState: () => void
    updateSelfState: (partialState: Partial<PeerState>) => void
}

type PersistedUserProfile = {
    userState: Pick<PeerState, 'userName' | 'userAvatar'>
}

const persistUserProfile = (state: LocalUserStateStore): PersistedUserProfile => ({
    userState: {
        userName: state.userState.userName,
        userAvatar: state.userState.userAvatar,
    },
});

const mergeUserProfile = (
    persisted: PersistedUserProfile | undefined,
    current: LocalUserStateStore
): LocalUserStateStore => {
    if (!persisted) return current;

    return {
        ...current,
        userState: {
            ...current.userState,
            ...persisted.userState,
        },
    };
};

export const useLocalUserStateStore = create<LocalUserStateStore>()(
    subscribeWithSelector(
        persist(
            (set) => ({
                userState: defaultPeerState,
                initialized: false,
                initializeSelfState: () => {
                    set({ initialized: true });
                },
                updateSelfState: (partialState: Partial<PeerState>) => {
                    set((state) => ({
                        userState: {
                            ...state.userState,
                            ...partialState,
                        },
                    }));
                },
            }),
            {
                name: 'astraea-user-profile',
                storage: createJSONStorage(() => idbStorage),
                partialize: persistUserProfile,
                merge: (persisted, current) => mergeUserProfile(
                    persisted as PersistedUserProfile | undefined,
                    current
                ),
                onRehydrateStorage: () => (state) => state?.initializeSelfState(),
            }
        )
    )
)
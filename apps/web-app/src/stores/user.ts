import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware'
import type { PeerState } from '@/types';

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

interface LocalUserStateStore {
    userState: PeerState
    initialized: boolean
    initializeSelfState: () => Promise<void>// the init method is called in userProfile component
    updateSelfState: (partialState: Partial<PeerState>) => void
}

export const useLocalUserStateStore = create<LocalUserStateStore>()(
    subscribeWithSelector((set) => ({
        userState: defaultPeerState,
        initialized: false,
        initializeSelfState: async () => {
            try {
                // const userConfig = await window.ipcBridge.getUserConfig();
                set((state) => ({
                    ...state,
                    userState: {
                        ...state.userState,
                        // ...(userConfig.userName !== undefined && { userName: userConfig.userName }),
                        // ...(userConfig.userAvatar !== undefined && { userAvatar: userConfig.userAvatar }),
                    },
                    initialized: true,
                }));
            } catch (error) {
                console.error('Failed to load user config:', error);
                set((state) => ({
                    ...state,
                    initialized: true,
                }));
            }
        },
        updateSelfState: (partialState: Partial<PeerState>) => {
            try {
                // for status should be save to local storage
                if (partialState.userName !== undefined) {
                    // window.ipcBridge.setUserConfig('userName', partialState.userName);
                }
                if (partialState.userAvatar !== undefined) {
                    // window.ipcBridge.setUserConfig('userAvatar', partialState.userAvatar);
                }
                // for all state
                set((state) => ({
                    ...state,
                    userState: {
                        ...state.userState,
                        ...partialState,
                    },
                }));

                // syncMirrorState();
            } catch (error) {
                console.error('Failed to update user config:', error);
            }
        },
    }))
)
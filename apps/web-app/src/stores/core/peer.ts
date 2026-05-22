import { create } from 'zustand';
import type { TsStatus, ConnectionStatus } from '@astraea/interface';
import { IS_DESKTOP } from '@/lib/env';

interface ConnectionMode {
    type: "Direct" | "Relay" | "PeerRelay" | "NotConnected";
    info: string;
};

export interface ConnectionInfo {
    status: ConnectionStatus;
    mode: ConnectionMode;
    // latency: number | undefined;
    // bandwidth: number | undefined;
}

type TrackInfo<TTrack extends MediaStreamTrack> = {
    id: string;
    peerIP: string;
    path: string | undefined;
    track: TTrack;
};

interface PeerState {
    /** from `tailscaleStatus.Peer` */
    tsPeer: TsStatus['Peer'] | null;
    connections: Record<string, ConnectionInfo>;
    userData: unknown; // TODO
    /** the key is peerIP */
    remoteAudioTracks: Map<string, TrackInfo<MediaStreamAudioTrack>>;
    /** the key is peerIP */
    remoteVideoTracks: Map<string, TrackInfo<MediaStreamVideoTrack>>;
}

export const usePeerStore = create<PeerState>((set, get) => ({
    tsPeer: null,
    connections: {},
    userData: null,
    remoteAudioTracks: new Map(),
    remoteVideoTracks: new Map(),
}));

// readonly methods
export const useTsPeer = () => usePeerStore((state) => state.tsPeer);
export const useConnections = () => usePeerStore((state) => state.connections);
export const useRemoteAudioTracks = () => usePeerStore((state) => state.remoteAudioTracks);
export const useRemoteVideoTracks = () => usePeerStore((state) => state.remoteVideoTracks);

// writeonly methods
export const setTsPeer = (tsPeer: TsStatus['Peer'] | null) => {
    usePeerStore.setState({ tsPeer });
};


const calcuConnectionMode = (peerIP: string): ConnectionMode => {
    if (IS_DESKTOP) {
        const tsPeer = useTsPeer();
        if (!tsPeer) {
            return { type: 'NotConnected', info: '' };
        }
        const peerStatus = tsPeer[peerIP]
        if (!peerStatus) {
            return { type: 'NotConnected', info: '' };
        }

        const curAddr = peerStatus.CurAddr || '';
        const relay = peerStatus.Relay || '';
        const peerRelay = peerStatus.PeerRelay || '';

        if (curAddr.trim() !== '') {
            return { type: 'Direct', info: curAddr };
        }
        if (peerRelay.trim() !== '') {
            return { type: 'PeerRelay', info: peerRelay };
        }
        if (relay.trim() !== '') {
            return { type: 'Relay', info: relay };
        }
        return { type: 'NotConnected', info: '' };
    } else {
        return { type: 'Relay', info: '' };
    }
};
/**
 * not passing connectionstatus will use default values
 * @param peerIP 
 * @param cs 
 */
export const updateConnectionStatus = (peerIP: string, cs?: ConnectionStatus) => {
    const status = cs ? cs : {
        relayStatus: 'new',
        directStatus: 'new',
        activePath: 'relay',
    } as ConnectionStatus;

    usePeerStore.setState((state) => ({
        connections: {
            ...state.connections,
            [peerIP]: {
                ...state.connections[peerIP],
                status,
                mode: calcuConnectionMode(peerIP),
            },
        },
    }));
};
export const addRemoteAudioTrack = (peerIP: string, track: MediaStreamAudioTrack, path: string | undefined) => {

};
export const addRemoteVideoTrack = (peerIP: string, track: MediaStreamVideoTrack, path: string | undefined) => {

};
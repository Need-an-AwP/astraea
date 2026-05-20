import { create } from 'zustand';
import type { TsStatus } from '@astraea/interface';

export type ConnectionMode = "Direct" | "Relay" | "PeerRelay" | "NotConnected";

export interface ConnectionStatus {
    connectionMode: {
        type: ConnectionMode;
        info: string;
    };
    latency: number | null;
    bandwidth: number | null;
}

type TrackInfo<TTrack extends MediaStreamTrack> = {
    id: string;
    peerIP: string;
    path: string;
    track: TTrack;
};

interface PeerState {
    /** from `tailscaleStatus.Peer` */
    tsPeer: TsStatus['Peer'] | null;
    connectionInfo: Map<string, ConnectionStatus>;
    userData: unknown; // TODO
    /** the key is peerIP */
    remoteAudioTracks: Map<string, TrackInfo<MediaStreamAudioTrack>>;
    /** the key is peerIP */
    remoteVideoTracks: Map<string, TrackInfo<MediaStreamVideoTrack>>;
}

export const usePeerStore = create<PeerState>((set, get) => ({
    tsPeer: null,
    connectionInfo: new Map(),
    userData: null,
    remoteAudioTracks: new Map(),
    remoteVideoTracks: new Map(),
}));

// readonly methods
export const useTsPeer = () => usePeerStore((state) => state.tsPeer);
export const useConnectionInfo = () => usePeerStore((state) => state.connectionInfo);
export const useRemoteAudioTracks = () => usePeerStore((state) => state.remoteAudioTracks);
export const useRemoteVideoTracks = () => usePeerStore((state) => state.remoteVideoTracks);

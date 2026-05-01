import type { TSStatus, ActivePath } from "astraea-core";

interface ConnectionStatus {
    relayStatus: RTCPeerConnectionState;
    directStatus: RTCPeerConnectionState;
    activePath: ActivePath;
}

interface RemoteTrackState {
    id: string;
    peerIP: string;
    path: string;
    track: MediaStreamTrack;
}

interface AppState {
    coreState: string;
    inputDevice: string;
    outputDevice: string;
    loopbackEnabled: boolean;
    logs: string[];
    tsStatus: TSStatus | null;
    connectedPeers: Map<string, ConnectionStatus | null>;
    errorMsgs: string[];
    remoteAudioTracks: RemoteTrackState[];
    remoteVideoTracks: RemoteTrackState[];
    inputAudioTrack: MediaStreamTrack | null;
    inputVideoTrack: MediaStreamTrack | null;
}

export class Store extends EventTarget {
    private state: AppState = {
        coreState: "Starting...",
        inputDevice: "none",
        outputDevice: "Default",
        loopbackEnabled: false,
        logs: [],
        tsStatus: null,
        connectedPeers: new Map<string, ConnectionStatus | null>(),
        errorMsgs: [],
        remoteAudioTracks: [],
        remoteVideoTracks: [],
        inputAudioTrack: null,
        inputVideoTrack: null,
    };

    get<K extends keyof AppState>(key: K): AppState[K] {
        return this.state[key];
    }

    private emitUpdate<K extends keyof AppState>(key: K, value: AppState[K]) {
        this.dispatchEvent(new CustomEvent('update', { detail: { key, value } }));
    }

    set<K extends keyof AppState>(key: K, value: AppState[K]) {
        this.state[key] = value;
        this.emitUpdate(key, value);
    }

    private updateConnectedPeers(updater: (prev: Map<string, ConnectionStatus | null>) => Map<string, ConnectionStatus | null>) {
        const next = updater(this.state.connectedPeers);
        this.set('connectedPeers', next);
    }

    setConnectedPeer(peerIP: string, status: ConnectionStatus | null) {
        this.updateConnectedPeers((prev) => {
            const next = new Map(prev);
            next.set(peerIP, status);
            return next;
        });
    }

    refreshConnectedPeers() {
        this.set('connectedPeers', new Map(this.state.connectedPeers));
    }

    clearPeerState(peerIP: string) {
        this.updateConnectedPeers((prev) => {
            const next = new Map(prev);
            next.delete(peerIP);
            return next;
        });

        const nextAudioTracks = this.state.remoteAudioTracks.filter((t) => t.peerIP !== peerIP);
        if (nextAudioTracks.length !== this.state.remoteAudioTracks.length) {
            this.set('remoteAudioTracks', nextAudioTracks);
        }

        const nextVideoTracks = this.state.remoteVideoTracks.filter((t) => t.peerIP !== peerIP);
        if (nextVideoTracks.length !== this.state.remoteVideoTracks.length) {
            this.set('remoteVideoTracks', nextVideoTracks);
        }
    }

    addLog(log: string) {
        if (typeof (window as any).log === "function") {
            (window as any).log(log);
        } else {
            const time = new Date().toISOString();
            const line = `${time} ${log}`;
            this.state.logs.unshift(line);
            this.emitUpdate('logs', this.state.logs);
        }
    }

    addRemoteTrack(peerIP: string, path: string, track: MediaStreamTrack) {
        const id = `${peerIP}-${path}-${track.id}`;

        if (track.kind === 'audio') {
            if (this.state.remoteAudioTracks.find(t => t.id === id)) return;
            const newTracks = [...this.state.remoteAudioTracks, { id, peerIP, path, track }];
            this.set('remoteAudioTracks', newTracks);
        } else if (track.kind === 'video') {
            if (this.state.remoteVideoTracks.find(t => t.id === id)) return;
            const newTracks = [...this.state.remoteVideoTracks, { id, peerIP, path, track }];
            this.set('remoteVideoTracks', newTracks);
        }

        track.addEventListener("ended", () => {
            this.removeRemoteTrack(id, track.kind);
        }, { once: true });
    }

    removeRemoteTrack(id: string, kind: string) {
        if (kind === 'audio') {
            const newTracks = this.state.remoteAudioTracks.filter(t => t.id !== id);
            this.set('remoteAudioTracks', newTracks);
        } else if (kind === 'video') {
            const newTracks = this.state.remoteVideoTracks.filter(t => t.id !== id);
            this.set('remoteVideoTracks', newTracks);
        }
    }

    removePeerTracks(peerIP: string) {
        this.clearPeerState(peerIP);
    }
}

export const store = new Store();

// Initialize globals for playwright tests
(globalThis as any).__APP_STORE__ = store;

import type { TsStatus, NodeState } from '@astraea/interface';
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'


export interface connectionMode {
    type: "Direct" | "Relay" | "PeerRelay" | "NotConnected";
    info: string;
}

interface TailscaleState {
    showWelcome: boolean;
    tailscaleStatus: TsStatus | null;
    nodeState: NodeState | null;
    connectionModes: Record<string, connectionMode> | null;// key is peerIP
    updateTailscaleStatus: (status: TsStatus) => void;
    setNodeState: (state: NodeState | null) => void;
    setShowWelcome: (show: boolean) => void;
}


export const useTailscaleStore = create<TailscaleState>()(
    subscribeWithSelector((set) => ({
        showWelcome: false,
        tailscaleStatus: null,
        nodeState: null,
        connectionModes: null,
        updateTailscaleStatus: (status) => {
            const connectionModes: Record<string, connectionMode> = {};

            if (status?.Peer) {
                Object.entries(status.Peer).forEach(([peerKey, peerStatus]) => {
                    if (!peerStatus) return;

                    const peerIP = peerStatus.TailscaleIPs?.[0] || peerKey;
                    const curAddr = peerStatus.CurAddr || '';
                    const relay = peerStatus.Relay || '';
                    const peerRelay = peerStatus.PeerRelay || '';

                    let connectionMode: connectionMode;
                    if (curAddr && curAddr.trim() !== '') {
                        connectionMode = { type: 'Direct', info: curAddr };
                    } else if (peerRelay && peerRelay.trim() !== '') {
                        connectionMode = { type: 'PeerRelay', info: peerRelay };
                    } else if (relay && relay.trim() !== '') {
                        connectionMode = { type: 'Relay', info: relay };
                    } else {
                        connectionMode = { type: 'NotConnected', info: '' };
                    }

                    connectionModes[peerIP] = connectionMode;
                });
            }

            set({
                tailscaleStatus: status,
                connectionModes: connectionModes
            });
        },
        setNodeState: (state) => set({ nodeState: state }),
        setShowWelcome: (show) => set({ showWelcome: show }),
    }))
)
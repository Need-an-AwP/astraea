import { create } from 'zustand';
import type { TsStatus, NodeState } from '@astraea/interface';
import { setTsPeer } from './peer'
import { useAuthStore } from '../app/auth';
import { usePanelStore } from '../app/ui';


interface CoreState {
    /** basic node state */
    nodeState: NodeState | null;
    /** from `tailscaleStatus.Self` */
    tsSelf: TsStatus['Self'] | null;
    /** from `tailscaleStatus`, excluding `Self` and `Peer` */
    tsStatus: Omit<TsStatus, 'Self' | 'Peer'> | null;
    error: string[];
}

const useCoreStore = create<CoreState>((set, get) => ({
    nodeState: null,
    tsSelf: null,
    tsStatus: null,
    error: [],
}));

// readonly
export const useNodeState = () => useCoreStore((state) => state.nodeState);
export const useTsSelf = () => useCoreStore((state) => state.tsSelf);
export const useTsStatus = () => useCoreStore((state) => state.tsStatus);
export const useError = () => useCoreStore((state) => state.error);

// writeonly
export const setNodeState = (state: NodeState | null) => {
    console.log("node state changed: ", state);
    useCoreStore.setState({ nodeState: state });
    // flag of finished logging in
    if (state === 'Running') {
        useAuthStore.getState().setIsLoggingIn(false);
        usePanelStore.getState().setShowWelcome(false);
    }
};
export const updateTailscaleStatus = (status: TsStatus) => {
    const { Self: tsSelf, Peer: tsPeer, ...rest } = status;
    useCoreStore.setState({
        tsSelf,
        tsStatus: rest,
    });
    setTsPeer(tsPeer);
};
export const addErrorLog = (msg: string) => {
    useCoreStore.setState((state) => ({ error: [...state.error, msg] }));
};
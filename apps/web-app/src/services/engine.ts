import { AstraeaCoreDesktop } from '@astraea/core-desktop';
import { AstraeaCoreWeb } from "@astraea/core-web";
import { IS_DESKTOP } from '@/lib/env.ts';
import {
    updateTailscaleStatus, setNodeState, addErrorLog,
    updateConnectionStatus, usePanelStore, useAuthStore
} from '@/stores';


export const resolveAuthKey = (): { authKey: string, source: 'url' | 'store' | 'default' } => {
    // 1st priority: url param
    const urlParams = new URLSearchParams(window.location.search);
    const authKeyFromUrl = urlParams.get("authkey");
    if (authKeyFromUrl) {
        useAuthStore.getState().setAuthKey(authKeyFromUrl, 'url'); // update Store & IDB
        return { authKey: authKeyFromUrl, source: 'url' };
    }

    // 2nd priority: idb store
    const authKeyFromStore = useAuthStore.getState().authKey;
    if (authKeyFromStore) {
        return { authKey: authKeyFromStore, source: 'store' };
    }

    return { authKey: '', source: 'default' };
}

export const resolveHostname = (): { hostname: string, source: 'url' | 'store' | 'default' } => {
    const urlParams = new URLSearchParams(window.location.search);
    const hostnameFromUrl = urlParams.get("hostname");
    if (hostnameFromUrl) {
        useAuthStore.getState().setHostname(hostnameFromUrl); // update Store & IDB
        return { hostname: hostnameFromUrl, source: 'url' };
    }

    const hostnameFromStore = useAuthStore.getState().hostname;
    if (hostnameFromStore) {
        return { hostname: hostnameFromStore, source: 'store' };
    }

    return {
        hostname: IS_DESKTOP ? "astraea-desktop" : "astraea-web",
        source: 'default'
    };
}




export const startEngine = async (authKey: string, hostname: string): Promise<AstraeaCoreDesktop | AstraeaCoreWeb> => {
    try {

        const Engine = IS_DESKTOP ? AstraeaCoreDesktop : AstraeaCoreWeb;

        const core = await Engine.init({
            hostname: hostname,
            authKey: authKey,
        }, {

        });

        core.onTsStatusUpdate((status) => {
            // console.log(status);
            updateTailscaleStatus(status);
        });

        core.onNodeStateChange((state) => {
            // console.log("Node state changed: ", state);
            setNodeState(state);
        });

        core.onError((error) => {
            console.error("Core error: ", error);
            addErrorLog(error);
        });

        core.onConnection((conn) => {
            updateConnectionStatus(conn.peerIP);

            conn.onStatusChange((status) => {
                updateConnectionStatus(conn.peerIP, status)
            });

            conn.onMessage((msg) => {

            });

            conn.onTrack((track) => {

            });

            conn.onReport((stats, path) => {

            });

            conn.onDisconnect(() => {

            });
        })

        return core as AstraeaCoreDesktop | AstraeaCoreWeb;
    } catch (error) {
        console.error("Engine initialization failed: ", error);
    }
}
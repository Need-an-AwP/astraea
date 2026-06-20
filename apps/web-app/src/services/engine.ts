import { AstraeaCoreDesktop } from '@astraea/core-desktop';
import { AstraeaCoreWeb } from "@astraea/core-web";
import type { AstraeaCore } from '@astraea/interface';
import { IS_DESKTOP } from '@/lib/env.ts';
import {
    updateTailscaleStatus, setNodeState, addErrorLog,
    updateConnectionStatus, usePanelStore, useAuthStore
} from '@/stores';


export const startEngine = (authKey: string, hostname: string): AstraeaCore | null => {
    try {
        const initCoreConfig = {
            hostname: hostname,
            authKey: authKey,
        }
        const initCoreOptions = {}

        // FOR GO TO DEFINITION OF DEFFERENT ENGINES
        const core = IS_DESKTOP
            ? AstraeaCoreDesktop.init(initCoreConfig, initCoreOptions)
            : AstraeaCoreWeb.init(initCoreConfig, initCoreOptions);

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

        return core;
    } catch (error) {
        console.error("Engine initialization failed: ", error);
        return null;
    }
}

export const stopEngine = () => {

}
import { AstraeaCoreDesktop } from '@astraea/core-desktop';
import { AstraeaCoreWeb } from "@astraea/core-web";
import { IS_DESKTOP } from '@/lib/env.ts';
import {
    updateTailscaleStatus, setNodeState, addErrorLog,
    updateConnectionStatus, usePanelStore, useAuthStore
} from '@/stores';


export const startEngine = async (authKey: string, hostname: string) => {
    try {

        const Engine = IS_DESKTOP ? AstraeaCoreDesktop : AstraeaCoreWeb;

        const core = Engine.init({
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

        return core;
    } catch (error) {
        console.error("Engine initialization failed: ", error);
    }
}

export const stopEngine = () => {

}
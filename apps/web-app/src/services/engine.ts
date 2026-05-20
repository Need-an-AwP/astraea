import { AstraeaCoreDesktop } from '@astraea/core-desktop';
import { AstraeaCoreWeb } from "@astraea/core-web";
import { IS_DESKTOP } from '@/lib/env.ts';
import { updateTailscaleStatus, setNodeState, addErrorLog } from '@/stores';

const getAuthKey = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const authKeyParam = urlParams.get("authkey");
    const authKey = authKeyParam || import.meta.env.VITE_NODE_AUTH_KEY; // CAUTION: THIS WILL HARD-CODE AUTHKEY INTO THE BUNDLE IF USED
    if (!authKey) {
        console.warn("Missing authkey in URL or env");
        return '';
    } else {
        return authKey
    }
}

let engineInstance: AstraeaCoreDesktop | AstraeaCoreWeb | null = null;
let isInitializing = false;



export const startEngine = async () => {
    if (engineInstance || isInitializing) return engineInstance;
    isInitializing = true;

    try {
        const Engine = IS_DESKTOP ? AstraeaCoreDesktop : AstraeaCoreWeb;

        const core = await Engine.init({
            hostname: "wails-desktop-test",
            authKey: getAuthKey()
        }, {

        })
        core.onTsStatusUpdate((status) => {
            console.log(status);
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
            conn.onStatusChange((status) => {

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

    } finally {
        isInitializing = false;
    }
}
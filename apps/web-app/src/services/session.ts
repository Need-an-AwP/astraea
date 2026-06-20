import { AstraeaCoreDesktop } from '@astraea/core-desktop';
import { AstraeaCoreWeb } from "@astraea/core-web";
import type { AstraeaCore } from '@astraea/interface';
import { IS_DESKTOP } from '@/lib/env.ts';
import { startEngine } from '@/services/engine';
import {
    updateTailscaleStatus, setNodeState, addErrorLog,
    updateConnectionStatus, usePanelStore, useAuthStore,
    type DataSource
} from '@/stores';


class SessionManager {
    private static instance: SessionManager | null = null;
    private engineInstance: AstraeaCore | null = null;

    private constructor() { }

    public initSession() {
        const { authKey: storeAK, source: storeAKSource } = this.resolveAuthKey();
        const { hostname: storeHN, source: storeHNSource } = this.resolveHostname();

        console.log("authkey source: ", storeAKSource, '\nhostname source: ', storeHNSource, '\n');

        if (storeAKSource === 'empty') {
            usePanelStore.getState().setShowWelcome(true);
            return;
        }
        if (storeHNSource === 'empty') {
            console.warn("authkey found, but hostname not found, using default hostname");
        }

        return this.login(storeAK, storeHN);
    }

    public login(authKey: string, hostname: string) {
        // prevent multiple login
        if (useAuthStore.getState().isLoggingIn) return;
        useAuthStore.getState().setIsLoggingIn(true);

        const engine = startEngine(authKey, hostname);
        if (!engine) {
            useAuthStore.getState().setIsLoggingIn(false);
            throw new Error("Engine initialization failed");
        }
        this.engineInstance = engine;
        return;
    }

    public logout(): void {
        useAuthStore.getState().clearAuthKey();
        usePanelStore.getState().setShowWelcome(true);
        this.engineInstance = null;
    }


    public static getInstance(): SessionManager {
        if (SessionManager.instance === null) {
            SessionManager.instance = new SessionManager();
        }

        return SessionManager.instance;
    }

    private resolveAuthKey(): { authKey: string, source: DataSource } {
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
            return { authKey: authKeyFromStore, source: 'idb' };
        }

        return { authKey: '', source: 'empty' };
    }

    private resolveHostname(): { hostname: string, source: DataSource } {
        const urlParams = new URLSearchParams(window.location.search);
        const hostnameFromUrl = urlParams.get("hostname");
        if (hostnameFromUrl) {
            useAuthStore.getState().setHostname(hostnameFromUrl); // update Store & IDB
            return { hostname: hostnameFromUrl, source: 'url' };
        }

        const hostnameFromStore = useAuthStore.getState().hostname;
        if (hostnameFromStore) {
            return { hostname: hostnameFromStore, source: 'idb' };
        }

        return {
            hostname: IS_DESKTOP ? "astraea-desktop" : "astraea-web",
            source: 'empty'
        };
    }
}

export const sessionManager = SessionManager.getInstance();
export default sessionManager;

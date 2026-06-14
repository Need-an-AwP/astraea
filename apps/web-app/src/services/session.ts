import { AstraeaCoreDesktop } from '@astraea/core-desktop';
import { AstraeaCoreWeb } from "@astraea/core-web";
import { IS_DESKTOP } from '@/lib/env.ts';
import { startEngine} from '@/services/engine';
import {
    updateTailscaleStatus, setNodeState, addErrorLog,
    updateConnectionStatus, usePanelStore, useAuthStore
} from '@/stores';

type SessionLoginResult = Awaited<ReturnType<typeof startEngine>>;

class SessionManager {
    private static instance: SessionManager | null = null;
    private engineInstance: AstraeaCoreDesktop | AstraeaCoreWeb | null = null;
    private loginPromise: Promise<SessionLoginResult | void> | null = null;

    private constructor() { }

    public async initSession(): Promise<SessionLoginResult | void> {
        const { authKey: storeAK, source: storeAKSource } = this.resolveAuthKey();
        const { hostname: storeHN, source: storeHNSource } = this.resolveHostname();

        if (storeAKSource === 'default') {
            usePanelStore.getState().setShowWelcome(true);
            return;
        }
        if (storeHNSource === 'default') {
            console.warn("authkey found, but hostname not found, using default hostname");
        }

        return this.login(storeAK, storeHN);
    }

    public async login(authKey: string, hostname: string): Promise<SessionLoginResult | void> {

        if (this.loginPromise) {
            return this.loginPromise;
        }

        this.loginPromise = (async () => {
            try {
                usePanelStore.getState().setShowWelcome(false);
                this.engineInstance = await startEngine(authKey, hostname);
                return ;
            } finally {
                this.loginPromise = null;
            }
        })();

        return this.loginPromise;
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

    private resolveAuthKey(): { authKey: string, source: 'url' | 'store' | 'default' } {
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

    private resolveHostname(): { hostname: string, source: 'url' | 'store' | 'default' } {
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
}

export const sessionManager = SessionManager.getInstance();
export default sessionManager;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import type { IAstraeaCore } from "@astraea/interface";
import { AstraeaCoreDesktop } from '@astraea/core-desktop';
import { AstraeaCoreWeb } from "@astraea/core-web";
import { IS_DESKTOP } from '@/lib/env.ts';
import { useTailscaleStore } from '@/stores';


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

let Engine;
if (IS_DESKTOP) {
    Engine = AstraeaCoreDesktop
} else {
    Engine = AstraeaCoreWeb
}

Engine.init({ hostname: "wails-desktop-test", authKey: getAuthKey() }, {})
    .then(core => {
        core.onTsStatusUpdate((status) => {
            console.log(status);
            useTailscaleStore.getState().updateTailscaleStatus(status);
        });

        core.onNodeStateChange((state) => {
            console.log("Node state changed: ", state);
        });
    })

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)

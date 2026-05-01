import type { IAstraeaCore } from "@astraea/interface";

let core: IAstraeaCore;


import { store } from "./store";
import { globalAudioManager } from "../audioManager";

let isInitializing = false;
let inputAudioTrack: MediaStreamTrack | null = null;
let inputVideoTrack: MediaStreamTrack | null = null;
let loopbackEnabled = false;

let mediaPromise: Promise<void> | null = null;

const setInputDeviceState = () => {
    if (inputAudioTrack && inputVideoTrack) {
        store.set('inputDevice', `audio & video ready`);
    } else if (inputAudioTrack) {
        store.set('inputDevice', `audio ready (${inputAudioTrack.label || "unknown"})`);
    } else if (inputVideoTrack) {
        store.set('inputDevice', `video ready`);
    } else {
        store.set('inputDevice', 'none');
    }
};
const setCoreState = (state: string) => store.set('coreState', state);
const log = (str: string) => store.addLog(str);

const handleAudioTrack = (track: MediaStreamTrack) => {
    if (inputAudioTrack === track) return;
    inputAudioTrack = track;
    store.set('inputAudioTrack', track);
    setInputDeviceState();
    core?.setInputAudioTrack(track);
    log("Input audio track ready: " + track.label);

    track.addEventListener("ended", () => {
        if (inputAudioTrack !== track) return;
        inputAudioTrack = null;
        store.set('inputAudioTrack', null);
        setInputDeviceState();
        if (loopbackEnabled) {
            disableLoopback();
            log("Loopback disabled (input audio track ended)");
        }
    }, { once: true });
};

const handleVideoTrack = (track: MediaStreamTrack) => {
    if (inputVideoTrack === track) return;
    inputVideoTrack = track;
    store.set('inputVideoTrack', track);
    setInputDeviceState();
    core?.setInputVideoTrack(track);
    log("Input video track ready: " + track.label);

    track.addEventListener("ended", () => {
        if (inputVideoTrack !== track) return;
        inputVideoTrack = null;
        store.set('inputVideoTrack', null);
        setInputDeviceState();
    }, { once: true });
};

export const ensureMediaTracks = async () => {
    if (inputAudioTrack && inputVideoTrack) return { audio: inputAudioTrack, video: inputVideoTrack };

    if (!mediaPromise) {
        mediaPromise = (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack) handleAudioTrack(audioTrack);

                const videoTrack = stream.getVideoTracks()[0];
                if (videoTrack) handleVideoTrack(videoTrack);
            } finally {
                mediaPromise = null;
            }
        })();
    }

    await mediaPromise;

    if (!inputAudioTrack && !inputVideoTrack) {
        throw new Error("No media tracks available");
    }

    return { audio: inputAudioTrack, video: inputVideoTrack };
};

export const ensureInputTrack = async () => {
    const { audio } = await ensureMediaTracks();
    if (!audio) throw new Error("No audio track available");
    return audio;
};

export const disableLoopback = () => {
    globalAudioManager.disableLoopback();
    loopbackEnabled = false;
    store.set('loopbackEnabled', false);
};

export const enableLoopback = async () => {
    const track = await ensureInputTrack();
    await globalAudioManager.enableLoopback(track);
    loopbackEnabled = true;
    store.set('loopbackEnabled', true);
};

export const toggleLoopback = async () => {
    try {
        if (loopbackEnabled) {
            disableLoopback();
            log("Loopback disabled");
            return;
        }

        await enableLoopback();
        log("Loopback enabled");
    } catch (error) {
        disableLoopback();
        log(`Failed to toggle loopback: ${error}`);
    }
};

export const initCore = async () => {
    if (isInitializing || core) return;

    const urlParams = new URLSearchParams(window.location.search);
    const authKeyParam = urlParams.get("authkey");
    const authKey = authKeyParam || import.meta.env.VITE_NODE_AUTH_KEY; // CAUTION: THIS WILL HARD-CODE AUTHKEY INTO THE BUNDLE IF USED
    if (!authKey) {
        log("Missing authkey in URL or env");
        return;
    }

    const hostnameParam = urlParams.get("hostname");
    const hostname = hostnameParam ?? "Astraea-playground";

    isInitializing = true;
    try {
        core = await AstraeaCore.init({
            authKey,
            hostname,
        }, {
            forceRelayMedia: true
        });

        core.onStateChange((state) => {
            setCoreState(state);
            log("Node state: " + state);
        });

        core.onError((error) => {
            const msgs = store.get('errorMsgs');
            msgs.push(error);
            store.set('errorMsgs', msgs);
            log("Core error: " + error);
        });

        core.onTSStatusUpdate((status) => {
            store.set('tsStatus', status);
            // Re-trigger connected peers update just in case UI needs refreshing
            store.refreshConnectedPeers();
        });

        core.onConnection((conn) => {
            let disconnected = false;
            log(`New connection: ${conn.peerIP}`);
            store.setConnectedPeer(conn.peerIP, null);

            conn.onMessage((path, msg) => {
                log(`Message from ${conn.peerIP} on ${path}: ${JSON.stringify(msg)}`);
                console.log(`Message from ${conn.peerIP} on ${path}`);
            });

            conn.onStatusChange((status) => {
                if (disconnected) return;
                store.setConnectedPeer(conn.peerIP, status);
                log(`Status from ${conn.peerIP}:\nrelay=${status.relayStatus}\ndirect=${status.directStatus}\npath=${status.activePath}`);
            });

            conn.onTrack((path, track) => {
                if (disconnected) return;
                log(`Track from ${conn.peerIP} on ${path}: ${track.kind}`);
                console.log(`Received track from ${conn.peerIP} on ${path}:`, track);
                store.addRemoteTrack(conn.peerIP, path, track);
            });

            conn.onReport((_path, _report) => {
                // console.log(`Report from ${conn.peerIP} on ${_path}:`, _report);
            });

            conn.onDisconnect(() => {
                disconnected = true;
                log(`Connection lost: ${conn.peerIP}`);
                store.clearPeerState(conn.peerIP);
            });
        });

        core.run();
        log("Core running");

        if (inputAudioTrack) {
            core.setInputAudioTrack(inputAudioTrack);
            log("Input audio track set on core");
        }
        if (inputVideoTrack) {
            core.setInputVideoTrack(inputVideoTrack);
            log("Input video track set on core");
        }
    } catch (error) {
        log("Failed to start Astraea Core: " + error);
    } finally {
        isInitializing = false;
    }
};

export const autoRun = async () => {
    await initCore();

    try {
        await ensureMediaTracks();
    } catch (error) {
        log(`Failed to get media: ${error}`);
    }
};


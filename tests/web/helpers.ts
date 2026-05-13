import type { TsStatus } from "@astraea/interface";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import "../playground/src/window.d.ts";

/**
 * Inject a Web Audio API override so that any `getUserMedia({ audio: true })`
 * or `getUserMedia({ video: true })` call inside the page returns a **continuously-running test media**
 * instead of the default Chrome fake device. The test audio consists of a
 * continuous sine wave AND a synthetic kick drum burst. The test video consists of
 * a 1920x1080 canvas mimicking ffmpeg's testsrc.
 *
 * Mechanism:
 *  1. `page.addInitScript` runs the injected code in the renderer process
 *     *before* any page script.
 *  2. An `AudioBufferSourceNode` filled with mathematically generated sine + kick
 *     data loops infinitely into a `MediaStreamDestinationNode`.
 *  3. A `HTMLCanvasElement` draws testsrc pattern with scrolling color bars and a timer,
 *     captured into a video stream.
 *  4. Overrides `getUserMedia` to return these tracks instead of hardware devices.
 *
 * Must be called **before** `page.goto()`.
 *
 * @param page      - Playwright `Page` instance.
 * @param media     - Media type to inject: 'audio', 'video', or 'both' (default: 'both').
 */
export async function injectTestMedia(page: Page, media: 'audio' | 'video' | 'both' = 'both'): Promise<void> {
    await page.exposeFunction('__trustedClick', async () => {
        await page.click('body');
    });

    await page.addInitScript((opts: { media: 'audio' | 'video' | 'both' }) => {
        const { media } = opts;
        const testCtx = new AudioContext({ sampleRate: 48000 });
        const bpm = 60;
        const sineFreq = 440;
        
        let testAudioDst: MediaStreamAudioDestinationNode | null = null;
        let testVideoDst: MediaStream | null = null;

        // --- Setup Test Audio ---
        if (media === 'audio' || media === 'both') {
            const sampleRate = testCtx.sampleRate;
            const samplesPerBeat = Math.floor(sampleRate * (60 / bpm));
            const buffer = testCtx.createBuffer(1, samplesPerBeat, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < samplesPerBeat; i++) {
                const t = i / sampleRate;
                // 1. Continuous sine wave (20% volume)
                let sample = Math.sin(2 * Math.PI * sineFreq * t) * 0.2;

                // 2. Full-spectrum synthetic burst (80% volume, first 100ms of every beat)
                // By mixing white noise with the low frequency punch, it spans all frequency bins.
                if (t < 0.1) {
                    const env = Math.exp(-t * 50); // fast decay
                    const kickPhase = 2 * Math.PI * 120 * t; // 120Hz base low freq punch
                    const lowPunch = Math.sin(kickPhase);
                    const noise = Math.random() * 2 - 1; // white noise covers the entire spectrum
                    
                    // Mix 50% low thump and 50% broadband noise
                    sample += (lowPunch * 0.5 + noise * 0.5) * env * 0.8;
                }
                data[i] = sample;
            }

            const source = testCtx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            testAudioDst = testCtx.createMediaStreamDestination();
            source.connect(testAudioDst);
            source.start();
        }

        // --- Setup Test Video ---
        if (media === 'video' || media === 'both') {
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 1920;
            testCanvas.height = 1080;
            const testCanvasCtx = testCanvas.getContext('2d')!;
            
            // Colors for testsrc bars
            const colors = [
                'rgb(255, 255, 255)', // White
                'rgb(255, 255,   0)', // Yellow
                'rgb(  0, 255, 255)', // Cyan
                'rgb(  0, 255,   0)', // Green
                'rgb(255,   0, 255)', // Magenta
                'rgb(255,   0,   0)', // Red
                'rgb(  0,   0, 255)'  // Blue
            ];
            const barWidth = testCanvas.width / colors.length;

            // Start drawing frame
            let startTimestamp: number | null = null;
            let lastRenderTime = performance.now();
            const durationLength = 10000; // 10 seconds iteration

            function renderFrame(timestamp: number) {
                requestAnimationFrame(renderFrame);
                // Cap to ~30fps equivalent to save some CPU if needed, 
                // but for simplicity we can just render as fast as rAF gives us.
                
                if (!startTimestamp) startTimestamp = timestamp;
                const elapsed = timestamp - startTimestamp;
                // 10s loop
                const loopElapsed = elapsed % durationLength; 

                // Scroll offset
                // let's do a scrolling gradient bar from left to right every 10s
                // full width scroll in 10s
                const scrollOffset = (loopElapsed / durationLength) * testCanvas.width;

                testCanvasCtx.clearRect(0, 0, testCanvas.width, testCanvas.height);

                // Draw color bars
                for (let i = 0; i < colors.length; i++) {
                    testCanvasCtx.fillStyle = colors[i];
                    testCanvasCtx.fillRect(i * barWidth, 0, barWidth, testCanvas.height);
                }
                
                // Draw scrolling colored rectangle on top
                testCanvasCtx.fillStyle = 'rgba(0,0,0,0.5)';
                const rectW = 200;
                const rectX = scrollOffset % (testCanvas.width + rectW) - rectW;
                testCanvasCtx.fillRect(rectX, 0, rectW, testCanvas.height);
                
                // Draw moving rect mimicking ffmpeg testsrc's square
                const squareSize = 256;
                const seqX = ((loopElapsed / durationLength) * testCanvas.width * 2) % testCanvas.width;
                testCanvasCtx.fillStyle = 'green';
                testCanvasCtx.fillRect(seqX - squareSize/2, testCanvas.height/2 - squareSize/2, squareSize, squareSize);

                // Draw timer
                testCanvasCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                testCanvasCtx.fillRect(100, 100, 700, 150);
                
                testCanvasCtx.fillStyle = 'white';
                testCanvasCtx.font = '100px monospace';
                const secondsRaw = loopElapsed / 1000;
                const timeStr = secondsRaw.toFixed(3).padStart(6, '0');
                testCanvasCtx.fillText(`T: ${timeStr} s`, 120, 200);
            }
            requestAnimationFrame(renderFrame);

            testVideoDst = testCanvas.captureStream(30);
        }

        // --- Override getUserMedia ---
        const _originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
            navigator.mediaDevices
        );

        navigator.mediaDevices.getUserMedia = async (
            constraints?: MediaStreamConstraints | null
        ): Promise<MediaStream> => {
            const tracks: MediaStreamTrack[] = [];
            let requestingMockAudio = false;
            let requestingMockVideo = false;

            if (constraints?.audio && (media === 'audio' || media === 'both') && testAudioDst) {
                console.log('getUserMedia override: providing synthetic test audio track (sine + kick)');
                if (testCtx.state !== "running") {
                    await (window as any).__trustedClick();
                    console.log('Resuming AudioContext for synthetic test audio');
                    await testCtx.resume();
                }
                tracks.push(testAudioDst.stream.getAudioTracks()[0]);
                requestingMockAudio = true;
            }

            if (constraints?.video && (media === 'video' || media === 'both') && testVideoDst) {
                console.log('getUserMedia override: providing synthetic test video track (canvas testsrc)');
                tracks.push(testVideoDst.getVideoTracks()[0]);
                requestingMockVideo = true;
            }

            if (!requestingMockAudio && !requestingMockVideo) {
                return _originalGetUserMedia(constraints ?? undefined);
            }

            return new MediaStream(tracks);
        };
    }, { media });
}

/**
 * this log function will cover the `log` func defined in page,
 * leading to no log info displayed in page's log section
 * @param page 
 * @param hostname 
 */
export async function exposeLog(page: Page, hostname?: string): Promise<void> {
    await page.exposeFunction("log", (content: string) => {
        if (!hostname) {
            console.log(content);
        } else {
            console.log(`[${hostname}]`, content);
        }
    });
}

/**
 * Navigate to baseURL and wait until the Tailscale node is fully online
 * (BackendState === "Running" && Self.Online === true).
 *
 * Also forwards node-state DOM mutations to the test runner via console.log
 * so they appear in Playwright's output.
 *
 * @param hostname - Optional node hostname passed to the playground via ?hostname=.
 *                   Defaults to "Astraea-playground" when omitted.
 * @returns The TSStatus snapshot at the moment the node came online.
 */
export async function waitForLogin(page: Page, baseURL: string, hostname?: string): Promise<{ peerIP: string; tsStatus: TsStatus }> {
    const url = hostname
        ? `${baseURL}?hostname=${encodeURIComponent(hostname)}`
        : baseURL;

    await page.goto(url, { waitUntil: "domcontentloaded" });

    const handle = await page.waitForFunction(
        ({ BackendState, Online }) => {
            const res = window.__APP_STORE__?.get('tsStatus');
            const isPass =
                res?.BackendState === BackendState && res?.Self?.Online === Online;
            if (isPass) {
                return res;
            }
        },
        { BackendState: "Running", Online: true },
        { timeout: 20_000 } // allow at least 12 s for tailscale init and login
    );
    const tsStatus = await handle.jsonValue() as TsStatus;

    // Validate peer IP is a valid IPv4 address
    const peerIP = tsStatus?.Self?.TailscaleIPs?.[0];
    expect(peerIP).toBeTruthy();
    expect(peerIP).toMatch(/^\d+\.\d+\.\d+\.\d+$/);

    return {
        peerIP,
        tsStatus
    };
}

/**
 * Wait for a node to establish connection with a specific peer.
 *
 * @param page - The node's page
 * @param peerIP - The expected peer's Tailscale IP
 * @param timeoutMs - Connection timeout in milliseconds (default: 60000)
 */
export async function waitForPeerDiscovery(
    page: Page,
    peerIP: string,
    timeoutMs = 60000
): Promise<void> {
    await page.waitForFunction(
        (ip: string) => window.__APP_STORE__?.get('connectedPeers')?.has(ip),
        peerIP,
        { timeout: timeoutMs }
    );
}

export async function waitForRelayConnection(
    page: Page,
    peerIP: string,
    timeoutMs = 60000
): Promise<void> {
    await page.waitForFunction(
        (peerIP: string) => {
            const peers = window.__APP_STORE__?.get('connectedPeers');
            const status = peers ? peers.get(peerIP) : null;
            return status && status.relayStatus === "connected";
        },
        peerIP,
        { timeout: timeoutMs }
    );
}

export async function waitForDirectConnection(
    page: Page,
    peerIP: string,
    timeoutMs = 60000
): Promise<void> {
    await page.waitForFunction(
        (peerIP: string) => {
            const peers = window.__APP_STORE__?.get('connectedPeers');
            const status = peers ? peers.get(peerIP) : null;
            return status && status.directStatus === "connected";
        },
        peerIP,
        { timeout: timeoutMs }
    );
}

export async function waitForStore(page: Page): Promise<any> {
    const store = await page.waitForFunction(() => window.__APP_STORE__, { timeout: 10000 });
    if (!store) throw new Error('Store not found');
    return store;
}
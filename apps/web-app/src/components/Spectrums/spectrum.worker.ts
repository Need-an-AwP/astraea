import * as Comlink from 'comlink';
import {
    AUDIO_FREQUENCY_DATA_EVENT,
    type AudioDataEvent
} from '@/AudioEngine/workerEvents';

export type SpectrumRendererWorker = {
    init(canvas: OffscreenCanvas, width: number, height: number): void;
    resize(width: number, height: number): void;
};

let ctx: OffscreenCanvasRenderingContext2D | null = null;
let canvasWidth = 0;
let canvasHeight = 0;
let latestData: Uint8Array<ArrayBuffer> | null = null;

const drawFrame = (data: Uint8Array<ArrayBuffer>) => {
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (data && data.length > 0) {
        const step = Math.max(1, Math.floor(data.length / 48));
        const bars = Math.ceil(data.length / step);
        const barWidth = canvasWidth / bars;

        ctx.fillStyle = '#22c55e';
        for (let i = 0; i < bars; i++) {
            const value = data[i * step] ?? 0;
            const barHeight = (value / 255) * canvasHeight;
            const x = i * barWidth;
            const y = canvasHeight - barHeight;
            ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
        }
    }
};

self.addEventListener('message', (event: MessageEvent<AudioDataEvent>) => {
    if (event.data?.type !== AUDIO_FREQUENCY_DATA_EVENT) return;
    latestData = event.data.payload;
    if (!ctx) return;
    drawFrame(latestData);
});

Comlink.expose({
    init(canvas: OffscreenCanvas, width: number, height: number) {
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = width;
        canvas.height = height;
        canvasWidth = width;
        canvasHeight = height;
        ctx = context;
        if (latestData) {
            drawFrame(latestData);
        }
    },

    resize(width: number, height: number) {
        if (!ctx) return;
        const canvas = ctx.canvas;
        canvas.width = width;
        canvas.height = height;
        canvasWidth = width;
        canvasHeight = height;
    },
} satisfies SpectrumRendererWorker);

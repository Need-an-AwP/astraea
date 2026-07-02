import { useEffect, useRef } from 'react';
import * as Comlink from 'comlink';
import { AudioEngine } from '@/AudioEngine';
import type { SpectrumRendererWorker } from './spectrum.worker';
import { cn } from '@/lib/utils';

type SpectrumProps = {
    className?: string;
};

export default function Spectrum({ className }: SpectrumProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const rendererRef = useRef<Comlink.Remote<SpectrumRendererWorker> | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // create canvas
        const canvas = document.createElement('canvas');
        canvas.className = "block w-full h-full";
        container.appendChild(canvas);

        if (typeof canvas.transferControlToOffscreen !== 'function') {
            console.error('Canvas does not support transferControlToOffscreen');
            return;
        }

        // get initial size
        const rect = container.getBoundingClientRect();
        const initialWidth = rect.width > 0 ? rect.width : 320;
        const initialHeight = rect.height > 0 ? rect.height : 120;
        canvas.width = initialWidth;
        canvas.height = initialHeight;

        // create worker
        const worker = new Worker(new URL('./spectrum.worker.ts', import.meta.url), { type: 'module' });
        workerRef.current = worker;

        // create worker proxy
        const renderer = Comlink.wrap<SpectrumRendererWorker>(worker);
        rendererRef.current = renderer;

        // subscribe data source
        AudioEngine.audioData.subscribeOutputData(worker);

        const offscreenCanvas = canvas.transferControlToOffscreen();

        // init worker
        void renderer.init(
            Comlink.transfer(offscreenCanvas, [offscreenCanvas]),
            initialWidth,
            initialHeight
        );

        // 使用 ResizeObserver 监听外层 div 的动态尺寸变化 (适配 tailwind 响应式类如 w-full)
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    const currentRenderer = rendererRef.current;
                    if (currentRenderer) {
                        // 通知 worker 更新绘制分辨率
                        void currentRenderer.resize(width, height);
                    }
                }
            }
        });
        resizeObserver.observe(container);

        return () => {
            // clean canvas
            if (container.contains(canvas)) {
                container.removeChild(canvas);
            }

            // stop listening size change
            resizeObserver.disconnect();

            // clean comlink proxy
            const renderer = rendererRef.current;
            if (renderer) {
                renderer[Comlink.releaseProxy]();
            }
            // clean worker
            const worker = workerRef.current;
            if (worker) {
                AudioEngine.audioData.unsubscribeOutputData(worker);
                worker.terminate();
            }

            workerRef.current = null;
            rendererRef.current = null;
        }
    }, [])

    return (
        <div
            className={cn("block relative overflow-hidden", className)}
            ref={containerRef}
        />
    );
}

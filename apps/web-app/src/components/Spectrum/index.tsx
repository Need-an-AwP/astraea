import { useEffect, useRef } from 'react';
import { useAnimationFrame } from 'framer-motion';
import { AudioEngine } from '@/AudioEngine';

type SpectrumProps = {
    width?: number;
    height?: number;
};

export default function Spectrum({ width = 320, height = 120 }: SpectrumProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        contextRef.current = ctx;
        return () => {
            contextRef.current = null;
        };
    }, []);

    useAnimationFrame(() => {
        const ctx = contextRef.current;
        if (!ctx) return;
        const data = AudioEngine.instance.getDestinationByteFrequencyData();

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        if (data && data.length > 0) {
            const step = Math.max(1, Math.floor(data.length / 48));
            const bars = Math.ceil(data.length / step);
            const barWidth = width / bars;

            ctx.fillStyle = '#22c55e';
            for (let i = 0; i < bars; i++) {
                const value = data[i * step] ?? 0;
                const barHeight = (value / 255) * height;
                const x = i * barWidth;
                const y = height - barHeight;
                ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
            }
        }
    });

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ display: 'block', borderRadius: 8 }}
        />
    );
}

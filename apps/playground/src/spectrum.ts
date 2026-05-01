export class SpectrumVisualizer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private audioCtx: AudioContext;
    private analyser: AnalyserNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private animationId: number = 0;
    private bars: number;
    private color: string;

    constructor(
        container: HTMLElement,
        audioCtx: AudioContext,
        options: { bars?: number; color?: string } = {}
    ) {
        this.audioCtx = audioCtx;
        this.bars = options.bars ?? 128;
        this.color = options.color ?? '#4CAF50';
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = container.clientWidth || 300;
        this.canvas.height = container.clientHeight || 100;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        
        container.innerHTML = '';
        container.appendChild(this.canvas);
        
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Failed to get 2d context");
        this.ctx = ctx;

        const ro = new ResizeObserver(() => {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        });
        ro.observe(container);
    }

    public setTrack(track: MediaStreamTrack | null) {
        this.stop();
        if (!track) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const stream = new MediaStream([track]);
        this.source = this.audioCtx.createMediaStreamSource(stream);
        this.analyser = this.audioCtx.createAnalyser();
        
        // Determine fftSize (needs to be power of 2, at least bars * 2)
        let fftSize = 32;
        while (fftSize < this.bars * 2) fftSize *= 2;
        this.analyser.fftSize = Math.min(fftSize, 32768);
        
        this.source.connect(this.analyser);
        
        this.draw();
    }

    private draw = () => {
        if (!this.analyser) return;

        this.animationId = requestAnimationFrame(this.draw);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.clearRect(0, 0, width, height);

        // Calculate and draw total energy background
        let totalVal = 0;
        for (let i = 0; i < dataArray.length; i++) {
            totalVal += dataArray[i];
        }
        const avgEnergy = totalVal / dataArray.length;
        const energyHeight = (avgEnergy / 255) * height;

        this.ctx.globalAlpha = 0.2;
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(0, height - energyHeight, width, energyHeight);
        this.ctx.globalAlpha = 1.0;

        const step = this.analyser.frequencyBinCount / this.bars;
        const barWidth = (width / this.bars);
        let x = 0;

        this.ctx.fillStyle = this.color;

        for (let i = 0; i < this.bars; i++) {
            // Average the data for each bar
            let sum = 0;
            const startIdx = Math.floor(i * step);
            const endIdx = Math.floor((i + 1) * step) || startIdx + 1;
            for(let j = startIdx; j < endIdx; j++) {
                sum += dataArray[j];
            }
            const avg = sum / (endIdx - startIdx);
            
            const barHeight = (avg / 255) * height;
            this.ctx.fillRect(x, height - barHeight, barWidth - 1 > 0 ? barWidth - 1 : barWidth, barHeight);
            x += barWidth;
        }
    }

    public stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = 0;
        }
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

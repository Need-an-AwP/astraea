export class AudioPlayback {
    private element: HTMLAudioElement;
    private stream: MediaStream;

    constructor(stream: MediaStream) {
        this.stream = stream;
        this.element = new Audio();
        this.element.id = 'global-audio-player';
        this.element.srcObject = stream
        this.element.controls = false;
        this.element.muted = false;
        this.element.autoplay = false;
    }

    public play() {
        try {
            this.element.play();
        } catch (error) {
            console.error('Failed to play audio on global element:', error);
        }
    }

    public pause() {
        try {
            this.element.pause();
        } catch (error) {
            console.error('Failed to pause audio on global element:', error);
        }
    }

    public updateAudioSource(newStream: MediaStream): void {
        this.element.srcObject = newStream;
    }

    public async setOutputDevice(deviceId: string){
        if (!deviceId) return;

        try {
            await this.element.setSinkId(deviceId);
        } catch (error) {
            console.error('Failed to set output device:', error);
        }
    }
}
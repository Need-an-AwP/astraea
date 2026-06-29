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

    public setOutputDevice(deviceId: string){
        if (!deviceId) return;

        this.element.setSinkId(deviceId)
            .then(() => {
                console.log('Output device set to:', deviceId);
            })
            .catch((error) => {
                console.error('Failed to set output device:', error);
            });
    }
}
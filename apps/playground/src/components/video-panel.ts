import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { store } from '../services/store';

@customElement('video-panel')
export class VideoPanel extends LitElement {
    static styles = css`
        .container {
            display: flex; gap: 10px; height: 100%; width: 100%;
        }
        .box {
            flex: 1; border: 1px dashed #666; display: flex; align-items: center; justify-content: center; background: transparent; color: #333; overflow: hidden; position: relative;
        }
        .placeholder {
            position: absolute; opacity: 0.3; pointer-events: none;
            z-index: 10;
        }
        video {
            width: 100%;
            height: 100%;
            object-fit: contain;
            opacity: 0.8;
        }
    `;

    @query('video') videoElement!: HTMLVideoElement;

    @state() private inputTrack = store.get('inputVideoTrack');

    connectedCallback() {
        super.connectedCallback();
        store.addEventListener('update', this.onUpdate);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.removeEventListener('update', this.onUpdate);
        this.clearVideo();
    }

    private onUpdate = (e: Event) => {
        const { key, value } = (e as CustomEvent).detail;
        if (key === 'inputVideoTrack') {
            this.inputTrack = value;
            this.updateVideo();
        }
    };

    private clearVideo() {
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    }

    private updateVideo() {
        if (!this.videoElement) return; // might not be mounted yet
        if (this.inputTrack) {
            this.videoElement.srcObject = new MediaStream([this.inputTrack]);
            this.videoElement.play().catch(err => console.error("Error playing video:", err));
        } else {
            this.clearVideo();
        }
    }

    protected firstUpdated(): void {
        this.updateVideo();
    }

    render() {
        return html`
            <div class="container">
                <div class="box">
                    ${!this.inputTrack ? html`<span class="placeholder">Input Video Placeholder</span>` : ''}
                    <video id="localVideo" autoplay muted playsinline></video>
                </div>
            </div>
        `;
    }
}

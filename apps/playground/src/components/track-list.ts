import { LitElement, html, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { store } from '../services/store';
import { SpectrumVisualizer } from '../spectrum';
import { globalAudioManager } from '../audioManager';

@customElement('remote-track-item')
export class RemoteTrackItem extends LitElement {
    static styles = css`
        .wrapper {
            display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 10px; border: 1px solid #ddd; padding: 10px; border-radius: 4px;
        }
        .label { flex: 1; font-weight: bold; }
        .spectrum { width: 100%; height: 50px; border: 1px solid #ccc; }
        video { width: 100%; max-height: 240px; background: #000; }
    `;

    @property({ type: Object }) track!: MediaStreamTrack;
    @property({ type: String }) peerIP!: string;
    @property({ type: String }) path!: string;

    @query('.spectrum') spectrumContainer?: HTMLDivElement;
    @query('audio') audioEl?: HTMLAudioElement;
    @query('video') videoEl?: HTMLVideoElement;

    private spectrum: SpectrumVisualizer | null = null;
    private stream: MediaStream | null = null;

    protected firstUpdated() {
        this.stream = new MediaStream([this.track]);
        
        if (this.track.kind === 'audio') {
            if (this.audioEl) {
                this.audioEl.srcObject = this.stream;
            }
            this.initSpectrum();
        } else if (this.track.kind === 'video') {
            if (this.videoEl) {
                this.videoEl.srcObject = this.stream;
            }
        }
    }

    private async initSpectrum() {
        if (!this.spectrumContainer) return;
        const audioCtx = await globalAudioManager.getContext();
        this.spectrum = new SpectrumVisualizer(this.spectrumContainer, audioCtx, { bars: 64, color: '#2196F3' });
        this.spectrum.setTrack(this.track);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.spectrum) {
            this.spectrum.setTrack(null);
            this.spectrum = null;
        }
        if (this.audioEl) {
            this.audioEl.srcObject = null;
        }
        if (this.videoEl) {
            this.videoEl.srcObject = null;
        }
    }

    render() {
        if (this.track.kind === 'audio') {
            return html`
                <div class="wrapper">
                    <div class="label">${this.peerIP} (${this.path}) [Audio]</div>
                    <audio autoplay controls muted></audio>
                    <div class="spectrum"></div>
                </div>
            `;
        } else if (this.track.kind === 'video') {
            return html`
                <div class="wrapper">
                    <div class="label">${this.peerIP} (${this.path}) [Video]</div>
                    <video autoplay controls playsinline></video>
                </div>
            `;
        } else {
            return html`<div>Unknown track kind: ${this.track.kind}</div>`;
        }
    }
}

@customElement('track-list')
export class TrackList extends LitElement {
    static styles = css`
        .container { flex: 1; border: 1px solid #ccc; padding: 10px; overflow-y: auto; }
        h3 { margin-top: 0; }
        h4 { margin-top: 15px; margin-bottom: 10px; }
    `;

    @state() private remoteAudioTracks = store.get('remoteAudioTracks');
    @state() private remoteVideoTracks = store.get('remoteVideoTracks');

    connectedCallback() {
        super.connectedCallback();
        store.addEventListener('update', this.onUpdate);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.removeEventListener('update', this.onUpdate);
    }

    private onUpdate = (e: Event) => {
        const { key, value } = (e as CustomEvent).detail;
        if (key === 'remoteAudioTracks') {
            this.remoteAudioTracks = value;
            this.requestUpdate();
        } else if (key === 'remoteVideoTracks') {
            this.remoteVideoTracks = value;
            this.requestUpdate();
        }
    };

    render() {
        return html`
            <div class="container">
                <h3>Remote Tracks</h3>
                
                ${this.remoteVideoTracks && this.remoteVideoTracks.length > 0 ? html`
                    <h4>Video Tracks</h4>
                    <div>
                        ${this.remoteVideoTracks.map((t: any) => html`
                            <remote-track-item .track=${t.track} .peerIP=${t.peerIP} .path=${t.path}></remote-track-item>
                        `)}
                    </div>
                ` : ''}

                ${this.remoteAudioTracks && this.remoteAudioTracks.length > 0 ? html`
                    <h4>Audio Tracks</h4>
                    <div>
                        ${this.remoteAudioTracks.map((t: any) => html`
                            <remote-track-item .track=${t.track} .peerIP=${t.peerIP} .path=${t.path}></remote-track-item>
                        `)}
                    </div>
                ` : ''}
            </div>
        `;
    }
}

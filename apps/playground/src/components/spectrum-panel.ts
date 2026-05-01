import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { store } from '../services/store';
import { SpectrumVisualizer } from '../spectrum';
import { globalAudioManager } from '../audioManager';

@customElement('spectrum-panel')
export class SpectrumPanel extends LitElement {
    static styles = css`
        .container {
            display: flex; gap: 10px; height: 100%; width: 100%;
        }
        .box {
            flex: 1; border: 1px dashed #666; display: flex; align-items: center; justify-content: center; background: transparent; color: #333; overflow: hidden; position: relative;
        }
        .placeholder {
            position: absolute; opacity: 0.3; pointer-events: none;
        }
    `;

    @query('#input-container') inputContainer!: HTMLDivElement;
    @query('#output-container') outputContainer!: HTMLDivElement;

    @state() private inputTrack = store.get('inputAudioTrack');

    private inputSpectrum: SpectrumVisualizer | null = null;

    connectedCallback() {
        super.connectedCallback();
        store.addEventListener('update', this.onUpdate);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.removeEventListener('update', this.onUpdate);
        if (this.inputSpectrum) {
            this.inputSpectrum.setTrack(null);
            this.inputSpectrum = null;
        }
    }

    private onUpdate = (e: Event) => {
        const { key, value } = (e as CustomEvent).detail;
        if (key === 'inputAudioTrack') {
            const oldVal = this.inputTrack;
            this.inputTrack = value;
            if (this.inputTrack !== oldVal) this.updateInputSpectrum();
        }
    };

    private async updateInputSpectrum() {
        if (!this.inputContainer) return; // might not be mounted yet
        if (!this.inputSpectrum && this.inputTrack) {
            const audioCtx = await globalAudioManager.getContext();
            this.inputSpectrum = new SpectrumVisualizer(this.inputContainer, audioCtx, { bars: 128, color: '#4CAF50' });
        }
        if (this.inputSpectrum) {
            this.inputSpectrum.setTrack(this.inputTrack);
        }
    }

    protected firstUpdated(): void {
        this.updateInputSpectrum();
    }

    render() {
        return html`
            <div class="container">
                <div id="input-container" class="box">
                    <span class="placeholder">Input Spectrum Placeholder</span>
                </div>
            </div>
        `;
    }
}

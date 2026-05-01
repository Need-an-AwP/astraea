import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { store } from '../services/store';
import { toggleLoopback } from '../services/astraea-client';

@customElement('device-panel')
export class DevicePanel extends LitElement {
    static styles = css`
        .container {
            display: flex; flex-direction: column; gap: 10px;
        }
        .box {
            flex: 1; border: 1px solid #ccc; padding: 10px;
        }
        button { margin-left: 8px; }
    `;

    @state() private inputDevice = store.get('inputDevice');
    @state() private outputDevice = store.get('outputDevice');
    @state() private loopbackEnabled = store.get('loopbackEnabled');

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
        if (key === 'inputDevice') this.inputDevice = value;
        if (key === 'outputDevice') this.outputDevice = value;
        if (key === 'loopbackEnabled') this.loopbackEnabled = value;
    };

    render() {
        return html`
            <div class="container">
                <div class="box">
                    <strong>Input Device:</strong> <span id="input-device">${this.inputDevice}</span>
                    <button id="loopback-toggle" @click=${toggleLoopback}>
                        Loopback: ${this.loopbackEnabled ? "On" : "Off"}
                    </button>
                </div>
                <div class="box">
                    <strong>Output Device:</strong> <span id="output-device">${this.outputDevice}</span>
                </div>
            </div>
        `;
    }
}

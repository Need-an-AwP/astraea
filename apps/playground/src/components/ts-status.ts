import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { store } from '../services/store';

@customElement('ts-status')
export class TsStatus extends LitElement {
    static styles = css`
        .container { border: 1px solid #ccc; padding: 10px; }
        h4 { margin: 0 0 8px 0; }
        .flex { display: flex; gap: 15px; flex-wrap: wrap; }
    `;

    @state() private tsStatus = store.get('tsStatus');

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
        if (key === 'tsStatus') {
            this.tsStatus = value;
            this.requestUpdate();
        }
    };

    render() {
        const status = this.tsStatus;
        if (!status) {
            return html`
                <div class="container">
                    <h4>Tailscale Status</h4>
                    <div class="flex">
                        <div><strong>Backend State:</strong> <span id="ts-backend-state">Unknown</span></div>
                        <div><strong>Tailscale IPs:</strong> <span id="ts-ips">None</span></div>
                        <div><strong>Network:</strong> <span id="ts-network">Not connected</span></div>
                        <div><strong>Health:</strong> <span id="ts-health">Checking...</span></div>
                        <div><strong>Self Node:</strong> <span id="ts-self">Unknown</span></div>
                        <div><strong>Relay:</strong> <span id="ts-relay">Unknown</span></div>
                    </div>
                </div>
            `;
        }

        const backendState = status.BackendState || 'Unknown';
        const ips = status.TailscaleIPs && status.TailscaleIPs.length > 0 ? status.TailscaleIPs.join(', ') : 'None';
        
        let network = 'Not connected';
        if (status.CurrentTailnet) {
            const netName = status.CurrentTailnet.Name || 'Unknown';
            const dns = status.CurrentTailnet.MagicDNSSuffix || '';
            network = dns ? `${netName} (${dns})` : netName;
        }

        let health = 'Healthy';
        let healthColor = '#51cf66';
        if (status.Health && status.Health.length > 0) {
            health = `Issues: ${status.Health.length}`;
            healthColor = '#ff6b6b';
        }

        let selfText = 'Unknown';
        let selfColor = '#666';
        let relay = 'Unknown';
        if (status.Self) {
            const hostname = status.Self.HostName || 'Unknown';
            const online = status.Self.Online ? 'Online' : 'Offline';
            selfText = `${hostname} (${online})`;
            selfColor = status.Self.Online ? '#51cf66' : '#ff6b6b';
            relay = status.Self.Relay || 'None';
        }

        return html`
            <div class="container">
                <h4>Tailscale Status</h4>
                <div class="flex">
                    <div><strong>Backend State:</strong> <span id="ts-backend-state">${backendState}</span></div>
                    <div><strong>Tailscale IPs:</strong> <span id="ts-ips">${ips}</span></div>
                    <div><strong>Network:</strong> <span id="ts-network">${network}</span></div>
                    <div><strong>Health:</strong> <span id="ts-health" style="color: ${healthColor}">${health}</span></div>
                    <div><strong>Self Node:</strong> <span id="ts-self" style="color: ${selfColor}">${selfText}</span></div>
                    <div><strong>Relay:</strong> <span id="ts-relay">${relay}</span></div>
                </div>
            </div>
        `;
    }
}

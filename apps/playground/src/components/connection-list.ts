import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { store } from '../services/store';

@customElement('connection-list')
export class ConnectionList extends LitElement {
    static styles = css`
        .container {
            flex: 2; border: 1px solid #ccc; padding: 10px; overflow-y: auto;
        }
        h3 { margin-top: 0; }
        .item {
            margin-bottom: 10px; padding: 5px; border: 1px solid #eee;
        }
    `;

    @state() private connectedPeers = new Map(store.get('connectedPeers'));

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
        if (key === 'connectedPeers') {
            this.connectedPeers = new Map(value);
        }
    };

    render() {
        return html`
            <div class="container">
                <h3>Connections</h3>
                <div>
                    ${Array.from(this.connectedPeers.entries())
                .map(([peerIP, status]) => {
                    if (status === null) return;
                    return html`
                        <div class="item">
                            <strong>${peerIP}</strong>
                            <br/>
                            Relay: ${status.relayStatus} 
                            <br/>
                            Direct: ${status.directStatus} 
                            <br/>
                            Active Path: ${status.activePath}
                        </div>
                    `})}
                </div>
            </div>
        `;
    }
}

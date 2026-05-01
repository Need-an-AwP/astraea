import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { store } from '../services/store';

@customElement('log-viewer')
export class LogViewer extends LitElement {
    static styles = css`
        .container {
            flex: 1; border: 1px solid #ccc; padding: 10px; display: flex; flex-direction: column; overflow: hidden;
        }
        h3 { margin-top: 0; }
        pre {
            flex: 1; overflow-y: auto; margin: 0; font-size: 12px; white-space: pre-wrap; word-wrap: break-word;
        }
    `;

    @state() private logs = store.get('logs');

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
        if (key === 'logs') {
            this.logs = value;
            this.requestUpdate();
        }
    };

    render() {
        return html`
            <div class="container">
                <h3>Logs</h3>
                <pre>${this.logs.join('\n')}</pre>
            </div>
        `;
    }
}

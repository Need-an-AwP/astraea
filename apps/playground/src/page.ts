import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import './components/device-panel';
import './components/spectrum-panel';
import './components/video-panel';
import './components/connection-list';
import './components/track-list';
import './components/log-viewer';
import './components/ts-status';

@customElement('app-layout')
export class AppLayout extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100vh;
            padding: 10px;
            box-sizing: border-box;
            gap: 10px;
        }
        .middle-section {
            height:100%; 
            display: flex;
            gap: 10px;
            flex: 1;
            min-height: 0;
        }
        .media-row {
            display: flex;
            gap: 10px;
            width: 100%;
            height: 200px;
        }
        spectrum-panel {
            flex: 1;
        }
        video-panel {
            flex: 1;
        }
        connection-list {
            flex: 2;
        }
        track-list {
            flex: 1;
        }
        log-viewer {
            flex: 1;
        }
    `;

    render() {
        return html`
            <ts-status></ts-status>
            <device-panel></device-panel>
            <div class="media-row">
                <spectrum-panel></spectrum-panel>
                <video-panel></video-panel>
            </div>
            <div class="middle-section">
                <connection-list></connection-list>
                <track-list></track-list>
                <log-viewer></log-viewer>
            </div>
        `;
    }
}

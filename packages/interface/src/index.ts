import type { Status as TsStatus } from '../types/tailscale-ipnstate'
import type { AstraeaCore } from './core';
export type { TsStatus }
export type { PeerStatus } from '../types/tailscale-ipnstate'
export * from './core';
export * from './connection';
export * from '../types/Listener';
export * from './window';

export interface CoreConfig {
    authKey: string;
    hostname: string;
}

export interface AstraeaCoreOptions {
    forceRelayMedia?: boolean;
    rtcReportInterval?: number;
    videoTargetBitrate?: number;
}


export interface IAstraeaCore {
    init: (
        config: CoreConfig,
        options?: AstraeaCoreOptions
    ) => Promise<AstraeaCore>
}


import { Status as TsStatus } from '../types/tailscale-ipnstate'
import { AstraeaCore } from './core';
export { TsStatus }
export * from './core';
export * from './connection';
export * from '../types/Listener';
export * from './window';

export interface CoreConfig {
    authKey: string;
    hostname: string;
    // stateStorage?: IPNStateStorage;
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


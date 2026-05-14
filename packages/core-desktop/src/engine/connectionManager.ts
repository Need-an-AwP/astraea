import { EventEmitter } from "eventemitter3";
import { AstraeaConnection } from "../connection";

export const ConnectionManagerEvent = {
    connection: 'connection',
} as const

interface ConnectionManagerEvents {
    [ConnectionManagerEvent.connection]: (conn: AstraeaConnection) => void;
}

export class ConnectionManager extends EventEmitter<ConnectionManagerEvents> {
    private connections: Map<string, AstraeaConnection> = new Map();
    private inputAudioTrack: MediaStreamTrack | null = null;
    private inputVideoTrack: MediaStreamTrack | null = null;
    private coreInstance: any; // 保持对 AstraeaCore 的引用

    constructor(coreInstance: any) {
        super();
        this.coreInstance = coreInstance;
    }

    /**
     * 获取或创建与指定 Peer 的连接
     */
    public getConnection(peerIP: string): AstraeaConnection {
        let conn = this.connections.get(peerIP);
        if (!conn) {
            conn = new AstraeaConnection(peerIP, this.coreInstance);

            // add local track if exists
            if (this.inputAudioTrack) {
                conn.addLocalAudioTrack(this.inputAudioTrack);
            }
            if (this.inputVideoTrack) {
                conn.addLocalVideoTrack(this.inputVideoTrack);
            }

            // save connection
            this.connections.set(peerIP, conn);

            // emit connection event
            this.emit(ConnectionManagerEvent.connection, conn);
        }
        return conn;
    }

    /**
     * 获取所有连接
     */
    public getConnections(): Map<string, AstraeaConnection> {
        return this.connections;
    }

    /**
     * 移除对应 Peer 的连接记录
     */
    public removeConnection(peerIP: string): void {
        this.connections.delete(peerIP);
    }

    /**
     * 设置输入音频轨道到所有现有连接
     */
    public setInputAudioTrack(track: MediaStreamAudioTrack | null) {
        this.inputAudioTrack = track;

        // 添加到所有现有的连接
        this.connections.forEach((conn) => {
            conn.addLocalAudioTrack(track);
        });
    }

    /**
     * 获取当前输入音频轨道
     */
    public getInputAudioTrack(): MediaStreamTrack | null {
        return this.inputAudioTrack;
    }

    /**
     * 设置输入视频轨道到所有现有连接
     * @param track 
     */
    public setInputVideoTrack(track: MediaStreamVideoTrack | null) {
        this.inputVideoTrack = track;

        // 添加到所有现有的连接
        this.connections.forEach((conn) => {
            conn.addLocalVideoTrack(track);
        });
    }

    /**
     * 获取当前输入视频轨道
     * @returns 
     */
    public getInputVideoTrack(): MediaStreamTrack | null {
        return this.inputVideoTrack;
    }


    /**
     * 广播消息给所有连接
     */
    public broadcastMessage(data: Object, type: string): void {
        if (!data) return;

        this.connections.forEach((conn) => {
            conn.sendMessage(type, data);
        });
    }
}

import WebSocket from 'ws';

export type streamType = 'unknown' | 'depth' | 'trades' | 'kline' | 'ticker';

export interface Subscriber {
    streamKey: string;
    streamType: streamType;
    clientId: string;
    clientWs: WebSocket;
    onMessageTransform?: (data: any) => any;
}

export interface StreamMetadata {
    streamType: streamType;
    onMessageTransform?: (data: any) => any;
}

export interface SubscribePayload {
    clientId: string;
    clientWs: WebSocket;
    streams: Record<string, StreamMetadata>;
}
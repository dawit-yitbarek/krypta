import WebSocket from 'ws';
import { streamType } from './types/index.js';


interface StreamMetadata {
    streamType: streamType;
    onMessageTransform?: (data: any) => any;
}

export interface SubscribePayload {
    clientId: string;
    clientWs: WebSocket;
    streams: Record<string, StreamMetadata>;
}

class BinanceStreamManager {
    // Active subscriber map: streamKey -> Map<clientId, SubscriberConfig>
    private streamSubscribers: Map<string, Map<string, WebSocket>> = new Map();

    // Map streamKey -> StreamMetadata Stored once per stream
    private streamMeta: Map<string, StreamMetadata> = new Map();

    // Client lookup map: clientId -> Set<streamKey>
    private clientSubscriptions: Map<string, Set<string>> = new Map();

    // Single combined Binance connection & heartbeat tracking
    private binanceWs: WebSocket | null = null;
    private isConnected: boolean = false;
    private isAlive: boolean = true;
    private pingInterval: NodeJS.Timeout | null = null;

    // Retry management
    private retryTimer: NodeJS.Timeout | null = null;
    private retryCount: number = 0;
    private readonly MAX_RETRIES = 5;

    public subscribeBatch({ clientId, clientWs, streams }: SubscribePayload) {
        const newStreamKeys: string[] = []
        Object.entries(streams).forEach(([streamKey, config]) => {
            // 1. Track client's active streams
            if (!this.clientSubscriptions.has(clientId)) {
                this.clientSubscriptions.set(clientId, new Set());
            }
            this.clientSubscriptions.get(clientId)!.add(streamKey);

            // 2. Track stream metadata (only once per stream key)
            if (!this.streamMeta.has(streamKey)) {
                this.streamMeta.set(streamKey, { streamType: config.streamType, onMessageTransform: config.onMessageTransform });
            }

            // 3. Track stream subscribers
            if (!this.streamSubscribers.has(streamKey)) {
                this.streamSubscribers.set(streamKey, new Map());
                newStreamKeys.push(streamKey)
            }
            this.streamSubscribers.get(streamKey)!.set(clientId, clientWs);

        })

        // 4. Ensure the single combined connection is 
        this.ensureBinanceConnection(() => {
            // Callback executes when socket is OPEN
            if (newStreamKeys.length > 0) {
                this.sendBinanceCommand('SUBSCRIBE', newStreamKeys);
            }
        });

        // notify client the connection status
        const payload = {
            type: 'STREAM_CONNECTION_STATUS',
            status: "connected"
        };
        if (this.isConnected) {
            this.sendMessage(clientWs, payload);
        }
    }

    private ensureBinanceConnection(onOpen?: () => void) {
        if (this.binanceWs && this.binanceWs.readyState === WebSocket.OPEN) {
            if (onOpen) onOpen();
            return;
        }

        if (this.binanceWs && this.binanceWs.readyState === WebSocket.CONNECTING) {
            return;
        }

        this.binanceWs = new WebSocket('wss://stream.binance.com:9443/stream');

        this.binanceWs.on('open', () => {
            this.isConnected = true;
            this.retryCount = 0;
            this.startHeartbeat();

            // Re-subscribe to all active streams upon connect/reconnect
            const activeStreams = Array.from(this.streamSubscribers.keys());
            if (activeStreams.length > 0) {
                this.sendBinanceCommand('SUBSCRIBE', activeStreams);
            }

            // Notify clients of stream status
            this.notifyClientsConnectionStatus("connected");
        });

        this.binanceWs.on('pong', () => {
            this.isAlive = true;
        });

        this.binanceWs.on('message', (rawData) => {
            try {
                const parsed = JSON.parse(rawData.toString());

                if (!parsed.stream || !parsed.data) {
                    return
                };

                const streamKey = parsed.stream;
                const innerData = parsed.data;

                this.broadcast(streamKey, innerData);
            } catch (err: any) {
                console.error('[StreamManager] Error parsing combined payload:', err.message || err);
            }
        });

        this.binanceWs.on('error', (err) => {
            console.error('[StreamManager] Binance Stream Error:', err.message || err);
        });

        this.binanceWs.on('close', () => {
            this.isConnected = false;
            this.stopHeartbeat();
            this.handleReconnect();
        });
    }

    private handleReconnect() {
        if (this.streamSubscribers.size === 0) {
            return;
        }

        this.retryCount++;
        if (this.retryCount <= this.MAX_RETRIES) {
            const delay = Math.pow(2, this.retryCount) * 1000;

            this.retryTimer = setTimeout(() => {
                this.ensureBinanceConnection();
            }, delay);
        } else {
            this.notifyClientsConnectionStatus("disconnected", true);
        }
    }

    private notifyClientsConnectionStatus(status: 'connected' | 'disconnected', isError?: boolean) {
        const uniqueClients = new Set<WebSocket>();

        // Collect all unique client sockets across all streams
        this.streamSubscribers.forEach((subscribers) => {
            subscribers.forEach((clientWs) => {
                uniqueClients.add(clientWs);
            });
        });

        const payload = {
            type: 'STREAM_CONNECTION_STATUS',
            status: status,
            isError
        };

        uniqueClients.forEach((clientWs) => {
            this.sendMessage(clientWs, payload);
        });
    }

    public unsubscribeBatch(streamKeys: string[], clientId: string) {
        const binanceStreamsToUnsubscribe: string[] = [];

        streamKeys.forEach((streamKey) => {
            const subscribers = this.streamSubscribers.get(streamKey);
            if (subscribers) {
                subscribers.delete(clientId);

                // If no subscribers remain for this key add it
                if (subscribers.size === 0) {
                    binanceStreamsToUnsubscribe.push(streamKey);
                    this.streamSubscribers.delete(streamKey);
                    this.streamMeta.delete(streamKey);
                }
            }

            // Clean up client lookup
            const clientStreams = this.clientSubscriptions.get(clientId);
            if (clientStreams) {
                clientStreams.delete(streamKey);
                if (clientStreams.size === 0) {
                    this.clientSubscriptions.delete(clientId);
                }
            }
        });

        // Send one batched UNSUBSCRIBE command to Binance for all removed streams
        if (binanceStreamsToUnsubscribe.length > 0) {
            this.sendBinanceCommand('UNSUBSCRIBE', binanceStreamsToUnsubscribe);
        }

        // Close connection if total subscriptions drop to 0
        if (this.streamSubscribers.size === 0 && this.binanceWs) {
            if (this.retryTimer) {
                clearTimeout(this.retryTimer);
                this.retryTimer = null;
            }
            this.binanceWs.close();
            this.binanceWs = null;
        }
    }

    public disconnectClient(clientId: string) {
        const clientStreams = this.clientSubscriptions.get(clientId);
        if (!clientStreams) return;

        const streams = Array.from(clientStreams);
        this.unsubscribeBatch(streams, clientId)
    }

    private sendBinanceCommand(method: 'SUBSCRIBE' | 'UNSUBSCRIBE', streams: string[]) {
        if (this.binanceWs && this.binanceWs.readyState === WebSocket.OPEN) {
            this.binanceWs.send(
                JSON.stringify({
                    method,
                    params: streams,
                    id: Date.now(),
                })
            );
        }
    }

    private broadcast(streamKey: string, rawData: any) {
        const subscribers = this.streamSubscribers.get(streamKey);
        if (!subscribers || subscribers.size === 0) return;
        const meta = this.streamMeta.get(streamKey)
        const payload = meta?.onMessageTransform ? meta.onMessageTransform(rawData) : rawData

        subscribers.forEach((clientWs) => {
            this.sendMessage(clientWs, payload);
        });
    }

    private sendMessage(clientWs: WebSocket, message: any) {
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(message));
        }
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.isAlive = true;
        this.pingInterval = setInterval(() => {
            if (!this.isAlive) {
                this.binanceWs?.terminate();
                return;
            }
            this.isAlive = false;
            this.binanceWs?.ping();
        }, 30000);
    }

    private stopHeartbeat() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    public clearData() {
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }

        this.stopHeartbeat();

        if (this.binanceWs) {
            this.binanceWs.close();
            this.binanceWs = null;
        }

        this.streamSubscribers.clear();
        this.streamMeta.clear();
        this.clientSubscriptions.clear();
        this.retryCount = 0;
        this.isConnected = false;
    }
}

export const streamManager = new BinanceStreamManager();
import WebSocket from 'ws';
import { streamType } from './types/index.js';

interface Subscriber {
    streamKey: string;
    streamType: streamType
    clientId: string;
    clientWs: WebSocket;
    onMessageTransform?: (data: any) => any;
}

class BinanceStreamManager {
    private activeStreams: Map<string, WebSocket> = new Map();
    private streamSubscribers: Map<string, Map<string, WebSocket>> = new Map();

    // Track streams per client for automatic bulk cleanup
    private clientSubscriptions: Map<string, Set<string>> = new Map();

    // Track retry counts per stream
    private retryCounts: Map<string, number> = new Map();

    // Track active retry timers
    private retryTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly MAX_RETRIES = 5;

    public subscribe({ streamKey, streamType, clientId, clientWs, onMessageTransform }: Subscriber) {
        // Track client
        if (!this.clientSubscriptions.has(clientId)) {
            this.clientSubscriptions.set(clientId, new Set());
        }
        this.clientSubscriptions.get(clientId)!.add(streamKey);

        // Track stream
        if (!this.streamSubscribers.has(streamKey)) {
            this.streamSubscribers.set(streamKey, new Map());
        }
        this.streamSubscribers.get(streamKey)!.set(clientId, clientWs);

        // If a retry was scheduled for this stream, cancel it
        if (this.retryTimers.has(streamKey)) {
            clearTimeout(this.retryTimers.get(streamKey)!);
            this.retryTimers.delete(streamKey);
        }

        // Create upstream Binance connection if it doesn't exist
        if (!this.activeStreams.has(streamKey)) {
            this.connectToBinance(streamKey, streamType, onMessageTransform);
        } else {
            const payload = {
                type: 'STREAM_CONNECTION_STATUS',
                status: "connected",
                streamType: streamType,
                streamKey: streamKey,
            }
            this.sendMessage(clientWs, payload)
        }
    }

    private connectToBinance(streamKey: string, streamType: streamType, onMessageTransform?: (data: any) => any) {
        if (this.retryTimers.has(streamKey)) {
            clearTimeout(this.retryTimers.get(streamKey)!);
            this.retryTimers.delete(streamKey);
        }

        // console.log(`[StreamManager] Opening new Binance upstream: ${streamKey}`);
        const binanceWs = new WebSocket(`wss://stream.binance.com:9443/ws/${streamKey}`);

        let isAlive: boolean = true;
        let pingInterval: NodeJS.Timeout;

        binanceWs.on('open', () => {
            console.log(`[StreamManager] Binance stream connected: ${streamKey} type: ${streamType}`);
            const payload = {
                type: 'STREAM_CONNECTION_STATUS',
                status: "connected",
                streamType: streamType,
                streamKey: streamKey,
            }

            this.broadcast(streamKey, payload)

            this.retryCounts.set(streamKey, 0);

            isAlive = true;
            pingInterval = setInterval(() => {
                if (isAlive === false) {
                    console.warn(`[StreamManager] Heartbeat timed out for ${streamKey}. Terminating.`);
                    clearInterval(pingInterval);
                    return binanceWs.terminate();
                }

                isAlive = false;
                binanceWs.ping();
            }, 30000);
        });

        binanceWs.on('pong', () => {
            isAlive = true;
        });

        binanceWs.on('message', (rawData) => {
            try {
                const parsed = JSON.parse(rawData.toString());
                const payload = onMessageTransform ? onMessageTransform(parsed) : parsed;
                this.broadcast(streamKey, payload);
            } catch (err) {
                console.error(`Error processing stream ${streamKey}:`, err);
            }
        });

        binanceWs.on('error', (err) => {
            // console.error(`Binance Stream Error [${streamKey}]: ${err.message}`);
        });

        binanceWs.on('close', () => {
            this.activeStreams.delete(streamKey);
            clearInterval(pingInterval);

            const subscribers = this.streamSubscribers.get(streamKey);

            // If there are not any clients in this stream, abort cleanup
            if (!subscribers || subscribers.size === 0) {
                this.streamSubscribers.delete(streamKey);
                this.retryCounts.delete(streamKey);
                this.retryTimers.delete(streamKey);
                return;
            }

            // Increment retry attempt
            const currentAttempts = (this.retryCounts.get(streamKey) || 0) + 1;
            this.retryCounts.set(streamKey, currentAttempts);

            if (currentAttempts <= this.MAX_RETRIES) {
                // Exponential Backoff
                const delay = Math.pow(2, currentAttempts) * 1000;

                const timer = setTimeout(() => {
                    this.retryTimers.delete(streamKey);

                    if (!this.activeStreams.has(streamKey)) {
                        this.connectToBinance(streamKey, streamType, onMessageTransform);
                    }
                }, delay);
                this.retryTimers.set(streamKey, timer);
            } else {
                console.error(`[StreamManager] Max retries reached for ${streamKey}. Closing client connections.`);
                let errorMessage = `Market feed '${streamType}' is unavailable.`;

                switch (streamType) {
                    case 'depth':
                        errorMessage = "Failed to connect to the order book feed.";
                        break;
                    case 'trades':
                        errorMessage = "Failed to connect to the trades feed.";
                        break;
                    case 'kline':
                        errorMessage = "Failed to connect to the candles feed.";
                        break;
                    case 'ticker':
                        errorMessage = "Failed to connect to the ticker feed.";
                        break;
                }

                const payload = {
                    type: 'STREAM_ERROR',
                    streamType: streamType,
                    streamKey: streamKey,
                    errorMessage: errorMessage
                }

                this.broadcast(streamKey, payload)

                this.streamSubscribers.delete(streamKey);
                this.retryCounts.delete(streamKey);
            }
        });

        this.activeStreams.set(streamKey, binanceWs);
    }

    public unsubscribe(streamKey: string, clientId: string) {
        const subscribers = this.streamSubscribers.get(streamKey);
        if (subscribers) {
            subscribers.delete(clientId);

            if (subscribers.size === 0) {
                console.log(`[StreamManager] No subscribers for ${streamKey}. Closing Binance stream.`);
                const upstream = this.activeStreams.get(streamKey);
                if (upstream) {
                    upstream.close();
                    this.activeStreams.delete(streamKey);
                }
                if (this.retryTimers.has(streamKey)) {
                    clearTimeout(this.retryTimers.get(streamKey)!);
                    this.retryTimers.delete(streamKey);
                }
                this.streamSubscribers.delete(streamKey);
            }
        }

        // Clean up client record
        const clientStreams = this.clientSubscriptions.get(clientId);
        if (clientStreams) {
            clientStreams.delete(streamKey);
            if (clientStreams.size === 0) {
                this.clientSubscriptions.delete(clientId);
            }
        }
    }

    // Clean up all subscriptions for a client at once on disconnect
    public disconnectClient(clientId: string) {
        const clientStreams = this.clientSubscriptions.get(clientId);
        if (!clientStreams) return;

        // Clone set to avoid mutation during iteration
        const streams = Array.from(clientStreams);
        streams.forEach((streamKey) => {
            this.unsubscribe(streamKey, clientId);
        });
    }

    private broadcast(streamKey: string, message: any) {
        const subscribers = this.streamSubscribers.get(streamKey);
        if (!subscribers) return;

        const data = JSON.stringify(message);

        subscribers.forEach((clientWs) => {
            if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(data);
            }
        });
    }

    private sendMessage(clientWs: WebSocket, message: any) {
        const data = JSON.stringify(message);

        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data);
        }
    }

    public clearData() {
        // Clear pending reconnect timers
        this.retryTimers.forEach((timer) => clearTimeout(timer));
        this.retryTimers.clear();

        // Close upstream sockets
        this.activeStreams.forEach((ws) => ws.close());
        this.activeStreams.clear();

        this.streamSubscribers.clear();
        this.clientSubscriptions.clear();
        this.retryCounts.clear();
        console.log("Data Cleared")
    }
}

export const streamManager = new BinanceStreamManager();

// streamManager.clearData();
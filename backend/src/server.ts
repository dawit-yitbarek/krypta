import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import { streamType } from './types/index.js';
import { streamManager } from './binanceStreamManager.js';
import { Server } from 'http';

export const initializeWebSocketServer = (server: Server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        const clientId = crypto.randomUUID();
        let activeInterval = "";

        // Stream keys
        const tickerStream = `!miniTicker@arr`;
        let klineStream = "";

        // Reusable Subscription Handlers

        const subscribeTicker = () => {
            streamManager.subscribe({
                streamKey: tickerStream,
                streamType: "ticker",
                clientId,
                clientWs: ws,
                onMessageTransform: (tickerArray) => ({
                    type: 'TICKERS_UPDATE',
                    data: tickerArray.map((t: any) => ({
                        symbol: t.s.replace('USDT', '/USDT')?.toUpperCase(),
                        price: parseFloat(t.c),
                        changePct: t.o > 0 ? Number((((t.c - t.o) / t.o) * 100).toFixed(2)) : 0,
                        high24h: parseFloat(t.h),
                        low24h: parseFloat(t.l),
                        quoteVolume24h: parseFloat(t.q),
                        baseVolume24h: parseFloat(t.v),
                        direction: "neutral"
                    }))
                })
            });
        };

        const subscribeDepth = (symbol: streamType) => {
            if (!symbol) return;
            const formattedSymbol = symbol.toLowerCase();
            const depthStream = `${formattedSymbol}@depth20@100ms`;
            streamManager.subscribe({
                streamKey: depthStream,
                streamType: "depth",
                clientId,
                clientWs: ws,
                onMessageTransform: (data) => ({
                    type: 'ORDER_BOOK_UPDATE',
                    data: {
                        bids: processOrderbookLevels(data.bids),
                        asks: processOrderbookLevels(data.asks)
                    }
                })
            });
        };

        const subscribeTrades = (symbol: streamType) => {
            if (!symbol) return;
            const formattedSymbol = symbol.toLowerCase();
            const tradeStream = `${formattedSymbol}@aggTrade`;
            streamManager.subscribe({
                streamKey: tradeStream,
                streamType: "trades",
                clientId,
                clientWs: ws,
                onMessageTransform: (t) => ({
                    type: 'TRADE_UPDATE',
                    data: {
                        id: t.a,
                        price: parseFloat(t.p),
                        size: parseFloat(t.q),
                        time: new Date(t.E).toLocaleTimeString('en-GB', { hour12: false }),
                        side: t.m ? "sell" : "buy"
                    }
                })
            });
        };

        const subscribeKline = (interval: string | null, symbol: streamType) => {
            if (symbol && interval) {
                activeInterval = interval;
                const formattedSymbol = symbol.toLowerCase();
                klineStream = `${formattedSymbol}@kline_${interval}`;

                streamManager.subscribe({
                    streamKey: klineStream,
                    streamType: "kline",
                    clientId,
                    clientWs: ws,
                    onMessageTransform: (payload) => {
                        const k = payload.k;
                        return {
                            type: 'CANDLE_UPDATE',
                            data: {
                                time: k.t / 1000,
                                open: parseFloat(k.o),
                                high: parseFloat(k.h),
                                low: parseFloat(k.l),
                                close: parseFloat(k.c),
                                volume: parseFloat(k.v),
                                isClosed: k.x,
                                interval: k.i
                            }
                        };
                    }
                });
            }
        };

        // 1. Initial ticker Subscription
        subscribeTicker();

        // 2. Client Message Listener (Timeframe changes & Manual Retries)
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());

                // Handle Initial Subscriptions
                if (message.action === 'ALL_PAIR_STREAM') {
                    const symbol = message.symbol
                    const interval = message.interval

                    subscribeDepth(symbol);
                    subscribeTrades(symbol);
                    subscribeKline(interval, symbol);
                }

                // Handle Timeframe changes
                if (message.action === 'CHANGE_TIMEFRAME' && message.interval) {
                    if (message.interval !== activeInterval) {
                        streamManager.unsubscribe(klineStream, clientId);
                        subscribeKline(message.interval, message.symbol);
                    }
                }

                // Handle Stream Retries
                if (message.action === 'RETRY_STREAM' && message.streamType) {
                    console.log(`[Server] Manual retry requested for ${message.streamType} by client ${clientId}`);
                    const symbol = message.symbol
                    const interval = message.interval

                    switch (message.streamType as streamType) {
                        case 'depth':
                            subscribeDepth(symbol);
                            break;
                        case 'trades':
                            subscribeTrades(symbol);
                            break;
                        case 'kline':
                            subscribeKline(interval, symbol);
                            break;
                        case 'ticker':
                            subscribeTicker();
                            break;
                    }
                }

                // Handle pairs unsubscribe
                if (message.action === 'UNSUBSCRIBE_PAIR') {
                    const symbol = message.symbol
                    const interval = message.interval
                    if (!symbol) return;
                    const formattedSymbol = symbol.toLowerCase();

                    const depthStream = `${formattedSymbol}@depth20@100ms`;
                    const tradeStream = `${formattedSymbol}@aggTrade`;
                    const klineStream = `${formattedSymbol}@kline_${interval}`;
                    streamManager.unsubscribe(depthStream, clientId)
                    streamManager.unsubscribe(tradeStream, clientId)
                    if (interval) {
                        streamManager.unsubscribe(klineStream, clientId)
                    }
                }
            } catch (err) {
                console.error("Client message error:", err);
            }
        });

        // 3. Cleanup on disconnect
        ws.on('close', () => {
            streamManager.disconnectClient(clientId);
            console.log(`Client ${clientId} disconnected, cleaned up subscriptions.`);
        });


        const processOrderbookLevels = (levels: any) => {
            let total = 0;
            return levels.map((level: any) => {
                const price = parseFloat(level[0]);
                const size = parseFloat(level[1]);
                total += size;
                return {
                    price,
                    size,
                    total: parseFloat(total.toFixed(4))
                };
            });
        };
    });
};
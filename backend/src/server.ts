import { WebSocketServer } from 'ws';
import crypto from 'crypto';
import { SubscribePayload } from './types/index.js';
import { streamManager } from './binanceStreamManager.js';
import { Server } from 'http';
import logger from './config/logger.js';

const transformFunctions = {
    ticker: (tickerArray: any) => ({
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
    }),

    depth: (data: any) => ({
        type: 'ORDER_BOOK_UPDATE',
        data: {
            bids: processOrderbookLevels(data.bids),
            asks: processOrderbookLevels(data.asks)
        }
    }),

    trades: (t: any) => ({
        type: 'TRADE_UPDATE',
        data: {
            id: t.a,
            price: parseFloat(t.p),
            size: parseFloat(t.q),
            time: new Date(t.E).toLocaleTimeString('en-GB', { hour12: false }),
            side: t.m ? "sell" : "buy"
        }
    }),

    kline: (payload: any) => {
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
}

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

export const initializeWebSocketServer = (server: Server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        const clientId = crypto.randomUUID();
        let activeInterval = "";

        // Stream keys
        const tickerStream = `!miniTicker@arr`;

        streamManager.subscribeBatch({
            clientId,
            clientWs: ws,
            streams: {
                [tickerStream]: { streamType: "ticker", onMessageTransform: transformFunctions.ticker }
            }
        })

        // 2. Client Message Listener (Timeframe changes & Manual Retries)
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());

                const symbol = message.symbol
                const interval = message.interval
                const formattedSymbol = symbol?.toLowerCase();

                const depthStream = `${formattedSymbol}@depth20@100ms`
                const aggTradeStream = `${formattedSymbol}@aggTrade`;
                const klineStream = `${formattedSymbol}@kline_${interval}`;
                const subscribePayload = ({ includeTicker, includeDepth, includeAgg, includeKline }: { includeTicker?: boolean, includeDepth?: boolean, includeAgg?: boolean, includeKline?: boolean } = {}): SubscribePayload => (
                    {
                        clientId,
                        clientWs: ws,
                        streams: {
                            ...(includeDepth && {
                                [depthStream]: { streamType: "depth", onMessageTransform: transformFunctions.depth }
                            }),
                            ...(includeAgg && {
                                [aggTradeStream]: { streamType: "trades", onMessageTransform: transformFunctions.trades }
                            }),
                            ...(includeKline && {
                                [klineStream]: { streamType: "kline", onMessageTransform: transformFunctions.kline }
                            }),
                            ...(includeTicker && {
                                [tickerStream]: { streamType: "ticker", onMessageTransform: transformFunctions.ticker }
                            })
                        }
                    }
                )

                // Handle Initial Subscriptions
                if (message.action === 'ALL_PAIR_STREAM') {
                    activeInterval = interval;
                    const payload = subscribePayload({ includeAgg: true, includeDepth: true, includeKline: true })
                    streamManager.subscribeBatch(payload)
                }

                // Handle Timeframe changes
                if (message.action === 'CHANGE_TIMEFRAME' && interval) {
                    if (interval && formattedSymbol && (interval !== activeInterval)) {
                        const activeKlineStream = `${formattedSymbol}@kline_${activeInterval}`
                        streamManager.unsubscribeBatch([activeKlineStream], clientId);
                        const payload = subscribePayload({ includeKline: true })
                        streamManager.subscribeBatch(payload)

                        activeInterval = interval;
                    }
                }

                // Handle Stream Retries
                if (message.action === 'RETRY_STREAM') {
                    const payload = subscribePayload()
                    streamManager.subscribeBatch(payload)
                }

                // Handle pairs unsubscribe
                if (message.action === 'UNSUBSCRIBE_PAIR') {
                    if (!formattedSymbol) return;

                    const streamsToUnsubscribe = [
                        depthStream,
                        aggTradeStream
                    ];

                    if (interval) {
                        streamsToUnsubscribe.push(klineStream);
                    }

                    // Unsubscribe all in one go
                    streamManager.unsubscribeBatch(streamsToUnsubscribe, clientId);

                    // Reset tracking state for this client session
                    activeInterval = "";
                }

                // Handle ticker stream unsubscribe
                if (message.action === 'UNSUBSCRIBE_TICKER') {
                    streamManager.unsubscribeBatch([tickerStream], clientId);
                }
            } catch (err: any) {
                logger.error(`Client message error: ${err.message || err}`);
            }
        });

        // 3. Cleanup on disconnect
        ws.on('close', () => {
            streamManager.disconnectClient(clientId);
        });

    });
};
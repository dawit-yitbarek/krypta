import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { CandleData, OrderBook, streamType, connectionStatus, TimeFrame, Trade } from "@/types"
import { api } from "@/lib/api"
import { toUrlSymbol } from "@/lib/symbol"
import { useBinanceSocket } from "@/context/BinanceSocketContext"
import { secondsInDay } from "date-fns/constants"

interface TradePairContextType {
    candles: CandleData[]
    orderBook: OrderBook
    recentTrades: Trade[]
    loadingCandles: boolean
    streamsStatus: Partial<Record<streamType, connectionStatus>>
    timeframe: TimeFrame
    setTimeframe: (tf: TimeFrame) => void
    retryConnection: () => void
}

const TradePairContext = createContext<TradePairContextType | null>(null)

interface TradePairProviderProps {
    symbol: string
    children: React.ReactNode
}

export const TradePairProvider: React.FC<TradePairProviderProps> = ({
    symbol,
    children,
}) => {
    const [timeframe, setTimeframe] = useState<TimeFrame>("1m")
    const [candles, setCandles] = useState<CandleData[]>([])
    const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] })
    const [recentTrades, setRecentTrades] = useState<Trade[]>([])
    const [loadingCandles, setLoadingCandles] = useState<boolean>(true)
    const [streamsStatus, setStreamsStatus] = useState<Partial<Record<streamType, connectionStatus>>>({
        depth: "disconnected",
        trades: "disconnected",
        kline: "disconnected",
        ticker: "disconnected",
    })

    const { socket, sendMessage } = useBinanceSocket()
    const cleanSymbol = toUrlSymbol(symbol)

    // Keep a mutable ref of timeframe to prevent stale closures in the WS listener
    const timeframeRef = useRef(timeframe)
    useEffect(() => {
        timeframeRef.current = timeframe
    }, [timeframe])

    // 1. Historical Candle Fetching
    useEffect(() => {
        let isSubscribed = true

        const fetchHistoricalCandles = async () => {
            if (!cleanSymbol) return
            setLoadingCandles(true)
            setCandles([])

            const timeframeMessage = {
                action: "CHANGE_TIMEFRAME",
                symbol: cleanSymbol,
                interval: timeframe,
            }

            const pairDataMessage = {
                action: "ALL_PAIR_STREAM",
                symbol: cleanSymbol,
                interval: timeframe,
            }

            sendMessage(timeframeMessage)
            sendMessage(pairDataMessage)

            try {
                const data = await api.get(`/api/candles?symbol=${cleanSymbol}&interval=${timeframe}&limit=500`)
                if (isSubscribed) {
                    setCandles(data)
                }
            } catch (error) {
                console.error("Candle Fetch Failed:", error)
            } finally {
                if (isSubscribed) setLoadingCandles(false)
            }
        }

        fetchHistoricalCandles()

        return () => {
            isSubscribed = false
        }
    }, [cleanSymbol, timeframe, socket, sendMessage])

    // 2. WebSocket Event Listener
    useEffect(() => {
        if (!cleanSymbol || !socket) return

        setStreamsStatus({ depth: "connecting", trades: "connecting", kline: "connecting", ticker: "connecting" })

        const handleMessage = (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data)

                if (msg.type === "ORDER_BOOK_UPDATE") {
                    setOrderBook(msg.data)
                }

                if (msg.type === "TRADE_UPDATE") {
                    setRecentTrades((prev) => [msg.data, ...prev].slice(0, 50))
                }

                if (msg.type === "CANDLE_UPDATE") {
                    const incoming = msg.data
                    if (incoming.interval && incoming.interval !== timeframeRef.current) return

                    setCandles((prev) => {
                        if (prev.length === 0) return [incoming]
                        const last = prev[prev.length - 1]
                        if (last.time === incoming.time) {
                            const updated = [...prev]
                            updated[updated.length - 1] = incoming
                            return updated
                        }
                        const lasting = prev.length >= 500 ? prev.slice(1) : prev
                        return incoming.time > last.time ? [...lasting, incoming] : prev
                    })
                }

                if (msg.type === "STREAM_CONNECTION_STATUS") {
                    if (msg.streamType === "ticker" || msg.streamType === "unknown") return
                    setStreamsStatus((prev) => ({ ...prev, [msg.streamType]: msg.status }))
                }

                if (msg.type === "STREAM_ERROR") {
                    if (msg.streamType === "ticker" || msg.streamType === "unknown") return
                    setStreamsStatus((prev) => ({ ...prev, [msg.streamType]: "disconnected" }))
                }
            } catch (e) {
                console.error("Pair WS Parse Error:", e)
            }
        }

        socket.addEventListener("message", handleMessage)

        return () => {
            const unsubscribeMessage = {
                action: "UNSUBSCRIBE_PAIR",
                symbol: cleanSymbol,
                interval: timeframe,
            }
            sendMessage(unsubscribeMessage)
            socket.removeEventListener("message", handleMessage)
        }
    }, [cleanSymbol, socket])

    // Reset state on pair switch
    useEffect(() => {
        setOrderBook({ bids: [], asks: [] })
        setRecentTrades([])
    }, [symbol])

    const retryConnection = useCallback(() => {
        // Retry logic if needed
    }, [])

    return (
        <TradePairContext.Provider
            value={{
                candles,
                orderBook,
                recentTrades,
                loadingCandles,
                streamsStatus,
                timeframe,
                setTimeframe,
                retryConnection,
            }}
        >
            {children}
        </TradePairContext.Provider>
    )
}

export const useTradePair = () => {
    const context = useContext(TradePairContext)
    if (!context) {
        throw new Error("useTradePair must be used within a TradePairProvider")
    }
    return context
}
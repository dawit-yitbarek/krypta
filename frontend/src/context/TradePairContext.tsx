import React, { createContext, useContext, useState, useEffect, useRef } from "react"
import { CandleData, OrderBook, connectionStatus, TimeFrame, Trade } from "@/types"
import { api } from "@/lib/api"
import { toUrlSymbol } from "@/lib/symbol"
import { useBinanceSocket } from "@/context/BinanceSocketContext"

interface TradePairContextType {
    candles: CandleData[]
    orderBook: OrderBook
    recentTrades: Trade[]
    loadingCandles: boolean
    connectionState: connectionStatus
    timeframe: TimeFrame
    setTimeframe: (tf: TimeFrame) => void
    retryConnection: () => void
}

const TradePairContext = createContext<TradePairContextType | null>(null)

interface TradePairProviderProps {
    symbol: string
    children: React.ReactNode
}

export const TradePairProvider: React.FC<TradePairProviderProps> = ({ symbol, children, }) => {
    const [timeframe, setTimeframe] = useState<TimeFrame>("1m")
    const [candles, setCandles] = useState<CandleData[]>([])
    const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] })
    const [recentTrades, setRecentTrades] = useState<Trade[]>([])
    const [loadingCandles, setLoadingCandles] = useState<boolean>(true)

    const { socket, sendMessage, connectionState, retryConnection } = useBinanceSocket()
    const cleanSymbol = toUrlSymbol(symbol)

    // Tracks current and previous timeframe values
    const timeframeRef = useRef(timeframe)
    const prevTimeframe = useRef(timeframe)

    useEffect(() => {
        timeframeRef.current = timeframe
    }, [timeframe])

    // 1. ALL_PAIR_STREAM: Runs ONLY when cleanSymbol or socket changes
    useEffect(() => {
        if (!cleanSymbol || !socket) return

        const pairDataMessage = {
            action: "ALL_PAIR_STREAM",
            symbol: cleanSymbol,
            interval: timeframeRef.current,
        }

        sendMessage(pairDataMessage)
    }, [cleanSymbol, socket, sendMessage])

    // 2. CHANGE_TIMEFRAME: Runs ONLY when timeframe specifically changes value (skips initial mount & symbol changes)
    useEffect(() => {
        if (prevTimeframe.current !== timeframe) {
            prevTimeframe.current = timeframe

            if (cleanSymbol) {
                const timeframeMessage = {
                    action: "CHANGE_TIMEFRAME",
                    symbol: cleanSymbol,
                    interval: timeframe,
                }
                sendMessage(timeframeMessage)
            }
        }
    }, [timeframe, cleanSymbol, sendMessage])

    // 3. Historical REST Candle Fetching: Runs when symbol or timeframe changes
    useEffect(() => {
        let isSubscribed = true

        const fetchHistoricalCandles = async () => {
            if (!cleanSymbol) return
            setLoadingCandles(true)
            setCandles([])

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
    }, [cleanSymbol, timeframe])

    // 4. WebSocket Event Listener & Cleanup
    useEffect(() => {
        if (!cleanSymbol || !socket) return

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

            } catch (e) {
                console.error("Pair WS Parse Error:", e)
            }
        }

        socket.addEventListener("message", handleMessage)

        return () => {
            const unsubscribeMessage = {
                action: "UNSUBSCRIBE_PAIR",
                symbol: cleanSymbol,
                interval: timeframeRef.current,
            }
            sendMessage(unsubscribeMessage)
            socket.removeEventListener("message", handleMessage)
        }
    }, [cleanSymbol, socket, sendMessage])

    // Reset state on pair switch
    useEffect(() => {
        setOrderBook({ bids: [], asks: [] })
        setRecentTrades([])
    }, [symbol])


    return (
        <TradePairContext.Provider
            value={{
                candles,
                orderBook,
                recentTrades,
                loadingCandles,
                connectionState,
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
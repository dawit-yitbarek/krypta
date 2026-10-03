import React, { createContext, useContext, useCallback, useEffect, useState, useMemo } from "react"
import type { CoinData } from "@/types"
import { api } from "@/components/api"
import { useBinanceSocket } from "@/context/BinanceSocketContext"
import { useIsMobile } from "@/hooks/use-mobile"


interface TickerContextType {
    tickers: CoinData[]
    coinMap: Record<string, CoinData>
    loadingCoins: boolean
    errorLoadingCoins: boolean
    sidebarCollapsed: boolean
    setSidebarCollapsed: (collapsed: boolean) => void
    fetchCoins: () => void
}

const TickerContext = createContext<TickerContextType | null>(null)

export const TickerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { sendMessage, socket } = useBinanceSocket()

    const [coinMap, setCoinMap] = useState<Record<string, CoinData>>({})
    const [loadingCoins, setLoadingCoins] = useState<boolean>(true)
    const [errorLoadingCoins, setErrorLoadingCoins] = useState<boolean>(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true)
    const isMobile = useIsMobile()

    // 1. Single API Fetch
    const fetchCoins = useCallback(async () => {
        setErrorLoadingCoins(false)
        setLoadingCoins(true)

        try {
            const coins: CoinData[] = await api.get(`/api/coins`)

            const initialMap: Record<string, CoinData> = {}
            coins.forEach((coin: CoinData) => {
                initialMap[coin.symbol] = coin
            })
            setCoinMap(initialMap)
        } catch (error) {
            console.error("Failed to load coins:", error)
            setErrorLoadingCoins(true)
        } finally {
            if (!isMobile) {
                setSidebarCollapsed(false)
            }
            setLoadingCoins(false)
        }
    }, [])

    useEffect(() => {
        fetchCoins()
    }, [fetchCoins])

    // 2. Single WebSocket Listener
    useEffect(() => {
        if (!socket) return

        const handleMessage = (event: MessageEvent) => {
            try {
                const message = JSON.parse(event.data)

                if (message.type === "TICKERS_UPDATE") {
                    const incomingTickers = message.data

                    setCoinMap((prevMap) => {
                        if (Object.keys(prevMap).length === 0) return prevMap
                        let hasChanges = false
                        const nextMap = { ...prevMap }

                        for (const ticker of incomingTickers) {
                            const existing = nextMap[ticker.symbol]
                            if (existing) {
                                const isDifferent =
                                    existing.price !== ticker.price ||
                                    existing.changePct !== ticker.changePct ||
                                    existing.high24h !== ticker.high24h ||
                                    existing.low24h !== ticker.low24h ||
                                    existing.quoteVolume24h !== ticker.quoteVolume24h

                                if (isDifferent) {
                                    nextMap[ticker.symbol] = { ...existing, ...ticker }
                                    hasChanges = true
                                }
                            }
                        }
                        return hasChanges ? nextMap : prevMap
                    })
                }

            } catch (err) {
                console.error("Failed to parse WebSocket message:", err)
            }
        }

        socket.addEventListener("message", handleMessage)
        return () => {
            const unsubscribeMessage = {
                action: "UNSUBSCRIBE_TICKER",
            }
            sendMessage(unsubscribeMessage)
            socket.removeEventListener("message", handleMessage)
        }
    }, [socket])

    const tickers = useMemo(() => Object.values(coinMap), [coinMap])

    return (
        <TickerContext.Provider
            value={{
                tickers,
                coinMap,
                loadingCoins,
                errorLoadingCoins,
                sidebarCollapsed,
                setSidebarCollapsed,
                fetchCoins,
            }}
        >
            {children}
        </TickerContext.Provider>
    )
}

// Custom hook to consume ticker data anywhere in the app
export const useTicker = () => {
    const context = useContext(TickerContext)
    if (!context) {
        throw new Error("useTicker must be used within a TickerProvider")
    }
    return context
}
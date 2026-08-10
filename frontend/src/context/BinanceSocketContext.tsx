import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import type { connectionStatus } from "@/types"


interface BinanceSocketContextType {
    connectionState: connectionStatus
    socket: WebSocket | null
    retryConnection: () => void
    sendMessage: (data: unknown) => void
}

const BinanceSocketContext = createContext<BinanceSocketContextType | null>(null)

const MAX_RECONNECT_ATTEMPTS = 5

export const BinanceSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [connectionState, setConnectionState] = useState<connectionStatus>("connecting")

    const socketRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<number>(null)
    const reconnectAttemptsRef = useRef<number>(0)
    const isReconnectingRef = useRef<boolean>(false)

    const connectSocket = useCallback(() => {
        setConnectionState("connecting")

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        const backendHost = import.meta.env.VITE_BACKEND_URL?.replace(/^https?:\/\//, '') || window.location.host
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"

        const socket = new WebSocket(`${protocol}//${backendHost}`)
        socketRef.current = socket

        socket.onopen = () => {
            setConnectionState("connected")

            if (isReconnectingRef.current) {
                toast({
                    duration: 3000,
                    title: (
                        <div className="flex items-center gap-2 text-[#10b981]">
                            <Wifi size={14} />
                            <span>Connection Restored</span>
                        </div>
                    ),
                    description: "Global pair prices and 24h volumes updated."
                })
                isReconnectingRef.current = false
            }
            reconnectAttemptsRef.current = 0
        }

        socket.onclose = (event) => {
            if (event.code === 1000) return

            if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS || event.code === 1011) {
                setConnectionState("disconnected")
                isReconnectingRef.current = false
                toast({
                    duration: 10000,
                    variant: "destructive",
                    title: (
                        <div className="flex items-center gap-2 text-[#f43f5e]">
                            <AlertCircle size={14} />
                            <span>Global Ticker Stream Disconnected</span>
                        </div>
                    ),
                    description: "Unable to reconnect to ticker feed after multiple attempts.",
                    action: (
                        <ToastAction
                            aria-label="Reconnect Ticker Stream"
                            title="connect Ticker Stream"
                            altText="Reconnect Ticker Stream"
                            onClick={() => {
                                reconnectAttemptsRef.current = 0
                                isReconnectingRef.current = true
                                connectSocket()
                            }}
                        >
                            <RefreshCw size={16} />
                        </ToastAction >
                    )
                })
                return
            }

            if (!isReconnectingRef.current) {
                isReconnectingRef.current = true
                toast({
                    duration: 3000,
                    title: (
                        <div className="flex items-center gap-2 text-[#f59e0b]">
                            <WifiOff size={14} />
                            <span>Ticker Stream Disconnected</span>
                        </div>
                    ),
                    description: (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[#a1a1aa]">
                            <RefreshCw size={11} className="animate-spin text-[#f59e0b]" />
                            <span>Reconnecting to global ticker feed...</span>
                        </div>
                    )
                })
            }

            const delay = Math.min(
                1000 * Math.pow(2, reconnectAttemptsRef.current),
                10000
            )
            reconnectAttemptsRef.current += 1

            reconnectTimeoutRef.current = setTimeout(() => {
                connectSocket()
            }, delay)
        }

        socket.onerror = (error) => {
            console.error("Ticker WS Error:", error)
        }
    }, [])

    // Auto-connect on app mount and clean up on unmount
    useEffect(() => {
        connectSocket()
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
            }
            if (socketRef.current) {
                socketRef.current.close(1000, "unmounted")
                socketRef.current = null
            }
        }
    }, [connectSocket])

    // Helper to send messages safely from any page
    const sendMessage = useCallback((data: unknown) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data))
        } else {
            console.warn("WebSocket is not connected. Message not sent:", data)
        }
    }, [])

    return (
        <BinanceSocketContext.Provider
            value={{
                connectionState,
                socket: socketRef.current,
                retryConnection: connectSocket,
                sendMessage,
            }}
        >
            {children}
        </BinanceSocketContext.Provider>
    )
}

// Custom hook for consuming components
export const useBinanceSocket = () => {
    const context = useContext(BinanceSocketContext)
    if (!context) {
        throw new Error("useBinanceSocket must be used within a BinanceSocketProvider")
    }
    return context
}
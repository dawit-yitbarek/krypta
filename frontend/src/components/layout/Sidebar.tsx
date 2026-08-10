import { useState, useMemo } from "react"
import {
    PanelLeftOpen,
    PanelLeftClose,
    Zap,
    TrendingUp,
    TrendingDown,
    Search,
    X,
    AlertCircle,
    RotateCw,
    RefreshCw,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { CoinListSkeleton } from "@/components/terminal/LoadingSkelotons"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { useTicker } from "@/context/TickerContext"
import { useParams, useNavigate } from "react-router-dom"
import { toDisplaySymbol, toUrlSymbol } from "@/lib/symbol"

const { format } = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
})

export function Sidebar() {

    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")
    const { tickers, loadingCoins, connectionStatus, errorLoadingCoins, sidebarCollapsed, setSidebarCollapsed, fetchCoins } = useTicker()
    const { symbol } = useParams<{ symbol?: string }>()
    const activeSymbol = toDisplaySymbol(symbol)
    function retryConnection() {
        console.log("")
    }

    const filteredTickers = useMemo(() => {
        if (!searchQuery.trim()) return tickers
        const query = searchQuery.toLowerCase().trim()
        return tickers.filter(
            (coin) =>
                coin.symbol.toLowerCase().includes(query) ||
                coin.name.toLowerCase().includes(query) ||
                coin.baseAsset?.toLowerCase().includes(query)
        )
    }, [tickers, searchQuery])

    return (
        <aside
            className={cn(
                "flex flex-col h-full bg-[#111113] border-r border-[#27272a] transition-all duration-200 shrink-0 select-none",
                sidebarCollapsed ? "w-12" : "w-72"
            )}
        >

            <div
                className={cn(
                    "flex items-center justify-between px-3 py-3 border-b border-[#27272a]",
                    sidebarCollapsed && "justify-center px-0"
                )}
            >
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-[#10b981]/20 shrink-0">
                        <Zap size={13} className="text-[#10b981]" />
                    </div>
                    {!sidebarCollapsed && (
                        <span className="text-[11px] font-semibold tracking-widest text-[#e4e4e7] uppercase font-sans">
                            CryptoTerm
                        </span>
                    )}
                </div>
            </div>

            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-[#111113]/95 backdrop-blur-sm border-b border-[#1f1f23]">
                {!sidebarCollapsed ? (
                    <div className="p-2">
                        <InputGroup className="h-8 bg-[#18181b] border-[#27272a] focus-within:border-[#10b981]/50 text-xs">
                            <InputGroupAddon align="inline-start" className="pl-2.5 pr-0 text-[#71717a]">
                                <Search size={13} />
                            </InputGroupAddon>
                            <InputGroupInput
                                id="sidebar-search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search coin or pair..."
                                className="text-[11px] text-[#e4e4e7] placeholder:text-[#52525b] h-7"
                            />
                            {searchQuery && (
                                <InputGroupAddon align="inline-end" className="pr-2 pl-0">
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="text-[#71717a] hover:text-[#e4e4e7] transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-2 gap-1.5">
                        <button
                            onClick={() => {
                                setSidebarCollapsed(false)
                                setTimeout(() => {
                                    document.getElementById("sidebar-search")?.focus()
                                }, 0)
                            }}
                            className="p-1.5 rounded text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#18181b] transition-colors relative"
                            title="Expand & Search"
                        >
                            <Search size={14} />
                        </button>

                        {/* Collapsed Indicator Dot */}
                        <div
                            className="cursor-pointer"
                            onClick={connectionStatus === "disconnected" ? retryConnection : undefined}
                            title={
                                connectionStatus === "connecting"
                                    ? "Reconnecting market stream..."
                                    : connectionStatus === "disconnected"
                                        ? "Stream disconnected. Click to reconnect."
                                        : "Market stream live"
                            }
                        >
                            {connectionStatus === "connected" && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
                                </span>
                            )}
                            {connectionStatus === "connecting" && (
                                <span className="h-2 w-2 rounded-full bg-[#f59e0b] block animate-pulse" />
                            )}
                            {connectionStatus === "disconnected" && (
                                <span className="h-2 w-2 rounded-full bg-[#f43f5e] block hover:scale-125 transition-transform" />
                            )}
                        </div>
                    </div>
                )}

                {/* Table Sub-header with Status */}
                {!sidebarCollapsed && (
                    <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-[#71717a] tracking-wider border-t border-[#1f1f23]">
                        <span className="uppercase">Market Pair</span>

                        {/* Compact Stream Status Pill */}
                        <div className="flex items-center">
                            {connectionStatus === "connected" && (
                                <span
                                    className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-[9px] font-mono leading-none"
                                    title="Real-time order book feed active"
                                >
                                    <span className="h-1 w-1 rounded-full bg-[#10b981] animate-pulse" />
                                    <span>LIVE</span>
                                </span>
                            )}

                            {connectionStatus === "connecting" && (
                                <span
                                    className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-[9px] font-mono leading-none"
                                    title="Reconnecting feed..."
                                >
                                    <RefreshCw size={8} className="animate-spin text-[#f59e0b]" />
                                    <span>SYNC</span>
                                </span>
                            )}

                            {connectionStatus === "disconnected" && (
                                <button
                                    onClick={retryConnection}
                                    className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e] hover:bg-[#f43f5e]/20 text-[9px] font-mono font-medium leading-none transition-colors group"
                                    title="Stream offline. Click to reconnect."
                                >
                                    <RefreshCw size={8} className="group-hover:rotate-180 transition-transform duration-300" />
                                    <span>OFF</span>
                                </button>
                            )}
                        </div>

                        <span className="uppercase">Price / 24h Vol</span>
                    </div>
                )}
            </div>

            {/* Coin List Area */}
            <nav className="flex-1 flex flex-col gap-1 p-1.5 overflow-y-auto custom-scrollbar no-scrollbar">
                {loadingCoins ? (
                    <CoinListSkeleton collapsed={sidebarCollapsed} />
                ) : errorLoadingCoins ? (
                    /* Error State Display */
                    <div className="flex flex-col items-center justify-center py-8 px-3 text-center my-auto">
                        <div className="w-10 h-10 rounded-full bg-[#f43f5e]/10 border border-[#f43f5e]/20 flex items-center justify-center mb-3 text-[#f43f5e] shrink-0">
                            <AlertCircle size={20} />
                        </div>

                        {!sidebarCollapsed && (
                            <>
                                <span className="text-xs font-medium text-[#e4e4e7] mb-1">
                                    Failed to load pairs
                                </span>
                                <p className="text-[10.5px] text-[#71717a] max-w-[180px] leading-relaxed mb-3.5">
                                    Unable to establish connection to the market stream.
                                </p>
                            </>
                        )}

                        {/* Retry Button */}
                        <button
                            onClick={fetchCoins}
                            title={sidebarCollapsed ? "Retry loading pairs" : undefined}
                            className={cn(
                                "group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200",
                                "bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/30 hover:border-[#10b981]/60 text-[#10b981]",
                                "shadow-[0_2px_8px_rgba(16,185,129,0.12)] active:scale-95",
                                sidebarCollapsed && "p-2 justify-center"
                            )}
                        >
                            <RotateCw size={12} className="transition-transform duration-300 group-hover:rotate-180" />
                            {!sidebarCollapsed && <span>Try Again</span>}
                        </button>
                    </div>
                ) : filteredTickers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-[#52525b]">
                        <Search size={18} className="mb-2 opacity-40" />
                        <span className="text-xs font-mono">No pairs found</span>
                    </div>
                ) : (
                    filteredTickers.map((coin) => {
                        const isActive = activeSymbol === coin.symbol
                        const isPositive = coin.changePct >= 0

                        return (
                            <button
                                key={coin.symbol}
                                onClick={() => {
                                    navigate(`/trade/${toUrlSymbol(coin.symbol)}`);
                                    setSearchQuery("")
                                }}
                                disabled={isActive}
                                title={
                                    sidebarCollapsed
                                        ? `${coin.symbol} ($${coin.price.toFixed(2)})`
                                        : undefined
                                }
                                className={cn(
                                    "flex items-center justify-between px-2.5 py-2 rounded text-xs transition-all w-full group relative",
                                    isActive
                                        ? "bg-[#27272a] text-[#e4e4e7] font-semibold border-l-2 border-[#10b981]"
                                        : "text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#18181b]",
                                    sidebarCollapsed && "justify-center px-0"
                                )}
                            >
                                {/* Left Side: Avatar + Name */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="relative shrink-0">
                                        <Avatar className="w-7 h-7 rounded-full">
                                            <AvatarImage
                                                src={coin.logo}
                                                alt={coin.baseAsset}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="text-[9px] font-bold font-mono bg-[#27272a] text-[#71717a]">
                                                {coin.baseAsset?.slice(0, 3)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    {!sidebarCollapsed && (
                                        <div className="flex flex-col text-left truncate">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-medium text-[#e4e4e7] leading-tight">
                                                    {coin.symbol}
                                                </span>
                                            </div>
                                            <span className="text-[9.5px] text-[#52525b] truncate mt-0.5">
                                                {coin.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Price, 24h Vol & % Change */}
                                {!sidebarCollapsed && (
                                    <div className="flex flex-col items-end text-right shrink-0 font-mono">
                                        <span className="text-[11px] text-[#e4e4e7] tabular-nums font-semibold">
                                            {coin.price > 0
                                                ? `$${coin.price.toLocaleString("en-US", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}`
                                                : "—"}
                                        </span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] text-[#52525b] tabular-nums">
                                                Vol ${format(coin.quoteVolume24h)}
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[9.5px] gap-1 flex items-center font-medium tabular-nums",
                                                    isPositive ? "text-[#10b981]" : "text-[#f43f5e]"
                                                )}
                                            >
                                                {isPositive ? (
                                                    <TrendingUp size={11} />
                                                ) : (
                                                    <TrendingDown size={11} />
                                                )}
                                                {isPositive ? "+" : ""}
                                                {coin.changePct?.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </button>
                        )
                    })
                )}
            </nav>

            {/* Collapse Toggle */}

            <div className="flex items-center justify-center p-2 border-t border-[#27272a] mt-auto">
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={cn(
                        "group relative flex items-center justify-center px-2 py-1 rounded-lg text-[12px] font-medium font-sans transition-all duration-200 overflow-hidden",
                        "bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/30 hover:border-[#10b981]/60",
                        "text-[#10b981] shadow-[0_4px_14px_0_rgba(16,185,129,0.15)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.25)]",
                        "active:scale-[0.98]",
                    )}
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >

                    <div className="absolute inset-0 bg-gradient-to-r from-[#10b981]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {sidebarCollapsed ? (
                        <PanelLeftOpen
                            size={24}
                            className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                        />
                    ) : (
                        <>
                            <PanelLeftClose
                                size={24}
                                className="shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
                            />
                        </>
                    )}
                </button>
            </div>
        </aside>
    )
}
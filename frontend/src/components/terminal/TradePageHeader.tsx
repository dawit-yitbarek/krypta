import { useEffect, useRef, useState } from "react"
import type { CoinData, TimeFrame } from "@/types/index"
import { TrendingUp, TrendingDown, ChevronDown, Check, RefreshCw } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useTradePair } from "@/context/TradePairContext"
import { Skeleton } from "../ui/skeleton"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface TradePageHeaderProps {
    activePair: string
    activeTicker: CoinData | undefined
    tab: "chart" | "orderbook" | "trades"
}

const compactFormat = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
})

const QUICK_TIMEFRAMES: TimeFrame[] = ["1m", "5m", "15m", "1h"]
const DROPDOWN_TIMEFRAMES: TimeFrame[] = ["4h", "12h", "1d", "3d", "1w", "1M"]
const ALL_TIMEFRAMES = [...QUICK_TIMEFRAMES, ...DROPDOWN_TIMEFRAMES]

export const TradePageHeader = ({
    activePair,
    activeTicker,
    tab,
}: TradePageHeaderProps) => {
    const { candles, connectionState, timeframe, setTimeframe, retryConnection } = useTradePair()

    const prevPrice = useRef<number | undefined>(undefined)
    const [flashClass, setFlashClass] = useState("")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const pairLogo = activeTicker?.logo || ""
    const pairBaseAsset = activeTicker?.baseAsset || activePair.replace("/USDT", "")
    const pairSymbol = activeTicker?.symbol || activePair
    const pairPrice = activeTicker?.price ?? candles[candles.length - 1]?.close
    const isMobile = useIsMobile()

    useEffect(() => {
        if (typeof pairPrice !== "number") return

        if (prevPrice.current !== undefined && pairPrice !== prevPrice.current) {
            const cls = pairPrice > prevPrice.current ? "flash-up" : "flash-down"
            setFlashClass(cls)
            const timer = setTimeout(() => setFlashClass(""), 500)

            prevPrice.current = pairPrice
            return () => clearTimeout(timer)
        }

        prevPrice.current = pairPrice
    }, [pairPrice])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const changePct = activeTicker?.changePct
    const isUp = (changePct ?? 0) >= 0

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between px-3 py-2 border border-[#27272a] gap-2 md:gap-4 bg-[#111113] rounded shrink-0">
            {/* Ticker & Prices */}
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex items-center gap-2 shrink-0">
                    <Avatar className="w-6 h-6 md:w-7 md:h-7 rounded-full">
                        <AvatarImage src={pairLogo} alt={pairBaseAsset} className="object-cover" />
                        <AvatarFallback className="text-[9px] font-bold font-mono bg-[#27272a] text-[#71717a]">
                            {pairBaseAsset.slice(0, 3)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-[13px] font-semibold text-[#e4e4e7] font-sans truncate">{pairSymbol}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <span
                        className={cn(
                            "text-base md:text-[18px] font-mono font-bold tabular-nums transition-colors",
                            isUp ? "text-[#10b981]" : "text-[#f43f5e]",
                            flashClass
                        )}
                    >
                        {typeof pairPrice === "number"
                            ? pairPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : "-"}
                    </span>

                    <span
                        className={cn(
                            "inline-flex items-center gap-0.5 text-[10px] md:text-[11px] font-mono tabular-nums",
                            isUp ? "text-[#10b981]" : "text-[#f43f5e]"
                        )}
                    >
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {changePct !== undefined ? (
                            `${isUp ? "+" : ""}${changePct.toFixed(2)}%`
                        ) : (
                            <Skeleton className="h-3 rounded-sm bg-[#52525b] w-8" />
                        )}
                    </span>
                </div>


            </div>

            {/* Connection Indicator & Timeframe Selectors */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0 justify-between md:justify-end w-full md:w-auto">
                {/* 24h Stats */}
                <div className="flex items-center gap-3 md:gap-4 text-[11px] font-mono">
                    <StatCell
                        label="24h High"
                        value={activeTicker?.high24h?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        color="text-[#10b981]"
                    />
                    <StatCell
                        label="24h Low"
                        value={activeTicker?.low24h?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        color="text-[#f43f5e]"
                    />
                    <StatCell
                        label="24h Vol"
                        value={activeTicker?.quoteVolume24h ? `$${compactFormat.format(activeTicker.quoteVolume24h)}` : undefined}
                        color="text-[#a1a1aa]"
                    />
                </div>

                {/* Stream Indicator */}
                <div className="flex items-center">
                    {connectionState === "connected" && (
                        <div
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#10b981]/20 bg-[#10b981]/10 text-[#10b981] text-[9px] md:text-[10px] font-mono"
                            title="Market stream connected"
                        >
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10b981]"></span>
                            </span>
                            <span className="font-medium hidden xs:inline">Live</span>
                        </div>
                    )}

                    {connectionState === "connecting" && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#f59e0b]/20 bg-[#f59e0b]/10 text-[#f59e0b] text-[9px] md:text-[10px] font-mono">
                            <RefreshCw size={9} className="animate-spin text-[#f59e0b]" />
                            <span className="font-medium hidden xs:inline">Connecting</span>
                        </div>
                    )}

                    {connectionState === "disconnected" && (
                        <button
                            onClick={retryConnection}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#f43f5e]/30 bg-[#f43f5e]/10 text-[#f43f5e] hover:bg-[#f43f5e]/20 text-[9px] md:text-[10px] font-mono font-medium"
                        >
                            <RefreshCw size={9} />
                            <span>Reconnect</span>
                        </button>
                    )}
                </div>

                {/* Timeframe Controls Rendered when 'chart' tab is active */}
                {(!isMobile || tab === "chart") && (
                    <>
                        <div className="flex items-center gap-1">
                            {/* Quick timeframes: hidden on small screens */}
                            <div className="hidden sm:flex items-center gap-1">
                                {QUICK_TIMEFRAMES.map((tf) => (
                                    <button
                                        key={tf}
                                        disabled={tf === timeframe}
                                        onClick={() => setTimeframe(tf)}
                                        className={cn(
                                            "px-1.5 py-0.5 text-[10px] font-mono rounded transition-all",
                                            tf === timeframe
                                                ? "bg-[#10b981]/20 text-[#10b981] font-semibold"
                                                : "text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#18181b]"
                                        )}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>

                            {/* Dropdown Menu */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded transition-all border",
                                        timeframe
                                            ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 font-semibold"
                                            : "bg-[#18181b] text-[#71717a] border-[#27272a]"
                                    )}
                                >
                                    <span>{timeframe}</span>
                                    <ChevronDown
                                        size={10}
                                        className={cn("transition-transform duration-200", isDropdownOpen && "rotate-180")}
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-1.5 w-24 rounded border border-[#27272a] bg-[#18181b] p-1 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                                        {ALL_TIMEFRAMES.map((tf) => {
                                            const isSelected = tf === timeframe
                                            return (
                                                <button
                                                    key={tf}
                                                    onClick={() => {
                                                        setTimeframe(tf)
                                                        setIsDropdownOpen(false)
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-mono rounded transition-colors text-left",
                                                        isSelected
                                                            ? "bg-[#10b981]/10 text-[#10b981] font-medium"
                                                            : "text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#e4e4e7]"
                                                    )}
                                                >
                                                    <span>{tf}</span>
                                                    {isSelected && <Check size={11} className="text-[#10b981]" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function StatCell({ label, value, color }: { label: string; value: string | undefined; color: string }) {
    return (
        <div className="flex flex-col gap-0">
            <span className="text-[9px] text-[#52525b] font-sans uppercase tracking-wider leading-none">{label}</span>
            {value !== undefined ? (
                <span className={cn("tabular-nums leading-tight", color)}>{value}</span>
            ) : (
                <Skeleton className="h-3 rounded-sm bg-[#52525b] w-10 mt-0.5" />
            )}
        </div>
    )
}
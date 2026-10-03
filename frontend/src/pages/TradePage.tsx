import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { TradePairProvider } from "@/context/TradePairContext"
import { ChartArea } from "@/components/terminal/ChartArea"
import { RecentTrades } from "@/components/terminal/RecentTrades"
import { OrderBook } from "@/components/terminal/OrderBook"
import { toDisplaySymbol } from "@/lib/symbol"
import { useTicker } from "@/context/TickerContext"
import { TradePageHeader } from "@/components/terminal/TradePageHeader"
import { CandlestickChart, BookOpen, History } from "lucide-react"

type TabType = "chart" | "orderbook" | "trades"

function TradePageContent({ symbol }: { symbol: string }) {
    const activeSymbol = toDisplaySymbol(symbol)
    const { tickers } = useTicker()
    const [activeTab, setActiveTab] = useState<TabType>("chart")

    const activeTicker = useMemo(
        () => (activeSymbol ? tickers.find((t) => t.symbol === activeSymbol) : undefined),
        [activeSymbol, tickers]
    )
    const tabs: TabType[] = ["chart", "orderbook", "trades"]
    const tabIcons = {
        chart: CandlestickChart,
        orderbook: BookOpen,
        trades: History,
    }

    return (
        <div className="flex flex-col flex-1 right-0 min-h-0 gap-1 md:gap-1.5 bg-[#09090b]">
            {/* Top Header across all device layouts */}
            <TradePageHeader
                activePair={activeSymbol}
                activeTicker={activeTicker}
                tab={activeTab}
            />

            {/* Navigation Tab Bar */}
            <div className="flex bg-[#111113] px-2 border-b border-[#27272a] shrink-0 gap-4">
                {tabs.map((tab) => {
                    const Icon = tabIcons[tab]
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center justify-center gap-1.5 flex-1 py-1.5 text-xs font-medium rounded transition-all capitalize cursor-pointer ${activeTab === tab
                                    ? "bg-[#27272a] text-white font-semibold"
                                    : "text-[#71717a] hover:bg-[#18181b] hover:text-[#e4e4e7]"
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{tab}</span>
                        </button>
                    )
                })}
            </div>

            {/* Tab-Based Viewport */}
            <div className="flex flex-1 min-h-0">
                {activeTab === "chart" && (
                    <div className="w-full h-full min-h-0">
                        <ChartArea activePair={activeSymbol} />
                    </div>
                )}
                {activeTab === "orderbook" && (
                    <div className="w-full h-full min-h-0">
                        <OrderBook activeTicker={activeTicker} activePair={activeSymbol} />
                    </div>
                )}
                {activeTab === "trades" && (
                    <div className="w-full h-full min-h-0">
                        <RecentTrades />
                    </div>
                )}
            </div>
        </div>
    )
}


export function TradePage() {
    const { symbol = "BTCUSDT" } = useParams<{ symbol: string }>()

    return (
        <TradePairProvider symbol={symbol}>
            <TradePageContent symbol={symbol} />
        </TradePairProvider>
    )
}
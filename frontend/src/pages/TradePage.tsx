import { useMemo } from "react"
import { useParams } from "react-router-dom"
import { TradePairProvider } from "@/context/TradePairContext"
import { ChartArea } from "@/components/terminal/ChartArea"
import { RecentTrades } from "@/components/terminal/RecentTrades"
import { OrderBook } from "@/components/terminal/OrderBook"
import { toDisplaySymbol } from "@/lib/symbol"
import { useTicker } from "@/context/TickerContext"


function TradePageContent({ symbol }: { symbol: string }) {
    const activeSymbol = toDisplaySymbol(symbol)

    const { tickers } = useTicker()

    const activeTicker = useMemo(
        () => (activeSymbol ? tickers.find((t) => t.symbol === activeSymbol) : undefined),
        [activeSymbol, tickers]
    )

    return (
        <div className="flex flex-col flex-1 min-h-0 gap-1.5">
            {/* Top Workspace */}
            <div className="flex flex-1 min-h-0 gap-1.5">
                <div className="flex-1 min-w-0 min-h-0">
                    <ChartArea
                        activePair={activeSymbol}
                        activeTicker={activeTicker}
                    />
                </div>
                <div className="w-[220px] shrink-0 min-h-0">
                    <RecentTrades />
                </div>
            </div>

            {/* Bottom Workspace */}
            <div className="h-[220px] shrink-0 flex gap-1.5">
                <div className="flex-1 min-w-0">
                    <OrderBook
                        activeTicker={activeTicker}
                        activePair={activeSymbol}
                    />
                </div>
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
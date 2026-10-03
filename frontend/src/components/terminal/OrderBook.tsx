import type { OrderBook, OrderBookEntry, CoinData } from "@/types/index"
import { cn } from "@/lib/utils"
import { useTradePair } from "@/context/TradePairContext"

interface OrderBookProps {
  activePair: string
  activeTicker: CoinData | undefined
}

function OrderTable({
  entries,
  side,
  maxTotal,
}: {
  entries: OrderBookEntry[]
  side: "bid" | "ask"
  maxTotal: number
}) {
  const isAsk = side === "ask"

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Table Header */}
      <div className="grid grid-cols-3 text-[10px] font-mono text-[#52525b] px-2 py-1 bg-[#18181b] border-b border-[#27272a]">
        <span>Price (USDT)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {entries.map((entry, i) => {
          const pct = Math.min((entry.total / maxTotal) * 100, 100)

          return (
            <div
              key={i}
              className="relative grid grid-cols-3 items-center text-[11px] font-mono h-[19px] px-2 group hover:bg-[#27272a]/40"
            >
              {/* Depth Background */}
              {/* <div
                className={cn(
                  "absolute inset-y-0 pointer-events-none transition-all",
                  isAsk ? "right-0 bg-[#f43f5e]/10" : "left-0 bg-[#10b981]/10"
                )}
                style={{ width: `${pct}%` }}
              /> */}

              <span className={cn("relative z-10 tabular-nums font-semibold", isAsk ? "text-[#f43f5e]" : "text-[#10b981]")}>
                {entry.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="relative z-10 tabular-nums text-[#a1a1aa] text-right">
                {entry.size.toFixed(4)}
              </span>
              <span className="relative z-10 tabular-nums text-[#71717a] text-right">
                {entry.total.toFixed(4)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function OrderBook({ activePair, activeTicker }: OrderBookProps) {
  const { orderBook, candles } = useTradePair()
  const midPrice = activeTicker?.price || candles[candles.length - 1]?.close

  const maxBidTotal = orderBook.bids[orderBook.bids.length - 1]?.total ?? 1
  const maxAskTotal = orderBook.asks[orderBook.asks.length - 1]?.total ?? 1
  const maxTotal = Math.max(maxBidTotal, maxAskTotal)

  const spread =
    orderBook.asks[0] && orderBook.bids[0]
      ? (orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)
      : "0.00"

  return (
    <div className="flex flex-col h-full bg-[#111113] border border-[#27272a] rounded overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#27272a] bg-[#141417]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#e4e4e7] uppercase tracking-wide font-sans">
            Order Book
          </span>
          <span className="text-[10px] text-[#52525b] font-mono">({activePair})</span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-[#e4e4e7] font-bold">
            ${midPrice?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "—"}
          </span>
          <span className="text-[#52525b] text-[10px]">Spread: {spread}</span>
        </div>
      </div>

      {/* Side-by-Side Tables */}
      <div className="flex-1 flex min-h-0 divide-x divide-[#27272a]">
        {/* Bids (Buy Orders) */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-2 py-0.5 bg-[#10b981]/10 text-[#10b981] text-[10px] font-bold uppercase tracking-wider border-b border-[#27272a]">
            Bids (Buy)
          </div>
          <OrderTable entries={orderBook.bids} side="bid" maxTotal={maxTotal} />
        </div>

        {/* Asks (Sell Orders) */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-2 py-0.5 bg-[#f43f5e]/10 text-[#f43f5e] text-[10px] font-bold uppercase tracking-wider border-b border-[#27272a]">
            Asks (Sell)
          </div>
          <OrderTable entries={orderBook.asks} side="ask" maxTotal={maxTotal} />
        </div>
      </div>
    </div>
  )
}
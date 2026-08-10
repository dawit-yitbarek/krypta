import type { Trade } from "@/types/index"
import { cn } from "@/lib/utils"
import { useTradePair } from "@/context/TradePairContext";

function TradeRow({ trade, isNew }: { trade: Trade; isNew: boolean }) {
  const isBuy = trade.side === "buy";

  return (
    <div
      className={cn(
        "flex items-center justify-between text-[11px] font-mono h-[18px] transition-colors",
        isNew && isBuy && "flash-up",
        isNew && !isBuy && "flash-down"
      )}
    >
      <span
        className={cn(
          "tabular-nums pl-1",
          isBuy ? "text-[#10b981]" : "text-[#f43f5e]"
        )}
      >
        {trade.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="text-center tabular-nums text-[#a1a1aa]">
        {trade.size.toFixed(4)}
      </span>
      <span className="text-right pr-1 tabular-nums text-[#71717a]">
        {trade.time}
      </span>
    </div>
  )
}

export function RecentTrades() {
  const { recentTrades } = useTradePair()

  return (
    <div className="flex flex-col h-full bg-[#111113] border border-[#27272a] rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#27272a]">
        <span className="text-[11px] font-semibold text-[#e4e4e7] font-sans tracking-wide uppercase">Time &amp; Sales</span>
      </div>

      {/* Column headers */}
      <div className="flex items-center justify-center gap-8 text-[10px] text-[#52525b] font-mono py-0.5 px-4 bg-[#18181b]">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>

      {/* Trades list */}

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {recentTrades.map((trade, i) => (
          <TradeRow key={trade.id} trade={trade} isNew={i === 0} />
        ))}
      </div>

    </div>
  )
}

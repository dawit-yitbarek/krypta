import { CandleChart } from "@/components/terminal/CandleChart"
import { Wave } from "@/components/ui/wave"
import { TextShimmer } from "@/components/ui/text-shimmer-wave"
import { NoChartData } from "@/components/ui/no-chart-data"
import { useTradePair } from "@/context/TradePairContext"


export function ChartArea({
  activePair,
}: { activePair: string }) {
  const { candles, loadingCandles, timeframe } = useTradePair()

  return (
    <div className="flex flex-col h-full bg-[#111113] border border-[#27272a] rounded overflow-hidden">

      {/* Body */}
      <div className="flex-1 min-h-0 px-1 py-2 flex flex-col">
        {loadingCandles ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-sm font-medium">
            <Wave className="h-20 w-28" />
            <TextShimmer duration={2}>{`Loading ${activePair.split("/")[0]} Chart`}</TextShimmer>
          </div>
        ) : candles.length === 0 ? (
          <NoChartData activePair={activePair} activeTimeframe={timeframe} />
        ) : (
          <div className="w-full h-full overflow-hidden flex flex-col">
            <CandleChart candles={candles} height={280} />
          </div>
        )}
      </div>
    </div>
  )
}
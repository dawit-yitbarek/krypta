import { Zap, TrendingUp, ShieldCheck, BarChart2, PanelLeftOpen } from "lucide-react"
import { useTicker } from "@/context/TickerContext"

export function HomePage() {
    const { sidebarCollapsed, setSidebarCollapsed } = useTicker()

    return (
        <div className="flex flex-col items-center justify-center flex-1 h-full bg-[#111113] border border-[#27272a] rounded-lg p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 mb-6 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
                <img
                    src="/logo/krypta-logo.svg"
                    alt="Krypta Logo"
                    className="w-8 h-8 object-contain"
                />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#e4e4e7] sm:text-4xl max-w-lg">
                High-Performance Real-Time Crypto Terminal
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-[#a1a1aa] max-w-xl leading-relaxed">
                Select a market pair to inspect real-time order book spreads, high-frequency trade prints, and live candlestick charts powered by Binance WebSocket streams.
            </p>

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-8 sm:mt-10 w-full max-w-2xl">
                <div className="flex flex-col items-center p-4 rounded-lg bg-[#18181b] border border-[#27272a]">
                    <BarChart2 size={20} className="text-[#10b981] mb-2" />
                    <span className="text-xs font-semibold text-[#e4e4e7]">Sub-100ms Feeds</span>
                    <span className="text-[11px] text-[#71717a] mt-1">Direct WebSocket pipelines</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-[#18181b] border border-[#27272a]">
                    <TrendingUp size={20} className="text-[#3b82f6] mb-2" />
                    <span className="text-xs font-semibold text-[#e4e4e7]">Live Market Depth</span>
                    <span className="text-[11px] text-[#71717a] mt-1">Real-time order book updates</span>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-[#18181b] border border-[#27272a]">
                    <ShieldCheck size={20} className="text-[#a855f7] mb-2" />
                    <span className="text-xs font-semibold text-[#e4e4e7]">Zero State Leaks</span>
                    <span className="text-[11px] text-[#71717a] mt-1">URL-isolated route lifecycles</span>
                </div>
            </div>

            {/* Call To Action - Displayed when sidebar is hidden collapsed */}
            {sidebarCollapsed && (
                <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#10b981] hover:bg-[#059669] text-[#09090b] transition-all duration-200 shadow-[0_4px_16px_rgba(16,185,129,0.25)] active:scale-95"
                >
                    <PanelLeftOpen size={16} />
                    <span>Select Market Pair</span>
                </button>
            )}
        </div>
    )
}
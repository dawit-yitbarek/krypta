import React from 'react';
import { BarChart2 } from 'lucide-react';

interface NoChartDataProps {
    activePair?: string;
    activeTimeframe?: string
}

export const NoChartData: React.FC<NoChartDataProps> = ({ activePair = "Selected Pair", activeTimeframe }) => {
    return (
        /* No Data Available Animated State */
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-4 animate-in fade-in-50 duration-300 select-none">
            {/* Animated Candle Icon graphic */}
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-[#18181b] border border-[#27272a] shadow-inner">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#10b981]/5 to-[#f43f5e]/5 animate-pulse" />

                <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#52525b] animate-bounce duration-1000"
                >
                    {/* Wicks and empty candle bodies */}
                    <path d="M6 3v18" className="opacity-30" />
                    <path d="M12 3v18" className="opacity-60" />
                    <path d="M18 3v18" className="opacity-30" />
                    <rect x="4" y="8" width="4" height="6" rx="1" className="fill-[#18181b] stroke-[#52525b]" />
                    <rect x="10" y="6" width="4" height="10" rx="1" className="fill-[#18181b] stroke-[#71717a]" />
                    <rect x="16" y="11" width="4" height="5" rx="1" className="fill-[#18181b] stroke-[#52525b]" />
                </svg>
            </div>

            <div className="space-y-1.5 max-w-sm">
                <h3 className="text-[14px] font-semibold text-[#e4e4e7] tracking-tight">
                    No Candle Data Available
                </h3>
                <p className="text-[12px] text-[#71717a] font-sans leading-relaxed">
                    There are no historical trades or candles for{" "}
                    <span className="text-[#a1a1aa] font-mono font-medium">{activePair}</span> on the{" "}
                    <span className="inline-block px-1.5 py-0.2 bg-[#27272a] text-[#10b981] font-mono text-[11px] rounded">
                        {activeTimeframe}
                    </span>{" "}
                    interval.
                </p>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#52525b] font-mono">
                <BarChart2 size={13} className="text-[#52525b]" />
                <span>Try switching to another timeframe above</span>
            </div>
        </div>
    );
};

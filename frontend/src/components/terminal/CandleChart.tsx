import { useEffect, useRef } from "react"
import {
    createChart,
    ColorType,
    CandlestickSeries,
    HistogramSeries,
    IChartApi,
    ISeriesApi,
    UTCTimestamp,
} from "lightweight-charts"
import type { CandleData } from "@/types/index"

interface CandleChartProps {
    candles: CandleData[]
    height?: number
}

const TARGET_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

const formatTime = (time: number | string): UTCTimestamp => {
    return (typeof time === "number" && time > 1e11
        ? Math.floor(time / 1000)
        : Number(time)) as UTCTimestamp
}

export function CandleChart({ candles }: CandleChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)
    const prevCandleCountRef = useRef<number>(0)

    // 1. Initialize Chart Instance
    useEffect(() => {
        if (!chartContainerRef.current) return

        const chart = createChart(chartContainerRef.current, {
            autoSize: true,
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#a1a1aa",
            },
            grid: {
                vertLines: { color: "#27272a", style: 2 },
                horzLines: { color: "#27272a", style: 2 },
            },
            crosshair: {
                vertLine: { color: "#52525b", labelBackgroundColor: "#27272a" },
                horzLine: { color: "#52525b", labelBackgroundColor: "#27272a" },
            },
            rightPriceScale: {
                borderColor: "#27272a",
                autoScale: true,
                scaleMargins: {
                    top: 0.05,
                    bottom: 0.2,
                },
            },
            timeScale: {
                borderColor: "#27272a",
                timeVisible: true,
                secondsVisible: false,
                borderVisible: true,
                tickMarkFormatter: (timeInSeconds: number) => {
                    const date = new Date(timeInSeconds * 1000)
                    return new Intl.DateTimeFormat("en-US", {
                        timeZone: TARGET_TIMEZONE,
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    }).format(date)
                },
            },
            localization: {
                locale: typeof navigator !== "undefined" ? navigator.language : "en-US",
                timeFormatter: (timeInSeconds: number) => {
                    const date = new Date(timeInSeconds * 1000)
                    return new Intl.DateTimeFormat("en-US", {
                        timeZone: TARGET_TIMEZONE,
                        day: "2-digit",
                        month: "short",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    }).format(date)
                },
            },
        })

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#10b981",
            downColor: "#f43f5e",
            borderVisible: false,
            wickUpColor: "#10b981",
            wickDownColor: "#f43f5e",
        })

        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: "#26a69a",
            priceFormat: { type: "volume" },
            priceScaleId: "",
        })

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        })

        chartRef.current = chart
        candleSeriesRef.current = candleSeries
        volumeSeriesRef.current = volumeSeries

        const resizeObserver = new ResizeObserver(() => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                })
            }
        })
        resizeObserver.observe(chartContainerRef.current)

        return () => {
            resizeObserver.disconnect()
            chart.remove()
        }
    }, [])

    // 2. Handle Data Updates
    useEffect(() => {
        if (!candleSeriesRef.current || !volumeSeriesRef.current || !candles.length) return

        const isInitialLoad =
            prevCandleCountRef.current === 0 ||
            Math.abs(candles.length - prevCandleCountRef.current) > 5

        if (isInitialLoad) {
            // Full Dataset Load
            const formattedCandles = candles
                .map((c) => ({
                    time: formatTime(c.time),
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                }))
                .sort((a, b) => (a.time as number) - (b.time as number))

            const formattedVolume = candles
                .map((c) => ({
                    time: formatTime(c.time),
                    value: c.volume,
                    color: c.close >= c.open ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)",
                }))
                .sort((a, b) => (a.time as number) - (b.time as number))

            candleSeriesRef.current.setData(formattedCandles)
            volumeSeriesRef.current.setData(formattedVolume)
            chartRef.current?.timeScale().fitContent()
        } else {
            // Real-Time Incremental Tick Update
            const latest = candles[candles.length - 1]
            const time = formatTime(latest.time)

            candleSeriesRef.current.update({
                time,
                open: latest.open,
                high: latest.high,
                low: latest.low,
                close: latest.close,
            })

            volumeSeriesRef.current.update({
                time,
                value: latest.volume,
                color: latest.close >= latest.open ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)",
            })
        }

        prevCandleCountRef.current = candles.length
    }, [candles])

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col relative overflow-hidden">
            <div ref={chartContainerRef} className="w-full flex-1 min-h-0" />
        </div>
    )
}
import { Request, Response } from 'express';
import logger from '../config/logger.js';

export const fetchCandleDataHistory = async (req: Request, res: Response) => {
    const { symbol = 'BTCUSDT', interval = '1m', limit = '700' } = req.query;
    try {
        const safeLimit = Math.min(1000, Number(limit))
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${safeLimit}`;

        const response = await fetch(url);
        const rawData = await response.json();

        // Handle non-200 responses from Binance
        if (!response.ok || !Array.isArray(rawData)) {
            logger.warn(`Binance API error for symbol ${symbol}: ${rawData?.msg || 'Unknown error'}`);
            return res.status(response.status >= 400 && response.status < 500 ? response.status : 400).json({
                error: rawData?.msg || "Invalid symbol or request parameters",
            });
        }

        // Transform the raw Binance array into readable objects for the chart
        const formattedCandles = rawData.map((c: any) => ({
            time: Math.floor(c[0] / 1000), // Convert ms to seconds for charting libraries
            open: parseFloat(c[1]),
            high: parseFloat(c[2]),
            low: parseFloat(c[3]),
            close: parseFloat(c[4]),
            volume: parseFloat(c[5])
        }));

        res.json(formattedCandles);
    } catch (error: any) {
        logger.error(`Failed to fetch historical candles: ${error.message || error}`);
        res.status(500).json({ error: "Failed to fetch historical data" });
    }
};
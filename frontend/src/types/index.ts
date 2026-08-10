export type TimeFrame = "1s" | "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "8h" | "12h" | "1d" | "3d" | "1w" | "1M";

export interface OrderBookEntry {
    price: number;
    size: number;
    total: number;
}

export interface OrderBook {
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
}

export interface Trade {
    id: string;
    price: number;
    size: number;
    time: string;
    side: "buy" | "sell";
}

export interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    isClosed: boolean
    interval: TimeFrame
}

export interface CoinData {
    id: string;
    name: string;
    baseAsset: string;
    symbol: string;
    marketCapRank: number;
    marketCap: number;
    logo: string;
    price: number;
    changePct: number;
    high24h: number;
    low24h: number;
    quoteVolume24h: number
    baseVolume24h: number;
    direction: "up" | "down" | "neutral";
}

export type streamType = 'unknown' | 'depth' | 'trades' | 'kline' | 'ticker';
export type connectionStatus = 'connecting' | 'connected' | 'disconnected';
import { Request, Response } from 'express';

export const getTopMarketCapCoins = async (req: Request, res: Response) => {
    const { limit = 100 } = req.query;
    try {
        const STABLECOINS = new Set(["USDT", "USDC", "USDS", "DAI", "FDUSD", "TUSD", "USDE", "PYUSD"])
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1`;
        const response = await fetch(url);
        const data = await response.json()

        const tradableCoins = data.map((coin: any) => {

            return {
                id: coin.id,
                name: coin.name,
                baseAsset: coin.symbol.toUpperCase(),
                symbol: `${coin.symbol.toUpperCase()}/USDT`,
                marketCapRank: coin.market_cap_rank,
                marketCap: coin.market_cap,
                logo: coin.image,
                price: coin.current_price,
                changePct: coin.price_change_percentage_24h,
                high24h: coin.high_24h,
                low24h: coin.low_24h,
                quoteVolume24h: 0,
                baseVolume24h: 0,
                direction: "neutral"
            }
        })
            .filter((coin: any) => !STABLECOINS.has(coin.baseAsset))
            .slice(0, limit)

        res.json(tradableCoins);
    } catch (error: any) {
        console.error("Failed to fetch coins list:", error.message || error);
        res.status(500).json({ error: "Failed to fetch coins list" });
    }
};
export function toDisplaySymbol(rawSymbol?: string): string {
    if (!rawSymbol) return ""
    const upper = rawSymbol.toUpperCase()
    if (upper.includes("/")) return upper
    return upper.endsWith("USDT") ? upper.replace("USDT", "/USDT") : upper
}

export function toUrlSymbol(rawSymbol: string): string {
    return rawSymbol.replace("/", "").toUpperCase()
}
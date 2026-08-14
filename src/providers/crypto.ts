/**
 * Crypto data providers.
 * - Binance (free, no key for market data)
 * - CoinGecko (free tier)
 */

export interface CryptoQuote {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  high24h: number
  low24h: number
  marketCap?: number
}

export interface KlineBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function fetchCryptoQuote(symbol: string, baseUrl?: string): Promise<CryptoQuote> {
  const pair = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : `${symbol.toUpperCase()}USDT`
  const url = `${baseUrl ?? 'https://api.binance.com'}/api/v3/ticker/24hr?symbol=${pair}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Binance API error: ${resp.status}`)
  const data = await resp.json()

  return {
    symbol: pair,
    price: parseFloat(data.lastPrice),
    change24h: parseFloat(data.priceChange),
    changePercent24h: parseFloat(data.priceChangePercent),
    volume24h: parseFloat(data.quoteVolume),
    high24h: parseFloat(data.highPrice),
    low24h: parseFloat(data.lowPrice),
  }
}

export async function fetchCryptoKline(symbol: string, period: string, limit: number, baseUrl?: string): Promise<KlineBar[]> {
  const pair = symbol.toUpperCase().endsWith('USDT') ? symbol.toUpperCase() : `${symbol.toUpperCase()}USDT`
  const interval = period === '1d' ? '1d' : period === '1w' ? '1w' : period === '4h' ? '4h' : period === '1h' ? '1h' : '1d'
  const url = `${baseUrl ?? 'https://api.binance.com'}/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Binance API error: ${resp.status}`)
  const data = await resp.json()

  return data.map((k: any[]) => ({
    date: new Date(k[0]).toISOString().split('T')[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }))
}

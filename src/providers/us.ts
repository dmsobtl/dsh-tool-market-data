/**
 * US stock data providers.
 * - Yahoo Finance (free, no key needed for basic data)
 * - Alpha Vantage (optional, for extended data)
 */

export interface USQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  high: number
  low: number
  open: number
  prevClose: number
}

export interface KlineBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function fetchUSQuote(symbol: string): Promise<USQuote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  const data = await resp.json() as any
  const meta = data?.chart?.result?.[0]?.meta
  if (!meta) throw new Error(`No data for ${symbol}`)

  const prevClose = meta.chartPreviousClose ?? meta.previousClose
  const price = meta.regularMarketPrice
  return {
    symbol,
    price,
    change: price - prevClose,
    changePercent: ((price - prevClose) / prevClose) * 100,
    volume: meta.regularMarketVolume ?? 0,
    high: meta.regularMarketDayHigh ?? price,
    low: meta.regularMarketDayLow ?? price,
    open: meta.regularMarketOpen ?? price,
    prevClose,
  }
}

export async function fetchUSKline(symbol: string, period: string, limit: number): Promise<KlineBar[]> {
  const interval = period === '1d' ? '1d' : period === '1w' ? '1wk' : '1mo'
  const range = limit <= 30 ? '1mo' : limit <= 180 ? '6mo' : limit <= 365 ? '1y' : '5y'
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  const data = await resp.json() as any
  const result = data?.chart?.result?.[0]
  if (!result) throw new Error(`No kline data for ${symbol}`)

  const timestamps = result.timestamp ?? []
  const quotes = result.indicators?.quote?.[0] ?? {}
  const bars: KlineBar[] = []

  for (let i = 0; i < timestamps.length && bars.length < limit; i++) {
    if (quotes.open[i] == null) continue
    bars.push({
      date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      close: quotes.close[i],
      volume: quotes.volume[i] ?? 0,
    })
  }
  return bars.slice(-limit)
}

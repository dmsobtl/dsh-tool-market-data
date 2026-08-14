/**
 * A-share data providers (免费接口).
 * - 实时行情：新浪财经 API
 * - K线数据：东方财富 API
 * - 基本面：东方财富/同花顺
 */

export interface Quote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  turnover: number
  high: number
  low: number
  open: number
  prevClose: number
  time: string
}

export interface KlineBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  turnover: number
}

export async function fetchCNQuote(symbol: string): Promise<Quote> {
  const code = symbol.startsWith('6') ? `sh${symbol}` : `sz${symbol}`
  const url = `https://hq.sinajs.cn/list=${code}`
  const resp = await fetch(url, {
    headers: { 'Referer': 'https://finance.sina.com.cn' },
  })
  const text = await resp.text()
  const match = text.match(/"(.+)"/)
  if (!match) throw new Error(`No data for ${symbol}`)

  const parts = match[1].split(',')
  return {
    symbol,
    name: parts[0],
    open: parseFloat(parts[1]),
    prevClose: parseFloat(parts[2]),
    price: parseFloat(parts[3]),
    high: parseFloat(parts[4]),
    low: parseFloat(parts[5]),
    volume: parseInt(parts[8]),
    turnover: parseFloat(parts[9]),
    change: parseFloat(parts[3]) - parseFloat(parts[2]),
    changePercent: ((parseFloat(parts[3]) - parseFloat(parts[2])) / parseFloat(parts[2])) * 100,
    time: `${parts[30]} ${parts[31]}`,
  }
}

export async function fetchCNKline(symbol: string, period: string, limit: number): Promise<KlineBar[]> {
  const secid = symbol.startsWith('6') ? `1.${symbol}` : `0.${symbol}`
  const klt = period === '1d' ? '101' : period === '1w' ? '102' : period === '1m' ? '103' : '101'
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56,f57&klt=${klt}&fqt=1&lmt=${limit}`

  const resp = await fetch(url)
  const data = await resp.json() as any
  const klines = data?.data?.klines ?? []

  return klines.map((line: string) => {
    const [date, open, close, high, low, volume, turnover] = line.split(',')
    return {
      date,
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
      volume: parseInt(volume),
      turnover: parseFloat(turnover),
    }
  })
}

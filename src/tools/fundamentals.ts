import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ResolvedConfig } from '../config.js'
import { detectMarket } from '../detect.js'

export const fundamentalsTool = (_config: ResolvedConfig) => defineTool({
  name: 'market_fundamentals',
  description: 'Get fundamental data for a stock: PE, PB, ROE, revenue, profit, dividend yield, and more.',
  parameters: {
    symbol: { type: 'string', required: true, description: 'Ticker symbol' },
    market: { type: 'string', enum: ['cn', 'us'] as const, description: 'Force market type. Auto-detected if omitted.' },
  },
  output: {
    schema: { type: 'json' },
    render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  },
  async execute(args) {
    const market = args.market ?? (detectMarket(args.symbol) === 'cn' ? 'cn' : 'us')
    try {
      return market === 'cn'
        ? await fetchCNFundamentals(args.symbol)
        : await fetchUSFundamentals(args.symbol)
    } catch (err) {
      return { error: (err as Error).message, symbol: args.symbol }
    }
  },
})

async function fetchCNFundamentals(symbol: string) {
  const secid = symbol.startsWith('6') ? `1.${symbol}` : `0.${symbol}`
  const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f57,f58,f162,f163,f167,f168,f169,f170,f171,f173,f183,f184,f185,f186,f187`

  const resp = await fetch(url)
  const data = await resp.json() as any
  const d = data?.data
  if (!d) throw new Error(`No fundamental data for ${symbol}`)

  return JSON.parse(JSON.stringify({
    symbol,
    name: d.f58,
    pe: d.f162,
    pb: d.f167,
    totalMarketCap: d.f183,
    circulatingMarketCap: d.f184,
    revenue: d.f185,
    netProfit: d.f186,
    roe: d.f173,
    grossMargin: d.f187,
    debtRatio: d.f168,
    dividendYield: d.f170,
  }))
}

async function fetchUSFundamentals(symbol: string) {
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=defaultKeyStatistics,financialData,summaryDetail`
  const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const data = await resp.json() as any
  const result = data?.quoteSummary?.result?.[0]
  if (!result) throw new Error(`No fundamental data for ${symbol}`)

  const stats = result.defaultKeyStatistics ?? {}
  const fin = result.financialData ?? {}
  const detail = result.summaryDetail ?? {}

  return JSON.parse(JSON.stringify({
    symbol,
    pe: detail.trailingPE?.raw,
    forwardPe: detail.forwardPE?.raw,
    pb: stats.priceToBook?.raw,
    marketCap: detail.marketCap?.raw,
    roe: fin.returnOnEquity?.raw,
    revenue: fin.totalRevenue?.raw,
    profitMargin: fin.profitMargins?.raw,
    debtToEquity: fin.debtToEquity?.raw,
    dividendYield: detail.dividendYield?.raw,
    beta: stats.beta?.raw,
    fiftyTwoWeekHigh: detail.fiftyTwoWeekHigh?.raw,
    fiftyTwoWeekLow: detail.fiftyTwoWeekLow?.raw,
  }))
}

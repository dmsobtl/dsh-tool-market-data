import type { Config } from '../index.ts'
import { fetchCNKline } from '../providers/cn.ts'
import { fetchUSKline } from '../providers/us.ts'
import { fetchCryptoKline } from '../providers/crypto.ts'

export const klineTool = (config: Config) => ({
  name: 'market_kline',
  description: 'Get historical K-line (OHLCV candlestick) data. Returns date, open, high, low, close, volume for each bar.',
  parameters: {
    type: 'object' as const,
    properties: {
      symbol: { type: 'string' as const, description: 'Ticker symbol' },
      market: { type: 'string' as const, enum: ['cn', 'us', 'crypto'] as const },
      period: { type: 'string' as const, enum: ['1h', '4h', '1d', '1w', '1m'] as const, description: 'Bar period. Default: 1d' },
      limit: { type: 'number' as const, description: 'Number of bars. Default: 60' },
    },
    required: ['symbol'] as const,
  },
  async execute(args: { symbol: string; market?: 'cn' | 'us' | 'crypto'; period?: string; limit?: number }) {
    const market = args.market ?? detectMarket(args.symbol)
    const period = args.period ?? '1d'
    const limit = args.limit ?? 60

    try {
      let bars: any[]
      switch (market) {
        case 'cn': bars = await fetchCNKline(args.symbol, period, limit); break
        case 'us': bars = await fetchUSKline(args.symbol, period, limit); break
        case 'crypto': bars = await fetchCryptoKline(args.symbol, period, limit, config.binanceBaseUrl); break
      }

      const summary = {
        symbol: args.symbol,
        market,
        period,
        count: bars.length,
        dateRange: bars.length > 0 ? `${bars[0].date} ~ ${bars[bars.length - 1].date}` : 'N/A',
        latest: bars[bars.length - 1],
        highest: Math.max(...bars.map(b => b.high)),
        lowest: Math.min(...bars.map(b => b.low)),
        avgVolume: Math.round(bars.reduce((s, b) => s + b.volume, 0) / bars.length),
      }

      return [{ type: 'text' as const, text: JSON.stringify({ summary, bars: bars.slice(-20) }, null, 2) }]
    } catch (err: any) {
      return [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }]
    }
  },
})

function detectMarket(symbol: string): 'cn' | 'us' | 'crypto' {
  if (/^\d{6}$/.test(symbol)) return 'cn'
  if (symbol.toUpperCase().endsWith('USDT')) return 'crypto'
  if (['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'BNB'].includes(symbol.toUpperCase())) return 'crypto'
  return 'us'
}

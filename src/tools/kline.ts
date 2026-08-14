import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ResolvedConfig } from '../config.js'
import { detectMarket } from '../detect.js'
import { fetchCNKline } from '../providers/cn.js'
import { fetchUSKline } from '../providers/us.js'
import { fetchCryptoKline } from '../providers/crypto.js'

export const klineTool = (config: ResolvedConfig) => defineTool({
  name: 'market_kline',
  description: 'Get historical K-line (OHLCV candlestick) data. Returns date, open, high, low, close, volume for each bar.',
  parameters: {
    symbol: { type: 'string', required: true, description: 'Ticker symbol' },
    market: { type: 'string', enum: ['cn', 'us', 'crypto'] as const, description: 'Force market type. Auto-detected if omitted.' },
    period: { type: 'string', enum: ['1h', '4h', '1d', '1w', '1m'] as const, description: 'Bar period. Default: 1d' },
    limit: { type: 'number', description: 'Number of bars. Default: 60' },
  },
  output: {
    schema: { type: 'json' },
    render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  },
  async execute(args) {
    const market = args.market ?? detectMarket(args.symbol, config.defaultMarket)
    const period = args.period ?? '1d'
    const limit = args.limit ?? 60

    try {
      const bars = market === 'cn'
        ? await fetchCNKline(args.symbol, period, limit)
        : market === 'us'
          ? await fetchUSKline(args.symbol, period, limit)
          : await fetchCryptoKline(args.symbol, period, limit, config.binanceBaseUrl)

      const summary = bars.length > 0
        ? {
            symbol: args.symbol,
            market,
            period,
            count: bars.length,
            dateRange: `${bars[0].date} ~ ${bars[bars.length - 1].date}`,
            latest: bars[bars.length - 1],
            highest: Math.max(...bars.map((b) => b.high)),
            lowest: Math.min(...bars.map((b) => b.low)),
            avgVolume: Math.round(bars.reduce((s, b) => s + b.volume, 0) / bars.length),
          }
        : { symbol: args.symbol, market, period, count: 0 }

      return JSON.parse(JSON.stringify({ summary, bars: bars.slice(-20) }))
    } catch (err) {
      return { error: (err as Error).message, symbol: args.symbol }
    }
  },
})

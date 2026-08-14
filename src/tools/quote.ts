import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ResolvedConfig } from '../config.js'
import { detectMarket } from '../detect.js'
import { fetchCNQuote } from '../providers/cn.js'
import { fetchUSQuote } from '../providers/us.js'
import { fetchCryptoQuote } from '../providers/crypto.js'

export const quoteTool = (config: ResolvedConfig) => defineTool({
  name: 'market_quote',
  description: 'Get a real-time quote for a stock or crypto asset. Auto-detects market by symbol: 6 digits = A-share, letters = US stock, crypto symbol or *USDT = crypto.',
  parameters: {
    symbol: { type: 'string', required: true, description: 'Ticker symbol. A-share: 600519, US: AAPL, Crypto: BTC or BTCUSDT' },
    market: { type: 'string', enum: ['cn', 'us', 'crypto'] as const, description: 'Force market type. Auto-detected if omitted.' },
  },
  output: {
    schema: { type: 'json' },
    render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  },
  async execute(args) {
    const market = args.market ?? detectMarket(args.symbol, config.defaultMarket)
    try {
      const result = market === 'cn'
        ? await fetchCNQuote(args.symbol)
        : market === 'us'
          ? await fetchUSQuote(args.symbol)
          : await fetchCryptoQuote(args.symbol, config.binanceBaseUrl)
      return JSON.parse(JSON.stringify(result))
    } catch (err) {
      return { error: (err as Error).message, symbol: args.symbol, market }
    }
  },
})

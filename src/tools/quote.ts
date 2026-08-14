import type { Config } from '../index.ts'
import { fetchCNQuote } from '../providers/cn.ts'
import { fetchUSQuote } from '../providers/us.ts'
import { fetchCryptoQuote } from '../providers/crypto.ts'

export const quoteTool = (config: Config) => ({
  name: 'market_quote',
  description: 'Get real-time quote for a stock or crypto asset. Auto-detects market by symbol format: 6-digit = A-share, letters = US stock, ends with USDT or specify market=crypto.',
  parameters: {
    type: 'object' as const,
    properties: {
      symbol: { type: 'string' as const, description: 'Ticker symbol. A-share: 600519, US: AAPL, Crypto: BTC or BTCUSDT' },
      market: { type: 'string' as const, enum: ['cn', 'us', 'crypto'] as const, description: 'Force market type. Auto-detected if omitted.' },
    },
    required: ['symbol'] as const,
  },
  async execute(args: { symbol: string; market?: 'cn' | 'us' | 'crypto' }) {
    const market = args.market ?? detectMarket(args.symbol, config.defaultMarket)
    try {
      let result: any
      switch (market) {
        case 'cn': result = await fetchCNQuote(args.symbol); break
        case 'us': result = await fetchUSQuote(args.symbol); break
        case 'crypto': result = await fetchCryptoQuote(args.symbol, config.binanceBaseUrl); break
      }
      return [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    } catch (err: any) {
      return [{ type: 'text' as const, text: JSON.stringify({ error: err.message, symbol: args.symbol, market }) }]
    }
  },
})

function detectMarket(symbol: string, defaultMarket?: string): 'cn' | 'us' | 'crypto' {
  if (/^\d{6}$/.test(symbol)) return 'cn'
  if (symbol.toUpperCase().endsWith('USDT')) return 'crypto'
  if (/^[A-Z]{2,5}$/.test(symbol.toUpperCase()) && ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'BNB'].includes(symbol.toUpperCase())) return 'crypto'
  if (/^[A-Z]+$/.test(symbol.toUpperCase())) return 'us'
  return (defaultMarket as any) ?? 'us'
}

/**
 * Market auto-detection from a symbol, shared by every tool so the rules
 * cannot drift between them.
 */

import type { Market } from './config.js'

const CRYPTO_SYMBOLS = new Set([
  'BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK',
  'UNI', 'BNB', 'USDT', 'USDC', 'SHIB', 'LTC', 'BCH', 'ETC', 'XLM', 'TRX',
])

export function detectMarket(symbol: string, defaultMarket: Market = 'cn'): Market {
  const upper = symbol.toUpperCase()
  if (/^\d{6}$/.test(symbol)) return 'cn'
  if (upper.endsWith('USDT')) return 'crypto'
  if (CRYPTO_SYMBOLS.has(upper)) return 'crypto'
  if (/^[A-Z]{2,5}$/.test(upper)) return 'us'
  return defaultMarket
}

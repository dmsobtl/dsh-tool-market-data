/**
 * dsh-tool-market-data
 *
 * Multi-market financial data plugin. Supports:
 * - A-shares (via free APIs: sina, eastmoney, akshare)
 * - US stocks (via Yahoo Finance, Alpha Vantage)
 * - Crypto (via Binance, CoinGecko)
 *
 * Tools: market_quote, market_kline, market_screen, market_fundamentals
 */

import type { Context } from '@deepseek-ai/cordis'
import { quoteTool } from './tools/quote.ts'
import { klineTool } from './tools/kline.ts'
import { screenTool } from './tools/screen.ts'
import { fundamentalsTool } from './tools/fundamentals.ts'

export const name = 'tool-market-data'
export const inject = ['tools']

export interface Config {
  alphaVantageKey?: string
  binanceBaseUrl?: string
  defaultMarket?: 'cn' | 'us' | 'crypto'
}

export function apply(ctx: Context, config: Config) {
  const tools = [
    quoteTool(config),
    klineTool(config),
    screenTool(config),
    fundamentalsTool(config),
  ]
  for (const tool of tools) {
    ctx.tools.register(tool as any)
  }
}

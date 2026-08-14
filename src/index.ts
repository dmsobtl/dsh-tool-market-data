/**
 * dsh-tool-market-data
 *
 * Multi-market financial data plugin: A-shares, US stocks, and crypto.
 * Tools: market_quote, market_kline, market_screen, market_fundamentals.
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { quoteTool } from './tools/quote.js'
import { klineTool } from './tools/kline.js'
import { screenTool } from './tools/screen.js'
import { fundamentalsTool } from './tools/fundamentals.js'

export { detectMarket } from './detect.js'
export type { Market, ResolvedConfig } from './config.js'

export const name = 'tool-market-data'
export const inject = ['tools']

export const Config = z.object({
  defaultMarket: z.union([z.const('cn'), z.const('us'), z.const('crypto')]).default('cn'),
  binanceBaseUrl: z.string().default('https://api.binance.com'),
})

export function apply(ctx: Context, config: { defaultMarket: 'cn' | 'us' | 'crypto'; binanceBaseUrl: string }) {
  const resolved = { defaultMarket: config.defaultMarket, binanceBaseUrl: config.binanceBaseUrl }
  for (const tool of [
    quoteTool(resolved),
    klineTool(resolved),
    screenTool(resolved),
    fundamentalsTool(resolved),
  ]) {
    ctx.tools.register(tool)
  }
}

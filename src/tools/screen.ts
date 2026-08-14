import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ResolvedConfig } from '../config.js'

export const screenTool = (config: ResolvedConfig) => defineTool({
  name: 'market_screen',
  description: 'Screen/scan stocks by conditions. Supports A-share screening via the eastmoney API. Returns top matches.',
  parameters: {
    market: { type: 'string', enum: ['cn', 'us', 'crypto'] as const, description: 'Market to screen. Default: cn (other markets not yet supported)' },
    conditions: {
      type: 'object',
      additionalProperties: false,
      description: 'Screening conditions (all optional, combined with AND)',
      properties: {
        minPrice: { type: 'number', description: 'Minimum price' },
        maxPrice: { type: 'number', description: 'Maximum price' },
        minVolume: { type: 'number', description: 'Minimum volume (shares)' },
        minChangePercent: { type: 'number', description: 'Minimum daily change %' },
        maxChangePercent: { type: 'number', description: 'Maximum daily change %' },
        minTurnover: { type: 'number', description: 'Minimum turnover rate %' },
        minMarketCap: { type: 'number', description: 'Minimum market cap (亿)' },
      },
    },
    sortBy: { type: 'string', enum: ['changePercent', 'volume', 'turnover', 'marketCap'] as const, description: 'Sort field. Default: changePercent' },
    limit: { type: 'number', description: 'Max results. Default: 20' },
  },
  output: {
    schema: { type: 'json' },
    render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  },
  async execute(args) {
    const market = args.market ?? config.defaultMarket
    const limit = args.limit ?? 20

    if (market !== 'cn') {
      return { error: `Screening for the ${market} market is not yet implemented. Use market_quote for individual lookups.` }
    }

    return screenCN(args.conditions ?? {}, args.sortBy ?? 'changePercent', limit)
  },
})

async function screenCN(conditions: Record<string, number | undefined>, sortBy: string, limit: number) {
  const sortField = { changePercent: 'f3', volume: 'f5', turnover: 'f8', marketCap: 'f20' }[sortBy] ?? 'f3'
  const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${limit}&po=1&np=1&fltt=2&invt=2&fid=${sortField}&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f2,f3,f4,f5,f6,f7,f8,f12,f14,f15,f16,f17,f20`

  try {
    const resp = await fetch(url)
    const data = await resp.json() as any
    const items = (data?.data?.diff ?? []) as any[]

    const results = items
      .filter((item) => {
        if (conditions.minPrice !== undefined && item.f2 < conditions.minPrice) return false
        if (conditions.maxPrice !== undefined && item.f2 > conditions.maxPrice) return false
        if (conditions.minChangePercent !== undefined && item.f3 < conditions.minChangePercent) return false
        if (conditions.maxChangePercent !== undefined && item.f3 > conditions.maxChangePercent) return false
        if (conditions.minVolume !== undefined && item.f5 < conditions.minVolume) return false
        if (conditions.minTurnover !== undefined && item.f8 < conditions.minTurnover) return false
        if (conditions.minMarketCap !== undefined && item.f20 < conditions.minMarketCap) return false
        return true
      })
      .map((item) => ({
        symbol: item.f12,
        name: item.f14,
        price: item.f2,
        changePercent: item.f3,
        volume: item.f5,
        turnover: item.f6,
        turnoverRate: item.f8,
        high: item.f15,
        low: item.f16,
        open: item.f17,
        marketCap: item.f20,
      }))

    return JSON.parse(JSON.stringify({ market: 'cn', count: results.length, sortBy, results }))
  } catch (err) {
    return { error: (err as Error).message }
  }
}

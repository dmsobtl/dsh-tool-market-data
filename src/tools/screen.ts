import type { Config } from '../index.ts'

export const screenTool = (config: Config) => ({
  name: 'market_screen',
  description: 'Screen/scan stocks by conditions. Supports A-share market screening via eastmoney API. Returns top matches.',
  parameters: {
    type: 'object' as const,
    properties: {
      market: { type: 'string' as const, enum: ['cn', 'us', 'crypto'] as const, description: 'Market to screen. Default: cn' },
      conditions: {
        type: 'object' as const,
        description: 'Screening conditions',
        properties: {
          minPrice: { type: 'number' as const },
          maxPrice: { type: 'number' as const },
          minVolume: { type: 'number' as const, description: 'Minimum volume (shares)' },
          minChangePercent: { type: 'number' as const, description: 'Min daily change %' },
          maxChangePercent: { type: 'number' as const, description: 'Max daily change %' },
          minTurnover: { type: 'number' as const, description: 'Min turnover rate %' },
          minMarketCap: { type: 'number' as const, description: 'Min market cap (亿)' },
        },
        additionalProperties: false as const,
      },
      sortBy: { type: 'string' as const, enum: ['changePercent', 'volume', 'turnover', 'marketCap'] as const },
      limit: { type: 'number' as const, description: 'Max results. Default: 20' },
    },
  },
  async execute(args: { market?: string; conditions?: any; sortBy?: string; limit?: number }) {
    const market = args.market ?? config.defaultMarket ?? 'cn'
    const limit = args.limit ?? 20

    if (market === 'cn') {
      return await screenCN(args.conditions ?? {}, args.sortBy ?? 'changePercent', limit)
    }

    return [{ type: 'text' as const, text: JSON.stringify({ error: `Screening for ${market} market not yet implemented. Use market_quote for individual lookups.` }) }]
  },
})

async function screenCN(conditions: any, sortBy: string, limit: number) {
  const sortField = { changePercent: 'f3', volume: 'f5', turnover: 'f8', marketCap: 'f20' }[sortBy] ?? 'f3'
  const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${limit}&po=1&np=1&fltt=2&invt=2&fid=${sortField}&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f2,f3,f4,f5,f6,f7,f8,f12,f14,f15,f16,f17,f20`

  try {
    const resp = await fetch(url)
    const data = await resp.json()
    const items = data?.data?.diff ?? []

    const results = items
      .filter((item: any) => {
        if (conditions.minPrice && item.f2 < conditions.minPrice) return false
        if (conditions.maxPrice && item.f2 > conditions.maxPrice) return false
        if (conditions.minChangePercent && item.f3 < conditions.minChangePercent) return false
        if (conditions.maxChangePercent && item.f3 > conditions.maxChangePercent) return false
        if (conditions.minVolume && item.f5 < conditions.minVolume) return false
        if (conditions.minTurnover && item.f8 < conditions.minTurnover) return false
        return true
      })
      .map((item: any) => ({
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

    return [{ type: 'text' as const, text: JSON.stringify({ market: 'cn', count: results.length, sortBy, results }, null, 2) }]
  } catch (err: any) {
    return [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }]
  }
}

/** Shared configuration types for dsh-tool-market-data. */
export type Market = 'cn' | 'us' | 'crypto'

export interface ResolvedConfig {
  defaultMarket: Market
  binanceBaseUrl: string
}

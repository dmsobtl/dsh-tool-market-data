# dsh-tool-market-data

DSH 插件：多市场金融数据 — A 股、美股、加密货币行情/K 线/选股/基本面。

## 工具清单

| 工具 | 功能 | 数据源 |
|------|------|--------|
| `market_quote` | 实时行情（价格、涨跌幅、成交量） | A 股: 新浪 / 美股: Yahoo / 币: Binance |
| `market_kline` | 历史 K 线（OHLCV） | A 股: 东方财富 / 美股: Yahoo / 币: Binance |
| `market_screen` | 条件选股（涨幅、换手、市值） | A 股: 东方财富 |
| `market_fundamentals` | 基本面（PE/PB/ROE/营收/利润） | A 股: 东方财富 / 美股: Yahoo |

## 安装

```bash
dsh plugin add dsh-tool-market-data
```

## 配置

```yaml
- id: market-data
  plugin: dsh-tool-market-data
  config:
    defaultMarket: cn              # cn | us | crypto
    binanceBaseUrl: https://api.binance.com
    # alphaVantageKey: ${ALPHA_VANTAGE_KEY}  # 可选，扩展美股数据
```

## 市场自动识别

无需手动指定 market，插件根据 symbol 格式自动判断：

| 格式 | 识别为 | 示例 |
|------|--------|------|
| 6 位数字 | A 股 | 600519（茅台）、000001（平安） |
| 英文字母 | 美股 | AAPL、TSLA、NVDA |
| 币种名/USDT 后缀 | 加密货币 | BTC、ETHUSDT |

## 使用示例

### 实时行情

```
Agent: → market_quote({ symbol: "600519" })
{
  "symbol": "600519",
  "name": "贵州茅台",
  "price": 1856.00,
  "changePercent": 1.23,
  "volume": 2834500,
  ...
}
```

### K 线数据

```
Agent: → market_kline({ symbol: "AAPL", period: "1d", limit: 30 })
返回最近 30 根日 K 线，含 summary（最高/最低/均量）+ bars 数组
```

### 条件选股

```
Agent: → market_screen({ conditions: { minChangePercent: 5, minTurnover: 3 }, sortBy: "changePercent", limit: 10 })
返回今日涨幅 > 5% 且换手率 > 3% 的前 10 只 A 股
```

### 基本面

```
Agent: → market_fundamentals({ symbol: "NVDA" })
{
  "pe": 65.3,
  "pb": 42.1,
  "roe": 0.89,
  "revenue": 60922000000,
  "profitMargin": 0.55,
  ...
}
```

## 支持的 K 线周期

| 周期 | 参数 | A 股 | 美股 | 加密 |
|------|------|------|------|------|
| 1 小时 | `1h` | ✗ | ✗ | ✓ |
| 4 小时 | `4h` | ✗ | ✗ | ✓ |
| 日线 | `1d` | ✓ | ✓ | ✓ |
| 周线 | `1w` | ✓ | ✓ | ✓ |
| 月线 | `1m` | ✓ | ✓ | ✗ |

## 数据延迟说明

| 市场 | 延迟 | 说明 |
|------|------|------|
| A 股 | 盘中实时（新浪）/ 收盘后无延迟 | 免费接口可能有 3-5 秒延迟 |
| 美股 | 15 分钟延迟 | Yahoo Finance 免费版限制 |
| 加密 | 实时 | Binance 公开 API 无延迟 |

## License

MIT — 数据来源于公开免费 API，使用需遵守各平台服务条款。

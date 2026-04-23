# Shuriken Quickstart — TypeScript

Runnable examples for the [Shuriken TypeScript SDK](https://github.com/ShurikenTrade/shuriken-sdk-ts).

## Setup

```bash
git clone https://github.com/ShurikenTrade/shuriken-quickstart-ts.git
cd shuriken-quickstart-ts
npm install
cp .env.example .env
```

Add your API key to `.env`. You can get one at [app.shuriken.trade/agents](https://app.shuriken.trade/agents).

## Running Examples

```bash
npx tsx examples/01-account-info.ts
```

Or use the npm scripts:

```bash
npm run example:account-info
npm run example:search-tokens
# etc.
```

## Examples

### Basic (read-only)

| # | Script | Description |
|---|--------|-------------|
| 01 | `account-info.ts` | Fetch account profile, wallets, settings, and API key usage limits |
| 02 | `search-tokens.ts` | Search tokens by name/symbol across chains |
| 03 | `token-analytics.ts` | Price, OHLCV chart, trading stats, and liquidity pools for a token |
| 04 | `swap-quote.ts` | Get a swap quote without executing (SOL → USDC) |
| 05 | `portfolio-overview.ts` | Cross-chain balances, PnL, open positions, and trade history |
| 06 | `browse-perp-markets.ts` | List perp markets, inspect order book and funding rates |

### Trading (executes real transactions)

| # | Script | Description |
|---|--------|-------------|
| 07 | `execute-swap.ts` | Execute a managed swap (0.001 SOL → USDC) |
| 08 | `trigger-orders.ts` | Create a conditional trigger order, list, then cancel it |
| 09 | `perp-trading.ts` | Place a limit order with TP/SL on Hyperliquid, then cancel |

### Streaming (WebSocket, long-running)

| # | Script | Description |
|---|--------|-------------|
| 10 | `stream-token-swaps.ts` | Real-time Solana swap events for a token (30s) |
| 11 | `stream-wallet.ts` | Native SOL balance change notifications (30s) |
| 12 | `stream-new-tokens.ts` | New bonding curve token creations (60s) |
| 13 | `stream-graduated-tokens.ts` | Bonding curve graduation events (60s) |

### Alpha Streams (WebSocket, signal feeds)

| # | Script | Description |
|---|--------|-------------|
| 21 | `stream-alpha-personal.ts` | Personal alpha channel — chat messages and call references (60s) |
| 22 | `stream-alpha-signal-feed-global.ts` | Global signal feed — token signals from all sources (60s) |
| 23 | `stream-alpha-signal-feed-personal.ts` | Personal signal feed — signals filtered to your feeds (60s) |
| 24 | `stream-alpha-signal-feed-named.ts` | Named signal feed — signals for a specific feed ID (60s) |
| 25 | `stream-alpha-signal-feed-profile.ts` | Profile signal feed — signals for a specific profile (60s) |

### Advanced (composite use cases)

| # | Script | Description |
|---|--------|-------------|
| 14 | `token-sniper.ts` | Stream new tokens → analyze → auto-swap if criteria met |
| 15 | `whale-copy-trader.ts` | Monitor a whale wallet → copy their new positions |
| 16 | `portfolio-rebalancer.ts` | Compare portfolio to target allocation → generate rebalance quotes |
| 17 | `new-token-screener.ts` | Live leaderboard of new tokens ranked by liquidity and volume |
| 18 | `perps-hedger.ts` | Delta-hedge spot positions with opposing perp shorts |
| 19 | `trailing-stop.ts` | Stream price → dynamically update trigger orders as a trailing stop |
| 20 | `watchlist-dashboard.ts` | Auto-refreshing multi-token dashboard with prices, stats, and liquidity |

## SDK Documentation

See the [SDK README](https://github.com/ShurikenTrade/shuriken-sdk-ts) for full API reference.

## License

MIT

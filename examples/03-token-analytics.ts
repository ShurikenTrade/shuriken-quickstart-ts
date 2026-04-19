/**
 * 03 — Token Analytics
 *
 * Deep-dive into a single token: current price, OHLCV chart data,
 * trading stats (volume, txns, unique traders), and liquidity pools.
 *
 * Pass a token ID as the first CLI argument, or it defaults to SOL.
 */

import { createClient, formatPct, formatUsd, logJson, logSection } from "../src/helpers.js";

const DEFAULT_TOKEN = "solana:So11111111111111111111111111111111111111112"; // Wrapped SOL

async function main() {
  const client = createClient();
  const tokenId = process.argv[2] ?? DEFAULT_TOKEN;

  // ── Price ────────────────────────────────────────────────────────
  logSection(`Price — ${tokenId}`);
  const price = await client.tokens.getPrice(tokenId);
  console.log(`  Price : ${formatUsd(price.priceUsd)}`);

  // ── Chart (1h candles, last 24) ──────────────────────────────────
  logSection("OHLCV Chart (1h × 24)");
  const chart = await client.tokens.getChart({ tokenId, resolution: "1h", count: 24 });
  console.log(`  Resolution : ${chart.resolution}`);
  console.log(`  Candles    : ${chart.candles.length}`);
  if (chart.candles.length > 0) {
    const latest = chart.candles[chart.candles.length - 1];
    console.log(
      `  Latest     : O=${formatUsd(latest.open)} H=${formatUsd(latest.high)} L=${formatUsd(latest.low)} C=${formatUsd(latest.close)}`,
    );
  }

  // ── Stats ────────────────────────────────────────────────────────
  logSection("Trading Stats");
  const stats = await client.tokens.getStats(tokenId);

  console.log("\n  Volume (USD):");
  console.log(`    5m : buy ${formatUsd(stats.volume.buy5m)}  sell ${formatUsd(stats.volume.sell5m)}`);
  console.log(`    1h : buy ${formatUsd(stats.volume.buy1h)}  sell ${formatUsd(stats.volume.sell1h)}`);
  console.log(`   24h : buy ${formatUsd(stats.volume.buy24h)} sell ${formatUsd(stats.volume.sell24h)}`);

  console.log("\n  Price Change:");
  console.log(`    5m : ${formatPct(stats.priceChange["5m"])}`);
  console.log(`    1h : ${formatPct(stats.priceChange["1h"])}`);
  console.log(`   24h : ${formatPct(stats.priceChange["24h"])}`);

  console.log("\n  Unique Traders (24h):");
  console.log(`    Buyers  : ${stats.uniqueTraders.buyers24h}`);
  console.log(`    Sellers : ${stats.uniqueTraders.sellers24h}`);

  // ── Pools ────────────────────────────────────────────────────────
  logSection("Liquidity Pools");
  const pools = await client.tokens.getPools(tokenId);
  for (const pool of pools.pools) {
    console.log(`  ${pool.address ?? "unknown"}`);
    console.log(`    Liquidity  : ${formatUsd(pool.liquidityUsd)}`);
    console.log(`    Market Cap : ${formatUsd(pool.marketCapUsd)}`);
  }
}

main().catch(console.error);

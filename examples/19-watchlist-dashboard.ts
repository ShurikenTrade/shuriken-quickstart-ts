/**
 * 19 — Watchlist Dashboard
 *
 * Batch-fetches a configurable watchlist of tokens and displays
 * prices, 24h stats, and pool liquidity in a formatted table.
 * Refreshes every 30 seconds.
 */

import { createClient, formatPct, formatUsd, logSection, sleep } from "../src/helpers.js";

// ── Watchlist (token IDs) ──────────────────────────────────────────
const WATCHLIST = [
  "solana:So11111111111111111111111111111111111111112", // SOL
  "solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "solana:JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", // JUP
];

const REFRESH_INTERVAL = 30_000; // 30 seconds
const MAX_REFRESHES = 10;

async function main() {
  const client = createClient();

  // Batch-fetch token metadata once
  const tokenMeta = await client.tokens.batch({ tokens: WATCHLIST });
  const tokenMap = new Map(tokenMeta.tokens.map((t) => [t.tokenId, t]));

  for (let round = 1; round <= MAX_REFRESHES; round++) {
    console.clear();
    console.log("=".repeat(110));
    console.log(`  WATCHLIST DASHBOARD  (refresh ${round}/${MAX_REFRESHES} — ${new Date().toLocaleTimeString()})`);
    console.log("=".repeat(110));

    // Fetch all data in parallel
    const [prices, allStats, allPools] = await Promise.all([
      Promise.all(WATCHLIST.map((id) => client.tokens.getPrice(id).catch(() => null))),
      Promise.all(WATCHLIST.map((id) => client.tokens.getStats(id).catch(() => null))),
      Promise.all(WATCHLIST.map((id) => client.tokens.getPools(id).catch(() => null))),
    ]);

    // Header
    console.log(
      `\n  ${"Token".padEnd(10)}${"Price".padEnd(16)}${"5m".padEnd(10)}${"1h".padEnd(10)}${"24h".padEnd(10)}${"Vol 24h".padEnd(16)}${"Liquidity".padEnd(16)}Buyers/Sellers`,
    );
    console.log(`  ${"-".repeat(106)}`);

    for (let i = 0; i < WATCHLIST.length; i++) {
      const tokenId = WATCHLIST[i];
      const meta = tokenMap.get(tokenId);
      const price = prices[i];
      const stats = allStats[i];
      const pools = allPools[i];

      const symbol = meta?.symbol ?? tokenId.slice(0, 8);
      const priceStr = formatUsd(price?.priceUsd);
      const chg5m = formatPct(stats?.priceChange["5m"]);
      const chg1h = formatPct(stats?.priceChange["1h"]);
      const chg24h = formatPct(stats?.priceChange["24h"]);

      const vol24h = stats ? formatUsd((stats.volume.buy24h ?? 0) + (stats.volume.sell24h ?? 0)) : "N/A";

      const topPool = pools?.pools[0];
      const liquidity = topPool?.liquidityUsd ? formatUsd(topPool.liquidityUsd) : "N/A";

      const buyers = stats?.uniqueTraders.buyers24h ?? "?";
      const sellers = stats?.uniqueTraders.sellers24h ?? "?";

      console.log(
        `  ${symbol.padEnd(10)}` +
          `${priceStr.padEnd(16)}` +
          `${chg5m.padEnd(10)}` +
          `${chg1h.padEnd(10)}` +
          `${chg24h.padEnd(10)}` +
          `${vol24h.padEnd(16)}` +
          `${liquidity.padEnd(16)}` +
          `${buyers}/${sellers}`,
      );
    }

    if (tokenMeta.notFound.length > 0) {
      console.log(`\n  Not found: ${tokenMeta.notFound.join(", ")}`);
    }

    if (round < MAX_REFRESHES) {
      console.log(`\n  Next refresh in ${REFRESH_INTERVAL / 1000}s... (Ctrl+C to stop)`);
      await sleep(REFRESH_INTERVAL);
    }
  }

  console.log("\n  Dashboard complete.");
}

main().catch(console.error);

/**
 * 17 — New Token Screener
 *
 * Streams new bonding curve creations, enriches each token with
 * on-chain analytics (stats + pools), then ranks them in a live
 * leaderboard by liquidity and volume.
 *
 * This is purely read-only — no trades are executed.
 */

import type { SvmBondingCurveCreationEvent } from "@shuriken/sdk-ts";
import { createClient, formatUsd, logSection, handleError } from "../src/helpers.js";

interface TokenScore {
  address: string;
  dexType: string;
  discoveredAt: Date;
  liquidity: number;
  volume24h: number;
  buyers24h: number;
  sellers24h: number;
  priceChange5m: number;
}

async function main() {
  const client = createClient();

  logSection("New Token Screener");
  console.log("  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Connected! Screening new tokens for 5 minutes...\n");

  const leaderboard: TokenScore[] = [];

  client.ws.subscribe("svm.bondingCurve.creations", {}, async (event: SvmBondingCurveCreationEvent) => {
    const tokenId = `solana:${event.tokenAddress}`;

    try {
      const [stats, pools] = await Promise.all([
        client.tokens.getStats(tokenId).catch(() => null),
        client.tokens.getPools(tokenId).catch(() => null),
      ]);

      const topPool = pools?.pools[0];
      const liquidity = topPool?.liquidityUsd ? Number.parseFloat(topPool.liquidityUsd) : 0;
      const volume24h = stats ? (stats.volume.buy24h ?? 0) + (stats.volume.sell24h ?? 0) : 0;
      const buyers24h = stats?.uniqueTraders.buyers24h ?? 0;
      const sellers24h = stats?.uniqueTraders.sellers24h ?? 0;
      const priceChange5m = stats?.priceChange["5m"] ?? 0;

      const score: TokenScore = {
        address: event.tokenAddress,
        dexType: event.curveDexType,
        discoveredAt: new Date(),
        liquidity,
        volume24h,
        buyers24h,
        sellers24h,
        priceChange5m,
      };

      leaderboard.push(score);

      // Print updated leaderboard (top 10 by liquidity)
      const sorted = [...leaderboard].sort((a, b) => b.liquidity - a.liquidity);
      const top = sorted.slice(0, 10);

      console.clear();
      console.log("=".repeat(100));
      console.log("  NEW TOKEN SCREENER — Live Leaderboard (sorted by liquidity)");
      console.log("=".repeat(100));
      console.log(
        `  ${"#".padEnd(4)}${"Token".padEnd(48)}${"Liq".padEnd(14)}${"Vol 24h".padEnd(14)}` +
          `${"Buyers".padEnd(10)}${"5m Chg".padEnd(10)}`,
      );
      console.log(`  ${"-".repeat(96)}`);

      for (const [i, t] of top.entries()) {
        console.log(
          `  ${String(i + 1).padEnd(4)}` +
            `${t.address.padEnd(48)}` +
            `${formatUsd(t.liquidity).padEnd(14)}` +
            `${formatUsd(t.volume24h).padEnd(14)}` +
            `${String(t.buyers24h).padEnd(10)}` +
            `${`${(t.priceChange5m >= 0 ? "+" : "") + t.priceChange5m.toFixed(1)}%`}`,
        );
      }

      console.log(`\n  Total tokens discovered: ${leaderboard.length}`);
    } catch {
      // Skip tokens we can't analyze
    }
  });

  setTimeout(() => {
    console.log("\n  Screener complete. Disconnecting...");
    client.ws.disconnect();
  }, 5 * 60_000);
}

main().catch(handleError);

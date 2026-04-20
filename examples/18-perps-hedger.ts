/**
 * 18 — Perps Hedger
 *
 * Reads your spot portfolio positions and opens opposing perpetual
 * positions to delta-hedge. Shows the net exposure before and after.
 *
 * ⚠️  Set DRY_RUN=false to actually open perp positions.
 */

import { createClient, formatUsd, logSection } from "../src/helpers.js";

const DRY_RUN = true;

// Map of spot token addresses to perp coin symbols
const SPOT_TO_PERP: Record<string, string> = {
  So11111111111111111111111111111111111111112: "SOL",
  // Add more mappings as needed
};

async function main() {
  const client = createClient();

  const wallets = await client.account.getWallets();
  const wallet = wallets[0];
  if (!wallet) {
    console.error("No wallet found");
    return;
  }

  // ── Spot positions ───────────────────────────────────────────────
  logSection("Spot Portfolio");
  const positions = await client.portfolio.getPositions({ chain: "solana" });

  const hedgeable: { coin: string; spotValueUsd: number; tokenAddress: string }[] = [];

  for (const pos of positions.positions) {
    const value = pos.latestTokenUsdPrice * (Number.parseFloat(pos.latestBalanceRaw) / 10 ** pos.tokenDecimal);
    const perpCoin = SPOT_TO_PERP[pos.tokenAddress];

    console.log(
      `  ${pos.tokenAddress.slice(0, 12)}...  ` + `Value: ${formatUsd(value)}  ` + `Perp: ${perpCoin ?? "N/A"}`,
    );

    if (perpCoin && value > 1) {
      hedgeable.push({ coin: perpCoin, spotValueUsd: value, tokenAddress: pos.tokenAddress });
    }
  }

  if (hedgeable.length === 0) {
    console.log("\n  No hedgeable positions found (need spot tokens with matching perp markets)");
    return;
  }

  // ── Current perp positions ───────────────────────────────────────
  logSection("Current Perp Positions");
  const perpPositions = await client.perps.getPositions();

  const existingPerps = new Map<string, number>();
  for (const p of perpPositions.positions) {
    const notional = Number.parseFloat(p.szi) * Number.parseFloat(p.entryPx);
    existingPerps.set(p.coin, notional);
    console.log(`  ${p.coin}  size=${p.szi}  notional=${formatUsd(Math.abs(notional))}`);
  }
  if (perpPositions.positions.length === 0) {
    console.log("  No open perp positions");
  }

  // ── Calculate hedge orders ───────────────────────────────────────
  logSection("Hedge Plan");
  console.log(
    `  ${"Coin".padEnd(8)}${"Spot Long".padEnd(16)}${"Perp Short".padEnd(16)}${"Net Exposure".padEnd(16)}Action`,
  );
  console.log(`  ${"-".repeat(64)}`);

  for (const h of hedgeable) {
    const existingShort = existingPerps.get(h.coin) ?? 0;
    // existingShort is negative for shorts
    const netExposure = h.spotValueUsd + existingShort;
    const needToShort = netExposure;

    const action = Math.abs(needToShort) < 1 ? "HEDGED" : `SHORT ${formatUsd(needToShort)}`;

    console.log(
      `  ${h.coin.padEnd(8)}${formatUsd(h.spotValueUsd).padEnd(16)}${formatUsd(Math.abs(existingShort)).padEnd(16)}${formatUsd(netExposure).padEnd(16)}${action}`,
    );

    if (Math.abs(needToShort) >= 1 && !DRY_RUN) {
      // Get market price for sizing
      const market = await client.perps.getMarket(h.coin);
      const price = Number.parseFloat(market.ctx.markPx);
      const size = (needToShort / price).toFixed(market.meta.szDecimals);

      const result = await client.perps.placeOrder({
        walletId: wallet.walletId,
        coin: h.coin,
        isBuy: false, // short
        sizeUsd: needToShort.toFixed(0),
        orderType: "market",
      });

      console.log(`    → Order placed: ${result.results[0]?.status} OID=${result.results[0]?.oid ?? "N/A"}`);
    }
  }

  if (DRY_RUN) {
    console.log("\n  [DRY RUN] No orders placed. Set DRY_RUN=false to execute.");
  }
}

main().catch(console.error);

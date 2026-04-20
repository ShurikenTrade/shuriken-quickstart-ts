/**
 * 06 — Browse Perp Markets
 *
 * List all available perpetual markets on Hyperliquid and inspect
 * a single market's order book, funding rate, and metadata.
 *
 * Pass a coin symbol as the first CLI argument, or it defaults to BTC.
 */

import { createClient, formatUsd, logSection, handleError } from "../src/helpers.js";

async function main() {
  const client = createClient();
  const coin = process.argv[2] ?? "BTC";

  // ── All Markets ──────────────────────────────────────────────────
  logSection("Perpetual Markets");
  const markets = await client.perps.getMarkets();
  console.log(`  Total markets: ${markets.length}\n`);

  // Show top 10 by volume
  const sorted = [...markets].sort((a, b) => Number.parseFloat(b.ctx.dayNtlVlm) - Number.parseFloat(a.ctx.dayNtlVlm));
  console.log("  Top 10 by 24h Volume:");
  console.log(`  ${"Coin".padEnd(10)}${"Price".padEnd(16)}${"24h Volume".padEnd(18)}${"Funding".padEnd(14)}Max Lev`);
  console.log(`  ${"-".repeat(70)}`);

  for (const m of sorted.slice(0, 10)) {
    const price = formatUsd(Number.parseFloat(m.ctx.markPx));
    const vol = formatUsd(Number.parseFloat(m.ctx.dayNtlVlm));
    const funding = `${(Number.parseFloat(m.ctx.funding) * 100).toFixed(4)}%`;
    console.log(
      `  ${m.meta.name.padEnd(10)}${price.padEnd(16)}${vol.padEnd(18)}${funding.padEnd(14)}${m.meta.maxLeverage}x`,
    );
  }

  // ── Single Market Deep-Dive ──────────────────────────────────────
  logSection(`Market Detail: ${coin}`);
  const market = await client.perps.getMarket(coin);

  console.log(`  Name          : ${market.meta.name}`);
  console.log(`  Max Leverage  : ${market.meta.maxLeverage}x`);
  console.log(`  Size Decimals : ${market.meta.szDecimals}`);
  console.log(`  Only Isolated : ${market.meta.onlyIsolated}`);
  console.log(`  Mark Price    : ${formatUsd(Number.parseFloat(market.ctx.markPx))}`);
  console.log(`  Oracle Price  : ${formatUsd(Number.parseFloat(market.ctx.oraclePx))}`);
  console.log(`  24h Volume    : ${formatUsd(Number.parseFloat(market.ctx.dayNtlVlm))}`);
  console.log(`  Open Interest : ${market.ctx.openInterest}`);
  console.log(`  Funding Rate  : ${(Number.parseFloat(market.ctx.funding) * 100).toFixed(4)}%`);

  // ── Order Book Snapshot ──────────────────────────────────────────
  logSection("Order Book (top 5)");
  console.log(`  ${"ASKS".padEnd(40)}BIDS`);
  console.log(
    `  ${"Price".padEnd(16)}${"Size".padEnd(14)}${"Orders".padEnd(10)}${"Price".padEnd(16)}${"Size".padEnd(14)}Orders`,
  );
  console.log(`  ${"-".repeat(70)}`);

  const depth = 5;
  for (let i = 0; i < depth; i++) {
    const ask = market.asks[i];
    const bid = market.bids[i];
    const askStr = ask
      ? `${ask.price.padEnd(16)}${ask.size.padEnd(14)}${String(ask.numOrders).padEnd(10)}`
      : " ".repeat(40);
    const bidStr = bid ? `${bid.price.padEnd(16)}${bid.size.padEnd(14)}${String(bid.numOrders)}` : "";
    console.log(`  ${askStr}${bidStr}`);
  }
}

main().catch(handleError);

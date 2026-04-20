/**
 * 05 — Portfolio Overview
 *
 * Fetch your cross-chain wallet balances, PnL summary, open positions,
 * and recent trade history — a complete portfolio snapshot.
 */

import { createClient, formatPct, formatToken, formatUsd, logSection, handleError } from "../src/helpers.js";

async function main() {
  const client = createClient();

  // ── Balances ─────────────────────────────────────────────────────
  logSection("Wallet Balances");
  const balances = await client.portfolio.getBalances();
  for (const b of balances) {
    console.log(`  [${b.chain}] ${b.walletAddress}`);
    console.log(`    ${formatToken(b.nativeBalance, b.nativeSymbol)}  (${formatUsd(b.nativeBalanceUsd)})`);
  }

  // ── PnL ──────────────────────────────────────────────────────────
  logSection("PnL Summary (30d)");
  const pnl = await client.portfolio.getPnl({ timeframe: "30d" });
  console.log(`  Total Value       : ${formatUsd(pnl.totalValueUsd)}`);
  console.log(`  Total Bought      : ${formatUsd(pnl.totalBoughtUsd)}`);
  console.log(`  Total Sold        : ${formatUsd(pnl.totalSoldUsd)}`);
  console.log(`  Realized PnL      : ${formatUsd(pnl.totalRealizedPnlUsd)}`);
  console.log(`  Unrealized PnL    : ${formatUsd(pnl.totalUnrealizedPnlUsd)}`);
  console.log(`  Total PnL         : ${formatUsd(pnl.totalPnlUsd)}`);
  console.log(`  Open Positions    : ${pnl.positionCount}`);

  // ── Positions ────────────────────────────────────────────────────
  logSection("Open Positions");
  const positions = await client.portfolio.getPositions();
  console.log(`  Count       : ${positions.positionCount}`);
  console.log(`  Total Value : ${formatUsd(positions.totalValueUsd)}`);

  const top = positions.positions.slice(0, 10);
  const tokenIds = top.map((p) => `${p.network}:${p.tokenAddress}`);
  const tokenLookup = new Map<string, { name: string; symbol: string }>();
  if (tokenIds.length > 0) {
    const batch = await client.tokens.batch({ tokens: tokenIds });
    for (const t of batch.tokens) {
      tokenLookup.set(t.address, { name: t.name, symbol: t.symbol });
    }
  }

  for (const pos of top) {
    const token = tokenLookup.get(pos.tokenAddress);
    const label = token ? `${token.name} (${token.symbol})` : pos.tokenAddress;
    console.log(`\n  ${label}`);
    console.log(`    Address : ${pos.tokenAddress}`);
    console.log(`    Wallet  : ${pos.walletAddress}`);
    console.log(`    Price   : ${formatUsd(pos.latestTokenUsdPrice, 8)}`);
  }

  // ── Recent Trades ────────────────────────────────────────────────
  logSection("Recent Trades (last 10)");
  const trades = await client.portfolio.getHistory({ limit: 10 });
  for (const t of trades) {
    const side = t.isBuy ? "BUY " : "SELL";
    const time = new Date(t.timestamp * 1000).toISOString();
    console.log(`  ${time}  ${side}  ${formatUsd(t.sizeUsd)}  ${t.token}  (${t.chain})`);
  }
}

main().catch(handleError);

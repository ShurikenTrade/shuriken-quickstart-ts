/**
 * 15 — Portfolio Rebalancer
 *
 * Fetches your current portfolio positions and compares them to target
 * allocation percentages. For each token that's overweight or underweight,
 * it generates the swap quotes needed to rebalance.
 *
 * This is read-only — it only generates quotes, never executes.
 */

import { createClient, formatPct, formatUsd, logSection } from "../src/helpers.js";

// ── Target allocation (token address → target %) ───────────────────
// Customize these to your desired portfolio weights
const TARGET_ALLOCATION: Record<string, { symbol: string; targetPct: number }> = {
  So11111111111111111111111111111111111111112: { symbol: "SOL", targetPct: 50 },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: "USDC", targetPct: 30 },
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: { symbol: "JUP", targetPct: 20 },
};

async function main() {
  const client = createClient();

  // ── Fetch current positions ──────────────────────────────────────
  logSection("Current Portfolio");
  const positions = await client.portfolio.getPositions({ chain: "solana" });
  const totalValue = positions.totalValueUsd;
  console.log(`  Total Value: ${formatUsd(totalValue)}`);

  // Build current allocation map
  const currentAlloc = new Map<string, { symbol: string; valueUsd: number; currentPct: number }>();

  for (const pos of positions.positions) {
    const value = pos.latestTokenUsdPrice * (Number.parseFloat(pos.latestBalanceRaw) / 10 ** pos.tokenDecimal);
    currentAlloc.set(pos.tokenAddress, {
      symbol: pos.tokenAddress.slice(0, 8),
      valueUsd: value,
      currentPct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    });
  }

  // ── Compare to targets ───────────────────────────────────────────
  logSection("Allocation Comparison");
  console.log(`  ${"Token".padEnd(10)}${"Current %".padEnd(14)}${"Target %".padEnd(14)}${"Diff".padEnd(14)}Action`);
  console.log(`  ${"-".repeat(60)}`);

  const rebalanceActions: { from: string; to: string; amountUsd: number }[] = [];

  for (const [address, target] of Object.entries(TARGET_ALLOCATION)) {
    const current = currentAlloc.get(address);
    const currentPct = current?.currentPct ?? 0;
    const diffPct = currentPct - target.targetPct;
    const diffUsd = (diffPct / 100) * totalValue;

    let action = "OK";
    if (Math.abs(diffPct) > 2) {
      action = diffPct > 0 ? `SELL ${formatUsd(Math.abs(diffUsd))}` : `BUY ${formatUsd(Math.abs(diffUsd))}`;
    }

    console.log(
      `  ${target.symbol.padEnd(10)}${`${currentPct.toFixed(1).padStart(6)}%`.padEnd(14)}${`${target.targetPct.toFixed(1).padStart(6)}%`.padEnd(14)}${`${formatPct(diffPct)}`.padEnd(14)}${action}`,
    );

    if (diffPct > 2) {
      // Overweight — sell this token for USDC, then we'll use USDC to buy underweight
      rebalanceActions.push({
        from: address,
        to: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        amountUsd: Math.abs(diffUsd),
      });
    }
  }

  // ── Generate rebalance quotes ────────────────────────────────────
  if (rebalanceActions.length === 0) {
    logSection("Portfolio is balanced (within 2% tolerance)");
    return;
  }

  logSection("Rebalance Quotes");
  for (const action of rebalanceActions) {
    try {
      // Get price to calculate raw amount
      const tokenId = `solana:${action.from}`;
      const price = await client.tokens.getPrice(tokenId);
      if (!price.priceUsd) continue;

      const tokenAmount = action.amountUsd / price.priceUsd;
      const info = await client.tokens.get(tokenId);
      const rawAmount = Math.floor(tokenAmount * 10 ** info.decimals).toString();

      const quote = await client.swap.getQuote({
        chain: "solana",
        inputMint: action.from,
        outputMint: action.to,
        amount: rawAmount,
      });

      const targetSymbol = TARGET_ALLOCATION[action.from]?.symbol ?? action.from.slice(0, 8);
      console.log(`\n  Sell ${targetSymbol} → USDC`);
      console.log(`    In       : ${quote.inAmount} (raw)`);
      console.log(`    Out      : ${quote.outAmount} (raw USDC)`);
      console.log(`    Impact   : ${quote.priceImpactPct ?? "N/A"}`);
      console.log(`    Quote ID : ${quote.quoteId}`);
    } catch (err) {
      console.log(`\n  Error quoting ${action.from}: ${err}`);
    }
  }

  console.log("\n  To execute these rebalances, use client.swap.execute() with the appropriate parameters.");
}

main().catch(console.error);

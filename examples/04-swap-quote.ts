/**
 * 04 — Swap Quote
 *
 * Get a swap quote without executing it. This is completely read-only
 * and safe to run — no funds are moved.
 *
 * Demonstrates getQuote() with route and fee breakdown.
 */

import { createClient, formatUsd, logSection } from "../src/helpers.js";

const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

async function main() {
  const client = createClient();

  // ── Get quote: 0.1 SOL → USDC on Solana ─────────────────────────
  logSection("Swap Quote: 0.1 SOL → USDC");
  const quote = await client.swap.getQuote({
    chain: "solana",
    inputMint: SOL,
    outputMint: USDC,
    amount: "100000000", // 0.1 SOL in lamports (9 decimals)
    slippageBps: 50,
  });

  console.log(`  Quote ID     : ${quote.quoteId}`);
  console.log(`  Chain        : ${quote.chain}`);
  console.log(`  In           : ${quote.inAmount} (raw)`);
  console.log(`  Out          : ${quote.outAmount} (raw)`);
  console.log(`  Slippage     : ${quote.slippageBps} bps`);
  console.log(`  Price Impact : ${quote.priceImpactPct ?? "N/A"}`);
  console.log(`  Expires At   : ${quote.expiresAt}`);

  // ── Fee breakdown ────────────────────────────────────────────────
  logSection("Fees");
  console.log(`  Platform Fee : ${quote.fees.platformFeeAmount ?? "0"} (${quote.fees.platformFeeBps ?? 0} bps)`);
  console.log(`  DEX Fee      : ${quote.fees.dexFeeInNative ?? "0"} (native)`);

  // ── Routes ───────────────────────────────────────────────────────
  logSection("Routes");
  for (const [i, route] of quote.routes.entries()) {
    console.log(`  Route ${i + 1}: ${route.source}`);
    console.log(`    In  : ${route.inAmount ?? "N/A"}`);
    console.log(`    Out : ${route.outAmount ?? "N/A"}`);
  }
}

main().catch(console.error);

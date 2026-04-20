/**
 * 02 — Search Tokens
 *
 * Search for tokens by name or symbol across all supported chains.
 * Demonstrates the tokens.search() endpoint with optional chain filtering.
 */

import { createClient, formatUsd, logSection, handleError } from "../src/helpers.js";

async function main() {
  const client = createClient();

  // ── Search across all chains ─────────────────────────────────────
  logSection("Search: 'bonk' (all chains)");
  const results = await client.tokens.search({ q: "bonk", limit: 5 });
  for (const t of results) {
    console.log(`  ${t.symbol.padEnd(10)} ${t.name.padEnd(30)} ${t.chain.padEnd(10)} ${t.address}`);
  }

  // ── Search on Solana only ────────────────────────────────────────
  logSection("Search: 'usdc' (solana only)");
  const solResults = await client.tokens.search({ q: "usdc", chain: "solana", limit: 5 });
  for (const t of solResults) {
    console.log(`  ${t.symbol.padEnd(10)} ${t.name.padEnd(30)} ${t.tokenId}`);
  }

  // ── Get full token info ──────────────────────────────────────────
  if (results.length > 0) {
    const first = results[0];
    logSection(`Token Details: ${first.symbol}`);
    const info = await client.tokens.get(first.tokenId);
    console.log(`  Token ID : ${info.tokenId}`);
    console.log(`  Name     : ${info.name}`);
    console.log(`  Symbol   : ${info.symbol}`);
    console.log(`  Chain    : ${info.chain}`);
    console.log(`  Decimals : ${info.decimals}`);

    const price = await client.tokens.getPrice(first.tokenId);
    console.log(`  Price    : ${formatUsd(price.priceUsd)}`);
  }
}

main().catch(handleError);

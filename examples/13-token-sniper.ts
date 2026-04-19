/**
 * 13 — Token Sniper
 *
 * Streams new bonding curve token creations on Solana, fetches analytics
 * for each new token (stats + pools), and if criteria are met (e.g.
 * minimum liquidity, volume), executes a small swap to buy in early.
 *
 * ⚠️  This example will execute real swaps if criteria are met.
 * Adjust SNIPE_AMOUNT and the criteria to your risk tolerance.
 */

import type { SvmBondingCurveCreationEvent } from "@shuriken/sdk-ts";
import { createClient, formatUsd, logSection, sleep } from "../src/helpers.js";

// ── Configuration ──────────────────────────────────────────────────
const SNIPE_AMOUNT_LAMPORTS = "1000000"; // 0.001 SOL
const SOL_MINT = "So11111111111111111111111111111111111111112";
const MIN_LIQUIDITY_USD = 1000;
const DRY_RUN = true; // Set to false to actually execute swaps

async function main() {
  const client = createClient();

  const wallets = await client.account.getWallets();
  const wallet = wallets.find((w) => w.chain === "solana" || w.chain === null);
  if (!wallet) {
    console.error("No Solana wallet found");
    return;
  }

  logSection("Token Sniper");
  console.log(`  Wallet    : ${wallet.address}`);
  console.log(`  Amount    : ${SNIPE_AMOUNT_LAMPORTS} lamports`);
  console.log(`  Min Liq   : ${formatUsd(MIN_LIQUIDITY_USD)}`);
  console.log(`  Dry Run   : ${DRY_RUN}`);
  console.log("\n  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Listening for new tokens...\n");

  let seen = 0;
  let sniped = 0;

  client.ws.subscribe("svm.bondingCurve.creations", {}, async (event: SvmBondingCurveCreationEvent) => {
    seen++;
    const tokenAddress = event.tokenAddress;
    console.log(`  [${seen}] New token: ${tokenAddress} (${event.curveDexType})`);

    try {
      // Fetch token analytics
      const tokenId = `solana:${tokenAddress}`;
      const [stats, pools] = await Promise.all([
        client.tokens.getStats(tokenId).catch(() => null),
        client.tokens.getPools(tokenId).catch(() => null),
      ]);

      // Check criteria
      const topPool = pools?.pools[0];
      const liquidity = topPool?.liquidityUsd ? Number.parseFloat(topPool.liquidityUsd) : 0;
      const volume24h = stats ? (stats.volume.buy24h ?? 0) + (stats.volume.sell24h ?? 0) : 0;

      console.log(`    Liquidity: ${formatUsd(liquidity)} | 24h Vol: ${formatUsd(volume24h)}`);

      if (liquidity < MIN_LIQUIDITY_USD) {
        console.log("    SKIP — below min liquidity\n");
        return;
      }

      // Criteria met — snipe!
      console.log("    MATCH — criteria met!");
      if (DRY_RUN) {
        console.log(`    [DRY RUN] Would buy ${SNIPE_AMOUNT_LAMPORTS} lamports of SOL → ${tokenAddress}\n`);
        return;
      }

      const result = await client.swap.execute({
        chain: "solana",
        inputMint: SOL_MINT,
        outputMint: tokenAddress,
        amount: SNIPE_AMOUNT_LAMPORTS,
        walletId: wallet.walletId,
        slippageBps: 500,
      });

      sniped++;
      console.log(`    SNIPED! Task: ${result.taskId} Status: ${result.status}`);

      // Poll for final status
      let status = result;
      while (status.status === "submitted" || status.status === "pending") {
        await sleep(2000);
        status = await client.swap.getStatus(status.taskId);
      }
      console.log(`    Final: ${status.status} Tx: ${status.txHash ?? "N/A"}\n`);
    } catch (err) {
      console.log(`    Error analyzing token: ${err}\n`);
    }
  });

  // Run for 5 minutes
  setTimeout(() => {
    console.log(`\n  Seen: ${seen} tokens | Sniped: ${sniped}`);
    client.ws.disconnect();
  }, 5 * 60_000);
}

main().catch(console.error);

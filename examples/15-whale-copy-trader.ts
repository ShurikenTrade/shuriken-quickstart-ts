/**
 * 15 — Whale Copy Trader
 *
 * Monitors a whale wallet's token balance changes via WebSocket. When
 * a new token appears in their wallet (balance goes from 0 to > 0),
 * we fetch a quote and optionally execute the same swap.
 *
 * ⚠️  Set DRY_RUN=false to execute real trades. Use with caution.
 */

import type { SvmWalletTokenBalanceEvent } from "@shuriken/sdk-ts";
import { createClient, formatToken, formatUsd, logSection, sleep, handleError } from "../src/helpers.js";

// ── Configuration ──────────────────────────────────────────────────
const WHALE_ADDRESS = process.argv[2] ?? ""; // Pass whale address as CLI arg
const COPY_AMOUNT_LAMPORTS = "1000000"; // 0.001 SOL per copy trade
const SOL_MINT = "So11111111111111111111111111111111111111112";
const DRY_RUN = true;

async function main() {
  if (!WHALE_ADDRESS) {
    console.error("Usage: npx tsx examples/14-whale-copy-trader.ts <whale-wallet-address>");
    return;
  }

  const client = createClient();

  const wallets = await client.account.getWallets();
  const wallet = wallets.find((w) => w.chain === "solana" || w.chain === null);
  if (!wallet) {
    console.error("No Solana wallet found");
    return;
  }

  logSection("Whale Copy Trader");
  console.log(`  Watching  : ${WHALE_ADDRESS}`);
  console.log(`  My Wallet : ${wallet.address}`);
  console.log(`  Copy Size : ${COPY_AMOUNT_LAMPORTS} lamports`);
  console.log(`  Dry Run   : ${DRY_RUN}`);
  console.log("\n  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Connected! Monitoring whale activity...\n");

  const knownTokens = new Set<string>();
  let copyCount = 0;

  client.ws.subscribe(
    "svm.wallet.tokenBalances",
    { walletAddress: WHALE_ADDRESS },
    async (event: SvmWalletTokenBalanceEvent) => {
      const isNewPosition = event.preBalance === 0 && event.postBalance > 0;
      const isSell = event.preBalance > 0 && event.postBalance === 0;

      if (isNewPosition && !knownTokens.has(event.mint)) {
        knownTokens.add(event.mint);
        console.log("  NEW POSITION detected!");
        console.log(`    Token    : ${event.mint}`);
        console.log(`    Balance  : ${formatToken(event.postBalance / 10 ** event.decimals)}`);
        console.log(`    Slot     : ${event.slot}`);

        try {
          // Get a quote first to see what we'd get
          const quote = await client.swap.getQuote({
            chain: "solana",
            inputMint: SOL_MINT,
            outputMint: event.mint,
            amount: COPY_AMOUNT_LAMPORTS,
          });
          console.log(`    Quote    : ${quote.outAmount} tokens out`);
          console.log(`    Impact   : ${quote.priceImpactPct ?? "N/A"}`);

          if (DRY_RUN) {
            console.log("    [DRY RUN] Would execute swap\n");
            return;
          }

          const result = await client.swap.execute({
            chain: "solana",
            inputMint: SOL_MINT,
            outputMint: event.mint,
            amount: COPY_AMOUNT_LAMPORTS,
            walletId: wallet.walletId,
            slippageBps: 300,
          });

          copyCount++;
          console.log(`    COPIED! Task: ${result.taskId}`);

          let status = result;
          while (status.status === "submitted" || status.status === "pending") {
            await sleep(2000);
            status = await client.tasks.getStatus(status.taskId);
          }
          console.log(`    Final: ${status.status} Tx: ${status.txHash ?? "N/A"}\n`);
        } catch (err) {
          console.log(`    Error: ${err}\n`);
        }
      } else if (isSell) {
        console.log(`  WHALE SOLD: ${event.mint} (full exit)\n`);
      }
    },
  );

  // Run for 10 minutes
  setTimeout(() => {
    console.log(`\n  Copied ${copyCount} trades. Disconnecting...`);
    client.ws.disconnect();
  }, 10 * 60_000);
}

main().catch(handleError);

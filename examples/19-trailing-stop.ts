/**
 * 19 — Trailing Stop
 *
 * Streams real-time swap events for a token to track price, then
 * dynamically creates/updates trigger orders to implement a trailing
 * stop-loss that follows the price upward.
 *
 * ⚠️  This creates real trigger orders. Review the configuration
 * before running with DRY_RUN=false.
 */

import type { SvmSwapEvent } from "@shuriken/sdk-ts";
import { createClient, formatUsd, logSection, sleep, handleError } from "../src/helpers.js";

// ── Configuration ──────────────────────────────────────────────────
const TOKEN_ADDRESS = process.argv[2] ?? "So11111111111111111111111111111111111111112";
const TRAIL_PCT = 5; // Trailing stop distance (5% below peak)
const SELL_AMOUNT = "1000000"; // Amount to sell in base units
const DRY_RUN = true;

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

async function main() {
  const client = createClient();

  const wallets = await client.account.getWallets();
  const wallet = wallets.find((w) => w.chain === "solana" || w.chain === null);
  if (!wallet) {
    console.error("No Solana wallet found");
    return;
  }

  // Get initial price
  const tokenId = `solana:${TOKEN_ADDRESS}`;
  const initialPrice = await client.tokens.getPrice(tokenId);
  let peakPrice = initialPrice.priceUsd ?? 0;
  let stopPrice = peakPrice * (1 - TRAIL_PCT / 100);
  let activeOrderId: string | null = null;

  logSection("Trailing Stop");
  console.log(`  Token     : ${TOKEN_ADDRESS}`);
  console.log(`  Trail %   : ${TRAIL_PCT}%`);
  console.log(`  Initial   : ${formatUsd(peakPrice)}`);
  console.log(`  Stop      : ${formatUsd(stopPrice)}`);
  console.log(`  Dry Run   : ${DRY_RUN}`);

  await client.ws.connect();
  console.log("\n  Streaming prices...\n");

  let eventCount = 0;

  client.ws.subscribe("svm.token.swaps", { tokenAddress: TOKEN_ADDRESS }, async (event: SvmSwapEvent) => {
    eventCount++;
    const price = Number.parseFloat(event.priceUsd);
    if (Number.isNaN(price) || price <= 0) return;

    const newPeak = price > peakPrice;
    if (newPeak) {
      peakPrice = price;
      const newStop = peakPrice * (1 - TRAIL_PCT / 100);

      if (newStop > stopPrice) {
        const oldStop = stopPrice;
        stopPrice = newStop;

        console.log(
          `  [${eventCount}] NEW PEAK ${formatUsd(peakPrice)} — ` +
            `stop raised ${formatUsd(oldStop)} → ${formatUsd(stopPrice)}`,
        );

        if (!DRY_RUN) {
          // Cancel old trigger and create new one
          if (activeOrderId) {
            try {
              await client.trigger.cancel(activeOrderId);
            } catch {
              // Order may already be triggered/cancelled
            }
          }

          try {
            const order = await client.trigger.create({
              chain: "solana",
              inputToken: TOKEN_ADDRESS,
              outputToken: USDC_MINT,
              amount: SELL_AMOUNT,
              walletId: wallet.walletId,
              triggerMetric: "price_usd",
              triggerDirection: "below",
              triggerValue: stopPrice.toFixed(6),
            });
            activeOrderId = order.orderId;
            console.log(`    → Trigger updated: ${order.orderId}`);
          } catch (err) {
            console.log(`    → Error creating trigger: ${err}`);
          }
        }
      }
    }

    // Periodic status line
    if (eventCount % 20 === 0) {
      console.log(
        `  [${eventCount}] Price: ${formatUsd(price)}  ` +
          `Peak: ${formatUsd(peakPrice)}  ` +
          `Stop: ${formatUsd(stopPrice)}  ` +
          `Gap: ${(((peakPrice - price) / peakPrice) * 100).toFixed(2)}%`,
      );
    }
  });

  // Run for 5 minutes
  setTimeout(async () => {
    console.log(`\n  Processed ${eventCount} price events.`);
    console.log(`  Final peak: ${formatUsd(peakPrice)}  Stop: ${formatUsd(stopPrice)}`);

    if (activeOrderId && !DRY_RUN) {
      console.log(`  Active trigger order: ${activeOrderId}`);
    }
    client.ws.disconnect();
  }, 5 * 60_000);
}

main().catch(handleError);

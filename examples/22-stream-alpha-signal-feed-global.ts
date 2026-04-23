/**
 * 22 — Stream Global Signal Feed
 *
 * Subscribe to the global signal feed — real-time token signals
 * aggregated across all sources (Discord, Telegram, X, on-chain trades).
 * Each event includes token metadata and the latest signal with price
 * and liquidity data.
 *
 * Runs for 60 seconds, then disconnects.
 */

import type { AlphaGlobalSignalFeedEvent } from "@shuriken/sdk-ts";
import { createClient, formatUsd, handleError, logSection } from "../src/helpers.js";

async function main() {
  const client = createClient();

  logSection("Streaming Global Signal Feed");
  console.log("  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Connected! Listening for 60 seconds...\n");

  let count = 0;

  const sub = client.ws.subscribe("alpha.signalFeedGlobal", {}, (event: AlphaGlobalSignalFeedEvent) => {
    count++;
    const symbol = event.tokenMeta?.symbol ?? "???";
    const name = event.tokenMeta?.name ?? "Unknown";
    const signal = event.latestSignal;

    console.log(`  #${count} ${symbol} (${name}) on ${event.network}`);
    console.log(`    Token   : ${event.tokenAddress}`);
    if (signal) {
      const time = new Date(signal.timestampMs).toISOString();
      console.log(`    Signal  : ${signal.source.sourceType} at ${time}`);
      console.log(`    Price   : ${formatUsd(signal.priceUsd)}`);
      console.log(`    MCap    : ${formatUsd(signal.marketcapUsd)}`);
      console.log(`    Liq     : ${formatUsd(signal.liquidityUsd)}`);
      if (signal.dexName) console.log(`    DEX     : ${signal.dexName}`);
    }
    console.log();
  });

  setTimeout(() => {
    console.log(`  Received ${count} global signal feed events. Disconnecting...`);
    sub.unsubscribe();
    client.ws.disconnect();
  }, 60_000);
}

main().catch(handleError);

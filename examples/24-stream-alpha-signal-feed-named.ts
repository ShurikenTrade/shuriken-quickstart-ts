/**
 * 24 — Stream Named Signal Feed
 *
 * Subscribe to a specific named signal feed by its feed ID. Named feeds
 * are custom feeds you configure in the Shuriken app. Each event delivers
 * token signals routed to that feed.
 *
 * Usage:
 *   npx tsx examples/24-stream-alpha-signal-feed-named.ts <feedId>
 *
 * Runs for 60 seconds, then disconnects.
 */

import type { AlphaNamedSignalFeedEvent } from "@shuriken/sdk-ts";
import { createClient, formatUsd, handleError, logSection } from "../src/helpers.js";

async function main() {
  const feedId = process.argv[2];
  if (!feedId) {
    console.error("Usage: npx tsx examples/24-stream-alpha-signal-feed-named.ts <feedId>");
    process.exit(1);
  }

  const client = createClient();

  logSection(`Streaming Named Signal Feed — ${feedId}`);
  console.log("  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Connected! Listening for 60 seconds...\n");

  let count = 0;

  const sub = client.ws.subscribe("alpha.signalFeedNamed", { feedId }, (event: AlphaNamedSignalFeedEvent) => {
    count++;
    const symbol = event.tokenMeta?.symbol ?? "???";
    const name = event.tokenMeta?.name ?? "Unknown";
    const signal = event.latestSignal;

    console.log(`  #${count} ${symbol} (${name}) on ${event.network}`);
    console.log(`    Token   : ${event.tokenAddress}`);
    if (event.feedId) console.log(`    Feed    : ${event.feedId}`);
    if (signal) {
      const time = new Date(signal.timestampMs).toISOString();
      console.log(`    Signal  : ${signal.source.sourceType} at ${time}`);
      console.log(`    Price   : ${formatUsd(signal.priceUsd)}`);
      console.log(`    MCap    : ${formatUsd(signal.marketcapUsd)}`);
      console.log(`    Liq     : ${formatUsd(signal.liquidityUsd)}`);
    }
    console.log();
  });

  setTimeout(() => {
    console.log(`  Received ${count} named feed events. Disconnecting...`);
    sub.unsubscribe();
    client.ws.disconnect();
  }, 60_000);
}

main().catch(handleError);

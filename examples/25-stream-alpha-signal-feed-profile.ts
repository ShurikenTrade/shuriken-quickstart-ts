/**
 * 25 — Stream Profile Signal Feed
 *
 * Subscribe to a profile-based signal feed by profile ID. Profile feeds
 * aggregate signals from all feeds linked to a specific profile.
 *
 * Usage:
 *   npx tsx examples/25-stream-alpha-signal-feed-profile.ts <profileId>
 *
 * Runs for 60 seconds, then disconnects.
 */

import type { AlphaProfileSignalFeedEvent } from "@shuriken/sdk-ts";
import { createClient, formatUsd, handleError, logSection } from "../src/helpers.js";

async function main() {
  const profileId = process.argv[2];
  if (!profileId) {
    console.error("Usage: npx tsx examples/25-stream-alpha-signal-feed-profile.ts <profileId>");
    process.exit(1);
  }

  const client = createClient();

  logSection(`Streaming Profile Signal Feed — ${profileId}`);
  console.log("  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Connected! Listening for 60 seconds...\n");

  let count = 0;

  const sub = client.ws.subscribe("alpha.signalFeedProfile", { profileId }, (event: AlphaProfileSignalFeedEvent) => {
    count++;
    const symbol = event.tokenMeta?.symbol ?? "???";
    const name = event.tokenMeta?.name ?? "Unknown";
    const signal = event.latestSignal;

    console.log(`  #${count} ${symbol} (${name}) on ${event.network}`);
    console.log(`    Token   : ${event.tokenAddress}`);
    console.log(`    Profile : ${event.profileId}`);
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
    console.log(`  Received ${count} profile feed events. Disconnecting...`);
    sub.unsubscribe();
    client.ws.disconnect();
  }, 60_000);
}

main().catch(handleError);

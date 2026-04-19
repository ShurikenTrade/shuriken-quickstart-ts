/**
 * 12 — Stream New Tokens
 *
 * Subscribe to bonding curve creation events on Solana. Every time a
 * new token launches via a bonding curve (e.g. pump.fun), you'll see
 * it here in real-time.
 *
 * Runs for 60 seconds, then disconnects.
 */

import type { SvmBondingCurveCreationEvent } from "@shuriken/sdk-ts";
import { createClient, logSection } from "../src/helpers.js";

async function main() {
  const client = createClient();

  logSection("Streaming New Bonding Curve Tokens");
  console.log("  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Connected! Listening for 60 seconds...\n");

  let count = 0;

  const sub = client.ws.subscribe("svm.bondingCurve.creations", {}, (event: SvmBondingCurveCreationEvent) => {
    count++;
    console.log(`  #${count} New Token`);
    console.log(`    Token   : ${event.tokenAddress}`);
    console.log(`    Curve   : ${event.curveAddress}`);
    console.log(`    DEX     : ${event.curveDexType}`);
    console.log(`    Block   : ${event.blockIndex}`);
    console.log();
  });

  setTimeout(() => {
    console.log(`  Received ${count} new token events. Disconnecting...`);
    sub.unsubscribe();
    client.ws.disconnect();
  }, 60_000);
}

main().catch(console.error);

/**
 * 13 — Stream Graduated Tokens
 *
 * Subscribe to bonding curve graduation events on Solana. When a token
 * migrates from a bonding curve (e.g. pump.fun) to a full DEX pool,
 * a graduation event fires.
 *
 * Runs for 60 seconds, then disconnects.
 */

import type { SvmBondingCurveGraduationEvent } from "@shuriken/sdk-ts";
import { createClient, logSection, handleError } from "../src/helpers.js";

async function main() {
  const client = createClient();

  logSection("Streaming Bonding Curve Graduations");
  console.log("  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Connected! Listening for 60 seconds...\n");

  let count = 0;

  const sub = client.ws.subscribe("svm.bondingCurve.graduations", {}, (event: SvmBondingCurveGraduationEvent) => {
    count++;
    console.log(`  #${count} Graduation`);
    console.log(`    Token     : ${event.tokenAddress}`);
    console.log(`    Curve     : ${event.curveAddress}`);
    console.log(`    Curve DEX : ${event.curveDexType}`);
    console.log(`    Dest Pool : ${event.destPoolAddress}`);
    console.log(`    Dest DEX  : ${event.destPoolDexType}`);
    console.log(`    Sig       : ${event.signature}`);
    console.log(`    Slot      : ${event.slot}`);
    console.log(`    Block     : ${event.blockHeight} (${new Date(event.blockTime * 1000).toISOString()})`);
    console.log(`    Network   : ${event.network}`);
    console.log();
  });

  setTimeout(() => {
    console.log(`  Received ${count} graduation events. Disconnecting...`);
    sub.unsubscribe();
    client.ws.disconnect();
  }, 60_000);
}

main().catch(handleError);

/**
 * 10 — Stream Token Swaps
 *
 * Subscribe to real-time swap events for a Solana token via WebSocket.
 * Prints each swap as it happens for 30 seconds, then disconnects.
 *
 * Pass a token address as the first CLI argument, or it defaults to SOL.
 */

import type { SvmSwapEvent } from "@shuriken/sdk-ts";
import { createClient, formatToken, formatUsd, logSection } from "../src/helpers.js";

const DEFAULT_TOKEN = "So11111111111111111111111111111111111111112";

async function main() {
  const client = createClient();
  const tokenAddress = process.argv[2] ?? DEFAULT_TOKEN;

  logSection(`Streaming Swaps — ${tokenAddress}`);
  console.log("  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Connected! Listening for 30 seconds...\n");

  let count = 0;

  const sub = client.ws.subscribe("svm.token.swaps", { tokenAddress }, (event: SvmSwapEvent) => {
    count++;
    const side = event.isBuy ? "BUY " : "SELL";
    const time = new Date(event.blockTime * 1000).toISOString();
    console.log(
      `  #${count} ${time}  ${side}  ` +
        `${formatToken(event.sizeSol, "SOL")}  ` +
        `${formatUsd(event.sizeUsd)}  ` +
        `maker=${event.maker?.slice(0, 8) ?? "?"}...  ` +
        `sig=${event.signature.slice(0, 16)}...`,
    );
  });

  // Auto-disconnect after 30s
  setTimeout(() => {
    console.log(`\n  Received ${count} swap events. Disconnecting...`);
    sub.unsubscribe();
    client.ws.disconnect();
  }, 30_000);
}

main().catch(console.error);

/**
 * 11 — Stream Wallet Balance
 *
 * Subscribe to native SOL balance changes for a wallet address.
 * Prints each balance update for 30 seconds, then disconnects.
 *
 * Pass a wallet address as the first CLI argument, or it uses your
 * first registered wallet.
 */

import type { SvmNativeBalanceEvent } from "@shuriken/sdk-ts";
import { createClient, formatToken, logSection, handleError } from "../src/helpers.js";

async function main() {
  const client = createClient();

  let walletAddress = process.argv[2];
  if (!walletAddress) {
    const wallets = await client.account.getWallets();
    const solWallet = wallets.find((w) => w.chain === "solana" || w.chain === null);
    if (!solWallet) {
      console.error("No Solana wallet found — pass a wallet address as argument");
      return;
    }
    walletAddress = solWallet.address;
  }

  logSection(`Streaming SOL Balance — ${walletAddress}`);
  console.log("  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Connected! Listening for 30 seconds...\n");

  let count = 0;

  const sub = client.ws.subscribe("svm.wallet.nativeBalance", { walletAddress }, (event: SvmNativeBalanceEvent) => {
    count++;
    const pre = event.preBalance / 1e9;
    const post = event.postBalance / 1e9;
    const delta = post - pre;
    const sign = delta >= 0 ? "+" : "";
    const time = new Date(event.blockTime * 1000).toISOString();

    console.log(
      `  #${count} ${time}  ` +
        `${formatToken(pre, "SOL")} → ${formatToken(post, "SOL")}  ` +
        `(${sign}${delta.toFixed(9)} SOL)  ` +
        `slot=${event.slot}`,
    );
  });

  setTimeout(() => {
    console.log(`\n  Received ${count} balance events. Disconnecting...`);
    sub.unsubscribe();
    client.ws.disconnect();
  }, 30_000);
}

main().catch(handleError);

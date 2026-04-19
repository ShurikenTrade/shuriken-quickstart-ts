/**
 * 07 — Execute Swap
 *
 * Execute a managed swap using a Shuriken-hosted wallet. The platform
 * signs the transaction for you — no private key needed.
 *
 * ⚠️  THIS EXAMPLE MOVES REAL FUNDS. It swaps a very small amount by
 * default (0.001 SOL) but review the parameters before running.
 */

import { createClient, formatUsd, logSection, sleep } from "../src/helpers.js";

const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

async function main() {
  const client = createClient();

  // Pick the first Solana wallet
  const wallets = await client.account.getWallets();
  const solWallet = wallets.find((w) => w.chain === "solana" || w.chain === null);
  if (!solWallet) {
    console.error("No Solana wallet found on your account");
    return;
  }
  console.log(`Using wallet: ${solWallet.label ?? solWallet.walletId} (${solWallet.address})`);

  // ── Execute: 0.001 SOL → USDC ───────────────────────────────────
  logSection("Executing Swap: 0.001 SOL → USDC");
  const result = await client.swap.execute({
    chain: "solana",
    inputMint: SOL,
    outputMint: USDC,
    amount: "1000000", // 0.001 SOL (9 decimals)
    walletId: solWallet.walletId,
    slippageBps: 100,
  });

  console.log(`  Task ID : ${result.taskId}`);
  console.log(`  Status  : ${result.status}`);

  // ── Poll until finished ──────────────────────────────────────────
  logSection("Polling Status");
  let status = result;
  while (status.status === "submitted" || status.status === "pending") {
    await sleep(2000);
    status = await client.swap.getStatus(status.taskId);
    console.log(`  ${new Date().toISOString()} — ${status.status}`);
  }

  logSection("Final Result");
  console.log(`  Status  : ${status.status}`);
  console.log(`  Tx Hash : ${status.txHash ?? "N/A"}`);
  if (status.errorMessage) {
    console.log(`  Error   : ${status.errorMessage}`);
  }
}

main().catch(console.error);

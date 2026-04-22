/**
 * 07 — Execute Swap
 *
 * Execute a managed swap using a Shuriken-hosted wallet. The platform
 * signs the transaction for you — no private key needed.
 *
 * ⚠️  THIS EXAMPLE MOVES REAL FUNDS. It swaps a very small amount by
 * default (0.001 SOL) but review the parameters before running.
 */

import * as readline from "node:readline/promises";
import { createClient, formatUsd, logSection, sleep, handleError } from "../src/helpers.js";

const SOL = "So11111111111111111111111111111111111111112";
const JUP = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";

async function main() {
  const client = createClient();

  // Pick a Solana wallet
  const wallets = await client.account.getWallets();
  const solWallets = wallets.filter((w) => w.chain === "solana" || w.chain === null);
  if (solWallets.length === 0) {
    console.error("No Solana wallet found on your account");
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("close", () => {
    console.log("\nAborted.");
    process.exit(0);
  });

  const balances = await client.portfolio.getBalances({ chain: "solana" });

  let solWallet = solWallets[0];
  if (solWallets.length > 1) {
    console.log("\nAvailable Solana wallets:");
    for (let i = 0; i < solWallets.length; i++) {
      const w = solWallets[i];
      const bal = balances.find((b) => b.walletAddress === w.address);
      const solBal = bal ? `${bal.nativeBalance} SOL` : "unknown balance";
      console.log(`  [${i + 1}] ${w.label ?? w.walletId} (${w.address}) — ${solBal}`);
    }
    const choice = await rl.question(`\nSelect wallet (1-${solWallets.length}):  `);
    const idx = Number.parseInt(choice, 10) - 1;
    if (idx < 0 || idx >= solWallets.length) {
      console.log("Invalid selection. Aborted.");
      rl.close();
      return;
    }
    solWallet = solWallets[idx];
  }

  console.log(`\nUsing wallet: ${solWallet.label ?? solWallet.walletId} (${solWallet.address})`);

  // ── Confirm before executing ────────────────────────────────────
  const answer = await rl.question(
    "\n⚠️  This will execute a REAL trade: 0.001 SOL → JUP. Type 'yes' to continue:  ",
  );
  rl.removeAllListeners("close");
  rl.close();
  if (answer !== "yes") {
    console.log("Aborted.");
    return;
  }

  // ── Execute: 0.001 SOL → JUP ───────────────────────────────────
  logSection("Executing Swap: 0.001 SOL → JUP");
  const result = await client.swap.execute({
    chain: "solana",
    inputMint: SOL,
    outputMint: JUP,
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
    status = await client.tasks.getStatus(status.taskId);
    console.log(`  ${new Date().toISOString()} — ${status.status}`);
  }

  logSection("Final Result");
  console.log(`  Status  : ${status.status}`);
  console.log(`  Tx Hash : ${status.txHash ?? "N/A"}`);
  if (status.errorMessage) {
    console.log(`  Error   : ${status.errorMessage}`);
  }
}

main().catch(handleError);

/**
 * 08 — Trigger Orders
 *
 * Interactively create a conditional trigger order. You pick the
 * token pair, amount, direction, and trigger price.
 *
 * ⚠️  This creates a REAL trigger order that stays active until
 *     triggered, cancelled, or expired.
 */

import * as readline from "node:readline/promises";
import { createClient, formatUsd, handleError, logSection } from "../src/helpers.js";

const SOL = "So11111111111111111111111111111111111111112";

async function main() {
  const client = createClient();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("close", () => {
    console.log("\nAborted.");
    process.exit(0);
  });

  // ── Pick a wallet ───────────────────────────────────────────────
  const wallets = await client.account.getWallets();
  const solWallets = wallets.filter((w) => w.chain === "solana" || w.chain === null);
  if (solWallets.length === 0) {
    console.error("No Solana wallet found on your account");
    return;
  }

  const balances = await client.portfolio.getBalances({ chain: "solana" });

  let wallet = solWallets[0];
  if (solWallets.length > 1) {
    console.log("\nAvailable Solana wallets:");
    for (let i = 0; i < solWallets.length; i++) {
      const w = solWallets[i];
      const bal = balances.find((b) => b.walletAddress === w.address);
      const solBal = bal ? `${bal.nativeBalance} SOL` : "unknown balance";
      console.log(`  [${i + 1}] ${w.label ?? w.walletId} (${w.address}) — ${solBal}`);
    }
    let idx = -1;
    while (idx < 0 || idx >= solWallets.length) {
      const choice = await rl.question(`\nSelect wallet (1-${solWallets.length}):  `);
      idx = Number.parseInt(choice, 10) - 1;
      if (idx < 0 || idx >= solWallets.length) {
        console.log(`  Please enter a number between 1 and ${solWallets.length}.`);
      }
    }
    wallet = solWallets[idx];
  }

  console.log(`\nUsing wallet: ${wallet.label ?? wallet.walletId} (${wallet.address})`);

  // ── Pick a token ────────────────────────────────────────────────
  const tokenQuery = await rl.question("\nSearch for a token (name, symbol, or address):  ");
  const results = await client.tokens.search({ q: tokenQuery, chain: "solana", limit: 5 });
  if (results.length === 0) {
    console.log("No tokens found. Aborted.");
    rl.close();
    return;
  }

  console.log("\nResults:");
  for (let i = 0; i < results.length; i++) {
    const t = results[i];
    console.log(`  [${i + 1}] ${t.name} (${t.symbol}) — ${t.address.slice(0, 8)}...`);
  }

  let tokenIdx = -1;
  while (tokenIdx < 0 || tokenIdx >= results.length) {
    const tokenChoice = await rl.question(`\nSelect token (1-${results.length}):  `);
    tokenIdx = Number.parseInt(tokenChoice, 10) - 1;
    if (tokenIdx < 0 || tokenIdx >= results.length) {
      console.log(`  Please enter a number between 1 and ${results.length}.`);
    }
  }
  const token = results[tokenIdx];

  // ── Show current price ──────────────────────────────────────────
  const price = await client.tokens.getPrice(`solana:${token.address}`);
  console.log(`\n  Current price of ${token.symbol}: ${formatUsd(Number(price.priceUsd), 8)}`);

  // ── Order parameters ────────────────────────────────────────────
  console.log(`\n  Trigger direction:`);
  console.log(`    'below' = buy the dip — swap SOL → ${token.symbol} when price drops to your target`);
  console.log(`    'above' = take profit — swap SOL → ${token.symbol} when price rises to your target`);
  let directionInput = "";
  while (directionInput !== "above" && directionInput !== "below") {
    directionInput = await rl.question("\nTrigger direction — 'above' or 'below':  ");
    if (directionInput !== "above" && directionInput !== "below") {
      console.log("  Please enter 'above' or 'below'.");
    }
  }

  let triggerPrice = "";
  while (!triggerPrice || Number.isNaN(Number(triggerPrice)) || Number(triggerPrice) <= 0) {
    triggerPrice = await rl.question("Trigger price (USD):  ");
    if (Number.isNaN(Number(triggerPrice)) || Number(triggerPrice) <= 0) {
      console.log("  Please enter a valid price greater than 0.");
    }
  }

  let amountSol = "";
  while (!amountSol || Number.isNaN(Number(amountSol)) || Number(amountSol) <= 0) {
    amountSol = await rl.question("Amount of SOL to swap:  ");
    if (Number.isNaN(Number(amountSol)) || Number(amountSol) <= 0) {
      console.log("  Please enter a valid amount greater than 0.");
    }
  }
  const amountLamports = String(Math.round(Number(amountSol) * 1e9));

  // ── Confirm ─────────────────────────────────────────────────────
  console.log(`\n  Order summary:`);
  console.log(`    Swap    : ${amountSol} SOL → ${token.symbol}`);
  console.log(`    When    : ${token.symbol} price goes ${directionInput} ${formatUsd(Number(triggerPrice))}`);
  console.log(`    Current : ${formatUsd(Number(price.priceUsd), 8)}`);

  const confirm = await rl.question("\n⚠️  This will create a REAL trigger order. Type 'yes' to continue:  ");
  rl.removeAllListeners("close");
  rl.close();
  if (confirm !== "yes") {
    console.log("Aborted.");
    return;
  }

  // ── Create the order ────────────────────────────────────────────
  logSection("Creating Trigger Order");
  let order;
  try {
    order = await client.trigger.create({
      chain: "solana",
      inputToken: SOL,
      outputToken: token.address,
      amount: amountLamports,
      walletId: wallet.walletId,
      triggerMetric: "price_usd",
      triggerDirection: directionInput,
      triggerValue: triggerPrice,
    });
  } catch (err: any) {
    if (err.message?.includes("NONCE_NOT_INITIALIZED")) {
      console.error("  This wallet does not have durable nonce accounts initialized.");
      console.error("  Trigger orders on Solana require durable nonce. Please initialize");
      console.error("  nonce accounts via the Terminal app (app.shuriken.trade) first.");
      return;
    }
    throw err;
  }

  console.log(`  Order ID  : ${order.orderId}`);
  console.log(`  Status    : ${order.status}`);
  console.log(`  Trigger   : ${token.symbol} ${order.trigger.direction} ${formatUsd(Number(order.trigger.value))}`);

  // ── List orders ─────────────────────────────────────────────────
  logSection("Your Trigger Orders");
  const list = await client.trigger.list({ limit: 10 });

  const addresses = new Set<string>();
  for (const o of list.orders) {
    addresses.add(o.inputToken);
    addresses.add(o.outputToken);
  }
  const tokenLookup = new Map<string, string>();
  if (addresses.size > 0) {
    const batch = await client.tokens.batch({ tokens: [...addresses].map((a) => `solana:${a}`) });
    for (const t of batch.tokens) {
      tokenLookup.set(t.address, t.symbol);
    }
  }

  for (const o of list.orders) {
    const input = tokenLookup.get(o.inputToken) ?? o.inputToken.slice(0, 8);
    const output = tokenLookup.get(o.outputToken) ?? o.outputToken.slice(0, 8);
    const trigger = o.trigger
      ? `${o.trigger.metric} ${o.trigger.direction} ${o.trigger.value ?? "trailing"}`
      : "N/A";
    console.log(`  ${o.orderId}  ${o.status.padEnd(10)}  ${input} → ${output}  ${trigger}`);
  }
}

main().catch(handleError);

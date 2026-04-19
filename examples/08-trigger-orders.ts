/**
 * 08 — Trigger Orders
 *
 * Create a conditional trigger order (e.g. buy when price drops),
 * list your open orders, then cancel the one we just created.
 *
 * ⚠️  This creates a REAL trigger order (then immediately cancels it).
 */

import { createClient, logJson, logSection } from "../src/helpers.js";

const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

async function main() {
  const client = createClient();

  // Pick a wallet
  const wallets = await client.account.getWallets();
  const wallet = wallets.find((w) => w.chain === "solana" || w.chain === null);
  if (!wallet) {
    console.error("No Solana wallet found");
    return;
  }

  // ── Create a trigger order ───────────────────────────────────────
  // Buy 0.001 SOL worth of USDC when SOL price drops below $100
  logSection("Creating Trigger Order");
  const order = await client.trigger.create({
    chain: "solana",
    inputToken: USDC,
    outputToken: SOL,
    amount: "1000", // 0.001 USDC (6 decimals)
    walletId: wallet.walletId,
    triggerMetric: "price_usd",
    triggerDirection: "below",
    triggerValue: "100",
  });

  console.log(`  Order ID  : ${order.orderId}`);
  console.log(`  Status    : ${order.status}`);
  console.log(`  Chain     : ${order.chain}`);
  console.log(`  Trigger   : ${order.trigger.metric} ${order.trigger.direction} ${order.trigger.value}`);

  // ── List orders ──────────────────────────────────────────────────
  logSection("Listing Trigger Orders");
  const list = await client.trigger.list({ limit: 5 });
  for (const o of list.orders) {
    const trigger = o.trigger ? `${o.trigger.metric} ${o.trigger.direction} ${o.trigger.value ?? "trailing"}` : "N/A";
    console.log(`  ${o.orderId}  ${o.status.padEnd(10)}  ${trigger}`);
  }

  // ── Get single order ─────────────────────────────────────────────
  logSection("Order Detail");
  const detail = await client.trigger.get(order.orderId);
  logJson(order.orderId, detail);

  // ── Cancel the order ─────────────────────────────────────────────
  logSection("Cancelling Order");
  const cancelled = await client.trigger.cancel(order.orderId);
  console.log(`  Order ${cancelled.orderId} → ${cancelled.status}`);
}

main().catch(console.error);

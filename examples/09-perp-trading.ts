/**
 * 09 — Perp Trading
 *
 * Place a limit order on Hyperliquid with take-profit and stop-loss,
 * inspect it, then cancel it.
 *
 * ⚠️  This places a REAL order (then immediately cancels it). The
 * limit price is set far from market so it won't fill.
 */

import { createClient, formatUsd, logJson, logSection } from "../src/helpers.js";

async function main() {
  const client = createClient();
  const coin = "BTC";

  // We need a wallet ID for perps operations
  const wallets = await client.account.getWallets();
  const wallet = wallets[0];
  if (!wallet) {
    console.error("No wallet found on your account");
    return;
  }

  // ── Account state ────────────────────────────────────────────────
  logSection("Perps Account");
  const account = await client.perps.getAccount();
  console.log(`  Account Value : ${formatUsd(Number.parseFloat(account.accountValue))}`);
  console.log(`  Withdrawable  : ${formatUsd(Number.parseFloat(account.withdrawable))}`);

  // ── Fees ─────────────────────────────────────────────────────────
  const fees = await client.perps.getFees();
  console.log(`  Maker Rate    : ${fees.makerRate}`);
  console.log(`  Taker Rate    : ${fees.takerRate}`);

  // ── Current market price ─────────────────────────────────────────
  const market = await client.perps.getMarket(coin);
  const markPrice = Number.parseFloat(market.ctx.markPx);
  console.log(`\n  ${coin} Mark Price: ${formatUsd(markPrice)}`);

  // ── Place a limit buy far below market (won't fill) ──────────────
  const limitPx = (markPrice * 0.5).toFixed(0); // 50% below market
  logSection(`Placing Limit Buy: ${coin} @ ${formatUsd(Number.parseFloat(limitPx))}`);

  const orderResp = await client.perps.placeOrder({
    walletId: wallet.walletId,
    coin,
    isBuy: true,
    sz: "0.001",
    limitPx,
    orderType: "limit",
    reduceOnly: false,
    tp: { triggerPx: (markPrice * 1.1).toFixed(0) }, // TP at +10%
    sl: { triggerPx: (markPrice * 0.4).toFixed(0) }, // SL at -20% from limit
  });

  console.log("  Results:");
  for (const r of orderResp.results) {
    console.log(`    Status : ${r.status}  OID : ${r.oid ?? "N/A"}  ${r.error ?? ""}`);
  }

  // ── List open orders ─────────────────────────────────────────────
  logSection("Open Orders");
  const orders = await client.perps.getOrders();
  for (const o of orders) {
    console.log(`  ${o.coin}  ${o.side}  ${o.sz} @ ${o.limitPx}  OID=${o.oid}  ${o.orderType}`);
  }

  // ── Cancel the order we just placed ──────────────────────────────
  const placed = orderResp.results.find((r) => r.oid != null);
  if (placed?.oid) {
    logSection("Cancelling Order");
    const cancelResp = await client.perps.cancelOrder({
      walletId: wallet.walletId,
      coin,
      oid: placed.oid,
    });
    logJson("Cancel Result", cancelResp);
  }

  // ── Positions ────────────────────────────────────────────────────
  logSection("Current Positions");
  const positions = await client.perps.getPositions();
  if (positions.positions.length === 0) {
    console.log("  No open positions");
  }
  for (const p of positions.positions) {
    console.log(`  ${p.coin}  size=${p.szi}  entry=${p.entryPx}  pnl=${p.unrealizedPnl}`);
  }
}

main().catch(console.error);

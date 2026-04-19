/**
 * 01 — Account Info
 *
 * Fetch your account profile, registered wallets, trade settings, and
 * agent-key usage limits. This is the simplest possible example and a
 * good first script to run to verify your API key works.
 */

import { createClient, logJson, logSection } from "../src/helpers.js";

async function main() {
  const client = createClient();

  // ── Profile ──────────────────────────────────────────────────────
  logSection("Account Profile");
  const me = await client.account.getMe();
  console.log(`  User ID : ${me.userId}`);
  console.log(`  Display : ${me.displayName ?? "(not set)"}`);

  // ── Wallets ──────────────────────────────────────────────────────
  logSection("Wallets");
  const wallets = await client.account.getWallets();
  for (const w of wallets) {
    console.log(`  [${w.chain ?? "any"}] ${w.label ?? w.walletId} — ${w.address}`);
  }

  // ── Trade Settings ───────────────────────────────────────────────
  logSection("Trade Settings");
  const settings = await client.account.getSettings();
  logJson("Trade Settings", settings);

  // ── Agent Key Usage ──────────────────────────────────────────────
  logSection("Agent Key Usage & Limits");
  const usage = await client.account.getUsage();
  console.log(`  Key ID : ${usage.keyId}`);
  console.log(`  Scopes : ${usage.scopes.join(", ")}`);
  logJson("Constraints", usage.constraints);
}

main().catch(console.error);

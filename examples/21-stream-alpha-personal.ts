/**
 * 21 — Stream Personal Alpha
 *
 * Subscribe to your personal alpha channel via WebSocket. This delivers
 * raw chat messages (from Discord, Telegram, X) and call reference
 * events routed to your account.
 *
 * Runs for 60 seconds, then disconnects.
 */

import type { AlphaChatMessage, AlphaPersonalEvent } from "@shuriken/sdk-ts";
import { createClient, handleError, logSection } from "../src/helpers.js";

function isChatMessage(event: AlphaPersonalEvent): event is AlphaChatMessage {
  return !("type" in event && event.type === "callReference");
}

async function main() {
  const client = createClient();

  logSection("Streaming Personal Alpha");
  console.log("  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Connected! Listening for 60 seconds...\n");

  let count = 0;

  const formatTime = (ms: number | undefined): string => {
    if (typeof ms !== "number" || !Number.isFinite(ms)) return "unknown";
    return new Date(ms).toISOString();
  };

  const sub = client.ws.subscribe(
    "alpha.personal",
    {},
    (event: AlphaPersonalEvent) => {
      count++;

      if (isChatMessage(event)) {
        const time = formatTime(event.timestamp);
        const author = event.author?.displayName ?? event.author?.username ?? "unknown";
        const tokens = event.tokens.map((t) => t.address.slice(0, 8)).join(", ");

        console.log(`  #${count} [${event.platform}] ${time}`);
        console.log(`    Author  : ${author}`);
        console.log(`    Content : ${event.content.slice(0, 120)}${event.content.length > 120 ? "..." : ""}`);
        if (tokens) console.log(`    Tokens  : ${tokens}`);
        if (event.isEdited) console.log("    (edited)");
        console.log();
      } else {
        // Deprecated call reference event
        console.log(`  #${count} [callReference] ${event.address}`);
        console.log(`    Mentions: ${event.mentionCount}`);
        console.log(`    First   : ${formatTime(event.firstSeenAtMs)}`);
        console.log(`    Last    : ${formatTime(event.lastSeenAtMs)}`);
        console.log();
      }
    },
    (err) => {
      console.error(`  Subscription error: ${err.message} (status ${err.status})`);
    }
  );

  setTimeout(() => {
    console.log(`  Received ${count} alpha events. Disconnecting...`);
    sub.unsubscribe();
    client.ws.disconnect();
  }, 60_000);
}

main().catch(handleError);

/**
 * 23 — Stream Personal Signal Feed
 *
 * Subscribe to your personal signal feed — token signals filtered to
 * your configured feeds and watchlists. Events include token metadata,
 * the latest signal source, and market data at signal time.
 *
 * Runs for 60 seconds, then disconnects.
 */

import type { AlphaPersonalSignalFeedEvent, SignalSource } from "@shuriken/sdk-ts";
import { createClient, formatUsd, handleError, logSection } from "../src/helpers.js";

function formatOrigin(source: SignalSource): string {
  switch (source.sourceType) {
    case "discord": {
      const s = source.source;
      const author = s.authorDisplayName ?? s.authorUsername ?? s.authorId;
      return `discord:${author} guild=${s.guildId} channel=${s.channelId} msg=${s.messageId}`;
    }
    case "telegram": {
      const s = source.source;
      const sender = s.senderDisplayName ?? s.senderUsername ?? s.senderId;
      const topic = s.topicTitle ? ` topic=${s.topicTitle}` : "";
      return `telegram:${sender} chat=${s.chatId}${topic} msg=${s.messageId}`;
    }
    case "x": {
      const s = source.source;
      const author = s.authorDisplayName ?? s.authorUsername ?? s.authorId;
      return `x:${author} tweet=${s.tweetId}`;
    }
    case "trade": {
      const s = source.source;
      return `trade:${s.isBuy ? "buy" : "sell"} $${s.amountUsd} wallet=${s.walletAddress} tx=${s.txSignature}`;
    }
  }
}

async function main() {
  const client = createClient();

  logSection("Streaming Personal Signal Feed");
  console.log("  Connecting to WebSocket...");

  await client.ws.connect();
  console.log("  Connected! Listening for 60 seconds...\n");

  let count = 0;

  const sub = client.ws.subscribe("alpha.signalFeedPersonal", {}, (event: AlphaPersonalSignalFeedEvent) => {
    count++;
    const symbol = event.tokenMeta?.symbol ?? "???";
    const name = event.tokenMeta?.name ?? "Unknown";
    const signal = event.latestSignal;

    console.log(`  #${count} ${symbol} (${name}) on ${event.network}`);
    console.log(`    Token   : ${event.tokenAddress}`);
    if (event.feedId) console.log(`    Feed    : ${event.feedId}`);
    if (signal) {
      const time = new Date(signal.timestampMs).toISOString();
      console.log(`    Signal  : ${signal.source.sourceType} at ${time}`);
      console.log(`    Origin  : ${formatOrigin(signal.source)}`);
      console.log(`    Price   : ${formatUsd(signal.priceUsd)}`);
      console.log(`    MCap    : ${formatUsd(signal.marketcapUsd)}`);
      console.log(`    Liq     : ${formatUsd(signal.liquidityUsd)}`);
    }
    console.log();
  });

  setTimeout(() => {
    console.log(`  Received ${count} personal signal feed events. Disconnecting...`);
    sub.unsubscribe();
    client.ws.disconnect();
  }, 60_000);
}

main().catch(handleError);

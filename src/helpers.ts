import "dotenv/config";
import { createShurikenClient, ShurikenAuthError } from "@shuriken/sdk-ts";

const LABS_URL = "https://app.shuriken.trade/agents";

export function createClient() {
  const apiKey = process.env.SHURIKEN_API_KEY;
  if (!apiKey) {
    console.error("Missing SHURIKEN_API_KEY — copy .env.example to .env and add your key");
    console.error(`Create one at: ${LABS_URL}`);
    process.exit(1);
  }
  return createShurikenClient({
    apiKey,
    ...(process.env.SHURIKEN_API_URL && { apiBaseUrl: process.env.SHURIKEN_API_URL }),
  });
}

export function formatUsd(value: number | string | null | undefined, maxDecimals = 2): string {
  if (value == null) return "N/A";
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) return "N/A";
  return `$${(num || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: maxDecimals })}`;
}

export function formatToken(value: number | string | null | undefined, symbol = ""): string {
  if (value == null) return "N/A";
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) return "N/A";
  const formatted = num.toLocaleString("en-US", { maximumFractionDigits: 6 });
  return symbol ? `${formatted} ${symbol}` : formatted;
}

export function formatPct(value: number | string | null | undefined): string {
  if (value == null) return "N/A";
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) return "N/A";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

export function logSection(title: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("=".repeat(60));
}

export function logJson(label: string, data: unknown) {
  console.log(`\n--- ${label} ---`);
  console.log(JSON.stringify(data, null, 2));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function handleError(err: unknown): void {
  if (err instanceof ShurikenAuthError) {
    console.error("\nAuthentication failed — your API key is missing or invalid.");
    console.error(`Create or rotate your key at: ${LABS_URL}`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
}

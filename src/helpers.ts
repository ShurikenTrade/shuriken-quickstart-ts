import "dotenv/config";
import { createShurikenClient } from "@shuriken/sdk-ts";

export function createClient() {
  const apiKey = process.env.SHURIKEN_API_KEY;
  if (!apiKey) {
    console.error("Missing SHURIKEN_API_KEY — copy .env.example to .env and add your key");
    process.exit(1);
  }
  return createShurikenClient({ apiKey });
}

export function formatUsd(value: number | string | null | undefined): string {
  if (value == null) return "N/A";
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) return "N/A";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

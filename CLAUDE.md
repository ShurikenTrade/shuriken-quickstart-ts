# Shuriken Quickstart TypeScript

Quickstart examples repo for the `@shuriken/sdk-ts` SDK.

## Structure

- `src/helpers.ts` — shared client initialisation and formatters used by all examples
- `examples/` — flat directory of numbered example scripts (01–19)
  - 01–06: basic read-only examples (account, tokens, portfolio, perps markets)
  - 07–09: trading examples that execute writes (swaps, triggers, perp orders)
  - 10–12: WebSocket streaming examples
  - 13–19: advanced composite examples combining multiple SDK features

## Running examples

```bash
cp .env.example .env          # add your API key
npm install
npx tsx examples/01-account-info.ts
```

## Adding a new example

1. Create a new file in `examples/` with the next number prefix
2. Import `createClient` from `../src/helpers.js`
3. Follow the `async function main()` pattern used in all other examples
4. Add a corresponding `example:*` script to `package.json`

## SDK dependency

This repo depends on `@shuriken/sdk-ts` (currently ^0.2.0). The SDK is ESM-only, so this repo is also `"type": "module"`.

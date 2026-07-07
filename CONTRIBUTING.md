# Contributing

## Setup

```bash
pnpm install
pnpm icons        # once, or after changing apps/desktop/app-icon.png
pnpm dev          # desktop  ·  pnpm dev:web for the browser
```

Requirements: Node ≥ 20, pnpm 9, Rust stable, and the platform webview toolchain
(https://tauri.app/start/prerequisites/).

## Golden rules

1. **The UI imports only `@pdfcheap/pdf-engine`.** Never import `pdfjs-dist`,
   Apryse or Foxit from a component. New PDF capability → extend the `PdfEngine`
   interface first, then implement it in each engine.
2. **Gate features by capability.** New tools declare a `capability` in
   `modes.ts` so the free build disables them cleanly.
3. **Rust stays on the system layer** (shell, files, updater, conversion). Don't
   push PDF logic into Rust that belongs in the engine.

## Checks (run before pushing)

```bash
pnpm typecheck && pnpm build          # frontend
cargo fmt --all && cargo clippy -p converter -- -D warnings
```

CI runs the same on every PR; the release workflow builds signed installers on
tags.

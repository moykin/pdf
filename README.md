<div align="center">

# MyFreePDF

**A cross-platform PDF editor for macOS, Windows, Linux and the Web.**
View · Annotate · Edit text & images · Organize · Fill & Sign · Redact · Convert · OCR

One codebase → three desktop installers + a web app.
Rust where it's fast, web where it's beautiful, a swappable PDF engine at the core.

</div>

---

## Why this architecture

A PDF editor's quality lives in its **PDF engine**, not its buttons. So the whole
product is built around one seam — [`@myfreepdf/pdf-engine`](packages/pdf-engine) —
that the entire UI talks to and nothing bypasses. Ship the free build on the
open-source **PDF.js** viewer today; drop in a commercial engine (**Apryse** /
**Foxit**) the day a license lands, and text editing, redaction, forms and OCR
light up **without touching a single component**.

```
 React 19 + Tailwind v4  ──►  @myfreepdf/pdf-engine  ──►  PDF.js  (open source, viewer)
   (one UI, all targets)         (the swappable seam)   └►  Apryse/Foxit (commercial, full)
          │
          ├──► Web            : the browser, directly
          ├──► Desktop        : Tauri 2  (Rust shell, ~10 MB)  →  macOS · Windows · Linux
          └──► Heavy jobs     : services/converter (Rust/axum) →  Office↔PDF, OCR
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full picture and [ROADMAP.md](ROADMAP.md)
for the path to a release build.

## Repository layout

| Path                          | What            | Stack                         |
| ----------------------------- | --------------- | ----------------------------- |
| `apps/desktop`                | The app (UI)    | React 19, TypeScript, Tailwind v4, Vite |
| `apps/desktop/src-tauri`      | Desktop shell   | Rust, Tauri 2                 |
| `packages/pdf-engine`         | Engine seam     | TypeScript (PDF.js + SDK adapter) |
| `services/converter`          | Convert + OCR   | Rust, axum                    |
| `.github/workflows`           | CI + signed release | GitHub Actions            |

## Quick start

```bash
# Prerequisites: Node ≥ 20, pnpm 9, Rust (stable). Desktop also needs the
# platform webview toolchain — see https://tauri.app/start/prerequisites/

pnpm install
pnpm icons          # generate platform icons from apps/desktop/app-icon.png

pnpm dev            # desktop app (Tauri window)  — hot reload
pnpm dev:web        # web app in the browser  (http://localhost:1420)

pnpm build          # build the web bundle + packages
pnpm tauri build    # build signed desktop installers for the current OS
```

## Status

Foundation / scaffold. The **viewer** works end-to-end on all targets (open,
render, thumbnails, zoom, page sync) on the open-source engine. Every editing
tool is wired into the UI and **capability-gated** — visibly disabled until the
commercial engine is configured. This is the intended free-tier behavior and the
integration point for the paid SDK.

## License

Proprietary — see [LICENSE](LICENSE). Not for redistribution.

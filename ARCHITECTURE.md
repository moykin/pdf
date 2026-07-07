# Architecture

## Principle: one seam, many faces

The product is a thin, beautiful UI over a **swappable PDF engine**. The UI never
imports PDF.js, Apryse or Foxit directly — it imports `@pdfcheap/pdf-engine` and
only that. This single indirection is what lets the same code run free (PDF.js
viewer) or commercial (full editing) and web or desktop.

```
┌────────────────────────────────────────────────────────────┐
│  apps/desktop/src  — React 19 + Tailwind v4                 │
│  Toolbar · Thumbnails · Viewer · RightPanel · StatusBar     │
│  state: store.ts (zustand)     capabilities-gated tools     │
└───────────────────────────┬────────────────────────────────┘
                            │  imports ONLY
                            ▼
┌────────────────────────────────────────────────────────────┐
│  packages/pdf-engine  —  PdfEngine / PdfDocument interface  │
│    createEngine(config) picks the implementation:           │
│      • PdfjsEngine   (open source, viewer)                  │
│      • ApryseEngine  (commercial, full)  ← stub today       │
└───────────────────────────┬────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                        ▼
┌──────────────────┐                   ┌────────────────────────┐
│  Browser (Web)   │                   │  Tauri 2 (Rust shell)  │
│  same bundle     │                   │  macOS · Win · Linux   │
└──────────────────┘                   │  read_file_bytes,      │
                                        │  dialog, updater       │
                                        └────────────────────────┘
        Heavy, non-interactive jobs (both targets call out to):
        ┌────────────────────────────────────────────────────┐
        │  services/converter (Rust/axum)                    │
        │  Office↔PDF · PDF→Word/Excel/PPT · OCR             │
        └────────────────────────────────────────────────────┘
```

## Why each choice

| Decision | Reason |
| --- | --- |
| **Web UI (not native Rust GUI)** | Commercial PDF SDKs ship their cross-platform viewer as a **JS/WASM web component**. To reuse one viewer on web *and* desktop, the UI must host that component → it must be web-based. A native Rust GUI (GPUI/Slint) can't target the web and can't host the SDK's web viewer. |
| **Tauri 2 (not Electron)** | ~10 MB vs ~150 MB, lower RAM, faster start, Rust core. Mobile targets later. |
| **Rust on the system layer** | Where it's actually faster: window/file/IPC (Tauri) and the conversion/OCR service (axum). Not the UI — perf there is dominated by the WASM engine, not the view language. |
| **Engine as a package** | The open-source ↔ commercial switch is `createEngine()`. Nothing else in the app knows which engine is running. |
| **`EngineCapabilities`** | The UI reads a capability map to enable/disable tools, so the free build degrades gracefully instead of crashing on unsupported operations. |

## Where performance comes from

Not the UI language — from the engine and how we drive it:

- **GPU rendering** of pages (WebGL/WebGPU) — the engine's job.
- **Virtualization** — render only visible pages (Phase 1 follow-up).
- **HiDPI canvases** — render at `scale × devicePixelRatio` (`PageCanvas`).
- **Off-main-thread** parsing via WASM/worker threads.
- **Tiled re-render** on zoom; stream large files instead of loading whole.

## Data flow: opening a file

1. UI calls `pickPdf()` → native dialog (desktop) or `<input type=file>` (web).
2. Desktop reads bytes via the Rust `read_file_bytes` command (no broad FS scope
   in the webview); web reads via `File.arrayBuffer()`.
3. `store.openBytes()` → `engine.open(bytes)` → `PdfDocument`.
4. `Viewer`/`ThumbnailsSidebar` pull `renderPage(n, { scale })` → `ImageBitmap`
   → painted to a canvas.

## Security

- CSP in `tauri.conf.json` allows `wasm-unsafe-eval` (engine WASM) and blob
  workers (PDF.js), and restricts `connect-src` to localhost + your domain.
- The webview has **no filesystem plugin scope**; disk access is mediated by
  explicit Rust commands.
- Redaction (Phase 3) must remove content, never just draw over it.

# Roadmap — from scaffold to release

Target: a commercial, PDF Expert–class editor on **macOS, Windows, Linux and Web**
from one codebase. The hard requirement — **editing existing PDF text** — means a
commercial engine is on the critical path (see Phase 0).

Legend: ✅ done in this scaffold · 🔜 next · ⏳ later · 💳 needs paid SDK license

---

## Phase 0 — Engine decision (Week 1–2)  🔜 **do this first**

Everything downstream depends on it.

- [ ] Trial **Apryse** (WebViewer) and **Foxit Web SDK** side by side.
- [ ] Test the two hardest features on *your* real PDFs: **edit existing text**
      and **Office↔PDF conversion**. This is where free engines fail.
- [ ] Confirm both a **WASM/Web build** and **desktop support** exist (so one
      viewer serves web + Tauri).
- [ ] Get **redistribution** pricing (the SDK ships inside your installers). 💳
- [ ] Implement `packages/pdf-engine/src/apryse-engine.ts` against the winner.

## Phase 1 — Viewer foundation  ✅ (this scaffold)

- [x] Monorepo: pnpm + Turborepo + Rust workspace.
- [x] Tauri 2 shell (macOS/Windows/Linux) + web target, one UI.
- [x] Engine seam `@pdfcheap/pdf-engine` with PDF.js viewer + commercial stub.
- [x] Open (native dialog / web picker / drag-drop), render (HiDPI), thumbnails,
      zoom, page↔sidebar sync, full-text search scaffolding.
- [x] Capability-gated toolbar for all five modes.
- [x] CI + signed release pipeline + auto-updater wiring.
- [ ] 🔜 Page virtualization (render only visible pages) for 1000-page PDFs.
- [ ] 🔜 Tiled re-render on zoom; keyboard nav; fit-width/fit-page.

## Phase 2 — Annotate + Edit  (≈6 weeks)  💳

- [ ] Highlight / underline / strikeout, ink, shapes, arrows, notes, stamps —
      written back into the PDF via the engine.
- [ ] **Edit existing text** — the flagship feature.
- [ ] Insert / replace images; add & edit links.
- [ ] Undo/redo history; annotation properties (color/opacity/width) persisted.

## Phase 3 — Organize · Forms · Sign · Redact  (≈4 weeks)  💳

- [ ] Organize: merge, split, extract, insert, delete, rotate, drag-reorder in
      the thumbnail grid.
- [ ] AcroForm fill + flatten.
- [ ] Signatures: draw / saved signatures library / place on page.
- [ ] **True redaction** (data removed, not just covered).

## Phase 4 — Convert + OCR  (≈4 weeks)  💳

- [ ] `services/converter`: Office↔PDF, PDF→Word/Excel/PPT/Text/Image.
- [ ] OCR scanned pages → searchable PDF (SDK OCR or Tesseract).
- [ ] Frontend convert UI + progress; queue + cancellation.
- [ ] Deploy the service (container) + `VITE_CONVERTER_URL` wiring.

## Phase 5 — Release hardening  (≈4 weeks)

- [ ] macOS: Developer ID signing + **notarization** + stapling.
- [ ] Windows: EV/OV code signing (Azure Trusted Signing) — kill SmartScreen.
- [ ] Linux: AppImage/deb/rpm; optional Flathub.
- [ ] Auto-update end-to-end (minisign keypair, `latest.json`, endpoints).
- [ ] Crash reporting, telemetry (opt-in), licensing/activation, billing.
- [ ] Accessibility pass, i18n, onboarding, empty/error states.
- [ ] Web app hosting + CSP for the commercial SDK's WASM assets.

## Phase 6 — Stores & growth  (ongoing)

- [ ] Direct downloads (primary) + Mac App Store (sandbox review) + MS Store.
- [ ] Mobile (Tauri 2 mobile / iPad) — the lib/bin split already anticipates it.

---

### Realistic effort

- Sellable MVP (Phases 1–3 on a licensed engine): **~4–6 months**, 2–4 people.
- Full PDF Expert parity: **12+ months** — or license the engine and focus your
  team entirely on product & UX, which is the whole point of the seam.

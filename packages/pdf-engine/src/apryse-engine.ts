/**
 * Commercial engine adapter — Apryse (formerly PDFTron) WebViewer.
 *
 * This is a STUB. It documents exactly where the paid SDK plugs in so that,
 * once a license is procured, wiring it up is a contained, well-understood task
 * and NOTHING in the UI changes. The same shape works for Foxit's Web SDK — the
 * abstraction is deliberately vendor-neutral.
 *
 * Integration checklist (do this when the license lands):
 *   1. `pnpm add @pdftron/webviewer` in apps/desktop.
 *   2. Copy the SDK's static `public/` assets (WASM + workers) per Apryse docs.
 *   3. Set APRYSE_LICENSE_KEY (Vite env, never commit the key).
 *   4. Implement each method below against the WebViewer `Core.Document` /
 *      `Core.annotationManager` / `Core.PDFNet` APIs.
 *   5. Flip the factory default in `index.ts` to prefer this engine when a key
 *      is present.
 */
import {
  type EngineCapabilities,
  type PdfDocument,
  type PdfEngine,
} from './types.js';

const ENGINE = 'apryse';

/** Commercial engine supports the full PDF Expert feature surface. */
const CAPABILITIES: EngineCapabilities = {
  view: true,
  annotate: true,
  editContent: true,
  forms: true,
  sign: true,
  redact: true,
  organize: true,
  ocr: true,
  convert: true,
};

export interface ApryseConfig {
  /** License key from Apryse. Injected via env; never hard-coded. */
  readonly licenseKey: string;
  /** URL/path where the SDK's WASM + worker assets are served. */
  readonly assetPath?: string;
}

export class ApryseEngine implements PdfEngine {
  readonly name = ENGINE;
  readonly capabilities = CAPABILITIES;

  constructor(private readonly config: ApryseConfig) {}

  async open(_data: ArrayBuffer | Uint8Array): Promise<PdfDocument> {
    // TODO(apryse): initialise Core with this.config.licenseKey, load bytes
    // into a Core.Document, and wrap it in a class implementing PdfDocument.
    throw new Error(
      `Apryse engine is not wired up yet. License present: ${Boolean(
        this.config.licenseKey,
      )}. See apryse-engine.ts integration checklist.`,
    );
  }

  async merge(_documents: Uint8Array[]): Promise<Uint8Array> {
    throw new Error('Apryse engine is not wired up yet (merge).');
  }
}

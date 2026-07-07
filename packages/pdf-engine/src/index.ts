/**
 * Public surface of the engine abstraction.
 *
 * The UI imports from here and NOWHERE else. To change the whole app's PDF
 * backend, you change `createEngine` — not a single component.
 */
export * from './types.js';
export { PdfjsEngine } from './pdfjs-engine.js';
export { ApryseEngine, type ApryseConfig } from './apryse-engine.js';

import { ApryseEngine } from './apryse-engine.js';
import { PdfjsEngine } from './pdfjs-engine.js';
import { type PdfEngine } from './types.js';

export interface EngineConfig {
  /** Apryse/Foxit license key. When present, the commercial engine is used. */
  readonly commercialLicenseKey?: string;
  /** Where the commercial SDK's WASM assets live. */
  readonly assetPath?: string;
}

/**
 * Selects the engine at runtime. Default (no license) = open-source PDF.js
 * viewer. With a license = full commercial engine. This single function is the
 * open-source ↔ commercial switch for the entire product.
 */
export function createEngine(config: EngineConfig = {}): PdfEngine {
  if (config.commercialLicenseKey) {
    return new ApryseEngine({
      licenseKey: config.commercialLicenseKey,
      assetPath: config.assetPath,
    });
  }
  return new PdfjsEngine();
}

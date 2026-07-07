/**
 * Engine-agnostic PDF contract.
 *
 * This is the single seam of the whole product. The UI talks ONLY to `PdfEngine`;
 * it never imports PDF.js, Apryse, or Foxit directly. That means the day a
 * commercial SDK license lands, you implement `PdfEngine` once (see
 * `apryse-engine.ts`) and every feature — viewer, annotations, text editing,
 * forms, redaction — lights up without touching a single component.
 */

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

/**
 * What a concrete engine can actually do. The UI reads this to enable/disable
 * tools, so the open-source build degrades gracefully instead of crashing.
 */
export interface EngineCapabilities {
  /** Render + navigate + search. Every engine supports this. */
  readonly view: boolean;
  /** Highlight, ink, shapes, notes, stamps written back into the PDF. */
  readonly annotate: boolean;
  /** Edit existing text/images/links in the content stream. Commercial only. */
  readonly editContent: boolean;
  /** AcroForm fill + flatten. */
  readonly forms: boolean;
  /** Draw/place signatures. */
  readonly sign: boolean;
  /** True redaction (data actually removed, not just covered). Commercial only. */
  readonly redact: boolean;
  /** Merge/split/extract/rotate/reorder pages. */
  readonly organize: boolean;
  /** OCR scanned pages (usually delegated to the backend service). */
  readonly ocr: boolean;
  /** Office <-> PDF conversion (delegated to the backend service). */
  readonly convert: boolean;
}

// ---------------------------------------------------------------------------
// Core value types
// ---------------------------------------------------------------------------

export interface PageSize {
  readonly width: number;
  readonly height: number;
}

export interface RenderOptions {
  /** Device scale. 1 = 72dpi. Use devicePixelRatio * zoom for crisp output. */
  readonly scale: number;
  /** Optional rotation override in degrees (0/90/180/270). */
  readonly rotation?: number;
}

export interface SearchHit {
  readonly pageNumber: number;
  readonly text: string;
  /** Rects in PDF user space, one per matched glyph run. */
  readonly rects: Rect[];
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type AnnotationKind =
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'ink'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'text'
  | 'note'
  | 'stamp';

export interface Annotation {
  readonly id: string;
  readonly kind: AnnotationKind;
  readonly pageNumber: number;
  readonly rect: Rect;
  readonly color?: string;
  readonly opacity?: number;
  readonly strokeWidth?: number;
  readonly contents?: string;
  /** Free-form points for ink/line/arrow, in PDF user space. */
  readonly points?: Array<{ x: number; y: number }>;
}

export interface FormField {
  readonly name: string;
  readonly type: 'text' | 'checkbox' | 'radio' | 'choice' | 'signature';
  readonly pageNumber: number;
  readonly rect: Rect;
  readonly value: string | boolean | null;
  readonly options?: string[];
  readonly readOnly: boolean;
}

export interface SignaturePlacement {
  readonly pageNumber: number;
  readonly rect: Rect;
  /** PNG/SVG data URL of the drawn or saved signature. */
  readonly image: string;
}

export interface RedactionRegion {
  readonly pageNumber: number;
  readonly rect: Rect;
}

export type ConvertTarget = 'docx' | 'xlsx' | 'pptx' | 'txt' | 'png' | 'jpeg';
export type ConvertSource = 'docx' | 'xlsx' | 'pptx' | 'jpeg' | 'png';

// ---------------------------------------------------------------------------
// Document + Engine
// ---------------------------------------------------------------------------

/**
 * A single open PDF. Rendering is pull-based so the UI can virtualize pages.
 */
export interface PdfDocument {
  readonly pageCount: number;
  getPageSize(pageNumber: number): PageSize;

  /** Render one page into an offscreen bitmap the viewer can paint. */
  renderPage(pageNumber: number, options: RenderOptions): Promise<ImageBitmap>;

  /** Full-text search across the document. */
  search(query: string): Promise<SearchHit[]>;

  // --- Annotations -------------------------------------------------------
  listAnnotations(pageNumber: number): Promise<Annotation[]>;
  addAnnotation(annotation: Omit<Annotation, 'id'>): Promise<Annotation>;
  removeAnnotation(id: string): Promise<void>;

  // --- Content editing (commercial engine) -------------------------------
  editText(pageNumber: number, region: Rect, newText: string): Promise<void>;
  insertImage(pageNumber: number, rect: Rect, image: Blob): Promise<void>;
  addLink(pageNumber: number, rect: Rect, target: string): Promise<void>;

  // --- Forms -------------------------------------------------------------
  listFormFields(): Promise<FormField[]>;
  setFormFieldValue(name: string, value: string | boolean): Promise<void>;
  flattenForm(): Promise<void>;

  // --- Signing & redaction ----------------------------------------------
  addSignature(placement: SignaturePlacement): Promise<void>;
  applyRedactions(regions: RedactionRegion[]): Promise<void>;

  // --- Organize ----------------------------------------------------------
  rotatePages(pageNumbers: number[], degrees: 90 | 180 | 270): Promise<void>;
  deletePages(pageNumbers: number[]): Promise<void>;
  reorderPages(order: number[]): Promise<void>;
  extractPages(pageNumbers: number[]): Promise<Uint8Array>;

  /** Serialize the (possibly modified) document back to PDF bytes. */
  save(): Promise<Uint8Array>;
  close(): Promise<void>;
}

export interface PdfEngine {
  readonly name: string;
  readonly capabilities: EngineCapabilities;

  /** Open a document from raw bytes. */
  open(data: ArrayBuffer | Uint8Array): Promise<PdfDocument>;

  /** Merge several PDFs into one (organize view). */
  merge(documents: Uint8Array[]): Promise<Uint8Array>;
}

/** Thrown when a feature is not available in the active engine. */
export class NotSupportedError extends Error {
  constructor(feature: string, engine: string) {
    super(
      `Feature "${feature}" is not supported by the "${engine}" engine. ` +
        `Switch to the commercial engine (Apryse/Foxit) to enable it.`,
    );
    this.name = 'NotSupportedError';
  }
}

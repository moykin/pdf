/**
 * Open-source engine — PDF.js (Apache 2.0).
 *
 * Ships in the free/dev build. It fully covers the *viewer* surface
 * (render, navigate, search, page geometry) and page-level organize via
 * pdf-lib-style operations left as TODO. Editing, redaction, forms writeback
 * and annotations-to-PDF are intentionally NOT implemented here — those are
 * the commercial engine's job. Every unsupported method throws a clear,
 * actionable `NotSupportedError` so the UI can gate the tool instead of
 * silently corrupting a file.
 */
import * as pdfjs from 'pdfjs-dist';

import {
  NotSupportedError,
  type Annotation,
  type EngineCapabilities,
  type FormField,
  type PageSize,
  type PdfDocument,
  type PdfEngine,
  type RedactionRegion,
  type RenderOptions,
  type SearchHit,
  type SignaturePlacement,
} from './types.js';

// Wire up the worker using the bundler-friendly URL pattern (Vite/webpack 5).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

type LoadingTask = ReturnType<typeof pdfjs.getDocument>;
type PdfjsDoc = Awaited<LoadingTask['promise']>;
type PdfjsPage = Awaited<ReturnType<PdfjsDoc['getPage']>>;

const ENGINE = 'pdfjs';

const CAPABILITIES: EngineCapabilities = {
  view: true,
  annotate: false, // overlay-only in this build; not written back to the PDF yet
  editContent: false,
  forms: false,
  sign: false,
  redact: false,
  organize: false,
  ocr: false,
  convert: false,
};

class PdfjsDocument implements PdfDocument {
  private pageCache = new Map<number, PdfjsPage>();

  constructor(private readonly doc: PdfjsDoc) {}

  get pageCount(): number {
    return this.doc.numPages;
  }

  private async page(pageNumber: number): Promise<PdfjsPage> {
    const cached = this.pageCache.get(pageNumber);
    if (cached) return cached;
    const page = await this.doc.getPage(pageNumber);
    this.pageCache.set(pageNumber, page);
    return page;
  }

  getPageSize(_pageNumber: number): PageSize {
    // Synchronous size is not available before the page loads; the viewer
    // reads geometry from renderPage's viewport instead. Return a US-Letter
    // default so layout can reserve space before the bitmap arrives.
    return { width: 612, height: 792 };
  }

  async renderPage(pageNumber: number, options: RenderOptions): Promise<ImageBitmap> {
    const page = await this.page(pageNumber);
    const viewport = page.getViewport({
      scale: options.scale,
      rotation: options.rotation,
    });
    const width = Math.max(1, Math.ceil(viewport.width));
    const height = Math.max(1, Math.ceil(viewport.height));
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to acquire 2D context');
    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;
    return canvas.transferToImageBitmap();
  }

  async search(query: string): Promise<SearchHit[]> {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const hits: SearchHit[] = [];
    for (let n = 1; n <= this.pageCount; n++) {
      const page = await this.page(n);
      const content = await page.getTextContent();
      for (const item of content.items) {
        if (!('str' in item)) continue;
        const str = item.str;
        if (str.toLowerCase().includes(needle)) {
          hits.push({ pageNumber: n, text: str, rects: [] });
        }
      }
    }
    return hits;
  }

  // --- Everything below needs a writer-capable engine --------------------

  async listAnnotations(_pageNumber: number): Promise<Annotation[]> {
    return [];
  }
  addAnnotation(): Promise<Annotation> {
    throw new NotSupportedError('addAnnotation', ENGINE);
  }
  removeAnnotation(): Promise<void> {
    throw new NotSupportedError('removeAnnotation', ENGINE);
  }
  editText(): Promise<void> {
    throw new NotSupportedError('editText', ENGINE);
  }
  insertImage(): Promise<void> {
    throw new NotSupportedError('insertImage', ENGINE);
  }
  addLink(): Promise<void> {
    throw new NotSupportedError('addLink', ENGINE);
  }
  listFormFields(): Promise<FormField[]> {
    throw new NotSupportedError('listFormFields', ENGINE);
  }
  setFormFieldValue(): Promise<void> {
    throw new NotSupportedError('setFormFieldValue', ENGINE);
  }
  flattenForm(): Promise<void> {
    throw new NotSupportedError('flattenForm', ENGINE);
  }
  addSignature(_placement: SignaturePlacement): Promise<void> {
    throw new NotSupportedError('addSignature', ENGINE);
  }
  applyRedactions(_regions: RedactionRegion[]): Promise<void> {
    throw new NotSupportedError('applyRedactions', ENGINE);
  }
  rotatePages(): Promise<void> {
    throw new NotSupportedError('rotatePages', ENGINE);
  }
  deletePages(): Promise<void> {
    throw new NotSupportedError('deletePages', ENGINE);
  }
  reorderPages(): Promise<void> {
    throw new NotSupportedError('reorderPages', ENGINE);
  }
  extractPages(_pageNumbers: number[]): Promise<Uint8Array> {
    throw new NotSupportedError('extractPages', ENGINE);
  }

  async save(): Promise<Uint8Array> {
    // PDF.js is read-only; return the original bytes untouched.
    return this.doc.getData();
  }

  async close(): Promise<void> {
    this.pageCache.clear();
    await this.doc.destroy();
  }
}

export class PdfjsEngine implements PdfEngine {
  readonly name = ENGINE;
  readonly capabilities = CAPABILITIES;

  async open(data: ArrayBuffer | Uint8Array): Promise<PdfDocument> {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const doc = await pdfjs.getDocument({ data: bytes }).promise;
    return new PdfjsDocument(doc);
  }

  merge(_documents: Uint8Array[]): Promise<Uint8Array> {
    throw new NotSupportedError('merge', ENGINE);
  }
}

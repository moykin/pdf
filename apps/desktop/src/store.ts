import { create } from 'zustand';

import {
  createEngine,
  type EngineCapabilities,
  type PdfDocument,
  type PdfEngine,
} from '@pdfcheap/pdf-engine';

import type { EditorMode } from './modes.js';

// One engine for the whole app. Swap open-source ↔ commercial purely by
// whether a license key is present in the environment. Nothing else changes.
const engine: PdfEngine = createEngine({
  commercialLicenseKey: import.meta.env.VITE_APRYSE_LICENSE_KEY,
});

interface EditorState {
  readonly engine: PdfEngine;
  readonly capabilities: EngineCapabilities;
  mode: EditorMode;
  activeTool: string | null;
  doc: PdfDocument | null;
  fileName: string | null;
  pageCount: number;
  currentPage: number;
  zoom: number;
  loading: boolean;
  error: string | null;

  setMode: (mode: EditorMode) => void;
  setTool: (tool: string | null) => void;
  setZoom: (zoom: number) => void;
  zoomBy: (delta: number) => void;
  setCurrentPage: (page: number) => void;
  openBytes: (bytes: Uint8Array, name: string) => Promise<void>;
  closeDoc: () => Promise<void>;
}

export const useEditor = create<EditorState>((set, get) => ({
  engine,
  capabilities: engine.capabilities,
  mode: 'annotate',
  activeTool: null,
  doc: null,
  fileName: null,
  pageCount: 0,
  currentPage: 1,
  zoom: 1,
  loading: false,
  error: null,

  setMode: (mode) => set({ mode, activeTool: null }),
  setTool: (activeTool) => set({ activeTool }),
  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
  zoomBy: (delta) => set({ zoom: clampZoom(get().zoom + delta) }),
  setCurrentPage: (currentPage) => set({ currentPage }),

  openBytes: async (bytes, name) => {
    set({ loading: true, error: null });
    try {
      const previous = get().doc;
      if (previous) await previous.close();
      const doc = await engine.open(bytes);
      set({
        doc,
        fileName: name,
        pageCount: doc.pageCount,
        currentPage: 1,
        loading: false,
      });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  closeDoc: async () => {
    const previous = get().doc;
    if (previous) await previous.close();
    set({ doc: null, fileName: null, pageCount: 0, currentPage: 1, error: null });
  },
}));

function clampZoom(zoom: number): number {
  return Math.min(4, Math.max(0.25, Math.round(zoom * 100) / 100));
}

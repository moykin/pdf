import { create } from 'zustand';

/**
 * Overlay annotations placed on top of the rendered pages (stamps, text notes).
 *
 * This layer is deliberately engine-independent: items live in the app, are
 * painted over the page canvas, and can be placed/moved by the user *or by the
 * AI assistant* — all on the open-source viewer, with no writer engine needed.
 *
 * "Burning" these into the PDF bytes on export is a separate step that needs the
 * commercial engine (see ROADMAP Phase 2); until then they are a live preview
 * layer, which is exactly what the AI assistant manipulates.
 *
 * Coordinates are percentages of the page (0–100), origin top-left, and refer to
 * the CENTER of the item — so they're resolution- and zoom-independent.
 */

interface BaseItem {
  readonly id: string;
  page: number;
  xPct: number;
  yPct: number;
}

export interface StampItem extends BaseItem {
  readonly kind: 'stamp';
  /** Image data URL of the stamp. */
  src: string;
  /** Width as a percentage of page width. */
  widthPct: number;
}

export interface TextItem extends BaseItem {
  readonly kind: 'text';
  text: string;
  color: string;
  /** Font size as a percentage of page height. */
  fontSizePct: number;
}

export type OverlayItem = StampItem | TextItem;

interface OverlayState {
  items: OverlayItem[];
  addStamp: (item: Omit<StampItem, 'id' | 'kind'>) => string;
  addText: (item: Omit<TextItem, 'id' | 'kind'>) => string;
  move: (id: string, xPct: number, yPct: number) => void;
  remove: (id: string) => void;
  removeLast: () => OverlayItem | null;
  clearPage: (page: number) => void;
  clearAll: () => void;
}

const clampPct = (n: number) => Math.min(100, Math.max(0, n));

export const useOverlay = create<OverlayState>((set, get) => ({
  items: [],

  addStamp: (item) => {
    const id = crypto.randomUUID();
    set((s) => ({
      items: [
        ...s.items,
        { ...item, id, kind: 'stamp', xPct: clampPct(item.xPct), yPct: clampPct(item.yPct) },
      ],
    }));
    return id;
  },

  addText: (item) => {
    const id = crypto.randomUUID();
    set((s) => ({
      items: [
        ...s.items,
        { ...item, id, kind: 'text', xPct: clampPct(item.xPct), yPct: clampPct(item.yPct) },
      ],
    }));
    return id;
  },

  move: (id, xPct, yPct) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.id === id ? { ...it, xPct: clampPct(xPct), yPct: clampPct(yPct) } : it,
      ),
    })),

  remove: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),

  removeLast: () => {
    const items = get().items;
    const last = items[items.length - 1] ?? null;
    if (last) set({ items: items.slice(0, -1) });
    return last;
  },

  clearPage: (page) => set((s) => ({ items: s.items.filter((it) => it.page !== page) })),
  clearAll: () => set({ items: [] }),
}));

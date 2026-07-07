import { create } from 'zustand';

/**
 * Built-in rubber-stamp assets, generated as inline SVG data URLs so they scale
 * crisply at any zoom and need no network/asset pipeline. Plus a store for a
 * user-uploaded custom stamp image that the AI can also place.
 */

function stampSvg(label: string, color: string): string {
  const w = 340;
  const h = 150;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <g transform="rotate(-8 ${w / 2} ${h / 2})">
    <rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="18" fill="none" stroke="${color}" stroke-width="7" opacity="0.9"/>
    <rect x="24" y="24" width="${w - 48}" height="${h - 48}" rx="11" fill="none" stroke="${color}" stroke-width="3" opacity="0.9"/>
    <text x="${w / 2}" y="${h / 2}" fill="${color}" opacity="0.92" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="46" letter-spacing="2" text-anchor="middle" dominant-baseline="central">${label}</text>
  </g>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export interface StampPreset {
  readonly id: string;
  readonly label: string;
  readonly src: string;
}

const GREEN = '#0a7d3c';
const RED = '#c0392b';
const BLUE = '#3a6bff';

export const PRESET_STAMPS: readonly StampPreset[] = [
  { id: 'approved', label: 'APPROVED', color: GREEN },
  { id: 'paid', label: 'PAID', color: GREEN },
  { id: 'confidential', label: 'CONFIDENTIAL', color: RED },
  { id: 'rejected', label: 'REJECTED', color: RED },
  { id: 'draft', label: 'DRAFT', color: BLUE },
].map(({ id, label, color }) => ({ id, label, src: stampSvg(label, color) }));

interface StampStore {
  /** Data URL of a user-uploaded custom stamp, or null. */
  customStamp: string | null;
  setCustomStamp: (dataUrl: string | null) => void;
}

export const useStamps = create<StampStore>((set) => ({
  customStamp: null,
  setCustomStamp: (customStamp) => set({ customStamp }),
}));

/** Resolve a stamp id ('approved' | … | 'custom') to its image source. */
export function resolveStampSrc(id: string): string | null {
  if (id === 'custom') return useStamps.getState().customStamp;
  return PRESET_STAMPS.find((s) => s.id === id)?.src ?? null;
}

/** Ids the assistant may place right now (presets + custom if uploaded). */
export function availableStampIds(): string[] {
  const ids = PRESET_STAMPS.map((s) => s.id);
  if (useStamps.getState().customStamp) ids.push('custom');
  return ids;
}

import { useRef, type CSSProperties, type PointerEvent } from 'react';

import { useOverlay } from '../overlay.js';

/**
 * Renders the overlay items (stamps, text) for one page, on top of its canvas.
 *
 * Scale-independence trick: the layer is a CSS container (`container-type: size`,
 * absolutely filling the page), so items size themselves in container units —
 * `cqw` for stamp width, `cqh` for font size — and stay pixel-correct at any
 * zoom without JS measurement. Items are draggable; the layer itself is
 * click-through so it never blocks the page.
 */
export function OverlayLayer({ page }: { page: number }) {
  const items = useOverlay((s) => s.items);
  const move = useOverlay((s) => s.move);
  const remove = useOverlay((s) => s.remove);
  const layerRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);

  const pageItems = items.filter((it) => it.page === page);
  if (pageItems.length === 0) return null;

  function onDown(e: PointerEvent<HTMLDivElement>, id: string) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragId.current = id;
  }
  function onMove(e: PointerEvent<HTMLDivElement>, id: string) {
    if (dragId.current !== id) return;
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    move(id, ((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100);
  }
  function onUp(e: PointerEvent<HTMLDivElement>) {
    dragId.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  return (
    <div
      ref={layerRef}
      className="pointer-events-none absolute inset-0"
      style={{ containerType: 'size' } as CSSProperties}
    >
      {pageItems.map((it) => (
        <div
          key={it.id}
          onPointerDown={(e) => onDown(e, it.id)}
          onPointerMove={(e) => onMove(e, it.id)}
          onPointerUp={onUp}
          className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-move touch-none select-none"
          style={{
            left: `${it.xPct}%`,
            top: `${it.yPct}%`,
            width: it.kind === 'stamp' ? `${it.widthPct}cqw` : undefined,
          }}
        >
          {it.kind === 'stamp' ? (
            <img src={it.src} draggable={false} alt="stamp" className="block w-full" />
          ) : (
            <span
              style={{
                color: it.color,
                fontSize: `${it.fontSizePct}cqh`,
                fontWeight: 600,
                lineHeight: 1.1,
                whiteSpace: 'pre',
              }}
            >
              {it.text}
            </span>
          )}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              remove(it.id);
            }}
            className="absolute -right-2 -top-2 hidden h-5 w-5 place-items-center rounded-full bg-danger text-[11px] font-bold leading-none text-white shadow group-hover:grid"
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

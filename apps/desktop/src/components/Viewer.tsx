import { useEffect, useRef } from 'react';

import { PageCanvas } from './PageCanvas.js';
import { OverlayLayer } from './OverlayLayer.js';
import { EmptyState } from './EmptyState.js';
import { useEditor } from '../store.js';

export function Viewer() {
  const { doc, pageCount, zoom, currentPage, setCurrentPage } = useEditor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Scroll the selected thumbnail's page into view.
  useEffect(() => {
    const el = pageRefs.current.get(currentPage);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage]);

  // Track which page is centered to keep the sidebar/status bar in sync.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !doc) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const n = Number((visible.target as HTMLElement).dataset.page);
          if (n) setCurrentPage(n);
        }
      },
      { root, threshold: [0.25, 0.5, 0.75] },
    );
    for (const el of pageRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [doc, pageCount, setCurrentPage]);

  if (!doc) return <EmptyState />;

  return (
    <main ref={scrollRef} className="min-w-0 flex-1 overflow-auto bg-canvas">
      <div className="mx-auto flex w-fit flex-col items-center gap-6 py-8">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            data-page={n}
            ref={(el) => {
              if (el) pageRefs.current.set(n, el);
              else pageRefs.current.delete(n);
            }}
            className="relative rounded-sm bg-white shadow-2xl shadow-black/40 ring-1 ring-black/30"
          >
            <PageCanvas doc={doc} pageNumber={n} scale={zoom} className="block" />
            <OverlayLayer page={n} />
          </div>
        ))}
      </div>
    </main>
  );
}

import { useEffect, useRef } from 'react';

import type { PdfDocument } from '@myfreepdf/pdf-engine';

interface PageCanvasProps {
  doc: PdfDocument;
  pageNumber: number;
  /** CSS scale (1 = 100%). Rendered at scale × devicePixelRatio for sharpness. */
  scale: number;
  className?: string;
}

/**
 * Renders a single PDF page to a crisp, HiDPI canvas via the engine. Fully
 * engine-agnostic: it only knows about `PdfDocument.renderPage`.
 */
export function PageCanvas({ doc, pageNumber, scale, className }: PageCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const dpr = window.devicePixelRatio || 1;

    void (async () => {
      const bitmap = await doc.renderPage(pageNumber, { scale: scale * dpr });
      if (cancelled) {
        bitmap.close();
        return;
      }
      const canvas = ref.current;
      if (!canvas) {
        bitmap.close();
        return;
      }
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.style.width = `${bitmap.width / dpr}px`;
      canvas.style.height = `${bitmap.height / dpr}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
    })();

    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, scale]);

  return <canvas ref={ref} className={className} />;
}

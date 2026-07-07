import clsx from 'clsx';

import { PageCanvas } from './PageCanvas.js';
import { useEditor } from '../store.js';

export function ThumbnailsSidebar() {
  const { doc, pageCount, currentPage, setCurrentPage } = useEditor();

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-9 items-center px-4 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Pages
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {doc ? (
          <ol className="flex flex-col gap-2">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <li key={n}>
                <button
                  onClick={() => setCurrentPage(n)}
                  className={clsx(
                    'group flex w-full flex-col items-center gap-1.5 rounded-lg p-2 transition',
                    n === currentPage ? 'bg-accent-soft' : 'hover:bg-surface-2',
                  )}
                >
                  <div
                    className={clsx(
                      'overflow-hidden rounded-md bg-white shadow-sm ring-1 transition',
                      n === currentPage ? 'ring-accent' : 'ring-black/20 group-hover:ring-border',
                    )}
                  >
                    <PageCanvas doc={doc} pageNumber={n} scale={0.16} className="block" />
                  </div>
                  <span
                    className={clsx(
                      'text-[11px] tabular-nums',
                      n === currentPage ? 'text-text' : 'text-muted',
                    )}
                  >
                    {n}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <div className="px-1 pt-6 text-center text-xs text-muted">No document open</div>
        )}
      </div>
    </aside>
  );
}

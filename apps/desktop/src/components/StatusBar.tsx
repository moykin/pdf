import { CircleDot, FileText } from 'lucide-react';

import { useEditor } from '../store.js';

export function StatusBar() {
  const { engine, capabilities, fileName, pageCount, currentPage, zoom } = useEditor();
  const commercial = engine.name !== 'pdfjs';
  const enabled = Object.values(capabilities).filter(Boolean).length;
  const total = Object.values(capabilities).length;

  return (
    <footer className="flex h-8 items-center gap-4 border-t border-border bg-surface px-4 text-[11px] text-muted">
      <span className="inline-flex items-center gap-1.5">
        <CircleDot size={12} className={commercial ? 'text-success' : 'text-warning'} />
        <span className="text-subtle">{commercial ? 'Commercial engine' : 'Open-source engine'}</span>
        <span className="text-muted">
          ({engine.name}) · {enabled}/{total} features
        </span>
      </span>

      {fileName && (
        <span className="inline-flex items-center gap-1.5 truncate">
          <FileText size={12} />
          <span className="truncate text-subtle">{fileName}</span>
        </span>
      )}

      <div className="ml-auto flex items-center gap-4 tabular-nums">
        {pageCount > 0 && (
          <span>
            Page {currentPage} / {pageCount}
          </span>
        )}
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </footer>
  );
}

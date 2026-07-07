import { useState } from 'react';
import clsx from 'clsx';
import { FileUp } from 'lucide-react';

import { pickPdf, readDroppedFile } from '../lib/openFile.js';
import { useEditor } from '../store.js';

export function EmptyState() {
  const { openBytes, loading, error } = useEditor();
  const [dragging, setDragging] = useState(false);

  async function handleOpen() {
    const picked = await pickPdf();
    if (picked) await openBytes(picked.bytes, picked.name);
  }

  return (
    <main className="grid min-w-0 flex-1 place-items-center bg-canvas p-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) {
            const picked = await readDroppedFile(file);
            await openBytes(picked.bytes, picked.name);
          }
        }}
        className={clsx(
          'flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border-2 border-dashed px-10 py-16 text-center transition',
          dragging ? 'border-accent bg-accent-soft/40' : 'border-border bg-surface/40',
        )}
      >
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-soft text-accent">
          <FileUp size={30} />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">Open a PDF to get started</h2>
          <p className="text-sm text-muted">Drag &amp; drop a file here, or browse your computer.</p>
        </div>
        <button
          onClick={handleOpen}
          disabled={loading}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? 'Opening…' : 'Choose file'}
        </button>
        {error && <p className="max-w-sm text-xs text-danger">{error}</p>}
      </div>
    </main>
  );
}

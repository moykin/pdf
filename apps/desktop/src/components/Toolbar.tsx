import clsx from 'clsx';
import { Download, FolderOpen, Minus, Plus, Search, Sparkles } from 'lucide-react';

import { MODES, modeById } from '../modes.js';
import { pickPdf } from '../lib/openFile.js';
import { useEditor } from '../store.js';

export function Toolbar() {
  const {
    mode,
    setMode,
    activeTool,
    setTool,
    zoom,
    zoomBy,
    doc,
    capabilities,
    openBytes,
    assistantOpen,
    toggleAssistant,
  } = useEditor();
  const currentMode = modeById(mode);

  async function handleOpen() {
    const picked = await pickPdf();
    if (picked) await openBytes(picked.bytes, picked.name);
  }

  return (
    <header className="flex flex-col border-b border-border bg-surface">
      {/* Row 1 — brand · modes · actions */}
      <div className="flex h-14 items-center gap-3 px-3">
        <div className="flex items-center gap-2 pl-1 pr-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-[13px] font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
            P
          </div>
          <span className="text-sm font-semibold tracking-tight">PDF.cheap</span>
        </div>

        <div className="mx-1 h-6 w-px bg-hairline" />

        <button
          onClick={handleOpen}
          className="no-drag inline-flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-[13px] font-medium text-subtle ring-1 ring-border transition hover:bg-surface-3 hover:text-text"
        >
          <FolderOpen size={15} />
          Open
        </button>

        {/* Segmented mode switcher */}
        <nav className="mx-auto flex items-center gap-1 rounded-xl bg-canvas/60 p-1 ring-1 ring-hairline">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition',
                  active
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-muted hover:bg-surface-2 hover:text-text',
                )}
              >
                <Icon size={15} />
                {m.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <div className="flex items-center rounded-lg bg-surface-2 ring-1 ring-border">
            <button
              onClick={() => zoomBy(-0.1)}
              className="grid h-8 w-8 place-items-center rounded-l-lg text-muted transition hover:bg-surface-3 hover:text-text"
              aria-label="Zoom out"
            >
              <Minus size={15} />
            </button>
            <span className="w-12 text-center text-xs tabular-nums text-subtle">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => zoomBy(0.1)}
              className="grid h-8 w-8 place-items-center rounded-r-lg text-muted transition hover:bg-surface-3 hover:text-text"
              aria-label="Zoom in"
            >
              <Plus size={15} />
            </button>
          </div>

          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-muted ring-1 ring-border transition hover:bg-surface-3 hover:text-text"
            aria-label="Search"
          >
            <Search size={16} />
          </button>

          <button
            onClick={toggleAssistant}
            title="AI Assistant"
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition',
              assistantOpen
                ? 'bg-accent-soft text-text ring-1 ring-accent/40'
                : 'text-subtle ring-1 ring-border hover:bg-surface-3 hover:text-text',
            )}
          >
            <Sparkles size={15} className={assistantOpen ? 'text-accent' : ''} />
            AI
          </button>

          <button
            disabled={!doc}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition hover:brightness-110 disabled:opacity-40"
          >
            <Download size={15} />
            Export
          </button>
        </div>
      </div>

      {/* Row 2 — tools for the active mode */}
      <div className="flex h-12 items-center gap-1 border-t border-hairline px-3">
        {currentMode.tools.map((tool) => {
          const Icon = tool.icon;
          const supported = capabilities[tool.capability];
          const active = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              disabled={!supported}
              onClick={() => setTool(active ? null : tool.id)}
              title={
                supported
                  ? tool.label
                  : `${tool.label} — needs the commercial engine (not in the open-source build)`
              }
              className={clsx(
                'group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition',
                active
                  ? 'bg-accent-soft text-text ring-1 ring-accent/40'
                  : 'text-subtle hover:bg-surface-2',
                !supported && 'cursor-not-allowed opacity-35 hover:bg-transparent',
              )}
            >
              <Icon size={15} />
              {tool.label}
            </button>
          );
        })}
        <span className="ml-auto text-[11px] font-medium uppercase tracking-wider text-muted">
          {currentMode.label}
        </span>
      </div>
    </header>
  );
}

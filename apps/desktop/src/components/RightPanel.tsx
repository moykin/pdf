import { Lock } from 'lucide-react';

import { modeById } from '../modes.js';
import { useEditor } from '../store.js';

const SWATCHES = ['#ffd23f', '#ff5b6e', '#35d0a5', '#5b8cff', '#b06bff', '#1a1a1a'];

export function RightPanel() {
  const { mode, activeTool, capabilities } = useEditor();
  const currentMode = modeById(mode);
  const tool = currentMode.tools.find((t) => t.id === activeTool) ?? null;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex h-9 items-center px-4 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Properties
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
        {!tool ? (
          <p className="pt-4 text-xs leading-relaxed text-muted">
            Select a tool from the <span className="text-subtle">{currentMode.label}</span> toolbar
            to see its options here.
          </p>
        ) : !capabilities[tool.capability] ? (
          <div className="mt-2 space-y-3 rounded-xl border border-border bg-surface-2 p-4">
            <div className="flex items-center gap-2 text-warning">
              <Lock size={15} />
              <span className="text-sm font-medium">Commercial engine required</span>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              <span className="text-subtle">{tool.label}</span> needs the paid PDF engine
              (Apryse/Foxit). The open-source build ships the viewer only. Add a license key to
              unlock it — no UI changes required.
            </p>
          </div>
        ) : (
          <div className="animate-fade-in space-y-5 pt-2">
            <Section title="Color">
              <div className="flex flex-wrap gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    className="h-7 w-7 rounded-full ring-1 ring-white/15 transition hover:scale-110"
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </Section>
            <Section title="Opacity">
              <input type="range" min={0} max={100} defaultValue={100} className="w-full accent-accent" />
            </Section>
            <Section title="Thickness">
              <input type="range" min={1} max={24} defaultValue={4} className="w-full accent-accent" />
            </Section>
          </div>
        )}
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</div>
      {children}
    </div>
  );
}

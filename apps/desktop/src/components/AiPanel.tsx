import { useRef, useState } from 'react';
import { Loader2, Send, Sparkles, Upload, Wrench } from 'lucide-react';

import { runAgent, type ApiMessage } from '../ai/agent.js';
import { useStamps } from '../ai/stamps.js';
import { useEditor } from '../store.js';

type ChatItem =
  | { role: 'user' | 'assistant' | 'error'; text: string }
  | { role: 'tool'; text: string };

const EXAMPLES = [
  'Поставь печать «Оплачено» внизу справа',
  'Отметь документ как Confidential вверху',
  'Убери последнюю печать',
];

export function AiPanel() {
  const doc = useEditor((s) => s.doc);
  const customStamp = useStamps((s) => s.customStamp);
  const setCustomStamp = useStamps((s) => s.setCustomStamp);

  const [chat, setChat] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const apiMessages = useRef<ApiMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  function pushChat(item: ChatItem) {
    setChat((c) => [...c, item]);
    queueMicrotask(() => scrollRef.current?.scrollTo({ top: 1e9 }));
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    pushChat({ role: 'user', text: trimmed });
    apiMessages.current = [...apiMessages.current, { role: 'user', content: trimmed }];
    setBusy(true);
    apiMessages.current = await runAgent(apiMessages.current, {
      onText: (t) => pushChat({ role: 'assistant', text: t }),
      onTool: (name, _input, result) => pushChat({ role: 'tool', text: `${name} → ${result}` }),
      onError: (m) => pushChat({ role: 'error', text: m }),
    });
    setBusy(false);
  }

  async function uploadStamp(file: File) {
    const reader = new FileReader();
    reader.onload = () => setCustomStamp(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-surface">
      <div className="flex h-11 items-center gap-2 border-b border-hairline px-4">
        <Sparkles size={15} className="text-accent" />
        <span className="text-sm font-semibold">AI Assistant</span>
        <label className="no-drag ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted ring-1 ring-border transition hover:bg-surface-2 hover:text-text">
          <Upload size={12} />
          {customStamp ? 'Stamp ✓' : 'Upload stamp'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadStamp(f);
            }}
          />
        </label>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {chat.length === 0 && (
          <div className="space-y-3 px-1 pt-2 text-xs text-muted">
            <p>
              Попроси ИИ поработать с документом — например, поставить печать. Действия появляются
              на странице сразу; печать можно перетащить.
            </p>
            <div className="space-y-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  disabled={!doc}
                  onClick={() => void send(ex)}
                  className="block w-full rounded-lg bg-surface-2 px-3 py-2 text-left text-[12px] text-subtle ring-1 ring-border transition hover:bg-surface-3 disabled:opacity-40"
                >
                  {ex}
                </button>
              ))}
            </div>
            {!doc && <p className="text-warning">Сначала откройте PDF.</p>}
          </div>
        )}

        {chat.map((m, i) => (
          <Bubble key={i} item={m} />
        ))}

        {busy && (
          <div className="flex items-center gap-2 px-1 text-xs text-muted">
            <Loader2 size={13} className="animate-spin" />
            Думаю…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="border-t border-hairline p-2.5"
      >
        <div className="flex items-end gap-2 rounded-xl bg-surface-2 p-1.5 ring-1 ring-border focus-within:ring-accent/50">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder={doc ? 'Что сделать с документом?' : 'Откройте PDF…'}
            disabled={!doc || busy}
            className="max-h-28 flex-1 resize-none bg-transparent px-2 py-1 text-[13px] text-text outline-none placeholder:text-muted disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!doc || busy || !input.trim()}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-white transition hover:brightness-110 disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </aside>
  );
}

function Bubble({ item }: { item: ChatItem }) {
  if (item.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-[13px] text-white">
          {item.text}
        </div>
      </div>
    );
  }
  if (item.role === 'tool') {
    return (
      <div className="flex items-start gap-1.5 px-1 text-[11px] text-muted">
        <Wrench size={12} className="mt-0.5 shrink-0 text-accent" />
        <span className="break-words">{item.text}</span>
      </div>
    );
  }
  if (item.role === 'error') {
    return (
      <div className="rounded-xl bg-danger/10 px-3 py-2 text-[12px] text-danger ring-1 ring-danger/30">
        {item.text}
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-surface-2 px-3 py-2 text-[13px] text-subtle">
        {item.text}
      </div>
    </div>
  );
}
